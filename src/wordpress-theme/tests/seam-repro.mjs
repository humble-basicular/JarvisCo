/* Focused repro for thin seams at the grass dividers: strip screenshots around every .v3-div edge, then look for rows
   whose colour differs from the solid colour above AND below (columns where both sides match). Usage:
   node seam-repro.mjs <url-base> <out.json> [--scaled]   (url-base = approved static copy or WordPress preview base) */
import { writeFileSync } from 'node:fs';
import { startChrome, decodePng } from './browser.mjs';

const [base, out, ...flags] = process.argv.slice(2);
const pages = (process.env.PAGES ?? '/,/vilnius/').split(',');
const widths = (process.env.WIDTHS ?? '360,390,768,1000,1280,1440').split(',').map(Number);
const dprs = (process.env.DPRS ?? '1,2,1.25,1.5,1.3333').split(',').map(Number);
console.error("start");
const b = await startChrome();
if (process.env.WP_AUTH) { const { auth, BASE } = await import('./wp-fixture.mjs'); await b.cdp('Network.setCookies', { cookies: Object.entries(auth.cookies).map(([name, value]) => ({ name, value, url: BASE })) }); }
console.error("chrome up");
const res = [];
for (const page of pages) for (const width of widths) for (const dpr of dprs) {
  await b.cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: dpr, mobile: false });
  await b.cdp('Page.navigate', { url: base + page + (process.env.QUERY ?? '') }); await b.sleep(1200);
  const divs = await b.ev(`(async()=>{await document.fonts.ready;for(let y=0;y<document.documentElement.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,40))}await Promise.race([Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))),new Promise(r=>setTimeout(r,2500))]);scrollTo(0,0);await new Promise(r=>setTimeout(r,200));
    return [...document.querySelectorAll('.v3-div')].map((d,i)=>{const r=d.getBoundingClientRect();return {i,cls:d.className.replace('v3-div','').trim(),top:r.top+scrollY,h:r.height,w:r.width,x:r.left}})})()`);
  console.error(`${page} ${width}@${dpr}x dividers=${divs.length}`);
  const shots = [];
  for (const d of divs) { // capture every strip while the page is still loaded, analyse afterwards
    const y0 = Math.floor(d.top) - 8; const hh = Math.ceil(d.h) + 17;
    const shot = await b.cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: y0, width, height: hh, scale: 1 } });
    shots.push({ d, y0, data: shot.result.data });
  }
  for (const { d, y0, data } of shots) {
    await decodePng(b, data);
    const m = await b.ev(`(()=>{const P=window.__px,W=window.__w,H=P.length/4/W;const dpr=${dpr};
      const px=(x,y,c)=>P[(y*W+x)*4+c];const diff=(x,y,x2,y2)=>Math.max(Math.abs(px(x,y,0)-px(x2,y2,0)),Math.abs(px(x,y,1)-px(x2,y2,1)),Math.abs(px(x,y,2)-px(x2,y2,2)));
      const edge=(yCss)=>{const e=Math.round((yCss-${y0})*dpr);let seam=0,max=0,cols=0;if(e-7<0||e+7>=H)return null;
        for(let x=Math.ceil(${d.x}*dpr)+2;x<Math.floor((${d.x}+${d.w})*dpr)-2;x++){if(diff(x,e-6,x,e+6)>6)continue;cols++;let m=0;for(let y=e-4;y<=e+4;y++)m=Math.max(m,diff(x,y,x,e-6));if(m>12){seam++;max=Math.max(max,m)}}
        return {e,cols,seamCols:seam,maxDev:max}};
      return {top:edge(${d.top}),bottom:edge(${d.top + d.h})}})()`);
    res.push({ page, width, dpr, i: d.i, cls: d.cls, topFrac: +(d.top % 1).toFixed(3), hFrac: +(d.h % 1).toFixed(3), ...m });
  }
}
b.close();
writeFileSync(out, JSON.stringify(res, null, 1));
const bad = res.filter((r) => (r.top && r.top.seamCols > 0) || (r.bottom && r.bottom.seamCols > 0));
console.log(JSON.stringify({ samples: res.length, withSeam: bad.length, worst: bad.sort((a, c) => Math.max(c.top?.maxDev ?? 0, c.bottom?.maxDev ?? 0) - Math.max(a.top?.maxDev ?? 0, a.bottom?.maxDev ?? 0)).slice(0, 6) }, null, 1));
process.exit(0);
