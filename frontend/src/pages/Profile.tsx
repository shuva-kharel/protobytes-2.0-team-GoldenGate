import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Pencil, Trash2, X } from "lucide-react";
import ListingCard from "../components/ListingCard";

import { useAuth } from "../context/AuthContext";
import { productApi, Product } from "../api/productApi";

import type { Listing } from "../data/mockData";

function productToListing(p: Product): Listing {
  return {
    id: p._id,
    title: p.name,
    category: p.category,
    location: p.location,
    price: p.borrowPrice,
    image:
      p.image?.url ||
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop",
    author: p.uploadedBy?.username || "me",
  } as Listing;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, booting } = useAuth();

  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    borrowPrice: "",
    location: "",
    productAge: "",
    description: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const loadMine = async () => {
    try {
      setLoading(true);
      const res = await productApi.mine();
      setMyProducts(res.data?.items || []);
    } catch {
      setMyProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadMine();
  }, [user?._id]);

  const myListings = useMemo(
    () => myProducts.map(productToListing),
    [myProducts],
  );

  if (booting) {
    return <div className="max-w-6xl mx-auto px-4 py-12">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-black mb-2">
          Please login to view your profile
        </h2>
        <button
          onClick={() => navigate("/login")}
          className="btn-primary px-8 py-3"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      category: p.category || "",
      price: String(p.price ?? ""),
      borrowPrice: String(p.borrowPrice ?? ""),
      location: p.location || "",
      productAge: p.productAge || "",
      description: p.description || "",
    });
    setImage(null);
    setErr("");
    setMsg("");
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditing(null);
    setImage(null);
    setErr("");
    setMsg("");
  };

  const updateField =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setErr("");
      setMsg("");
    };

  const submitUpdate = async () => {
    if (!editing) return;

    try {
      setErr("");
      setMsg("");

      // backend blocks if borrowed; we also block in UI
      if (editing.status === "borrowed") {
        setErr("You cannot update a product that is currently borrowed.");
        return;
      }

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("category", form.category);
      fd.append("price", form.price || "0");
      fd.append("borrowPrice", form.borrowPrice);
      fd.append("location", form.location);
      fd.append("productAge", form.productAge);
      fd.append("description", form.description);

      if (image) fd.append("productImage", image);

      await productApi.update(editing._id, fd);

      setMsg("Updated ✅");
      await loadMine();
      setTimeout(closeEdit, 700);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Update failed.");
    }
  };

  const deleteProduct = async (p: Product) => {
    if (p.status === "borrowed") {
      alert("Cannot delete a borrowed product.");
      return;
    }

    const ok = confirm(`Delete "${p.name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await productApi.remove(p._id);
      await loadMine();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Delete failed.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-black mb-6">My Shared Items</h2>

      {loading ? (
        <div className="text-valentine-dark/60">Loading your items…</div>
      ) : myListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {myProducts.map((p) => {
            const listing = productToListing(p);
            const disabled = p.status === "borrowed";

            return (
              <div key={p._id} className="space-y-2">
                <ListingCard listing={listing} />

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    disabled={disabled}
                    className="flex-1 bg-valentine-primary text-white rounded-xl py-2 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>

                  <button
                    onClick={() => deleteProduct(p)}
                    disabled={disabled}
                    className="flex-1 bg-red-600 text-white rounded-xl py-2 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>

                {disabled && (
                  <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl p-2">
                    This product is currently borrowed. Editing/deleting is
                    disabled.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 bg-valentine-accent/5 rounded-[2.5rem] border-2 border-dashed border-valentine-accent/20 text-center">
          <Package className="h-12 w-12 text-valentine-accent/40 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-1">No items shared yet</h3>
          <p className="text-valentine-dark/50 mb-6">
            Start by listing your first item!
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate("/create-product")}
          >
            Share an Item
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && editing && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black">Edit Product</h3>
              <button
                onClick={closeEdit}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <X />
              </button>
            </div>

            {err && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
                {err}
              </div>
            )}
            {msg && (
              <div className="mb-3 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3">
                {msg}
              </div>
            )}

            <div className="grid gap-3">
              <input
                className="w-full px-4 py-3 rounded-xl border"
                value={form.name}
                onChange={updateField("name")}
                placeholder="Name"
              />
              <input
                className="w-full px-4 py-3 rounded-xl border"
                value={form.category}
                onChange={updateField("category")}
                placeholder="Category"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full px-4 py-3 rounded-xl border"
                  value={form.price}
                  onChange={updateField("price")}
                  placeholder="Price (optional)"
                />
                <input
                  className="w-full px-4 py-3 rounded-xl border"
                  value={form.borrowPrice}
                  onChange={updateField("borrowPrice")}
                  placeholder="Borrow price/day"
                />
              </div>
              <input
                className="w-full px-4 py-3 rounded-xl border"
                value={form.location}
                onChange={updateField("location")}
                placeholder="Location"
              />
              <input
                className="w-full px-4 py-3 rounded-xl border"
                value={form.productAge}
                onChange={updateField("productAge")}
                placeholder="Product age (optional)"
              />
              <textarea
                className="w-full px-4 py-3 rounded-xl border"
                rows={4}
                value={form.description}
                onChange={updateField("description")}
                placeholder="Description"
              />

              <div>
                <label className="text-sm font-bold text-gray-700">
                  Replace Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
              </div>

              <button
                onClick={submitUpdate}
                className="btn-primary w-full py-3"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
