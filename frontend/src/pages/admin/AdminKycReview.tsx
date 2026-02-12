import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";

const AdminKycReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [images, setImages] = useState<{
    governmentIdUrl: string;
    selfieUrl: string;
  } | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadSignedImages = async () => {
    if (!id) return;

    try {
      setErr("");
      setRefreshing(true);

      const res = await adminApi.signedImages(id);

      // expected:
      // { expiresInSeconds: 300, images: { governmentIdUrl, selfieUrl } }

      setImages({
        governmentIdUrl: res.data.governmentIdUrl,
        selfieUrl: res.data.selfieUrl,
      });

      setExpiresIn(res.data.expiresInSeconds || 0);
      setExpiresIn(res.data.expiresInSeconds || 0);
    } catch (e: any) {
      console.log("SIGNED IMAGES ERROR:", e);
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to load signed images",
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadSignedImages();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const approve = async () => {
    if (!id) return;
    try {
      setErr("");
      setMsg("");
      await adminApi.approveKyc(id);
      setMsg("✅ Approved successfully");
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Approve failed");
    }
  };

  const reject = async () => {
    if (!id) return;
    try {
      setErr("");
      setMsg("");
      await adminApi.rejectKyc(id, reason || "Rejected");
      setMsg("❌ Rejected successfully");
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Reject failed");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">Loading signed images…</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black mb-6">Review KYC</h1>

      {err && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
          {err}
        </div>
      )}

      {msg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3">
          {msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          Signed URLs expire in: <b>{expiresIn}s</b>
        </p>

        <button
          onClick={loadSignedImages}
          disabled={refreshing}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh Images"}
        </button>
      </div>

      {!images ? (
        <div className="text-gray-700">No images returned.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h3 className="font-bold mb-3">Government ID</h3>
            <img
              src={images.governmentIdUrl}
              alt="Government ID"
              className="rounded-lg w-full object-contain border"
            />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h3 className="font-bold mb-3">Selfie</h3>
            <img
              src={images.selfieUrl}
              alt="Selfie"
              className="rounded-lg w-full object-contain border"
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col md:flex-row gap-3">
        <button
          onClick={approve}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold"
        >
          Approve
        </button>

        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason (optional)"
          className="border rounded-lg px-4 py-3 flex-1"
        />

        <button
          onClick={reject}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default AdminKycReview;
