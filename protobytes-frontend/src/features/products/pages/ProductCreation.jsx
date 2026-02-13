// src/features/product/pages/ProductCreation.jsx
import React, { useEffect, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";
import ProductForm from "./ProductForm";
import { useNavigate } from "react-router-dom";

/** Simple Modal (reuse across app if you want) */
function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border border-rose-100 p-5">
        {title && (
          <h3 className="text-lg font-semibold mb-2 text-rose-700">{title}</h3>
        )}
        <div className="text-sm text-gray-700 space-y-3">{children}</div>
        <div className="mt-4 flex items-center justify-end gap-2">
          {actions}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductCreation() {
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [successMessage, setSuccessMessage] = useState(
    "Your product submission was received.",
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!successOpen) return;
    setCountdown(3);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          navigate("/products/mine");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [successOpen, navigate]);

  const handleCreate = async (data) => {
    try {
      setSubmitting(true);
      const res = await axiosClient.post("/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMessage(
        res.data?.message || "Your product submission was received.",
      );
      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold font-display brand-gradient">
          नयाँ प्रोडक्ट थप्नुहोस्
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          High-quality details and images improve trust and approvals.
        </p>
      </div>

      <ProductForm
        mode="create"
        onSubmit={handleCreate}
        submitting={submitting}
      />

      {/* Success Modal */}
      <Modal
        open={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          navigate("/products/mine");
        }}
        title="🎉 Product created successfully!"
        actions={
          <>
            <button
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                setSuccessOpen(false);
                navigate("/products/mine");
              }}
            >
              Go to My Products
            </button>
          </>
        }
      >
        <p>{successMessage}</p>
        <p className="text-gray-600">
          Redirecting to <strong>My Products</strong> in{" "}
          <strong>{countdown}</strong>…
        </p>
      </Modal>
    </div>
  );
}
