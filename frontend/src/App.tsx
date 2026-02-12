import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFA from "./pages/TwoFA";
import CreateProduct from "./pages/CreateProduct";
import Profile from "./pages/Profile";
import CreateListing from "./pages/CreateListing";
import CategoryPage from "./pages/CategoryPage";
import KYC from "./pages/KYC";
import LoadingOverlay from "./components/LoadingOverlay";

import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminKycList from "./pages/admin/AdminKycList";
import AdminKycReview from "./pages/admin/AdminKycReview";

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  // Synchronous state adjustment to prevent flash of content (FOC)
  // This triggers a re-render before the browser paints the new route
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setIsLoading(true);
  }

  // Handle automatic timeout for the loading overlay
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700); // Slightly faster for better responsiveness
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen flex flex-col bg-valentine-bg/30 text-valentine-dark relative">
      <LoadingOverlay isLoading={isLoading} />
      <Navbar />
      <main
        className={`flex-grow transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/2fa" element={<TwoFA />} />
          <Route path="/create-product" element={<CreateProduct />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />

          <Route
            path="/kyc"
            element={
              <RequireAuth>
                <KYC />
              </RequireAuth>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />

          <Route
            path="/admin/kyc"
            element={
              <RequireAdmin>
                <AdminKycList />
              </RequireAdmin>
            }
          />

          <Route
            path="/admin/kyc/:id"
            element={
              <RequireAdmin>
                <AdminKycReview />
              </RequireAdmin>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
