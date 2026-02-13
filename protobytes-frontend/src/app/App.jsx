// src/app/App.jsx
import PageShell from "../components/layout/PageShell";
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <PageShell>
      {/* Main content area */}
      <main className="flex-1">
        <Outlet /> {/* <-- Nested routes render here */}
      </main>
    </PageShell>
  );
}
