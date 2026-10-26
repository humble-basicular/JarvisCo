/* Generated assets only: retain approved originals and add smaller PNG srcset candidates. */
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

export async function optimizeClientLogos(output, hrefs) {
  const root=resolve(output);
  const inputs=[...new Set(hrefs)].map(href=>{
    if(typeof href!=='string'||!/^\/(?:previews\/[23456789abcdefghjkmnpqrstuvwxyz]{10}|foto)\/logo\.(?:png|jpg|jpeg)$/i.test(href))throw Error('Unsupported generated logo path');
    const file=resolve(root,'.'+href);
    if(!file.startsWith(root+sep))throw Error('Logo escapes output');
    return {href,file};
  });
  const replacements=[];
  for(const {href,file} of inputs){
    if(!existsSync(file))throw Error(`Missing generated logo ${href}`);
    const original=readFileSync(file),metadata=await sharp(original).metadata();
    if(original.length<65536||metadata.width<=512)continue;
    const resized=await sharp(original).resize({width:512,withoutEnlargement:true}).png({compressionLevel:9}).toBuffer();
    if(resized.length>=original.length)continue;
    const suffix=createHash('sha256').update(original).digest('hex').slice(0,12);
    const optimized=href.replace(/\.[^.]+$/,`-512-${suffix}.png`);
    writeFileSync(resolve(root,'.'+optimized),resized);
    replacements.push({href,optimized,originalBytes:original.length,optimizedBytes:resized.length});
  }
  const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):e.isFile()&&e.name.endsWith('.html')?[join(dir,e.name)]:[]);
  for(const file of walk(root)){
    const original=readFileSync(file,'utf8');
    const html=original.replace(/<img\b[^>]*>/g,tag=>{
      if(/\bsrcset=/.test(tag))return tag;
      const image=replacements.find(r=>tag.includes(`src="${r.href}"`));
      return image?tag.replace(/\s+src=/,` srcset="${image.optimized}" src=`):tag;
    });
    if(html!==original)writeFileSync(file,html);
  }
  return replacements;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const previews=join(root,'previews');
  const hrefs=existsSync(previews)?readdirSync(previews).filter(n=>/^[23456789abcdefghjkmnpqrstuvwxyz]{10}\.json$/.test(n)).flatMap(n=>{
    const d=JSON.parse(readFileSync(join(previews,n),'utf8'));
    return d.v3?.clientLogo&&d.logo?.src&&/\.(png|jpe?g)$/i.test(d.logo.src)?[d.logo.src]:[];
  }):[];
  const changes=await optimizeClientLogos(resolve(root,process.argv[2]??'dist'),hrefs);
  console.log('Client logo display assets:',changes.map(c=>`${relative(root,resolve(root,process.argv[2]??'dist'))}${c.href}: ${c.originalBytes}→${c.optimizedBytes}B`).join('; ')||'no large raster logos');
}
