import * as THREE from './vendor/three.module.js';

// Original offline 3D game world. The learning layer owns questions and rewards.
export function createWorld(canvas, callbacks = {}) {
  const { onEnter = () => {}, onCollect = () => {}, onStatus = () => {}, isPaused = () => false } = callbacks;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c4edf4');
  scene.fog = new THREE.Fog('#c4edf4', 52, 95);
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 150);
  scene.add(new THREE.HemisphereLight('#fffde8', '#77a4ac', 2.5));
  const sun = new THREE.DirectionalLight('#fff4d5', 3.0);
  sun.position.set(-10, 28, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 22, bottom: -22, near: 1, far: 70 });
  sun.shadow.normalBias = .035;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#b4eaff', 1.2); fill.position.set(10, 8, -15); scene.add(fill);
  const materials = new Map();
  const mat = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .72, metalness: 0, ...extra }));
    return materials.get(key);
  };
  const mesh = (geometry, color, parent = scene, extra = {}) => {
    const m = new THREE.Mesh(geometry, mat(color, extra));
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const ball = (x, y, z, scale, color, parent = scene) => {
    const m = mesh(new THREE.SphereGeometry(1, 24, 16), color, parent); m.position.set(x, y, z); m.scale.set(...scale); return m;
  };
  const box = (x, y, z, w, h, d, color, parent = scene) => {
    const m = mesh(new THREE.BoxGeometry(w, h, d), color, parent); m.position.set(x, y, z); return m;
  };
  const cyl = (x,y,z,top,bottom,height,color,parent=scene) => {
    const m=mesh(new THREE.CylinderGeometry(top,bottom,height,48),color,parent);m.position.set(x,y,z);return m;
  };
  const root = new THREE.Group(); scene.add(root);
  const floorY = 1;
  const spawn = new THREE.Vector3(0, floorY, 10);
  const nodes = [
    { x:-12, z:0, color:'#9addb6', name:'薄荷码头' },
    { x:-7, z:-8, color:'#ffda91', name:'布丁工坊' },
    { x:0, z:-12, color:'#c1b9ef', name:'泡泡风车' },
    { x:7, z:-8, color:'#f4b7cb', name:'蜜桃花园' },
    { x:12, z:0, color:'#a0dfd8', name:'彩虹灯塔' }
  ];
  const platforms = [{x:0,z:10,r:4.3}], bridges = [], gateGroups = [], islandGroups=[], decorations=[];
  const interactive = [], solved = new Set();
  const textureResources = [];
  function sign(text, x,y,z, color='#365763') {
    const c=document.createElement('canvas');c.width=512;c.height=128;
    const cx=c.getContext('2d');cx.fillStyle='#fffdf0';cx.beginPath();cx.roundRect(2,2,508,124,40);cx.fill();
    cx.font='bold 55px "Microsoft YaHei", sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle=color;cx.fillText(text,256,64);
    const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;textureResources.push(tx);
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:false,transparent:true}));spr.position.set(x,y,z);spr.scale.set(3.2,.8,1);root.add(spr);return spr;
  }
  function island(x,z,r,color){
    const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
    cyl(0,.12,0,r*.96,r*.78,1.6,'#d8b18a',g);
    cyl(0,.73,0,r,r*.98,.45,'#f9dfb7',g);
    cyl(0,.98,0,r*1.01,r,.14,color,g);
    // Round, tactile top surface, small gumdrop shrubs and candy pebble clusters.
    for(let j=0;j<8;j++){const a=j*2.4, rr=r*(.66+(j%2)*.12);ball(Math.cos(a)*rr,1.08,Math.sin(a)*rr,[.12,.06,.15],j%2?'#fff8df':'#ffffff',g)}
    return g;
  }
  island(0,10,4.3,'#b0e1be');
  sign('出发小广场',0,1.75,13.5);
  function tree(parent,x,z,color){
    cyl(x,1.75,z,.12,.17,1.5,'#be9b77',parent);
    ball(x,2.6,z,[.65,.85,.65],color,parent);
    ball(x-.25,2.95,z+.18,[.25,.3,.25],'#ffffff',parent).material=mat('#ffffff',{transparent:true,opacity:.16});
  }
  tree(root,-2.7,11.0,'#6fc4aa'); tree(root,2.7,11.0,'#84ceb4');
  function makeBridge(node,index){
    const ax=0,az=10,bx=node.x,bz=node.z,dx=bx-ax,dz=bz-az,length=Math.hypot(dx,dz);
    const g=new THREE.Group();g.position.set((ax+bx)/2,.91,(az+bz)/2);g.rotation.y=Math.atan2(dx,dz);root.add(g);
    const base=box(0,0,0,1.55,.18,length,'#e2d9c9',g);
    const planks=[];const n=Math.ceil(length/.7);
    for(let j=0;j<n;j++){const p=box(0,.12,-length/2+(j+.5)*length/n,1.65,.12,length/n*.85,'#fff4d6',g);planks.push(p)}
    // Low candy rails make the route readable without blocking jump exploration.
    for(const side of [-1,1]){const rail=box(side*.83,.4,0,.08,.08,length,'#e8f4e9',g);rail.castShadow=false;}
    bridges.push({ax,az,bx,bz,length,width:1.85,group:g,planks,base});
  }
  nodes.forEach((n,i)=>{
    platforms.push({x:n.x,z:n.z,r:3}); makeBridge(n,i);
    const islandGroup=island(n.x,n.z,3,n.color);islandGroups.push(islandGroup);
    const gate=new THREE.Group();gate.position.set(n.x,1,n.z+.55);root.add(gate);gateGroups.push(gate);
    box(-1.05,1.15,0,.35,2.3,.45,'#fff2da',gate);box(1.05,1.15,0,.35,2.3,.45,'#fff2da',gate);
    box(0,2.3,0,2.6,.42,.6,n.color,gate);
    const curtain=box(0,1.1,0,1.75,1.95,.16,'#ffe2a0',gate);curtain.material=mat('#ffe2a0',{transparent:true,opacity:.55});gate.userData.curtain=curtain;
    const medallion=ball(0,2.48,.34,[.35,.35,.12],'#ffda6d',gate);gate.userData.medallion=medallion;
    sign(`${i+1}  ${n.name}`,n.x,1.3,n.z+3.05);
    const hit=mesh(new THREE.CylinderGeometry(2.9,2.9,.4,24),'#ffffff',root,{transparent:true,opacity:0});hit.position.set(n.x,1.2,n.z);hit.userData.index=i;interactive.push(hit);
    tree(islandGroup,-1.95,-.8,['#67bc9d','#deb777','#a899d8','#e99db6','#75beba'][i]);
    if(i===0){box(1.4,1.4,-1.25,.9,.7,.9,'#ffefc2',islandGroup);const roof=mesh(new THREE.ConeGeometry(.85,.65,4),'#f0ab8c',islandGroup);roof.rotation.y=Math.PI/4;roof.position.set(1.4,2.02,-1.25)}
    if(i===1){cyl(.8,1.55,-1.1,.7,.95,1.1,'#fff0b5',islandGroup);cyl(.8,2.13,-1.1,.72,.72,.12,'#ce9c74',islandGroup);ball(.8,2.35,-1.1,[.2,.2,.2],'#ef8f9f',islandGroup)}
    if(i===2){cyl(.8,2,-1,.2,.5,2,'#fff1d9',islandGroup);const rotor=new THREE.Group();rotor.position.set(.8,2.9,-.7);islandGroup.add(rotor);box(0,0,0,2.25,.22,.12,'#fff1c8',rotor);box(0,0,0,.22,2.25,.12,'#efc59e',rotor);ball(0,0,.1,[.16,.16,.12],'#c0a0cd',rotor);decorations.push(rotor)}
    if(i===3){tree(islandGroup,1.5,-1,'#f3a7c5');for(let j=0;j<3;j++){const x=-.5+j*.6;ball(x,1.18,-1.5,[.2,.12,.2],'#fff1bd',islandGroup)}}
    if(i===4){cyl(.7,2.2,-1,.4,.55,2.4,'#fff5db',islandGroup);cyl(.7,2.2,-1,.46,.46,.35,'#f1a0a3',islandGroup);cyl(.7,3.45,-1,.65,.65,.32,'#f1a0a3',islandGroup);ball(.7,3.75,-1,[.35,.35,.35],'#ffde84',islandGroup)}
  });
  // Soft clouds and a distant sea keep the scene spacious rather than UI-heavy.
  const sea=mesh(new THREE.PlaneGeometry(180,180),'#a8dfe7',root,{roughness:.3});sea.rotation.x=-Math.PI/2;sea.position.y=-4.8;sea.receiveShadow=false;
  const clouds=[];
  for(let i=0;i<10;i++){
    const g=new THREE.Group();const a=i*2.399;g.position.set(Math.cos(a)*(22+i),-1+(i%3)*1.9,Math.sin(a)*(20+i)-3);root.add(g);
    ball(0,0,0,[2,.55,1],'#f2fbf9',g);ball(-.7,.35,0,[.85,.75,.8],'#f9fdf8',g);ball(.6,.45,0,[1,.85,.85],'#f9fdf8',g);clouds.push(g);
  }
  const player = new THREE.Group();root.add(player);player.position.copy(spawn);
  const visual = new THREE.Group();player.add(visual);
  const fallback = new THREE.Group();visual.add(fallback);
  ball(0,.88,0,[.52,.73,.45],'#ffe28a',fallback);
  const leftFoot=ball(-.27,.12,.13,[.25,.13,.3],'#f2b55d',fallback),rightFoot=ball(.27,.12,.13,[.25,.13,.3],'#f2b55d',fallback);
  ball(-.53,.75,0,[.15,.25,.16],'#ffda7e',fallback);ball(.53,.75,0,[.15,.25,.16],'#ffda7e',fallback);
  for(const x of [-.17,.17]){ball(x,1.02,.413,[.043,.068,.03],'#244953',fallback);ball(x*1.7,.85,.4,[.08,.035,.025],'#efa1a2',fallback)}
  const smile=new THREE.Mesh(new THREE.TorusGeometry(.09,.015,6,18,Math.PI),mat('#36565d'));smile.rotation.z=Math.PI;smile.position.set(0,.88,.447);fallback.add(smile);
  cyl(0,1.42,0,.52,.52,.1,'#61aa94',fallback);cyl(0,1.54,0,.34,.4,.2,'#79c1a4',fallback);
  const badge=ball(0,1.55,.365,[.085,.085,.03],'#ffe597',fallback);
  const collectibles=[];
  [[-2,8.7],[0,11.8],[2,8.7]].forEach(([x,z],i)=>{
    const g=new THREE.Group();g.position.set(x,1.6,z);root.add(g);
    const shape=new THREE.Shape();for(let j=0;j<10;j++){const a=j*Math.PI/5+Math.PI/2,r=j%2?.16:.35;const xx=Math.cos(a)*r,yy=Math.sin(a)*r;j?shape.lineTo(xx,yy):shape.moveTo(xx,yy)}shape.closePath();
    const m=mesh(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1}),'#ffe59b',g);collectibles.push({group:g,collected:false,index:i});
  });
  const keys=new Set(),nav=[];let targetIndex=-1,velocityY=0,grounded=true,disposed=false,raf=0,last=performance.now(),elapsed=0,jumpRequested=false,wasPaused=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const controls=document.createElement('div');controls.className='world-touch-controls';controls.style.cssText='position:absolute;left:12px;right:12px;bottom:56px;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none;z-index:2;';
  controls.innerHTML='<div style="display:grid;grid-template-columns:44px 44px 44px;grid-template-rows:44px 44px;gap:4px;pointer-events:auto"><button data-move="ArrowUp" aria-label="向前移动" style="grid-column:2">↑</button><button data-move="ArrowLeft" aria-label="向左移动" style="grid-column:1">←</button><button data-move="ArrowDown" aria-label="向后移动">↓</button><button data-move="ArrowRight" aria-label="向右移动">→</button></div><div style="display:flex;gap:8px;pointer-events:auto"><button data-action="enter">探索</button><button data-action="jump">跳跃</button></div>';
  controls.querySelectorAll('button').forEach(b=>{b.style.cssText+='border:1px solid #ffffffbb;border-radius:14px;background:#ffffffc9;color:#24535b;min-height:44px;min-width:44px;font-size:17px;touch-action:none;padding:5px 10px;box-shadow:0 3px 8px #24535b15;';});
  canvas.parentElement.append(controls);
  controls.querySelectorAll('[data-move]').forEach(b=>{
    const end=()=>keys.delete(b.dataset.move);
    b.addEventListener('pointerdown',e=>{if(isPaused())return;e.preventDefault();b.setPointerCapture(e.pointerId);nav.length=0;keys.add(b.dataset.move)});
    b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('lostpointercapture',end);
  });
  controls.querySelector('[data-action="jump"]').addEventListener('click',()=>{if(!isPaused())jumpRequested=true});
  controls.querySelector('[data-action="enter"]').addEventListener('click',enterNearby);
  function enterNearby(){if(isPaused())return;const i=nodes.findIndex(n=>Math.hypot(n.x-player.position.x,n.z-player.position.z)<3.2);if(i>=0){keys.clear();nav.length=0;targetIndex=-1;onEnter(i)}else onStatus('靠近彩色小岛，再点探索或按 E。')}
  function onKeyDown(e){if(isPaused())return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(k)){e.preventDefault();keys.add(k);nav.length=0;targetIndex=-1}if(e.code==='Space'){e.preventDefault();if(!e.repeat)jumpRequested=true}if(k==='e'&&!e.repeat)enterNearby()}
  function onKeyUp(e){keys.delete(e.key.length===1?e.key.toLowerCase():e.key)}
  function blur(){keys.clear();jumpRequested=false}
  canvas.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',blur);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function click(e){if(isPaused())return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(interactive)[0];if(hit)travel(hit.object.userData.index);else canvas.focus({preventScroll:true})}
  canvas.addEventListener('pointerdown',click);
  function supported(x,z){if(platforms.some(p=>Math.hypot(x-p.x,z-p.z)<=p.r-.16))return true;return bridges.some(b=>{const dx=b.bx-b.ax,dz=b.bz-b.az,t=((x-b.ax)*dx+(z-b.az)*dz)/(b.length*b.length);return t>=0&&t<=1&&Math.hypot(x-b.ax-t*dx,z-b.az-t*dz)<b.width/2-.1})}
  function respawn(){player.position.copy(spawn);velocityY=0;grounded=true;nav.length=0;targetIndex=-1;keys.clear();onStatus('小蛋坐云朵回来了！没有惩罚，继续探索吧。')}
  function travel(index){if(isPaused()||!nodes[index])return;keys.clear();nav.length=0;const n=nodes[index];
    const near=nodes.findIndex(p=>Math.hypot(p.x-player.position.x,p.z-player.position.z)<3.3);
    // Return along the current bridge before changing branches.
    if(near>=0&&near!==index)nav.push(new THREE.Vector3(nodes[near].x,floorY,nodes[near].z));
    if(Math.hypot(player.position.x,player.position.z-10)>2.5&&near!==index)nav.push(spawn.clone());
    nav.push(new THREE.Vector3(n.x,floorY,n.z+1.6));targetIndex=index;canvas.focus({preventScroll:true});onStatus(`小蛋出发！前往${n.name}。`);
  }
  function setSolved(indices){const next=new Set(indices);nodes.forEach((n,i)=>{const done=next.has(i);if(done)solved.add(i);else solved.delete(i);const gate=gateGroups[i];gate.userData.curtain.visible=!done;gate.userData.medallion.material=mat(done?'#fff293':'#ffda6d',{emissive:done?'#9b7f15':'#000000',emissiveIntensity:done?.25:0});const colors=['#ffd984','#f4b5bd','#b6d6bc','#aadbe0','#c9bfef'];bridges[i].planks.forEach((p,j)=>{const color=done?colors[j%colors.length]:'#fff4d6';p.material=mat(color);if(p.userData.asset)p.userData.asset.traverse(o=>{if(o.isMesh&&o.material.color)o.material.color.set(color)})});});}
  function reset(){solved.clear();setSolved([]);collectibles.forEach(c=>{c.collected=false;c.group.visible=true});onCollect(0);respawn()}
  function resize(){const width=canvas.clientWidth||900,height=canvas.clientHeight||560;renderer.setSize(width,height,false);camera.aspect=width/height;const factor=Math.max(1,1.5/camera.aspect);camera.position.set(0,26*factor,30*factor);camera.lookAt(0,0,-1);camera.updateProjectionMatrix()}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function tick(t){if(disposed)return;const dt=Math.min((t-last)/1000,.04);last=t;elapsed+=dt;const paused=isPaused();if(paused&&!wasPaused){keys.clear();jumpRequested=false}wasPaused=paused;
    if(!paused){let dx=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0),dz=(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0);
      let moving=!!(dx||dz);
      if(!moving&&nav.length){const p=nav[0],distance=Math.hypot(p.x-player.position.x,p.z-player.position.z);if(distance<.16){nav.shift();if(!nav.length&&targetIndex>=0){const i=targetIndex;targetIndex=-1;onEnter(i)}}else{dx=(p.x-player.position.x)/distance;dz=(p.z-player.position.z)/distance;moving=true}}
      if(moving){const len=Math.hypot(dx,dz);dx/=len;dz/=len;player.position.x+=dx*5.4*dt;player.position.z+=dz*5.4*dt;player.rotation.y=Math.atan2(dx,dz);}
      if(jumpRequested&&grounded){velocityY=7.3;grounded=false}jumpRequested=false;
      const previousY=player.position.y;velocityY-=18*dt;player.position.y+=velocityY*dt;
      if(velocityY<=0&&previousY>=floorY-.04&&player.position.y<=floorY&&supported(player.position.x,player.position.z)){player.position.y=floorY;velocityY=0;grounded=true}else if(!supported(player.position.x,player.position.z)||player.position.y>floorY+.02)grounded=false;
      if(player.position.y < -5)respawn();
      if(!reduced){visual.position.y=grounded&&moving?Math.abs(Math.sin(elapsed*13))*.07:0;visual.rotation.z=moving&&grounded?Math.sin(elapsed*13)*.045:0;leftFoot.rotation.x=moving?Math.sin(elapsed*13)*.35:0;rightFoot.rotation.x=moving?-Math.sin(elapsed*13)*.35:0;}
      collectibles.forEach(c=>{if(!c.collected&&Math.hypot(c.group.position.x-player.position.x,c.group.position.z-player.position.z)<.65&&player.position.y<2){c.collected=true;c.group.visible=false;onCollect(collectibles.filter(x=>x.collected).length);onStatus('发现一颗海星！每一座岛都值得探索。')}});
    }
    if(!reduced){decorations.forEach(d=>d.rotation.z=elapsed*.45);collectibles.forEach((c,i)=>{c.group.position.y=1.65+Math.sin(elapsed*2+i)*.12;c.group.rotation.y=elapsed*.7});}
    renderer.render(scene,camera);raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
  async function loadAssets({hero,island: islandUrl,gate,bridge}={}){
    // Optional Blender assets: failed assets do not stop the playable fallback scene.
    const {GLTFLoader}=await import('./vendor/GLTFLoader.js');const loader=new GLTFLoader();
    const results=await Promise.allSettled([
      hero?loader.loadAsync(hero).then(gltf=>{const model=gltf.scene;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});visual.add(model);fallback.visible=false;return 'hero'}):Promise.resolve(null),
      islandUrl?loader.loadAsync(islandUrl).then(gltf=>{nodes.forEach((n,i)=>{const model=gltf.scene.clone(true);model.position.set(n.x,1,n.z);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});root.add(model); // Preserve authored gameplay decorations above the imported island.
        islandGroups[i].children.slice(0,3).forEach(m=>m.visible=false);});return 'island'}):Promise.resolve(null),
      gate?loader.loadAsync(gate).then(gltf=>{gateGroups.forEach(g=>{const model=gltf.scene.clone(true);model.scale.setScalar(.75);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});g.add(model);g.children.slice(0,3).forEach(m=>m.visible=false)});return 'gate'}):Promise.resolve(null),
      bridge?loader.loadAsync(bridge).then(gltf=>{bridges.forEach(b=>b.planks.forEach((p,j)=>{const model=gltf.scene.clone(true);model.position.copy(p.position);model.position.y=.18;model.scale.set(.8,.8,b.length/b.planks.length*.43);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone()}});b.group.add(model);p.userData.asset=model;p.visible=false}));setSolved(solved);return 'bridge'}):Promise.resolve(null)
    ]);return results;
  }
  function dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();controls.remove();canvas.removeEventListener('keydown',onKeyDown);canvas.removeEventListener('pointerdown',click);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',blur);scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose()});textureResources.forEach(t=>t.dispose());renderer.dispose()}
  loadAssets({hero:'./assets/egg-hero.gltf',island:'./assets/candy-island.gltf',gate:'./assets/math-gate.gltf',bridge:'./assets/bridge-tile.gltf'}).catch(error=>console.warn('3D assets unavailable; using original mesh fallback.',error));
  return {travel,setSolved,reset,dispose,loadAssets};
}
