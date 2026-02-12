import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Tag, Type, Info, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-valentine-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-valentine-primary/20">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Listing Created!</h2>
          <p className="text-valentine-dark/60">Your item has been shared with the community.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Share Something New</h1>
        <p className="text-valentine-dark/60">Fill in the details below to list your item or service.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card rounded-[2.5rem] p-10 space-y-8 border-none"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-2 text-valentine-dark/70 flex items-center">
                <Type className="h-4 w-4 mr-2" />
                Title
              </label>
              <input
                type="text"
                placeholder="e.g. Mountain Bike, Power Drill"
                className="w-full px-5 py-4 rounded-2xl bg-white/50 border-none ring-1 ring-valentine-accent/30 focus:ring-2 focus:ring-valentine-primary transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-2 text-valentine-dark/70 flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Category
              </label>
              <select className="w-full px-5 py-4 rounded-2xl bg-white/50 border-none ring-1 ring-valentine-accent/30 focus:ring-2 focus:ring-valentine-primary transition-all appearance-none cursor-pointer">
                <option value="tools">Tools & DIY</option>
                <option value="electronics">Electronics</option>
                <option value="appliances">Home Appliances</option>
                <option value="outdoor">Outdoor & Garden</option>
                <option value="automotive">Automotive</option>
                <option value="entertainment">Entertainment</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold ml-2 text-valentine-dark/70 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Pickup Location
              </label>
              <input
                type="text"
                placeholder="e.g. Maple Ridge, Downtown"
                className="w-full px-5 py-4 rounded-2xl bg-white/50 border-none ring-1 ring-valentine-accent/30 focus:ring-2 focus:ring-valentine-primary transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-2 text-valentine-dark/70 flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Photos
              </label>
              <div className="border-2 border-dashed border-valentine-accent/40 rounded-[2rem] h-[220px] flex flex-col items-center justify-center bg-white/20 hover:bg-white/40 transition-colors cursor-pointer group">
                 <Camera className="h-10 w-10 text-valentine-accent group-hover:text-valentine-primary transition-colors mb-2" />
                 <span className="text-sm font-medium text-valentine-dark/40 group-hover:text-valentine-primary transition-colors">Click to upload photos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold ml-2 text-valentine-dark/70 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Tell your neighbors more about what you're sharing..."
            className="w-full px-5 py-4 rounded-2xl bg-white/50 border-none ring-1 ring-valentine-accent/30 focus:ring-2 focus:ring-valentine-primary transition-all resize-none"
            required
          ></textarea>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="btn-primary px-12 py-4 text-lg">
            Create Listing
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateListing;
