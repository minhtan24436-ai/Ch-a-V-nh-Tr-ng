const test = require('node:test');
const assert = require('node:assert/strict');
const {server,cleanName,cleanChat} = require('../server');

test('Name and chat text are bounded and sanitized', () => {
 assert.equal(cleanName('  <Otis>  '),'Otis');
 assert.equal(cleanChat('chào\n<script>'),'chàoscript');
 assert.equal(cleanName(''), 'Khách an nhiên');
});

test('HTTP serves game files and health endpoint', async t => {
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 t.after(() => server.close());
 const base='http://127.0.0.1:'+server.address().port;
 const h=await fetch(base+'/health');assert.equal(h.status,200);assert.equal((await h.json()).ok,true);
 const index=await fetch(base+'/');assert.equal(index.status,200);assert.match(await index.text(),/Vĩnh Tràng Online/);
 const js=await fetch(base+'/game.js');assert.equal(js.status,200);
 const unknown=await fetch(base+'/does-not-exist');assert.equal(unknown.status,404);
});

test('Two browser clients can communicate over WebSocket', {skip: typeof WebSocket==='undefined'}, async t => {
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 t.after(() => server.close());
 const url='ws://127.0.0.1:'+server.address().port+'/ws';
 const a=new WebSocket(url),b=new WebSocket(url);const am=[],bm=[];
 a.addEventListener('message',e=>am.push(JSON.parse(e.data)));
 b.addEventListener('message',e=>bm.push(JSON.parse(e.data)));
 await Promise.all([a,b].map(ws => new Promise((ok,bad)=>{ws.onopen=ok;ws.onerror=bad})));
 t.after(()=>{a.close();b.close()});
 a.send(JSON.stringify({type:'hello',name:'Otis'}));b.send(JSON.stringify({type:'hello',name:'Hương'}));
 await new Promise(r=>setTimeout(r,320));
 assert.equal(am.find(m=>m.type==='players')?.players.length>=1,true);
 a.send(JSON.stringify({type:'chat',text:'Xin chào'}));
 await new Promise(r=>setTimeout(r,140));
 assert.equal(bm.some(m=>m.type==='chat'&&m.text==='Xin chào'),true);
});
