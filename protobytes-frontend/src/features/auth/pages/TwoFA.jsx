// src/features/auth/pages/TwoFA.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../../api/authApi";
import { useAuth } from "../authStore";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { setAccessToken } from "../../../api/axiosClient";

export default function TwoFA() {
  const navigate = useNavigate();
  const { loadMe } = useAuth();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (otp.trim().length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }

    try {
      setLoading(true);

      const res = await authApi.verify2FA({ otp: otp.trim() });

      // ✅ store access token in memory
      setAccessToken(res.data.token);

      await loadMe();
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "2FA verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      setResending(true);
      setError("");
      setInfo("");
      await authApi.resend2FA();
      setInfo("New OTP sent to your email 💌");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-rose-700 drop-shadow">
            🔐 2FA Verification
          </h1>
          <p className="mt-2 text-rose-600">
            Enter the OTP sent to your email.
          </p>
        </div>

        <Card className="p-6 shadow-glow border border-rose-200">
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="OTP Code"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              maxLength={6}
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {info && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {info}
              </div>
            )}

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Verifying…" : "Verify 💖"}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              onClick={resend}
              disabled={resending}
              className="text-rose-700 underline hover:text-rose-900 disabled:opacity-60"
            >
              {resending ? "Resending…" : "Resend OTP"}
            </button>

            <Link
              to="/login"
              className="text-rose-700 underline hover:text-rose-900"
            >
              Back to login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
