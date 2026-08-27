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

// V4.2：在100×100cm样方中，可由盖度自动换算等效“长×宽”。
function setupCoverAuto(){
  const h1=document.querySelector('h1');if(h1)h1.textContent='🌿 植物样方语音记录器 V4.2';
  const pl=document.getElementById('pl'),pw=document.getElementById('pw'),pc=document.getElementById('pc');
  if(!pl||!pw||!pc)return;
  const lbox=pl.closest('div'),wbox=pw.closest('div'),parent=lbox?.parentElement;
  if(!lbox||!wbox||!parent)return;
  const box=document.createElement('div');box.innerHTML='<label>长×宽（cm）</label><input id="pdims" inputmode="decimal" placeholder="例如 80×100"><div class="status" style="margin-top:3px">未填写长宽时，按100×100cm样方由盖度自动换算</div>';
  parent.insertBefore(box,lbox);lbox.style.display='none';wbox.style.display='none';
  const pd=document.getElementById('pdims');let lastCover='',lastLW='';
  function validCover(){const v=parseFloat(pc.value);return Number.isFinite(v)&&v>=0&&v<=100?v:null}
  function writeAuto(){const c=validCover();if(c===null)return false;pl.value=String(c);pw.value='100';pd.value=`${c}×100`;pd.dataset.auto='1';return true}
  function sync(){
    const c=validCover(),lw=`${pl.value}|${pw.value}`;
    if(!pc.value&&!pl.value&&!pw.value){pd.value='';pd.dataset.auto='0';lastCover='';lastLW='';return}
    if(pd.dataset.auto==='1'){
      if(c!==null&&(String(c)!==pl.value||pw.value!=='100'))writeAuto();
      else if(c===null){pd.value='';pd.dataset.auto='0'}
    }else if(pl.value&&pw.value){pd.value=`${pl.value}×${pw.value}`}
    else if(c!==null){writeAuto()}
    lastCover=pc.value;lastLW=lw;
  }
  pd.addEventListener('input',()=>{
    const v=pd.value.trim();if(!v){pl.value='';pw.value='';pd.dataset.auto='0';return}
    const m=v.match(/^\s*(\d+(?:\.\d+)?)\s*(?:×|\*|x|X|乘)\s*(\d+(?:\.\d+)?)\s*$/);
    if(m){pl.value=m[1];pw.value=m[2];pd.dataset.auto='0'}
  });
  pc.addEventListener('input',()=>{if(pd.dataset.auto==='1'||(!pl.value&&!pw.value))writeAuto()});
  pc.addEventListener('change',()=>{if(pd.dataset.auto==='1'||(!pl.value&&!pw.value))writeAuto()});
  pl.addEventListener('input',()=>{pd.dataset.auto='0';sync()});pw.addEventListener('input',()=>{pd.dataset.auto='0';sync()});
  setInterval(()=>{const lw=`${pl.value}|${pw.value}`;if(pc.value!==lastCover||lw!==lastLW)sync()},350);
  sync();
}
setupCoverAuto();
})();