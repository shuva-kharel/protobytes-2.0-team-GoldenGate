// src/features/auth/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../../api/authApi";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email.includes("@")) return setError("Valid email required.");

    try {
      setLoading(true);
      await authApi.forgotPassword({ email: email.trim() });
      setInfo("If that email exists, a reset link was sent 💌");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-rose-700 drop-shadow">
            💌 Forgot password
          </h1>
          <p className="mt-2 text-rose-600">We’ll send you a reset link.</p>
        </div>

        <Card className="p-6 shadow-glow border border-rose-200">
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {loading ? "Sending…" : "Send reset link 💖"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-rose-700">
            <Link to="/login" className="underline hover:text-rose-900">
              Back to login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
