import { Link } from "react-router-dom";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../features/auth/authStore";

// Icons
import { MdAddCircleOutline, MdSettings, MdBuild } from "react-icons/md";
import { AiOutlineInbox } from "react-icons/ai";
import { FiLogOut } from "react-icons/fi";
import { HiMiniChatBubbleLeftRight } from "react-icons/hi2"; // If not available, use: import { HiOutlineChatAlt2 } from "react-icons/hi";
import { FaRegCircleUser, FaBoxOpen } from "react-icons/fa6";
import { MdKeyboardArrowDown } from "react-icons/md";

/** Normalize profile picture to string URL */
function getProfilePictureUrl(user) {
  if (!user) return "";
  const pic = user.profilePicture;
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

  if (!src) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full bg-gray-100 border text-gray-600 ${className}`}
        aria-label="Default avatar"
      >
        {initials ? (
          <span className="font-semibold text-xs select-none">{initials}</span>
        ) : (
          <FaRegCircleUser
            className="w-full h-full text-gray-400"
            aria-hidden
          />
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

  // Close on outside click / ESC
  useEffect(() => {
    function handleClickOutside(event) {
      const u = userDropdownRef.current;
      const p = productsDropdownRef.current;

      // If clicking outside both dropdown zones, close all
      if (
        (!u || (u && !u.contains(event.target))) &&
        (!p || (p && !p.contains(event.target)))
      ) {
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
        <Link to="/home" className="flex items-center gap-3 group">
          {/* Brand Mark */}
          <span className="h-3 w-3 rounded-full bg-rose-600 shadow shadow-rose-200 group-hover:scale-110 transition" />
          {/* Nepali brand */}
          <span className="text-xl font-extrabold font-display brand-gradient tracking-wide">
            ऐँचोपैंचो
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {/* Primary Links */}
          <Link
            to="/home"
            className="px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-900 transition"
          >
            Browse
          </Link>

          <Link
            to="/requests"
            className="px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-900 transition"
          >
            Requests
          </Link>

          {/* Products Dropdown */}
          <div className="relative" ref={productsDropdownRef}>
            <button
              onClick={() => setProductsDropdownOpen((prev) => !prev)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-900 transition inline-flex items-center gap-1"
            >
              Products
              <MdKeyboardArrowDown
                className={`h-4 w-4 transition-transform duration-200 ${productsDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {productsDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-rose-100 bg-white shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <Link
                  to="/products/new"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-rose-50 transition"
                  onClick={() => setProductsDropdownOpen(false)}
                >
                  <MdAddCircleOutline className="text-rose-600" />
                  <span>Create Product</span>
                </Link>

                <Link
                  to="/products/mine"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-rose-50 transition"
                  onClick={() => setProductsDropdownOpen(false)}
                >
                  <FaBoxOpen className="text-rose-600" />
                  <span>My Products</span>
                </Link>

                <Link
                  to="/requests/new"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-rose-50 transition"
                  onClick={() => setProductsDropdownOpen(false)}
                >
                  <AiOutlineInbox className="text-rose-600" />
                  <span>Create Request</span>
                </Link>
              </div>
            )}
          </div>

          {/* Chat Link */}
          {user && (
            <Link
              to="/chat"
              className="px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-900 transition flex items-center gap-1"
            >
              {/* If hi2 icon isn't available in your version, replace with HiOutlineChatAlt2 from 'react-icons/hi' */}
              <HiMiniChatBubbleLeftRight />
              <span>Chat</span>
            </Link>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-rose-100 mx-2" />

          {/* User Section */}
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-rose-50 transition"
              >
                <Avatar
                  src={avatarUrl}
                  name={user.fullName || user.username}
                  className="h-9 w-9"
                />
                <span className="text-sm font-medium text-rose-800 hidden sm:block">
                  {user.fullName || user.username}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-rose-100 bg-white shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-rose-50 transition"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <MdSettings className="text-rose-600" />
                    <span>Account</span>
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-rose-50 transition"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <MdBuild className="text-rose-600" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <div className="h-px bg-rose-100 my-1" />

                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-rose-50 text-red-500 transition"
                  >
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition shadow-sm"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
