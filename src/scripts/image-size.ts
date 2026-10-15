/* Pixel size from the first bytes of an image file, without decoding it.
   JPEG (SOF markers), PNG (IHDR), WebP (VP8 / VP8L / VP8X), GIF (logical screen).
   null for anything else or when the header is cut short. Pure: no DOM. */
export type Size = { width: number; height: number };

/** How many leading bytes are enough to hold the size of a normal file (EXIF can be large). */
export const HEADER_BYTES = 262144;

const ascii = (b: Uint8Array, at: number, len: number) => String.fromCharCode(...b.subarray(at, at + len));
const ok = (width: number, height: number): Size | null => (width > 0 && height > 0 ? { width, height } : null);

export function imageSize(b: Uint8Array): Size | null {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length >= 10 && ascii(b, 0, 3) === 'GIF') return ok(v.getUint16(6, true), v.getUint16(8, true));
  if (b.length >= 24 && b[0] === 0x89 && ascii(b, 1, 3) === 'PNG' && ascii(b, 12, 4) === 'IHDR') return ok(v.getUint32(16), v.getUint32(20));
  if (b.length >= 30 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') {
    const kind = ascii(b, 12, 4);
    if (kind === 'VP8X') return ok((b[24] | (b[25] << 8) | (b[26] << 16)) + 1, (b[27] | (b[28] << 8) | (b[29] << 16)) + 1);
    if (kind === 'VP8L' && b[20] === 0x2f) {
      const bits = v.getUint32(21, true);
      return ok((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
    }
    if (kind === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) return ok(v.getUint16(26, true) & 0x3fff, v.getUint16(28, true) & 0x3fff);
    return null;
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 4 <= b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      if (marker === 0xff) { i++; continue; } // fill byte
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; } // no length
      const len = v.getUint16(i + 2);
      const sof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (sof) return i + 9 <= b.length ? ok(v.getUint16(i + 7), v.getUint16(i + 5)) : null;
      if (marker === 0xda || len < 2) return null; // image data reached without a size
      i += 2 + len;
    }
  }
  return null;
}

/** Header size of a File/Blob; null when unknown. */
export async function fileSize(file: Blob): Promise<Size | null> {
  return imageSize(new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer()));
}
