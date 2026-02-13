import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

/**
 * ProductForm (Polished)
 * Props:
 *  - mode: "create" | "edit"
 *  - initialData: product object when editing
 *  - onSubmit: (FormData) => Promise<void>
 *  - submitting: boolean
 *  - categories?: string[] (optional; if provided, shows a select)
 *  - locations?: string[] (optional; if provided, shows a select)
 */
export default function ProductForm({
  mode = "create",
  initialData = null,
  onSubmit,
  submitting = false,
  categories = [],
  locations = [],
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

  const [preview, setPreview] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Hydrate on edit
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
        productImage: null, // selecting new file will replace
        status: initialData.status || "available",
      });
    }
  }, [mode, initialData]);

  const currentImageUrl = useMemo(
    () => (mode === "edit" ? initialData?.image?.url || "" : ""),
    [mode, initialData],
  );

  // Preview management
  useEffect(() => {
    if (!form.productImage) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(form.productImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.productImage]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    // Basic guard: images only
    if (!file.type.startsWith("image/")) return;
    setForm((prev) => ({ ...prev, productImage: file }));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: form.price,
      borrowPrice: form.borrowPrice,
      location: form.location,
      productAge: form.productAge,
      description: form.description.trim(),
    };

    if (mode === "edit") {
      payload.status = form.status;
    }

    Object.entries(payload).forEach(([k, v]) => {
      if (v !== null && v !== undefined && `${v}` !== "") data.append(k, v);
    });

    if (form.productImage instanceof File) {
      data.append("productImage", form.productImage);
    }

    await onSubmit(data);
  };

  const disabled = submitting;

  const charCount = form.description?.length || 0;
  const maxChars = 600;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card */}
      <div className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === "edit" ? "Edit Product" : "Create Product"}
              </h2>
              <p className="text-sm text-gray-600">
                Provide accurate details to increase trust and visibility.
              </p>
            </div>

            {mode === "edit" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status</span>
                <select
                  className="border rounded-lg px-2 py-1 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  disabled={disabled}
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6">
          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Product Image
            </label>

            {/* Existing/Preview */}
            {(preview || currentImageUrl) && (
              <div className="relative">
                <img
                  src={preview || currentImageUrl}
                  alt="Product preview"
                  className="w-full max-h-64 object-cover rounded-xl border"
                />
                {preview && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, productImage: null }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-xs px-2 py-1 rounded-lg border"
                    disabled={disabled}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}

            {/* Dropzone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`mt-3 border-2 border-dashed rounded-xl px-4 py-6 text-center transition ${
                dragActive ? "border-rose-400 bg-rose-50" : "border-rose-200"
              }`}
            >
              <p className="text-sm text-gray-600">
                Drag & drop image here, or{" "}
                <button
                  type="button"
                  className="text-rose-700 font-medium hover:text-rose-900 underline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to ~5MB</p>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={disabled}
                className="sr-only"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">
                Product Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Canon EOS 200D"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={120}
                className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
                disabled={disabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                Keep it concise and clear. (Max 120 chars)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800">
                Category <span className="text-rose-600">*</span>
              </label>

              {Array.isArray(categories) && categories.length > 0 ? (
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  disabled={disabled}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g., Electronics"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  disabled={disabled}
                />
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">
                Sale Price (Rs){" "}
                <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g., 25000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800">
                Borrow Price (Rs) <span className="text-rose-600">*</span>
              </label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">
                  Rs
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g., 500"
                  value={form.borrowPrice}
                  onChange={(e) =>
                    setForm({ ...form, borrowPrice: e.target.value })
                  }
                  required
                  className="w-full border rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  disabled={disabled}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set a fair per‑period borrowing price to improve conversion.
              </p>
            </div>
          </div>

          {/* Location & Age */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">
                Location <span className="text-rose-600">*</span>
              </label>
              {Array.isArray(locations) && locations.length > 0 ? (
                <select
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  disabled={disabled}
                >
                  <option value="">Select location</option>
                  {locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g., Kathmandu"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  required
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  disabled={disabled}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800">
                Product Age <span className="text-gray-400">(optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="e.g., 1 year"
                  value={form.productAge}
                  onChange={(e) =>
                    setForm({ ...form, productAge: e.target.value })
                  }
                  className="col-span-2 mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  disabled={disabled}
                />
                {/* Quick presets */}
                <div className="flex items-center gap-2">
                  {[].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="text-xs border rounded-lg px-2 py-1 hover:bg-rose-50"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, productAge: v }))
                      }
                      disabled={disabled}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-800">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              placeholder="Tell people about the condition, included accessories, usage, and any rules for borrowing."
              value={form.description}
              onChange={(e) => {
                const val = e.target.value.slice(0, maxChars);
                setForm({ ...form, description: val });
              }}
              maxLength={maxChars}
              className="mt-1 w-full border rounded-lg px-3 py-2 min-h-28 focus:outline-none focus:ring-2 focus:ring-rose-200"
              disabled={disabled}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Helpful descriptions boost trust & approvals.
              </p>
              <span className="text-xs text-gray-500">
                {charCount}/{maxChars}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition ${
                disabled ? "opacity-70 cursor-not-allowed" : ""
              }`}
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
            <span className="text-xs text-gray-500">
              By submitting, you agree to our community guidelines.
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
