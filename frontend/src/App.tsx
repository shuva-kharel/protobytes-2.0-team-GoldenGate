import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import CreateListing from './pages/CreateListing';
import CategoryPage from './pages/CategoryPage';
import KYC from './pages/KYC';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  // Synchronous state adjustment to prevent flash of content (FOC)
  // This triggers a re-render before the browser paints the new route
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setIsLoading(true);
  }

  // Handle automatic timeout for the loading overlay
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700); // Slightly faster for better responsiveness
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen flex flex-col bg-valentine-bg/30 text-valentine-dark relative">
      <LoadingOverlay isLoading={isLoading} />
      <Navbar />
      <main className={`flex-grow transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/kyc" element={<KYC />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
