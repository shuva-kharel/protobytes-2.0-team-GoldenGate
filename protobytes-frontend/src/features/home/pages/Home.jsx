// src/features/home/pages/Home.jsx
import { useEffect, useState } from "react";
import { axiosClient } from "../../../api/axiosClient";
import { useAuth } from "../../auth/authStore";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Borrow a product (create borrow request + go to chat)
  // -----------------------------
  const handleBorrow = async (product) => {
    try {
      if (!product?._id) throw new Error("Product ID missing");

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7); // default borrow 1 week

      // Create borrow request via backend
      await axiosClient.post(`/borrow/${product._id}`, {
        startDate,
        endDate,
        message: `Hi, I want to borrow your ${product.name}`,
      });

      alert("Borrow request sent!");

      // Redirect to chat page with product context
      navigate(`/chat/${product.uploadedBy.user}?productId=${product._id}`);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to create borrow request",
      );
    }
  };

  // -----------------------------
  // Load products
  // -----------------------------
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/products");

      // Filter out own products
      const filtered = res.data.items.filter(
        (p) => user?._id !== p.uploadedBy.user,
      );

      setProducts(filtered);
      setFilteredProducts(filtered);
    } catch (err) {
      console.error(err);
      // alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  // -----------------------------
  // Search & filter logic
  // -----------------------------
  useEffect(() => {
    let temp = products;
    if (search)
      temp = temp.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    if (category) temp = temp.filter((p) => p.category === category);
    setFilteredProducts(temp);
  }, [search, category, products]);

  if (loading) return <p>Loading products...</p>;

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <section className="py-12 text-center">
      <h1 className="text-4xl font-extrabold text-rose-700 drop-shadow">
        💘 AinchoPaincho
      </h1>

      <div className="max-w-5xl mx-auto py-6">
        {/* Search & filter */}
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Furniture">Furniture</option>
          {/* Add more categories dynamically if needed */}
        </select>
      </div>

      <div className="max-w-5xl mx-auto py-10 space-y-6">
        <h1 className="text-3xl font-bold">All Products</h1>
        {filteredProducts.length === 0 && <p>No products available.</p>}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div key={p._id} className="border p-4 rounded shadow">
              {p.image?.url && (
                <img
                  src={p.image.url}
                  className="w-full h-40 object-cover mb-2"
                  alt={p.name}
                />
              )}
              <h2 className="font-semibold">{p.name}</h2>
              <p>Category: {p.category}</p>
              <p>Price: Rs {p.price || "N/A"}</p>
              <p>Borrow Price: Rs {p.borrowPrice}</p>
              <p>Location: {p.location}</p>
              <button
                className="mt-2 px-4 py-1 bg-rose-600 text-white rounded"
                onClick={() => handleBorrow(p)}
              >
                Borrow
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-rose-600">
        Borrow & lend products with verified accounts — safely and beautifully.
      </p>
    </section>
  );
}
