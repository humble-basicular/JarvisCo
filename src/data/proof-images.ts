/* Resolves proof screenshot names from content.js to optimised images.
   Thumbnails render with <Image>; the full image is a 1600 px WebP that the
   zoom dialog opens (src/scripts/zoom.ts). */
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/proof/*.{png,jpg}', { eager: true });

export function proofImage(name: string): ImageMetadata {
  const hit = Object.entries(files).find(([path]) => path.split('/').pop()!.replace(/\.\w+$/, '') === name);
  if (!hit) throw new Error(`Missing proof image: ${name}`);
  return hit[1].default;
}

export interface ResolvedShot {
  card: ImageMetadata;
  href: string;
  w: number;
  h: number;
  alt: string;
  caption: string;
}

export async function resolveShot(shot: { card: string; full: string; alt: string; caption: string }): Promise<ResolvedShot> {
  const src = proofImage(shot.full);
  const full = await getImage({ src, width: Math.min(src.width, 1600), format: 'webp', quality: 82 });
  return {
    card: proofImage(shot.card),
    href: full.src,
    w: Number(full.attributes.width),
    h: Number(full.attributes.height),
    alt: shot.alt,
    caption: shot.caption,
  };
}
