export default function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl border border-rose-200 bg-white/90 backdrop-blur " +
        "shadow-[0_10px_30px_rgba(244,63,94,0.12)] " +
        className
      }
    >
      {children}
    </div>
  );
}
