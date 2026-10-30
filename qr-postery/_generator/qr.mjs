import QRCode from 'qrcode';

/**
 * Styled QR as SVG markup. Error correction is fixed at 'H' (~30% recoverable)
 * so the code survives print wear, partial cover and low-quality scans.
 */
export function qrSvg(text, { size = 1000, dark = '#002F5E', logo = null, bg = '#FFFFFF' } = {}) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'H' });
  const n = modules.size;
  const get = (x, y) => x >= 0 && y >= 0 && x < n && y < n && modules.get(y, x);

  // Quiet zone: 4 modules is the spec minimum; keep it, scanners rely on it.
  const quiet = 4;
  const total = n + quiet * 2;
  const u = size / total;           // module size in user units
  const off = quiet * u;

  const isEye = (x, y) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

  // Centre badge for the emblem. At ~26% of the symbol width this covers well
  // under 12% of the module area — comfortably inside what level H can restore.
  const badge = logo ? size * 0.26 : 0;
  const pad = u * 0.9;                       // plate bleed around the emblem
  const bMin = (size - badge) / 2, bMax = (size + badge) / 2;
  // Clear modules across the whole plate, not just the emblem box, so no dot
  // can poke out from under its edge.
  const underBadge = (cx, cy) =>
    logo && cx > bMin - pad && cx < bMax + pad && cy > bMin - pad && cy < bMax + pad;

  let dots = '';
  const r = u * 0.5;               // full round dots
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!get(x, y) || isEye(x, y)) continue;
      const cx = off + x * u + u / 2;
      const cy = off + y * u + u / 2;
      if (underBadge(cx, cy)) continue;
      // Merge orthogonal neighbours into capsules so runs read as strokes
      // rather than loose dots — better scan contrast and a cleaner texture.
      const right = get(x + 1, y) && !isEye(x + 1, y) && !underBadge(cx + u, cy);
      const down = get(x, y + 1) && !isEye(x, y + 1) && !underBadge(cx, cy + u);
      dots += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.92)}"/>`;
      if (right) dots += `<rect x="${f(cx)}" y="${f(cy - r * 0.92)}" width="${f(u)}" height="${f(r * 1.84)}"/>`;
      if (down) dots += `<rect x="${f(cx - r * 0.92)}" y="${f(cy)}" width="${f(r * 1.84)}" height="${f(u)}"/>`;
    }
  }

  // Finder eyes: rounded square ring + rounded square pupil.
  const eye = (ex, ey) => {
    const x = off + ex * u, y = off + ey * u;
    // Stroke straddles the path, so inset by half a module and size 6u:
    // the 1u-wide ring then lands exactly on the 7×7 border.
    return (
      `<rect x="${f(x + u * 0.5)}" y="${f(y + u * 0.5)}" width="${f(u * 6)}" height="${f(u * 6)}"` +
      ` rx="${f(u * 1.75)}" fill="none" stroke-width="${f(u)}" stroke="${dark}"/>` +
      `<rect x="${f(x + u * 2)}" y="${f(y + u * 2)}" width="${f(u * 3)}" height="${f(u * 3)}"` +
      ` rx="${f(u * 0.9)}"/>`
    );
  };

  // Emblem sits on a solid plate so the scanner sees a clean, unambiguous hole
  // rather than shapes it might read as modules.
  const plate = logo ? `<rect x="${f(bMin - pad)}" y="${f(bMin - pad)}" width="${f(badge + pad * 2)}"`
      + ` height="${f(badge + pad * 2)}" rx="${f(badge * 0.24)}" fill="${bg}"/>` : '';
  const mark = logo
    ? `<svg x="${f(bMin + badge * 0.09)}" y="${f(bMin + badge * 0.05)}" width="${f(badge * 0.82)}"`
      + ` height="${f(badge * 0.9)}" viewBox="${logo.viewBox}" overflow="visible">${logo.body}</svg>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(size)} ${f(size)}" width="${f(size)}" height="${f(size)}" shape-rendering="geometricPrecision">
  <g fill="${dark}">${dots}${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}</g>
  ${plate}${mark}
</svg>`;
}

const f = v => Math.round(v * 1000) / 1000;
