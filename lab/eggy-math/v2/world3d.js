import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

/** Original miniature-garden presentation. No free-roaming, joystick or jump controls. */
export function createWorld(canvas, callbacks = {}) {
  const { onEnter = () => {}, onStatus = () => {}, isPaused = () => false } = callbacks;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#edf2ed');
  scene.fog = new THREE.Fog('#edf2ed', 45, 85);
  const camera = new THREE.OrthographicCamera(-9,9,7,-7,.1,100);
  const cameraAim = new THREE.Vector3(0,.75,0);
  const cameraPosition = new THREE.Vector3(12,13,18);
  const ambient = new THREE.HemisphereLight('#fffae9','#8ca6a2',1.25);scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff1d5',2.6);sun.position.set(-8,15,12);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;
  Object.assign(sun.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:.5,far:45});scene.add(sun);
  const rim = new THREE.DirectionalLight('#d6f5f4',1.1);rim.position.set(9,8,-10);scene.add(rim);
  const root=new THREE.Group();scene.add(root);
  const assetRoot=new THREE.Group(),fallbackGarden=new THREE.Group(),decor=new THREE.Group();root.add(assetRoot,fallbackGarden,decor);
  const resources=new Set(),materials=new Set();
  const material=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.68,metalness:0,...extra});materials.add(m);return m};
  const mesh=(geo,color,parent=decor,extra={})=>{resources.add(geo);const m=new THREE.Mesh(geo,material(color,extra));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
  const ball=(x,y,z,scale,color,parent=decor)=>{const m=mesh(new THREE.SphereGeometry(1,20,14),color,parent);m.position.set(x,y,z);m.scale.set(...scale);return m};
  const cylinder=(x,y,z,r1,r2,h,color,parent=decor)=>{const m=mesh(new THREE.CylinderGeometry(r1,r2,h,32),color,parent);m.position.set(x,y,z);return m};
  const bar=(a,b,r,color,parent=decor)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),color,parent);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m};
  const floor=mesh(new THREE.PlaneGeometry(140,140),'#e5ece5',root);floor.rotation.x=-Math.PI/2;floor.position.y=-1.65;floor.receiveShadow=true;
  // A quiet pedestal fallback remains playable if local model loading is unavailable.
  const base=mesh(new THREE.BoxGeometry(12,1.4,10),'#d9c6a7',fallbackGarden);base.position.y=-.75;
  const lawn=mesh(new THREE.BoxGeometry(12,.18,10),'#afcdb1',fallbackGarden);lawn.position.y=-.05;
  const cottage=mesh(new THREE.BoxGeometry(2.5,2.6,2.2),'#fff2db',fallbackGarden);cottage.position.set(0,1.3,-2.7);
  const roof=mesh(new THREE.ConeGeometry(2.1,1.5,4),'#df9e83',fallbackGarden);roof.position.set(0,3.3,-2.7);roof.rotation.y=Math.PI/4;
  // Exact authored Blender route: the five stone-stop tops are at Y=.11.
  let stops=[[-4,.11,2.7],[-2.1,.11,2],[0,.11,2.6],[2.1,.11,1.5],[4,.11,2.5]].map((p,i)=>({position:new THREE.Vector3(...p),pathFromPrevious:[],name:['花园入口','雏菊小径','星星广场','水畔石桥','心愿终点'][i]}));
  let routeSamples=stops.map(s=>s.position.clone()),stopSampleIndices=[0,1,2,3,4];
  const player=new THREE.Group();root.add(player);
  const body=new THREE.Group();player.add(body);
  const fallbackHero=new THREE.Group();body.add(fallbackHero);
  ball(0,.9,0,[.54,.76,.46],'#f5cf78',fallbackHero);
  ball(-.26,.12,.13,[.24,.12,.29],'#dba75d',fallbackHero);ball(.26,.12,.13,[.24,.12,.29],'#dba75d',fallbackHero);
  ball(-.54,.79,0,[.15,.24,.16],'#f3ca74',fallbackHero);ball(.54,.79,0,[.15,.24,.16],'#f3ca74',fallbackHero);
  for(const x of [-.18,.18]){ball(x,1.02,.423,[.04,.065,.025],'#25484c',fallbackHero);ball(x*1.65,.85,.405,[.08,.035,.018],'#df9d95',fallbackHero)}
  cylinder(0,1.47,0,.52,.52,.08,'#599e89',fallbackHero);cylinder(0,1.58,0,.34,.4,.2,'#72b59d',fallbackHero);
  const smile=mesh(new THREE.TorusGeometry(.09,.012,6,20,Math.PI),'#31535a',fallbackHero);smile.position.set(0,.88,.449);smile.rotation.z=Math.PI;
  player.scale.setScalar(1.18);player.position.copy(stops[0].position);player.rotation.y=.55;
  const markerRoot=new THREE.Group();root.add(markerRoot);
  let markers=[];const textures=[];let solved=new Set();
  function rebuildMarkers(){
    while(markerRoot.children.length){const o=markerRoot.children[0];markerRoot.remove(o);o.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)x.material.dispose()})}
    markers=[];
    stops.forEach((s,i)=>{
      const g=new THREE.Group();g.position.copy(s.position);markerRoot.add(g);
      const ring=mesh(new THREE.TorusGeometry(.66,.025,8,48),'#eee6c7',g);ring.rotation.x=Math.PI/2;ring.position.y=.045;
      const c=document.createElement('canvas');c.width=128;c.height=128;const cx=c.getContext('2d');cx.fillStyle='#fff8e6';cx.beginPath();cx.arc(64,64,54,0,Math.PI*2);cx.fill();cx.strokeStyle='#c3ad79';cx.lineWidth=4;cx.stroke();cx.fillStyle='#46655f';cx.textAlign='center';cx.textBaseline='middle';cx.font='bold 60px sans-serif';cx.fillText(String(i+1),64,67);
      const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
      const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:true}));label.scale.set(.48,.48,1);label.position.set(-.73,.65,-.12);g.add(label);
      const flag=mesh(new THREE.SphereGeometry(.13,12,8),'#e4c97d',g);flag.position.set(-.73,.22,-.12);markers.push({g,ring,flag});
    });setSolved(solved);
  }
  rebuildMarkers();
  // Fallback-only near-field details; hidden when the richly planted Blender park loads.
  const flowers=[];
  function flower(x,z,size,color){const g=new THREE.Group();g.position.set(x,.03,z);g.scale.setScalar(size);decor.add(g);bar([0,0,0],[0,.37,0],.018,'#729479',g);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ball(Math.cos(a)*.12,.4,Math.sin(a)*.12,[.095,.045,.095],color,g)}ball(0,.44,0,[.075,.05,.075],'#efd489',g);flowers.push(g)}
  [[-5,3.6,.8],[-4.65,3.9,1],[-4.3,4.05,.65],[4.8,3.6,.85],[5.1,3.25,.65],[3.5,4.2,.7]].forEach(([x,z,s],i)=>flower(x,z,s,i%2?'#fff3d1':'#e9b6ad'));
  function mushroom(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);decor.add(g);cylinder(0,.2,0,.1,.14,.4,'#f3e7cf',g);ball(0,.46,0,[.32,.2,.32],'#d9a18f',g);[[.12,.58,.05],[-.13,.56,.05],[.02,.6,-.12]].forEach(p=>ball(...p,[.055,.025,.055],'#fff4de',g))}
  mushroom(-5.05,2.85,.7);mushroom(-4.78,3.05,.45);mushroom(4.9,4.1,.55);
  let disposed=false,frameId=0,last=performance.now(),elapsed=0,motion=[],pendingEnter=null,currentStage=0,walkPhase=0,celebration=0;
  let portrait=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function applyRoute(config){
    const items=Array.isArray(config)?config:config.stops;
    if(!Array.isArray(items)||items.length!==5)throw new Error('The miniature route must have exactly five stops.');
    const vector=p=>{if(!Array.isArray(p)||p.length!==3||p.some(x=>!Number.isFinite(x)))throw new Error('Invalid miniature route position.');return new THREE.Vector3(...p)};
    stops=items.map((s,i)=>({position:vector(Array.isArray(s)?s:s.position),pathFromPrevious:(s.pathFromPrevious||[]).map(vector),name:s.name||`第 ${i+1} 站`}));
    routeSamples=[];stopSampleIndices=[];stops.forEach((s,i)=>{if(i)s.pathFromPrevious.forEach(v=>routeSamples.push(v.clone()));routeSamples.push(s.position.clone());stopSampleIndices.push(routeSamples.length-1)});
    motion=[];pendingEnter=null;player.position.copy(stops[currentStage].position);rebuildMarkers();
  }
  function nearestSample(){let index=0,distance=Infinity;routeSamples.forEach((p,i)=>{const d=p.distanceToSquared(player.position);if(d<distance){index=i;distance=d}});return index}
  function travel(i){
    if(disposed||!Number.isInteger(i)||i<0||i>4)return;
    let start=nearestSample(),end=stopSampleIndices[i];motion=[];
    if(player.position.distanceTo(routeSamples[start])>.05)motion.push(routeSamples[start].clone());
    const step=end>=start?1:-1;for(let n=start+step;step>0?n<=end:n>=end;n+=step)motion.push(routeSamples[n].clone());
    if(!motion.length)motion.push(stops[i].position.clone());pendingEnter=i;
    onStatus(`小蛋正在前往${stops[i].name}。`);
  }
  function setStage(i){if(!Number.isInteger(i)||i<0||i>4)return;motion=[];pendingEnter=null;currentStage=i;player.position.copy(stops[i].position);player.rotation.y=.55}
  function setSolved(indices){const before=solved.size;solved=new Set(Array.from(indices).filter(i=>Number.isInteger(i)&&i>=0&&i<5));if(solved.size>before)celebration=1;markers.forEach((m,i)=>{const done=solved.has(i);m.ring.material.color.set(done?'#d7ac48':'#d6c9a6');m.flag.material.color.set(done?'#e8ba53':'#cfddca');m.flag.scale.setScalar(done?1.35:1);});}
  function reset(){motion=[];pendingEnter=null;solved.clear();setSolved([]);setStage(0);celebration=0;onStatus('新的花园探险开始啦。')}
  let stageBounds=new THREE.Box3(new THREE.Vector3(-6.25,-1.4,-5.15),new THREE.Vector3(6.25,4.4,5.15));
  let preciseProjection=null;
  function measureAuthoredProjection(){
    const target=new THREE.Vector3(0,.6,.2);camera.position.copy(target).add(cameraPosition);camera.lookAt(target);camera.updateMatrixWorld(true);
    const p=new THREE.Vector3(),matrix=new THREE.Matrix4();let x=0,y=0;
    assetRoot.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes.position)return;const a=o.geometry.attributes.position;matrix.multiplyMatrices(camera.matrixWorldInverse,o.matrixWorld);for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(matrix);x=Math.max(x,Math.abs(p.x));y=Math.max(y,Math.abs(p.y));}});
    preciseProjection={x,y};
  }
  function resize(){
    const width=Math.max(canvas.clientWidth,1),height=Math.max(canvas.clientHeight,1),aspect=width/height;
    portrait=window.innerWidth<=700&&aspect<1.2;
    let h=9.2;
    if(!portrait){
      // Fit all eight corners in actual camera space, not just world-axis width.
      const target=new THREE.Vector3(0,.6,.2);
      camera.position.copy(target).add(cameraPosition);camera.lookAt(target);camera.updateMatrixWorld(true);
      let projectedX=0,projectedY=0;
      for(const x of [stageBounds.min.x,stageBounds.max.x])for(const y of [stageBounds.min.y,stageBounds.max.y])for(const z of [stageBounds.min.z,stageBounds.max.z]){
        const p=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);
        projectedX=Math.max(projectedX,Math.abs(p.x));projectedY=Math.max(projectedY,Math.abs(p.y));
      }
      if(preciseProjection){projectedX=preciseProjection.x;projectedY=preciseProjection.y;}
      h=Math.max(projectedY*2,projectedX*2/aspect)*1.055;
    }
    camera.left=-h*aspect/2;camera.right=h*aspect/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const loader=new GLTFLoader();
  const modelReady=(gltf)=>{gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{if(m.isMeshStandardMaterial)m.envMapIntensity=.7})}}});return gltf.scene};
  const config=callbacks.assetConfig||{};
  const ready=Promise.allSettled([
    loader.loadAsync(new URL(config.park||'./assets/park-v2.gltf',import.meta.url).href).then(g=>{if(disposed)return;assetRoot.add(modelReady(g));assetRoot.updateMatrixWorld(true);stageBounds=new THREE.Box3().setFromObject(assetRoot);measureAuthoredProjection();resize();fallbackGarden.visible=false;decor.visible=false;return 'park'}),
    loader.loadAsync(new URL(config.hero||'./assets/egg-hero-v2.gltf',import.meta.url).href).then(g=>{if(disposed)return;body.add(modelReady(g));fallbackHero.visible=false;return 'hero'})
  ]).then(results=>{if(results.some(r=>r.status==='rejected'))onStatus('部分场景暂时没有载入，已切换到简化花园，仍可继续玩。');return results});
  function tick(now){
    if(disposed)return;const dt=Math.min((now-last)/1000,.045);last=now;elapsed+=dt;
    let walking=false;
    if(!isPaused()&&motion.length){const dest=motion[0],delta=dest.clone().sub(player.position),distance=delta.length(),step=Math.min(distance,2.7*dt);
      if(distance<.035){player.position.copy(dest);motion.shift();if(!motion.length&&pendingEnter!==null){const stage=pendingEnter;pendingEnter=null;currentStage=stage;player.rotation.y=.55;onEnter(stage)}}else{walking=true;player.position.addScaledVector(delta,step/distance);const desired=Math.atan2(delta.x,delta.z);player.rotation.y+=Math.atan2(Math.sin(desired-player.rotation.y),Math.cos(desired-player.rotation.y))*Math.min(1,dt*11);}}
    if(!reduced){walkPhase+=walking?dt*11:dt*1.6;body.position.y=walking?Math.abs(Math.sin(walkPhase))*.08:Math.sin(walkPhase)*.012;body.rotation.z=walking?Math.sin(walkPhase)*.045:0;body.scale.set(1,1+(walking?0:Math.sin(walkPhase)*.006),1);}
    if(celebration>0){celebration=Math.max(0,celebration-dt*.9);if(!reduced)body.position.y+=Math.sin((1-celebration)*Math.PI)*.32}
    const aim=portrait?new THREE.Vector3(player.position.x*.76,1,player.position.z*.65):new THREE.Vector3(0,.6,.2);
    cameraAim.lerp(aim,reduced?1:Math.min(1,dt*3));camera.position.copy(cameraAim).add(cameraPosition);camera.lookAt(cameraAim);
    renderer.render(scene,camera);frameId=requestAnimationFrame(tick);
  }
  frameId=requestAnimationFrame(tick);
  function dispose(){disposed=true;cancelAnimationFrame(frameId);observer.disconnect();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});textures.forEach(t=>t.dispose());resources.forEach(r=>r.dispose());materials.forEach(m=>m.dispose());renderer.dispose()}
  return {travel,setSolved,reset,setStage,applyRoute,dispose,ready};
}
