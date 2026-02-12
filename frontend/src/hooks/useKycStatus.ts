import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { kycApi } from "../api/kycApi";

export default function useKycStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<
    "none" | "pending" | "approved" | "rejected"
  >("none");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) {
      setStatus("none");
      return;
    }
    try {
      setLoading(true);
      const res = await kycApi.me();
      const kyc = res.data?.kyc;
      setStatus(kyc ? kyc.status : "none");
    } catch {
      setStatus("none");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  return {
    status,
    loading,
    refresh,
    isApproved: status === "approved",
  };
}
