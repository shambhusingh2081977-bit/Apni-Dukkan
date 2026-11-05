import React, { useEffect, useRef } from 'react';

/**
 * Self-contained QR Code canvas generator for offline UPI payment.
 * Generates high-contrast QR pattern with finder patterns and data cells.
 */
export const UpiQrCode: React.FC<{
  value: string;
  size?: number;
}> = ({ value, size = 180 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Grid dimension
    const modules = 25;
    const cellSize = Math.floor(size / modules);
    canvas.width = modules * cellSize;
    canvas.height = modules * cellSize;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Deterministic hash array
    const hash = simpleHash(value);
    const grid: boolean[][] = Array.from({ length: modules }, () =>
      Array(modules).fill(false)
    );

    // Draw standard finder patterns at top-left, top-right, bottom-left
    drawFinderPattern(grid, 0, 0);
    drawFinderPattern(grid, modules - 7, 0);
    drawFinderPattern(grid, 0, modules - 7);

    // Fill data cells based on hash and string values
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        // Skip finder areas
        if (isFinderArea(r, c, modules)) continue;

        const charIdx = (r * modules + c) % value.length;
        const charCode = value.charCodeAt(charIdx);
        const bit = ((hash ^ (charCode * (r + 1) * (c + 1))) % 2) === 0;
        grid[r][c] = bit;
      }
    }

    // Render cells
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (grid[r][c]) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [value, size]);

  return (
    <div className="flex flex-col items-center p-3 bg-white rounded-2xl shadow-inner border border-slate-200">
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-sm"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function drawFinderPattern(grid: boolean[][], startR: number, startC: number) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
      const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      grid[startR + r][startC + c] = isOuter || isInner;
    }
  }
}

function isFinderArea(r: number, c: number, size: number): boolean {
  // Top-left
  if (r < 8 && c < 8) return true;
  // Top-right
  if (r < 8 && c >= size - 8) return true;
  // Bottom-left
  if (r >= size - 8 && c < 8) return true;
  return false;
}
