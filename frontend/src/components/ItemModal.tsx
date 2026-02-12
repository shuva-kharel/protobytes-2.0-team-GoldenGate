import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, User, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Listing } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

interface ItemModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ listing, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [days, setDays] = React.useState(1);

  if (!listing) return null;

  const handleRentNow = () => {
    onClose();
    navigate('/login');
  };

  const totalPrice = listing.pricePerDay * days;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-valentine-dark/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-valentine-dark hover:bg-valentine-primary hover:text-white transition-all shadow-md"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Left: Image Area */}
            <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden relative">
              <img 
                src={listing.image} 
                alt={listing.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-8 left-8 right-8 bg-white/20 backdrop-blur-xl p-6 rounded-3xl border border-white/30 text-white">
                <p className="text-sm font-black uppercase tracking-widest opacity-80 mb-1">Total Rental Cost</p>
                <motion.div 
                  key={totalPrice}
                  initial={{ scale: 1.1, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-black"
                >
                  ${totalPrice}
                </motion.div>
                <p className="text-xs mt-2 font-bold opacity-60">Calculated for {days} {days === 1 ? 'day' : 'days'}</p>
              </div>
            </div>

            {/* Right: Content */}
            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
              <div className="mb-6">
                <span className="bg-valentine-primary/10 text-valentine-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                  {listing.category} • ${listing.pricePerDay}/day
                </span>
                <h2 className="text-3xl font-black text-valentine-dark leading-tight mb-2">
                  {listing.title}
                </h2>
                <div className="flex items-center space-x-4 text-valentine-dark/60 text-sm">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-valentine-primary" />
                    <span>{listing.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-valentine-primary" />
                    <span>{listing.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                {/* Duration Picker */}
                <div className="bg-valentine-bg/30 p-6 rounded-3xl border border-valentine-accent/5">
                  <h4 className="text-sm font-black text-valentine-dark/40 uppercase tracking-widest mb-4">Select Duration</h4>
                  <div className="flex items-center justify-between space-x-4">
                    <button 
                      onClick={() => setDays(Math.max(1, days - 1))}
                      className="w-12 h-12 rounded-xl bg-white border border-valentine-accent/10 flex items-center justify-center font-black text-xl hover:bg-valentine-primary hover:text-white transition-all shadow-sm"
                    >
                      -
                    </button>
                    <div className="flex-grow text-center">
                      <span className="text-2xl font-black text-valentine-dark">{days}</span>
                      <span className="text-sm font-bold text-valentine-dark/40 ml-2">{days === 1 ? 'Day' : 'Days'}</span>
                    </div>
                    <button 
                      onClick={() => setDays(days + 1)}
                      className="w-12 h-12 rounded-xl bg-white border border-valentine-accent/10 flex items-center justify-center font-black text-xl hover:bg-valentine-primary hover:text-white transition-all shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-valentine-dark/40 uppercase tracking-widest mb-3">Posted By</h4>
                  <div className="flex items-center space-x-3">
                    <img src={listing.authorAvatar} alt={listing.author} className="w-10 h-10 rounded-full border-2 border-valentine-accent/20" />
                    <div>
                      <p className="font-bold text-valentine-dark">{listing.author}</p>
                      <div className="flex items-center text-xs text-green-500 font-bold">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified Member
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-valentine-primary/5 rounded-2xl p-4 border border-valentine-primary/10 flex items-center space-x-4">
                  <div className="bg-white p-2.5 rounded-xl shadow-sm">
                    <Zap className="h-5 w-5 text-valentine-primary fill-valentine-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-valentine-primary uppercase">Valentine's Special</p>
                    <p className="text-sm text-valentine-dark/60">0% Commision Applied!</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleRentNow}
                className="w-full bg-valentine-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl shadow-valentine-primary/20 hover:bg-valentine-dark hover:shadow-2xl hover:shadow-valentine-primary/30 transition-all flex items-center justify-center space-x-3"
              >
                <span>Rent Now for ${totalPrice}</span>
                <ArrowRight className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ItemModal;
