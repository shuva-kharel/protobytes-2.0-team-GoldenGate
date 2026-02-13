// src/features/product/pages/ProductCreation.jsx
import React, { useState } from "react";
import { axiosClient } from "../../../api/axiosClient";
import ProductForm from "./ProductForm";

export default function ProductCreation() {
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (data) => {
    try {
      setSubmitting(true);
      const res = await axiosClient.post("/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Product created!");
      console.log(res.data);
      // Optional: redirect to My Products
      // navigate("/products/mine");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Product</h1>
      <ProductForm mode="create" onSubmit={handleCreate} submitting={submitting} />
    </div>
  );
}