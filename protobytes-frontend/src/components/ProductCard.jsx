import Badge from "../../../components/ui/Badge";

export default function ProductCard({ product, onClick }) {
  const imageUrl =
    product?.image?.url ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop";

  const statusLabel = product?.status || "available";

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl overflow-hidden border border-rose-200 bg-white/90 hover:shadow-glow transition shadow-sm"
    >
      <div className="relative h-44 w-full">
        <img
          src={imageUrl}
          alt={product?.name || "Product"}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        <div className="absolute top-3 left-3 flex gap-2">
          {product?.category ? <Badge>{product.category}</Badge> : null}
          <Badge variant={statusLabel === "available" ? "green" : "gray"}>
            {statusLabel}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-rose-900 line-clamp-1">
            {product?.name}
          </h3>

          <span className="text-sm font-bold text-rose-700 whitespace-nowrap">
            Rs {product?.borrowPrice}/day
          </span>
        </div>

        <p className="text-sm text-rose-700 line-clamp-1">
          📍 {product?.location || "Unknown location"}
        </p>

        <p className="text-xs text-rose-500">
          Uploaded by <b>@{product?.uploadedBy?.username || "user"}</b>
        </p>
      </div>
    </button>
  );
}
