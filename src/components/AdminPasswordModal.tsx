import React, { useState, useEffect } from 'react';
import { Lock, X, AlertCircle, ArrowRight, Shield, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setError(null);
      setIsShaking(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.trim() === 'admin123') {
      setPassword('');
      setShowPassword(false);
      setError(null);
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0"
        />

        {/* Minimalist Aesthetic Modal Card */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            x: isShaking ? [0, -8, 8, -8, 8, 0] : 0,
          }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl z-10 border border-neutral-100/90 text-center space-y-5"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Minimal Icon Header */}
          <div className="space-y-3 pt-1">
            <div className="relative w-14 h-14 mx-auto rounded-2xl bg-red-50 border border-red-100/80 flex items-center justify-center text-[#D81A07] shadow-2xs">
              <Shield className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-xl text-neutral-900 tracking-tight">
                Admin Authentication
              </h3>
              <p className="text-xs text-neutral-500 font-medium max-w-[250px] mx-auto leading-relaxed">
                Please enter your administrative password to access the panel.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50/90 border border-red-200 rounded-2xl px-3.5 py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-[#D81A07] shadow-2xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D81A07]" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Password Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-neutral-400 pointer-events-none z-10">
                <Lock className="w-4 h-4 stroke-[2.2]" />
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter password"
                className={`w-full pl-10 pr-11 py-3 bg-neutral-50 hover:bg-neutral-50/80 focus:bg-white border ${
                  error
                    ? 'border-red-400 ring-2 ring-red-400/20'
                    : 'border-neutral-200 focus:border-[#D81A07] focus:ring-2 focus:ring-[#D81A07]/15'
                } rounded-2xl text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 outline-none transition-all`}
              />

              {/* Eye Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-neutral-400 hover:text-neutral-700 transition-colors p-1.5 cursor-pointer rounded-xl focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 stroke-[2.2]" />
                ) : (
                  <Eye className="w-4 h-4 stroke-[2.2]" />
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1.5 py-3 px-4 bg-[#D81A07] hover:bg-[#b81505] active:bg-[#991205] text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-red-700/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Unlock</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
