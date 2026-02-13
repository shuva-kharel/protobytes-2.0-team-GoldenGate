export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-rose-600 text-white hover:bg-rose-700 shadow-glow",
    secondary: "bg-rose-100 text-rose-800 hover:bg-rose-200",
    outline: "border border-rose-300 text-rose-700 hover:bg-rose-50",
    ghost: "text-rose-700 hover:bg-rose-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
