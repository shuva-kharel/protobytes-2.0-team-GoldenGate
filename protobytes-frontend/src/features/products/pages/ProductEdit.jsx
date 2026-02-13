// src/features/product/pages/ProductEdit.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosClient } from "../../../api/axiosClient";
import ProductForm from "./ProductForm";

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosClient.get(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
        alert(err?.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleUpdate = async (data) => {
    try {
      setSubmitting(true);
      const res = await axiosClient.put(`/products/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Product updated!");
      console.log(res.data);
      navigate("/products/mine");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <p className="text-red-600">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Product</h1>
      <ProductForm
        mode="edit"
        initialData={product}
        onSubmit={handleUpdate}
        submitting={submitting}
      />
    </div>
  );
}
