// src/features/product/pages/MyProducts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";
import { useNavigate } from "react-router-dom";

function SkeletonCard() {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="h-40 bg-rose-50 rounded mb-3 animate-pulse" />
      <div className="h-4 bg-rose-50 rounded w-2/3 mb-2 animate-pulse" />
      <div className="h-4 bg-rose-50 rounded w-1/3 animate-pulse" />
      <div className="mt-3 h-8 bg-rose-50 rounded animate-pulse" />
    </div>
  );
}

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("newest");
  const navigate = useNavigate();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/products/mine/list");
      setProducts(res.data.items || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    if (q) {
      const qq = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(qq) ||
          p.category?.toLowerCase().includes(qq) ||
          p.location?.toLowerCase().includes(qq),
      );
    }

    if (statusFilter) {
      list = list.filter((p) => p.status === statusFilter);
    }

    switch (sortKey) {
      case "priceLow":
        list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case "borrowLow":
        list.sort(
          (a, b) => (a.borrowPrice ?? Infinity) - (b.borrowPrice ?? Infinity),
        );
        break;
      case "nameAZ":
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "newest":
      default:
        // If you have createdAt, sort by that; else leave as-is
        list.sort((a, b) => {
          const aa = new Date(a.createdAt || 0).getTime();
          const bb = new Date(b.createdAt || 0).getTime();
          return bb - aa;
        });
    }
    return list;
  }, [products, q, statusFilter, sortKey]);

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      // Optimistic update
      const prev = products;
      setProducts((p) => p.filter((x) => x._id !== id));
      await axiosClient.delete(`/products/${id}`);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete product");
      // Reload to be safe
      loadProducts();
    }
  };

  const toggleStatus = async (p) => {
    const next = p.status === "available" ? "unavailable" : "available";
    try {
      // Optimistic UI
      setProducts((prev) =>
        prev.map((it) => (it._id === p._id ? { ...it, status: next } : it)),
      );
      const fd = new FormData();
      fd.append("status", next);
      await axiosClient.put(`/products/${p._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update status");
      // revert
      setProducts((prev) =>
        prev.map((it) => (it._id === p._id ? { ...it, status: p.status } : it)),
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold font-display brand-gradient">
            My Products
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your listings here.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-extrabold font-display brand-gradient">
          My Products
        </h1>
        <div className="mt-6 border rounded-2xl p-8 bg-white shadow-sm">
          <p className="text-gray-600">You haven’t listed any products yet.</p>
          <button
            onClick={() => navigate("/products/new")}
            className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700"
          >
            Create Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold font-display brand-gradient">
            My Products
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Edit, toggle availability, or delete items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/products/new")}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700"
          >
            New Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, category, location…"
          className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rose-200"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rose-200"
        >
          <option value="newest">Newest</option>
          <option value="nameAZ">Name (A–Z)</option>
          <option value="priceLow">Sale Price (Low → High)</option>
          <option value="borrowLow">Borrow Price (Low → High)</option>
        </select>
        <button
          onClick={() => {
            setQ("");
            setStatusFilter("");
            setSortKey("newest");
          }}
          className="border p-3 rounded-lg w-full hover:bg-rose-50"
        >
          Reset
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <div
            key={p._id}
            className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition hover:-translate-y-0.5"
          >
            {p.image?.url ? (
              <div className="relative">
                <img
                  src={p.image.url}
                  alt={p.name}
                  className="w-full h-44 object-cover"
                />
                <span
                  className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full border shadow-sm ${
                    p.status === "available"
                      ? "bg-white/90 text-green-700 border-green-200"
                      : "bg-white/90 text-gray-600 border-gray-200"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ) : (
              <div className="w-full h-44 bg-rose-50 flex items-center justify-center text-rose-400">
                No Image
              </div>
            )}

            <div className="p-4">
              <h2 className="font-semibold text-gray-900 truncate">{p.name}</h2>
              <p className="text-sm text-gray-600">{p.category || "—"}</p>

              <div className="mt-2 text-sm flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
                  Borrow: <strong>Rs {p.borrowPrice ?? "N/A"}</strong>
                </span>
                {p.price ? (
                  <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-2 py-0.5 rounded-full border">
                    Price: <strong>Rs {p.price}</strong>
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-gray-500 mt-1">
                {p.location || "—"} {p.productAge ? `• ${p.productAge}` : ""}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => navigate(`/products/${p._id}/edit`)}
                  className="text-center px-3 py-2 rounded-lg border hover:bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Edit
                </button>

                <button
                  onClick={() => toggleStatus(p)}
                  className="text-center px-1 py-2 rounded-lg border hover:bg-indigo-50 text-indigo-700 border-indigo-200"
                  title="Toggle availability"
                >
                  {p.status === "available"
                    ? "Make Unavailable"
                    : "Make Available"}
                </button>

                <button
                  onClick={() => deleteProduct(p._id)}
                  className="text-center px-3 py-2 rounded-lg border hover:bg-rose-50 text-rose-700 border-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer help */}
      <p className="mt-8 text-center text-gray-500 text-sm">
        Tip: Better photos & detailed descriptions increase borrow requests.
      </p>
    </div>
  );
}
