import fs from 'node:fs'; import path from 'node:path';
import jsQR from 'jsqr'; import { PNG } from 'pngjs';
const OUT='/opt/tourism/page-design-copier/qr-postery';
const idx=JSON.parse(fs.readFileSync(path.join(OUT,'index.json'),'utf8'));
let bad=0;
for(const it of idx){
  const png=PNG.sync.read(fs.readFileSync(path.join(OUT,it.file)));
  const res=jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  const got=res&&res.data;
  const ok=got===it.url;
  if(!ok){bad++;console.log('✗',it.file,'\n   want',it.url,'\n   got ',got);}
  else console.log('✓',String(it.n).padStart(2),got);
}
console.log(bad?`\n${bad} FAILED`:`\nAll ${idx.length} QR codes decode to the correct URL.`);
