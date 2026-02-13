// src/app/routes.jsx
import { createBrowserRouter } from "react-router-dom";

import App from "./App";

// Pages
import Home from "../features/home/pages/Home.jsx";
import LandingPage from "../features/landing/pages/LandingPage.jsx";
import Register from "../features/auth/pages/Register";
import VerifyEmail from "../features/auth/pages/VerifyEmail";
import Login from "../features/auth/pages/Login";
import TwoFA from "../features/auth/pages/TwoFA";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import ResetPassword from "../features/auth/pages/ResetPassword";
import Settings from "../features/profile/pages/Settings";
import PublicProfile from "../features/profile/pages/PublicProfile";

// KYC & Admin
import KycForm from "../features/kyc/pages/KycForm";
import KycStatus from "../features/kyc/pages/KycStatus";
import KycAdmin from "../features/admin/pages/KycAdmin";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import AdminUsers from "../features/admin/pages/AdminUsers";
import AdminReports from "../features/admin/pages/AdminReports";
import AdminSettings from "../features/admin/pages/AdminSettings";

// Components
import ProtectedRoute from "../components/common/ProtectedRoute";

// Products
import ProductCreation from "../features/products/pages/ProductCreation.jsx";
import MyProducts from "../features/products/pages/MyProducts.jsx";
import ProductEdit from "../features/products/pages/ProductEdit.jsx";
import ChatPage from "../features/chat/pages/ChatPage.jsx";
import RequestList from "../features/requests/pages/RequestList.jsx";
import CreateRequest from "../features/requests/pages/CreateRequest.jsx";
import MyRequests from "../features/requests/pages/MyRequests.jsx";

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
      { index: true, element: <LandingPage /> },
      { path: "home", element: <Home /> },

      // Profile
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: "user/username/:username",
        element: <PublicProfile />,
      },
      {
        path: "user/:id",
        element: <PublicProfile />,
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
            <AdminUsers />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/reports",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminReports />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/settings",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminSettings />
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
      {
        path: "chat",
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "chat/:userId",
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "requests",
        element: <RequestList />,
      },
      {
        path: "requests/new",
        element: (
          <ProtectedRoute>
            <CreateRequest />
          </ProtectedRoute>
        ),
      },
      {
        path: "requests/mine",
        element: (
          <ProtectedRoute>
            <MyRequests />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
