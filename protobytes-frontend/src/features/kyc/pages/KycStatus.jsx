import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyKyc } from "../../../api/kycApi";

export default function KycStatus() {
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyKyc();
        setKyc(res.data?.kyc || null);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="max-w-2xl mx-auto p-6">Loading…</div>;

  const status = kyc?.status;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">KYC Status</h1>

      {!kyc ? (
        <div className="rounded border p-4">
          <p className="text-sm text-gray-700">
            You have not submitted KYC yet.
          </p>
          <Link to="/kyc" className="text-rose-600 underline text-sm">
            Submit KYC
          </Link>
        </div>
      ) : (
        <div className="space-y-2 rounded border p-4">
          <div className="text-sm">
            <strong>Status:</strong> {status}
          </div>
          {status === "rejected" && kyc.rejectionReason && (
            <div className="text-sm text-red-600">
              <strong>Reason:</strong> {kyc.rejectionReason}
            </div>
          )}
          <div className="flex items-center gap-3 pt-2">
            {status !== "approved" && (
              <Link
                to="/kyc"
                className="bg-rose-600 text-white px-3 py-2 rounded text-sm"
              >
                {status ? "Update KYC" : "Submit KYC"}
              </Link>
            )}
            <Link to="/settings" className="text-sm text-gray-700 underline">
              Back to Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
