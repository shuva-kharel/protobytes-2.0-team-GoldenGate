// MyRequests.jsx
import { useEffect, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axiosClient
      .get("/borrow/mine")
      .then((res) => setRequests(res.data.requests));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Borrow Requests</h1>
      {requests.length === 0 ? (
        <p>No requests yet.</p>
      ) : (
        requests.map((r) => (
          <div key={r._id} className="border p-4 rounded shadow mb-2">
            <h2>{r.product.name}</h2>
            <p>Status: {r.status}</p>
            <p>
              Borrow from {new Date(r.startDate).toLocaleDateString()} to{" "}
              {new Date(r.endDate).toLocaleDateString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
