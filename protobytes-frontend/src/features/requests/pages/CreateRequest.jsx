import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { productRequestApi } from "../../../api/productRequestApi";

export default function CreateRequest() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "",
    location: "",
    maxBorrowPrice: "",
    neededFrom: "",
    neededTo: "",
    description: "",
  });

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.category.trim() || !form.location.trim()) {
      setError("Title, category and location are required.");
      return;
    }

    if (form.neededFrom && form.neededTo && form.neededFrom > form.neededTo) {
      setError("Needed To date must be after Needed From date.");
      return;
    }

    try {
      setSubmitting(true);
      await productRequestApi.create({
        title: form.title.trim(),
        category: form.category.trim(),
        location: form.location.trim(),
        maxBorrowPrice: Number(form.maxBorrowPrice || 0),
        neededFrom: form.neededFrom || null,
        neededTo: form.neededTo || null,
        description: form.description.trim(),
      });
      navigate("/requests/mine");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto py-8 px-4">
      <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Create Product Request</h1>
        <p className="mt-1 text-sm text-slate-600">
          Need something unavailable? Post your request and let owners contact you.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.title}
                onChange={setField("title")}
                placeholder="Need DSLR camera for 2 days"
                maxLength={120}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.category}
                onChange={setField("category")}
                placeholder="Electronics"
                maxLength={60}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Location</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.location}
                onChange={setField("location")}
                placeholder="Kathmandu"
                maxLength={80}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Max Borrow Budget (Rs)</label>
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.maxBorrowPrice}
                onChange={setField("maxBorrowPrice")}
                placeholder="1500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Needed From</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.neededFrom}
                onChange={setField("neededFrom")}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Needed To</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={form.neededTo}
                onChange={setField("neededTo")}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2 min-h-24"
              value={form.description}
              onChange={setField("description")}
              placeholder="Condition preference, delivery expectations, and duration details"
              maxLength={600}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-rose-600 text-white px-4 py-2 hover:bg-rose-700 disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Post Request"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/requests")}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
