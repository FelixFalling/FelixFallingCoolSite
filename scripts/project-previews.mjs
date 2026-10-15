/** Rebuild the illustrated GIF previews: node scripts/project-previews.mjs.
 * Requires ffmpeg on PATH; sharp is already a project dependency.
 * All artwork is original SVG geometry. These are concept loops, not recordings.
 */
import sharp from 'sharp';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const out = 'public/projects/animated';
await mkdir(out, { recursive: true });
const TAU = Math.PI * 2;
const teal = '#67e8d0', gold = '#ffd47c', muted = '#829aaf';
const text = (x,y,s,c='#e7f4fa',size=16) => `<text x="${x}" y="${y}" fill="${c}" font-family="DejaVu Sans,sans-serif" font-size="${size}" font-weight="600">${s}</text>`;
const line = (x,y,a,b,c=teal,w=2) => `<path d="M${x} ${y} L${a} ${b}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
const circle = (x,y,r,c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const rect = (x,y,w,h,c,r=8) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${c}"/>`;
const titles = {
 duck: ['VISION → DEPTH → MOTION','A little duck. A very focused robot.'],
 wildfire: ['FORECAST THE FRONT','Terrain, weather, and a changing fireline.'],
 tictactoe: ['LEARNING THROUGH PLAY','One board. Thousands of possibilities.'],
 queens: ['EVOLVE A SOLUTION','Eight queens. Zero conflicts.'],
 coast: ['A SMALL PIECE OF THE COAST','Built by hand. Always in motion.'],
 clock: ['THE CURSE LIFTS AT CLOCK-OUT','Make time a little more mysterious.'],
 wizard: ['JUST ONE MORE SHELF','A cat, a laser, and an endless tower.'],
};
function scene(kind,t) {
 let s = '';
 if (kind === 'duck') {
  for(let x=40;x<620;x+=32) s+=line(x,100,x,335,'#183648',1);
  for(let y=110;y<340;y+=32) s+=line(30,y,610,y,'#183648',1);
  const x=300+95*Math.sin(t*TAU), y=218+22*Math.cos(t*TAU);
  s+=line(320,338,x,y,'#fa7971',2);
  s+=`<ellipse cx="${x}" cy="${y+16}" rx="39" ry="25" fill="${gold}"/>`+circle(x+23,y-11,23,gold)+circle(x+30,y-18,3,'#142837');
  s+=`<path d="M${x+42} ${y-12} l22 7 -22 7" fill="#ff9859"/>`;
  s+=`<rect x="${x-53}" y="${y-43}" width="115" height="93" rx="5" fill="none" stroke="${teal}" stroke-width="2"/>`;
  s+=text(x-52,y-52,'DUCK / TRACKING',teal,12)+circle(320,338,12,'#c2d6e0');
  s+=rect(36,314,140,26,'#173b43')+text(48,332,'● TARGET LOCKED',teal,11);
 } else if(kind === 'wildfire') {
  for(let j=0;j<12;j++) {
   let p='';for(let x=25;x<=620;x+=8) p+=`${x===25?'M':'L'}${x},${125+j*18+15*Math.sin(x/65+j*.6)} `;
   s+=`<path d="${p}" fill="none" stroke="#284957" stroke-width="1.5"/>`;
  }
  for(let j=5;j>=0;j--) {
   const r=18+j*11+12*Math.sin(t*TAU-j*.3);
   let p='';for(let k=0;k<=64;k++){const a=k/64*TAU,rr=r*(1+.16*Math.sin(a*5+t*TAU));p+=`${k?'L':'M'}${330+rr*Math.cos(a)*1.6},${223+rr*Math.sin(a)} `;}
   s+=`<path d="${p}Z" fill="${['#ffe3a1','#ffca70','#ff995c','#ed704e','#ba504b','#673c43'][j]}" opacity=".85"/>`;
  }
  s+=text(40,332,'SIMULATED SPREAD',gold,12);
  for(let i=0;i<5;i++){const x=70+i*105+(t*35)%35;s+=line(x,130,x+22,120,teal)+line(x+22,120,x+16,130,teal);}
 } else if(kind === 'tictactoe') {
  const ox=220,oy=110,cell=70;
  for(let i=1;i<3;i++)s+=line(ox+i*cell,oy,ox+i*cell,oy+210,'#35566a',3)+line(ox,oy+i*cell,ox+210,oy+i*cell,'#35566a',3);
  const moves=[0,1,4,2,8];const n=Math.min(5,Math.floor(t*7)+1);
  moves.slice(0,n).forEach((v,i)=>{const x=ox+(v%3)*cell+35,y=oy+Math.floor(v/3)*cell+35;s+=i%2?`<circle cx="${x}" cy="${y}" r="20" fill="none" stroke="${gold}" stroke-width="5"/>`:line(x-16,y-16,x+16,y+16,teal,5)+line(x+16,y-16,x-16,y+16,teal,5);});
  if(n===5)s+=line(244,134,406,296,'#faf0c5',4);
  s+=text(45,184,'SELF',muted,13)+text(45,206,'PLAY',teal,23)+text(475,217,n===5?'REWARD +1':'EXPLORING',n===5?gold:muted,12);
 } else if(kind === 'queens') {
  const solution=[0,4,7,5,2,6,1,3], step=Math.min(8,Math.floor(t*12));
  for(let row=0;row<8;row++)for(let col=0;col<8;col++)s+=rect(212+col*28,103+row*28,28,28,(row+col)%2?'#284454':'#162f40',0);
  for(let col=0;col<8;col++) {const row=col<step?solution[col]:(col+Math.floor(t*12))%8,x=226+col*28,y=117+row*28; s+=`<path d="M${x-9} ${y+7} l-2 -14 7 6 4 -9 4 9 7 -6 -2 14Z" fill="${col<step?gold:muted}"/>`;}
  s+=text(43,200,'FITNESS',muted,12)+text(43,229,step===8?'SOLVED':'EVOLVING',step===8?gold:teal,16);
  s+=text(474,211,`${step} / 8`,gold,24);
 } else if(kind === 'coast') {
  s+=circle(476,143,26,'#f5dfad');
  s+=`<path d="M355 284 L380 185 401 168 419 198 439 284Z M450 284 L467 223 484 216 509 284Z" fill="#355466"/>`;
  for(let j=0;j<5;j++){let p=`M0 400 L0 ${253+j*22} `;for(let x=0;x<=640;x+=8)p+=`L${x} ${253+j*22+10*Math.sin(x/65+t*TAU+j*.8)} `;s+=`<path d="${p}L640 400Z" fill="${['#264d62','#2d6375','#347c8a','#46999d','#76bab5'][j]}"/>`;}
  s+=text(42,150,'DESIGNED TO DRIFT', '#b6d5df',12);
 } else if(kind === 'clock') {
  for(const x of [58,535]){s+=rect(x,120,48,225,'#374451',3)+rect(x-10,112,68,17,'#817354',3);for(let j=0;j<5;j++)s+=line(x+12,151+j*31,x+35,164+j*31,'#b59864',2);}
  s+=`<circle cx="320" cy="222" r="95" fill="#172b3c" stroke="${gold}" stroke-width="3"/><circle cx="320" cy="222" r="82" fill="none" stroke="#716548"/>`;
  for(let i=0;i<12;i++){const a=i/12*TAU;s+=line(320+73*Math.sin(a),222-73*Math.cos(a),320+80*Math.sin(a),222-80*Math.cos(a),gold,2);}
  s+=line(320,222,320+61*Math.sin(t*TAU),222-61*Math.cos(t*TAU),gold,3)+line(320,222,285,197,'#e7f4fa',5)+circle(320,222,5,gold);
  for(let i=0;i<12;i++)s+=circle(135+i*33,140+((i*41-t*90+240)%190),1.5,'#bc9b62');
 } else if(kind === 'wizard') {
  for(let j=0;j<5;j++){const y=105+((j*60+t*120)%240),x=j%2?345:125;s+=rect(x,y,170,10,'#6c567a',3);for(let k=0;k<4;k++)s+=rect(x+15+k*18,y-25,12,25,['#658798','#b9936b','#8a739f'][k%3],2);}
  const x=320+85*Math.sin(t*TAU),y=213-38*Math.abs(Math.sin(t*TAU*2));
  s+=`<path d="M${x+14} ${y+23} q45 9 27 -28" fill="none" stroke="#d3dce7" stroke-width="9" stroke-linecap="round"/>`;
  s+=`<ellipse cx="${x}" cy="${y+14}" rx="21" ry="24" fill="#d3dce7"/><path d="M${x-19} ${y} l-2 -28 17 12 13 0 13 -12 -1 29Z" fill="#e5eaf1"/>`;
  s+=circle(x-8,y-8,3,teal)+circle(x+8,y-8,3,teal)+circle(x+30,y-55,5,'#ff7b88')+circle(x+30,y-55,10,'#ff7b8833');
  s+=text(40,332,'↑ THE ONLY WAY IS UP', '#c5b1df',12);
 }
 return s;
}
for(const [kind,[title,subtitle]] of Object.entries(titles)) {
 const temp=await mkdtemp(join(tmpdir(),'project-preview-'));
 try {
  for(let i=0;i<48;i++) {
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="#102333"/>${text(30,35,title,teal,12)}${text(30,64,subtitle,'#edf5f8',18)}${scene(kind,i/48)}${rect(0,363,640,37,'#0c1d2b',0)}${text(30,386,'PROJECT SKETCH / '+kind.toUpperCase(),muted,10)}${text(514,386,'● IN MOTION',teal,10)}</svg>`;
   const frame=await sharp(Buffer.from(svg)).png().toBuffer();
   await sharp(frame).toFile(join(temp,`${String(i).padStart(3,'0')}.png`));
   if(i===30)await sharp(frame).webp({quality:85}).toFile(`${out}/${kind}.webp`);
  }
  execFileSync('ffmpeg',['-v','error','-framerate','12','-i',join(temp,'%03d.png'),'-filter_complex','[0:v]split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4','-loop','0','-y',`${out}/${kind}.gif`]);
  console.log(`Created ${kind}.gif and reduced-motion poster`);
 } finally {await rm(temp,{recursive:true,force:true});}
}
