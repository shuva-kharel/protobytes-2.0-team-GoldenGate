import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { kycApi } from "../api/kycApi";
import { useAuth } from "../context/AuthContext";

const KYC: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState<
    "none" | "pending" | "approved" | "rejected"
  >("none");
  const [rejectionReason, setRejectionReason] = useState("");

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(""); // AD date input (YYYY-MM-DD)
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Individual");
  const [governmentIdNumber, setGovernmentIdNumber] = useState("");

  const [governmentIdImage, setGovernmentIdImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);

  const govRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // Load current KYC
  const loadKyc = async () => {
    if (!user) return;
    try {
      const res = await kycApi.me();
      const kyc = res.data?.kyc;
      if (!kyc) {
        setStatus("none");
        return;
      }
      setStatus(kyc.status);
      setRejectionReason(kyc.rejectionReason || "");
      // Prefill some fields for better UX
      setFullName(kyc.fullName || user.fullName || user.username);
      setDob(kyc.dob ? String(kyc.dob).slice(0, 10) : "");
      setAddress(kyc.address || "");
      setPhone(kyc.phone || "");
      setCategory(kyc.category || "Individual");
      setGovernmentIdNumber(kyc.governmentIdNumber || "");
    } catch {
      setStatus("none");
    }
  };

  useEffect(() => {
    loadKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-lg rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-black mb-2">Login required</h2>
          <p className="text-valentine-dark/60 mb-6">
            Please login to submit KYC.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="btn-primary px-8 py-3"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = status === "none" || status === "rejected";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!canSubmit) {
      setErr(`KYC is already ${status}. You can't submit again right now.`);
      return;
    }

    if (!fullName.trim()) return setErr("Full name is required.");
    if (!dob) return setErr("Date of birth is required.");
    if (!address.trim()) return setErr("Address is required.");
    if (!phone.trim()) return setErr("Phone number is required.");
    if (!governmentIdNumber.trim())
      return setErr("Government ID number is required.");
    if (!governmentIdImage) return setErr("Government ID image is required.");
    if (!selfieImage) return setErr("Selfie image is required.");

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("fullName", fullName.trim());
      fd.append("dob", dob); // backend will parse Date
      fd.append("address", address.trim());
      fd.append("country", "Nepal");
      fd.append("phone", phone.trim());
      fd.append("category", category);
      fd.append("governmentIdNumber", governmentIdNumber.trim());

      // ✅ exact keys backend expects
      fd.append("governmentIdImage", governmentIdImage);
      fd.append("selfieImage", selfieImage);

      await kycApi.submit(fd);

      setMsg("KYC submitted ✅ Pending admin review.");
      setStatus("pending");
      setTimeout(() => navigate("/profile"), 900);
    } catch (error: any) {
      setErr(error?.response?.data?.message || "KYC submission failed.");
    } finally {
      setLoading(false);
    }
  };

  // Status view if already pending/approved
  if (!canSubmit) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2">
            KYC Status
          </h2>
          <p className="text-slate-600 mb-6">
            Current status: <b>{status.toUpperCase()}</b>
          </p>

          {status === "rejected" && rejectionReason && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              Rejection reason: {rejectionReason}
            </div>
          )}

          <button
            onClick={() => navigate("/profile")}
            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center py-12 px-4 font-sans relative">
      <button
        onClick={() => navigate("/profile")}
        className="absolute top-6 left-6 flex items-center space-x-2 text-slate-600 hover:text-blue-600 font-bold bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 mt-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-blue-600 mb-1">
            Aincho Paincho
          </h1>
          <h2 className="text-lg font-bold text-slate-700">KYC Verification</h2>
        </div>

        {err && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3">
            {msg}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name (as per document)"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg"
            required
          />

          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg"
            required
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg"
            required
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg"
          >
            <option>Individual</option>
            <option>Business</option>
            <option>Premium Account</option>
            <option>Investor</option>
            <option>Vendor</option>
            <option>Freelancer</option>
          </select>

          <input
            value={governmentIdNumber}
            onChange={(e) => setGovernmentIdNumber(e.target.value)}
            placeholder="Government ID number"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg"
            required
          />

          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address (province, district, municipality, ward, tole)"
            className="w-full px-4 py-3 border border-slate-200 rounded-lg"
            rows={3}
            required
          />

          {/* Files */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-bold text-slate-700 mb-2">
                Government ID Image *
              </p>
              <input
                ref={govRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) =>
                  setGovernmentIdImage(e.target.files?.[0] || null)
                }
              />
              <button
                type="button"
                onClick={() => govRef.current?.click()}
                className="w-full border border-slate-200 rounded-xl p-4 text-left"
              >
                {governmentIdImage
                  ? `✅ ${governmentIdImage.name}`
                  : "Upload Citizenship/Passport photo"}
              </button>
            </div>

            <div>
              <p className="font-bold text-slate-700 mb-2">Selfie Image *</p>
              <input
                ref={selfieRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => setSelfieImage(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => selfieRef.current?.click()}
                className="w-full border border-slate-200 rounded-xl p-4 text-left"
              >
                {selfieImage ? `✅ ${selfieImage.name}` : "Upload selfie photo"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold w-full disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit KYC ✅"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KYC;
