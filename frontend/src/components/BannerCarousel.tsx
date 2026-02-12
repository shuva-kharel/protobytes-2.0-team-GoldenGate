import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const banners = [
  {
    id: 1,
    title: "Valentine's Community Special",
    subtitle: "Share tools and create memories together",
    bg: "bg-valentine-primary",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200"
  },
  {
    id: 2,
    title: "New Skills This Spring",
    subtitle: "Learn guitar or baking from your neighbors",
    bg: "bg-valentine-dark",
    image: "https://images.unsplash.com/photo-1550507992-054452597371?auto=format&fit=crop&q=80&w=1200"
  }
];

const BannerCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[300px] lg:h-[400px] w-full bg-valentine-accent/10 rounded-2xl overflow-hidden shadow-sm group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img 
            src={banners[current].image} 
            alt={banners[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-12 lg:px-20">
            <div className="max-w-md text-white">
              <motion.h2 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl lg:text-5xl font-bold mb-4"
              >
                {banners[current].title}
              </motion.h2>
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-white/80"
              >
                {banners[current].subtitle}
              </motion.p>
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 bg-white text-valentine-primary px-8 py-3 rounded-xl font-bold hover:bg-valentine-bg transition-colors shadow-lg"
              >
                Explore Now
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button 
        onClick={() => setCurrent((prev) => (prev > 0 ? prev - 1 : banners.length - 1))}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button 
        onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${current === i ? 'bg-white w-8' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;
