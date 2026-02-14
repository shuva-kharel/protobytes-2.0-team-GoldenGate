import Navbar from "./Navbar";
import Footer from "./Footer";
import LoveParticles from "../effects/LoveParticles";

export default function PageShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-rose-50 via-white to-rose-100">
      <LoveParticles />
      <Navbar />
      <div className="w-full bg-red-600 py-1 text-center text-sm font-medium text-white shadow-sm">
        0% commission for all items this Valentines! ❤️
      </div>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
