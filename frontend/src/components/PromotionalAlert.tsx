import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const PromotionalAlert: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-valentine-primary text-white py-2 px-4 shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-sm font-bold tracking-wide">
        <span>0% COMMISSION ON EVERY ITEM LENT IN THIS VALENTINES WEEK!!</span>
        <Heart className="h-4 w-4 fill-white" />
      </div>
    </motion.div>
  );
};

export default PromotionalAlert;
