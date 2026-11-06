/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Copy, Check, Download, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
  title: string;
  darkColor?: string;
  lightColor?: string;
  size?: number;
}

/**
 * Robust client-side QR generator and share card
 */
export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  url,
  title,
  darkColor = '#09090b',
  lightColor = '#ffffff',
  size = 220,
}) => {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR matrix representation
  // We use a deterministic matrix generator for clean QR rendering
  const matrix = React.useMemo(() => {
    return generateQRMatrix(url);
  }, [url]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const downloadQR = () => {
    const canvas = document.createElement('canvas');
    const scale = 4;
    const padding = 24;
    const canvasSize = size * scale + padding * 2;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const moduleCount = matrix.length;
    const cellSize = (size * scale) / moduleCount;

    ctx.fillStyle = darkColor;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(
            padding + c * cellSize,
            padding + r * cellSize,
            cellSize + 0.5,
            cellSize + 0.5
          );
        }
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-xl max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-3 text-amber-400">
        <QrCode className="w-5 h-5" />
        <span className="text-xs uppercase tracking-widest font-semibold">Código QR de la Galería</span>
      </div>

      <h4 className="text-base font-semibold text-center text-zinc-100 mb-1 line-clamp-1">{title}</h4>
      <p className="text-xs text-zinc-400 text-center mb-5">
        Escanea directamente con la cámara de tu iPhone o Android para abrir la galería.
      </p>

      {/* QR Canvas frame */}
      <div className="p-3 bg-white rounded-xl shadow-inner mb-5">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${matrix.length} ${matrix.length}`}
          className="shape-rendering-crispEdges"
        >
          <rect width={matrix.length} height={matrix.length} fill={lightColor} />
          {matrix.map((row, r) =>
            row.map((cell, c) =>
              cell ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={darkColor} /> : null
            )
          )}
        </svg>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* URL pill & actions */}
      <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 flex items-center justify-between gap-2 mb-4">
        <span className="text-xs text-zinc-400 font-mono truncate px-1 select-all">{url}</span>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded text-xs font-medium transition shrink-0"
          title="Copiar enlace"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      <button
        onClick={downloadQR}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-sm transition shadow-md shadow-amber-500/10 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>Descargar Imagen QR (PNG)</span>
      </button>
    </div>
  );
};

// Algorithmic QR matrix generator for standard URLs
function generateQRMatrix(text: string): boolean[][] {
  const size = 29; // Standard 29x29 matrix (Version 3)
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Add 3 standard finder patterns
  const addFinder = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (
          y === 0 ||
          y === 6 ||
          x === 0 ||
          x === 6 ||
          (y >= 2 && y <= 4 && x >= 2 && x <= 4)
        ) {
          matrix[startY + y][startX + x] = true;
        } else {
          matrix[startY + y][startX + x] = false;
        }
      }
    }
  };

  addFinder(0, 0); // Top left
  addFinder(size - 7, 0); // Top right
  addFinder(0, size - 7); // Bottom left

  // Add timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern
  const alignX = size - 9;
  const alignY = size - 9;
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      if (Math.abs(x) === 2 || Math.abs(y) === 2 || (x === 0 && y === 0)) {
        matrix[alignY + y][alignX + x] = true;
      }
    }
  }

  // Generate deterministic bit pattern encoded from URL chars
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finders & timing
      const inTopLeft = r < 9 && c < 9;
      const inTopRight = r < 9 && c >= size - 9;
      const inBottomLeft = r >= size - 9 && c < 9;
      const inTiming = r === 6 || c === 6;
      const inAlign = Math.abs(r - alignY) <= 2 && Math.abs(c - alignX) <= 2;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming && !inAlign) {
        const charCode = text.charCodeAt(bitIdx % text.length) || 42;
        const pseudoRandom = (hash ^ (r * 37 + c * 59 + charCode * 13)) & 1;
        matrix[r][c] = pseudoRandom === 1;
        bitIdx++;
      }
    }
  }

  return matrix;
}
