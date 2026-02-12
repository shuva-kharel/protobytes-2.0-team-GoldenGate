import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { mockListings } from '../data/mockData';
import ListingCard from '../components/ListingCard';
import CategorySidebar from '../components/CategorySidebar';
import BannerCarousel from '../components/BannerCarousel';
import PromotionalAlert from '../components/PromotionalAlert';
import ItemModal from '../components/ItemModal';
import { Listing } from '../data/mockData';

const Home: React.FC = () => {
  const [selectedMainCategory, setSelectedMainCategory] = useState('All');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (listing: Listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  // Featured listings (Community Picks)
  const featuredListings = mockListings.slice(0, 3);
  
  // Flash Sale listings (Mocked)
  const promoListings = mockListings.slice(2, 5);

  return (
    <div className="bg-valentine-bg/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Promotional Alert */}
        <div className="mb-6">
          <PromotionalAlert />
        </div>

        {/* Top Section: Sidebar + Carousel */}
        <div className="flex gap-6 mb-12">
          <CategorySidebar />
          <div className="flex-grow overflow-hidden">
            <BannerCarousel />
          </div>
        </div>

        {/* Section: Community Picks (Flash Sale Style) */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-3">
               <h2 className="text-2xl font-black text-valentine-dark uppercase tracking-tight flex items-center">
                 <Zap className="h-6 w-6 text-valentine-primary fill-valentine-primary mr-2" />
                 Community Picks
               </h2>
               <div className="hidden sm:flex items-center space-x-2 bg-valentine-primary/10 px-3 py-1 rounded-lg">
                  <span className="text-xs font-bold text-valentine-primary">ENDS IN</span>
                  <span className="text-xs font-mono font-bold bg-valentine-primary text-white p-1 rounded">08:24:12</span>
               </div>
             </div>
             <button className="text-valentine-primary font-bold flex items-center hover:translate-x-1 transition-transform">
               <span>View All</span>
               <ArrowRight className="h-4 w-4 ml-1" />
             </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {promoListings.map((listing, idx) => (
               <ListingCard 
                 key={listing.id} 
                 listing={listing} 
                 onClick={handleOpenModal}
               />
             ))}
          </div>
        </section>

        {/* Section: Just For You (Main Grid Style) */}
        <section className="pb-20">
          <div className="mb-8 p-4 bg-white/50 backdrop-blur-sm rounded-2xl inline-block border border-valentine-accent/10">
             <h2 className="text-xl font-bold text-valentine-dark flex items-center">
               <Sparkles className="h-5 w-5 mr-2 text-valentine-primary" />
               Just For You
             </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {mockListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 4) * 0.1 }}
              >
                <ListingCard 
                  listing={listing} 
                  onClick={handleOpenModal}
                />
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
             <button className="btn-secondary px-12 py-3 border-2 border-valentine-primary text-valentine-primary hover:bg-valentine-primary hover:text-white font-black uppercase tracking-widest text-sm shadow-xl">
               Load More
             </button>
          </div>
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
