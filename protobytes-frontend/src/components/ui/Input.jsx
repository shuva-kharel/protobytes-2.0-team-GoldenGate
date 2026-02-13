export default function Input({
  label,
  error,
  className = "",
  inputClassName = "",
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <label className="mb-1.5 block text-sm font-semibold text-rose-800">
          {label}
        </label>
      ) : null}

      <input
        className={
          "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-rose-900 " +
          "placeholder:text-rose-300 outline-none transition " +
          "focus:border-rose-400 focus:ring-2 focus:ring-rose-200 " +
          (error ? "border-red-300" : "border-rose-200") +
          ` ${inputClassName}`
        }
        {...props}
      />

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
