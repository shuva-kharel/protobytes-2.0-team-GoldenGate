// src/components/Navbar.jsx (or wherever your Navbar lives)
import { Link } from "react-router-dom";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../../features/auth/authStore";

/**
 * Normalize profilePicture into a string URL regardless of shape:
 * - "https://..." OR
 * - { url: "https://...", publicId: "..." }
 */
function getProfilePictureUrl(user) {
  if (!user) return "";
  const pic = user.profilePicture;
  if (!pic) return "";
  return typeof pic === "string" ? pic : pic?.url || "";
}

/**
 * Avatar component:
 * - Uses provided src (if present)
 * - Falls back to initials (from name/username)
 * - Falls back to a default SVG silhouette
 * - Graceful onError to trigger fallback
 */
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
        // Reset src to trigger the default initials/SVG branch above
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

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Normalize avatar URL for Navbar
  const avatarUrl = getProfilePictureUrl(user) || ""; // Allow Avatar to fallback

  return (
    <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">💘</span>
          <span className="text-lg font-extrabold text-rose-700">
            AinchoPaincho
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {/* Products Dropdown */}
          <div className="relative" ref={productsDropdownRef}>
            <button
              onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              className="text-sm font-semibold text-rose-700 hover:text-rose-900"
            >
              Products
            </button>

            {productsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg p-2 space-y-1">
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

          {/* User Dropdown */}
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
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
                <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg p-2 space-y-1">
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
