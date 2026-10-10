import { canAnimate, orbitPoint, behindGlobe } from './globe-math.js';
import points from './globe-points.js';

const scene = document.querySelector('.orbital-background');
if (scene) initGlobe();
function initGlobe() {
  const canvas = scene.querySelector('canvas'), ctx = canvas.getContext('2d');
  if (!ctx) return;
  const hero = scene.parentElement, toggle = hero.querySelector('.orbital-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const controls=document.createElement('div'); controls.className='orbital-controls';
  controls.setAttribute('aria-label','Explore model connections');
  const status=document.createElement('p');status.className='orbital-status';status.setAttribute('aria-live','polite');
  status.textContent='Drag to rotate · Select a model to trace its connection';
  const dock=document.createElement('div');dock.className='orbital-dock';
  dock.append(controls,status,toggle);hero.append(dock);
  let selected=-1,drag=null,rotation=0,tilt=0,aimX=0,aimY=0,viewX=0,viewY=0,velocity=0;
  const buttons=[];
  function selectModel(index) {
    selected=index;
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(index===i)));
    status.textContent=`${models[index].dataset.name} · Connection highlighted · Visual demo`;
    draw();
  }
  const models = [['openai','GPT'],['claude','Claude'],['gemini','Gemini'],['deepseek','DeepSeek'],['xai','Grok'],['qwen','Qwen']].map(([asset,name]) => {
    const node = document.createElement('button'); node.type='button';node.tabIndex=-1;node.className = 'orbital-model';node.dataset.name=name;
    const img = document.createElement('img'); img.src = `/brands/${asset}.svg`; img.alt = '';
    const label = document.createElement('span'); label.textContent = name;
    const index=buttons.length;
    const button=document.createElement('button');button.type='button';button.disabled=true;button.textContent=name;button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>selectModel(index));controls.append(button);buttons.push(button);
    node.addEventListener('click',()=>selectModel(index));
    node.append(img,label); scene.querySelector('.orbital-models').append(node); return node;
  });
  let obstacles=[], w = 0, h = 0, radius = 0, frame = 0, previous = 0, elapsed = 0, visible = true, paused = false;
  function orbit(t, index) {
    const p=orbitPoint(t,index);
    return {x:w/2+p.x*radius,y:h*.48+p.y*radius,z:p.z,hidden:behindGlobe(p)};
  }
  function draw() {
    ctx.clearRect(0,0,w,h);
    const cx=w/2+viewX*18,cy=h*.48+viewY*10,spin=elapsed*.000055-.5+rotation,cos=Math.cos(spin),sin=Math.sin(spin);
    const axis=.21+tilt+viewY*.08,axcos=Math.cos(axis),axsin=Math.sin(axis);
    // Stable distant particles; no random work or twinkling on each frame.
    for(let i=0;i<100;i++) {
      const x=((i*7919)%997)/997*w,y=((i*3571)%991)/991*h;
      ctx.fillStyle=i%9===0?'#84bbff65':'#80acdf24';ctx.fillRect(x,y,i%9===0?1.5:1,1);
    }
    const bloom=ctx.createRadialGradient(cx,cy,radius*.8,cx,cy,radius*1.28);
    bloom.addColorStop(0,'#2454eb00');bloom.addColorStop(.38,'#327aff36');bloom.addColorStop(.6,'#2463ee10');bloom.addColorStop(1,'#2454eb00');
    ctx.fillStyle=bloom;ctx.fillRect(cx-radius*1.28,cy-radius*1.28,radius*2.56,radius*2.56);
    const surface=ctx.createRadialGradient(cx-radius*.35,cy-radius*.55,0,cx,cy,radius);
    surface.addColorStop(0,'#182f50');surface.addColorStop(.52,'#0e1d32');surface.addColorStop(.88,'#101f36');surface.addColorStop(1,'#244b7a');
    ctx.fillStyle=surface;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();
    // Batch land points by lighting level rather than changing fill state per dot.
    const buckets=Array.from({length:8},()=>new Path2D());
    const step=w<700?2:1;
    for(let i=0;i<points.length;i+=step) {
      const [x,y,z]=points[i],rx=x*cos+z*sin,rz=z*cos-x*sin;
      const ty=y*axcos-rz*axsin,tz=y*axsin+rz*axcos;
      if(tz<=0) continue;
      const light=Math.max(0,Math.min(1,.48+tz*.34-rx*.18-ty*.22));
      const size=(w<700?.8:.85)+tz*.48;
      buckets[Math.min(7,Math.floor(light*8))].rect(cx+rx*radius,cy+ty*radius,size,size);
    }
    buckets.forEach((path,i)=>{ctx.fillStyle=`rgba(${125+i*14},${171+i*10},255,${.3+i*.09})`;ctx.fill(path);});
    // Dim graticule follows the same globe rotation and axial tilt as land.
    ctx.strokeStyle='#6daaff18';ctx.lineWidth=.6;
    for(let meridian=0;meridian<12;meridian++) {
      ctx.beginPath();let pen=false;
      for(let j=0;j<=90;j++) {
        const lat=-Math.PI/2+j*Math.PI/90,lon=meridian*Math.PI/6+spin;
        const x=Math.cos(lat)*Math.sin(lon),y=-Math.sin(lat),z=Math.cos(lat)*Math.cos(lon);
        const ty=y*axcos-z*axsin,tz=y*axsin+z*axcos;
        if(tz<0){pen=false;continue;}
        if(pen)ctx.lineTo(cx+x*radius,cy+ty*radius);else ctx.moveTo(cx+x*radius,cy+ty*radius);pen=true;
      }ctx.stroke();
    }
    const rim=ctx.createLinearGradient(cx-radius,cy-radius,cx+radius,cy+radius);
    rim.addColorStop(0,'#b7eaff');rim.addColorStop(.35,'#609aff');rim.addColorStop(.65,'#2c65b578');rim.addColorStop(1,'#426db72b');
    ctx.strokeStyle=rim;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#7cb5ff24';ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,radius-2,Math.PI*1.02,Math.PI*1.8);ctx.stroke();
    for(let k=0;k<3;k++) {
      ctx.beginPath();let pen=false;
      for(let i=0;i<=240;i++){const p=orbit(i/240*Math.PI*2,k);if(p.hidden){pen=false;continue;}if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;}
      ctx.strokeStyle=selected>=0&&selected%3===k?'#b9eeff':['#7fa9ec70','#537ece60','#9ecbff50'][k];ctx.lineWidth=selected>=0&&selected%3===k?1.8:.8;ctx.stroke();
      const head=elapsed*.00016+k*2.1;
      for(let j=0;j<22;j++) {
        const p=orbit(head-j*.011,k);if(p.hidden)continue;
        ctx.fillStyle=`rgba(142,220,255,${(1-j/22)*.8})`;ctx.beginPath();ctx.arc(p.x,p.y,1.5*(1-j/30),0,Math.PI*2);ctx.fill();
      }
      const p=orbit(head,k);
      if(!p.hidden){const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,12);glow.addColorStop(0,'#f3fbff');glow.addColorStop(.12,'#b2e7ff');glow.addColorStop(1,'#2454eb00');ctx.fillStyle=glow;ctx.fillRect(p.x-12,p.y-12,24,24);}
    }
    models.forEach((node,i)=>{
      const p=orbit(i*Math.PI/3+elapsed*.000045, i%3);
      // Fade orbital labels as they cross the reading/CTA area.
      const distance=Math.max(Math.abs(p.x-w/2)/(w<700?w*.43:Math.min(430,w*.31)),Math.abs(p.y-h*.45)/(h*.38));
      const overlapsCopy=obstacles.some(r=>p.x+120>r.left&&p.x-28<r.right&&p.y+34>r.top&&p.y-28<r.bottom);
      const clearance=overlapsCopy?0:Math.max(0,Math.min(1,(distance-.88)/.22));
      const scale=.85+(p.z+1.34)*.1;
      node.style.transform=`translate(${p.x-22}px,${p.y-22}px) scale(${scale})`;
      node.style.opacity=String(p.hidden?0:(.65+(p.z+1.34)*.13)*clearance);
      node.style.pointerEvents=!p.hidden&&clearance>.8?'auto':'none';
      node.classList.toggle('is-selected',selected===i);
    });
    if(selected>=0) {
      const p=orbit(selected*Math.PI/3+elapsed*.000045,selected%3);
      ctx.strokeStyle='#8edcff6b';ctx.lineWidth=1;ctx.setLineDash([3,6]);
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo(cx,cy-radius*.8,cx,cy);ctx.stroke();ctx.setLineDash([]);
    }
  }
  function tick(now) {
    frame=0;
    if(!canAnimate(reduced.matches,document.hidden,visible,paused)) {previous=0;return;}
    if(!previous) previous=now;
    if(now-previous>=32) {
      if(!drag) {elapsed+=Math.min(now-previous,70);rotation+=velocity;velocity*=.94;}
      viewX+=(aimX-viewX)*.09;viewY+=(aimY-viewY)*.09;
      previous=now;draw();
    }
    frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);frame=0;previous=0;
    const moving=canAnimate(reduced.matches,document.hidden,visible,paused);
    scene.dataset.moving=String(moving);
    toggle.hidden=reduced.matches;toggle.textContent=paused?'Resume background':'Pause background';toggle.setAttribute('aria-pressed',String(paused));
    draw();if(moving) frame=requestAnimationFrame(tick);
  }
  function resize() {
    const bounds=scene.getBoundingClientRect();w=bounds.width;h=bounds.height;radius=Math.min(w*.32,410,h*.48);
    obstacles=[...hero.children].filter(el=>el!==scene&&getComputedStyle(el).display!=='none').map(el=>{const r=el.getBoundingClientRect();return {left:r.left-bounds.left-12,right:r.right-bounds.left+12,top:r.top-bounds.top-12,bottom:r.bottom-bounds.top+12};});
    if(w<700) radius=Math.min(w*.69,300);
    const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  toggle.addEventListener('click',()=>{paused=!paused;sync();});
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};velocity=0;
    canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove',event=>{
    if(drag&&drag.id===event.pointerId) {
      const delta=(event.clientX-drag.x)*.006;
      rotation+=delta;velocity=reduced.matches?0:delta*.7;
      tilt=Math.max(-.5,Math.min(.5,tilt+(event.clientY-drag.y)*.003));
      drag.x=event.clientX;drag.y=event.clientY;draw();
    }
  });
  function endDrag(){drag=null;canvas.classList.remove('is-dragging');}
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',()=>{velocity=0;endDrag();});
  canvas.addEventListener('lostpointercapture',endDrag);
  hero.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||reduced.matches||paused)return;
    const rect=hero.getBoundingClientRect();aimX=(event.clientX-rect.left)/rect.width*2-1;aimY=(event.clientY-rect.top)/rect.height*2-1;
  });
  hero.addEventListener('pointerleave',()=>{aimX=0;aimY=0;});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  new ResizeObserver(resize).observe(scene);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(hero);
  resize();sync();buttons.forEach(button=>{button.disabled=false;});
}
