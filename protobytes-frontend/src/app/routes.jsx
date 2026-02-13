// src/app/routes.jsx
import { createBrowserRouter } from "react-router-dom";

import App from "./App";

import Home from "../features/home/pages/Home.jsx";
import Register from "../features/auth/pages/Register";
import VerifyEmail from "../features/auth/pages/VerifyEmail";
import Login from "../features/auth/pages/Login";
import TwoFA from "../features/auth/pages/TwoFA";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import ResetPassword from "../features/auth/pages/ResetPassword";

import Settings from "../features/profile/pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Layout wrapper
    children: [
      // 🔐 Auth Routes
      {
        path: "auth",
        children: [
          { path: "register", element: <Register /> },
          { path: "verify-email", element: <VerifyEmail /> },
          { path: "login", element: <Login /> },
          { path: "2fa", element: <TwoFA /> },
          { path: "forgot-password", element: <ForgotPassword /> },
          { path: "reset-password", element: <ResetPassword /> },
        ],
      },
      { path: "/", element: <Home /> }, // Homepage
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
]);
