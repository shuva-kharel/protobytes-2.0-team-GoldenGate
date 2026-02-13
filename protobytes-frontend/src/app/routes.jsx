// src/app/routes.jsx
import { createBrowserRouter } from "react-router-dom";

import App from "./App";

// Pages
import Home from "../features/home/pages/Home.jsx";
import Register from "../features/auth/pages/Register";
import VerifyEmail from "../features/auth/pages/VerifyEmail";
import Login from "../features/auth/pages/Login";
import TwoFA from "../features/auth/pages/TwoFA";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import ResetPassword from "../features/auth/pages/ResetPassword";
import Settings from "../features/profile/pages/Settings";

// KYC & Admin
import KycForm from "../features/kyc/pages/KycForm";
import KycStatus from "../features/kyc/pages/KycStatus";
import KycAdmin from "../features/admin/pages/KycAdmin";
import AdminDashboard from "../features/admin/pages/AdminDashboard";

// Components
import ProtectedRoute from "../components/common/ProtectedRoute";

// Products
import ProductCreation from "../features/products/pages/ProductCreation.jsx";
import MyProducts from "../features/products/pages/MyProducts.jsx";
import ProductEdit from "../features/products/pages/ProductEdit.jsx";

export const router = createBrowserRouter([
  // ---------------- Auth (no layout) ----------------
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  { path: "/2fa", element: <TwoFA /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // ---------------- App Layout ----------------
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },

      // Profile
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },

      // KYC
      {
        path: "kyc",
        element: (
          <ProtectedRoute>
            <KycForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "kyc/status",
        element: (
          <ProtectedRoute>
            <KycStatus />
          </ProtectedRoute>
        ),
      },

      // Admin
      {
        path: "admin/dashboard",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/kyc",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <KycAdmin />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <div>Users Management Page (TBD)</div>
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/reports",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <div>Reports Page (TBD)</div>
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/settings",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <div>Admin Settings Page (TBD)</div>
          </ProtectedRoute>
        ),
      },
      // inside routes:

      // Product routes
      {
        path: "products/new",
        element: (
          <ProtectedRoute>
            <ProductCreation />
          </ProtectedRoute>
        ),
      },
      {
        path: "products/mine",
        element: (
          <ProtectedRoute>
            <MyProducts />
          </ProtectedRoute>
        ),
      },
      {
        path: "products/:id/edit",
        element: (
          <ProtectedRoute>
            <ProductEdit />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
