import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Bell,
  PlusCircle,
  ShoppingCart,
  MessageSquare,
  Shield,
  ClipboardCheck,
  LogOut,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import useKycStatus from "../hooks/useKycStatus";

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { isApproved: isKycApproved } = useKycStatus();

  const [searchTerm, setSearchTerm] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  /**
   * Gate: Login -> Email verified -> KYC approved
   * If blocked, redirect to correct page.
   */
  const goIfVerified = (path: string) => {
    if (!user) {
      navigate("/login", { state: { mode: "login" } });
      return;
    }

    if (user.isEmailVerified === false) {
      navigate("/verify-email", { state: { email: user.email } });
      return;
    }

    if (!isKycApproved) {
      navigate("/profile", { state: { promptKyc: true } });
      return;
    }

    navigate(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    // Pass search query to home (optional usage)
    navigate("/", { state: { q } });
  };

  const handleNotificationClick = () => {
    if (!user) setNotifyOpen((v) => !v);
    else navigate("/notifications");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-valentine-accent/10 shadow-sm py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-4">

          {/* Logo */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.jpg" alt="Aincho Paincho Logo" className="h-8 w-8 object-contain" />
              <span className="text-2xl font-bold text-valentine-dark tracking-tight">
                Aincho Paincho
              </span>
            </Link>

            {/* Mobile Icons */}
            <div className="flex md:hidden items-center space-x-4">
              <button onClick={() => goIfVerified("/profile")} aria-label="Account">
                <User className="h-6 w-6 text-valentine-dark" />
              </button>
              <button onClick={() => goIfVerified("/cart")} aria-label="Cart">
                <ShoppingCart className="h-6 w-6 text-valentine-dark" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex-grow w-full max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search in Aincho Paincho..."
                className="w-full pl-5 pr-12 py-2.5 rounded-xl bg-valentine-bg/50 border-none ring-1 ring-valentine-accent/20 focus:ring-2 focus:ring-valentine-primary outline-none transition-all placeholder:text-valentine-dark/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-4 bg-valentine-primary text-white rounded-lg hover:bg-valentine-dark transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center space-x-6">

            {/* Share Item -> Create Product */}
            <button
              onClick={() => goIfVerified("/create-product")}
              className="flex items-center space-x-1.5 text-valentine-dark hover:text-valentine-primary font-semibold transition-colors bg-valentine-bg/30 px-3 py-1.5 rounded-lg whitespace-nowrap"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Share Item</span>
            </button>

            <div className="flex items-center space-x-5">

              {/* Chat */}
              <button
                onClick={() => goIfVerified("/messages")}
                className="text-valentine-dark hover:text-valentine-primary transition-colors"
                aria-label="Messages"
              >
                <MessageSquare className="h-6 w-6" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={handleNotificationClick}
                  className="text-valentine-dark hover:text-valentine-primary transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-valentine-primary rounded-full border-2 border-white" />
                </button>

                {notifyOpen && !user && (
                  <div className="absolute top-12 right-0 w-64 bg-white rounded-2xl shadow-2xl p-4 border border-valentine-accent/10 z-[60]">
                    <p className="text-sm font-bold text-valentine-dark mb-2">
                      Notification Center
                    </p>
                    <p className="text-xs text-valentine-dark/60 leading-relaxed">
                      Please{" "}
                      <Link to="/login" state={{ mode: "login" }} className="text-valentine-primary font-black hover:underline" onClick={() => setNotifyOpen(false)}>
                        Login
                      </Link>{" "}
                      /{" "}
                      <Link to="/login" state={{ mode: "signup" }} className="text-valentine-primary font-black hover:underline" onClick={() => setNotifyOpen(false)}>
                        Signup
                      </Link>{" "}
                      to access notifications.
                    </p>
                    <button
                      onClick={() => setNotifyOpen(false)}
                      className="mt-3 w-full py-1.5 rounded-lg bg-valentine-bg hover:bg-valentine-accent/10 text-xs font-bold text-valentine-dark transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Menu (only for admins) */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setAdminMenuOpen((v) => !v)}
                    className="flex items-center gap-2 text-valentine-dark hover:text-valentine-primary font-semibold transition-colors"
                    aria-label="Admin menu"
                  >
                    <Shield className="h-6 w-6" />
                    <span>Admin</span>
                  </button>

                  {adminMenuOpen && (
                    <div className="absolute top-12 right-0 w-56 bg-white rounded-2xl shadow-2xl p-2 border border-valentine-accent/10 z-[60]">
                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          navigate("/admin");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-valentine-bg/60 text-sm font-semibold"
                      >
                        <Shield className="h-5 w-5 text-valentine-primary" />
                        Admin Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          navigate("/admin/kyc");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-valentine-bg/60 text-sm font-semibold"
                      >
                        <ClipboardCheck className="h-5 w-5 text-valentine-primary" />
                        KYC Review
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Account */}
              <button
                onClick={() => goIfVerified("/profile")}
                className="flex items-center space-x-1 text-valentine-dark hover:text-valentine-primary transition-colors"
                aria-label="Account"
              >
                <User className="h-6 w-6" />
                <span className="font-medium">Account</span>
              </button>

              {/* Cart */}
              <button
                onClick={() => goIfVerified("/cart")}
                className="text-valentine-dark hover:text-valentine-primary transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="h-6 w-6" />
              </button>

              {/* Logout */}
              {user && (
                <button
                  onClick={logout}
                  className="text-valentine-dark hover:text-valentine-primary transition-colors"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;