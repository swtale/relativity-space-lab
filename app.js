(() => {
  const objects = [
    { id:'station', name:'지상 관측소', type:'observer', length:0, v:0, icon:'⌖' },
    { id:'alpha', name:'우주선 Alpha', type:'ship', length:100, v:.8, icon:'✦' },
    { id:'train', name:'초고속 기차', type:'train', length:80, v:-.35, icon:'▰' },
    { id:'photon', name:'광자 펄스', type:'photon', length:0, v:1, icon:'✧' }
  ];
  let observerId='station', editingId='alpha', playing=false, elapsed=0, rate=1, lastTick=performance.now(), origin=0;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const safe=(n,d=3)=>Number(n).toFixed(d);
  const cLabel=v=>`${v>0?'+':''}${safe(v,3)}c`;
  const typeName={ship:'우주선',train:'기차',observer:'정지 관측자',photon:'광자 펄스'};
  const currentObserver=()=>objects.find(o=>o.id===observerId);
  const selectedObject=()=>objects.find(o=>o.id===editingId);
  function subject(){return objects.find(o=>o.id!==observerId&&o.type!=='photon')||objects.find(o=>o.id!==observerId)||currentObserver()}
  function relative(a,b){const u=(b.v-a.v)/(1-a.v*b.v);return Math.max(-.999999,Math.min(.999999,u))}
  function gamma(u){return 1/Math.sqrt(1-u*u)}
  function targetLength(o){return o.type==='photon'?null:o.length/gamma(relative(currentObserver(),o))}
  function renderObjects(){
    $('#objectList').innerHTML=objects.map(o=>`<div class="object-card ${o.id===editingId?'selected':''}" data-edit="${o.id}"><span class="object-icon">${o.icon}</span><span class="object-info"><b>${o.name}</b><small>${typeName[o.type]}${o.length?` · L₀ ${o.length} m`:''}</small>${o.id===observerId?'<span class="active-tag">● ACTIVE OBSERVER</span>':''}</span><span class="object-speed ${o.v===0?'station':''}">${o.v===1?'c':cLabel(o.v)}</span></div>`).join('');
    $('#observerPicker').innerHTML=objects.filter(o=>o.type!=='photon').map(o=>`<div class="observer-card ${o.id===observerId?'active':''}" data-observe="${o.id}"><span class="observer-avatar">${o.icon}</span><b>${o.name}</b><small>${o.id===observerId?'S':'설정'}</small></div>`).join('');
    $('#objectList').querySelectorAll('[data-edit]').forEach(el=>el.onclick=()=>{editingId=el.dataset.edit;if(selectedObject().type==='photon')editingId=(objects.find(o=>o.type==='ship')||objects[0]).id;render()});
    $('#observerPicker').querySelectorAll('[data-observe]').forEach(el=>el.onclick=()=>setObserver(el.dataset.observe));
    placeObjects();
  }
  function setObserver(id){observerId=id;if(editingId===id)editingId=(objects.find(o=>o.id!==id&&o.type!=='photon')||objects.find(o=>o.id!==id)||objects[0]).id;render()}
  function placeObjects(){
    const lanes={ship:$('#shipLane'),train:$('#trainLane'),observer:$('#observerLane'),photon:$('#photonLane')};Object.values(lanes).forEach(x=>x.innerHTML='');
    const obs=currentObserver();
    objects.forEach((o,i)=>{if(o.type==='observer'&&o.id===observerId)return;const lane=lanes[o.type];if(!lane)return;const rel=o.id===observerId?0:relative(obs,o);let x=50+Math.sin((elapsed*.23+i*.71))*Math.min(39,Math.abs(rel)*43);if(o.type==='photon')x=10+((elapsed*13)%80);const len=o.type==='photon'?26:Math.max(25,Math.min(150,(o.length||55)*(o.id===observerId?1:1/gamma(rel))*.72));const e=document.createElement('div');e.className=`runway-object ${o.type==='observer'?'station':o.type}`;e.style.left=`${x}%`;e.style.width=`${len}px`;e.innerHTML=`<span>${o.icon}</span>${o.name}<small>${o.type==='photon'?'c':cLabel(rel)}</small>`;lane.append(e)});
    $('#observerMarker').style.left='50%';
  }
  function updateReadout(){
    const a=currentObserver(),b=subject(),u=relative(a,b),g=gamma(u),L=b.type==='photon'?0:targetLength(b),properRate=1/g;
    $('#frameLabel').textContent=`${a.name} 기준`;$('#observerName').textContent=a.name;$('#observerAvatar').textContent=a.icon;$('#editingName').textContent=selectedObject()?.name||b.name;$('#speedValue').textContent=cLabel(selectedObject()?.v||0);$('#speedSlider').value=selectedObject()?.type==='photon'?0:selectedObject()?.v||0;
    $('#relativeSpeed').textContent=cLabel(u);$('#directionText').textContent=u===0?'서로 정지':u>0?'+x 방향':'−x 방향';$('#gammaValue').textContent=safe(g);$('#lengthValue').innerHTML=b.type==='photon'?'— <em>m</em>':`${safe(L,1)} <em>m</em>`;$('#lengthDetail').textContent=b.type==='photon'?'광자는 고유 길이가 없습니다.':`고유 길이 ${safe(b.length,1)} m`;
    $('#timeValue').innerHTML=`${safe(properRate)}<em>×</em>`;$('#speedBar').style.width=`${Math.abs(u)*100}%`;$('#gammaBar').style.width=`${Math.min(100,(g-1)*35+8)}%`;$('#lengthRuler').style.width=`${Math.max(6,100/g)}%`;$('#clockHands').style.transform=`rotate(${elapsed*120}deg)`;$('#clockB').textContent=b.name.replace('우주선 ','').slice(0,4);
    const bType=b.type==='train'?'기차':b.type==='photon'?'광자 펄스':'우주선';const lengthText=b.type==='photon'?'광자는 정지계와 고유 길이가 없습니다.':`길이는 <b>${safe(b.length,1)}m에서 ${safe(L,1)}m</b>로 수축되어 관측됩니다.`;
    const timeText=b.type==='photon'?'광자에는 정지한 시계가 없습니다.':`시계는 <b>${safe(properRate)}배</b> 속도로 흐르는 것으로 측정됩니다.`;
    $('#narrativeText').innerHTML=`${a.name} 기준에서 ${bType} ${b.name}는 <b>${u===0?'정지':`${u>0?'+x':'−x'} 방향으로 ${safe(Math.abs(u),3)}c`}</b> 이동합니다. ${timeText} ${lengthText}`;
    $('#symmetryText').textContent=a.id===b.id?'관측자 본인의 기준계에서는 상대 속도 0, γ = 1입니다.':`${a.name}에서 보면 ${b.name}의 시계가 느립니다. 관측자를 바꾸면 ${b.name}도 ${a.name}의 시계를 같은 비율로 느리게 측정합니다.`;
    $('#symmetryButton').innerHTML=`${b.name} 시점으로 전환하기 <span>→</span>`;$('#symmetryButton').onclick=()=>setObserver(b.id);$('#switchFrame').onclick=()=>setObserver(b.id);$('#speedSlider').disabled=selectedObject()?.type==='observer'||selectedObject()?.type==='photon';
    renderObjects();
  }
  function render(){renderObjects();updateReadout()}
  function tick(now){if(playing){elapsed+=(now-lastTick)/1000*rate;$('#clock').textContent=`00:${safe(elapsed,2).padStart(5,'0')}`;placeObjects()}lastTick=now;requestAnimationFrame(tick)}
  $('#speedSlider').addEventListener('input',e=>{const o=selectedObject();if(!o||o.type==='photon'||o.type==='observer')return;o.v=Number(e.target.value);render()});
  $$('.preset-row button').forEach(btn=>btn.onclick=()=>{const o=selectedObject();if(!o||o.type==='photon'||o.type==='observer')return;o.v=Number(btn.dataset.speed);$$('.preset-row button').forEach(x=>x.classList.toggle('active',x===btn));render()});
  $('#addObject').onclick=()=>{$('#addForm').hidden=!$('#addForm').hidden};
  $('#confirmAdd').onclick=()=>{const type=$('#newType').value,name=$('#newName').value.trim()||typeName[type],length=Math.max(0,Number($('#newLength').value)||0);if(type==='photon'&&objects.some(o=>o.type==='photon')){alert('광자 펄스는 이미 실험에 있습니다.');return}const id=`obj-${Date.now()}`,icon={ship:'✦',train:'▰',observer:'⌖',photon:'✧'}[type];objects.push({id,name,type,length,v:type==='observer'?0:type==='photon'?1:.45,icon});editingId=id;if(type==='observer')observerId=id;$('#addForm').hidden=true;render()};
  $('#playButton').onclick=()=>{playing=!playing;$('#playButton').classList.toggle('playing',playing);$('#playButton').innerHTML=playing?'<span>Ⅱ</span> 시뮬레이션 일시정지':'<span>▶</span> 시뮬레이션 실행';lastTick=performance.now()};
  function reset(){elapsed=0;$('#clock').textContent='00:00.00';placeObjects()};$('#resetButton').onclick=reset;$('#resetView').onclick=reset;
  $$('[data-rate]').forEach(btn=>btn.onclick=()=>{rate=Number(btn.dataset.rate);$$('[data-rate]').forEach(x=>x.classList.toggle('active',x===btn))});
  function selectView(view){$$('.nav-step').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='setup'){$('#controlsPanel').scrollIntoView({behavior:'smooth',block:'nearest'});$('.lab-grid').classList.add('show-controls');$('.lab-grid').classList.remove('show-insight')}else if(view==='simulation'){document.querySelector('.canvas-panel').scrollIntoView({behavior:'smooth',block:'center'});$('.lab-grid').classList.remove('show-controls','show-insight')}else{$('#formulaDetails').scrollIntoView({behavior:'smooth',block:'start'});$('#formulaDetails').classList.add('flash');setTimeout(()=>$('#formulaDetails').classList.remove('flash'),1300)}}
  $$('.nav-step').forEach(b=>b.onclick=()=>selectView(b.dataset.view));$$('[data-view="theory"]').forEach(b=>b.onclick=()=>selectView('theory'));$('#formulaLink').onclick=()=>selectView('theory');
  $$('.mobile-tabs button').forEach(btn=>btn.onclick=()=>{$$('.mobile-tabs button').forEach(b=>b.classList.toggle('selected',b===btn));const g=$('.lab-grid');g.classList.remove('show-controls','show-insight');if(btn.dataset.panel==='controls')g.classList.add('show-controls');if(btn.dataset.panel==='insight')g.classList.add('show-insight');if(btn.dataset.panel==='canvas'){document.querySelector('.canvas-panel').scrollIntoView({behavior:'smooth',block:'nearest'})}});
  $('#axisTicks').innerHTML=['−300','−200','−100','0','100','200','300'].map(x=>`<span>${x}</span>`).join('');
  render();requestAnimationFrame(tick);
})();
