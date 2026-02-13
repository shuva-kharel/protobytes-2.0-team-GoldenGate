import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productRequestApi } from "../../../api/productRequestApi";

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function RequestList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productRequestApi.list({
        q: query.trim(),
        location: location.trim(),
        category: category.trim(),
      });
      setItems(res.data?.items || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load product requests");
    } finally {
      setLoading(false);
    }
  }, [query, location, category]);

  useEffect(() => {
    load();
  }, [load]);

  const onSearch = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <section className="max-w-6xl mx-auto py-8 px-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Requests</h1>
          <p className="text-sm text-slate-600">People looking to borrow specific products.</p>
        </div>
        <Link
          to="/requests/new"
          className="rounded-lg bg-rose-600 text-white px-4 py-2 text-sm hover:bg-rose-700"
        >
          Post a Request
        </Link>
      </div>

      <form
        onSubmit={onSearch}
        className="rounded-xl border bg-white p-3 grid md:grid-cols-4 gap-2"
      >
        <input
          className="rounded-md border px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title"
        />
        <input
          className="rounded-md border px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
        />
        <input
          className="rounded-md border px-3 py-2 text-sm"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 text-white text-sm px-3 py-2 hover:bg-black"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="text-sm text-slate-500">Loading requests...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-white p-5 text-sm text-slate-600">
          No open requests found.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item) => (
            <article key={item._id} className="rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {item.category} · {item.location}
              </p>

              <div className="mt-3 text-sm text-slate-700 space-y-1">
                <p>
                  Budget: <strong>Rs {Number(item.maxBorrowPrice || 0).toLocaleString()}</strong>
                </p>
                <p>
                  Needed: {fmtDate(item.neededFrom)} to {fmtDate(item.neededTo)}
                </p>
              </div>

              <p className="mt-3 text-sm text-slate-700 line-clamp-4 whitespace-pre-wrap">
                {item.description || "No additional details."}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <Link
                  to={`/chat/${item.createdBy?.user}`}
                  className="rounded-md bg-rose-600 text-white text-sm px-3 py-1.5 hover:bg-rose-700"
                >
                  Contact
                </Link>
                <span className="text-xs text-slate-500">
                  by @{item.createdBy?.username || "user"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
