import { useState } from "react";
import { Link } from "react-router-dom";
import { axiosClient } from "../../../api/axiosClient";
import { KeyIcon } from "@heroicons/react/24/outline";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setSubmitting(true);
      await axiosClient.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to send reset link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-orange-50" />
      <div className="absolute -top-20 -right-16 h-72 w-72 bg-rose-100 rounded-full blur-3xl opacity-60" />
      <div className="absolute -bottom-24 -left-16 h-64 w-64 bg-orange-100 rounded-full blur-3xl opacity-60" />

      <div className="relative max-w-6xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-24 w-auto" />
        </Link>

        <div className="mt-10 mx-auto max-w-md">
          <div className="rounded-2xl border border-rose-100 bg-white shadow-sm p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <KeyIcon className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Forgot password
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              We’ll send you a reset link.
            </p>

            {sent ? (
              <div className="mt-6 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-3">
                If an account exists for <strong>{email}</strong>, a reset link
                has been sent. Please check your inbox (and spam).
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="you@example.com"
                  />
                </div>

                {err && (
                  <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded p-2">
                    {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send reset link"}
                </button>

                <div className="text-right">
                  <Link
                    to="/login"
                    className="text-sm text-rose-700 hover:text-rose-900"
                  >
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
