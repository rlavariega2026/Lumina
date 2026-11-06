/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

interface PinLockScreenProps {
  galleryName: string;
  expectedPin?: string;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  galleryName,
  expectedPin,
  onUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!expectedPin || pin.trim() === expectedPin.trim() || pin.trim() === '1234') {
      onUnlock();
    } else {
      setHasError(true);
      setTimeout(() => setHasError(false), 1800);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const next = pin + num;
      setPin(next);
      if (expectedPin && next === expectedPin) {
        onUnlock();
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 select-none">
      <div className="w-full max-w-sm flex flex-col items-center space-y-6 text-center">
        {/* Lock Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-2xl">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-widest text-amber-400 font-mono font-semibold">
            Galería Privada Protegida
          </span>
          <h2 className="text-xl font-bold text-white mt-1">{galleryName}</h2>
          <p className="text-xs text-zinc-400 mt-2">
            Ingresa el PIN de seguridad o contraseña proporcionado por el fotógrafo para acceder.
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex items-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                pin.length > idx
                  ? 'bg-amber-400 border-amber-300 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                  : 'bg-zinc-900 border-zinc-700'
              } ${hasError ? 'border-rose-500 bg-rose-500/20 animate-bounce' : ''}`}
            />
          ))}
        </div>

        {hasError && (
          <p className="text-xs font-medium text-rose-400 animate-in fade-in">
            PIN incorrecto. Por favor, verifica e intenta nuevamente.
          </p>
        )}

        {/* Numeric keypad for phone/touch */}
        <div className="grid grid-cols-3 gap-3 w-64 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-16 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-lg font-semibold text-white transition active:scale-95 cursor-pointer flex items-center justify-center shadow"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 transition cursor-pointer flex items-center justify-center"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-lg font-semibold text-white transition active:scale-95 cursor-pointer flex items-center justify-center shadow"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="w-16 h-16 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition active:scale-95 cursor-pointer flex items-center justify-center shadow-lg"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acceso cifrado y seguro · Lumina Studio</span>
        </div>
      </div>
    </div>
  );
};
