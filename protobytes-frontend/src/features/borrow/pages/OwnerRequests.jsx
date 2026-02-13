// OwnerRequests.jsx
import { useEffect, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";

export default function OwnerRequests() {
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    const res = await axiosClient.get("/borrow/owner");
    setRequests(res.data.requests);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId) => {
    await axiosClient.patch(`/borrow/${requestId}/approve`);
    alert("Request approved!");
    loadRequests();
  };

  const handleReject = async (requestId) => {
    await axiosClient.patch(`/borrow/${requestId}/reject`, {
      reason: "Not available",
    });
    alert("Request rejected!");
    loadRequests();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Requests for My Products</h1>
      {requests.length === 0 ? (
        <p>No requests yet.</p>
      ) : (
        requests.map((r) => (
          <div key={r._id} className="border p-4 rounded shadow mb-2">
            <h2>{r.product.name}</h2>
            <p>Requested by: {r.borrower.username}</p>
            <p>Status: {r.status}</p>
            {r.status === "pending" && (
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded"
                  onClick={() => handleApprove(r._id)}
                >
                  Approve
                </button>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  onClick={() => handleReject(r._id)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
