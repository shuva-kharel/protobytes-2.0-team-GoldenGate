import PageShell from "../components/layout/PageShell";
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <PageShell>
      <main className="flex-1">
        <Outlet /> {/* Nested routes render here */}
      </main>
    </PageShell>
  );
}
