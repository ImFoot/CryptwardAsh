import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.argv[2])||4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.ico':'image/x-icon'};
http.createServer((req,res)=>{
 if(req.url==='/cryptward-health'){res.writeHead(200,{'Content-Type':'text/plain'});res.end('CRYPTWARD_LOCAL');return;}
 let decoded;try{decoded=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
 const target=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
 if(!target.startsWith(root+path.sep)||decoded.includes('\\')){res.writeHead(403);res.end();return;}
 fs.stat(target,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':path.extname(target)==='.html'?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff'});fs.createReadStream(target).pipe(res);});
}).listen(port,'127.0.0.1',()=>console.log('Cryptward is ready at http://127.0.0.1:'+port));
