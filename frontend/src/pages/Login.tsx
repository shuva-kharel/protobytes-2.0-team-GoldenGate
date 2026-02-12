import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const state = location.state as { mode?: 'login' | 'signup' };
    if (state?.mode === 'signup') {
      setIsLogin(false);
    } else if (state?.mode === 'login') {
      setIsLogin(true);
    }
  }, [location.state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication
    if (isLogin) {
      navigate('/');
    } else {
      navigate('/kyc');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-valentine-secondary blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-valentine-accent blur-[120px] rounded-full"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md rounded-[2.5rem] p-10 relative"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-valentine-primary/10 rounded-2xl mb-6">
            <img src="/logo.jpg" alt="Aincho Paincho Logo" className="h-8 w-8 object-contain" />
          </div>
          <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Welcome Back!' : 'Join Aincho Paincho'}</h2>
          <p className="text-valentine-dark/60">
            {isLogin ? 'Login to connect with your neighbors' : 'Start sharing and building your community'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-2 text-valentine-dark/70">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-valentine-dark/40" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 border-none ring-1 ring-valentine-accent/30 focus:ring-2 focus:ring-valentine-primary transition-all shadow-sm"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold ml-2 text-valentine-dark/70">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-valentine-dark/40" />
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 border-none ring-1 ring-valentine-accent/30 focus:ring-2 focus:ring-valentine-primary transition-all shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold ml-2 text-valentine-dark/70">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-valentine-dark/40" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 border-none ring-1 ring-valentine-accent/30 focus:ring-2 focus:ring-valentine-primary transition-all shadow-sm"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-4 text-lg mt-4 flex items-center justify-center space-x-2">
            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-valentine-dark/60">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 font-bold text-valentine-primary hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
