import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Bell, PlusCircle, ShoppingCart, MessageSquare } from 'lucide-react';
import { auth } from '../data/mockData';

const Navbar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifyPopup, setShowNotifyPopup] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm);
    }
  };

  const handleProtectedAction = (path: string) => {
    if (!auth.isLoggedIn) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const handleNotificationClick = () => {
    if (!auth.isLoggedIn) {
      setShowNotifyPopup(!showNotifyPopup);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-valentine-accent/10 shadow-sm py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Logo Section */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.jpg" alt="Aincho Paincho Logo" className="h-8 w-8 object-contain" />
              <span className="text-2xl font-bold text-valentine-dark tracking-tight">Aincho Paincho</span>
            </Link>
            
            {/* Mobile Icons */}
            <div className="flex md:hidden items-center space-x-4">
               <button onClick={() => handleProtectedAction('/profile')}><User className="h-6 w-6 text-valentine-dark" /></button>
               <button onClick={() => handleProtectedAction('/cart')}><ShoppingCart className="h-6 w-6 text-valentine-dark" /></button>
            </div>
          </div>

          {/* Search Bar - Centered & Wide (Daraz Style) */}
          <div className="flex-grow w-full max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search in Aincho Paincho..."
                className="w-full pl-5 pr-12 py-2.5 rounded-xl bg-valentine-bg/50 border-none ring-1 ring-valentine-accent/20 focus:ring-2 focus:ring-valentine-primary outline-none transition-all placeholder:text-valentine-dark/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                type="submit" 
                className="absolute right-1 top-1 bottom-1 px-4 bg-valentine-primary text-white rounded-lg hover:bg-valentine-dark transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Desktop Right Section Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => handleProtectedAction('/create-listing')}
              className="flex items-center space-x-1.5 text-valentine-dark hover:text-valentine-primary font-semibold transition-colors bg-valentine-bg/30 px-3 py-1.5 rounded-lg whitespace-nowrap"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Share Item</span>
            </button>
            
            <div className="flex items-center space-x-5">
              <button 
                onClick={() => handleProtectedAction('/messages')}
                className="text-valentine-dark hover:text-valentine-primary transition-colors"
              >
                <MessageSquare className="h-6 w-6" />
              </button>

              <div className="relative flex items-center">
                <button 
                  onClick={handleNotificationClick}
                  className="text-valentine-dark hover:text-valentine-primary transition-colors relative flex items-center justify-center"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-valentine-primary rounded-full border-2 border-white"></span>
                </button>

                {showNotifyPopup && (
                  <div className="absolute top-12 right-0 w-64 bg-white rounded-2xl shadow-2xl p-4 border border-valentine-accent/10 animate-in fade-in zoom-in duration-200 z-[60]">
                    <div className="flex items-center space-x-3 mb-2">
                       <div className="bg-valentine-primary/10 p-2 rounded-lg">
                          <Bell className="h-5 w-5 text-valentine-primary" />
                       </div>
                       <p className="text-sm font-bold text-valentine-dark">Notification Center</p>
                    </div>
                    <p className="text-xs text-valentine-dark/60 leading-relaxed">
                      Please <Link to="/login" state={{ mode: 'login' }} className="text-valentine-primary font-black hover:underline" onClick={() => setShowNotifyPopup(false)}>Login</Link>/<Link to="/login" state={{ mode: 'signup' }} className="text-valentine-primary font-black hover:underline" onClick={() => setShowNotifyPopup(false)}>signup</Link> to access notifications.
                    </p>
                    <button 
                      onClick={() => setShowNotifyPopup(false)}
                      className="mt-3 w-full py-1.5 rounded-lg bg-valentine-bg hover:bg-valentine-accent/10 text-xs font-bold text-valentine-dark transition-colors"
                    >
                      Close
                    </button>
                    <div className="absolute -top-1 right-3 w-3 h-3 bg-white rotate-45 border-l border-t border-valentine-accent/10"></div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => handleProtectedAction('/profile')}
                className="flex items-center space-x-1 text-valentine-dark hover:text-valentine-primary transition-colors group"
              >
                <User className="h-6 w-6" />
                <span className="font-medium">Account</span>
              </button>
              
              <button 
                onClick={() => handleProtectedAction('/cart')}
                className="text-valentine-dark hover:text-valentine-primary transition-colors"
              >
                 <ShoppingCart className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
