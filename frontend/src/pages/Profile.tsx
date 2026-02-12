import React from 'react';
import { currentUser, mockListings } from '../data/mockData';
import { MapPin, Settings, Package, RotateCcw, Award, Heart } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  const userListings = mockListings.filter(l => l.author === currentUser.name);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Sidebar / Info */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-[2.5rem] p-8 space-y-8 sticky top-24 border-none"
          >
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl"
                />
                <div className="absolute bottom-0 right-0 p-2 bg-valentine-primary rounded-full text-white shadow-lg">
                   <Settings className="h-5 w-5" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <div className="flex items-center justify-center text-valentine-dark/60 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{currentUser.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-valentine-accent/10 p-4 rounded-2xl text-center">
                <span className="block text-2xl font-bold text-valentine-primary">{currentUser.itemsShared}</span>
                <span className="text-xs font-semibold text-valentine-dark/50 uppercase">Shared</span>
              </div>
              <div className="bg-valentine-accent/10 p-4 rounded-2xl text-center">
                <span className="block text-2xl font-bold text-valentine-primary">{currentUser.itemsBorrowed}</span>
                <span className="text-xs font-semibold text-valentine-dark/50 uppercase">Borrowed</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-valentine-dark/40">Bio</h4>
              <p className="text-valentine-dark/70 text-sm leading-relaxed">
                Passionate about building a sustainable neighborhood. Happy to share my tools and help with any plant-related questions!
              </p>
            </div>

            <div className="pt-6 border-t border-valentine-accent/20">
              <div className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center text-valentine-dark/70">
                  <Award className="h-4 w-4 mr-2 text-valentine-primary" />
                  <span>Trust Rating</span>
                </div>
                <span className="text-valentine-primary font-bold">{currentUser.rating}/5.0</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-12">
          {/* Tabs header */}
          <div className="flex items-center space-x-8 border-b border-valentine-accent/20 pb-4">
             <button className="flex items-center space-x-2 text-valentine-primary font-bold border-b-2 border-valentine-primary pb-4 -mb-[18px]">
               <Package className="h-5 w-5" />
               <span>My Shared Items</span>
             </button>
             <button className="flex items-center space-x-2 text-valentine-dark/50 font-bold border-b-2 border-transparent pb-4 -mb-[18px] hover:text-valentine-primary transition-colors">
               <RotateCcw className="h-5 w-5" />
               <span>Borrowing History</span>
             </button>
             <button className="flex items-center space-x-2 text-valentine-dark/50 font-bold border-b-2 border-transparent pb-4 -mb-[18px] hover:text-valentine-primary transition-colors">
               <Heart className="h-5 w-5" />
               <span>Favorites</span>
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {userListings.length > 0 ? (
              userListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            ) : (
              <div className="col-span-full py-20 bg-valentine-accent/5 rounded-[2.5rem] border-2 border-dashed border-valentine-accent/20 text-center">
                 <Package className="h-12 w-12 text-valentine-accent/40 mx-auto mb-4" />
                 <h3 className="font-bold text-lg mb-1">No items shared yet</h3>
                 <p className="text-valentine-dark/50 mb-6">Start by listing your first item or service!</p>
                 <button className="btn-primary">Share an Item</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
