import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail = (location.state as any)?.email || "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      setLoading(true);
      await authApi.verifyEmail({ email, otp });
      setMsg("Email verified! Redirecting to login...");
      setTimeout(() => navigate("/login", { state: { mode: "login" } }), 1000);
    } catch (error: any) {
      setErr(error?.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setErr("");
    setMsg("");
    try {
      await authApi.resendEmailOtp({ email });
      setMsg("OTP resent to your email 💌");
    } catch (error: any) {
      setErr(error?.response?.data?.message || "Resend failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="glass-card w-full max-w-md rounded-[2.5rem] p-10">
        <h2 className="text-3xl font-bold mb-2 text-center">✉️ Verify Email</h2>
        <p className="text-center text-valentine-dark/60 mb-8">
          Enter OTP sent to your email
        </p>

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

        <form onSubmit={verify} className="space-y-5">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your email"
            className="w-full px-5 py-4 rounded-2xl bg-white/50 ring-1 ring-valentine-accent/30"
            required
          />

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit OTP"
            className="w-full px-5 py-4 rounded-2xl bg-white/50 ring-1 ring-valentine-accent/30"
            required
          />

          <button className="btn-primary w-full py-4" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button
          onClick={resend}
          className="mt-4 w-full text-valentine-primary font-bold hover:underline"
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;
