// src/features/profile/pages/Settings.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/authStore";
import { axiosClient } from "../../../api/axiosClient";

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

export default function Settings() {
  const { user, setUser } = useAuth();

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

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

  // KYC state
  const [kyc, setKyc] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);

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
    }
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const res = await axiosClient.get("/auth/sessions");
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
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
      await axiosClient.post(`/auth/sessions/revoke/${id}`);
      await loadSessions();
    } catch (err) {
      console.error(err);
      alert("Failed to revoke session");
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

      {/* SESSIONS */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-6 shadow-sm">
        <h2 className="font-semibold text-xl mb-3">Active Sessions</h2>

        {loadingSessions ? (
          <div className="text-sm text-gray-500">Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="text-sm text-gray-500">No active sessions.</div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const revoked = !!s.revokedAt;
              return (
                <div
                  key={s._id}
                  className={`flex justify-between items-center border p-3 rounded ${
                    revoked ? "opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">
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
                      className="text-red-600 text-sm hover:underline"
                    >
                      Revoke
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
