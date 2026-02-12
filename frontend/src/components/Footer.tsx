import React from 'react';
import { Heart, Github, Twitter, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-valentine-dark text-valentine-light py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.jpg" alt="Aincho Paincho Logo" className="h-6 w-6 object-contain" />
              <span className="text-xl font-bold tracking-tight">Aincho Paincho</span>
            </div>
            <p className="text-valentine-light/70 max-w-sm">
              Empowering communities to share, care, and build stronger relationships through local resource sharing.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 text-valentine-light/60">
              <li><a href="#" className="hover:text-valentine-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-valentine-primary transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-valentine-primary transition-colors">Safety Guidelines</a></li>
              <li><a href="#" className="hover:text-valentine-primary transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Community</h4>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-valentine-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-valentine-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-valentine-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-valentine-light/40">
          <p>&copy; {new Date().getFullYear()} Aincho Paincho. Built with love for your neighborhood.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
