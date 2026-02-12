import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockListings, Listing } from '../data/mockData';
import ListingCard from '../components/ListingCard';
import CategorySidebar from '../components/CategorySidebar';
import BannerCarousel from '../components/BannerCarousel';
import PromotionalAlert from '../components/PromotionalAlert';
import ItemModal from '../components/ItemModal';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (listing: Listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };
  
  // In a real app, you'd fetch data based on the category name/ID
  // For now, we'll filter our mock listings by a simplified match
  const filteredListings = mockListings.filter(listing => 
    listing.category.toLowerCase().includes(categoryId?.toLowerCase() || '')
    // Also matching against title/description just for better mock results
    || listing.title.toLowerCase().includes(categoryId?.toLowerCase() || '')
  );

  return (
    <div className="bg-valentine-bg/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Promotional Alert */}
        <div className="mb-6">
          <PromotionalAlert />
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-valentine-dark/60 mb-8 bg-white/50 w-fit px-4 py-2 rounded-xl border border-valentine-accent/10">
          <Link to="/" className="hover:text-valentine-primary flex items-center">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-bold text-valentine-dark capitalize">{categoryId}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Area */}
          <div className="flex flex-col gap-6 lg:w-64 flex-shrink-0">
             <CategorySidebar />
          </div>

          {/* Content Area */}
          <div className="flex-grow space-y-8">
             {/* Banner */}
             <div className="overflow-hidden">
                <BannerCarousel />
             </div>

            <div className="mb-8 p-4 bg-white/50 backdrop-blur-sm rounded-2xl inline-block border border-valentine-accent/10">
              <h1 className="text-3xl font-black text-valentine-dark capitalize mb-2">{categoryId}</h1>
              <p className="text-valentine-dark/60">{filteredListings.length} community listings found</p>
            </div>

            {filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredListings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ListingCard 
                      listing={listing} 
                      onClick={handleOpenModal}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-20 text-center border border-valentine-accent/10">
                <div className="bg-valentine-accent/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                  🔍
                </div>
                <h3 className="text-xl font-bold mb-2 text-valentine-dark">No listings found</h3>
                <p className="text-valentine-dark/60 max-w-sm mx-auto">
                  We couldn't find any items or services in this category right now. Try checking a different category!
                </p>
                <Link to="/" className="mt-8 inline-block bg-valentine-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-valentine-dark transition-all shadow-lg hover:shadow-valentine-primary/20">
                  Back to Marketplace
                </Link>
              </div>
            )}
          </div>
        </div>

        <ItemModal 
          listing={selectedListing} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </div>
  );
};

export default CategoryPage;
