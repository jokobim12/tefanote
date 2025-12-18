import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      setTimeout(() => setShow(false), 200); // Wait for animation
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div 
            className={`
                bg-white rounded-xl shadow-2xl w-full ${maxWidth} relative transform transition-all duration-200
                ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            `}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
                <button 
                    onClick={onClose} 
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
            
            <div className="p-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </div>
    </div>
  );
}
