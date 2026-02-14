// src/features/auth/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../../api/authApi";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const setField = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (form.username.trim().length < 3)
      return "Username must be at least 3 characters.";
    if (form.fullName.trim().length < 3)
      return "Full name must be at least 3 characters.";
    if (!form.email.includes("@")) return "Please enter a valid email address.";
    if (form.password.length < 6)
      return "Password must be at least 6 characters.";
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    try {
      setLoading(true);

      await authApi.register({
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setSuccess("Registered! OTP sent to your email. Redirecting…");

      setTimeout(() => {
        navigate(
          `/verify-email?email=${encodeURIComponent(form.email.trim())}`,
        );
      }, 800);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-24 w-auto" />
          </Link>

          <h1 className="text-3xl font-extrabold text-rose-700 drop-shadow">
            Create your account
          </h1>
          <p className="mt-2 text-rose-600">
            Join the lending & borrowing community — safely.
          </p>
        </div>

        <Card className="p-6 shadow-glow border border-rose-200">
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Username"
              placeholder="shuva"
              value={form.username}
              onChange={setField("username")}
              autoComplete="username"
            />

            <Input
              label="Full Name"
              placeholder="Shuva Kharel"
              value={form.fullName}
              onChange={setField("fullName")}
              autoComplete="name"
            />

            <Input
              label="Email"
              type="email"
              placeholder="shuva@example.com"
              value={form.email}
              onChange={setField("email")}
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={setField("password")}
              autoComplete="new-password"
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {success}
              </div>
            )}

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-rose-700">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold underline hover:text-rose-900"
            >
              Login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
