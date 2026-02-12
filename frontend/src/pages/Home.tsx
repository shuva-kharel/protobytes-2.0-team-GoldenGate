import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap } from "lucide-react";

import ListingCard from "../components/ListingCard";
import CategorySidebar from "../components/CategorySidebar";
import BannerCarousel from "../components/BannerCarousel";
import PromotionalAlert from "../components/PromotionalAlert";
import ItemModal from "../components/ItemModal";

import { Listing } from "../data/mockData";
import { productApi, Product } from "../api/productApi";
import { useAuth } from "../context/AuthContext";

const Home: React.FC = () => {
  const { user } = useAuth();

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const openModal = (listing: Listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.list({ page: 1, limit: 60 });
      setProducts(res.data?.items || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ✅ Filter out MY products if logged in
  const otherProducts = useMemo(() => {
    if (!user) return products;

    return products.filter((p) => {
      const ownerId = p.uploadedBy?.user;
      const ownerUsername = p.uploadedBy?.username;

      // Exclude mine by user id or username
      if (ownerId && ownerId === user._id) return false;
      if (ownerUsername && ownerUsername === user.username) return false;

      return true;
    });
  }, [products, user]);

  const listings: Listing[] = useMemo(
    () => otherProducts.map(productToListing),
    [otherProducts],
  );

  const promoListings = listings.slice(0, 3);
  const gridListings = listings;

  return (
    <div className="bg-valentine-bg/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <PromotionalAlert />
        </div>

        <div className="flex gap-6 mb-12">
          <CategorySidebar />
          <div className="flex-grow overflow-hidden">
            <BannerCarousel />
          </div>
        </div>

        {/* Community Picks */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-valentine-dark uppercase tracking-tight flex items-center">
              <Zap className="h-6 w-6 text-valentine-primary fill-valentine-primary mr-2" />
              Community Picks
            </h2>

            <button className="text-valentine-primary font-bold flex items-center hover:translate-x-1 transition-transform">
              <span>View All</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {loading ? (
            <div className="text-center text-valentine-dark/60 py-10">
              Loading products...
            </div>
          ) : promoListings.length === 0 ? (
            <div className="text-center text-valentine-dark/60 py-10">
              No products available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promoListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={openModal}
                />
              ))}
            </div>
          )}
        </section>

        {/* Just For You */}
        <section className="pb-20">
          <div className="mb-8 p-4 bg-white/50 backdrop-blur-sm rounded-2xl inline-block border border-valentine-accent/10">
            <h2 className="text-xl font-bold text-valentine-dark flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-valentine-primary" />
              Just For You
            </h2>
          </div>

          {loading ? (
            <div className="text-center text-valentine-dark/60 py-10">
              Loading products...
            </div>
          ) : gridListings.length === 0 ? (
            <div className="text-center text-valentine-dark/60 py-10">
              No products to show.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {gridListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index % 4) * 0.08 }}
                >
                  <ListingCard listing={listing} onClick={openModal} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <ItemModal
          listing={selectedListing}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Home;
