/* VĨNH TRÀNG ONLINE — Web canvas 3D engine: zero external libraries. */
(() => {
'use strict';
const $ = (id) => document.getElementById(id);
const canvas=$('scene'),ctx=canvas.getContext('2d',{alpha:false});
const hallTitle='Chánh điện', yardTitle='Sân chùa Vĩnh Tràng';
const state={started:false,room:'yard',x:0,z:27,angle:0,name:'Khách',id:null,online:false,peers:[],ws:null,sound:true,audio:null,speech:false,chant:false,lastNet:0,frame:0,interact:null,keys:new Set(),joyX:0,joyY:0,dragging:false,dragX:0,scene:{} ,toastTimer:null,chantTrack:null,ambient:null};
const PALETTE={cream:'#eacb90',ivory:'#f3e7c5',ochre:'#bf9253',moss:'#66815a',red:'#91543e',dark:'#3b3028',wood:'#6b362c',floor:'#bea787'};
let W=1,H=1,DPR=1,F=400,cam={x:0,y:3.8,z:0,a:0};
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function lerp(a,b,t){return a+(b-a)*t}
function resize(){DPR=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);F=Math.min(W*1.09,H*.91)}
window.addEventListener('resize',resize);resize();
const data={yard:[],hall:[]};
function face(room,pts,color,stroke=null){data[room].push({pts,color,stroke})}
function quad(r,pts,color,stroke){face(r,pts,color,stroke)}
function box(r,x,y,z,w,h,d,front,side=front,top=front){const a=x-w/2,b=x+w/2,u=y,v=y+h,c=z-d/2,e=z+d/2;
quad(r,[{x:a,y:u,z:c},{x:b,y:u,z:c},{x:b,y:v,z:c},{x:a,y:v,z:c}],front);
quad(r,[{x:b,y:u,z:e},{x:a,y:u,z:e},{x:a,y:v,z:e},{x:b,y:v,z:e}],front);
quad(r,[{x:a,y:u,z:e},{x:a,y:u,z:c},{x:a,y:v,z:c},{x:a,y:v,z:e}],side);
quad(r,[{x:b,y:u,z:c},{x:b,y:u,z:e},{x:b,y:v,z:e},{x:b,y:v,z:c}],side);
quad(r,[{x:a,y:v,z:c},{x:b,y:v,z:c},{x:b,y:v,z:e},{x:a,y:v,z:e}],top);
}
function plane(r,x,z,w,d,color,y=.02){quad(r,[{x:x-w/2,y,z:z-d/2},{x:x+w/2,y,z:z-d/2},{x:x+w/2,y,z:z+d/2},{x:x-w/2,y,z:z+d/2}],color)}
function column(r,x,z,y,h,radius,col,cap='#e2b36b',n=8){const arr=[];for(let i=0;i<n;i++){const a=2*Math.PI*i/n,b=2*Math.PI*(i+1)/n;const pa={x:x+radius*Math.cos(a),z:z+radius*Math.sin(a)},pb={x:x+radius*Math.cos(b),z:z+radius*Math.sin(b)};quad(r,[{...pa,y},{...pb,y},{...pb,y:y+h},{...pa,y:y+h}],(i%3===0)?shade(col,-13):col)}box(r,x,y-.12,z,radius*2.4,.22,radius*2.4,cap);box(r,x,y+h-.1,z,radius*2.45,.3,radius*2.45,cap)}
function roof(r,cx,cz,width,length,height,baseY,col='#8d4132'){const L=cx-width/2,R=cx+width/2,N=cz-length/2,S=cz+length/2;const ridge=baseY+height;
quad(r,[{x:L,y:baseY,z:N},{x:cx,y:ridge,z:N},{x:cx,y:ridge,z:S},{x:L,y:baseY,z:S}],col);
quad(r,[{x:cx,y:ridge,z:N},{x:R,y:baseY,z:N},{x:R,y:baseY,z:S},{x:cx,y:ridge,z:S}],shade(col,-9));
face(r,[{x:L,y:baseY,z:S},{x:R,y:baseY,z:S},{x:cx,y:ridge,z:S}],'#dbb472');
box(r,cx,ridge-.10,cz,.24,.32,length+.5,'#ebc574');box(r,cx,baseY-.19,cz,width+.8,.23,length+.5,'#e0ae62');
for(let i=1;i<10;i++){const t=i/10;const x=lerp(L,cx,t),y=lerp(baseY,ridge,t);box(r,x,y-.04,cz,.055,.06,length,'#ab6c43');box(r,2*cx-x,y-.04,cz,.055,.06,length,'#ab6c43')}
}
function sphere(r,x,y,z,rx,ry,rz,color,segments=8,layers=3){for(let j=0;j<layers;j++){let lat1=-Math.PI/2+Math.PI*j/layers,lat2=-Math.PI/2+Math.PI*(j+1)/layers;for(let i=0;i<segments;i++){let a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;const p=(la,lo)=>({x:x+rx*Math.cos(la)*Math.cos(lo),y:y+ry*Math.sin(la),z:z+rz*Math.cos(la)*Math.sin(lo)});quad(r,[p(lat1,a),p(lat1,b),p(lat2,b),p(lat2,a)],i%3===0?shade(color,9):color)}}}
function tree(r,x,z,s=1,color='#426e48'){box(r,x,0,z,.55*s,3*s,.55*s,'#76523c');sphere(r,x,3.5*s,z,2.15*s,2.05*s,2.15*s,color,8,3);sphere(r,x-.9*s,4*s,z-.4*s,1.35*s,1.4*s,1.35*s,shade(color,14),7,2)}
function flowerPot(r,x,z){box(r,x,.0,z,1.32,.62,1.32,'#ba7558','#a96049','#da8d62');tree(r,x,z,.48,'#487a4d');for(let a=0;a<5;a++){let angle=a*6.28/5;sphere(r,x+.47*Math.cos(angle),1.6,z+.4*Math.sin(angle),.17,.18,.17,'#edb1b3',5,2)}}
function lamp(r,x,z,h=3){column(r,x,z,0,h,.12,'#333e3c');box(r,x,h,z,.7,1,.7,'#554836','#a38654','#6f4a30');box(r,x,h+.92,z,.92,.15,.92,'#bd925b');sphere(r,x,h+.52,z,.26,.3,.26,'#ffdc8f',6,2)}
function buddha(r,x,y,z,s=1){ // Reverent stylized sculpture, not a photogrammetric copy.
box(r,x,y,z,3.2*s,.46*s,2.6*s,'#9e7847','#856139','#d4a762');
sphere(r,x,y+1.27*s,z,1.1*s,.72*s,.78*s,'#d9b76e');sphere(r,x,y+2.2*s,z,.8*s,1.0*s,.61*s,'#e5bf74');
sphere(r,x,y+3.33*s,z,.51*s,.62*s,.48*s,'#f4d38b');sphere(r,x,y+3.93*s,z,.46*s,.19*s,.4*s,'#a66d37');
sphere(r,x-.94*s,y+1.79*s,z+.1*s,.32*s,.75*s,.34*s,'#e2bc72',7,2);sphere(r,x+.94*s,y+1.79*s,z+.1*s,.32*s,.75*s,.34*s,'#e2bc72',7,2);
}
function arch(r,x,base,z,w,h,color){ // curved masonry outline in frontal plane
let n=12;const v=(theta,rad)=>({x:x+rad*Math.cos(theta),y:base+h+rad*Math.sin(theta),z});for(let i=0;i<n;i++){const a=Math.PI*i/n,b=Math.PI*(i+1)/n;quad(r,[v(a,w/2),v(b,w/2),v(b,w/2+.24),v(a,w/2+.24)],color)}
box(r,x-w/2-.12,base,z,.22,h,.25,color);box(r,x+w/2+.12,base,z,.22,h,.25,color)}
function banner(r,x,y,z,w,h,color){box(r,x,y,z,w,h,.11,color)}
function altarItems(r,z){box(r,0,.2,z,8,1.4,2.4,'#693427','#542e24','#8c5435');box(r,0,1.64,z,8.5,.22,2.8,'#bc8b4f');buddha(r,0,1.8,z-.3,1.16);for(let x of [-3.1,3.1]){column(r,x,z+.88,1.7,1.2,.06,'#f2cb77');sphere(r,x,2.85,z+.87,.26,.35,.26,'#ffda91',7,2)}for(let x of [-2,-1,1,2]){sphere(r,x,1.91,z+1,.20,.15,.21,'#df867e',6,2)}box(r,0,1.7,z+1.1,.42,.86,.42,'#b57b43');box(r,0,2.56,z+1.1,.52,.12,.52,'#ddba76')}
function buildYard(){const r='yard';plane(r,0,7,90,90,'#94a384',-.1); // paved courtyard
plane(r,0,16,15,61,'#cabb97',.0);plane(r,0,12,9,52,'#d6c49c',.015);
for(let z=-8;z<47;z+=3.6){box(r,0,.026,z,14.6,.012,.042,'#ada382');for(let x of [-7,-3.4,0,3.4,7])box(r,x,.035,z+1.8,.055,.012,1.85,'#a89c7f')}
// Side lawns and low hedges
for(let side of [-1,1]){plane(r,side*19,10,20,68,'#789360',.0);for(let z=-4;z<43;z+=5.8){sphere(r,side*11.2,.52,z,1.12,.63,1.1,'#5f9158',7,2);if(z%2<1)flowerPot(r,side*15.4,z+1.9)}for(let z of [4,31]){tree(r,side*25,z,1.65,side<0?'#578759':'#487c60')}for(let z of [11,26])lamp(r,side*8.6,z,3.1)}
// Temple body, facade and roof
box(r,0,0,-17,36,8.4,17,'#e1c18b','#d9b27b','#e9cb99');
box(r,0,4.75,-8.34,36,.55,.3,'#d79d57');box(r,0,7.93,-8.35,39,.48,.46,'#d8b76e');
box(r,0,8.2,-17,38,.5,18,'#dbb168');roof(r,0,-17,41,20,3.5,8.5,'#975b43');
box(r,0,11.7,-17,13,3.1,10,'#e3bc81');roof(r,0,-17,16,11,2.25,14.6,'#a3593e');
// ornate bands
for(let y of [1.1,4.4,7.45])box(r,0,y,-8.18,36,.17,.21,y===4.4?'#8e6a5e':'#edcf8d');
for(let x of [-15.7,-10.5,-5.3,5.3,10.5,15.7]){
column(r,x,-7.9,.65,7.2,.55,'#dfbd82','#9e6c48',9);box(r,x,5.8,-7.52,.76,.65,.26,'#b6c5ad');
}
// archways and inset windows
for(let x of [-13,-7.8,7.8,13]){box(r,x,.85,-7.97,3.6,4.4,.09,'#5b4437');arch(r,x,5.28,-7.79,3.6,4.4,'#e8cca0');for(let j=0;j<4;j++)box(r,x-1.1+j*.73,1.1,-7.7,.08,3.6,.08,'#be976b')}
// central door: dark opening
box(r,0,.25,-7.75,6.0,6.1,.4,'#2d2626');arch(r,0,6.3,-7.52,6.0,5.9,'#e4bd7c');
box(r,-2.45,.35,-7.45,.08,5.4,.18,'#aa7149');box(r,2.45,.35,-7.45,.08,5.4,.18,'#aa7149');
box(r,0,6.75,-7.26,6.7,.7,.35,'#785432');banner(r,0,6.78,-7.02,5.5,.42,'#e7cf91');
for(let z of [-2,-.8,.4])box(r,0,.06+Math.max(0,(z+2)*.15),z,9,.14,1.12,'#d6bc90');
// courtyard sculptures
for(let s of [-1,1]){box(r,s*19,0,-1.2,3,1.1,3,'#b89b72');buddha(r,s*19,1.1,-1.2,.75);for(let z of [5,21,36])flowerPot(r,s*13.1,z)}
// entry portal is at x=0,z=-5
box(r,0,0,44,11,.25,4,'#e3c99a','#d2b688','#ead5ab');
}
function buildHall(){const r='hall';plane(r,0,0,30,54,'#8e6d55',-.08);plane(r,0,0,23.5,50,'#d3b68b',0);
for(let z=-24;z<26;z+=2.45){box(r,0,.025,z,23,.016,.04,'#a48665');for(let x=-10;x<11;x+=3)box(r,x,.026,z+1.24,.04,.01,1.2,'#bb9672')}
// chamber dark timber walls, large front altar
box(r,0,0,-27,29,13,.6,'#684739');box(r,-14.6,0,0,.5,12,54,'#6a473a');box(r,14.6,0,0,.5,12,54,'#6a473a');box(r,0,11.9,0,29,.4,54,'#4f2e26');
for(let x of [-13,-9.5,-6,-2.5,2.5,6,9.5,13]){for(let z of [-20,-8,4,16]){column(r,x,z,0,11,.48,'#6d3529','#b48351',8)} }
for(let z=-23;z<24;z+=6){box(r,0,11.45,z,27,.62,.75,'#844d38');for(let x=-12;x<=12;x+=4)box(r,x,11,z,.24,.8,7,'#a97550')}
for(let x of [-14.4,14.4])for(let z=-20;z<23;z+=5){box(r,x>0?14.19:-14.19,4.1,z,.1,4.5,2.3,'#9e704d');box(r,x>0?14.1:-14.1,4.55,z,.11,3.4,1.7,'#c6a777')}
// gold altar and back halo
box(r,0,2,-26.45,13,8,.35,'#885736');box(r,0,2.2,-26.1,10.4,7.5,.25,'#b38b4b');sphere(r,0,6.3,-25.83,3.7,3.6,.3,'#d4ac60',10,3);altarItems(r,-22.7);
for(let s of [-1,1]){buddha(r,s*8.2,.7,-22.4,.69);box(r,s*8.2,.2,-22.3,4,.65,3,'#955e39');for(let z of [-19,-12,-5,3,11]){box(r,s*12.35,3,z,.22,2.9,1.3,'#c19b65');box(r,s*12.15,6.8,z,.16,1.1,1.4,'#e4bc79')}}
for(let z of [-15,-5,5]){for(let x of [-5,5]){box(r,x,9,z,.12,2,.12,'#b18a58');box(r,x,7.9,z,.85,1.4,.85,'#e2b878','#a67d51','#f1d299');sphere(r,x,8.4,z,.33,.42,.35,'#ffe2a7',6,2)}}
for(let z of [1,7,13])for(let x of [-4,0,4]){plane(r,x,z,2.3,3.2,'#945a46',.045);plane(r,x,z,1.85,2.75,'#d9b58a',.048)}
// grand rear exit, behind camera when facing altar
box(r,0,1.0,26.51,8,9,.3,'#2b211e');arch(r,0,9.7,26.3,8,8.8,'#ca9e69');
}
function shade(h,add){let n=parseInt(h.replace('#',''),16),a=[n>>16,(n>>8)&255,n&255].map(v=>clamp(v+add,0,255)|0);return '#'+a.map(v=>v.toString(16).padStart(2,'0')).join('')}
buildYard();buildHall();
function viewPoint(p){const dx=p.x-cam.x,dz=p.z-cam.z,si=Math.sin(cam.a),co=Math.cos(cam.a);return {x:dx*co+dz*si,y:p.y-cam.y,z:dx*si-dz*co}}
function clipNear(pts,near=.32){let out=[];for(let i=0;i<pts.length;i++){let a=pts[i],b=pts[(i+1)%pts.length],aIn=a.z>=near,bIn=b.z>=near;if(aIn)out.push(a);if(aIn!==bIn){let t=(near-a.z)/(b.z-a.z);out.push({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),z:near})}}return out}
function project(p){return{x:W/2+p.x*F/p.z,y:H*.48-p.y*F/p.z}}
function worldProject(p){let v=viewPoint(p);return v.z>.4?{...project(v),depth:v.z}:null}
function background(){let sky=ctx.createLinearGradient(0,0,0,H*.70);if(state.room==='yard'){sky.addColorStop(0,'#85b5c2');sky.addColorStop(.48,'#d6d5bd');sky.addColorStop(1,'#f1d9a5')}else{sky.addColorStop(0,'#463d34');sky.addColorStop(.5,'#856951');sky.addColorStop(1,'#ac8970')}ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);if(state.room==='yard'){ctx.fillStyle='#f2d9a9';ctx.globalAlpha=.64;ctx.beginPath();ctx.arc(W*.8,H*.18,Math.min(W*.052,46),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#829c78';ctx.beginPath();ctx.moveTo(0,H*.56);for(let i=0;i<=W;i+=36)ctx.lineTo(i,H*(.55+Math.sin(i*.015)*.016));ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill()}}
function drawWorld(){const faces=[];const all=data[state.room];for(let i=0;i<all.length;i++){let f=all[i],v=f.pts.map(viewPoint),avg=v.reduce((s,p)=>s+p.z,0)/v.length;if(avg<-12||avg>130||Math.max(...v.map(p=>p.z))<.3)continue;faces.push({v,avg,c:f.color,stroke:f.stroke})}faces.sort((a,b)=>b.avg-a.avg);for(const f of faces){let cut=clipNear(f.v);if(cut.length<3)continue;let proj=cut.map(project);if(proj.every(p=>p.x<-200)||proj.every(p=>p.x>W+200)||proj.every(p=>p.y<-200)||proj.every(p=>p.y>H+200))continue;ctx.beginPath();ctx.moveTo(proj[0].x,proj[0].y);for(let i=1;i<proj.length;i++)ctx.lineTo(proj[i].x,proj[i].y);ctx.closePath();ctx.fillStyle=f.c;ctx.fill();if(f.stroke){ctx.strokeStyle=f.stroke;ctx.lineWidth=.7;ctx.stroke()}}}
function drawAvatar(p,me=false){const pos=worldProject({x:p.x,y:0,z:p.z});if(!pos)return;const sc=F/pos.depth;const px=pos.x,py=pos.y;const h=clamp(1.7*sc,9,260);if(px<-h||px>W+h||py<-h*2||py>H+h)return;
ctx.save();ctx.translate(px,py);ctx.fillStyle='#1b241e4d';ctx.beginPath();ctx.ellipse(0,0,h*.26,h*.085,0,0,6.283);ctx.fill();
ctx.fillStyle=me?'#2d6959':p.color||'#4d847c';ctx.beginPath();ctx.moveTo(-h*.24,-h*.38);ctx.quadraticCurveTo(-h*.31,-h*.68,-h*.12,-h*.74);ctx.lineTo(h*.12,-h*.74);ctx.quadraticCurveTo(h*.30,-h*.67,h*.24,-h*.38);ctx.closePath();ctx.fill();
ctx.fillStyle='#425044';ctx.fillRect(-h*.17,-h*.37,h*.14,h*.33);ctx.fillRect(h*.04,-h*.37,h*.14,h*.33);
ctx.fillStyle='#e4b18b';ctx.beginPath();ctx.ellipse(0,-h*.86,h*.17,h*.185,0,0,6.283);ctx.fill();ctx.fillStyle='#3e3029';ctx.beginPath();ctx.ellipse(0,-h*.96,h*.169,h*.08,0,Math.PI,Math.PI*2);ctx.fill();
if(!me){ctx.font=`700 ${clamp(h*.14,10,14)}px system-ui`;const txt=p.name||'Khách';let width=Math.min(ctx.measureText(txt).width+17,150);ctx.fillStyle='#19382eea';ctx.beginPath();ctx.roundRect(-width/2,-h*1.37,width,23,8);ctx.fill();ctx.fillStyle='#fff4d7';ctx.textAlign='center';ctx.fillText(txt,0,-h*1.37+15)}ctx.restore()}
function addParticles(t){ // wind-blown petals, subtle atmosphere
ctx.save();for(let i=0;i<13;i++){let x=((i*137.7+t*.009*(i%3+1))%(W+120))-60,y=((i*89+t*.014*(i%4+1))%(H+70))-30;ctx.globalAlpha=.16+(i%4)*.045;ctx.fillStyle=state.room==='yard'?'#fff5df':'#f7d292';ctx.beginPath();ctx.ellipse(x,y,1.6+(i%3),3.7+(i%2),Math.sin(t*.0004+i),0,6.283);ctx.fill()}ctx.restore()}
let lastTime=performance.now();function frame(t){const dt=Math.min((t-lastTime)/1000,.05);lastTime=t;if(state.started){move(dt);let bx=Math.sin(state.angle),bz=-Math.cos(state.angle);cam.x=state.x-bx*7.2;cam.z=state.z-bz*7.2;cam.y=4.3;cam.a=state.angle;render(t)}else{cam.x=0;cam.z=36;cam.y=5.8;cam.a=Math.sin(t*.00015)*.08;render(t)}requestAnimationFrame(frame)}
function render(t){ctx.setTransform(DPR,0,0,DPR,0,0);background();drawWorld();if(state.started){let peers=state.peers.filter(p=>p.room===state.room && p.id!==state.id);peers.sort((a,b)=>Math.hypot(a.x-cam.x,a.z-cam.z)-Math.hypot(b.x-cam.x,b.z-cam.z));for(let p of peers.reverse())drawAvatar(p);drawAvatar(state,true)}addParticles(t);if(state.started)checkInteract()}
function move(dt){let u=0,v=0;const k=state.keys;if(k.has('w')||k.has('arrowup'))v+=1;if(k.has('s')||k.has('arrowdown'))v-=1;if(k.has('a')||k.has('arrowleft'))u-=1;if(k.has('d')||k.has('arrowright'))u+=1;u+=state.joyX;v-=state.joyY;let norm=Math.hypot(u,v);if(norm>1){u/=norm;v/=norm}let speed=6.1;const si=Math.sin(state.angle),co=Math.cos(state.angle);let dx=(u*co+v*si)*speed*dt,dz=(u*si-v*co)*speed*dt;const nx=state.x+dx,nz=state.z+dz;
if(state.room==='yard'){state.x=clamp(nx,-30,30);state.z=clamp(nz,-6.2,44);if(state.z<-4.9&&Math.abs(state.x)>4.2)state.z=-4.9}
else{state.x=clamp(nx,-12.3,12.3);state.z=clamp(nz,-24.0,20.9)}
if(performance.now()-state.lastNet>90){state.lastNet=performance.now();send({type:'move',x:state.x,z:state.z,a:state.angle})}}
function checkInteract(){let choice=null;if(state.room==='yard'){let near=Math.hypot(state.x,state.z+5.3);if(near<10){choice={type:'door',title:'Cổng chánh điện',sub:'Nhấn nút vàng hoặc E để bước vào',button:'✧ Bước vào chánh điện'}}else if(Math.hypot(state.x-19,state.z+1.2)<7){choice={type:'reflection',title:'Tượng Phật trong sân',sub:'Dành một phút tĩnh tâm',button:'🪷 Gửi lời nguyện lành'}}else{choice={type:'explore',title:'Dạo quanh sân chùa',sub:'Tiến đến chính giữa mặt tiền để vào chánh điện',button:'✧ Khám phá sân chùa'}}}
else{if(state.z>14){choice={type:'exit',title:'Lối ra sân chùa',sub:'Trở lại khoảng sân thanh tịnh',button:'↩ Trở lại sân chùa'}}else if(state.z<-9&&Math.abs(state.x)<7){choice={type:'prayer',title:'Gian thờ chính',sub:'Thỉnh chuông và lắng lòng niệm Phật',button:'🙏 Chắp tay niệm Phật'}}else{choice={type:'meditate',title:'Không gian chánh điện',sub:'Bạn có thể nghe Phật pháp và cùng tĩnh tâm',button:'🪷 Ngồi tĩnh tâm'}}}
state.interact=choice;$('actionBtn').textContent=choice.button;let show=['door','exit','prayer','reflection'].includes(choice.type);$('notice').classList.toggle('show',show);$('noticeTitle').textContent=choice.title;$('noticeText').textContent=choice.sub;$('guideTitle').textContent=choice.title;$('guideText').textContent=choice.sub}
function inform(msg){$('toast').textContent=msg;$('toast').classList.add('visible');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3100)}
function updateLocation(){$('locName').textContent=state.room==='hall'?'Chánh điện Vĩnh Tràng':yardTitle;$('locDesc').textContent=state.room==='hall'?'Gỗ chạm, gian thờ · Bình an trong từng hơi thở':'Kiến trúc Á – Âu · Vườn cây thanh tịnh';$('locTop').textContent=state.room==='hall'?'KHÔNG GIAN THANH TỊNH':'KHÁM PHÁ KHÔNG GIAN';$('msgs').textContent='';appendMessage('Hệ thống','Bạn đang ở '+(state.room==='hall'?'chánh điện':'sân chùa')+'. Hãy trò chuyện lịch sự.')}
function doAction(){if(!state.started)return;resumeAudio();const c=state.interact;if(!c)return;switch(c.type){case 'door':switchRoom('hall');playBell();break;case 'exit':switchRoom('yard');break;case 'prayer':playBell();sayShort('Nam mô A Di Đà Phật.');inform('🙏 Cầu chúc mọi người thân tâm an lạc.');send({type:'activity',kind:'prayer'});break;case 'reflection':inform('🪷 Xin gửi một lời nguyện lành đến tất cả mọi người.');playBell();break;default:inform('🌿 Hít thở nhẹ nhàng. Một phút bình yên cũng thật đáng quý.')}}
function switchRoom(room){if(room==='hall'){state.x=0;state.z=18;state.angle=0}else{state.x=0;state.z=1;state.angle=Math.PI}state.room=room;ambientRoom();send({type:'room',room});updateLocation();inform(room==='hall'?'🪷 Bạn đã bước vào chánh điện':'🌳 Bạn đã trở lại sân chùa')}
function sayShort(txt){if(!state.sound||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(txt);u.lang='vi-VN';u.rate=.78;u.pitch=.9;u.volume=.62;speechSynthesis.speak(u)}catch(e){}}
function setupAudio(){if(state.audio)return;try{state.audio=new(window.AudioContext||window.webkitAudioContext)()}catch(e){state.audio=null}}
function resumeAudio(){if(!state.sound)return;setupAudio();state.audio?.resume().catch(()=>{});if(state.audio&&!state.ambient){
const ac=state.audio,buf=ac.createBuffer(1,Math.floor(ac.sampleRate*2),ac.sampleRate),arr=buf.getChannelData(0);for(let i=0;i<arr.length;i++)arr[i]=(Math.random()*2-1)*.30;
const noise=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();noise.buffer=buf;noise.loop=true;filter.type='lowpass';filter.frequency.value=280;gain.gain.value=state.room==='yard'?.012:.005;noise.connect(filter).connect(gain).connect(ac.destination);noise.start();state.ambient={noise,gain};}}
function ambientRoom(){if(state.ambient&&state.audio)state.ambient.gain.gain.setTargetAtTime(state.room==='yard'?.012:.005,state.audio.currentTime,.6)}
function ringTone(freq,dur,at,kind='sine',gain=.05){const ac=state.audio;if(!ac)return;const osc=ac.createOscillator(),vol=ac.createGain();osc.type=kind;osc.frequency.setValueAtTime(freq,at);osc.frequency.exponentialRampToValueAtTime(freq*.996,at+dur);vol.gain.setValueAtTime(.0001,at);vol.gain.exponentialRampToValueAtTime(gain,at+.027);vol.gain.exponentialRampToValueAtTime(.0001,at+dur);osc.connect(vol).connect(ac.destination);osc.start(at);osc.stop(at+dur+.04)}
function playBell(){if(!state.sound)return;resumeAudio();if(!state.audio)return;const t=state.audio.currentTime;[[256,3.6,.042],[384,2.9,.018],[512,2.2,.01],[643,1.6,.006],[896,1.4,.004]].forEach(([freq,dur,g])=>ringTone(freq,dur,t,'sine',g))}
function woodblock(){const ac=state.audio;if(!state.sound||!ac)return;let t=ac.currentTime;ringTone(340,.10,t,'triangle',.037);ringTone(180,.12,t,'sine',.025)}
function stopListening(){if(state.chantTrack){state.chantTrack.pause();state.chantTrack.currentTime=0;state.chantTrack=null}window.speechSynthesis?.cancel?.();if(state.chant){clearInterval(state.chant);state.chant=false}$('listenBtn').textContent='♫ Nghe Phật pháp'}
const teaching='Trong cuộc sống, khi tâm mình bình lặng, ta thấy rõ hơn những điều đang xảy ra. Hãy tập thở chậm, lắng nghe và nói lời tử tế. Lòng từ bi bắt đầu từ những hành động nhỏ mỗi ngày. Chúc mọi người thân tâm thường an lạc.';
async function playListening(){resumeAudio();if(!state.sound){inform('Hãy bật âm thanh trước nhé.');return}if(state.chant||state.chantTrack){stopListening();inform('Đã dừng âm thanh.');return}try{const kind=state.room==='hall'?'chant':'dharma';let audio=new Audio('audio/'+kind+'.mp3');audio.loop=true;await audio.play();state.chantTrack=audio;$('listenBtn').textContent='Ⅱ Dừng nghe';inform('Đang phát bản thu âm đã cấp phép.');audio.onerror=()=>stopListening();return}catch(e){/* Sound files are intentionally optional. */}
if('speechSynthesis' in window){sayShort(teaching);state.chant=setInterval(woodblock,1900);$('listenBtn').textContent='Ⅱ Dừng nghe';inform('Đang nghe lời suy ngẫm bằng giọng máy và nhịp mõ mô phỏng.');const end=()=>{if(!speechSynthesis.speaking)stopListening()};setTimeout(end,28000)}else{woodblock();inform('Trình duyệt này chưa hỗ trợ đọc giọng Việt. Có thể bổ sung bản thu MP3 vào thư mục audio.')}}
function appendMessage(name,msg){const wrap=document.createElement('div');wrap.className='msg';const who=document.createElement('b');who.textContent=name+': ';wrap.append(who,document.createTextNode(msg));$('msgs').append(wrap);$('msgs').scrollTop=$('msgs').scrollHeight;while($('msgs').children.length>45)$('msgs').firstChild.remove()}
function send(msg){if(state.ws?.readyState===WebSocket.OPEN)state.ws.send(JSON.stringify(msg))}
function connect(){let host=location.host;if(!host||location.protocol==='file:'){$('onlineLabel').textContent='Chơi một mình';inform('Mở qua máy chủ để chơi cùng bạn bè.');return}let ws;try{ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+host+'/ws')}catch(e){$('onlineLabel').textContent='Ngoại tuyến';return}state.ws=ws;
ws.onopen=()=>{state.online=true;$('dot').classList.add('live');send({type:'hello',name:state.name,room:state.room});$('onlineLabel').textContent='Đang trực tuyến'};
ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m.type==='welcome'){state.id=m.id;state.x=m.x;state.z=m.z;state.angle=m.a||0;state.room=m.room||'yard';updateLocation()}
if(m.type==='players'){state.peers=m.players||[];let count=state.peers.filter(p=>p.room===state.room).length;$('onlineLabel').textContent=count+' người cùng khu'}
if(m.type==='chat'&&m.room===state.room)appendMessage(m.name,m.text);
if(m.type==='activity'&&m.room===state.room&&m.id!==state.id)inform('🪷 '+m.name+' vừa chắp tay niệm Phật.');
if(m.type==='notice')inform(m.text)};
ws.onclose=()=>{state.online=false;$('dot').classList.remove('live');$('onlineLabel').textContent='Mất kết nối';setTimeout(()=>{if(state.started)connect()},2600)};
ws.onerror=()=>{};
}
$('startBtn').addEventListener('click',()=>{let name=$('nickname').value.trim().replace(/[<>\r\n]/g,'').slice(0,18);state.name=name||'Khách an nhiên';state.started=true;$('entry').classList.add('hide');resize();resumeAudio();connect();inform('Chào '+state.name+'! Hãy thử đi về phía chánh điện.');});
$('nickname').addEventListener('keydown',e=>{if(e.key==='Enter')$('startBtn').click()});try{$('nickname').value=localStorage.getItem('vt_name')||''}catch(e){};$('nickname').addEventListener('input',()=>(()=>{try{localStorage.setItem('vt_name',$('nickname').value.slice(0,18))}catch(e){}})());
$('actionBtn').addEventListener('click',doAction);$('bellBtn').addEventListener('click',()=>{playBell();inform('🔔 Một tiếng chuông bình an.');send({type:'activity',kind:'bell'})});$('listenBtn').addEventListener('click',playListening);
$('soundBtn').addEventListener('click',()=>{state.sound=!state.sound;if(!state.sound){stopListening();state.audio?.suspend().catch(()=>{})}else{resumeAudio();playBell()}$('soundBtn').textContent=state.sound?'♫':'♪̸';inform(state.sound?'Đã bật âm thanh':'Đã tắt âm thanh')});
$('chatBtn').addEventListener('click',()=>$('chatPanel').classList.toggle('hide'));$('chatClose').addEventListener('click',()=>$('chatPanel').classList.add('hide'));$('chatForm').addEventListener('submit',e=>{e.preventDefault();let txt=$('chatInput').value.trim();if(!txt)return;if(!state.online){inform('Cần kết nối máy chủ để trò chuyện.');return}send({type:'chat',text:txt});$('chatInput').value=''});
window.addEventListener('keydown',e=>{if(document.activeElement?.tagName==='INPUT')return;let key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' '].includes(key))e.preventDefault();state.keys.add(key);if(key==='e')doAction();if(key===' ')playBell();if(key==='q')state.angle-=.15;if(key==='r')state.angle+=.15});window.addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{state.keys.clear();state.joyX=0;state.joyY=0});
const joy=$('joy'),stick=$('stick');let stickPointer=null;function stickUpdate(e){const b=joy.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;let dx=e.clientX-cx,dy=e.clientY-cy,m=Math.hypot(dx,dy),max=b.width*.35;if(m>max){dx*=max/m;dy*=max/m}state.joyX=dx/max;state.joyY=dy/max;const size=stick.getBoundingClientRect().width;stick.style.left=(b.width/2-size/2+dx)+'px';stick.style.top=(b.height/2-size/2+dy)+'px'}joy.addEventListener('pointerdown',e=>{e.preventDefault();stickPointer=e.pointerId;joy.setPointerCapture(e.pointerId);stickUpdate(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)stickUpdate(e)});function resetStick(e){if(e.pointerId!==stickPointer)return;stickPointer=null;state.joyX=state.joyY=0;stick.style.left=stick.style.top='';}joy.addEventListener('pointerup',resetStick);joy.addEventListener('pointercancel',resetStick);
let lookPointer=null,lookStart=0;canvas.addEventListener('pointerdown',e=>{if(!state.started)return;lookPointer=e.pointerId;lookStart=e.clientX;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;const dx=e.clientX-lookStart;state.angle+=dx*.0045;lookStart=e.clientX});const endLook=e=>{if(e.pointerId===lookPointer)lookPointer=null};canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);
// Make the first view visible before the player has clicked Enter.
requestAnimationFrame(frame);
})();
