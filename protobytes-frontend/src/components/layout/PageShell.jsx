import Navbar from "./Navbar";
import Footer from "./Footer";
import LoveParticles from "../effects/LoveParticles";

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100">
      <LoveParticles />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">{children}</main>
      <Footer />
    </div>
  );
}
