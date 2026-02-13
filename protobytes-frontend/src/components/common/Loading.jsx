export default function Loading({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 shadow">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-300 border-t-rose-600" />
        <span className="text-sm font-semibold text-rose-700">{label}</span>
      </div>
    </div>
  );
}
