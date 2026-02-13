import { Link } from "react-router-dom";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../features/auth/authStore";

/** Normalize profile picture to string URL */
function getProfilePictureUrl(user) {
  if (!user) return "";
  const pic = user.profilePicture;
  if (!pic) return "";
  return typeof pic === "string" ? pic : pic?.url || "";
}

/** Avatar with graceful fallback */
function Avatar({ src, name = "", className = "h-9 w-9" }) {
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
          <span className="font-semibold text-xs select-none">{initials}</span>
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
      className={`rounded-full border object-cover ${className}`}
      onError={(e) => {
        e.currentTarget.src = "";
      }}
    />
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const productsDropdownRef = useRef(null);

  const closeAll = useCallback(() => {
    setUserDropdownOpen(false);
    setProductsDropdownOpen(false);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      const u = userDropdownRef.current;
      const p = productsDropdownRef.current;
      if (u && !u.contains(event.target) && p && !p.contains(event.target)) {
        closeAll();
      } else if (u && !u.contains(event.target) && !p) {
        closeAll();
      } else if (p && !p.contains(event.target) && !u) {
        closeAll();
      }
    }
    function handleEsc(event) {
      if (event.key === "Escape") closeAll();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [closeAll]);

  const avatarUrl = getProfilePictureUrl(user) || "";

  return (
    <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3 group">
          {/* Brand Mark (optional simple dot) */}
          <span className="h-3 w-3 rounded-full bg-rose-600 shadow shadow-rose-200 group-hover:scale-110 transition" />
          {/* Nepali brand */}
          <span className="text-xl font-extrabold font-display brand-gradient tracking-wide">
            ऐँचोपैंचो
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {/* Products Dropdown */}
          <div className="relative" ref={productsDropdownRef}>
            <button
              onClick={() => setProductsDropdownOpen((prev) => !prev)}
              className="text-sm font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1"
            >
              Products
              <svg
                className={`h-4 w-4 transition ${productsDropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
              </svg>
            </button>

            {productsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-rose-100 bg-white shadow-lg p-2 space-y-1">
                <Link
                  to="/products/new"
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-rose-50"
                  onClick={() => setProductsDropdownOpen(false)}
                >
                  Create Product
                </Link>

                <Link
                  to="/products/mine"
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-rose-50"
                  onClick={() => setProductsDropdownOpen(false)}
                >
                  My Products
                </Link>
              </div>
            )}
          </div>

          {user && (
            <Link
              to="/chat"
              className="text-sm font-semibold text-rose-700 hover:text-rose-900"
            >
              Chat
            </Link>
          )}

          {/* User Dropdown */}
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="relative focus:outline-none"
                aria-label="Open user menu"
              >
                <Avatar
                  src={avatarUrl}
                  name={user.fullName || user.username}
                  className="h-9 w-9"
                />
                {user.kycStatus === "approved" && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                )}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-rose-100 bg-white shadow-lg p-2 space-y-1">
                  <Link
                    to="/settings"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-rose-50"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    Account
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-rose-50"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-rose-50 text-red-500"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              className="text-sm font-semibold text-rose-700 hover:text-rose-900"
              to="/login"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
