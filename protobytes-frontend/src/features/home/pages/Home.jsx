import { useEffect, useMemo, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";
import { useAuth } from "../../auth/authStore";
import { useNavigate } from "react-router-dom";
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
          ✕
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
      // Auth / KYC guards
      if (!user?._id) {
        showToast("warning", "Please login to borrow an item.");
        navigate("/login");
        return;
      }

      // Prefer latest KYC status from /kyc/me; fall back to auth user field.
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
      endDate.setDate(startDate.getDate() + 7); // default borrow 1 week

      await axiosClient.post(`/borrow/${product._id}`, {
        startDate,
        endDate,
        message: `Hi, I want to borrow your ${product.name}`,
      });

      showToast("success", "Borrow request sent! Redirecting to chat…");
      // Redirect to chat page with product context
      setTimeout(() => {
        navigate(`/chat/${product.uploadedBy.user}?productId=${product._id}`);
      }, 700);
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        err?.response?.data?.message ||
          err.message ||
          "Failed to create borrow request",
      );
    }
  };

  // -----------------------------
  // Load products
  // -----------------------------
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/products");

      // Filter out own products
      const filtered = (res.data?.items || []).filter(
        (p) => user?._id !== p?.uploadedBy?.user,
      );

      setProducts(filtered);

      // Compute borrow price domain
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
      // optionally show toast
      // showToast("error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

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

  // Dynamic options
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["", ...Array.from(set)];
  }, [products]);

  const locations = useMemo(() => {
    const set = new Set(products.map((p) => p.location).filter(Boolean));
    return ["", ...Array.from(set)];
  }, [products]);

  // -----------------------------
  // Search & advanced filtering
  // -----------------------------
  useEffect(() => {
    let temp = [...products];

    if (search) {
      const q = search.toLowerCase();
      temp = temp.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }

    if (category) temp = temp.filter((p) => p.category === category);
    if (location) temp = temp.filter((p) => p.location === location);

    // Borrow price range
    temp = temp.filter((p) => {
      const bp = Number(p.borrowPrice ?? 0);
      return bp >= borrowRange[0] && bp <= borrowRange[1];
    });

    setFilteredProducts(temp);
  }, [search, category, location, borrowRange, products]);

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
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

      {/* KYC Modal */}
      <Modal
        open={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        title="Verify your KYC"
        actions={
          <>
            <button
              onClick={() => {
                setKycModalOpen(false);
                // Adjust this route to your actual KYC page
                navigate("/kyc");
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            >
              Go to Verification
            </button>
          </>
        }
      >
        <p>
          To keep borrowing safe for everyone, we require KYC verification.
          Verify once and enjoy seamless borrowing.
        </p>
      </Modal>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-orange-50" />
        <div className="absolute -top-20 -right-20 h-72 w-72 bg-rose-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 bg-orange-100 rounded-full blur-3xl opacity-60" />

        <div className="relative max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-sm">
            <span className="font-display brand-gradient">ऐँचोपैंचो</span>
          </h1>
          <p className="mt-3 text-rose-700">
            Borrow &amp; lend products with verified accounts — safely and
            beautifully.
          </p>

          {/* Search + Quick Filters */}
          <div className="mt-8 max-w-3xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

            {/* Borrow Price Range Summary */}
            <div className="flex items-center justify-between gap-3 border p-3 rounded-lg w-full">
              <div className="text-xs text-gray-500 whitespace-nowrap">
                Borrow Price (Rs)
              </div>
              <div className="text-sm font-semibold whitespace-nowrap">
                {borrowRange[0]} – {borrowRange[1]}
              </div>
            </div>
          </div>

          {/* Borrow Price Range Controls */}
          <div className="max-w-3xl mx-auto mt-3 grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
            <button
              onClick={() => {
                setSearch("");
                setCategory("");
                setLocation("");
                setBorrowRange([minBorrow, maxBorrow]);
              }}
              className="text-sm text-rose-700 hover:text-rose-900"
            >
              Reset filters
            </button>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center border rounded-xl p-8 bg-white">
              <p className="text-gray-600">No products match your filters.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <h3 className="font-semibold text-gray-900 truncate">
                    {p.name}
                  </h3>
                  <div className="mt-1 text-sm text-gray-600 flex items-center justify-between">
                    <span>Location: {p.location || "—"}</span>
                    {p.price ? <span>Price: Rs {p.price}</span> : <span />}
                  </div>
                  <div className="mt-1 text-sm">
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

          <p className="mt-8 text-center text-rose-700">
            Borrow &amp; lend products with verified accounts — safely and
            beautifully.
          </p>
        </div>
      </section>
    </>
  );
}
