import {createRequire} from 'node:module'
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {execFileSync,spawn} from 'node:child_process'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url)
const {chromium,_electron}=require(process.env.PLAYWRIGHT_MODULE||'playwright')
const native=process.argv.includes('--electron')
const root=await mkdtemp(join(tmpdir(),'supernova-desktop-smoke-'))
const name='supernova-desktop-test-'+process.pid
let vite,browser,app,container=false
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8'}).trim()
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))
try{
 await mkdir(join(root,'music'));await mkdir(join(root,'data'));await mkdir(join(root,'profile'))
 execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','sine=duration=2','-metadata','title=First Signal','-metadata','artist=Test Artist','-metadata','album=Purple Night','-y',join(root,'music','first.mp3')])
 docker('run','-d','--rm','--name',name,'--user',`${process.getuid()}:${process.getgid()}`,'-p','127.0.0.1::8080','-v',`${root}:/test:rw`,'-e','JWT_SECRET='+'test-only-key-'.repeat(4),'-e','DB_PATH=/test/data/test.db','-e','MEDIA_PATH=/test/music','-e','ART_CACHE_PATH=/test/data/art','-e','CORS_ALLOWED_ORIGIN=http://127.0.0.1:5173',process.env.SUPERNOVA_SMOKE_BACKEND_IMAGE||'supernova-review-backend')
 container=true
 const inspect=JSON.parse(docker('inspect',name))[0]
 const base=`http://127.0.0.1:${inspect.NetworkSettings.Ports['8080/tcp'][0].HostPort}`
 for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}await sleep(100)}
 const register=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'smoke-owner',password:'test-password'})});assert.equal(register.status,200)
 let tracks=[];for(let i=0;i<100;i++){tracks=await (await fetch(base+'/api/tracks')).json()||[];if(tracks.length)break;await sleep(100)}assert.equal(tracks.length,1)
 let page
 if(native){
  app=await _electron.launch({executablePath:require('electron'),args:['--no-sandbox',`--user-data-dir=${join(root,'profile')}`,resolve('out/main/index.js')],timeout:30000})
  page=await app.firstWindow()
 }else{
  vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort'],{stdio:'ignore'})
  for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5173')).ok)break}catch{}await sleep(100)}
  browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});page=await browser.newPage({viewport:{width:1280,height:900},locale:'en-US'});page.on('pageerror',error=>console.error('Page error:',error.message));await page.goto('http://127.0.0.1:5173')
 }
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await sleep(1500);console.log('Initial page:',await page.locator('body').innerText());await page.screenshot({path:'/tmp/supernova-desktop-login-debug.png'});await page.locator('input[name=url]').fill(base);await page.locator('input[name=username]').fill('smoke-owner');await page.locator('input[name=password]').fill('test-password');await page.locator('button[type=submit]').click()
 await page.getByText('Purple Night',{exact:true}).first().waitFor({timeout:30000})
 const result=await page.evaluate(async({base,trackID})=>{
  const persisted=JSON.parse(localStorage.getItem('supernova_app_store'));const token=persisted.state.data.token
  if(!token||persisted.state.data.password)throw new Error('Invalid persisted authentication')
  const request=async(path,method='GET',body)=>{
   if(window.api?.supernovaRequest){const reply=await window.api.supernovaRequest({url:base+path,method,token,body:body===undefined?undefined:JSON.stringify(body)});if(reply.status>=400)throw new Error(reply.body);return reply.body?JSON.parse(reply.body):undefined}
   const response=await fetch(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(!response.ok)throw new Error(await response.text());const text=await response.text();return text?JSON.parse(text):undefined
  }
  await request('/api/hearts','POST',{entity_type:'track',entity_id:trackID})
  const playlist=await request('/api/playlists','POST',{name:'Purple Mix'})
  await request(`/api/playlists/${playlist.id}/tracks`,'POST',{track_id:trackID})
  const entries=await request(`/api/playlists/${playlist.id}/tracks`);if(entries[0].id!==trackID)throw new Error('Playlist did not persist')
  const {ticket}=await request('/api/media-ticket','POST',{scope:'stream',resource:trackID})
  const target=base+`/api/stream/${trackID}?ticket=${encodeURIComponent(ticket)}`
  const audio=new Audio();audio.crossOrigin='anonymous';audio.src=window.api?.supernovaRequest?`supernova-media://stream/?target=${encodeURIComponent(target)}`:target
  const metadata=new Promise((resolve,reject)=>{audio.addEventListener('loadedmetadata',resolve,{once:true});audio.addEventListener('error',()=>reject(new Error(`Audio failed: ${audio.error?.message}`)),{once:true});setTimeout(()=>reject(new Error('Audio metadata timeout')),10000)})
  await metadata;await audio.play();audio.pause();const duration=audio.duration;audio.removeAttribute('src');audio.load()
  await request('/api/scrobbles','POST',{track_id:trackID})
  return {duration,playlist:playlist.id,tokenInStorage:!!token,passwordInStorage:!!persisted.state.data.password,nativeBridge:!!window.api?.supernovaRequest}
 },{base,trackID:tracks[0].id})
 assert.ok(result.duration>1);assert.equal(result.passwordInStorage,false);assert.equal(result.nativeBridge,native)
 const navigate=async path=>{await page.evaluate(path=>{location.hash=path},path);await page.waitForURL(url=>url.hash==='#'+path)}
 await navigate('/library/favorites');await page.getByText('First Signal',{exact:true}).first().waitFor({timeout:15000})
 await navigate('/library/playlists');await page.getByText('Purple Mix',{exact:true}).first().waitFor({timeout:15000})
 assert.deepEqual(errors,[])
 await page.screenshot({path:`/tmp/supernova-desktop-${native?'electron':'browser'}.png`})
 console.log(JSON.stringify({mode:native?'electron':'browser',login:true,library:true,favorites:true,playlists:true,playback_duration:result.duration,native_bridge:result.nativeBridge,page_errors:errors},null,2))
}finally{
 if(app)await app.close();if(browser)await browser.close();if(vite)vite.kill();if(container)docker('rm','-f',name);await rm(root,{recursive:true,force:true})
}
