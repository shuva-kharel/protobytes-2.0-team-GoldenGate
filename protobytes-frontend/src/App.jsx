// src/app/App.jsx
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useAuth } from "../features/auth/authStore";
import ProductList from "../features/products/pages/ProductList";

export default function App() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 p-6 text-rose-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-extrabold text-rose-700 drop-shadow">
          💘 Protobytes (Valentine Edition)
        </h1>

        <p className="mt-2 text-rose-700">
          Borrow & lend products with verified accounts.
        </p>

        <ProductList />

        <Card className="mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-rose-800">
                Auth Playground
              </h2>
              <p className="text-sm text-rose-600">
                Quick links to test all auth screens.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Badge variant="green">Logged in: {user.username}</Badge>
                  <Button variant="outline" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </>
              ) : (
                <Badge variant="pink">Not logged in</Badge>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Link to="/register">
              <Button className="w-full">Register 💖</Button>
            </Link>

            <Link to="/verify-email">
              <Button className="w-full" variant="secondary">
                Verify Email ✉️
              </Button>
            </Link>

            <Link to="/login">
              <Button className="w-full">Login 💌</Button>
            </Link>

            <Link to="/2fa">
              <Button className="w-full" variant="secondary">
                2FA 🔐
              </Button>
            </Link>

            <Link to="/forgot-password">
              <Button className="w-full" variant="outline">
                Forgot Password 💭
              </Button>
            </Link>

            <Link to="/reset-password">
              <Button className="w-full" variant="outline">
                Reset Password 🔁
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-rose-500">
            Tip: After Login step 1, go to <b>/2fa</b> to finish login.
          </p>
        </Card>
      </div>
    </div>
  );
}
