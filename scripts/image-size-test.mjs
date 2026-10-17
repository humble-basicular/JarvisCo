#!/usr/bin/env node
/* Unit-style checks for src/scripts/image-size.ts (header-only image sizes).
   node scripts/image-size-test.mjs */
import sharp from 'sharp';
import { imageSize } from '../src/scripts/image-size.ts';

let failures = 0;
const eq = (got, w, h, label) => {
  const pass = w === null ? got === null : got?.width === w && got?.height === h;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${JSON.stringify(got)}`);
  if (!pass) failures++;
};
const img = (w, h, fmt, opts = {}) => sharp({ create: { width: w, height: h, channels: 3, background: '#38a' } })[fmt](opts).toBuffer();
const bytes = (buf) => new Uint8Array(buf);

eq(imageSize(bytes(await img(321, 123, 'jpeg'))), 321, 123, 'jpeg baseline');
eq(imageSize(bytes(await img(321, 123, 'jpeg', { progressive: true }))), 321, 123, 'jpeg progressive');
eq(imageSize(bytes(await sharp({ create: { width: 40, height: 30, channels: 3, background: '#000' } }).withExif({ IFD0: { Copyright: 'x'.repeat(5000) } }).jpeg().toBuffer())), 40, 30, 'jpeg with large EXIF');
eq(imageSize(bytes(await img(640, 480, 'png'))), 640, 480, 'png');
eq(imageSize(bytes(await img(100, 77, 'webp'))), 100, 77, 'webp (lossy VP8)');
eq(imageSize(bytes(await img(100, 77, 'webp', { lossless: true }))), 100, 77, 'webp lossless (VP8L)');
eq(imageSize(bytes(await sharp({ create: { width: 64, height: 48, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } } }).webp().toBuffer())), 64, 48, 'webp with alpha (VP8X)');
eq(imageSize(bytes(await img(55, 44, 'gif'))), 55, 44, 'gif');
eq(imageSize(bytes((await img(321, 123, 'jpeg')).subarray(0, 12))), null, 0, 'truncated jpeg');
eq(imageSize(bytes((await img(640, 480, 'png')).subarray(0, 20))), null, 0, 'truncated png');
eq(imageSize(new TextEncoder().encode('%PDF-1.7 hello')), null, 0, 'not an image');
eq(imageSize(new Uint8Array(0)), null, 0, 'empty');
eq(imageSize(bytes(Buffer.from('0000001866747970686569630000000000000000', 'hex'))), null, 0, 'heic (unknown)');
process.exit(failures ? (console.log(`${failures} check(s) failed`), 1) : (console.log('all image-size checks passed'), 0));
