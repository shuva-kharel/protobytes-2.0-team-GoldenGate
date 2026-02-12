import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  id: string;
  type: NotificationType;
  message: string;
  onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ id, type, message, onClose }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-100',
    error: 'bg-red-50 border-red-100',
    info: 'bg-blue-50 border-blue-100'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-center p-4 rounded-2xl shadow-lg border ${bgColors[type]} min-w-[300px]`}
    >
      <div className="mr-3">{icons[type]}</div>
      <p className="text-sm font-medium text-gray-800 flex-grow">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="ml-4 p-1 rounded-full hover:bg-black/5 transition-colors"
      >
        <X className="h-4 w-4 text-gray-400" />
      </button>
    </motion.div>
  );
};

export default Notification;
