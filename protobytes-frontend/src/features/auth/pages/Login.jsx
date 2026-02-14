// src/features/auth/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../../api/authApi";
import { setAccessToken } from "../../../api/axiosClient";
import { useAuth } from "../authStore";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export default function Login() {
  const navigate = useNavigate();
  const { loadMe } = useAuth();

  const [form, setForm] = useState({ login: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.login.trim() || !form.password) {
      setError("Login and password are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login({
        login: form.login.trim(),
        password: form.password,
      });

      if (res.data?.requires2FA) {
        sessionStorage.setItem("login_2fa_method", res.data?.method || "email");
        navigate("/2fa");
        return;
      }

      const token = res.data?.token || res.data?.accessToken || null;
      setAccessToken(token);
      await loadMe();
      navigate("/home");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed.");
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
            Welcome back
          </h1>
          <p className="mt-2 text-rose-600">Login with email or username.</p>
        </div>

        <Card className="p-6 shadow-glow border border-rose-200">
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email or Username"
              placeholder="xyz@gmail.com"
              value={form.login}
              onChange={setField("login")}
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={setField("password")}
              autoComplete="current-password"
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Checking…" : "Continue"}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm text-rose-700">
            <Link
              to="/forgot-password"
              className="underline hover:text-rose-900"
            >
              Forgot password?
            </Link>

            <Link
              to="/register"
              className="underline font-semibold hover:text-rose-900"
            >
              Create account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
