// src/features/profile/pages/Settings.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/authStore";
import { axiosClient } from "../../../api/axiosClient";
import { authApi } from "../../../api/authApi";

/**
 * Helper to get a safe avatar URL
 * - 1️⃣ Preview (local)
 * - 2️⃣ Uploaded profile picture (string or {url})
 * - 3️⃣ UI Avatar from username
 * - 4️⃣ Local default fallback
 */
function getSafeAvatarUrl(user, previewUrl = "") {
  if (previewUrl) return previewUrl;
  if (user?.profilePicture) {
    return typeof user.profilePicture === "string"
      ? user.profilePicture
      : user.profilePicture.url;
  }
  if (user?.username) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.username,
    )}&background=E0E0E0&color=555555&size=128`;
  }
  return "/images/default-avatar.png"; // ensure this file exists in your public/images
}

function Avatar({ src, name = "", className = "" }) {
  const initials = useMemo(() => {
    const n = (name || "").trim();
    if (!n) return "";
    const parts = n.split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase();
  }, [name]);

  const defaultSvg = (
    <svg
      className="w-full h-full text-gray-400"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 12c2.761 0 5-2.69 5-6s-2.239-6-5-6-5 2.69-5 6 2.239 6 5 6zM21.6 22.2c.26.367.4.812.4 1.26H2c0-.448.14-.893.4-1.26C4.265 19.524 7.91 18 12 18s7.735 1.524 9.6 4.2z" />
    </svg>
  );

  if (!src) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full bg-gray-100 border text-gray-600 ${className}`}
        aria-label="Default avatar"
      >
        {initials ? (
          <span className="font-semibold select-none">{initials}</span>
        ) : (
          defaultSvg
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name ? `${name}'s avatar` : "Avatar"}
      className={`rounded-full object-cover border ${className}`}
      onError={(e) => {
        e.currentTarget.src = "/images/default-avatar.png";
      }}
    />
  );
}

function KycBadge({ status }) {
  if (!status) return null;
  const map = {
    approved: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };
  const label =
    status === "approved"
      ? "KYC Verified"
      : status === "pending"
        ? "KYC Pending"
        : "KYC Rejected";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

function parseDevice(userAgent = "") {
  const ua = String(userAgent).toLowerCase();
  const isMobile = /mobile|android|iphone|ipad/.test(ua);
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("firefox/")
      ? "Firefox"
      : ua.includes("safari/") && !ua.includes("chrome/")
        ? "Safari"
        : ua.includes("chrome/")
          ? "Chrome"
          : "Browser";
  const os = ua.includes("windows")
    ? "Windows"
    : ua.includes("mac os")
      ? "macOS"
      : ua.includes("linux")
        ? "Linux"
        : ua.includes("android")
          ? "Android"
          : ua.includes("iphone") || ua.includes("ios")
            ? "iOS"
            : "OS";
  return { browser, os, type: isMobile ? "Mobile" : "Desktop" };
}

function getCookie(name) {
  const prefixed = `${name}=`;
  const parts = document.cookie.split(";").map((v) => v.trim());
  const found = parts.find((p) => p.startsWith(prefixed));
  return found ? decodeURIComponent(found.slice(prefixed.length)) : "";
}

export default function Settings() {
  const { user, setUser, logout } = useAuth();

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionFilter, setSessionFilter] = useState("all");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionActionLoading, setSessionActionLoading] = useState("");

  // Profile form state
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    bio: "",
    profilePicture: null,
    previewUrl: "",
  });

  // Password
  const [changingPassword, setChangingPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState({
    enabled: false,
    method: "email",
    hasAuthenticator: false,
  });
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFABusy, setTwoFABusy] = useState("");
  const [setupOtp, setSetupOtp] = useState("");
  const [authSetup, setAuthSetup] = useState({
    qrCodeUrl: "",
    manualKey: "",
  });

  // KYC state
  const [kyc, setKyc] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);

  const currentDeviceId = useMemo(() => getCookie("device_id"), []);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        username: user.username || "",
        fullName: user.fullName || "",
        bio: user.bio || "",
        profilePicture: null,
        previewUrl: "",
      }));
      fetchKyc();
      fetchTwoFactorSettings();
    }
    loadSessions();
  }, [user]);

  const fetchKyc = async () => {
    setKycLoading(true);
    try {
      const res = await axiosClient.get("/kyc/me");
      setKyc(res.data?.kyc || null);
    } catch (e) {
      console.error(e);
    } finally {
      setKycLoading(false);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await authApi.listSessions();
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchTwoFactorSettings = async () => {
    setTwoFALoading(true);
    try {
      const res = await authApi.get2FASettings();
      setTwoFactor(res.data?.twoFactor || {
        enabled: false,
        method: "email",
        hasAuthenticator: false,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTwoFALoading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("username", form.username.trim());
      formData.append("fullName", form.fullName.trim());
      formData.append("bio", form.bio);
      if (form.profilePicture) {
        formData.append("profilePicture", form.profilePicture);
      }

      const res = await axiosClient.post("/user/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(res.data.user);
      setForm((prev) => ({ ...prev, profilePicture: null, previewUrl: "" }));
      alert("Profile updated");
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Profile update failed";
      alert(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;

    try {
      await axiosClient.post("/auth/update-password", {
        currentPassword,
        newPassword,
      });
      e.target.reset();
      alert("Password updated successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const revokeSession = async (id) => {
    if (!confirm("Revoke this session? It will be signed out.")) return;
    try {
      setSessionActionLoading(id);
      await authApi.revokeSession(id);
      if (sessions.find((s) => s._id === id)?.isCurrentSession) {
        await logout();
        return;
      }
      await loadSessions();
    } catch (err) {
      console.error(err);
      alert("Failed to revoke session");
    } finally {
      setSessionActionLoading("");
    }
  };

  const revokeOtherSessions = async () => {
    if (!confirm("Revoke all other active sessions?")) return;
    try {
      setSessionActionLoading("others");
      await authApi.revokeOtherSessions();
      await loadSessions();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to revoke other sessions");
    } finally {
      setSessionActionLoading("");
    }
  };

  const enableEmail2FA = async () => {
    try {
      setTwoFABusy("email");
      const res = await authApi.enableEmail2FA();
      setTwoFactor(res.data?.twoFactor || twoFactor);
      setAuthSetup({ qrCodeUrl: "", manualKey: "" });
      setSetupOtp("");
      alert("Email 2FA enabled");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to enable email 2FA");
    } finally {
      setTwoFABusy("");
    }
  };

  const startAuthenticator = async () => {
    try {
      setTwoFABusy("auth-setup");
      const res = await authApi.startAuthenticatorSetup();
      setAuthSetup({
        qrCodeUrl: res.data?.qrCodeUrl || "",
        manualKey: res.data?.manualKey || "",
      });
      setSetupOtp("");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to start authenticator setup");
    } finally {
      setTwoFABusy("");
    }
  };

  const verifyAuthenticator = async () => {
    if ((setupOtp || "").trim().length !== 6) {
      alert("Enter a valid 6-digit authenticator code");
      return;
    }
    try {
      setTwoFABusy("auth-verify");
      const res = await authApi.verifyAuthenticatorSetup({ otp: setupOtp.trim() });
      setTwoFactor(res.data?.twoFactor || twoFactor);
      setAuthSetup({ qrCodeUrl: "", manualKey: "" });
      setSetupOtp("");
      alert("Authenticator 2FA enabled");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to verify authenticator setup");
    } finally {
      setTwoFABusy("");
    }
  };

  const disable2FA = async () => {
    if (!confirm("Disable 2FA for your account?")) return;
    try {
      setTwoFABusy("disable");
      const res = await authApi.disable2FA();
      setTwoFactor(res.data?.twoFactor || {
        enabled: false,
        method: "email",
        hasAuthenticator: false,
      });
      setAuthSetup({ qrCodeUrl: "", manualKey: "" });
      setSetupOtp("");
      alert("2FA disabled");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to disable 2FA");
    } finally {
      setTwoFABusy("");
    }
  };

  const onPickFile = (file) => {
    if (!file)
      return setForm((prev) => ({
        ...prev,
        profilePicture: null,
        previewUrl: "",
      }));

    if (!file.type.startsWith("image/"))
      return alert("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return alert("Max file size is 5 MB");

    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, profilePicture: file, previewUrl }));
  };

  const sessionStats = useMemo(() => {
    const active = sessions.filter((s) => !s.revokedAt).length;
    const revoked = sessions.filter((s) => !!s.revokedAt).length;
    return { total: sessions.length, active, revoked };
  }, [sessions]);

  const visibleSessions = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    return sessions.filter((s) => {
      if (sessionFilter === "active" && s.revokedAt && !s.isCurrentSession)
        return false;
      if (sessionFilter === "revoked" && !s.revokedAt) return false;
      if (!q) return true;
      return (
        String(s.userAgent || "").toLowerCase().includes(q) ||
        String(s.ip || "").toLowerCase().includes(q)
      );
    });
  }, [sessions, sessionFilter, sessionSearch]);

  if (!user) return null;

  // Derive KYC status
  const kycStatus = user?.kycStatus || kyc?.status || null;
  const effectiveAvatarUrl = getSafeAvatarUrl(user, form.previewUrl);

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">
          Account Settings
        </h1>
        {/* Global badge at top */}
        <KycBadge status={kycStatus} />
      </header>

      {/* PROFILE */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-6 shadow-sm">
        <form onSubmit={updateProfile} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-xl">Profile</h2>
              <p className="text-sm text-gray-500">
                Update your public information and profile photo.
              </p>
            </div>

            {/* Show KYC action on the right */}
            <div className="flex items-center gap-3">
              <KycBadge status={kycStatus} />
              {kycLoading && (
                <span className="text-xs text-gray-500">Checking KYC...</span>
              )}
              {kycStatus !== "approved" && (
                <Link
                  to="/kyc"
                  className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
                >
                  <svg
                    className="w-4 h-4 text-rose-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
                  </svg>
                  {kyc ? "Update KYC" : "Submit KYC"}
                </Link>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar
                src={effectiveAvatarUrl}
                name={user.fullName || user.username}
                className="w-20 h-20"
              />
              {/* Small corner badge */}
              {kycStatus === "approved" && (
                <span
                  className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white"
                  title="KYC Verified"
                />
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="avatar"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 2l1.586 1.586L9 5.172 7.414 3.586 9 2zm-6 8l1.586 1.586L3 13.172 1.414 11.586 3 10zM21 12l-1.586 1.586L18 12.172l1.414-1.586L21 12zm-9 10l-1.586-1.586L12 18.828l1.586 1.586L12 22z" />
                </svg>
                Choose image
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
                aria-label="Upload profile picture"
              />
              {form.previewUrl && (
                <p className="text-xs text-gray-500">Preview not saved yet</p>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="Username"
                required
                minLength={3}
                autoComplete="username"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </label>
              <input
                id="fullName"
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                value={form.fullName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Full Name"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={form.bio}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell people a little about you"
              rows={4}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-rose-600 text-white px-4 py-2 rounded hover:bg-rose-700 disabled:opacity-60"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
            {form.previewUrl && (
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-900"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    profilePicture: null,
                    previewUrl: "",
                  }))
                }
              >
                Cancel new photo
              </button>
            )}
          </div>
        </form>
      </section>

      {/* PASSWORD */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-6 shadow-sm">
        <form onSubmit={updatePassword} className="space-y-4">
          <div>
            <h2 className="font-semibold text-xl">Change Password</h2>
            <p className="text-sm text-gray-500">
              Make sure your new password is strong and unique.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="currentPassword" className="text-sm font-medium">
                Current password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                placeholder="Current Password"
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                placeholder="New Password"
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="bg-rose-600 text-white px-4 py-2 rounded hover:bg-rose-700 disabled:opacity-60"
              disabled={changingPassword}
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>

            <a
              href="/forgot-password"
              className="text-sm text-rose-600 hover:underline"
            >
              Forgot Password?
            </a>
          </div>
        </form>
      </section>

      {/* TWO FACTOR */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-xl">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-500">
              OTP is required only when 2FA is enabled.
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium border ${
              twoFactor.enabled
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {twoFactor.enabled ? `Enabled (${twoFactor.method})` : "Disabled"}
          </span>
        </div>

        {twoFALoading ? (
          <div className="text-sm text-gray-500">Loading 2FA settings...</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={enableEmail2FA}
                disabled={twoFABusy === "email"}
                className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-60"
              >
                {twoFABusy === "email" ? "Enabling..." : "Use Email 2FA"}
              </button>
              <button
                type="button"
                onClick={startAuthenticator}
                disabled={twoFABusy === "auth-setup"}
                className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {twoFABusy === "auth-setup"
                  ? "Preparing..."
                  : twoFactor.method === "authenticator" && twoFactor.enabled
                    ? "Reconfigure Authenticator"
                    : "Use Google Authenticator"}
              </button>
              {twoFactor.enabled && (
                <button
                  type="button"
                  onClick={disable2FA}
                  disabled={twoFABusy === "disable"}
                  className="px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 text-sm hover:bg-rose-50 disabled:opacity-60"
                >
                  {twoFABusy === "disable" ? "Disabling..." : "Disable 2FA"}
                </button>
              )}
            </div>

            {authSetup.qrCodeUrl && (
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
                <p className="text-sm text-slate-700">
                  Scan this QR in Google Authenticator, then enter the 6-digit code.
                </p>
                <img
                  src={authSetup.qrCodeUrl}
                  alt="Authenticator QR"
                  className="h-44 w-44 rounded border bg-white p-2"
                />
                <p className="text-xs text-slate-600 break-all">
                  Manual key: <code>{authSetup.manualKey}</code>
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={setupOtp}
                    onChange={(e) => setSetupOtp(e.target.value)}
                    placeholder="123456"
                    className="w-32 border rounded-md px-2 py-1.5 text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={verifyAuthenticator}
                    disabled={twoFABusy === "auth-verify"}
                    className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {twoFABusy === "auth-verify" ? "Verifying..." : "Verify & Enable"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* SESSIONS */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-xl">Active Sessions</h2>
            <p className="text-sm text-gray-500">
              Manage where your account is logged in.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSessions}
              className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
              disabled={loadingSessions}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={revokeOtherSessions}
              disabled={
                sessionActionLoading === "others" || sessionStats.active <= 1
              }
              className="text-sm px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {sessionActionLoading === "others"
                ? "Revoking..."
                : "Revoke Other Sessions"}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-2 mb-4 text-sm">
          <div className="rounded-lg border bg-white px-3 py-2">
            <span className="text-gray-500">Total</span>
            <div className="font-semibold">{sessionStats.total}</div>
          </div>
          <div className="rounded-lg border bg-white px-3 py-2">
            <span className="text-gray-500">Active</span>
            <div className="font-semibold text-emerald-700">
              {sessionStats.active}
            </div>
          </div>
          <div className="rounded-lg border bg-white px-3 py-2">
            <span className="text-gray-500">Revoked</span>
            <div className="font-semibold text-rose-700">
              {sessionStats.revoked}
            </div>
          </div>
        </div>

        {sessions.find((s) => s.isCurrentSession) && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800">
            Current device is recognized and kept active when using
            <strong> Revoke Other Sessions</strong>.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="border rounded-md px-2 py-1.5 text-sm bg-white"
          >
            <option value="active">Active only</option>
            <option value="all">All sessions</option>
            <option value="revoked">Revoked only</option>
          </select>
          <input
            type="text"
            value={sessionSearch}
            onChange={(e) => setSessionSearch(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-white"
            placeholder="Search by device or IP..."
          />
        </div>

        {loadingSessions ? (
          <div className="text-sm text-gray-500">Loading sessions…</div>
        ) : visibleSessions.length === 0 ? (
          <div className="text-sm text-gray-500">
            No sessions match your current filter.
          </div>
        ) : (
          <div className="space-y-2">
            {visibleSessions.map((s) => {
              const revoked = !!s.revokedAt;
              const current =
                !!s.isCurrentSession ||
                (!!currentDeviceId && s.deviceId === currentDeviceId);
              const parsed = parseDevice(s.userAgent || "");
              return (
                <div
                  key={s._id}
                  className={`flex justify-between items-center border p-3 rounded-lg ${
                    revoked ? "opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate font-medium">
                      {parsed.browser} on {parsed.os} ({parsed.type})
                      {current && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {s.userAgent || "Unknown device"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(s.lastUsedAt).toLocaleString()}
                      {s.ip ? ` · ${s.ip}` : ""}
                    </p>
                    {revoked && (
                      <p className="text-xs mt-1 text-red-500">
                        Revoked {new Date(s.revokedAt).toLocaleString()}
                        {s.revokeReason ? ` · ${s.revokeReason}` : ""}
                      </p>
                    )}
                  </div>

                  {!revoked && (
                    <button
                      onClick={() => revokeSession(s._id)}
                      disabled={sessionActionLoading === s._id}
                      className="text-red-600 text-sm hover:underline disabled:opacity-60"
                    >
                      {sessionActionLoading === s._id ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
