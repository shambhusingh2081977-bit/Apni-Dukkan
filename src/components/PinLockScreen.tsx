import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Store, Delete, CheckCircle } from 'lucide-react';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, shopProfile, t } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState(false);

  const handleDigit = (digit: string) => {
    if (pinInput.length < 6) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMessage(false);

      if (next.length === shopProfile.pinCode.length) {
        const ok = unlockWithPin(next);
        if (!ok) {
          setErrorMessage(true);
          setTimeout(() => {
            setPinInput('');
          }, 400);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage(false);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMessage(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 select-none">
      <div className="max-w-xs w-full text-center space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">
            {shopProfile.name}
          </h2>
          <p className="text-xs text-slate-400">
            Enter PIN to access shop terminal
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center space-x-3 py-2">
          {Array.from({ length: shopProfile.pinCode.length || 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < pinInput.length
                  ? errorMessage
                    ? 'bg-rose-500 border-rose-500 scale-110'
                    : 'bg-emerald-500 border-emerald-500 scale-110'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-400 font-bold animate-bounce">
            Incorrect PIN. Please try again.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="w-16 h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white font-black text-xl border border-slate-800 transition active:scale-95 shadow-md flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-2xl bg-slate-900/40 text-slate-400 font-bold text-xs hover:text-white flex items-center justify-center active:scale-95"
          >
            Clear
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white font-black text-xl border border-slate-800 transition active:scale-95 shadow-md flex items-center justify-center"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-2xl bg-slate-900/40 text-slate-400 hover:text-white flex items-center justify-center active:scale-95"
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Default PIN is <span className="font-mono font-bold text-slate-400">{shopProfile.pinCode}</span>
        </p>
      </div>
    </div>
  );
};
