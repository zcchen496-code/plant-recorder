(function(){
'use strict';
var KEY='plant_recorder_v45';
var OLD44='plant_recorder_v44';
var OLD4='plant_recorder_v4';
var SCORE_NAMES=['感知绿化程度','感知植物多样性','植物色彩丰富度','景观自然感','景观设计层次感','软硬景观协调性','街道尺度宜人度','感知视线通透性','整洁感','基础设施丰富度','铺装质量感知','安全感'];
var KNOWN=['狗牙根','马唐','莲子草','香附子','黄独','牛筋草','打碗花','艾草','白三叶','酢浆草','葛','鬼针草','大车前草','黄鹌菜','楝','桑','水杉','紫薇','红叶石楠','狗尾草'];
var ALIAS={'狗芽根':'狗牙根','狗牙跟':'狗牙根','马糖':'马唐','马塘':'马唐','连子草':'莲子草','莲籽草':'莲子草','香夫子':'香附子','香父子':'香附子','黄毒':'黄独','牛津草':'牛筋草','牛精草':'牛筋草','打完花':'打碗花','大碗花':'打碗花','红叶石南':'红叶石楠','红叶石兰':'红叶石楠'};
var CUSTOM_KEY='plant_custom_species_v45';
var D={gridId:'',roadId:'',siteId:'',sampleId:'',grids:[]};
var recognition=null,keepListening=false,recognitionActive=false,restartTimer=null,lastFinal='';
function E(id){return document.getElementById(id)}
function uid(){try{if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID()}catch(e){}return 'id_'+Date.now()+'_'+Math.random().toString(36).slice(2)}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function scoreObj(){var o={};SCORE_NAMES.forEach(function(n){o[n]=''});return o}
function makeSample(site,code){return{id:uid(),code:code||site.code+(site.samples.length+1),records:[]}}
function makeSite(road,code){var c=code||String.fromCharCode(65+Math.min(road.sites.length,25));var s={id:uid(),code:c,loc:'',canopy:'',dominant:'',community:'',material:'',water:'',bio:'',maint:'',scores:scoreObj(),samples:[]};s.samples=[makeSample(s,c+'1')];return s}
function makeRoad(grid,code){var r={id:uid(),code:code||((grid.roads.length+1)+'号道路'),direction:'',motor:'',slow:'',note:'',sites:[]};r.sites=[makeSite(r,'A')];return r}
function makeGrid(no){var g={id:uid(),grid:String(no||''),date:today(),district:'',roads:[]};g.roads=[makeRoad(g,'1号道路')];return g}
function currentGrid(){for(var i=0;i<D.grids.length;i++)if(D.grids[i].id===D.gridId)return D.grids[i];return null}
function currentRoad(){var g=currentGrid();if(!g)return null;for(var i=0;i<g.roads.length;i++)if(g.roads[i].id===D.roadId)return g.roads[i];return null}
function currentSite(){var r=currentRoad();if(!r)return null;for(var i=0;i<r.sites.length;i++)if(r.sites[i].id===D.siteId)return r.sites[i];return null}
function currentSample(){var s=currentSite();if(!s)return null;for(var i=0;i<s.samples.length;i++)if(s.samples[i].id===D.sampleId)return s.samples[i];return null}
function ensureStructure(){
 if(!Array.isArray(D.grids))D.grids=[];
 if(!D.grids.length){var ng=makeGrid('');D.grids=[ng];D.gridId=ng.id;D.roadId=ng.roads[0].id;D.siteId=ng.roads[0].sites[0].id;D.sampleId=ng.roads[0].sites[0].samples[0].id;return}
 D.grids.forEach(function(g){
  g.grid=String(g.grid==null?'':g.grid);if(!g.date)g.date=today();if(typeof g.district!=='string')g.district='';if(!Array.isArray(g.roads))g.roads=[];
  if(!g.roads.length)g.roads=[makeRoad(g,'1号道路')];
  g.roads.forEach(function(r){
   if(!r.id)r.id=uid();if(typeof r.code!=='string')r.code='1号道路';if(typeof r.direction!=='string')r.direction='';if(typeof r.note!=='string')r.note='';
   if(typeof r.motor!=='string')r.motor='';if(typeof r.slow!=='string')r.slow='';if(!Array.isArray(r.sites))r.sites=[];if(!r.sites.length)r.sites=[makeSite(r,'A')];
   r.sites.forEach(function(s){
    if(!s.id)s.id=uid();if(typeof s.code!=='string')s.code='A';if(typeof s.loc!=='string')s.loc='';if(!s.scores||typeof s.scores!=='object')s.scores=scoreObj();SCORE_NAMES.forEach(function(n){if(s.scores[n]==null)s.scores[n]=''});
    ['canopy','dominant','community','material','water','bio','maint'].forEach(function(k){if(typeof s[k]!=='string')s[k]=s[k]==null?'':String(s[k])});
    if(!Array.isArray(s.samples))s.samples=[];if(!s.samples.length)s.samples=[makeSample(s,s.code+'1')];
    s.samples.forEach(function(q){if(!q.id)q.id=uid();if(typeof q.code!=='string')q.code=s.code+'1';if(!Array.isArray(q.records))q.records=[];q.records.forEach(function(z){if(!z.id)z.id=uid();if(z.dims==null&&z.length!=null&&z.width!=null)z.dims=String(z.length)+'×'+String(z.width);if(z.dims==null)z.dims='';});});
   });
  });
 });
 var g=currentGrid()||D.grids[0];D.gridId=g.id;var r=currentRoad()||g.roads[0];D.roadId=r.id;var s=currentSite()||r.sites[0];D.siteId=s.id;var q=currentSample()||s.samples[0];D.sampleId=q.id;
}
function migrateOld4(old){
 var g=makeGrid(old.grid||'');g.date=old.date||today();g.district=old.district||'';var r=makeRoad(g,'1号道路');r.sites=[];
 (old.sites||[]).forEach(function(os){var s=makeSite(r,os.code||'A');s.id=os.id||uid();s.loc=os.loc||'';s.canopy=os.canopy||'';s.dominant=os.dominant||'';s.community=os.community||'';s.material=os.material||'';s.water=os.water||'';s.bio=os.bio||'';s.maint=os.maint||'';s.scores=os.scores||scoreObj();if(!r.motor&&os.motor)r.motor=os.motor;if(!r.slow&&os.slow)r.slow=os.slow;if(!r.direction&&os.road)r.direction=os.road;s.samples=[];(os.samples||[]).forEach(function(oq){var q=makeSample(s,oq.code);q.id=oq.id||uid();q.records=(oq.records||[]).map(function(z){return{id:z.id||uid(),plant:z.plant||'',height:z.height||'',dims:z.dims||([z.length,z.width].filter(Boolean).join('×')),cover:z.cover||'',type:z.type||'',growth:z.growth||'',note:z.note||''}});s.samples.push(q)});if(!s.samples.length)s.samples=[makeSample(s,s.code+'1')];r.sites.push(s)});
 if(!r.sites.length)r.sites=[makeSite(r,'A')];g.roads=[r];return{gridId:g.id,roadId:r.id,siteId:r.sites[0].id,sampleId:r.sites[0].samples[0].id,grids:[g]};
}
function load(){
 var x=null;try{x=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
 if(x&&Array.isArray(x.grids)&&x.grids.length){D=x}else{
  try{x=JSON.parse(localStorage.getItem(OLD44)||'null')}catch(e){x=null}
  if(x&&Array.isArray(x.grids)&&x.grids.length)D=x;else{try{x=JSON.parse(localStorage.getItem(OLD4)||'null')}catch(e){x=null}if(x&&Array.isArray(x.sites))D=migrateOld4(x)}
 }
 ensureStructure();save();render();
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}updateKpis()}
window.recorderState=function(){return currentGrid()};window.recorderPersist=function(){readForm();save()};
function readForm(){var g=currentGrid(),r=currentRoad(),s=currentSite(),q=currentSample();if(g){g.grid=E('gridNo').value.trim();g.date=E('date').value||today();g.district=E('district').value.trim()}if(r){r.code=E('roadCode').value.trim()||r.code;r.direction=E('roadDirection').value.trim();r.motor=E('motor').value.trim();r.slow=E('slow').value.trim();r.note=E('roadNote').value.trim()}if(s){s.code=E('siteCode').value.trim().toUpperCase()||s.code;s.loc=E('siteLoc').value.trim();s.canopy=E('canopy').value.trim();s.dominant=E('dominant').value.trim();s.community=E('community').value;s.material=E('material').value.trim();s.water=E('water').value.trim();s.bio=E('bio').value.trim();s.maint=E('maint').value.trim();SCORE_NAMES.forEach(function(n,i){var f=E('sc'+i);if(f)s.scores[n]=f.value})}if(q)q.code=E('sampleCode').value.trim().toUpperCase()||q.code}
function button(text,cls,fn){var b=document.createElement('button');b.textContent=text;b.className=cls;b.onclick=fn;return b}
function renderTabs(){
 var gt=E('gridTabs');gt.innerHTML='';D.grids.forEach(function(g){gt.appendChild(button((g.grid||'未编号')+'网格',g.id===D.gridId?'active':'soft',function(){switchGrid(g)}))});
 var rt=E('roadTabs');rt.innerHTML='';var g=currentGrid();(g?g.roads:[]).forEach(function(r){rt.appendChild(button(r.code||'未命名道路','roadtab '+(r.id===D.roadId?'active':''),function(){switchRoad(r)}))});
 var st=E('siteTabs');st.innerHTML='';var r=currentRoad();(r?r.sites:[]).forEach(function(s){st.appendChild(button((s.code||'')+'样地',s.id===D.siteId?'active':'soft',function(){switchSite(s)}))});
 var qt=E('sampleTabs');qt.innerHTML='';var s=currentSite();(s?s.samples:[]).forEach(function(q){qt.appendChild(button(q.code,'sample '+(q.id===D.sampleId?'active':''),function(){readForm();D.sampleId=q.id;save();render()}))});
}
function renderScores(){var s=currentSite(),box=E('scores');box.innerHTML='';SCORE_NAMES.forEach(function(n,i){var d=document.createElement('div'),lab=document.createElement('label'),sel=document.createElement('select');lab.textContent=n;sel.id='sc'+i;['','1','2','3','4','5'].forEach(function(v){var o=document.createElement('option');o.value=v;o.textContent=v||'请选择';sel.appendChild(o)});sel.value=s&&s.scores?s.scores[n]||'':'';sel.onchange=function(){if(s)s.scores[n]=sel.value;save()};d.appendChild(lab);d.appendChild(sel);box.appendChild(d)})}
function renderRows(){var b=E('rows');b.innerHTML='';var q=currentSample();(q?q.records:[]).forEach(function(r,i){var tr=document.createElement('tr');[i+1,r.plant,r.height,r.dims,r.cover,r.type,r.growth,r.note].forEach(function(v){var td=document.createElement('td');td.textContent=v==null?'':v;tr.appendChild(td)});var td=document.createElement('td');td.appendChild(button('删','danger',function(){q.records.splice(i,1);save();renderRows()}));tr.appendChild(td);b.appendChild(tr)})}
function render(){ensureStructure();var g=currentGrid(),r=currentRoad(),s=currentSite(),q=currentSample();E('gridNo').value=g?g.grid:'';E('date').value=g?g.date:today();E('district').value=g?g.district:'';E('roadCode').value=r?r.code:'';E('roadDirection').value=r?r.direction:'';E('motor').value=r?r.motor:'';E('slow').value=r?r.slow:'';E('roadNote').value=r?r.note:'';E('siteCode').value=s?s.code:'';E('siteLoc').value=(s&&s.loc)?s.loc:((g?g.grid:'')+'网格'+(r?r.code:'')+(s?s.code:'')+'样地');E('canopy').value=s?s.canopy:'';E('dominant').value=s?s.dominant:'';E('community').value=s?s.community:'';E('material').value=s?s.material:'';E('water').value=s?s.water:'';E('bio').value=s?s.bio:'';E('maint').value=s?s.maint:'';E('sampleCode').value=q?q.code:'';E('ps').value=q?q.code:'';E('gridRoadTitle').textContent='当前：'+(g&&g.grid?g.grid:'未编号')+'网格';E('roadSiteTitle').textContent='当前：'+(g&&g.grid?g.grid:'未编号')+'网格 → '+(r&&r.code?r.code:'未命名道路');renderTabs();renderScores();renderRows();updateKpis()}
function switchGrid(g){readForm();D.gridId=g.id;D.roadId=g.roads[0].id;D.siteId=g.roads[0].sites[0].id;D.sampleId=g.roads[0].sites[0].samples[0].id;save();render()}
function switchRoad(r){readForm();D.roadId=r.id;D.siteId=r.sites[0].id;D.sampleId=r.sites[0].samples[0].id;save();render()}
function switchSite(s){readForm();D.siteId=s.id;D.sampleId=s.samples[0].id;save();render()}
function updateKpis(){var roads=0,sites=0,samples=0,records=0;D.grids.forEach(function(g){(g.roads||[]).forEach(function(r){roads++;(r.sites||[]).forEach(function(s){sites++;(s.samples||[]).forEach(function(q){samples++;records+=(q.records||[]).length})})})});if(E('kc0'))E('kc0').textContent=D.grids.length+'个网格';if(E('kc1'))E('kc1').textContent=roads+'条道路';if(E('kc2'))E('kc2').textContent=sites+'个样地';if(E('kc3'))E('kc3').textContent=records+'条记录'}
function normalizeText(t){t=String(t||'');Object.keys(ALIAS).forEach(function(a){t=t.split(a).join(ALIAS[a])});return t.replace(/[，、；;]/g,',').replace(/\s+/g,' ').trim()}
function chineseNumber(s){s=String(s||'').trim();if(/^\d+(\.\d+)?$/.test(s))return Number(s);var d={'零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};if(s==='十')return 10;if(s.indexOf('十')>=0){var p=s.split('十');return (p[0]?d[p[0]]:1)*10+(p[1]?d[p[1]]:0)}if(d[s]!=null)return d[s];return null}
function numberAfter(t,labels){for(var i=0;i<labels.length;i++){var re=new RegExp(labels[i]+'[：:\\s]*(?:百分之)?([零一二两三四五六七八九十百\\d\\.]+)');var m=t.match(re);if(m){var n=chineseNumber(m[1]);if(n!=null)return n}}return null}
function inferPlant(t){t=normalizeText(t);for(var i=0;i<KNOWN.length;i++)if(t.indexOf(KNOWN[i])>=0)return KNOWN[i];var m=t.match(/(?:种名|植物名称|植物名|植物是|叫做|叫)[：:\s]*([\u3400-\u9fff·]{1,12})/);if(m)return m[1];var cut=t.search(/(?:平均高度|高度|长宽|尺寸|盖度|覆盖度|覆盖|人工|野生|长势|生长状况|生长)/);var c=(cut>=0?t.slice(0,cut):t.split(',')[0]);c=c.replace(/^(?:这个是|这是|植物|种名|有一株|有一棵|一株|一棵|叫做|叫)/,'').replace(/[，,。\s]/g,'');return /^[\u3400-\u9fff·]{1,12}$/.test(c)?c:''}
function parseSpeech(text){var t=normalizeText(text),plant=inferPlant(t),height=numberAfter(t,['平均高度','高度','高']),cover=numberAfter(t,['盖度','覆盖度','覆盖']),growth=numberAfter(t,['长势','生长状况','生长']),type=/人工|栽培|种植/.test(t)?'人工栽培':(/野生|自生/.test(t)?'野生自生':'');var dm=t.match(/(\d+(?:\.\d+)?)\s*(?:乘|×|x|X|\*)\s*(\d+(?:\.\d+)?)/);var dims=dm?(dm[1]+'×'+dm[2]):(cover!=null?(cover+'×100'):'');return{plant:plant,height:height,cover:cover,growth:(growth>=1&&growth<=5)?growth:'',type:type,dims:dims,explicitDims:!!dm}}
function clearPlantWarning(){var pn=E('pn');if(pn&&pn.value.indexOf('种名')>=0)pn.value=''}
function fillParsed(p){E('pp').value=p.plant||'';E('ph').value=p.height==null?'':p.height;E('pc').value=p.cover==null?'':p.cover;E('pg').value=p.growth||'';E('pt').value=p.type||'';E('pdims').value=p.dims||'';E('pdims').dataset.auto=p.explicitDims?'0':(p.cover!=null?'1':'0');E('pn').value=p.plant?'':'待确认：种名';E('hint').innerHTML=p.plant?'<span class="good">✅ 已识别，可修改后加入</span>':'<span class="bad">⚠️ 请确认植物名称</span>'}
function autoDimsFromCover(force){var pc=E('pc'),pd=E('pdims');if(!pc||!pd)return;var c=Number(pc.value);if(!isFinite(c)||c<0||c>100){if(pd.dataset.auto==='1')pd.value='';return}if(force||!pd.value||pd.dataset.auto==='1'){pd.value=String(c)+'×100';pd.dataset.auto='1';var hint=E('hint');if(hint&&hint.textContent.indexOf('长×宽')>=0)hint.innerHTML='<span class="good">✅ 长×宽已按盖度自动换算</span>'}}
function setupCoverAuto(){var pc=E('pc'),pd=E('pdims');if(!pc||!pd)return;pc.addEventListener('input',function(){autoDimsFromCover(false)});pc.addEventListener('change',function(){autoDimsFromCover(false)});pd.addEventListener('input',function(){pd.dataset.auto='0'});pd.addEventListener('blur',function(){if(!pd.value)autoDimsFromCover(true)})}
function customSpecies(){try{return JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]')}catch(e){return[]}}
function addSpeciesChip(name){if(!name)return;var box=E('plants');if(!box)return;var buttons=box.querySelectorAll('button[data-p]');for(var i=0;i<buttons.length;i++)if(buttons[i].getAttribute('data-p')===name)return;var b=document.createElement('button');b.setAttribute('data-p',name);b.textContent=name;box.appendChild(b)}
function rememberSpecies(name){if(!name)return;var a=customSpecies();if(a.indexOf(name)<0){a.push(name);try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(a))}catch(e){}}addSpeciesChip(name)}
function renderSpecies(){var box=E('plants');box.innerHTML='';KNOWN.concat(customSpecies()).forEach(addSpeciesChip);box.onclick=function(ev){var n=ev.target&&ev.target.getAttribute?ev.target.getAttribute('data-p'):'';if(n){E('pp').value=n;clearPlantWarning()}}}
function setupSpeech(){var R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){E('speechStatus').textContent='当前浏览器不支持网页语音识别，可使用手机键盘语音输入。';E('mic').disabled=true;return}recognition=new R();recognition.lang='zh-CN';recognition.continuous=true;recognition.interimResults=true;try{recognition.maxAlternatives=5}catch(e){}recognition.onstart=function(){recognitionActive=true;E('mic').classList.add('on');E('mic').textContent='🛑持续监听中，点此停止';E('speechStatus').textContent='持续监听中；自动断开会自动重连。'};recognition.onresult=function(ev){for(var i=ev.resultIndex;i<ev.results.length;i++){var res=ev.results[i],best=res[0].transcript;E('speech').value=best;if(res.isFinal&&best!==lastFinal){lastFinal=best;fillParsed(parseSpeech(best))}}};recognition.onerror=function(ev){recognitionActive=false;if(ev.error==='not-allowed'||ev.error==='audio-capture'){keepListening=false;E('speechStatus').textContent='麦克风权限或占用异常。'}};recognition.onend=function(){recognitionActive=false;if(keepListening){clearTimeout(restartTimer);restartTimer=setTimeout(function(){try{recognition.start()}catch(e){}},450)}else{E('mic').classList.remove('on');E('mic').textContent='🎙️开始持续监听'}};E('mic').onclick=function(){keepListening=!keepListening;if(keepListening){lastFinal='';try{recognition.start()}catch(e){}}else{clearTimeout(restartTimer);try{recognition.stop()}catch(e){}}}}
function setupActions(){
 E('addGrid').onclick=function(){readForm();var no=E('newGridNo').value.trim();if(!no)return alert('请输入网格编号');var dup=null;for(var i=0;i<D.grids.length;i++)if(D.grids[i].grid===no&&D.grids[i].date===E('date').value)dup=D.grids[i];if(dup){if(confirm('该日期已经有这个网格，是否直接切换？'))switchGrid(dup);return}var g=makeGrid(no);g.date=E('date').value||today();g.district=E('district').value.trim();D.grids.push(g);D.gridId=g.id;D.roadId=g.roads[0].id;D.siteId=g.roads[0].sites[0].id;D.sampleId=g.roads[0].sites[0].samples[0].id;E('newGridNo').value='';save();render()};
 E('delGrid').onclick=function(){if(D.grids.length<2)return alert('至少保留一个网格');if(!confirm('删除当前网格的全部道路、样地和记录？'))return;var idx=D.grids.findIndex(function(g){return g.id===D.gridId});D.grids.splice(idx,1);switchGrid(D.grids[Math.max(0,idx-1)])};
 E('addRoad').onclick=function(){readForm();var g=currentGrid(),code=E('newRoadCode').value.trim()||((g.roads.length+1)+'号道路'),r=makeRoad(g,code);g.roads.push(r);D.roadId=r.id;D.siteId=r.sites[0].id;D.sampleId=r.sites[0].samples[0].id;E('newRoadCode').value='';save();render()};
 E('delRoad').onclick=function(){var g=currentGrid();if(g.roads.length<2)return alert('至少保留一条道路');if(!confirm('删除当前道路及其全部样地？'))return;var idx=g.roads.findIndex(function(r){return r.id===D.roadId});g.roads.splice(idx,1);switchRoad(g.roads[Math.max(0,idx-1)])};
 E('addSite').onclick=function(){readForm();var r=currentRoad(),s=makeSite(r);r.sites.push(s);D.siteId=s.id;D.sampleId=s.samples[0].id;save();render()};
 E('delSite').onclick=function(){var r=currentRoad();if(r.sites.length<2)return alert('至少保留一个样地');if(!confirm('删除当前样地？'))return;var idx=r.sites.findIndex(function(s){return s.id===D.siteId});r.sites.splice(idx,1);switchSite(r.sites[Math.max(0,idx-1)])};
 E('addSample').onclick=function(){readForm();var s=currentSite(),q=makeSample(s);s.samples.push(q);D.sampleId=q.id;save();render()};
 E('delSample').onclick=function(){var s=currentSite();if(s.samples.length<2)return alert('至少保留一个样方');if(!confirm('删除当前样方？'))return;var idx=s.samples.findIndex(function(q){return q.id===D.sampleId});s.samples.splice(idx,1);D.sampleId=s.samples[Math.max(0,idx-1)].id;save();render()};
 E('nextSample').onclick=function(){E('addSample').click()};
 E('parse').onclick=function(){fillParsed(parseSpeech(E('speech').value))};
 E('clearSpeech').onclick=function(){E('speech').value=''};
 E('addRecord').onclick=function(){readForm();var plant=E('pp').value.trim();if(!plant)return alert('请先确认植物种名');autoDimsFromCover(false);var q=currentSample();q.records.push({id:uid(),plant:plant,height:E('ph').value.trim(),dims:E('pdims').value.trim(),cover:E('pc').value.trim(),type:E('pt').value,growth:E('pg').value,note:E('pn').value.trim()});rememberSpecies(plant);['pp','ph','pdims','pc','pn'].forEach(function(id){E(id).value=''});E('pdims').dataset.auto='1';E('pt').value='';E('pg').value='';E('speech').value='';lastFinal='';save();renderRows();updateKpis();E('hint').textContent='已加入一条，可以继续记录下一种植物'};
 ['gridNo','date','district','roadCode','roadDirection','motor','slow','roadNote','siteCode','siteLoc','canopy','dominant','community','material','water','bio','maint','sampleCode'].forEach(function(id){var f=E(id);if(f)f.addEventListener('change',function(){readForm();save();renderTabs();if(id==='gridNo'||id==='roadCode'||id==='siteCode')render()})});
}
function setupServiceWorker(){if('serviceWorker' in navigator){try{navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister()})})}catch(e){}}}
load();renderSpecies();setupCoverAuto();setupActions();setupSpeech();setupServiceWorker();
})();