import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { axiosClient } from "../../../api/axiosClient";

/* Extract query params safely */
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/** Read a query param, with fallback for legacy `&amp;email=` links */
function getQueryWithAmpFallback(query, key) {
  return query.get(key) || query.get(`amp;${key}`) || "";
}

function Toast({ type = "info", message = "", onClose }) {
  if (!message) return null;

  const color =
    type === "success"
      ? "bg-emerald-600"
      : type === "error"
        ? "bg-rose-600"
        : type === "warning"
          ? "bg-amber-600"
          : "bg-slate-700";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
      <div
        className={`${color} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}
      >
        <span className="text-sm">{message}</span>
        <button
          className="text-white/80 hover:text-white text-xs"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const query = useQuery();
  const { token: paramToken } = useParams();

  // Support both route param and query param
  const token = paramToken || query.get("token") || "";
  const emailParam = getQueryWithAmpFallback(query, "email");

  const hasToken = Boolean(token);
  const hasEmail = Boolean(emailParam);

  const [form, setForm] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
    showNew: false,
    showConfirm: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!hasToken) {
      setToast({
        type: "error",
        message: "Invalid or missing reset link. Please request a new one.",
      });
    }
    // Prefill email for display (read-only)
    if (emailParam) {
      setForm((f) => ({ ...f, email: emailParam }));
    }
  }, [hasToken, emailParam]);

  const passwordChecks = useMemo(() => {
    const p = form.newPassword || "";
    return {
      length: p.length >= 8,
      hasNumber: /\d/.test(p),
      hasLetter: /[A-Za-z]/.test(p),
    };
  }, [form.newPassword]);

  const passwordsMatch =
    form.newPassword &&
    form.confirmPassword &&
    form.newPassword === form.confirmPassword;

  const canSubmit =
    passwordChecks.length &&
    passwordsMatch &&
    !submitting &&
    hasToken &&
    hasEmail;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);

      await axiosClient.post("/auth/reset-password", {
        token,
        email: emailParam,
        password: form.newPassword,
      });

      setToast({
        type: "success",
        message: "Password reset successful! Redirecting to login…",
      });

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      console.error(err);

      setToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Reset link expired or invalid. Please request a new one.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: "", message: "" })}
      />

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-orange-50" />
      <div className="absolute -top-20 -right-16 h-72 w-72 bg-rose-100 rounded-full blur-3xl opacity-60" />
      <div className="absolute -bottom-24 -left-16 h-64 w-64 bg-orange-100 rounded-full blur-3xl opacity-60" />

      <div className="relative max-w-6xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-rose-600 shadow shadow-rose-200" />
          <span className="text-3xl font-extrabold font-display brand-gradient tracking-wide">
            ऐँचोपैंचो
          </span>
        </Link>

        <div className="mt-10 mx-auto max-w-md">
          <div className="rounded-2xl border border-rose-100 bg-white shadow-sm p-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Reset your password
            </h1>

            {!hasToken ? (
              <div className="mt-6">
                <Link
                  to="/forgot-password"
                  className="text-rose-700 hover:text-rose-900 underline text-sm"
                >
                  Go to Forgot Password
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                {/* Email (read-only) */}
                {hasEmail && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Account
                    </label>
                    <input
                      type="email"
                      value={emailParam}
                      readOnly
                      className="mt-1 w-full border rounded-lg p-3 bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={form.showNew ? "text" : "password"}
                      required
                      value={form.newPassword}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, newPassword: e.target.value }))
                      }
                      className="w-full border rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-rose-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, showNew: !f.showNew }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500"
                    >
                      {form.showNew ? "Hide" : "Show"}
                    </button>
                  </div>

                  <ul className="mt-2 text-xs text-gray-600 space-y-1">
                    <li
                      className={
                        passwordChecks.length ? "text-emerald-600" : ""
                      }
                    >
                      • At least 8 characters
                    </li>
                    <li
                      className={
                        passwordChecks.hasLetter ? "text-emerald-600" : ""
                      }
                    >
                      • Contains a letter
                    </li>
                    <li
                      className={
                        passwordChecks.hasNumber ? "text-emerald-600" : ""
                      }
                    >
                      • Contains a number
                    </li>
                  </ul>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={form.showConfirm ? "text" : "password"}
                      required
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full border rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-rose-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, showConfirm: !f.showConfirm }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500"
                    >
                      {form.showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>

                  {form.confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-rose-600 mt-1">
                      Passwords don’t match.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-2.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {submitting ? "Resetting…" : "Reset Password"}
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
