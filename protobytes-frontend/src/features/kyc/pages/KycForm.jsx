import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyKyc, submitKyc } from "../../../api/kycApi";

export default function KycForm() {
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    address: "",
    country: "",
    phone: "",
    category: "individual",
    governmentIdNumber: "",
    governmentIdImage: null,
    selfieImage: null,
  });

  const [previews, setPreviews] = useState({
    governmentIdImage: "",
    selfieImage: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyKyc();
        setInitial(res.data?.kyc || null);
        if (res.data?.kyc) {
          // Pre-fill some fields (non-files)
          setForm((prev) => ({
            ...prev,
            fullName: res.data.kyc.fullName || "",
            dob: res.data.kyc.dob?.slice(0, 10) || "",
            address: res.data.kyc.address || "",
            country: res.data.kyc.country || "",
            phone: res.data.kyc.phone || "",
            category: res.data.kyc.category || "individual",
            governmentIdNumber: res.data.kyc.governmentIdNumber || "",
          }));
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onPickFile = (name, file) => {
    if (!file) {
      setForm((prev) => ({ ...prev, [name]: null }));
      setPreviews((p) => ({ ...p, [name]: "" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("Max file size is 8 MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, [name]: file }));
    setPreviews((p) => ({ ...p, [name]: url }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("dob", form.dob);
      fd.append("address", form.address);
      fd.append("country", form.country);
      fd.append("phone", form.phone);
      fd.append("category", form.category);
      fd.append("governmentIdNumber", form.governmentIdNumber);

      if (form.governmentIdImage)
        fd.append("governmentIdImage", form.governmentIdImage);
      if (form.selfieImage) fd.append("selfieImage", form.selfieImage);

      await submitKyc(fd);
      alert("KYC submitted successfully");
      navigate("/kyc/status");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "KYC submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const status = initial?.status;
  const isLocked = status === "pending"; // block edits while review in progress

  if (loading) return <div className="max-w-3xl mx-auto p-6">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        {initial ? "Update KYC" : "Submit KYC"}
      </h1>
      {status && (
        <div
          className={`text-sm inline-block rounded-md px-3 py-1 border ${
            status === "approved"
              ? "bg-green-50 text-green-700 border-green-200"
              : status === "pending"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          Status: {status}
          {initial?.rejectionReason && status === "rejected" && (
            <> · Reason: {initial.rejectionReason}</>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Full name</label>
            <input
              className="w-full border rounded p-2"
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
              required
              disabled={isLocked}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date of birth</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={form.dob}
              onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
              required
              disabled={isLocked}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Country</label>
            <input
              className="w-full border rounded p-2"
              value={form.country}
              onChange={(e) =>
                setForm((p) => ({ ...p, country: e.target.value }))
              }
              required
              disabled={isLocked}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              className="w-full border rounded p-2"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              required
              disabled={isLocked}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              className="w-full border rounded p-2"
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              disabled={isLocked}
            >
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Address</label>
          <input
            className="w-full border rounded p-2"
            value={form.address}
            onChange={(e) =>
              setForm((p) => ({ ...p, address: e.target.value }))
            }
            required
            disabled={isLocked}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Government ID Number</label>
            <input
              className="w-full border rounded p-2"
              value={form.governmentIdNumber}
              onChange={(e) =>
                setForm((p) => ({ ...p, governmentIdNumber: e.target.value }))
              }
              required
              disabled={isLocked}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium">Government ID Image</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block"
              onChange={(e) =>
                onPickFile("governmentIdImage", e.target.files?.[0])
              }
              disabled={isLocked}
            />
            {(previews.governmentIdImage ||
              initial?.governmentIdImage?.url) && (
              <img
                className="mt-2 h-40 w-auto rounded border object-contain bg-white"
                src={
                  previews.governmentIdImage || initial.governmentIdImage.url
                }
                alt="Government ID"
              />
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Selfie Image</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block"
              onChange={(e) => onPickFile("selfieImage", e.target.files?.[0])}
              disabled={isLocked}
            />
            {(previews.selfieImage || initial?.selfieImage?.url) && (
              <img
                className="mt-2 h-40 w-auto rounded border object-contain bg-white"
                src={previews.selfieImage || initial.selfieImage.url}
                alt="Selfie"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="bg-rose-600 text-white px-4 py-2 rounded hover:bg-rose-700 disabled:opacity-60"
            disabled={submitting || isLocked}
          >
            {submitting
              ? "Submitting..."
              : initial
                ? "Update KYC"
                : "Submit KYC"}
          </button>

          <button
            type="button"
            className="text-sm text-gray-600 hover:text-gray-900"
            onClick={() => navigate("/settings")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
