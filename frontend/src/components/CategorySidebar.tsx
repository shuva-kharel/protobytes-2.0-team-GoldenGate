import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Hammer, 
  Zap, 
  BookOpen, 
  Car, 
  Home, 
  Smartphone, 
  Gamepad2, 
  ChevronRight 
} from 'lucide-react';

const categories = [
  { id: 'tools', name: 'Tools & DIY', icon: <Hammer className="h-4 w-4" /> },
  { id: 'electronics', name: 'Electronics', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'appliances', name: 'Home Appliances', icon: <Home className="h-4 w-4" /> },
  { id: 'outdoor', name: 'Outdoor & Garden', icon: <Zap className="h-4 w-4" /> },
  { id: 'automotive', name: 'Automotive', icon: <Car className="h-4 w-4" /> },
  { id: 'entertainment', name: 'Entertainment', icon: <Gamepad2 className="h-4 w-4" /> },
  { id: 'others', name: 'Others', icon: <ShoppingBag className="h-4 w-4" /> },
];

const CategorySidebar: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-valentine-accent/10 py-2 w-full lg:w-64 self-start hidden lg:block">
      <div className="px-4 py-2 border-b border-valentine-accent/5 mb-2">
        <h3 className="font-bold text-sm text-valentine-dark/60 uppercase tracking-wider">Categories</h3>
      </div>
      <ul className="space-y-0.5">
        {categories.map((cat, index) => (
          <li key={index} className="group">
            <Link 
              to={`/category/${cat.id}`}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-valentine-dark/80 hover:bg-valentine-bg hover:text-valentine-primary transition-all rounded-lg mx-2"
            >
              <div className="flex items-center space-x-3">
                <span className="text-valentine-primary opacity-70 group-hover:opacity-100">{cat.icon}</span>
                <span>{cat.name}</span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-40 transition-opacity" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategorySidebar;
