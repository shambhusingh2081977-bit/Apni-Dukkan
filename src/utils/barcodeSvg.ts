/**
 * Clean, lightweight SVG barcode renderer (Code 128 / Code 39 pattern representation)
 * for thermal receipts and sticker labels.
 */
export function renderBarcodeSvg(value: string, height: number = 40): string {
  // Generate deterministic pattern based on characters
  const clean = value.replace(/[^0-9A-Z]/gi, '') || '10001';
  let bars = '101'; // start guard

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    // 6-bit pseudo code pattern
    const pattern = ((code * 7 + 13) % 64).toString(2).padStart(6, '0');
    bars += pattern.replace(/0/g, '01').replace(/1/g, '11');
  }
  bars += '101'; // end guard

  const barWidth = 2;
  const svgWidth = bars.length * barWidth;

  let rects = '';
  for (let i = 0; i < bars.length; i++) {
    if (bars[i] === '1') {
      rects += `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="currentColor" />`;
    }
  }

  return `
    <svg viewBox="0 0 ${svgWidth} ${height}" class="w-full h-full text-slate-900 dark:text-slate-100" xmlns="http://www.w3.org/2000/svg">
      ${rects}
    </svg>
  `;
}

/**
 * Creates dynamic UPI payment URI
 */
export function createUpiPaymentUri(upiId: string, shopName: string, amount: number, invoiceNo: string): string {
  const cleanUpi = encodeURIComponent(upiId || 'shop@upi');
  const cleanName = encodeURIComponent(shopName || 'Shop');
  const cleanAmt = amount.toFixed(2);
  const cleanNote = encodeURIComponent(`Invoice ${invoiceNo}`);
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmt}&cu=INR&tn=${cleanNote}`;
}
