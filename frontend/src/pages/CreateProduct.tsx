import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../api/productApi";
import { useAuth } from "../context/AuthContext";
import useKycStatus from "../hooks/useKycStatus";

const CreateProduct: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isApproved } = useKycStatus();

  const [form, setForm] = useState({
    name: "",
    category: "Electronics",
    price: "",
    borrowPrice: "",
    location: "",
    productAge: "",
    description: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const canCreate = user && user.isEmailVerified && isApproved;

  const update =
    (key: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setErr("");
      setMsg("");
    };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!canCreate) {
      setErr(
        "You must verify email and complete KYC before creating products.",
      );
      return;
    }

    if (!form.name || !form.category || !form.borrowPrice || !form.location) {
      setErr("Name, category, borrow price and location are required.");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("category", form.category);
      fd.append("price", form.price || "0");
      fd.append("borrowPrice", form.borrowPrice);
      fd.append("location", form.location);
      fd.append("productAge", form.productAge);
      fd.append("description", form.description);

      if (image) fd.append("productImage", image);

      await productApi.create(fd);

      setMsg("Product published successfully 💘");
      setTimeout(() => navigate("/"), 800);
    } catch (error: any) {
      setErr(error?.response?.data?.message || "Failed to publish product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="glass-card rounded-[2.5rem] p-10 border-none">
        <h1 className="text-3xl font-extrabold mb-2">Share an Item</h1>
        <p className="text-valentine-dark/60 mb-8">
          Publish a product so others can borrow it.
        </p>

        {!canCreate && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl px-4 py-3 text-sm font-semibold">
            Email verification + KYC approval required to publish products.
          </div>
        )}

        {err && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">
            {err}
          </div>
        )}

        {msg && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm font-semibold">
            {msg}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          <input
            className="w-full px-5 py-4 rounded-2xl bg-white/50 ring-1 ring-valentine-accent/30"
            placeholder="Product Name (e.g., Canon Camera)"
            value={form.name}
            onChange={update("name")}
          />

          <select
            value={form.category}
            onChange={update("category")}
            className="w-full px-5 py-4 rounded-2xl bg-white/50 ring-1 ring-valentine-accent/30"
          >
            <option>Electronics</option>
            <option>Accessories</option>
            <option>Music</option>
            <option>Home</option>
            <option>Tools</option>
            <option>Outdoor</option>
            <option>Others</option>
          </select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="w-full px-5 py-4 rounded-2xl bg-white/50 ring-1 ring-valentine-accent/30"
              placeholder="Product Price (optional)"
              value={form.price}
              onChange={update("price")}
            />
            <input
              className="w-full px-5 py-4 rounded-2xl bg-white/50 ring-1 ring-valentine-accent/30"
              placeholder="Borrow Price per day (required)"
              value={form.borrowPrice}
              onChange={update("borrowPrice")}
              required
            />
          </div>

          <input
            className="w-full px-5 py-4 rounded-2xl bg-white/50 ring-1 ring-valentine-accent/30"
            placeholder="Location (e.g., Kathmandu)"
            value={form.location}
            onChange={update("location")}
            required
          />

          <input
            className="w-full px-5 py-4 rounded-2xl bg-white/50 ring-1 ring-valentine-accent/30"
            placeholder="How old is the product? (e.g., 1 year)"
            value={form.productAge}
            onChange={update("productAge")}
          />

          <textarea
            className="w-full px-5 py-4 rounded-2xl bg-white/50 ring-1 ring-valentine-accent/30"
            rows={4}
            placeholder="Description"
            value={form.description}
            onChange={update("description")}
          />

          {/* image from phone */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-valentine-dark/70">
              Product Image
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="block"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !canCreate}
            className="btn-primary w-full py-4 text-lg disabled:opacity-60"
          >
            {loading ? "Publishing..." : "Publish Product 💖"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
