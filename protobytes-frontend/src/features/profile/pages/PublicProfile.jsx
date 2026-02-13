import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { userApi } from "../../../api/userApi";

function getAvatar(profile) {
  const pic = profile?.profilePicture;
  if (!pic) return "";
  return typeof pic === "string" ? pic : pic?.url || "";
}

export default function PublicProfile() {
  const { id, username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = username
          ? await userApi.getPublicProfileByUsername(username)
          : await userApi.getPublicProfileById(id);

        if (active) setProfile(res.data?.profile || null);
      } catch (err) {
        if (active) setError(err?.response?.data?.message || "Failed to load profile");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, username]);

  const joined = useMemo(() => {
    if (!profile?.joinedAt) return "";
    return new Date(profile.joinedAt).toLocaleDateString();
  }, [profile?.joinedAt]);

  if (loading) {
    return <div className="max-w-3xl mx-auto py-10">Loading profile…</div>;
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-3">
        <p className="text-rose-700">{error || "Profile not found"}</p>
        <Link to="/home" className="text-sm underline text-rose-700">
          Back to Home
        </Link>
      </div>
    );
  }

  const avatar = getAvatar(profile);

  return (
    <section className="max-w-3xl mx-auto py-6">
      <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {avatar ? (
            <img
              src={avatar}
              alt={profile.fullName || profile.username}
              className="h-24 w-24 rounded-full object-cover border"
            />
          ) : (
            <div className="h-24 w-24 rounded-full border bg-rose-50 flex items-center justify-center text-2xl font-bold text-rose-700">
              {(profile.username || "U").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 truncate">
              {profile.fullName || profile.username}
            </h1>
            <p className="text-sm text-slate-600">@{profile.username}</p>
            {joined && (
              <p className="mt-1 text-xs text-slate-500">Joined {joined}</p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50/40 p-4">
          <h2 className="text-sm font-semibold text-slate-900">About</h2>
          <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
            {profile.bio || "No bio added yet."}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Link
            to="/home"
            className="text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50"
          >
            Back to Home
          </Link>
          <Link
            to={`/chat/${profile._id}`}
            className="text-sm rounded-lg bg-rose-600 text-white px-3 py-1.5 hover:bg-rose-700"
          >
            Message User
          </Link>
        </div>
      </div>
    </section>
  );
}
