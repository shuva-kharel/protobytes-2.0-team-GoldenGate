import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../features/auth/authStore";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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
          <Link
            className="text-sm font-semibold text-rose-700 hover:text-rose-900"
            to="/products"
          >
            Products
          </Link>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar Button */}
              <button
                onClick={() => setOpen(!open)}
                className="relative focus:outline-none"
              >
                <img
                  src={
                    user.profilePicture ||
                    `https://ui-avatars.com/api/?name=${user.username}` || 
                  }
                  alt="avatar"
                  className="h-9 w-9 rounded-full border object-cover"
                />

                {user.kycStatus === "approved" && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                )}
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg p-2 space-y-1">
                  <Link
                    to="/settings"
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-rose-50"
                    onClick={() => setOpen(false)}
                  >
                    Account
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-rose-50"
                      onClick={() => setOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
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
