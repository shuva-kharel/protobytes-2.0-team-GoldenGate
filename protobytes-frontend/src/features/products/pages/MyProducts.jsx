// src/features/product/pages/MyProducts.jsx
import React, { useEffect, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";
import { useNavigate } from "react-router-dom";

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await axiosClient.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete product");
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
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">My Products</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">My Products</h1>
        <div className="text-gray-600">
          <p>You haven’t listed any products yet.</p>
          <button
            onClick={() => navigate("/products/new")}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">My Products</h1>
        <button
          onClick={() => navigate("/products/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => (
          <div key={p._id} className="border p-4 rounded">
            <div className="w-full h-48 mb-2 bg-gray-100 rounded overflow-hidden">
              {p.image?.url ? (
                <img
                  src={p.image.url}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{p.name}</h2>
                <p className="text-sm text-gray-600">{p.category}</p>
                <p className="text-sm mt-1">
                  Borrow:{" "}
                  <span className="font-medium">Rs. {p.borrowPrice}</span>
                  {p.price ? (
                    <>
                      {" "}
                      • Price:{" "}
                      <span className="font-medium">Rs. {p.price}</span>
                    </>
                  ) : null}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {p.location} {p.productAge ? `• ${p.productAge}` : ""}
                </p>
                <p className="text-xs mt-1">
                  Status:{" "}
                  <span
                    className={`px-2 py-0.5 rounded text-white ${
                      p.status === "available" ? "bg-green-600" : "bg-gray-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigate(`/products/${p._id}/edit`)}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => toggleStatus(p)}
                className="bg-indigo-600 text-white px-3 py-1 rounded"
                title="Toggle availability"
              >
                {p.status === "available"
                  ? "Mark Unavailable"
                  : "Mark Available"}
              </button>
              <button
                onClick={() => deleteProduct(p._id)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
