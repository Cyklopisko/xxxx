import {readFile,writeFile} from 'node:fs/promises';
import {insideRing} from './public/globe-math.js';
const data=JSON.parse(await readFile(new URL('./public/globe-land.geojson',import.meta.url),'utf8'));
const polygons=data.features.flatMap(f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates);
const regions=polygons.map(rings=>({rings,minX:Math.min(...rings[0].map(p=>p[0])),maxX:Math.max(...rings[0].map(p=>p[0])),minY:Math.min(...rings[0].map(p=>p[1])),maxY:Math.max(...rings[0].map(p=>p[1]))}));
const points=[];
for(let lat=-80;lat<=80;lat+=.85) {
 for(let lon=-180;lon<180;lon+=.85/Math.cos(lat*Math.PI/180)) {
  if(!regions.some(p=>lon>=p.minX&&lon<=p.maxX&&lat>=p.minY&&lat<=p.maxY&&insideRing(lon,lat,p.rings[0])&&!p.rings.slice(1).some(r=>insideRing(lon,lat,r))))continue;
  const a=lon*Math.PI/180,b=lat*Math.PI/180;
  points.push([Math.cos(b)*Math.sin(a),-Math.sin(b),Math.cos(b)*Math.cos(a)].map(n=>+n.toFixed(5)));
 }
}
if(points.length<1000)throw new Error('Incomplete globe map');
await writeFile(new URL('./public/globe-points.js',import.meta.url),'// Generated from Natural Earth public-domain land data by build-globe-points.mjs.\nexport default '+JSON.stringify(points)+';\n');
console.log(`Generated ${points.length} land points`);
