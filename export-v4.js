(()=>{'use strict';
const scoreNames=['感知绿化程度','感知植物多样性','植物色彩丰富度','景观自然感','景观设计层次感','软硬景观协调性','街道尺度宜人度','感知视线通透性','整洁感','基础设施丰富度','铺装质量感知','安全感'];
function S(){window.recorderPersist();return window.recorderState()}
function clean(s){return(s||'样地').replace(/[\\\/?*\[\]:]/g,'').slice(0,31)||'样地'}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function shortDate(v){const m=String(v||'').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);return m?`${Number(m[2])}.${Number(m[3])}`:(v||'')}
async function saveBlob(blob,name){
  try{
    const file=new File([blob],name,{type:blob.type||'application/octet-stream'});
    if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
      try{await navigator.share({files:[file],title:name});return true}catch(e){if(e&&e.name==='AbortError')return false}
    }
  }catch(e){}
  try{
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},2500);return true
  }catch(e){alert('文件生成成功，但浏览器阻止了保存。请换 Chrome/Edge 打开，或使用“分享/下载”功能。');return false}
}
function setCell(ws,r,c,v,opt={}){const cell=ws.getCell(r,c);cell.value=v??'';if(opt.bold)cell.font={...(cell.font||{}),bold:true};if(opt.color)cell.font={...(cell.font||{}),color:{argb:opt.color}};if(opt.fill)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:opt.fill}};if(opt.center)cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};return cell}
function styleSheet(ws,s,x){
  ws.columns=[{width:14},{width:17},{width:26},{width:18},{width:12},{width:16},{width:16},...Array.from({length:12},()=>({width:15}))];
  for(let r=1;r<=6;r++)for(let c=1;c<=19;c++)setCell(ws,r,c,ws.getCell(r,c).value,{fill:'E2F0D9'});
  const info=[['调研地点：',s.loc||`${x.grid||''}号网格${s.code||''}样地`],['调研日期：',shortDate(x.date)],['所属行政区：',x.district],['道路走向',s.road],['机动车道宽度',s.motor],['慢行道宽度',s.slow]];
  info.forEach((a,i)=>{setCell(ws,i+1,1,a[0],{bold:true});setCell(ws,i+1,2,a[1],{bold:true})});setCell(ws,1,3,`${s.code||''}样地`,{bold:true});
  const hh=['郁闭度 0-1','优势物种','群落空间建构（乔木、灌木、草本）','样地覆盖物','水元素','其他生物','管理维护频率',...scoreNames];
  const vv=[s.canopy,s.dominant,s.community,s.material,s.water,s.bio,s.maint,...scoreNames.map(n=>s.scores?.[n]||'')];
  hh.forEach((v,i)=>{setCell(ws,9,i+1,v,{fill:'F4CCCC',bold:true,center:true});setCell(ws,10,i+1,vv[i],{center:true})});
  setCell(ws,13,2,'记得拍摄四个方向街景图片',{bold:true,color:'FF0000'});
  let r=16;
  (s.samples||[]).forEach(q=>{
    for(let c=1;c<=19;c++)setCell(ws,r,c,'',{fill:'FFF2CC'});
    setCell(ws,r,1,'样方编号：',{bold:true,color:'FF0000'});setCell(ws,r,2,q.code,{bold:true,color:'FF0000'});
    ['序号','种名','平均高度（cm）','长*宽（cm)','盖度（%）','植物类型','生长状况'].forEach((v,i)=>setCell(ws,r+1,i+1,v,{bold:true,center:true}));
    (q.records||[]).forEach((z,j)=>{
      const vals=[j+1,z.plant,z.height,[z.length,z.width].filter(Boolean).join('*'),z.cover,z.type,z.growth];
      vals.forEach((v,i)=>setCell(ws,r+2+j,i+1,v,{fill:'D9D9D9',center:true}));
    });
    r+=(q.records||[]).length+2;
  });
  ws.views=[{state:'frozen',ySplit:10}];
}
async function xlsx(){
  const x=S();
  if(!x.sites?.length)return alert('当前没有可导出的样地数据');
  if(!window.ExcelJS){alert('XLSX组件未加载，已自动改用兼容Excel格式。');return xls()}
  try{
    const w=new ExcelJS.Workbook();w.creator='植物样方语音记录器';w.created=new Date();
    x.sites.forEach(s=>styleSheet(w.addWorksheet(clean((s.code||'')+'样地')),s,x));
    const b=await w.xlsx.writeBuffer();
    await saveBlob(new Blob([b],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),`${x.date||'今日'}_网格${x.grid||'未编号'}_样方调查汇总.xlsx`);
  }catch(e){console.error(e);alert('XLSX生成失败，已自动改用兼容Excel格式。');return xls()}
}
function rowXml(vals,styleIds=[]){return '<Row>'+vals.map((z,i)=>`<Cell${styleIds[i]?` ss:StyleID="${styleIds[i]}"`:''}><Data ss:Type="String">${esc(z)}</Data></Cell>`).join('')+'</Row>'}
async function xls(){
  const x=S();if(!x.sites?.length)return alert('当前没有可导出的样地数据');
  const sheets=x.sites.map(s=>{
    const rows=[];
    rows.push(rowXml(['调研地点：',s.loc||`${x.grid||''}号网格${s.code||''}样地`,`${s.code||''}样地`],['greenBold','greenBold','greenBold']));
    rows.push(rowXml(['调研日期：',shortDate(x.date)],['greenBold','greenBold']));
    rows.push(rowXml(['所属行政区：',x.district],['greenBold','greenBold']));
    rows.push(rowXml(['道路走向',s.road],['greenBold','greenBold']));
    rows.push(rowXml(['机动车道宽度',s.motor],['greenBold','greenBold']));
    rows.push(rowXml(['慢行道宽度',s.slow],['greenBold','greenBold']));
    rows.push(rowXml([]));rows.push(rowXml([]));
    rows.push(rowXml(['郁闭度 0-1','优势物种','群落空间建构（乔木、灌木、草本）','样地覆盖物','水元素','其他生物','管理维护频率',...scoreNames],Array(19).fill('pinkHead')));
    rows.push(rowXml([s.canopy,s.dominant,s.community,s.material,s.water,s.bio,s.maint,...scoreNames.map(n=>s.scores?.[n]||'')],Array(19).fill('center')));
    rows.push(rowXml([]));rows.push(rowXml([]));rows.push(rowXml(['','记得拍摄四个方向街景图片'],['','redBold']));rows.push(rowXml([]));rows.push(rowXml([]));
    (s.samples||[]).forEach(q=>{
      rows.push(rowXml(['样方编号：',q.code],['yellowRed','yellowRed']));
      rows.push(rowXml(['序号','种名','平均高度（cm）','长*宽（cm）','盖度（%）','植物类型','生长状况'],Array(7).fill('head')));
      (q.records||[]).forEach((z,i)=>rows.push(rowXml([i+1,z.plant,z.height,[z.length,z.width].filter(Boolean).join('*'),z.cover,z.type,z.growth],Array(7).fill('gray'))));
    });
    return `<Worksheet ss:Name="${esc(clean((s.code||'')+'样地'))}"><Table>${rows.join('')}</Table></Worksheet>`
  }).join('');
  const xml=`<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Default"><Alignment ss:Vertical="Center"/><Font ss:FontName="宋体" ss:Size="11"/></Style><Style ss:ID="greenBold"><Font ss:Bold="1"/><Interior ss:Color="#E2F0D9" ss:Pattern="Solid"/></Style><Style ss:ID="pinkHead"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1"/><Interior ss:Color="#F4CCCC" ss:Pattern="Solid"/></Style><Style ss:ID="center"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style><Style ss:ID="redBold"><Font ss:Bold="1" ss:Color="#FF0000"/></Style><Style ss:ID="yellowRed"><Font ss:Bold="1" ss:Color="#FF0000"/><Interior ss:Color="#FFF2CC" ss:Pattern="Solid"/></Style><Style ss:ID="head"><Alignment ss:Horizontal="Center"/><Font ss:Bold="1"/></Style><Style ss:ID="gray"><Alignment ss:Horizontal="Center"/><Interior ss:Color="#D9D9D9" ss:Pattern="Solid"/></Style></Styles>${sheets}</Workbook>`;
  await saveBlob(new Blob(['\ufeff',xml],{type:'application/vnd.ms-excel;charset=utf-8'}),`${x.date||'今日'}_网格${x.grid||'未编号'}_样方调查汇总.xls`)
}
document.getElementById('xlsx').onclick=xlsx;document.getElementById('xls').onclick=xls;

// V4.3：100×100cm样方内，由盖度自动换算等效“长×宽”。
function setupCoverAuto(){
  const h1=document.querySelector('h1');if(h1)h1.textContent='🌿 植物样方语音记录器 V4.3';
  const pl=document.getElementById('pl'),pw=document.getElementById('pw'),pc=document.getElementById('pc');
  if(!pl||!pw||!pc)return;
  const lbox=pl.closest('div'),wbox=pw.closest('div'),parent=lbox?.parentElement;
  if(!lbox||!wbox||!parent)return;
  const box=document.createElement('div');box.innerHTML='<label>长×宽（cm）</label><input id="pdims" inputmode="decimal" placeholder="例如 80×100"><div class="status" style="margin-top:3px">没说长宽时，按100×100cm样方由盖度自动换算</div>';
  parent.insertBefore(box,lbox);lbox.style.display='none';wbox.style.display='none';
  const pd=document.getElementById('pdims');let lastCover='',lastLW='';
  function clearDimWarn(){const pn=document.getElementById('pn'),hint=document.getElementById('hint');if(pn&&pn.value.includes('长×宽')){let a=pn.value.replace('待确认：','').split('、').filter(x=>x&&x!=='长×宽');pn.value=a.length?'待确认：'+a.join('、'):''}if(hint&&hint.textContent.includes('长×宽')&&!pn?.value)hint.innerHTML='<span class="good">✅ 长×宽已按盖度自动换算</span>'}
  function validCover(){const v=parseFloat(pc.value);return Number.isFinite(v)&&v>=0&&v<=100?v:null}
  function writeAuto(){const c=validCover();if(c===null)return false;pl.value=String(c);pw.value='100';pd.value=`${c}×100`;pd.dataset.auto='1';clearDimWarn();return true}
  function sync(){const c=validCover(),lw=`${pl.value}|${pw.value}`;if(!pc.value&&!pl.value&&!pw.value){pd.value='';pd.dataset.auto='0';lastCover='';lastLW='';return}if(pd.dataset.auto==='1'){if(c!==null&&(String(c)!==pl.value||pw.value!=='100'))writeAuto();else if(c===null){pd.value='';pd.dataset.auto='0'}}else if(pl.value&&pw.value){pd.value=`${pl.value}×${pw.value}`}else if(c!==null){writeAuto()}lastCover=pc.value;lastLW=lw}
  pd.addEventListener('input',()=>{const v=pd.value.trim();if(!v){pl.value='';pw.value='';pd.dataset.auto='0';return}const m=v.match(/^\s*(\d+(?:\.\d+)?)\s*(?:×|\*|x|X|乘)\s*(\d+(?:\.\d+)?)\s*$/);if(m){pl.value=m[1];pw.value=m[2];pd.dataset.auto='0';clearDimWarn()}});
  pc.addEventListener('input',()=>{if(pd.dataset.auto==='1'||(!pl.value&&!pw.value))writeAuto()});pc.addEventListener('change',()=>{if(pd.dataset.auto==='1'||(!pl.value&&!pw.value))writeAuto()});pl.addEventListener('input',()=>{pd.dataset.auto='0';sync()});pw.addEventListener('input',()=>{pd.dataset.auto='0';sync()});
  setInterval(()=>{const lw=`${pl.value}|${pw.value}`;if(pc.value!==lastCover||lw!==lastLW)sync()},350);sync();
}

// 感知评价全部改成1-5下拉框。
function setupScoreSelects(){
  const box=document.getElementById('scores');if(!box)return;
  const convert=()=>{scoreNames.forEach((n,i)=>{const old=document.getElementById('sc'+i);if(!old||old.tagName==='SELECT')return;const sel=document.createElement('select');sel.id=old.id;['','1','2','3','4','5'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v||'请选择';sel.appendChild(o)});sel.value=old.value||'';sel.onchange=()=>window.recorderPersist?.();old.replaceWith(sel)})};
  new MutationObserver(convert).observe(box,{childList:true,subtree:true});convert();
}

// 新植物不再受固定词库限制：从整句话里推断种名，并记住为快捷植物。
function setupOpenPlantRecognition(){
  const speech=document.getElementById('speech'),pp=document.getElementById('pp'),pn=document.getElementById('pn'),hint=document.getElementById('hint'),plants=document.getElementById('plants');if(!speech||!pp)return;
  const CK='plant_custom_species_v43';
  function custom(){try{return JSON.parse(localStorage.getItem(CK)||'[]')}catch(e){return[]}}
  function saveCustom(name){if(!name)return;let a=custom();if(!a.includes(name)){a.push(name);localStorage.setItem(CK,JSON.stringify(a));addChip(name)}}
  function addChip(name){if(!plants||[...plants.querySelectorAll('[data-p]')].some(b=>b.dataset.p===name))return;const b=document.createElement('button');b.dataset.p=name;b.textContent=name;plants.appendChild(b)}
  custom().forEach(addChip);
  const note=document.createElement('div');note.className='status';note.style.marginTop='6px';note.textContent='新植物也可以识别。推荐说法：“种名狗尾草，高度8，盖度30，野生，长势3”。';speech.insertAdjacentElement('afterend',note);
  function infer(text){
    let s=String(text||'').trim().replace(/[，、；;]/g,',').replace(/\s+/g,' ');if(!s)return'';
    s=s.replace(/^\s*[A-Za-z]\s*[0-9一二三四五六七八九十]+\s*[,，]?\s*/,'');
    let m=s.match(/(?:种名|植物名称|植物名|名称|植物是|叫做|叫)[：:\s]*([\u3400-\u9fff·]{1,12})/);
    let c=m?m[1]:'';
    if(!c){const cut=s.search(/(?:平均高度|高度|长宽|尺寸|盖度|覆盖度|覆盖|人工栽培|人工|野生自生|野生|长势|生长状况|生长情况)/);c=(cut>=0?s.slice(0,cut):s.split(',')[0]).trim();c=c.replace(/^(?:这个是|这是|种名|植物名称|植物名|植物|名称|一株|一棵|有一株|有一棵|叫做|叫|是)\s*/,'')}
    c=c.replace(/[，,。；;：:\s]/g,'').replace(/^(?:一个|这个)/,'');
    if(!/^[\u3400-\u9fff·]{1,12}$/.test(c))return'';
    if(/^(高度|长宽|盖度|野生|人工|长势|植物)$/.test(c))return'';
    return c;
  }
  function clearPlantWarn(){if(pn&&pn.value.includes('种名')){let a=pn.value.replace('待确认：','').split('、').filter(x=>x&&x!=='种名');pn.value=a.length?'待确认：'+a.join('、'):''}if(hint&&hint.textContent.includes('种名'))hint.innerHTML='<span class="good">✅ 已从语音中提取新植物名称，可直接修改确认</span>'}
  function apply(){if(pp.value.trim())return;const c=infer(speech.value);if(c){pp.value=c;clearPlantWarn()}}
  document.getElementById('parse')?.addEventListener('click',()=>setTimeout(apply,60));
  let lastSpeech='';setInterval(()=>{if(speech.value!==lastSpeech){lastSpeech=speech.value;setTimeout(apply,120)}},250);
  document.getElementById('addRecord')?.addEventListener('click',()=>{const n=pp.value.trim();if(n)saveCustom(n)},true);
}

// 多网格本机管理：同一天可建立多个网格，切换时各自数据完全独立保存。
function setupGridManager(){
  const key='plant_grid_manager_v43',baseKey='plant_recorder_v4',gridInput=document.getElementById('grid');if(!gridInput||!window.recorderState)return;
  const clone=x=>JSON.parse(JSON.stringify(x));const uid=()=>((crypto&&crypto.randomUUID)?crypto.randomUUID():'g'+Date.now()+Math.random().toString(36).slice(2));
  function blankState(no,src){const sid='s'+Date.now()+Math.random().toString(36).slice(2),qid='q'+Date.now()+Math.random().toString(36).slice(2);return{date:src.date||new Date().toISOString().slice(0,10),grid:no,district:src.district||'',sites:[{id:sid,code:'A',loc:no?`网格${no}样地A`:'',road:'',motor:'',slow:'',canopy:'',dominant:'',community:'',material:'',water:'',bio:'',maint:'',scores:Object.fromEntries(scoreNames.map(n=>[n,''])),samples:[{id:qid,code:'A1',records:[]}]}],siteId:sid,sampleId:qid}}
  function loadM(){try{const x=JSON.parse(localStorage.getItem(key)||'null');if(x?.items?.length)return x}catch(e){}const st=clone(window.recorderState());const id=uid();return{active:id,items:[{id,grid:st.grid||'',date:st.date||'',state:st}]}}
  let M=loadM();
  function saveM(){localStorage.setItem(key,JSON.stringify(M))}
  function active(){return M.items.find(x=>x.id===M.active)||M.items[0]}
  function snapshot(){try{window.recorderPersist();const st=clone(window.recorderState()),a=active();if(!a)return;a.state=st;a.grid=st.grid||'';a.date=st.date||'';saveM();renderTabs()}catch(e){}}
  const firstCard=document.querySelector('.app .card');if(!firstCard)return;
  const mgr=document.createElement('div');mgr.style.margin='9px 0 10px';mgr.innerHTML='<div class="status" style="margin-bottom:5px">网格管理（每个网格独立保存）</div><div class="tabs" id="gridTabs"></div><div class="row"><button id="newGrid" class="soft">＋新建网格</button><button id="delGrid" class="danger">删除当前网格</button></div>';
  firstCard.querySelector('.title')?.insertAdjacentElement('afterend',mgr);
  const tabs=document.getElementById('gridTabs');
  function renderTabs(){if(!tabs)return;tabs.innerHTML='';M.items.forEach(it=>{const b=document.createElement('button');b.className=it.id===M.active?'active':'soft';const d=it.date?it.date.slice(5):'';b.textContent=(it.grid||'未编号')+'网格'+(d?' · '+d:'');b.onclick=()=>{if(it.id===M.active)return;snapshot();M.active=it.id;saveM();localStorage.setItem(baseKey,JSON.stringify(it.state));location.reload()};tabs.appendChild(b)})}
  document.getElementById('newGrid').onclick=()=>{snapshot();const no=prompt('请输入新网格编号，例如 586：','');if(!no)return;const cur=clone(window.recorderState());const found=M.items.find(x=>String(x.grid)===String(no)&&x.date===cur.date);if(found){if(confirm('这个日期已经有该网格，是否直接切换过去？')){M.active=found.id;saveM();localStorage.setItem(baseKey,JSON.stringify(found.state));location.reload()}return}const st=blankState(String(no).trim(),cur),it={id:uid(),grid:String(no).trim(),date:st.date,state:st};M.items.push(it);M.active=it.id;saveM();localStorage.setItem(baseKey,JSON.stringify(st));location.reload()};
  document.getElementById('delGrid').onclick=()=>{if(M.items.length<=1)return alert('至少保留一个网格。');const a=active();if(!confirm(`确定删除“${a.grid||'未编号'}网格”在本机的全部记录吗？`))return;const i=M.items.findIndex(x=>x.id===a.id);M.items.splice(i,1);const n=M.items[Math.max(0,i-1)];M.active=n.id;saveM();localStorage.setItem(baseKey,JSON.stringify(n.state));location.reload()};
  gridInput.addEventListener('change',snapshot);document.getElementById('date')?.addEventListener('change',snapshot);document.getElementById('district')?.addEventListener('change',snapshot);
  setInterval(snapshot,1200);saveM();renderTabs();
}

setupCoverAuto();setupScoreSelects();setupOpenPlantRecognition();setupGridManager();
})();