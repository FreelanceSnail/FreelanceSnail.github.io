import { createWorld } from './world3d.js';
import { buildChoices } from './choices.js';

const $ = s => document.querySelector(s), E = window.MathEngine;
let storage; try { storage = window.localStorage; } catch {}
const store = E.createStore(storage), progress = store.load();
const topics = ['加减 · 从左到右', '乘除 · 从左到右', '先乘除，再加减', '先算小括号里面', '混合运算小能手'];
const titles = ['一起走进云朵花园', '穿过奶油小桥', '叫醒风车朋友', '发现花园的秘密', '点亮今日的小星星'];
let seed = progress.active?.seed ?? (Date.now() >>> 0);
let questions = E.generateRound(seed), solved = new Set(progress.active?.solved || []);
let current = 0, question = null, reviewRef = null, phase = 'question', world = null, timer = null, epoch = 0;
function save() { progress.active = {seed, index: solved.size, solved: [...solved], mode: 'normal'}; store.save(progress); }
function next() { return [0,1,2,3,4].find(i => !solved.has(i)) ?? 4; }
function status(text) { $('#map-toast').textContent = text; }
function cancelTransition() { epoch++; clearTimeout(timer); timer = null; }
function refresh() {
  $('#star-count').textContent = `✦ ${progress.stars}`;
  $('#mistake-count').textContent = progress.mistakes.length;
  $('#round-no').textContent = `旅程 ${String(Math.max(1,progress.rounds + (solved.size === 5 ? 0 : 1))).padStart(2,'0')}`;
  $('#island-list').replaceChildren();
  for (let i=0;i<5;i++) { const dot = document.createElement('span'); dot.className = `journey-dot ${solved.has(i)?'done':i===current?'current':''}`;dot.textContent=solved.has(i)?'✓':i+1;dot.setAttribute('aria-label',`第${i+1}站${solved.has(i)?'已完成':i===current?'当前':''}`);$('#island-list').append(dot); }
}
function showQuestion(index, ref = null) {
  $('#task-prompt').classList.remove('finish-stars');
  cancelTransition();current=index;reviewRef=ref;phase='question';question=ref?E.generateRound(ref.seed)[ref.index]:questions[index];
  $('#task-kicker').textContent=ref?'错题背包 · 再试一次':`第 ${index+1} 站 / 共 5 站`;
  $('#topic-label').textContent=topics[index];$('#task-title').textContent=ref?'这次，一定更接近答案':titles[index];
  $('#task-prompt').textContent=`${question.expression} = ?`;
  $('#choice-label').textContent='选出答案，让小蛋继续前进';
  $('#feedback').textContent='';$('#feedback').className='';$('#step-diagram').hidden=true;$('#hint').hidden=false;$('#continue').hidden=true;
  $('#answer-choices').replaceChildren();
  buildChoices(question,(ref?.seed??seed)+index).forEach(value=>{const b=document.createElement('button');b.className='answer-choice';b.textContent=value;b.setAttribute('aria-label',`答案 ${value}`);b.onclick=()=>answer(value,b);$('#answer-choices').append(b)});
  refresh();
}
function diagram() {
  $('#step-diagram').replaceChildren();const rule=document.createElement('div');rule.textContent=question.rule;$('#step-diagram').append(rule);
  [`${question.firstExpression} = ${question.firstResult}`,`${question.secondExpression} = ${question.answer}`].forEach((text,i)=>{const line=document.createElement('span');line.className='step';line.textContent=`${i+1}. ${text}`;$('#step-diagram').append(line)});
  $('#step-diagram').hidden=false;
}
function remember() {const ref=reviewRef||{seed,index:current};if(!progress.mistakes.some(r=>r.seed===ref.seed&&r.index===ref.index))progress.mistakes.push(ref);save();refresh();}
function answer(value,button) {
  if(phase!=='question')return;
  if(!E.check(question,String(value),'').correct) {button.classList.add('incorrect');button.disabled=true;$('#feedback').textContent='差一点点。看看下面的两步，再选一次吧。';$('#feedback').className='';remember();diagram();return;}
  phase='success';button.classList.add('correct');$('#answer-choices').querySelectorAll('button').forEach(b=>b.disabled=true);
  $('#hint').hidden=true;$('#feedback').className='success';$('#feedback').textContent=reviewRef?'答对啦！这一题已经从背包收好。':'答对啦！小蛋正在带着星星向前走。';diagram();
  if(reviewRef)progress.mistakes=progress.mistakes.filter(r=>r.seed!==reviewRef.seed||r.index!==reviewRef.index);
  else if(!solved.has(current)){solved.add(current);progress.stars++;if(solved.size===5)progress.rounds++;}
  save();refresh();world?.setSolved([...solved]);
  if(reviewRef){$('#continue').hidden=false;return;}
  const token=epoch;timer=setTimeout(()=>{if(token!==epoch)return;if(solved.size===5)finish();else go(next());},1900);
}
function go(index) {
  cancelTransition();phase='moving';current=index;reviewRef=null;
  $('#choice-label').textContent='小蛋正在前往下一站…';$('#answer-choices').querySelectorAll('button').forEach(b=>b.disabled=true);refresh();
  if(world)world.travel(index);else showQuestion(index);
}
function finish() {
  cancelTransition();phase='complete';reviewRef=null;$('#task-kicker').textContent='今日旅程 · 已完成';$('#task-title').textContent='每一小步，都闪闪发光';$('#topic-label').textContent='5 / 5 颗星星已收集';$('#task-prompt').textContent='✦ ✦ ✦ ✦ ✦';$('#task-prompt').classList.add('finish-stars');$('#choice-label').textContent='云朵游乐园，因为你的思考亮起来了。';$('#answer-choices').replaceChildren();$('#feedback').textContent='可以休息一下，也可以再出发。今天的努力已经好好保存。';$('#feedback').className='success';$('#hint').hidden=true;$('#step-diagram').hidden=true;$('#continue').hidden=false;$('#continue').textContent='开启一段新旅程 →';status('今天的 5 颗小星星，全都收集好啦。');refresh();
}
function resume() {$('#task-prompt').classList.remove('finish-stars');$('#continue').textContent='回到旅程 →';if(solved.size===5)finish();else go(next());}
function newRound(){cancelTransition();seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;questions=E.generateRound(seed);solved=new Set();reviewRef=null;world?.reset();save();resume();}
$('#hint').onclick=diagram;
$('#continue').onclick=()=>{if(phase==='complete')newRound();else resume();};
function info(html){$('#info-content').innerHTML=html;$('#info-dialog').showModal();}
$('#close-info').onclick=()=>$('#info-dialog').close();
$('#restart').onclick=()=>{info('<h2>换一段新的旅程？</h2><p>本轮进度会重置，已经收集的星星和错题背包会保留。</p><button id="confirm-restart" class="primary">重新出发</button>');$('#confirm-restart').onclick=()=>{$('#info-dialog').close();newRound()};};
$('#review').onclick=()=>{info('<span class="eyebrow">LITTLE BACKPACK</span><h2>把没想通的，再想一遍。</h2><p>答对后，这道题就会从背包里收好。</p><div id="review-list"></div>');if(!progress.mistakes.length)$('#review-list').innerHTML='<p>背包空空的，继续今天的小旅程吧。</p>';progress.mistakes.slice(0,30).forEach(ref=>{const q=E.generateRound(ref.seed)[ref.index],row=document.createElement('div');row.className='review-item';const p=document.createElement('p');p.textContent=q.prompt;const b=document.createElement('button');b.textContent='再试一次';b.onclick=()=>{$('#info-dialog').close();showQuestion(ref.index,ref);$('#continue').hidden=false;$('#continue').textContent='返回旅程 →'};row.append(p,b);$('#review-list').append(row)});};
$('#about').onclick=()=>info('<h2>一场不用赶路的小冒险</h2><p>看题，选择一个答案。答对后，小蛋会自动前往下一站。答错也没关系：看看分步图解，再试一次。</p><p>每轮五题，不计时、不扣星星。包含加减乘除的运算顺序与小括号，整除、非负，两步为主。教材版本尚未确认，不宣称与具体教材完全同步。</p><p>原创蛋形伙伴，非官方游戏。无账号、广告、遥测；进度仅保存在此浏览器，清理浏览器数据可能清除进度。</p>'+(!store.available?'<p>当前浏览器不允许保存，本次仍可正常游玩。</p>':''));
showQuestion(next());
try {
  world=createWorld($('#world'),{
    onEnter:index=>{if(phase==='moving'&&index===current&&!reviewRef)showQuestion(index)},
    onStatus:text=>{status(text);$('#scene-status').textContent='';},
    isPaused:()=>$('#info-dialog').open,
  });
  world.setSolved([...solved]);if(solved.size===5)finish();
  world.ready?.then(()=>{if(phase==='complete')world.setStage?.(4);else if(phase==='question'&&!reviewRef)world.setStage?.(current);$('#scene-status').textContent='';});
} catch(error) {console.warn('3D unavailable:',error);$('#webgl-fallback').hidden=false;$('#scene-status').textContent='';world=null;if(solved.size===5)finish();}
save();if(!store.available)status('浏览器暂不允许保存进度，本次可以正常游玩。');
