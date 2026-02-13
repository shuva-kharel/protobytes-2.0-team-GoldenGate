import { useEffect, useMemo, useState } from "react";

import { productApi } from "../../../api/productApi";
import useDebounce from "../../../hooks/useDebounce";

import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Loading from "../../../components/common/Loading";

import ProductCard from "../components/ProductCard";

export default function ProductList() {
  // API state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data from server
  const [products, setProducts] = useState([]);

  // Filters
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 12;

  // Debounced inputs (auto-search)
  const debouncedQ = useDebounce(q, 500);
  const debouncedLocation = useDebounce(location, 500);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await productApi.list({
        q: debouncedQ.trim() || undefined,
        location: debouncedLocation.trim() || undefined,
        category: category === "all" ? undefined : category,
        page,
        limit,
      });

      const items = res.data?.items ?? [];
      setProducts(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, debouncedLocation, category]);

  // Fetch when page or filters change
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQ, debouncedLocation, category]);

  // Category dropdown options (based on fetched products)
  const categoryOptions = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [products]);

  // Client-side price filter
  const filteredProducts = useMemo(() => {
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    return products.filter((p) => {
      const bp = Number(p.borrowPrice || 0);
      if (min !== null && !Number.isNaN(min) && bp < min) return false;
      if (max !== null && !Number.isNaN(max) && bp > max) return false;
      return true;
    });
  }, [products, minPrice, maxPrice]);

  const clearFilters = () => {
    setQ("");
    setLocation("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-rose-700 drop-shadow">
          💘 Browse Products
        </h2>
        <p className="mt-2 text-rose-600">
          Search and filter products you can borrow.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            label="Search"
            placeholder="camera, laptop, tripod..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <Input
            label="Location"
            placeholder="Kathmandu"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          {/* Category dropdown */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-rose-800">
              Category
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm text-rose-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Rs/day"
              placeholder="100"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              inputMode="numeric"
            />

            <Input
              label="Max Rs/day"
              placeholder="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="md:col-span-4 flex flex-wrap gap-2 pt-1">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>

            <span className="text-sm text-rose-600 self-center">
              🔎 Search runs automatically (debounced)
            </span>
          </div>
        </div>
      </Card>

      {/* Loading & Error */}
      {loading && <Loading label="Loading products..." />}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Product grid */}
      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onClick={() => console.log("Open product:", p._id)}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center text-rose-600">
              No products found 💔 Try different filters.
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>

            <span className="text-sm font-semibold text-rose-700 px-3">
              Page {page}
            </span>

            <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
