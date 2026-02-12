import React from 'react';
import { MapPin, Clock, Share2, Heart } from 'lucide-react';
import { Listing } from '../data/mockData';
import { motion } from 'framer-motion';

interface ListingCardProps {
  listing: Listing;
  onClick?: (listing: Listing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => onClick?.(listing)}
      className="glass-card rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-2xl transition-all duration-300 border-none cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-valentine-dark uppercase tracking-wider shadow-sm">
          {listing.category}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center space-x-2 mb-3">
          <img src={listing.authorAvatar} alt={listing.author} className="w-6 h-6 rounded-full border border-valentine-accent/30" />
          <span className="text-sm font-medium text-valentine-dark/60">{listing.author}</span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-valentine-dark line-clamp-1">{listing.title}</h3>
          <span className="text-valentine-primary font-black ml-2">${listing.pricePerDay}/day</span>
        </div>
        <p className="text-valentine-dark/60 text-sm mb-4 line-clamp-2">{listing.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-valentine-accent/20">
          <div className="flex flex-col text-xs text-valentine-dark/50 space-y-1">
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{listing.location}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{listing.createdAt}</span>
            </div>
          </div>
          <button className="flex items-center space-x-1 text-valentine-primary font-bold hover:translate-x-1 transition-transform">
            <span>Request</span>
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;
