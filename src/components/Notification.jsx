import React from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

const Notification = ({ message, type, onClose }) => {
  return (
    <div 
      className={`fixed bottom-5 right-5 px-4 py-3 rounded-lg shadow-lg text-white z-50 flex items-center gap-2 animate-slide-in cursor-pointer ${
        type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' :
        type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
        'bg-gradient-to-r from-yellow-500 to-yellow-600'
      }`}
      onClick={onClose}
    >
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      <span className='text-sm'>{message}</span>
      <X size={16} className="ml-2 opacity-70 hover:opacity-100" />
    </div>
  );
};

export default Notification;