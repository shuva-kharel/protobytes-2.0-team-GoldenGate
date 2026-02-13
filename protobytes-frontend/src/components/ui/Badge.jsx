export default function Badge({ children, variant = "pink", className = "" }) {
  const variants = {
    pink: "bg-rose-100 text-rose-800 border-rose-200",
    red: "bg-red-100 text-red-800 border-red-200",
    green: "bg-green-100 text-green-800 border-green-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold " +
        variants[variant] +
        " " +
        className
      }
    >
      {children}
    </span>
  );
}
