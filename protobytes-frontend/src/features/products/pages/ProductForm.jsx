// src/features/product/components/ProductForm.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function ProductForm({
  mode = "create", // "create" | "edit"
  initialData = null, // product object when edit
  onSubmit, // (formData: FormData) => Promise<void>
  submitting = false,
}) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    borrowPrice: "",
    location: "",
    productAge: "",
    description: "",
    productImage: null,
    status: "available", // only used in edit mode
  });

  const fileInputRef = useRef(null);

  // When in edit mode, hydrate fields
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        name: initialData.name || "",
        category: initialData.category || "",
        price: initialData.price ?? "",
        borrowPrice: initialData.borrowPrice ?? "",
        location: initialData.location || "",
        productAge: initialData.productAge || "",
        description: initialData.description || "",
        productImage: null, // no file by default; keeps existing image
        status: initialData.status || "available",
      });
    }
  }, [mode, initialData]);

  const currentImageUrl = useMemo(
    () => (mode === "edit" ? initialData?.image?.url || "" : ""),
    [mode, initialData],
  );

  const [preview, setPreview] = useState("");

  // Update preview when selecting a file
  useEffect(() => {
    if (!form.productImage) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(form.productImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.productImage]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setForm((prev) => ({ ...prev, productImage: file || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    // Required aligned with backend
    const payload = {
      name: form.name,
      category: form.category,
      price: form.price,
      borrowPrice: form.borrowPrice,
      location: form.location,
      productAge: form.productAge,
      description: form.description,
    };

    if (mode === "edit") {
      payload.status = form.status; // backend accepts status field
    }

    Object.entries(payload).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "") data.append(k, v);
    });

    // Only append productImage if a new one is chosen
    if (form.productImage instanceof File) {
      data.append("productImage", form.productImage);
    }

    await onSubmit(data);
  };

  const disabled = submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Preview */}
      {(preview || currentImageUrl) && (
        <div className="w-full">
          <p className="text-sm text-gray-600 mb-1">Current image</p>
          <img
            src={preview || currentImageUrl}
            alt="Product"
            className="w-full max-h-56 object-cover rounded border"
          />
        </div>
      )}

      <input
        type="text"
        placeholder="Product Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        className="w-full border rounded px-3 py-2"
        disabled={disabled}
      />

      <input
        type="text"
        placeholder="Category"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        required
        className="w-full border rounded px-3 py-2"
        disabled={disabled}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="number"
          placeholder="Price (optional)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full border rounded px-3 py-2"
          disabled={disabled}
        />
        <input
          type="number"
          placeholder="Borrow Price"
          value={form.borrowPrice}
          onChange={(e) => setForm({ ...form, borrowPrice: e.target.value })}
          required
          className="w-full border rounded px-3 py-2"
          disabled={disabled}
        />
      </div>

      <input
        type="text"
        placeholder="Location"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
        required
        className="w-full border rounded px-3 py-2"
        disabled={disabled}
      />

      <input
        type="text"
        placeholder="Product Age (e.g., 1 year)"
        value={form.productAge}
        onChange={(e) => setForm({ ...form, productAge: e.target.value })}
        className="w-full border rounded px-3 py-2"
        disabled={disabled}
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border rounded px-3 py-2 min-h-28"
        disabled={disabled}
      />

      {/* Only show status on edit */}
      {mode === "edit" && (
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            disabled={disabled}
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={disabled}
        />
        {form.productImage && (
          <button
            type="button"
            onClick={() => {
              setForm((prev) => ({ ...prev, productImage: null }));
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-sm text-gray-700 underline"
            disabled={disabled}
          >
            Remove selected
          </button>
        )}
      </div>

      <button
        type="submit"
        className={`bg-blue-600 text-white px-4 py-2 rounded ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
        disabled={disabled}
      >
        {submitting
          ? mode === "edit"
            ? "Saving..."
            : "Creating..."
          : mode === "edit"
            ? "Save Changes"
            : "Create"}
      </button>
    </form>
  );
}
