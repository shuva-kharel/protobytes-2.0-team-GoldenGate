import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productRequestApi } from "../../../api/productRequestApi";

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function MyRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await productRequestApi.mine();
      setItems(res.data?.items || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load your requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const closeRequest = async (id) => {
    if (!confirm("Close this request?")) return;
    try {
      setBusy(`close:${id}`);
      await productRequestApi.close(id);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to close request");
    } finally {
      setBusy("");
    }
  };

  const deleteRequest = async (id) => {
    if (!confirm("Delete this request permanently?")) return;
    try {
      setBusy(`delete:${id}`);
      await productRequestApi.remove(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete request");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="max-w-5xl mx-auto py-8 px-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
          <p className="text-sm text-slate-600">Manage requests you posted.</p>
        </div>
        <Link
          to="/requests/new"
          className="rounded-lg bg-rose-600 text-white px-4 py-2 text-sm hover:bg-rose-700"
        >
          New Request
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading requests...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-white p-5 text-sm text-slate-600">
          You have not posted any request yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isClosed = item.status === "closed";
            return (
              <article key={item._id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">{item.title}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.category} · {item.location}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {fmtDate(item.neededFrom)} to {fmtDate(item.neededTo)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium border ${
                      isClosed
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {item.description && (
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{item.description}</p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  {!isClosed && (
                    <button
                      onClick={() => closeRequest(item._id)}
                      disabled={busy === `close:${item._id}`}
                      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                    >
                      {busy === `close:${item._id}` ? "Closing..." : "Close"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteRequest(item._id)}
                    disabled={busy === `delete:${item._id}`}
                    className="rounded-md border border-rose-200 text-rose-700 px-3 py-1.5 text-sm hover:bg-rose-50 disabled:opacity-60"
                  >
                    {busy === `delete:${item._id}` ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
