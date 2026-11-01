/* Zero-dependency Node HTTP/WebSocket server — Chùa Vĩnh Tràng Online. */
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'public');
const PORT=Number(process.env.PORT)||3000;
const MAX_PLAYERS=70;
const peers=new Map();
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp3':'audio/mpeg','.ogg':'audio/ogg','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
const server=http.createServer((req,res)=>{
  let url;try{url=new URL(req.url,'http://localhost')}catch{res.writeHead(400);return res.end('Bad request')}
  if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true,players:peers.size}))}
  let rel;try{rel=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname)}catch{res.writeHead(400);return res.end('Bad path')}
  const target=path.resolve(root,'.'+rel);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}
  fs.stat(target,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);return res.end('Not found')}
    const ext=path.extname(target);res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':ext==='.mp3'?'public, max-age=7200':'no-store','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();fs.createReadStream(target).pipe(res)
  });
});
function writeFrame(socket,op,payload=Buffer.alloc(0)){if(socket.destroyed)return;const size=payload.length;let head;if(size<126){head=Buffer.from([0x80|op,size])}else{head=Buffer.alloc(4);head[0]=0x80|op;head[1]=126;head.writeUInt16BE(size,2)}try{socket.write(Buffer.concat([head,payload]))}catch{}}
function send(socket,obj){const raw=Buffer.from(JSON.stringify(obj));if(raw.length<=65535)writeFrame(socket,1,raw)}
function cleanName(n){return typeof n==='string'?n.replace(/[<>\r\n\x00-\x1f]/g,'').trim().slice(0,18)||'Khách an nhiên':'Khách an nhiên'}
function cleanChat(n){return typeof n==='string'?n.replace(/[\x00-\x1f<>]/g,'').trim().slice(0,120):''}
function summary(){return [...peers.values()].map(p=>({id:p.id,name:p.name,x:p.x,z:p.z,a:p.a,room:p.room,color:p.color}))}
function broadcasts(){const list=summary();const payload=Buffer.from(JSON.stringify({type:'players',players:list}));for(const p of peers.values())writeFrame(p.socket,1,payload)}
const colors=['#4d847c','#c78464','#a47bb1','#5d9a62','#d0a15e'];
function join(socket){if(peers.size>=MAX_PLAYERS){send(socket,{type:'notice',text:'Phòng đã đủ người. Vui lòng thử lại sau.'});socket.end();return}const id=crypto.randomBytes(5).toString('hex');const p={id,socket,buffer:Buffer.alloc(0),x:0,z:27,a:0,room:'yard',name:'Khách an nhiên',color:colors[peers.size%colors.length],lastMove:Date.now(),lastChat:0,lastActivity:0};peers.set(socket,p);send(socket,{type:'welcome',id,x:p.x,z:p.z,a:0,room:'yard'});broadcasts();socket.on('data',buf=>ingest(p,buf));socket.on('close',()=>{peers.delete(socket);broadcasts()});socket.on('error',()=>{peers.delete(socket)});}
function ingest(p,data){p.buffer=Buffer.concat([p.buffer,data]);if(p.buffer.length>16384){p.socket.destroy();return}while(p.buffer.length>=2){const b=p.buffer;const op=b[0]&15;const fin=(b[0]&128)!==0;const masked=(b[1]&128)!==0;let len=b[1]&127,off=2;if(!fin||!masked){p.socket.destroy();return}if(len===126){if(b.length<4)return;len=b.readUInt16BE(2);off=4}else if(len===127){p.socket.destroy();return}if(len>4096){p.socket.destroy();return}if(b.length<off+4+len)return;const mask=b.subarray(off,off+4);let payload=Buffer.from(b.subarray(off+4,off+4+len));for(let i=0;i<len;i++)payload[i]^=mask[i%4];p.buffer=b.subarray(off+4+len);
if(op===8){writeFrame(p.socket,8);p.socket.end();return}if(op===9){writeFrame(p.socket,10,payload);continue}if(op===10)continue;if(op!==1)continue;let msg;try{msg=JSON.parse(payload.toString('utf8'))}catch{continue}if(msg&&typeof msg==='object')onMessage(p,msg)}}
function onMessage(p,m){const now=Date.now();switch(m.type){case 'hello':p.name=cleanName(m.name);break;
case 'move':{const x=Number(m.x),z=Number(m.z),a=Number(m.a);if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(a))return;
  const lim=p.room==='hall'?{xmin:-12.3,xmax:12.3,zmin:-24,zmax:20.9}:{xmin:-30,xmax:30,zmin:-6.2,zmax:44};
  const cx=Math.max(lim.xmin,Math.min(lim.xmax,x)),cz=Math.max(lim.zmin,Math.min(lim.zmax,z));
  const maxDistance=Math.max(1.6,Math.min(5,(now-p.lastMove)/1000*9+1.5));const dis=Math.hypot(cx-p.x,cz-p.z);
  if(dis>maxDistance){const fac=maxDistance/dis;p.x+=(cx-p.x)*fac;p.z+=(cz-p.z)*fac}else{p.x=cx;p.z=cz}p.a=((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI);p.lastMove=now;break}
case 'room':{if(m.room==='hall'&&p.room==='yard'&&p.z<2&&Math.abs(p.x)<7){p.room='hall';p.x=0;p.z=18;p.a=0;send(p.socket,{type:'welcome',id:p.id,room:p.room,x:p.x,z:p.z,a:p.a});}
 else if(m.room==='yard'&&p.room==='hall'&&p.z>11){p.room='yard';p.x=0;p.z=1;p.a=Math.PI;send(p.socket,{type:'welcome',id:p.id,room:p.room,x:p.x,z:p.z,a:p.a});}
 break}
case 'chat':{const s=cleanChat(m.text);if(!s||now-p.lastChat<1300)return;p.lastChat=now;for(const other of peers.values())if(other.room===p.room)send(other.socket,{type:'chat',name:p.name,room:p.room,text:s});break}
case 'activity':{if(!['prayer','bell'].includes(m.kind)||now-p.lastActivity<2500)return;p.lastActivity=now;for(const other of peers.values())if(other.room===p.room)send(other.socket,{type:'activity',kind:m.kind,name:p.name,room:p.room,id:p.id});break}
}}
server.on('upgrade',(req,socket,head)=>{if(req.url!=='/ws'||req.headers.upgrade?.toLowerCase()!=='websocket'||!req.headers['sec-websocket-key']||req.headers['sec-websocket-version']!=='13'){socket.destroy();return}const key=req.headers['sec-websocket-key'];if(!/^[A-Za-z0-9+/]{22}==$/.test(key)){socket.destroy();return}const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');join(socket);if(head?.length){const p=peers.get(socket);if(p)ingest(p,head)}});
const timer=setInterval(broadcasts,150);timer.unref();
if(require.main===module)server.listen(PORT,'0.0.0.0',()=>console.log(`Vĩnh Tràng Online: http://localhost:${PORT}`));
module.exports={server,peers,cleanName,cleanChat};
