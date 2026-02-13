import { useCallback, useEffect, useMemo, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";
import { useAuth } from "../../auth/authStore";
import { Link, useNavigate } from "react-router-dom";
import { getMyKyc } from "../../../api/kycApi";

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}

/** Lightweight Toast */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const { type = "info", message = "" } = toast;
  const color =
    type === "success"
      ? "bg-emerald-600"
      : type === "error"
        ? "bg-rose-600"
        : type === "warning"
          ? "bg-amber-600"
          : "bg-slate-700";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
      <div
        className={`${color} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}
      >
        <span className="text-sm">{message}</span>
        <button
          className="text-white/80 hover:text-white text-xs"
          onClick={onClose}
        >
          x
        </button>
      </div>
    </div>
  );
}

/** Simple Modal */
function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-rose-100 p-5">
        {title && (
          <h3 className="text-lg font-semibold mb-2 text-rose-700">{title}</h3>
        )}
        <div className="text-sm text-gray-700 space-y-3">{children}</div>
        <div className="mt-4 flex items-center justify-end gap-2">
          {actions}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [minBorrow, setMinBorrow] = useState(0);
  const [maxBorrow, setMaxBorrow] = useState(0);
  const [borrowRange, setBorrowRange] = useState([0, 0]);

  const [loading, setLoading] = useState(false);

  // UX
  const [toast, setToast] = useState(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // -----------------------------
  // Borrow a product
  // -----------------------------
  const handleBorrow = async (product) => {
    try {
      if (!user?._id) {
        showToast("warning", "Please login to borrow an item.");
        navigate("/login");
        return;
      }

      let currentKycStatus = normalizeStatus(kycStatus || user?.kycStatus);
      if (!currentKycStatus) {
        try {
          const kycRes = await getMyKyc();
          currentKycStatus = normalizeStatus(kycRes?.data?.kyc?.status);
          setKycStatus(currentKycStatus || null);
        } catch {
          // keep fallback behavior if KYC fetch fails
        }
      }

      if (currentKycStatus !== "approved") {
        showToast("warning", "KYC not verified. Please verify to proceed.");
        setKycModalOpen(true);
        return;
      }

      if (!product?._id) throw new Error("Product ID missing");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);

      await axiosClient.post(`/borrow/${product._id}`, {
        startDate,
        endDate,
        message: `Hi, I want to borrow your ${product.name}`,
      });

      showToast("success", "Borrow request sent! Redirecting to chat...");
      setTimeout(() => {
        navigate(`/chat/${product.uploadedBy.user}?productId=${product._id}`);
      }, 700);
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.message || "";
      const ownerId = product?.uploadedBy?.user;

      if (
        err?.response?.status === 400 &&
        /already have a pending request/i.test(apiMessage)
      ) {
        showToast("info", "You already requested this item. Opening chat...");
        if (ownerId) {
          setTimeout(() => {
            navigate(`/chat/${ownerId}?productId=${product._id}`);
          }, 500);
        }
        return;
      }

      if (
        err?.response?.status === 400 &&
        /Product not available/i.test(apiMessage)
      ) {
        showToast("warning", "This product is no longer available to borrow.");
        return;
      }

      showToast(
        "error",
        apiMessage || err.message || "Failed to create borrow request"
      );
    }
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/products");

      const filtered = (res.data?.items || []).filter(
        (p) => user?._id !== p?.uploadedBy?.user
      );

      setProducts(filtered);

      const borrowPrices = filtered
        .map((p) => Number(p.borrowPrice ?? 0))
        .filter((n) => !isNaN(n));
      const min = borrowPrices.length ? Math.min(...borrowPrices) : 0;
      const max = borrowPrices.length ? Math.max(...borrowPrices) : 0;
      setMinBorrow(min);
      setMaxBorrow(max);
      setBorrowRange([min, max]);

      setFilteredProducts(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    let active = true;
    if (!user?._id) {
      setKycStatus(null);
      return;
    }

    (async () => {
      try {
        const res = await getMyKyc();
        const status = normalizeStatus(res?.data?.kyc?.status);
        if (active) setKycStatus(status || null);
      } catch {
        if (active) setKycStatus(normalizeStatus(user?.kycStatus) || null);
      }
    })();

    return () => {
      active = false;
    };
  }, [user?._id, user?.kycStatus]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["", ...Array.from(set)];
  }, [products]);

  const locations = useMemo(() => {
    const set = new Set(products.map((p) => p.location).filter(Boolean));
    return ["", ...Array.from(set)];
  }, [products]);

  const topCategories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (!p.category) return;
      map.set(p.category, (map.get(p.category) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [products]);

  const stats = useMemo(() => {
    const count = products.length;
    const categoriesCount = categories.length > 0 ? categories.length - 1 : 0;
    const locationsCount = locations.length > 0 ? locations.length - 1 : 0;
    const avgBorrow =
      count > 0
        ? Math.round(
            products.reduce((acc, p) => acc + Number(p.borrowPrice || 0), 0) /
              count
          )
        : 0;
    return { count, categoriesCount, locationsCount, avgBorrow };
  }, [products, categories, locations]);

  useEffect(() => {
    let temp = [...products];

    if (search) {
      const q = search.toLowerCase();
      temp = temp.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (category) temp = temp.filter((p) => p.category === category);
    if (location) temp = temp.filter((p) => p.location === location);

    temp = temp.filter((p) => {
      const bp = Number(p.borrowPrice ?? 0);
      return bp >= borrowRange[0] && bp <= borrowRange[1];
    });

    setFilteredProducts(temp);
  }, [search, category, location, borrowRange, products]);

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-rose-100/50 rounded w-1/3" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border rounded p-4">
                  <div className="h-40 bg-rose-50 rounded mb-2" />
                  <div className="h-4 bg-rose-50 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-rose-50 rounded w-1/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Modal
        open={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        title="Verify your KYC"
        actions={
          <button
            onClick={() => {
              setKycModalOpen(false);
              navigate("/kyc");
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
          >
            Go to Verification
          </button>
        }
      >
        <p>
          To keep borrowing safe for everyone, we require KYC verification.
          Verify once and enjoy seamless borrowing.
        </p>
      </Modal>

      <section className="relative overflow-hidden rounded-3xl border border-rose-100 bg-white/85 p-6 md:p-8 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-orange-50" />
        <div className="absolute -top-20 -right-20 h-72 w-72 bg-rose-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 bg-orange-100 rounded-full blur-3xl opacity-60" />

        <div className="relative grid lg:grid-cols-[1.7fr_1fr] gap-5">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-sm">
              <span className="font-display brand-gradient">Home Marketplace</span>
            </h1>
            <p className="mt-2 text-rose-700 text-sm md:text-base">
              Discover verified listings, filter quickly, and start borrowing in minutes.
            </p>

            <div className="mt-5 grid sm:grid-cols-2 xl:grid-cols-4 gap-2 text-sm">
              <div className="rounded-lg border bg-white/90 p-3">
                <p className="text-xs text-slate-500">Available products</p>
                <p className="text-lg font-semibold">{stats.count}</p>
              </div>
              <div className="rounded-lg border bg-white/90 p-3">
                <p className="text-xs text-slate-500">Categories</p>
                <p className="text-lg font-semibold">{stats.categoriesCount}</p>
              </div>
              <div className="rounded-lg border bg-white/90 p-3">
                <p className="text-xs text-slate-500">Locations</p>
                <p className="text-lg font-semibold">{stats.locationsCount}</p>
              </div>
              <div className="rounded-lg border bg-white/90 p-3">
                <p className="text-xs text-slate-500">Avg borrow price</p>
                <p className="text-lg font-semibold">Rs {stats.avgBorrow}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-xl border bg-white/90 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Top categories</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {topCategories.length === 0 && (
                <p className="text-xs text-slate-500">No category data yet.</p>
              )}
              {topCategories.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className="inline-flex items-center gap-1 rounded-full border bg-rose-50 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-100"
                >
                  {name}
                  <span className="text-rose-500">({count})</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Tip: click a category chip to filter instantly.
            </p>
          </aside>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-rose-100 bg-white p-4 md:p-5 shadow-sm">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            <option value="">All Categories</option>
            {categories.slice(1).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            <option value="">All Locations</option>
            {locations.slice(1).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between gap-3 border p-3 rounded-lg w-full">
            <div className="text-xs text-gray-500 whitespace-nowrap">Borrow Price (Rs)</div>
            <div className="text-sm font-semibold whitespace-nowrap">
              {borrowRange[0]} - {borrowRange[1]}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mt-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-14">Min</label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              min={minBorrow}
              max={borrowRange[1]}
              value={borrowRange[0]}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBorrowRange([
                  Math.max(minBorrow, Math.min(v, borrowRange[1])),
                  borrowRange[1],
                ]);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-14">Max</label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              min={borrowRange[0]}
              max={maxBorrow}
              value={borrowRange[1]}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBorrowRange([
                  borrowRange[0],
                  Math.min(maxBorrow, Math.max(v, borrowRange[0])),
                ]);
              }}
            />
          </div>

          <button
            onClick={() => {
              setSearch("");
              setCategory("");
              setLocation("");
              setBorrowRange([minBorrow, maxBorrow]);
            }}
            className="text-sm text-rose-700 hover:text-rose-900 justify-self-start sm:justify-self-end"
          >
            Reset filters
          </button>
        </div>
      </section>

      <section className="py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
          <p className="text-sm text-slate-500">Showing {filteredProducts.length} results</p>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center border rounded-xl p-10 bg-white">
            <p className="text-gray-600">No products match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("");
                setLocation("");
                setBorrowRange([minBorrow, maxBorrow]);
              }}
              className="mt-3 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p._id}
              className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition hover:-translate-y-0.5"
            >
              {p.image?.url ? (
                <div className="relative">
                  <img
                    src={p.image.url}
                    className="w-full h-48 object-cover"
                    alt={p.name}
                  />
                  {p.category && (
                    <span className="absolute top-2 left-2 text-xs bg-white/90 px-2 py-0.5 rounded-full border shadow-sm">
                      {p.category}
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 bg-rose-50 flex items-center justify-center text-rose-400">
                  No Image
                </div>
              )}

              <div className="p-4 text-left">
                <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 min-h-[30px]">
                  {p.description || "No description provided."}
                </p>

                <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
                  <span>Location: {p.location || "-"}</span>
                  {p.price ? <span>Price: Rs {p.price}</span> : <span />}
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Owner:{" "}
                  <Link
                    to={`/user/${p?.uploadedBy?.user}`}
                    className="text-rose-700 hover:underline"
                  >
                    @{p?.uploadedBy?.username || "user"}
                  </Link>
                </div>
                <div className="mt-2 text-sm">
                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
                    Borrow: <strong>Rs {p.borrowPrice ?? "N/A"}</strong>
                  </span>
                </div>

                <button
                  className="mt-3 w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  onClick={() => handleBorrow(p)}
                >
                  Borrow
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
