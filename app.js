const KEY='flowbudget.v2';
// Clean-start release: discard persisted financial data once when this version
// is first opened in this browser. Subsequent entries remain saved normally.
const YB_CLEAN_START='youbudget.cleanStart.v4.15.2';
if(localStorage.getItem(YB_CLEAN_START)!=='1'){
  localStorage.removeItem(KEY);
  localStorage.removeItem('youbudget.landingSeen');
  sessionStorage.removeItem('youbudget.demoEnter');
  localStorage.setItem(YB_CLEAN_START,'1');
}

const CLEAN_RELEASE='youbudget.clean.v4.1';
if(localStorage.getItem(CLEAN_RELEASE)!=='1'){
  localStorage.removeItem(KEY);
  localStorage.removeItem('youbudget.landingSeen');
  localStorage.setItem(CLEAN_RELEASE,'1');
}
const defaultCats=['Housing','Groceries','Dining','Transport','Utilities','Insurance','Education','Health','Shopping','Travel','Entertainment','Fees','Income','Transfers','Other'];
const defaultRules=[['SALARY','Income'],['PAYROLL','Income'],['COLD STORAGE','Groceries'],['FAIRPRICE','Groceries'],['GRAB','Transport'],['SINGAPORE PETROLEUM','Transport'],['SHELL','Transport'],['ALCHEMIST','Dining'],['POKE THEORY','Dining'],['INSURANCE','Insurance'],['MSIG','Insurance'],['ACCOUNT FEE','Fees']];
let S=JSON.parse(localStorage.getItem(KEY)||'null')||{mode:'basic',tx:[],imports:[],cats:defaultCats,rules:defaultRules.map((x,i)=>({id:i+1,text:x[0],cat:x[1]})),flows:[],mappings:{}};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
S.currency=S.currency||'USD';
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:S.currency||'USD',currencyDisplay:'narrowSymbol',maximumFractionDigits:0}).format(n||0); const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
function parseDate(x){if(!x)return null;if(x instanceof Date)return x; let d=new Date(x); if(!isNaN(d))return d; let m=String(x).match(/(\d{1,2})[-\/]([A-Za-z]{3}|\d{1,2})[-\/](\d{2,4})/); if(m){let y=+m[3];if(y<100)y+=2000; return new Date(`${m[1]} ${m[2]} ${y}`)} return null}
function norm(s){return String(s??'').trim().replace(/\s+/g,' ')} function num(x){let n=parseFloat(String(x??'').replace(/[$,A-Za-z ]/g,''));return isNaN(n)?0:n}
function category(desc){let t=norm(desc).toUpperCase(); let rs=[...S.rules].sort((a,b)=>b.text.length-a.text.length); return rs.find(r=>t.includes(r.text.toUpperCase()))?.cat||'Other'}
function detect(rows,name){let best=-1,score=-1; rows.slice(0,20).forEach((r,i)=>{let h=r.map(x=>norm(x).toLowerCase());let s=h.filter(x=>/date|description|amount|debit|credit|transaction/.test(x)).length;if(s>score){score=s;best=i}});let headers=rows[best]||[];let low=headers.map(x=>norm(x).toLowerCase());let find=re=>low.findIndex(x=>re.test(x));let date=find(/transaction date|^date$|posting date/), desc=find(/transaction description|^description$|details|narrative/), debit=find(/debit amount|^debit$/), credit=find(/credit amount|^credit$/), amount=find(/^amount$|transaction amount/);let type=find(/transaction type|type/);let kind=/card transaction/i.test(rows.slice(0,8).flat().join(' '))||low.some(x=>x.includes('card member'))?'card':'bank';return{header:best,headers,date,desc,debit,credit,amount,type,kind,name}}
function normalizeRows(rows,map,source){let out=[]; for(let i=map.header+1;i<rows.length;i++){let r=rows[i],d=parseDate(r[map.date]);if(!d)continue;let desc=norm(r[map.desc]);if(!desc)continue;let amt=0,flow='out';if(map.debit>=0||map.credit>=0){let db=num(r[map.debit]),cr=num(r[map.credit]);amt=cr?cr:-db;flow=amt>=0?'in':'out'}else{let raw=num(r[map.amount]); if(map.kind==='card'){amt=-raw;flow=raw<0?'in':'out'}else{amt=raw;flow=amt>=0?'in':'out'}}let typ=map.type>=0?norm(r[map.type]):'';let isPayment=map.kind==='card'&&(/payment/i.test(typ)||/autopay|payment thank/i.test(desc));out.push({id:[source,d.toISOString().slice(0,10),desc,amt].join('|'),date:d.toISOString().slice(0,10),desc,account:source,accountType:map.kind,type:isPayment?'card_payment':(map.kind==='card'?'card_purchase':(flow==='in'?'inflow':'cash_outflow')),amount:amt,category:isPayment?'Transfers':category(desc)})}return out}
function csvRows(text){let rows=[],row=[],cell='',q=false;for(let i=0;i<text.length;i++){let c=text[i],n=text[i+1];if(c==='"'&&q&&n==='"'){cell+='"';i++}else if(c==='"')q=!q;else if(c===','&&!q){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(x=>x!==''))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}return rows}
async function readFile(file){let rows;if(/\.csv$/i.test(file.name)){rows=csvRows(await file.text())}else{if(typeof XLSX==='undefined')throw Error('XLSX reader could not load. Connect once to the internet or place xlsx.full.min.js locally.');let wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});let ws=wb.Sheets[wb.SheetNames[0]];rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false})}let m=detect(rows,file.name);if(m.date<0||m.desc<0||(m.amount<0&&m.debit<0&&m.credit<0))throw Error('Could not identify date, description and amount columns. Convert to CSV with clear headers or adjust the mapping code.');let tx=normalizeRows(rows,m,file.name);let before=S.tx.length,ids=new Set(S.tx.map(x=>x.id));tx.forEach(x=>{if(!ids.has(x.id)){S.tx.push(x);ids.add(x.id)}});S.imports.unshift({name:file.name,when:new Date().toISOString(),rows:tx.length,added:S.tx.length-before,kind:m.kind,headers:m.headers});save();return {m,added:S.tx.length-before,total:tx.length}}
function included(t){if(S.mode==='basic'){if(t.accountType==='card')return t.type==='card_payment'&&t.amount>0?false:false; return true} if(t.type==='card_payment')return false;return true}
function spendingAmount(t){if(S.mode==='basic'){if(t.accountType==='bank'&&t.amount<0)return -t.amount;return 0}if(t.type==='card_purchase'&&t.amount<0)return -t.amount;if(t.accountType==='bank'&&t.amount<0){if(/card|visa|amex|autopay/i.test(t.desc))return 0;return -t.amount}return 0}
function render(){S.mode=$('#mode').value=S.mode||'basic';let now=new Date(), ym=now.toISOString().slice(0,7), month=S.tx.filter(t=>t.date.startsWith(ym));let inflow=month.filter(t=>t.accountType==='bank'&&t.amount>0).reduce((a,t)=>a+t.amount,0), spend=month.reduce((a,t)=>a+spendingAmount(t),0);$('#kIn').textContent=money(inflow);$('#kOut').textContent=money(spend);$('#kNet').textContent=money(inflow-spend);if($('#spendLabel')) $('#spendLabel').textContent=S.mode==='basic'?'Current-account outflows incl. card bills':'Cash purchases + card line items';$('#modeNote').textContent=S.mode==='basic'?'Basic view counts cash outflows; card line items are informational.':'Detailed view counts card purchases and excludes detected repayments.';renderUpcoming();renderCats(month);renderRecent();renderChart();renderTransactions();renderRules();renderImports();renderCalendar();}
function flowInstances(days=90){let now=new Date(),end=new Date(now);end.setDate(end.getDate()+days);let arr=[];S.flows.forEach(f=>{let d=new Date(f.date+'T12:00');while(d<=end){if(d>=new Date(now.toDateString()))arr.push({...f,when:new Date(d)});if(f.repeat!=='monthly')break;d.setMonth(d.getMonth()+1)}});return arr.sort((a,b)=>a.when-b.when)}
function renderUpcoming(){
 let x=flowInstances(30),net=x.reduce((a,f)=>a+(f.type==='in'?f.amount:-f.amount),0);
 if($('#kUpcoming'))$('#kUpcoming').textContent=money(net);
 if($('#upcoming'))$('#upcoming').innerHTML=x.slice(0,6).map(f=>`<div class=row><div><b>${f.name}</b><div class=muted>${f.when.toLocaleDateString()}</div></div><b class="amount ${f.type}">${f.type==='in'?'+':'−'}${money(f.amount)}</b></div>`).join('')||'<p class=muted>No planned flows yet. Add them in Calendar.</p>';
 let soon=x.filter(f=>(f.when-new Date())/86400000<=7);
 if($('#alerts'))$('#alerts').innerHTML=soon.length?`<div class=alert><strong>${soon.length} planned flow${soon.length>1?'s':''}</strong> in the next 7 days.</div>`:'';
}
function renderCats(month){
  let period=month||[], label='Current month';
  if(S.mode!=='basic'){
    let hasSpend=period.some(t=>spendingAmount(t)>0);
    if(!hasSpend){
      let spendTx=S.tx.filter(t=>spendingAmount(t)>0).sort((a,b)=>b.date.localeCompare(a.date));
      if(spendTx.length){
        let latestYM=spendTx[0].date.slice(0,7);
        period=S.tx.filter(t=>t.date.startsWith(latestYM));
        let d=new Date(latestYM+'-02T12:00:00');
        label='Latest imported month · '+d.toLocaleString('en',{month:'short',year:'numeric'});
      }else label='No imported spending';
    }else label='Current month';
  }else label='Advanced edition';
  let m={};period.forEach(t=>{let v=spendingAmount(t);if(v)m[t.category||'Other']=(m[t.category||'Other']||0)+v});
  let a=Object.entries(m).sort((a,b)=>b[1]-a[1]),mx=a[0]?.[1]||1;
  if($('#catsPeriod')) $('#catsPeriod').textContent=label;
  $('#cats').innerHTML=a.slice(0,7).map(([c,v])=>`<div class=barrow><span>${c}</span><div class=bar><i style="width:${v/mx*100}%"></i></div><b class=num>${money(v)}</b></div>`).join('')||(S.mode==='basic'?'<p class=muted>Category analysis is available in Advanced after statement import.</p>':'<p class=muted>No imported spending transactions are available for category analysis.</p>');
}
function txRow(t){return `<tr><td>${t.date}</td><td>${t.desc}</td><td>${t.account}</td><td>${t.type.replaceAll('_',' ')}</td><td><select class=catpick data-id="${encodeURIComponent(t.id)}">${S.cats.map(c=>`<option ${c===t.category?'selected':''}>${c}</option>`).join('')}</select></td><td class="num amount ${t.amount>=0?'in':'out'}">${t.amount>=0?'+':''}${money(t.amount)}</td></tr>`}
function renderRecent(){$('#recent').innerHTML=`<table><tbody>${[...S.tx].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8).map(txRow).join('')}</tbody></table>`}
function renderTransactions(){let q=($('#search')?.value||'').toLowerCase(),ac=$('#acctFilter')?.value||'';let accounts=[...new Set(S.tx.map(t=>t.account))];let old=$('#acctFilter').value;$('#acctFilter').innerHTML='<option value="">All accounts</option>'+accounts.map(a=>`<option>${a}</option>`).join('');$('#acctFilter').value=old;$('#txbody').innerHTML=[...S.tx].filter(t=>(!q||t.desc.toLowerCase().includes(q))&&(!ac||t.account===ac)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,500).map(txRow).join('')}
function renderChart(){let months=[];for(let k=5;k>=0;k--){let d=new Date();d.setMonth(d.getMonth()-k);months.push(d.toISOString().slice(0,7))}let vals=months.map(m=>{let a=S.tx.filter(t=>t.date.startsWith(m));return [a.filter(t=>t.accountType==='bank'&&t.amount>0).reduce((s,t)=>s+t.amount,0),a.reduce((s,t)=>s+spendingAmount(t),0)]});let mx=Math.max(1,...vals.flat());$('#chart').innerHTML=months.map((m,i)=>`<div class=monthbar><div class=bars><i style="height:${vals[i][0]/mx*150}px"></i><i class=out style="height:${vals[i][1]/mx*150}px"></i></div>${new Date(m+'-02').toLocaleString('en',{month:'short'})}</div>`).join('')}
function renderRules(){$('#ruleCat').innerHTML=S.cats.map(c=>`<option>${c}</option>`).join('');$('#rulesList').innerHTML=S.rules.map(r=>`<div class=row><span>If description contains <b>${r.text}</b> → ${r.cat}</span><button data-delrule="${r.id}">×</button></div>`).join('');$('#catList').innerHTML=S.cats.map((c,i)=>`<span class=category-chip><span>${c}</span><button type=button data-delcat="${i}" aria-label="Delete category">×</button></span>`).join(' ')}
function renderImports(){
  $('#imports').innerHTML=S.imports.map(x=>{
    let canDelete=!!x.id;
    let source=x.fileName&&x.fileName!==x.name?`<div class=muted>Source: ${x.fileName}</div>`:'';
    return `<div class=row><div><b>${x.name}</b>${source}<div class=muted>${x.account?x.account+' · ':''}${x.kind} · ${x.rows} rows detected · ${x.added} added</div></div><div class=import-actions><span class=muted>${new Date(x.when).toLocaleString()}</span>${canDelete?`<button class="danger small" data-delimport="${x.id}">Delete</button>`:'<span class=muted>Legacy import</span>'}</div></div>`
  }).join('')||'<p class=muted>No files imported yet.</p>'
}
let calDate=new Date();function renderCalendar(){let y=calDate.getFullYear(),m=calDate.getMonth();$('#calTitle').textContent=new Date(y,m,1).toLocaleString('en',{month:'long',year:'numeric'});let first=new Date(y,m,1),start=new Date(y,m,1-first.getDay()),html=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<div class="day head">${x}</div>`).join('');let inst=flowInstances(400);for(let i=0;i<42;i++){let d=new Date(start);d.setDate(start.getDate()+i);let key=d.toISOString().slice(0,10),ev=inst.filter(f=>f.when.toISOString().slice(0,10)===key);html+=`<div class="day ${d.getMonth()!==m?'dim':''}"><b>${d.getDate()}</b>${ev.map(f=>`<div class="event ${f.type}"><b>${f.name}</b>${f.type==='in'?'+':'−'}${money(f.amount)}</div>`).join('')}</div>`}$('#calendarGrid').innerHTML=html}
$$('nav button').forEach(b=>b.onclick=()=>{$$('nav button,.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.page).classList.add('active');$('#title').textContent=b.textContent;$('#subtitle').textContent={dashboard:'Your cash flow at a glance',import:'Bring in bank and card statements',transactions:'Review and categorise normalized entries',calendar:'Plan expected inflows and outflows',rules:'Teach the local categorisation engine',settings:'Privacy and local storage',forecast:'Look ahead, anticipate and test decisions',plan:'Define the cash flows that shape your future'}[b.dataset.page]});
$('#mode').onchange=e=>{S.mode=e.target.value;save();render()};$('#files').onchange=async e=>{let box=$('#importStatus');for(let f of e.target.files){try{box.innerHTML=`<p>Reading ${f.name}…</p>`;let r=await readFile(f);box.innerHTML=`<p>✓ ${f.name}: ${r.total} transactions found, ${r.added} added.</p>`}catch(err){box.innerHTML+=`<p class=amount>${f.name}: ${err.message}</p>`}}render()};$('#search').oninput=renderTransactions;$('#acctFilter').onchange=renderTransactions;document.body.addEventListener('change',e=>{if(e.target.classList.contains('catpick')){let id=decodeURIComponent(e.target.dataset.id),t=S.tx.find(x=>x.id===id);if(t){t.category=e.target.value;save();render()}}});$('#ruleForm').onsubmit=e=>{e.preventDefault();S.rules.push({id:Date.now(),text:$('#ruleText').value.trim(),cat:$('#ruleCat').value});$('#ruleText').value='';S.tx.forEach(t=>{if(t.category==='Other')t.category=category(t.desc)});save();render()};document.body.addEventListener('click',e=>{if(e.target.dataset.delrule){S.rules=S.rules.filter(r=>r.id!=e.target.dataset.delrule);save();render()}});$('#catForm').onsubmit=e=>{e.preventDefault();let c=$('#catName').value.trim();if(c&&!S.cats.includes(c))S.cats.push(c);$('#catName').value='';save();render()};$('#addFlow').onclick=()=>{$('#flowDate').value=new Date().toISOString().slice(0,10);$('#flowDialog').showModal()};$('#flowForm').onsubmit=e=>{e.preventDefault();S.flows.push({id:Date.now(),name:$('#flowName').value,date:$('#flowDate').value,type:$('#flowType').value,amount:+$('#flowAmount').value,repeat:$('#flowRepeat').value});save();$('#flowDialog').close();render()};$('#prevMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};$('#nextMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};$('#exportData').onclick=()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='flowbudget-backup.json';a.click()};$('#reset').onclick=()=>{if(confirm('Clear all local FlowBudget data?')){localStorage.removeItem(KEY);location.reload()}};

// ---- FlowBudget v3 extensions ----
S.monthly=S.monthly||[];
S.startCash=S.startCash||0; S.minBuffer=S.minBuffer||0;
S.merchantRules=S.merchantRules||[];
S.rules=S.rules.map(r=>({...r,behaviour:r.behaviour||'regular'})); S.tx=S.tx.map(t=>({...t,merchant:t.merchant||t.desc,behaviour:t.behaviour||'regular',reconciled:t.reconciled||false})); save();
function merchantName(desc){let u=norm(desc).toUpperCase(),r=S.merchantRules.find(x=>u.includes(x.text.toUpperCase()));if(r)return r.name;return norm(desc).replace(/\b[A-Z0-9]{8,}\b/g,'').replace(/\*[^ ]+/g,'').trim().slice(0,70)||norm(desc)}
function classify(t){let text=(t.merchant+' '+t.desc).toUpperCase(),r=[...S.rules].sort((a,b)=>b.text.length-a.text.length).find(x=>text.includes(x.text.toUpperCase()));if(r){t.category=r.cat;t.behaviour=r.behaviour||'regular'}return t}
function reconcileAccounts(){S.tx.forEach(t=>{t.reconciled=false;t.reconcileId=null});let banks=S.tx.filter(t=>t.accountType==='bank'&&t.amount<0),cards=S.tx.filter(t=>t.accountType==='card'&&t.amount>0);for(let b of banks){let bd=new Date(b.date),best=cards.find(c=>!c.reconciled&&Math.abs(c.amount+b.amount)<0.02&&Math.abs((new Date(c.date)-bd)/86400000)<=7);if(best){let id='R'+Math.random().toString(36).slice(2,8);b.reconciled=best.reconciled=true;b.reconcileId=best.reconcileId=id;b.category=best.category='Transfers'}}save()}
function monthlyInstances(days=365,from=new Date()){let end=new Date(from);end.setDate(end.getDate()+days);let out=[];for(let y=from.getFullYear();y<=end.getFullYear();y++)for(let m=0;m<12;m++){for(let f of S.monthly){let last=new Date(y,m+1,0).getDate(),d=new Date(y,m,Math.min(f.day,last),12);if(d>=new Date(from.toDateString())&&d<=end)out.push({...f,when:d})}}return out.sort((a,b)=>a.when-b.when)}
const oldFlowInstances=flowInstances; flowInstances=function(days=90){return [...monthlyInstances(days),...oldFlowInstances(days)].sort((a,b)=>a.when-b.when)};
function renderMonthly(){let b=$('#monthlyBody');if(!b)return;b.innerHTML=S.monthly.sort((a,b)=>a.day-b.day).map(f=>`<tr><td>${f.day}${f.day===1?'st':f.day===2?'nd':f.day===3?'rd':'th'}</td><td>${f.name}</td><td>${f.type==='in'?'Inflow':'Outflow'}</td><td class="num amount ${f.type}">${f.type==='in'?'+':'−'}${money(f.amount)}</td><td><button data-delmonthly="${f.id}">×</button></td></tr>`).join('')}
function renderCashRisk(){let start=+S.startCash||0,buf=+S.minBuffer||0,flows=monthlyInstances(90),bal=start,low={bal,date:new Date()};for(let f of flows){bal+=f.type==='in'?f.amount:-f.amount;if(bal<low.bal)low={bal,date:f.when}}let box=$('#cashWarning');if(box)box.innerHTML=low.bal<buf?`<div class="alert"><b>Cash buffer warning:</b> projected balance falls to ${money(low.bal)} on ${low.date.toLocaleDateString()}, below your ${money(buf)} limit.</div>`:`<div class="muted">Lowest projected balance over 90 days: <b>${money(low.bal)}</b> (${low.date.toLocaleDateString()}).</div>`}
function actualBudget(){let regular={},one={},now=new Date(),cut=new Date(now);cut.setMonth(cut.getMonth()-6);let tx=S.tx.filter(t=>new Date(t.date)>=cut&&spendingAmount(t)>0&&!t.reconciled);tx.forEach(t=>{let v=spendingAmount(t),o=t.behaviour==='oneoff'?one:regular;o[t.category]=(o[t.category]||0)+v});let months=6;let annualIn=S.monthly.filter(x=>x.type==='in').reduce((a,x)=>a+x.amount*12,0);let plannedOut=S.monthly.filter(x=>x.type==='out').reduce((a,x)=>a+x.amount*12,0);let projected=Object.values(regular).reduce((a,x)=>a+x/months*12,0);$('#annualIn').textContent=money(annualIn);$('#annualOut').textContent=money(plannedOut+projected);$('#annualNet').textContent=money(annualIn-plannedOut-projected);$('#annualOne').textContent=money(Object.values(one).reduce((a,x)=>a+x,0));if($('#bauBudget')) $('#bauBudget').innerHTML=Object.entries(regular).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row"><span>${k}</span><b>${money(v/months*12)} / yr</b></div>`).join('')||'<p class="muted">Import statements in Advanced mode to estimate category run-rates.</p>';if($('#oneoffBudget')) $('#oneoffBudget').innerHTML=Object.entries(one).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row"><span>${k}</span><b>${money(v)}</b></div>`).join('')||'<p class="muted">No one-off expenses classified yet.</p>'}
const oldRender=render;render=function(){oldRender();renderMonthly();renderCashRisk();actualBudget();if($('#startCash'))$('#startCash').value=S.startCash;if($('#minBuffer'))$('#minBuffer').value=S.minBuffer;$$('.advancedOnly').forEach(x=>x.classList.toggle('hidden',S.mode==='basic'))};
txRow=function(t){return `<tr><td>${t.date}</td><td><b>${t.merchant||t.desc}</b><div class="muted">${t.desc}</div></td><td>${t.account}</td><td><select class=catpick data-id="${encodeURIComponent(t.id)}">${S.cats.map(c=>`<option ${c===t.category?'selected':''}>${c}</option>`).join('')}</select></td><td><select class=behpick data-id="${encodeURIComponent(t.id)}"><option value="regular" ${t.behaviour!=='oneoff'?'selected':''}>Regular / BAU</option><option value="oneoff" ${t.behaviour==='oneoff'?'selected':''}>One-off</option></select></td><td>${t.reconciled?'<span class="pill transfer">reconciled transfer</span>':''}</td><td class="num amount ${t.amount>=0?'in':'out'}">${t.amount>=0?'+':''}${money(t.amount)}</td></tr>`}
// Upgrade normalization with merchant + behaviour
const oldNormalizeRows=normalizeRows;normalizeRows=function(rows,map,source){return oldNormalizeRows(rows,map,source).map(t=>classify({...t,merchant:merchantName(t.desc),behaviour:'regular',reconciled:false}))}
// Mapping wizard: always confirm detected fields; mappings are remembered by header signature.
let pendingMap=null;function selectOpts(sel,headers,value,none=true){sel.innerHTML=(none?'<option value="-1">— none —</option>':'')+headers.map((h,i)=>`<option value="${i}" ${i===value?'selected':''}>${i+1}. ${norm(h)||'(blank)'}</option>`).join('')}
async function readRows(file){if(/\.csv$/i.test(file.name))return csvRows(await file.text());if(typeof XLSX==='undefined')throw Error('XLSX reader could not load. CSV works offline; for XLSX connect once or bundle SheetJS locally.');let wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:false})}
readFile=async function(file){let rows=await readRows(file),m=detect(rows,file.name),sig=m.headers.map(norm).join('|');let saved=S.mappings[sig];if(saved)m={...m,...saved};return await new Promise((resolve,reject)=>{pendingMap={file,rows,m,sig,resolve,reject};$('#mapIntro').textContent=`${file.name}: review the detected columns before import.`;$('#mapStatementName').value=file.name.replace(/\.[^.]+$/,'');$('#mapAccount').value=(saved&&saved.account)||file.name.replace(/\.[^.]+$/,'');$('#mapKind').value=m.kind;selectOpts($('#mapDate'),m.headers,m.date,false);selectOpts($('#mapDesc'),m.headers,m.desc,false);selectOpts($('#mapAmount'),m.headers,m.amount,true);selectOpts($('#mapDebit'),m.headers,m.debit,true);selectOpts($('#mapCredit'),m.headers,m.credit,true);$('#mapDialog').showModal()})}
$('#mapForm').onsubmit=e=>{e.preventDefault();let p=pendingMap,m={...p.m,date:+$('#mapDate').value,desc:+$('#mapDesc').value,amount:+$('#mapAmount').value,debit:+$('#mapDebit').value,credit:+$('#mapCredit').value,kind:$('#mapKind').value,account:$('#mapAccount').value};let statementName=$('#mapStatementName').value.trim()||p.file.name;if(m.date<0||m.desc<0||(m.amount<0&&m.debit<0&&m.credit<0))return alert('Please map date, description and amount (or debit/credit).');S.mappings[p.sig]={date:m.date,desc:m.desc,amount:m.amount,debit:m.debit,credit:m.credit,kind:m.kind,account:m.account};let tx=normalizeRows(p.rows,m,m.account),ids=new Set(S.tx.map(x=>x.id)),before=S.tx.length,batchId='imp_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);tx.forEach(x=>{if(!ids.has(x.id)){x.importId=batchId;S.tx.push(x);ids.add(x.id)}});let added=S.tx.length-before;S.imports.unshift({id:batchId,name:statementName,fileName:p.file.name,account:m.account,when:new Date().toISOString(),rows:tx.length,added,kind:m.kind,headers:m.headers});reconcileAccounts();save();$('#mapDialog').close();pendingMap=null;p.resolve({m,added,total:tx.length})};$('#mapCancel').onclick=()=>{if(pendingMap){pendingMap.reject(Error('Import cancelled'));pendingMap=null}$('#mapDialog').close()};
$('#addMonthly').onclick=()=>$('#monthlyDialog').showModal();$('#monthlyCancel').onclick=()=>$('#monthlyDialog').close();$('#monthlyForm').onsubmit=e=>{e.preventDefault();S.monthly.push({id:'m'+Date.now(),day:+$('#monthlyDay').value,name:$('#monthlyName').value.trim(),type:$('#monthlyType').value,amount:+$('#monthlyAmount').value});save();$('#monthlyDialog').close();e.target.reset();render()};
document.body.addEventListener('click',e=>{if(e.target.dataset.delmonthly){S.monthly=S.monthly.filter(x=>x.id!==e.target.dataset.delmonthly);save();render()}});document.body.addEventListener('change',e=>{if(e.target.classList.contains('behpick')){let t=S.tx.find(x=>x.id===decodeURIComponent(e.target.dataset.id));if(t){t.behaviour=e.target.value;save();render()}}});
$('#startCash').onchange=e=>{S.startCash=+e.target.value;save();renderCashRisk()};$('#minBuffer').onchange=e=>{S.minBuffer=+e.target.value;save();renderCashRisk()};
// Enhance rule creation to retain behaviour
$('#ruleForm').onsubmit=e=>{e.preventDefault();S.rules.push({id:Date.now(),text:$('#ruleText').value.trim(),cat:$('#ruleCat').value,behaviour:$('#ruleBehaviour').value});$('#ruleText').value='';S.tx.forEach(classify);save();render()};
// Startup render is intentionally deferred until all v3.1/v3.2 overrides and event handlers are installed.
function renderMerchantRules(){let el=$('#merchantList');if(el)el.innerHTML=S.merchantRules.map((r,i)=>`<div class="row"><span>If contains <b>${r.text}</b> → <b>${r.name}</b></span><button data-delmerchant="${i}">×</button></div>`).join('')}
$('#merchantForm').onsubmit=e=>{e.preventDefault();S.merchantRules.push({text:$('#merchantText').value.trim(),name:$('#merchantName').value.trim()});S.tx.forEach(t=>{t.merchant=merchantName(t.desc);classify(t)});e.target.reset();save();render();renderMerchantRules()};
document.body.addEventListener('click',e=>{if(e.target.dataset.delmerchant!==undefined){S.merchantRules.splice(+e.target.dataset.delmerchant,1);save();renderMerchantRules()}});$('#reconcile').onclick=()=>{reconcileAccounts();render()};renderMerchantRules();

// ---- FlowBudget v3.1: flexible frequencies + corrected dashboard semantics ----
const FREQ_LABEL={weekly:'Weekly',monthly:'Monthly',quarterly:'Quarterly',semiannual:'Semi-annually',annual:'Annually',once:'One-off'};
function isoLocal(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function migratePlan(){
  const now=new Date();
  S.monthly=(S.monthly||[]).map(f=>{
    if(f.anchorDate&&f.frequency)return f;
    let day=+f.day||now.getDate(), last=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    return {...f,frequency:'monthly',anchorDate:isoLocal(new Date(now.getFullYear(),now.getMonth(),Math.min(day,last),12))};
  });
  save();
}
migratePlan();
function addMonthsClamped(anchor,n){let targetMonth=anchor.getMonth()+n,y=anchor.getFullYear()+Math.floor(targetMonth/12),m=((targetMonth%12)+12)%12,last=new Date(y,m+1,0).getDate();return new Date(y,m,Math.min(anchor.getDate(),last),12)}
function planInstancesRange(start,end){
  start=new Date(start); end=new Date(end); start.setHours(0,0,0,0); end.setHours(23,59,59,999);
  let out=[];
  for(const f of S.monthly||[]){
    let a=new Date((f.anchorDate||isoLocal(new Date()))+'T12:00'), freq=f.frequency||'monthly';
    if(freq==='once'){if(a>=start&&a<=end)out.push({...f,when:a});continue}
    if(freq==='weekly'){
      let d=new Date(a); if(d<start){let weeks=Math.floor((start-d)/604800000);d.setDate(d.getDate()+weeks*7);while(d<start)d.setDate(d.getDate()+7)}
      while(d<=end){out.push({...f,when:new Date(d)});d.setDate(d.getDate()+7)}
    } else {
      let step={monthly:1,quarterly:3,semiannual:6,annual:12}[freq]||1, n=0,d=new Date(a);
      if(d<start){let md=(start.getFullYear()-a.getFullYear())*12+start.getMonth()-a.getMonth();n=Math.max(0,Math.floor(md/step));d=addMonthsClamped(a,n*step);while(d<start){n++;d=addMonthsClamped(a,n*step)}}
      while(d<=end){out.push({...f,when:new Date(d)});n++;d=addMonthsClamped(a,n*step)}
    }
  }
  return out.sort((a,b)=>a.when-b.when);
}
monthlyInstances=function(days=365,from=new Date()){let end=new Date(from);end.setDate(end.getDate()+days);return planInstancesRange(from,end)};
flowInstances=function(days=90){let now=new Date(),end=new Date(now);end.setDate(end.getDate()+days);return [...planInstancesRange(now,end),...oldFlowInstances(days)].sort((a,b)=>a.when-b.when)};
function annualFactor(freq){return {weekly:52,monthly:12,quarterly:4,semiannual:2,annual:1,once:0}[freq||'monthly']??12}
renderMonthly=function(){let b=$('#monthlyBody');if(!b)return;b.innerHTML=(S.monthly||[]).sort((a,b)=>a.anchorDate.localeCompare(b.anchorDate)).map(f=>`<tr><td>${new Date(f.anchorDate+'T12:00').toLocaleDateString()}</td><td>${f.name}</td><td>${FREQ_LABEL[f.frequency]||f.frequency}</td><td>${f.type==='in'?'Inflow':'Outflow'}</td><td class="num amount ${f.type}">${f.type==='in'?'+':'−'}${money(f.amount)}</td><td><div class="plan-actions"><button class="edit-flow" data-editmonthly="${f.id}">Edit</button><button data-delmonthly="${f.id}" aria-label="Delete ${f.name}">×</button></div></td></tr>`).join('')};
renderCashRisk=function(){let start=+S.startCash||0,buf=+S.minBuffer||0,flows=monthlyInstances(90),bal=start,low={bal,date:new Date()};for(let f of flows){bal+=f.type==='in'?f.amount:-f.amount;if(bal<low.bal)low={bal,date:f.when}}let box=$('#cashWarning');if(box)box.innerHTML=low.bal<buf?`<div class="alert"><b>Cash buffer warning:</b> projected balance falls to ${money(low.bal)} on ${low.date.toLocaleDateString()}, below your ${money(buf)} limit.</div>`:`<div class="muted">Lowest projected balance over 90 days: <b>${money(low.bal)}</b> (${low.date.toLocaleDateString()}).</div>`};
function dashboardKPIs(){
  let now=new Date(),ms=new Date(now.getFullYear(),now.getMonth(),1),me=new Date(now.getFullYear(),now.getMonth()+1,0,23,59,59),regularIn=0,regularOut=0,oneOff=0;
  if(S.mode==='basic'){
    let p=planInstancesRange(ms,me);
    regularIn=p.filter(x=>x.type==='in' && x.frequency!=='once').reduce((a,x)=>a+x.amount,0);
    regularOut=p.filter(x=>x.type==='out' && x.frequency!=='once').reduce((a,x)=>a+x.amount,0);
    oneOff=p.filter(x=>x.type==='out' && x.frequency==='once').reduce((a,x)=>a+x.amount,0);
    $('#modeNote').textContent='scheduled current month';
  }else{
    let ym=isoLocal(now).slice(0,7),m=S.tx.filter(t=>t.date.startsWith(ym)&&!t.reconciled);
    regularIn=m.filter(t=>t.accountType==='bank'&&t.amount>0&&t.behaviour!=='oneoff').reduce((a,t)=>a+t.amount,0);
    regularOut=m.filter(t=>t.behaviour!=='oneoff').reduce((a,t)=>a+spendingAmount(t),0);
    oneOff=m.filter(t=>t.behaviour==='oneoff').reduce((a,t)=>a+spendingAmount(t),0);
    $('#modeNote').textContent='actual imported current month';
  }
  let regularNet=regularIn-regularOut,total=regularNet-oneOff;
  $('#kIn').textContent=money(regularIn);$('#kOut').textContent=money(regularOut);$('#kNet').textContent=money(regularNet);$('#monthOne').textContent=money(oneOff);$('#monthTotal').textContent=money(total);
}
actualBudget=function(){
  let regular={},one={},now=new Date(),cut=new Date(now);cut.setMonth(cut.getMonth()-6);
  let tx=S.tx.filter(t=>new Date(t.date)>=cut&&spendingAmount(t)>0&&!t.reconciled);
  tx.forEach(t=>{let v=spendingAmount(t),o=t.behaviour==='oneoff'?one:regular;o[t.category]=(o[t.category]||0)+v});
  let months=6;
  let annualIn=S.monthly.filter(x=>x.type==='in'&&x.frequency!=='once').reduce((a,x)=>a+x.amount*annualFactor(x.frequency),0);
  let plannedOut=S.monthly.filter(x=>x.type==='out'&&x.frequency!=='once').reduce((a,x)=>a+x.amount*annualFactor(x.frequency),0);
  let plannedOne=S.monthly.filter(x=>x.type==='out'&&x.frequency==='once').reduce((a,x)=>a+x.amount,0);
  let projected=S.mode==='detailed'?Object.values(regular).reduce((a,x)=>a+x/months*12,0):0;
  let observedOne=S.mode==='detailed'?Object.values(one).reduce((a,x)=>a+x,0):0;
  let regularOut=plannedOut+projected,regularNet=annualIn-regularOut,oneOff=plannedOne+observedOne,total=regularNet-oneOff;
  $('#annualIn').textContent=money(annualIn);$('#annualOut').textContent=money(regularOut);$('#annualNet').textContent=money(regularNet);$('#annualOne').textContent=money(oneOff);$('#annualTotal').textContent=money(total);
}
const renderBefore31=render;render=function(){renderBefore31();renderMonthly();renderCashRisk();actualBudget();dashboardKPIs()};
$('#addMonthly').onclick=()=>{let d=new Date();$('#monthlyDate').value=isoLocal(d);$('#monthlyDialog').showModal()};
$('#monthlyForm').onsubmit=e=>{e.preventDefault();let d=$('#monthlyDate').value;S.monthly.push({id:'m'+Date.now(),day:+d.slice(-2),anchorDate:d,frequency:$('#monthlyFrequency').value,name:$('#monthlyName').value.trim(),type:$('#monthlyType').value,amount:+$('#monthlyAmount').value});save();$('#monthlyDialog').close();e.target.reset();render()};
render();


// Statement manager: deleting an import batch also removes every transaction created by that batch.
document.body.addEventListener('click',e=>{let id=e.target.dataset.delimport;if(!id)return;let imp=S.imports.find(x=>x.id===id);if(!imp)return;let count=S.tx.filter(t=>t.importId===id).length;if(!confirm(`Delete statement “${imp.name}” and its ${count} imported transaction${count===1?'':'s'}? This cannot be undone.`))return;S.tx=S.tx.filter(t=>t.importId!==id);S.imports=S.imports.filter(x=>x.id!==id);reconcileAccounts();save();render();});


// ---- FlowBudget v3.2.5: visible, deterministic categorisation workflow ----
function matchingRule(t){
  const text=((t.merchant||'')+' '+(t.desc||'')).toUpperCase();
  return [...(S.rules||[])].sort((a,b)=>(b.text||'').length-(a.text||'').length).find(r=>text.includes(String(r.text||'').toUpperCase()))||null;
}
function applyAutoClassification(t,{force=false}={}){
  if(t.reconciled){t.category='Transfers';t.classificationSource='reconciled';t.matchedRule='Account reconciliation';return t}
  if(t.manualOverride&&!force){t.classificationSource='manual';return t}
  t.merchant=merchantName(t.desc);
  const r=matchingRule(t);
  if(r){t.category=r.cat;t.behaviour=r.behaviour||'regular';t.classificationSource='rule';t.matchedRule=r.text}
  else {t.category=t.category&&t.category!=='Transfers'?t.category:'Other';t.behaviour=t.behaviour||'regular';t.classificationSource='unclassified';t.matchedRule=''}
  return t;
}
function migrateClassification(){
  S.tx=(S.tx||[]).map(t=>{
    t.merchant=t.merchant||merchantName(t.desc);
    if(!t.classificationSource){
      const r=matchingRule(t);
      if(r&&t.category===r.cat){t.classificationSource='rule';t.matchedRule=r.text}
      else if(t.reconciled)t.classificationSource='reconciled';
      else t.classificationSource=t.category&&t.category!=='Other'?'legacy':'unclassified';
    }
    t.manualOverride=!!t.manualOverride;
    return t;
  }); save();
}
migrateClassification();
function classificationBadge(t){
  if(t.reconciled||t.classificationSource==='reconciled')return '<span class="pill transfer">Reconciled transfer</span>';
  if(t.manualOverride||t.classificationSource==='manual')return '<span class="pill">Manual</span>';
  if(t.classificationSource==='rule')return `<span class="pill">Auto · ${t.matchedRule||'rule'}</span>`;
  if(t.classificationSource==='legacy')return '<span class="pill">Legacy category</span>';
  return '<span class="pill">Uncategorised</span>';
}
txRow=function(t){return `<tr><td>${t.date}</td><td><b>${t.merchant||t.desc}</b><div class="muted">${t.desc}</div></td><td>${t.account}</td><td><select class=catpick data-id="${encodeURIComponent(t.id)}">${S.cats.map(c=>`<option ${c===t.category?'selected':''}>${c}</option>`).join('')}</select></td><td><select class=behpick data-id="${encodeURIComponent(t.id)}"><option value="regular" ${t.behaviour!=='oneoff'?'selected':''}>Regular / BAU</option><option value="oneoff" ${t.behaviour==='oneoff'?'selected':''}>One-off</option></select></td><td>${classificationBadge(t)}</td><td class="num amount ${t.amount>=0?'in':'out'}">${t.amount>=0?'+':''}${money(t.amount)}</td></tr>`}
function runRules(showSummary=true){
  let matched=0,unchanged=0,manual=0,uncat=0;
  for(const t of S.tx){
    if(t.manualOverride){manual++;continue}
    const before=[t.merchant,t.category,t.behaviour,t.classificationSource,t.matchedRule].join('|');
    applyAutoClassification(t);
    if(t.classificationSource==='rule')matched++;
    if(t.classificationSource==='unclassified')uncat++;
    if(before===[t.merchant,t.category,t.behaviour,t.classificationSource,t.matchedRule].join('|'))unchanged++;
  }
  save(); render();
  const el=$('#ruleSummary');if(showSummary&&el)el.textContent=`Rules applied: ${matched} auto-classified · ${manual} manual overrides preserved · ${uncat} uncategorised · ${unchanged} unchanged.`;
}
if($('#applyRules'))$('#applyRules').onclick=()=>runRules(true);
// Manual category/behaviour edits are authoritative and protected from Apply rules.
document.body.addEventListener('change',e=>{
  if(!e.target.classList.contains('catpick')&&!e.target.classList.contains('behpick'))return;
  const t=S.tx.find(x=>x.id===decodeURIComponent(e.target.dataset.id));if(!t)return;
  if(e.target.classList.contains('catpick'))t.category=e.target.value;else t.behaviour=e.target.value;
  t.manualOverride=true;t.classificationSource='manual';t.matchedRule='';save();render();
},true);
// Replace rule/merchant submit behavior after older handlers: classify all non-manual transactions.
$('#ruleForm').onsubmit=e=>{e.preventDefault();S.rules.push({id:Date.now(),text:$('#ruleText').value.trim(),cat:$('#ruleCat').value,behaviour:$('#ruleBehaviour').value});$('#ruleText').value='';save();renderRules();runRules(true)};
$('#merchantForm').onsubmit=e=>{e.preventDefault();S.merchantRules.push({text:$('#merchantText').value.trim(),name:$('#merchantName').value.trim()});e.target.reset();save();renderMerchantRules();runRules(true)};
// Newly imported rows always receive normalization + rules and record provenance.
const normalizeBefore325=normalizeRows;normalizeRows=function(rows,map,source){return normalizeBefore325(rows,map,source).map(t=>{t.manualOverride=false;return applyAutoClassification(t,{force:true})})};

// ---- FlowBudget v3.2.6: learn categorisation rules from manual review ----
let reviewUncategorisedOnly=false;
function proposedRuleKey(t){
  let m=String(t.merchant||'').trim();
  if(m && m!==t.desc) return m;
  // Conservative cleanup for raw descriptions: remove long IDs/numbers, punctuation noise and location tails.
  let x=String(t.desc||'').toUpperCase().replace(/\b[A-Z0-9-]{8,}\b/g,' ').replace(/[^A-Z0-9 &'/-]+/g,' ').replace(/\s+/g,' ').trim();
  let words=x.split(' ').filter(Boolean).filter(w=>!/^\d+$/.test(w));
  return words.slice(0,3).join(' ')||String(t.desc||'').trim();
}
function ensureCategory(cat){if(cat&&!S.cats.includes(cat))S.cats.push(cat)}
function learnRuleFromTransaction(t){
  const key=proposedRuleKey(t); if(!key)return false;
  ensureCategory(t.category);
  const existing=(S.rules||[]).find(r=>String(r.text).toUpperCase()===key.toUpperCase());
  if(existing){existing.cat=t.category;existing.behaviour=t.behaviour||'regular'}
  else S.rules.push({id:Date.now()+Math.random(),text:key,cat:t.category,behaviour:t.behaviour||'regular',learned:true});
  t.learnedRule=key; return key;
}
function offerLearning(t){
  if(!t||t.reconciled||!t.category||t.category==='Other'||t.category==='Transfers')return;
  const key=proposedRuleKey(t);
  const behaviour=t.behaviour==='oneoff'?'One-off':'Regular / BAU';
  if(!key)return;
  if(confirm(`Learn from this classification?\n\nFuture transactions matching “${key}” will be classified as:\n${t.category} · ${behaviour}\n\nOK = Save rule\nCancel = This transaction only`)){
    learnRuleFromTransaction(t); save(); renderRules(); runRules(false);
  }
}
// Override transaction renderer so Review uncategorised is a first-class workflow.
renderTransactions=function(){
  let q=($('#search')?.value||'').toLowerCase(),ac=$('#acctFilter')?.value||'';
  let accounts=[...new Set(S.tx.map(t=>t.account))],old=$('#acctFilter').value;
  $('#acctFilter').innerHTML='<option value="">All accounts</option>'+accounts.map(a=>`<option>${a}</option>`).join('');$('#acctFilter').value=old;
  let rows=[...S.tx].filter(t=>(!q||(t.desc||'').toLowerCase().includes(q)||(t.merchant||'').toLowerCase().includes(q))&&(!ac||t.account===ac));
  if(reviewUncategorisedOnly)rows=rows.filter(t=>!t.reconciled&&!t.manualOverride&&(t.classificationSource==='unclassified'||!t.category||t.category==='Other'));
  $('#txbody').innerHTML=rows.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,500).map(txRow).join('')||`<tr><td colspan="8" class="muted">${reviewUncategorisedOnly?'No uncategorised transactions remain.':'No matching transactions.'}</td></tr>`;
};
if($('#reviewUncat'))$('#reviewUncat').onclick=()=>{reviewUncategorisedOnly=true;$('#reviewUncat').style.display='none';$('#showAllTx').style.display='inline-block';renderTransactions()};
if($('#showAllTx'))$('#showAllTx').onclick=()=>{reviewUncategorisedOnly=false;$('#showAllTx').style.display='none';$('#reviewUncat').style.display='inline-block';renderTransactions()};
// Capture manual edits after the v3.2.5 handler has stored them, then offer to learn a reusable rule.
document.body.addEventListener('change',e=>{
  if(!e.target.classList.contains('catpick')&&!e.target.classList.contains('behpick'))return;
  const t=S.tx.find(x=>x.id===decodeURIComponent(e.target.dataset.id)); if(!t)return;
  // Category changes are the natural point to learn. Behaviour-only edits remain transaction-specific until category is changed again.
  if(e.target.classList.contains('catpick')) setTimeout(()=>offerLearning(t),0);
},false);

// ---- YouBudget v3.3: statement balance, 7-day panel and accessible cash-flow charts ----
function detectClosingBalance(rows,map){
  const moneyVal=v=>{let x=String(v??'').replace(/[^0-9.()\-]/g,'');if(!x)return null;let neg=/\(/.test(x);x=x.replace(/[()]/g,'');let n=parseFloat(x);return Number.isFinite(n)?(neg?-n:n):null};
  // Prefer explicit statement metadata such as Closing Balance / Available Balance.
  for(let i=0;i<Math.min(rows.length,35);i++) for(let j=0;j<(rows[i]||[]).length;j++){
    let label=norm(rows[i][j]).toLowerCase();
    if(/closing balance|closing bal|available balance|account balance/.test(label)){
      for(let k=j+1;k<Math.min((rows[i]||[]).length,j+4);k++){let n=moneyVal(rows[i][k]);if(n!==null)return {value:n,method:'statement closing balance'};}
      if(i+1<rows.length){let n=moneyVal((rows[i+1]||[])[j]);if(n!==null)return {value:n,method:'statement closing balance'};}
    }
  }
  // Otherwise use the last valid running-balance column in the transaction table.
  let headers=(map.headers||[]).map(x=>norm(x).toLowerCase()),bi=headers.findIndex(x=>/^(balance|running balance|available balance)$/.test(x));
  if(bi>=0){for(let i=rows.length-1;i>map.header;i--){let n=moneyVal((rows[i]||[])[bi]);if(n!==null)return {value:n,method:'latest running balance'};}}
  return null;
}
function latestBankImport(){return (S.imports||[]).filter(x=>x.kind==='bank'&&Number.isFinite(x.closingBalance)).sort((a,b)=>(b.statementDate||b.when||'').localeCompare(a.statementDate||a.when||''))[0]||null}
function effectiveCashBalance(){let imp=latestBankImport();return S.mode==='detailed'&&imp?imp.closingBalance:(+S.startCash||0)}
function syncBalanceUI(){let imp=latestBankImport(),el=$('#startCash'),src=$('#balanceSource');if(!el)return;let derived=S.mode==='detailed'&&imp;if(derived){el.value=imp.closingBalance;el.disabled=true;src.textContent=`From ${imp.name}${imp.statementDate?' · '+new Date(imp.statementDate+'T12:00').toLocaleDateString():''} · ${imp.balanceMethod||'closing balance'}`;}else{el.disabled=false;el.value=+S.startCash||0;src.textContent=S.mode==='detailed'?'No closing balance detected in imported current-account statements · using manual balance':'Manual balance · Advanced can source this from the latest current-account statement';}}
function renderUpcoming7(){let now=new Date(),end=new Date(now);end.setDate(end.getDate()+7);let x=planInstancesRange(now,end);let el=$('#upcoming7');if(!el)return;el.innerHTML=x.length?`<table class="flow7-table"><thead><tr><th>Date</th><th>Flow</th><th>Amount</th></tr></thead><tbody>${x.map(f=>`<tr><td>${f.when.toLocaleDateString('en-SG',{day:'2-digit',month:'short'})}</td><td>${f.name}</td><td class="amount ${f.type}">${f.type==='in'?'+':'−'}${money(f.amount)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No planned flows in the next 7 days.</p>'}
function chartMonths(){let a=[];for(let k=5;k>=0;k--){let d=new Date();d.setDate(1);d.setMonth(d.getMonth()-k);a.push(isoLocal(d).slice(0,7))}return a}
function monthMetrics(m){let a=S.tx.filter(t=>t.date.startsWith(m));if(S.mode==='basic'){let y=+m.slice(0,4),mo=+m.slice(5)-1,p=planInstancesRange(new Date(y,mo,1),new Date(y,mo+1,0,23,59,59));let inn=p.filter(x=>x.type==='in').reduce((s,x)=>s+x.amount,0),out=p.filter(x=>x.type==='out').reduce((s,x)=>s+x.amount,0);return [inn,out,inn-out]}let inn=a.filter(t=>t.accountType==='bank'&&t.amount>0&&!t.reconciled).reduce((s,t)=>s+t.amount,0),out=a.reduce((s,t)=>s+spendingAmount(t),0);return [inn,out,inn-out]}
function niceMax(v){if(v<=0)return 1000;let p=10**Math.floor(Math.log10(v)),n=Math.ceil(v/p*2)/2;return n*p}
function fmtAxis(n){return Math.abs(n)>=1000?'$'+(n/1000).toFixed(n%1000?1:0)+'k':'$'+Math.round(n)}
function tooltipSetup(){let t=document.querySelector('.chart-tip');if(!t){t=document.createElement('div');t.className='chart-tip';document.body.appendChild(t)}document.querySelectorAll('[data-tip]').forEach(e=>{e.onmousemove=ev=>{t.textContent=e.dataset.tip;t.style.display='block';t.style.left=(ev.clientX+12)+'px';t.style.top=(ev.clientY+12)+'px'};e.onmouseleave=()=>t.style.display='none'})}
function svgCashChart(el,months,vals){let W=760,H=220,L=58,R=12,T=12,B=30,max=niceMax(Math.max(1,...vals.flatMap(v=>v.slice(0,2)))),ph=H-T-B,pw=W-L-R,step=pw/months.length,bw=Math.min(22,step*.25),s=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`;for(let i=0;i<=4;i++){let v=max*i/4,y=T+ph-(v/max*ph);s+=`<line class="gridline" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="axis-label" x="${L-7}" y="${y+3}" text-anchor="end">${fmtAxis(v)}</text>`}months.forEach((m,i)=>{let x=L+step*(i+.5),[inn,out]=vals[i],hi=inn/max*ph,ho=out/max*ph;s+=`<rect class="bar-in" data-tip="Inflows · ${money(inn)}" x="${x-bw-2}" y="${T+ph-hi}" width="${bw}" height="${Math.max(1,hi)}" rx="2"/><rect class="bar-out" data-tip="Outflows · ${money(out)}" x="${x+2}" y="${T+ph-ho}" width="${bw}" height="${Math.max(1,ho)}" rx="2"/><text class="month-label" x="${x}" y="${H-8}" text-anchor="middle">${new Date(m+'-02').toLocaleString('en',{month:'short'})}</text>`});el.innerHTML=s+'</svg>'}
function svgNetChart(el,months,vals){let W=760,H=220,L=58,R=12,T=12,B=30,nets=vals.map(v=>v[2]),mx=niceMax(Math.max(1,...nets.map(Math.abs))),ph=H-T-B,pw=W-L-R,step=pw/months.length,bw=Math.min(34,step*.45),zero=T+ph/2,s=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`;[-mx,-mx/2,0,mx/2,mx].forEach(v=>{let y=zero-v/mx*(ph/2);s+=`<line class="gridline" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="axis-label" x="${L-7}" y="${y+3}" text-anchor="end">${fmtAxis(v)}</text>`});months.forEach((m,i)=>{let x=L+step*(i+.5),v=nets[i],h=Math.abs(v)/mx*(ph/2),y=v>=0?zero-h:zero;s+=`<rect class="${v>=0?'bar-pos':'bar-neg'}" data-tip="Net flow · ${money(v)}" x="${x-bw/2}" y="${y}" width="${bw}" height="${Math.max(1,h)}" rx="2"/><text class="month-label" x="${x}" y="${H-8}" text-anchor="middle">${new Date(m+'-02').toLocaleString('en',{month:'short'})}</text>`});el.innerHTML=s+'</svg>'}
renderChart=function(){let months=chartMonths(),vals=months.map(monthMetrics);svgCashChart($('#chart'),months,vals);svgNetChart($('#netChart'),months,vals);tooltipSetup()};
renderCashRisk=function(){let start=effectiveCashBalance(),buf=+S.minBuffer||0,flows=monthlyInstances(90),bal=start,low={bal,date:new Date()};for(let f of flows){bal+=f.type==='in'?f.amount:-f.amount;if(bal<low.bal)low={bal,date:f.when}}let box=$('#cashWarning');if(box)box.innerHTML=low.bal<buf?`<div class="alert"><b>Cash buffer warning:</b> projected balance falls to ${money(low.bal)} on ${low.date.toLocaleDateString()}, below your ${money(buf)} limit.</div>`:`<div class="muted">Lowest projected balance over 90 days: <b>${money(low.bal)}</b> (${low.date.toLocaleDateString()}).</div>`};
// Capture a closing balance for every newly confirmed bank statement.
const mapSubmitBefore33=$('#mapForm').onsubmit;$('#mapForm').onsubmit=function(e){if(pendingMap){let p=pendingMap,bal=detectClosingBalance(p.rows,p.m),dates=p.rows.slice((p.m.header||0)+1).map(r=>parseDate(r[p.m.date])).filter(Boolean).sort((a,b)=>b-a);p._ybBalance=bal;p._ybStatementDate=dates[0]?isoLocal(dates[0]):null}mapSubmitBefore33.call(this,e);setTimeout(()=>{let imp=S.imports&&S.imports[0];if(imp&&pendingMap===null&&window._ybLast!==imp.id){window._ybLast=imp.id;let bankTx=S.tx.filter(t=>t.importId===imp.id&&t.accountType==='bank').sort((a,b)=>b.date.localeCompare(a.date));if(bankTx.length)imp.statementDate=bankTx[0].date;save();syncBalanceUI();renderCashRisk();}},0)};
// Enrich imports after map submit using retained row context by wrapping the normalizer path.
const normalizeBefore33=normalizeRows;normalizeRows=function(rows,map,source){let tx=normalizeBefore33(rows,map,source);let b=detectClosingBalance(rows,map);if(b)tx.forEach(t=>{t._statementClosingBalance=b.value;t._balanceMethod=b.method});return tx};
const renderBefore33=render;render=function(){// promote transaction-level statement balance metadata into import batch
  for(const imp of S.imports||[]){if(imp.kind!=='bank'||Number.isFinite(imp.closingBalance))continue;let tx=S.tx.filter(t=>t.importId===imp.id);let b=tx.find(t=>Number.isFinite(t._statementClosingBalance));if(b){imp.closingBalance=b._statementClosingBalance;imp.balanceMethod=b._balanceMethod;imp.statementDate=[...tx].sort((a,b)=>b.date.localeCompare(a.date))[0]?.date||imp.statementDate}}
  renderBefore33();syncBalanceUI();renderUpcoming7();renderChart();renderCashRisk();save();};
// Re-render now that v3.3 overrides are installed.
render();

// ---- YouBudget v4: forecast, scenarios, plan-to-actual, recurring suggestions & demo ----
S.scenarios=S.scenarios||[]; S.forecastHorizon=S.forecastHorizon||90;
const ybToday=()=>{let d=new Date();d.setHours(12,0,0,0);return d};
function ybPlanBetween(start,end){
  if(typeof planInstancesRange==='function') return planInstancesRange(start,end);
  return (typeof monthlyInstances==='function'?monthlyInstances(Math.ceil((end-start)/86400000)):[]).filter(x=>x.when>=start&&x.when<=end);
}
function scenarioBetween(start,end){return (S.scenarios||[]).map(x=>({...x,when:new Date(x.date+'T12:00')})).filter(x=>x.when>=start&&x.when<=end)}
function forecastSeries(days=S.forecastHorizon,withScenarios=true){
  let start=ybToday(),end=new Date(start);end.setDate(end.getDate()+days);
  let events=ybPlanBetween(start,end).map(x=>({...x,delta:x.type==='in'?+x.amount:-x.amount}));
  if(withScenarios)events.push(...scenarioBetween(start,end).map(x=>({...x,delta:x.type==='in'?+x.amount:-x.amount,scenario:true})));
  events.sort((a,b)=>a.when-b.when);
  let by={};events.forEach(e=>{let k=isoLocal(e.when);by[k]=(by[k]||0)+e.delta});
  let bal=effectiveCashBalance(),out=[],low={balance:bal,date:new Date(start)};
  for(let i=0;i<=days;i++){let d=new Date(start);d.setDate(d.getDate()+i);bal+=by[isoLocal(d)]||0;out.push({date:d,balance:bal});if(bal<low.balance)low={balance:bal,date:new Date(d)}}
  return {points:out,low,endBalance:bal};
}
function safeToSpend(days=30){let f=forecastSeries(days,false),buf=+S.minBuffer||0;return Math.max(0,f.low.balance-buf)}
function renderForecastRibbon(){
  let f=forecastSeries(30,false),buf=+S.minBuffer||0,el=$('#forecastRibbon');if(!el)return;
  let breach=f.points.find(x=>x.balance<buf),next=ybPlanBetween(ybToday(),new Date(Date.now()+31*86400000)).find(x=>x.type==='in');
  el.innerHTML=`<div><small>Safe to spend · 30d</small><b>${money(safeToSpend(30))}</b></div><div><small>Lowest next 30d</small><b>${money(f.low.balance)}</b></div><div><small>Cash buffer</small><b>${breach?'⚠ Breach '+breach.date.toLocaleDateString('en-SG',{day:'numeric',month:'short'}):'✓ Protected'}</b></div><div><small>Next planned inflow</small><b>${next?next.when.toLocaleDateString('en-SG',{day:'numeric',month:'short'}):'—'}</b></div>`;
}
function renderForecastChart(){
  let el=$('#forecastChart');if(!el)return;let base=forecastSeries(S.forecastHorizon,false),sc=forecastSeries(S.forecastHorizon,true),W=820,H=300,L=62,R=18,T=18,B=30,all=[...base.points,...sc.points].map(x=>x.balance).concat([+S.minBuffer||0]),mn=Math.min(...all,0),mx=Math.max(...all,1),range=mx-mn||1;
  const X=i=>L+i/(base.points.length-1)*(W-L-R),Y=v=>T+(mx-v)/range*(H-T-B),path=a=>a.map((x,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(x.balance).toFixed(1)).join(' ');
  let grid='';for(let i=0;i<=4;i++){let v=mn+(mx-mn)*i/4,y=Y(v);grid+=`<line class="gridline" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="axis-label" x="${L-8}" y="${y+3}" text-anchor="end">${fmtAxis(v)}</text>`}
  let buf=+S.minBuffer||0,breach=sc.points.findIndex(x=>x.balance<buf),dot=breach>=0?`<circle class="danger-dot" cx="${X(breach)}" cy="${Y(sc.points[breach].balance)}" r="5"/>`:'';
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}">${grid}<path class="forecast-line" d="${path(base.points)}"/>${S.scenarios.length?`<path class="scenario-line" d="${path(sc.points)}"/>`:''}<line class="buffer-line" x1="${L}" x2="${W-R}" y1="${Y(buf)}" y2="${Y(buf)}"/>${dot}</svg>`;
  $('#forecastStatus').textContent=`${S.forecastHorizon} days · buffer ${money(buf)}${S.scenarios.length?' · scenario overlay shown':''}`;
}
function planActualMatches(){
 let plans=ybPlanBetween(new Date(Date.now()-120*86400000),ybToday()),used=new Set(),out=[];
 for(let p of plans){let target=p.type==='in'?p.amount:-p.amount,best=null,score=0;for(let t of S.tx){if(used.has(t.id)||!t.date)continue;let dd=Math.abs((new Date(t.date+'T12:00')-p.when)/86400000),amt=Math.abs((t.amount||0)-target);if(dd<=5&&amt<=Math.max(2,p.amount*.03)){let s=1-dd/10-amt/Math.max(10,p.amount)/2;if(s>score){score=s;best=t}}}if(best){used.add(best.id);out.push({p,t:best,score})}}
 return out.sort((a,b)=>b.p.when-a.p.when).slice(0,20);
}
function renderPlanActual(){
 let el=$('#planActual');if(!el)return;let m=planActualMatches();el.innerHTML=m.length?`<div class="match"><b>Date</b><b>Planned</b><b>Actual</b><b>Match</b></div>`+m.map(x=>`<div class="match"><span>${x.p.when.toLocaleDateString('en-SG',{day:'2-digit',month:'short'})}</span><span>${x.p.name} · ${money(x.p.amount)}</span><span>${x.t.merchant||x.t.desc} · ${money(Math.abs(x.t.amount))}</span><span class="confidence">${Math.round(x.score*100)}% likely</span></div>`).join(''):'<p class="muted">Import statements to match actual transactions against your plan.</p>';
}
function recurringCandidates(){
 let groups={};for(let t of S.tx){if(t.reconciled||!t.date||t.amount>=0)continue;let key=(t.merchant||t.desc||'').trim();if(!key)continue;(groups[key]??=[]).push(t)}
 return Object.entries(groups).map(([name,a])=>{a.sort((x,y)=>x.date.localeCompare(y.date));if(a.length<2)return null;let am=a.map(x=>Math.abs(x.amount)),avg=am.reduce((s,x)=>s+x,0)/am.length,spread=Math.max(...am)-Math.min(...am);let ds=[];for(let i=1;i<a.length;i++)ds.push((new Date(a[i].date)-new Date(a[i-1].date))/86400000);let gap=ds.reduce((s,x)=>s+x,0)/(ds.length||1);let freq=gap>330?'annual':gap>150?'semiannual':gap>70?'quarterly':gap>20?'monthly':gap>5?'weekly':null;if(!freq||spread>avg*.25)return null;return {name,amount:avg,frequency:freq,last:a[a.length-1].date,count:a.length}}).filter(Boolean).filter(c=>!(S.dismissedRecurring||[]).includes(c.name)).filter(c=>!S.monthly?.some(f=>(f.name||'').toLowerCase().includes(c.name.toLowerCase().slice(0,8)))).slice(0,8);
}
function renderRecurringSuggestions(){
 let el=$('#recurringSuggestions');if(!el)return;let c=recurringCandidates();el.innerHTML=c.length?c.map((x,i)=>`<div class="suggestion"><b>${x.name}</b><div class="muted">${x.count} similar payments · ~${money(x.amount)} · ${x.frequency}</div><div class="actions"><button data-addrec="${i}" class="primary">Add to plan</button><button data-dismissrec="${encodeURIComponent(x.name)}">Dismiss</button></div></div>`).join(''):'<p class="muted">No strong recurring patterns detected yet.</p>';el._candidates=c;
}
function renderScenarios(){let el=$('#scenarioList');if(!el)return;el.innerHTML=(S.scenarios||[]).map(x=>`<div class="row"><span><b>${x.name}</b><div class="muted">${new Date(x.date+'T12:00').toLocaleDateString()}</div></span><span class="amount ${x.type}">${x.type==='in'?'+':'−'}${money(x.amount)} <button data-delscenario="${x.id}">×</button></span></div>`).join('')||'<p class="muted">No active scenarios. Add one above.</p>'}
function renderForecastPage(){renderForecastRibbon();renderForecastChart();renderPlanActual();renderRecurringSuggestions();renderScenarios()}
function nextAnchor(last,freq){let d=new Date(last+'T12:00');if(freq==='weekly')d.setDate(d.getDate()+7);else if(freq==='monthly')d.setMonth(d.getMonth()+1);else if(freq==='quarterly')d.setMonth(d.getMonth()+3);else if(freq==='semiannual')d.setMonth(d.getMonth()+6);else d.setFullYear(d.getFullYear()+1);return isoLocal(d)}
function loadDemo(){
 if(!confirm('Load a sample household plan to explore YouBudget? This replaces the data currently stored in this browser.'))return;
 let now=ybToday(),dateFor=(day,off=0)=>{let d=new Date(now.getFullYear(),now.getMonth()+off,Math.min(day,28),12);if(d<now)d.setMonth(d.getMonth()+1);return isoLocal(d)};
 S={mode:'basic',tx:[],imports:[],cats:[...defaultCats],rules:defaultRules.map((x,i)=>({id:i+1,text:x[0],cat:x[1]})),flows:[],mappings:{},monthly:[
 {id:'d1',anchorDate:dateFor(13),name:'Salary',type:'in',amount:26434,frequency:'monthly'},
 {id:'d2',anchorDate:dateFor(27),name:'Mortgage',type:'out',amount:12000,frequency:'monthly'},
 {id:'d3',anchorDate:dateFor(24),name:'American Express',type:'out',amount:5200,frequency:'monthly'},
 {id:'d4',anchorDate:dateFor(6),name:'Income tax',type:'out',amount:2600,frequency:'monthly'},
 {id:'d5',anchorDate:dateFor(10),name:'Household help',type:'out',amount:686,frequency:'monthly'},
 {id:'d6',anchorDate:dateFor(27),name:'Car park',type:'out',amount:414,frequency:'monthly'}],startCash:31450,minBuffer:5000,merchantRules:[],scenarios:[],forecastHorizon:90};
 sessionStorage.setItem('youbudget.demoEnter','1');save();location.reload();
}
$('#enterApp').onclick=$('#enterApp2').onclick=()=>{localStorage.setItem('youbudget.landingSeen','1');$('#landing').classList.add('hidden');renderForecastPage()};
$('#tryDemo').onclick=$('#tryDemo2').onclick=loadDemo;
// Landing page is the default on every visit; entering the planner is explicit.
$('#scenarioForm').onsubmit=e=>{e.preventDefault();S.scenarios.push({id:'s'+Date.now(),name:$('#scenarioName').value.trim(),amount:+$('#scenarioAmount').value,type:$('#scenarioType').value,date:$('#scenarioDate').value});save();e.target.reset();renderForecastPage()};
document.body.addEventListener('click',e=>{
 if(e.target.dataset.horizon){S.forecastHorizon=+e.target.dataset.horizon;$$('[data-horizon]').forEach(b=>b.classList.toggle('active',+b.dataset.horizon===S.forecastHorizon));save();renderForecastPage()}
 if(e.target.dataset.delscenario){S.scenarios=S.scenarios.filter(x=>x.id!==e.target.dataset.delscenario);save();renderForecastPage()}
 if(e.target.dataset.addrec!==undefined){let c=$('#recurringSuggestions')._candidates?.[+e.target.dataset.addrec];if(c){S.monthly=S.monthly||[];S.monthly.push({id:'r'+Date.now(),anchorDate:nextAnchor(c.last,c.frequency),name:c.name,type:'out',amount:Math.round(c.amount*100)/100,frequency:c.frequency});save();render();renderForecastPage()}}
 if(e.target.dataset.dismissrec){S.dismissedRecurring=S.dismissedRecurring||[];S.dismissedRecurring.push(decodeURIComponent(e.target.dataset.dismissrec));save();renderRecurringSuggestions()}
});
const renderV4Base=render;render=function(){renderV4Base();renderForecastPage()};
renderForecastPage();

// v4.0.1: logo returns home without changing user data.
if($('#homeLogo')) $('#homeLogo').onclick=()=>{ $('#landing').classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); };


// Migrate any legacy Calendar planned flows into the unified plan model.
if((S.flows||[]).length){
  for(const f of S.flows){
    if(!(S.monthly||[]).some(x=>x.name===f.name&&x.anchorDate===f.date&&Math.abs((+x.amount||0)-(+f.amount||0))<.001)){
      S.monthly.push({id:'legacy'+String(f.id||Date.now()),anchorDate:f.date,name:f.name,type:f.type,amount:+f.amount||0,frequency:f.repeat==='monthly'?'monthly':'once'});
    }
  }
  S.flows=[];save();
}

// ---- YouBudget v4.2: unified planned-flow editing, calendar propagation & currency ----
function openPlannedFlowDialog(flow=null){
  $('#monthlyEditId').value=flow?.id||'';
  $('#monthlyDialogTitle').textContent=flow?'Edit planned flow':'Add planned flow';
  $('#monthlyName').value=flow?.name||'';
  $('#monthlyDate').value=flow?.anchorDate||isoLocal(new Date());
  $('#monthlyFrequency').value=flow?.frequency||'monthly';
  $('#monthlyType').value=flow?.type||'out';
  $('#monthlyAmount').value=flow?.amount??'';
  $('#monthlyDialog').showModal();
}
$('#addMonthly').onclick=()=>openPlannedFlowDialog();
$('#addFlow').onclick=()=>openPlannedFlowDialog();
$('#monthlyCancel').onclick=()=>{$('#monthlyDialog').close();$('#monthlyEditId').value=''};
$('#monthlyForm').onsubmit=e=>{
  e.preventDefault();
  let id=$('#monthlyEditId').value;
  let flow={id:id||('m'+Date.now()),anchorDate:$('#monthlyDate').value,name:$('#monthlyName').value.trim(),frequency:$('#monthlyFrequency').value,type:$('#monthlyType').value,amount:+$('#monthlyAmount').value};
  if(id){let i=S.monthly.findIndex(x=>String(x.id)===String(id));if(i>=0)S.monthly[i]=flow;else S.monthly.push(flow)}
  else S.monthly.push(flow);
  save();$('#monthlyDialog').close();e.target.reset();$('#monthlyEditId').value='';render();
};
document.body.addEventListener('click',e=>{
  let btn=e.target.closest('[data-editmonthly]');if(btn){let f=S.monthly.find(x=>String(x.id)===String(btn.dataset.editmonthly));if(f)openPlannedFlowDialog(f)}
});
if($('#currencySelect')){
  $('#currencySelect').value=S.currency||'USD';
  $('#currencySelect').onchange=e=>{S.currency=e.target.value;save();render();renderForecastPage()};
}

const renderV42Base=render;
render=function(){
  renderV42Base();
  renderMonthly();
  renderCalendar();
  renderUpcoming7();
  renderForecastRibbon();
  renderForecastPage();
  if($('#currencySelect'))$('#currencySelect').value=S.currency||'USD';
};
render();
// YouBudget v4.3 — insights, chart ranges and advanced scenario multipliers
S.chartMonths=S.chartMonths||6;S.multipliers=S.multipliers||[];
function monthsBack(n){let d=new Date();d.setDate(1);d.setMonth(d.getMonth()-n+1);return isoLocal(d).slice(0,7)}
function insightTransactions(n){let cutoff=monthsBack(n);return S.tx.filter(t=>t.date>=cutoff&&!t.reconciled&&spendingAmount(t)>0)}
function renderInsights(){let n=yb411History(+($('#insightsWindow')?.value||6)).months,a=insightTransactions(n),total=a.reduce((s,t)=>s+spendingAmount(t),0),monthly=total/n,byCat={},byMerchant={};a.forEach(t=>{let v=spendingAmount(t),cat=t.category||'Other',mer=t.merchant||t.desc||'Unknown';byCat[cat]=(byCat[cat]||0)+v;let key=mer;let x=byMerchant[key]||(byMerchant[key]={sum:0,count:0});x.sum+=v;x.count++});let entries=Object.entries(byCat).sort((a,b)=>b[1]-a[1]),merchants=Object.entries(byMerchant).sort((a,b)=>b[1].sum-a[1].sum);$('#insightSummary').innerHTML=`<div><small>Outflows · ${n} months</small><b>${money(total)}</b></div><div><small>Average monthly outflow</small><b>${money(monthly)}</b></div><div><small>Transactions analysed</small><b>${a.length}</b></div><div><small>Largest category</small><b>${entries[0]?.[0]||'—'}</b></div>`;
let prevStart=monthsBack(n*2),prevEnd=monthsBack(n);let prior=S.tx.filter(t=>t.date>=prevStart&&t.date<prevEnd&&!t.reconciled&&spendingAmount(t)>0),priorCat={};prior.forEach(t=>priorCat[t.category||'Other']=(priorCat[t.category||'Other']||0)+spendingAmount(t));$('#insightTrends').innerHTML=entries.length?`<table><thead><tr><th>Category</th><th>Monthly average</th><th>Change vs prior ${n} months</th></tr></thead><tbody>${entries.map(([cat,v])=>{let old=(priorCat[cat]||0)/n,delta=v/n-old,pct=old?delta/old*100:null;return `<tr><td>${cat}</td><td>${money(v/n)}</td><td class="${delta>0?'amount out':'amount in'}">${pct===null?'No baseline':`${delta>0?'+':''}${pct.toFixed(0)}% (${money(delta)}/mo)`}</td></tr>`}).join('')}</tbody></table>`:'<p class="muted">Import transactions to see category trends and deviations.</p>';
$('#merchantInsights').innerHTML=merchants.length?`<table><thead><tr><th>Merchant</th><th>Transactions</th><th>Monthly average</th></tr></thead><tbody>${merchants.slice(0,15).map(([name,v])=>`<tr><td>${name}</td><td>${v.count}</td><td>${money(v.sum/n)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No merchant spending yet.</p>';
let dining=entries.find(([cat])=>/dining|restaurant|food/i.test(cat)),target=dining?.[1]/n||0,deficit=Math.max(0,-(monthMetrics(isoLocal(new Date()).slice(0,7))[2]||0)),cut=Math.min(target*.2,deficit||target*.2),best=merchants.find(([name,v])=>a.some(t=>(t.merchant||t.desc)===name&&/dining|restaurant|food/i.test(t.category||'')));let suggestion=dining&&cut>0?`<div class="suggestion"><b>Reduce dining by ${money(cut)}/month (${Math.round(cut/target*100)}%)</b><p class="muted">That could ${deficit?'reduce the current monthly deficit':'increase your monthly surplus'} by ${money(cut)}. ${best?`You spent about ${money(best[1].sum/n)}/month at ${best[0]}. Consider limiting visits to ${Math.max(1,Math.floor(best[1].count/n/4*.8))} per week, where practical.`:''}</p></div>`:'';let high=entries.filter(([cat,v])=>v/n>monthly*.2&&!/dining|restaurant|food/i.test(cat)).slice(0,2).map(([cat,v])=>`<div class="suggestion"><b>${cat}: test a 10% reduction</b><p class="muted">Potential saving: ${money(v/n*.1)} per month. Review the largest transactions before setting a target.</p></div>`).join('');$('#savingIdeas').innerHTML=suggestion+high||'<p class="muted">Add transactions to generate evidence-based suggestions. Savings are illustrative, not guaranteed.</p>';
}
$('#insightsWindow').onchange=renderInsights;
const chartMonthsV43=chartMonths;chartMonths=function(){let a=[];for(let k=S.chartMonths-1;k>=0;k--){let d=new Date();d.setDate(1);d.setMonth(d.getMonth()-k);a.push(isoLocal(d).slice(0,7))}return a};
document.body.addEventListener('click',e=>{if(e.target.dataset.chartmonths){S.chartMonths=+e.target.dataset.chartmonths;save();renderChart();$$('[data-chartmonths]').forEach(b=>b.classList.toggle('active',+b.dataset.chartmonths===S.chartMonths))}});
function updateForecastTicks(){let el=$('#forecastTicks');if(!el)return;let n=S.forecastHorizon,now=new Date(),ticks=[];for(let k=0;k<=4;k++){let d=new Date(now);d.setDate(d.getDate()+Math.round(n*k/4));ticks.push(`<span>${d.toLocaleDateString('en-SG',{day:'numeric',month:'short',year:n>180?'2-digit':undefined})}</span>`)}el.innerHTML=ticks.join('')}
function multiplierOptions(){let scope=$('#multiplierScope').value,values=scope==='category'?[...new Set(S.tx.map(t=>t.category||'Other'))]:[...new Set(S.tx.map(t=>t.merchant||t.desc).filter(Boolean))];$('#multiplierTarget').innerHTML=values.sort().map(x=>`<option value="${x.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${x}</option>`).join('')}
function renderMultipliers(){multiplierOptions();$('#multiplierRules').innerHTML=S.multipliers.map((r,i)=>`<div class="row"><span>${r.scope}: <b>${r.target}</b> × ${r.value.toFixed(2)}</span><button data-delmult="${i}">×</button></div>`).join('')||'<p class="muted">No multipliers set.</p>';let tx=insightTransactions(6),base=tx.reduce((s,t)=>s+spendingAmount(t),0)/6,impact=tx.reduce((s,t)=>{let m=S.multipliers.find(r=>r.scope==='merchant'&&r.target===(t.merchant||t.desc))||S.multipliers.find(r=>r.scope==='category'&&r.target===(t.category||'Other'));return s+spendingAmount(t)*(m?m.value:1)},0)/6;$('#multiplierImpact').innerHTML=`<p><b>Estimated monthly imported spending:</b> ${money(base)} → <b>${money(impact)}</b> (${money(impact-base)} change)</p><p class="muted">This is a sensitivity estimate based on the last six months of imported spending; it does not change the cash plan or actual transactions.</p>`}
$('#multiplierScope').onchange=multiplierOptions;$('#addMultiplier').onclick=()=>{let target=$('#multiplierTarget').value,value=+$('#multiplierValue').value,scope=$('#multiplierScope').value;if(!target||!Number.isFinite(value)||value<0)return;S.multipliers=S.multipliers.filter(x=>!(x.scope===scope&&x.target===target));S.multipliers.push({scope,target,value});save();renderMultipliers()};document.body.addEventListener('click',e=>{if(e.target.dataset.delmult!==undefined){S.multipliers.splice(+e.target.dataset.delmult,1);save();renderMultipliers()}});
const render43=render;render=function(){render43();renderInsights();renderMultipliers();updateForecastTicks();$$('[data-chartmonths]').forEach(b=>b.classList.toggle('active',+b.dataset.chartmonths===S.chartMonths));$$('[data-horizon]').forEach(b=>b.classList.toggle('active',+b.dataset.horizon===S.forecastHorizon));};
render();

// v4.4 marketing pages, sharing and category management

$('#shareYouBudget').onclick=()=>{
 const url=location.protocol==='http:'||location.protocol==='https:'?new URL('index.html',location.href).href:'';
 const subject='Take a look at YouBudget';
 const body='Hi!\n\nI thought you might like YouBudget, a simple tool to plan cash flow, anticipate upcoming bills and explore ways to improve spending.\n\n'+(url||'[Add the public YouBudget homepage link here]')+'\n\nHope you find it useful!';
 location.href='mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
};
document.body.addEventListener('click',e=>{
 const btn=e.target.closest('[data-delcat]');if(!btn)return;
 const index=Number(btn.dataset.delcat),name=S.cats[index];if(!name)return;
 const used=(S.tx||[]).some(t=>t.category===name)||(S.rules||[]).some(r=>r.cat===name);
 if(!confirm('Delete category "'+name+'"?'+(used?' Transactions and rules using it will be moved to Other.':'')))return;
 if(name==='Other'){alert('The Other category is required as a fallback.');return;}
 S.cats.splice(index,1);S.tx.forEach(t=>{if(t.category===name)t.category='Other'});S.rules.forEach(r=>{if(r.cat===name)r.cat='Other'});save();render();
});

// Only a freshly selected demo may bypass the home page after its reload.
if(sessionStorage.getItem('youbudget.demoEnter')==='1'){sessionStorage.removeItem('youbudget.demoEnter');$('#landing').classList.add('hidden');}


// ===== YouBudget v4.8: matched internal transfers, full pagination,
// imported-month dashboard, and inferred recurring cash flows =====
S.yb48 = S.yb48 || {pageSize:50, page:1, minRecurring:100, minOccurrences:3, dayTolerance:5, showInferred:true};
const yb48 = S.yb48;
const yb48Esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yb48Days = (a,b) => Math.abs((new Date(a+'T12:00:00')-new Date(b+'T12:00:00'))/86400000);
const yb48InternalHint = t => /(?:credit\s*card|card\s*(?:payment|settlement|bill)|visa|mastercard|amex|american express|autopay|auto\s*debit|payment\s*(?:received|thank)|transfer|trf|own\s*account)/i.test((t.desc||'')+' '+(t.merchant||''));
function yb48Reconcile(){
  // Never overwrite manually assigned categories; only annotate a proven pair.
  for(const t of S.tx){t.reconciled=false;t.reconcileId=null;}
  const sorted=[...S.tx].filter(t=>Number.isFinite(+t.amount)).sort((a,b)=>a.date.localeCompare(b.date));
  const used=new Set(); let pairs=0;
  for(const a of sorted){
    if(used.has(a.id)||a.amount>=0)continue;
    const candidates=sorted.filter(b=>b.id!==a.id&&!used.has(b.id)&&b.amount>0
      &&b.account!==a.account&&Math.abs(a.amount+b.amount)<=0.02
      &&yb48Days(a.date,b.date)<=3
      &&(a.accountType==='card'||b.accountType==='card'||(yb48InternalHint(a)&&yb48InternalHint(b))));
    // Require payment/transfer evidence for bank-card matches to avoid matching purchases/refunds.
    const eligible=candidates.filter(b=>yb48InternalHint(a)||yb48InternalHint(b)||a.type==='card_payment'||b.type==='card_payment');
    if(eligible.length!==1)continue; // ambiguous amount/date -> manual review
    const b=eligible[0];
    const competing=sorted.filter(c=>c.id!==a.id&&c.id!==b&&!used.has(c.id)&&c.amount<0
      &&c.account!==b.account&&Math.abs(c.amount+b.amount)<=0.02&&yb48Days(c.date,b.date)<=3
      &&(yb48InternalHint(c)||c.type==='card_payment'));
    if(competing.length)continue;
    const id='yb48_'+pairs+'_'+a.id.slice(0,12);
    a.reconciled=b.reconciled=true;a.reconcileId=b.reconcileId=id;
    used.add(a.id);used.add(b.id);pairs++;
  }
  return pairs;
}
reconcileAccounts=function(){const n=yb48Reconcile();save();return n;};
const yb48SpendingBefore=spendingAmount;
spendingAmount=function(t){
  if(t.reconciled||t.category==='Transfers'&&yb48InternalHint(t))return 0;
  // Credit card repayments are internal financing, not consumption.
  if(t.type==='card_payment')return 0;
  // Count card purchases and bank expenditure exactly once, in either edition.
  if(t.accountType==='card')return t.amount<0?-t.amount:0;
  if(t.accountType==='bank'&&t.amount<0){
    if(yb48InternalHint(t)&&/(?:card|visa|mastercard|amex|american express|autopay)/i.test(t.desc||''))return 0;
    return -t.amount;
  }
  return 0;
};
function yb48ActualMonth(){
  const dates=S.tx.map(t=>t.date).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if(!dates.length)return null;
  const now=isoLocal(new Date()).slice(0,7), current=S.tx.some(t=>t.date.startsWith(now));
  return current?now:dates[dates.length-1].slice(0,7);
}
function yb48ActualMetrics(ym){
  const rows=S.tx.filter(t=>t.date.startsWith(ym)&&!t.reconciled);
  const income=rows.filter(t=>t.accountType==='bank'&&t.amount>0&&!yb48InternalHint(t)).reduce((s,t)=>s+t.amount,0);
  const regular=rows.filter(t=>t.behaviour!=='oneoff').reduce((s,t)=>s+spendingAmount(t),0);
  const oneoff=rows.filter(t=>t.behaviour==='oneoff').reduce((s,t)=>s+spendingAmount(t),0);
  return {income,regular,oneoff,total:income-regular-oneoff};
}
const yb48DashboardBefore=dashboardKPIs;
dashboardKPIs=function(){
  const ym=yb48ActualMonth();
  if(!ym){yb48DashboardBefore();return;}
  const x=yb48ActualMetrics(ym);
  $('#kIn').textContent=money(x.income);$('#kOut').textContent=money(x.regular);
  $('#kNet').textContent=money(x.income-x.regular);$('#monthOne').textContent=money(x.oneoff);
  $('#monthTotal').textContent=money(x.total);
  const d=new Date(ym+'-02T12:00:00');
  $('#modeNote').textContent='Imported actuals · '+d.toLocaleString('en',{month:'short',year:'numeric'});
};
const yb48MonthMetricsBefore=monthMetrics;
monthMetrics=function(m){if(!S.tx.length)return yb48MonthMetricsBefore(m);const x=yb48ActualMetrics(m);return [x.income,x.regular+x.oneoff,x.total];};
const yb48ChartMonthsBefore=chartMonths;
chartMonths=function(){
  if(!S.tx.length)return yb48ChartMonthsBefore();
  const latest=yb48ActualMonth(), count=+S.chartMonths||6;
  const base=new Date(latest+'-01T12:00:00');
  return Array.from({length:count},(_,i)=>{let d=new Date(base);d.setMonth(d.getMonth()-(count-1-i));return isoLocal(d).slice(0,7);});
};
function yb48Recurrences(){
  const groups=new Map();
  for(const t of S.tx){
    if(t.behaviour==='oneoff'||t.reconciled||!t.date||Math.abs(t.amount)<yb48.minRecurring||t.type==='card_payment'
       ||t.category==='Transfers'||yb48InternalHint(t)&&t.amount<0)continue;
    if(t.accountType==='card'&&t.amount>0)continue;
    const direction=t.amount>0?'in':'out';
    if(direction==='in'&&t.accountType!=='bank')continue;
    const name=(t.merchant||t.desc||'').trim().replace(/\s+/g,' ');
    const key=[name.toLowerCase(),direction,t.accountType].join('|');
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(t);
  }
  const out=[];
  for(const items of groups.values()){
    const byMonth=new Map();
    for(const t of items){const month=t.date.slice(0,7);const list=byMonth.get(month)||[];list.push(t);byMonth.set(month,list);}
    if(byMonth.size<yb48.minOccurrences)continue;
    // One payment per month; repeated daily purchases are not recurring bills.
    if([...byMonth.values()].some(a=>a.length>1))continue;
    const a=[...items].sort((x,y)=>x.date.localeCompare(y.date));
    let gaps=[],dayValues=a.map(t=>+t.date.slice(8));
    for(let i=1;i<a.length;i++){
      const d0=new Date(a[i-1].date+'T12:00'),d1=new Date(a[i].date+'T12:00');
      gaps.push((d1.getFullYear()-d0.getFullYear())*12+d1.getMonth()-d0.getMonth());
    }
    if(gaps.some(g=>g!==1))continue;
    if(Math.max(...dayValues)-Math.min(...dayValues)>yb48.dayTolerance*2)continue;
    const amounts=a.map(t=>Math.abs(t.amount)), avg=amounts.reduce((s,v)=>s+v,0)/amounts.length;
    if(Math.max(...amounts)-Math.min(...amounts)>Math.max(avg*.30,10))continue;
    const last=a[a.length-1],name=last.merchant||last.desc;
    if((S.dismissedRecurring||[]).includes(name))continue;
    // Keep observed recurrence even when a manual plan has the same name: Add and Override are resolved by the projection engine.
    out.push({name,amount:Math.round(avg*100)/100,frequency:'monthly',last:last.date,
      count:a.length,type:last.amount>0?'in':'out',anchorDay:Math.round(dayValues.reduce((s,v)=>s+v,0)/dayValues.length)});
  }
  return out.sort((a,b)=>b.amount-a.amount);
}
recurringCandidates=function(){return yb48Recurrences();};
function yb48InferredInstances(days){
  if(!yb48.showInferred)return [];
  const now=new Date(),end=new Date(now);end.setDate(end.getDate()+days);
  const out=[];
  for(const c of yb48Recurrences()){
    let d=new Date(c.last+'T12:00:00');
    // Advance using a fixed day-of-month, clamped to month end.
    let y=d.getFullYear(),m=d.getMonth();
    for(let guard=0;guard<36;guard++){
      m++;if(m>11){m=0;y++;}
      d=new Date(y,m,Math.min(c.anchorDay,new Date(y,m+1,0).getDate()),12);
      if(d>end)break;
      if(d>=new Date(now.toDateString()))out.push({id:'inferred_'+c.name,name:c.name,amount:c.amount,type:c.type,when:new Date(d),inferred:true});
    }
  }
  return out;
}
const yb48FlowBefore=flowInstances;
flowInstances=function(days=90){return [...yb48FlowBefore(days),...yb48InferredInstances(days)].sort((a,b)=>a.when-b.when);};
renderUpcoming7=function(){
  const el=$('#upcoming7');if(!el)return;
  const x=flowInstances(7);
  el.innerHTML=x.length?`<table class="flow7-table"><thead><tr><th>Date</th><th>Flow</th><th>Amount</th></tr></thead><tbody>${x.map(f=>`<tr><td>${f.when.toLocaleDateString('en-SG',{day:'2-digit',month:'short'})}</td><td>${yb48Esc(f.name)}${f.inferred?' <span class="muted">(estimated)</span>':''}</td><td class="amount ${f.type}">${f.type==='in'?'+':'−'}${money(f.amount)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No confirmed or inferred flows in the next 7 days.</p>';
};
renderRecurringSuggestions=function(){
  const el=$('#recurringSuggestions');if(!el)return;
  const c=yb48Recurrences();el._candidates=c;
  el.innerHTML=c.length?c.map((x,i)=>`<div class="suggestion"><b>${yb48Esc(x.name)}</b><div class="muted">${x.count} monthly occurrences · ~${money(x.amount)} · ${x.type==='in'?'inflow':'outflow'} · estimated</div><div class="actions"><button data-addrec="${i}" class="primary">Add to plan</button><button data-dismissrec="${encodeURIComponent(x.name)}">Dismiss</button></div></div>`).join(''):'<p class="muted">No monthly patterns pass the current confidence and amount thresholds.</p>';
};
renderTransactions=function(){
  const q=($('#search')?.value||'').toLowerCase(),ac=$('#acctFilter')?.value||'';
  const select=$('#acctFilter'),old=select.value;
  const accounts=[...new Set(S.tx.map(t=>t.account))].sort();
  select.innerHTML='<option value="">All accounts</option>'+accounts.map(a=>`<option value="${yb48Esc(a)}">${yb48Esc(a)}</option>`).join('');
  select.value=old;
  let rows=S.tx.filter(t=>(!q||(t.desc||'').toLowerCase().includes(q)||(t.merchant||'').toLowerCase().includes(q))&&(!ac||t.account===ac));
  if(reviewUncategorisedOnly)rows=rows.filter(t=>!t.reconciled&&!t.manualOverride&&(t.classificationSource==='unclassified'||!t.category||t.category==='Other'));
  rows.sort((a,b)=>b.date.localeCompare(a.date));
  const total=rows.length,size=+yb48.pageSize||50,pages=Math.max(1,Math.ceil(total/size));
  yb48.page=Math.max(1,Math.min(+yb48.page||1,pages));
  const offset=(yb48.page-1)*size;
  $('#txbody').innerHTML=rows.slice(offset,offset+size).map(txRow).join('')||'<tr><td colspan="8" class="muted">No matching transactions.</td></tr>';
  const info=$('#yb48PageInfo');if(info)info.textContent=`${total?offset+1:0}–${Math.min(total,offset+size)} of ${total} · page ${yb48.page} / ${pages}`;
  if($('#yb48Prev'))$('#yb48Prev').disabled=yb48.page===1;
  if($('#yb48Next'))$('#yb48Next').disabled=yb48.page===pages;
};
function yb48InitControls(){
  const tx=$('#transactions .tablewrap');
  if(tx&&!$('#yb48Pagination')){
    const div=document.createElement('div');div.id='yb48Pagination';div.className='toolbar';
    div.innerHTML='<label>Rows per page <select id="yb48PageSize"><option>25</option><option>50</option><option>100</option><option>250</option></select></label><button type="button" id="yb48Prev">Previous</button><span class="muted" id="yb48PageInfo"></span><button type="button" id="yb48Next">Next</button>';
    tx.insertAdjacentElement('afterend',div);
    $('#yb48PageSize').value=String(yb48.pageSize);
    $('#yb48PageSize').onchange=e=>{yb48.pageSize=+e.target.value;yb48.page=1;save();renderTransactions();};
    $('#yb48Prev').onclick=()=>{yb48.page--;renderTransactions();};
    $('#yb48Next').onclick=()=>{yb48.page++;renderTransactions();};
    $('#search').addEventListener('input',()=>{yb48.page=1;});
    $('#acctFilter').addEventListener('change',()=>{yb48.page=1;});
  }
  const settings=$('#settings .settings-panel');
  if(settings&&!$('#yb48Settings')){
    const div=document.createElement('div');div.id='yb48Settings';
    div.innerHTML='<hr/><h2>Recurring-flow detection</h2><p class="muted">Suggestions use imported statements and are estimates, not confirmed payments.</p><label class="setting-row">Minimum amount <input id="yb48Min" type="number" min="0" step="25"/></label><label class="setting-row">Minimum monthly occurrences <select id="yb48Count"><option>2</option><option>3</option><option>4</option><option>6</option></select></label><label class="setting-row">Day-of-month tolerance (days) <input id="yb48Tolerance" type="number" min="0" max="15"/></label><label class="setting-row"><span>Show inferred upcoming flows</span><input id="yb48Show" type="checkbox"/></label><p class="muted" id="yb48Matches"></p>';
    settings.appendChild(div);
    $('#yb48Min').value=yb48.minRecurring;$('#yb48Count').value=String(yb48.minOccurrences);
    $('#yb48Tolerance').value=yb48.dayTolerance;$('#yb48Show').checked=yb48.showInferred;
    for(const [id,key,parse] of [['yb48Min','minRecurring',Number],['yb48Count','minOccurrences',Number],['yb48Tolerance','dayTolerance',Number],['yb48Show','showInferred',null]]){
      $('#'+id).onchange=e=>{yb48[key]=parse?parse(e.target.value):e.target.checked;save();render();};
    }
  }
}
yb48InitControls();
yb48Reconcile();save();
const yb48RenderBefore=render;
render=function(){
  yb48RenderBefore();
  // Reapply actuals after all older dashboard wrappers, and refresh upcoming estimates.
  dashboardKPIs();renderUpcoming();renderUpcoming7();renderRecurringSuggestions();renderTransactions();
  if($('#yb48Matches'))$('#yb48Matches').textContent=`${S.tx.filter(t=>t.reconciled).length/2} matched internal-transfer pairs are excluded from analytics.`;
};
const yb48ReadFileBefore=readFile;
readFile=async function(file){const result=await yb48ReadFileBefore(file);yb48Reconcile();save();return result;};
render();
// YouBudget v4.9 — optional insight-based saving scenarios and deficit action plan.
// Scenarios affect only forecast overlays; they never mutate imported actuals or planned flows.
S.savingPresets=S.savingPresets||{};
function yb49Escape(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function yb49MonthlyData(){
  const n=+($('#insightsWindow')?.value||6),rows=insightTransactions(n),cats=new Map(),merchants=new Map();
  for(const t of rows){const amount=spendingAmount(t);if(amount<=0)continue;const cat=t.category||'Other',name=t.merchant||t.desc||'Unknown';cats.set(cat,(cats.get(cat)||0)+amount);const k=cat+'\u0001'+name;merchants.set(k,(merchants.get(k)||0)+amount);}
  return {n,cats,merchants,rows};
}
function yb49Suggestions(){
  const {n,cats,merchants}=yb49MonthlyData(),out=[];
  // Base each suggestion on observed spending; limit suggestions to discretionary-looking categories.
  const excluded=/rent|mortgage|tax|insurance|loan|debt|medical|health|school|tuition|utilities|electric|water|transfer|savings/i;
  const discretionary=/dining|restaurant|food|cafe|coffee|entertain|shopping|retail|travel|holiday|subscription|stream|leisure|hobby|transport|taxi|ride/i;
  [...cats.entries()].sort((a,b)=>b[1]-a[1]).forEach(([name,total])=>{
    const monthly=total/n;if(monthly<10||excluded.test(name)||!discretionary.test(name))return;
    const rate=/dining|restaurant|cafe|coffee/i.test(name)?0.20:0.10;
    out.push({id:'category:'+name,name:`Reduce ${name} spending by ${Math.round(rate*100)}%`,source:'Saving opportunity',category:name,monthly,rate,saving:Math.round(monthly*rate*100)/100});
  });
  // Recurring suggestions are usually bills, not savings. Offer a clearly hypothetical 10% negotiation.
  for(const c of yb48Recurrences()){
    if(c.type!=='out'||c.amount<=0||excluded.test(c.name))continue;
    if([...cats.keys()].some(k=>discretionary.test(k)&&[...merchants.keys()].some(m=>m.endsWith('\u0001'+c.name)&&m.startsWith(k+'\u0001'))))continue; // avoid obvious category/merchant overlap
    out.push({id:'recurring:'+c.name,name:`Review / renegotiate ${c.name} (10% test)`,source:'Recurring suggestion',monthly:c.amount,rate:.10,saving:Math.round(c.amount*.10*100)/100});
  }
  return out.filter(x=>x.saving>0).sort((a,b)=>b.saving-a.saving).slice(0,12);
}
function yb49ActiveSuggestions(){const options=new Map(yb49Suggestions().map(x=>[x.id,x]));return Object.keys(S.savingPresets||{}).filter(k=>S.savingPresets[k]&&options.has(k)).map(k=>options.get(k));}
function yb49SavingsEvents(start,end){
  const active=yb49ActiveSuggestions(),monthly=active.reduce((s,x)=>s+x.saving,0);if(!monthly)return [];
  const events=[],first=new Date(start.getFullYear(),start.getMonth()+1,1,12);
  for(let d=first;d<=end;d=new Date(d.getFullYear(),d.getMonth()+1,1,12))events.push({when:new Date(d),delta:monthly,scenario:true});
  return events;
}
const yb49ForecastBefore=forecastSeries;
forecastSeries=function(days=S.forecastHorizon,withScenarios=true){
  const base=yb49ForecastBefore(days,withScenarios);
  if(!withScenarios)return base;
  const start=ybToday(),end=new Date(start);end.setDate(end.getDate()+days);
  const ev=yb49SavingsEvents(start,end);if(!ev.length)return base;
  let added=0,j=0,low={balance:Infinity,date:new Date(start)};
  const points=base.points.map(pt=>{while(j<ev.length&&ev[j].when<=pt.date){added+=ev[j].delta;j++;}const x={date:pt.date,balance:pt.balance+added};if(x.balance<low.balance)low={...x};return x;});
  return {points,low,endBalance:points.at(-1).balance};
};
const yb49RenderChartBefore=renderForecastChart;
renderForecastChart=function(){
  // Existing renderer only draws the scenario overlay when one-off scenarios exist.
  const active=yb49ActiveSuggestions().length>0;
  if(active&&!(S.scenarios||[]).length){S.scenarios.push({id:'__yb49_overlay_placeholder',name:'Savings overlay',type:'in',amount:0,date:'1900-01-01'});try{yb49RenderChartBefore()}finally{S.scenarios=S.scenarios.filter(x=>x.id!=='__yb49_overlay_placeholder');}}
  else yb49RenderChartBefore();
  if(active&&$('#forecastStatus'))$('#forecastStatus').textContent+=' · suggested savings included';
};
function yb49RenderPreset(){
 const el=$('#presetScenarioList');if(!el)return;const options=yb49Suggestions(),active=yb49ActiveSuggestions(),sum=active.reduce((s,x)=>s+x.saving,0);
 $('#presetScenarioSummary').innerHTML=`<p class="muted">${active.length} active · estimated ${money(sum)}/month from next month · ${money(sum*12)}/year if sustained. Scenarios are hypothetical and may overlap existing plans.</p>`;
 el.innerHTML=options.length?options.map(x=>`<div class="row yb49-preset"><span><b>${yb49Escape(x.name)}</b><div class="muted">${yb49Escape(x.source)} · observed ${money(x.monthly)}/month · estimated saving ${money(x.saving)}/month</div></span><label><input type="checkbox" data-savingpreset="${encodeURIComponent(x.id)}" ${S.savingPresets[x.id]?'checked':''}> Include in forecast</label></div>`).join(''):'<p class="muted">Import and categorize spending to generate optional saving scenarios.</p>';
}
function yb49DashboardDeficit(){
 const ym=typeof yb48ActualMonth==='function'?yb48ActualMonth():null;
 if(ym)return {month:ym,total:yb48ActualMetrics(ym).total,source:'imported transactions'};
 const m=isoLocal(new Date()).slice(0,7),flows=typeof monthlyBudgetSummary==='function'?monthlyBudgetSummary(m):null;
 // Dashboard renders the same monthly total; use the displayed numeric value only when no actuals exist.
 const node=$('#monthTotal'),raw=(node?.textContent||'').replace(/[^\d.\-]/g,'');
 const fallback=monthMetrics(m)[2];return {month:m,total:Number.isFinite(fallback)?fallback:0,source:'cash-flow plan'};
}
function yb49RenderDeficit(){
 const el=$('#deficitSuggestions');if(!el)return;const d=yb49DashboardDeficit(),gap=Math.max(0,-d.total),suggestions=yb49Suggestions();
 if(!gap){el.innerHTML=`<p class="muted">No deficit is currently identified for ${yb49Escape(d.month)} (${yb49Escape(d.source)}). If spending increases, potential reductions will appear here.</p>`;return;}
 let remaining=gap,selected=[];for(const x of suggestions){if(remaining<=.005)break;const impact=Math.min(remaining,x.saving);selected.push({x,impact});remaining-=impact;}
 const covered=gap-remaining;
 el.innerHTML=`<p><b>Dashboard deficit: ${money(gap)}</b> · ${yb49Escape(d.month)} (${yb49Escape(d.source)})</p>`+
 (selected.length?selected.map(({x,impact})=>`<div class="suggestion"><b>${yb49Escape(x.name)}</b><p class="muted">Potential improvement ${money(impact)}/month toward the deficit, based on ${money(x.monthly)}/month observed spending. <button type="button" data-activate-saving="${encodeURIComponent(x.id)}">Test in forecast</button></p></div>`).join(''):'<p class="muted">No sufficiently supported discretionary reductions were found. Review major fixed costs, income opportunities and one-off spending manually.</p>')+
 `<p class="muted">Combined estimated reduction: ${money(covered)} (${Math.round(covered/gap*100)}% of deficit). ${remaining>0?`Unaddressed: ${money(remaining)}.`:'The suggested reductions could offset the estimated deficit if fully achieved.'} Suggestions are illustrative, not guaranteed, and may overlap with existing plans.</p>`;
}
document.body.addEventListener('change',e=>{const id=e.target.dataset?.savingpreset;if(id!==undefined){S.savingPresets[decodeURIComponent(id)]=e.target.checked;save();renderForecastPage();yb49RenderPreset();}});
document.body.addEventListener('click',e=>{const id=e.target.dataset?.activateSaving;if(id!==undefined){S.savingPresets[decodeURIComponent(id)]=true;save();renderForecastPage();yb49RenderPreset();}});
const yb49RenderBefore=render;
render=function(){yb49RenderBefore();yb49RenderPreset();yb49RenderDeficit();};
const yb49ForecastPageBefore=renderForecastPage;
renderForecastPage=function(){yb49ForecastPageBefore();yb49RenderPreset();};
const yb49InsightsBefore=renderInsights;
renderInsights=function(){yb49InsightsBefore();yb49RenderDeficit();yb49RenderPreset();};
render();

// YouBudget v4.11 — historical coverage, income classification and inferred flow consistency.
// A distinct imported transaction month is the observable coverage unit; multiple accounts in
// the same month are counted once. Missing months are not silently treated as zero spending.
function yb411ValidRows(){return S.tx.filter(t=>/^\d{4}-\d{2}-\d{2}$/.test(t.date||'')&&!t.reconciled);}
function yb411MonthKeys(){return [...new Set(yb411ValidRows().map(t=>t.date.slice(0,7)))].sort();}
function yb411History(windowSize=12){
  const keys=yb411MonthKeys(),selected=keys.slice(-Math.min(12,Math.max(1,windowSize)));
  return {keys,selected,count:selected.length,months:Math.max(1,selected.length),start:selected[0]||null,end:selected[selected.length-1]||null};
}
function yb411Income(t){return !t.reconciled&&t.category==='Income'&&t.accountType==='bank'&&t.amount>0&&!yb48InternalHint(t);}
function yb411Spend(t){return !t.reconciled?Math.max(0,spendingAmount(t)):0;}
function yb411RollingRows(){
  const dates=yb411ValidRows().map(t=>t.date).sort();if(!dates.length)return null;
  const last=dates[dates.length-1],end=new Date(last+'T12:00:00');
  const start=new Date(end);start.setMonth(start.getMonth()-1);start.setDate(start.getDate()+1);
  const first=isoLocal(start);
  return {first,last,rows:yb411ValidRows().filter(t=>t.date>=first&&t.date<=last)};
}
function yb411Numbers(rows){
 const income=rows.filter(yb411Income).reduce((s,t)=>s+t.amount,0);
 const regular=rows.filter(t=>t.behaviour!=='oneoff').reduce((s,t)=>s+yb411Spend(t),0);
 const one=rows.filter(t=>t.behaviour==='oneoff').reduce((s,t)=>s+yb411Spend(t),0);
 return {income,regular,one,total:income-regular-one};
}
const yb411DashboardOld=dashboardKPIs;
dashboardKPIs=function(){
 if(S.mode!=='detailed'){yb411DashboardOld();return;}
 const range=yb411RollingRows();if(!range){yb411DashboardOld();return;}
 const v=yb411Numbers(range.rows);
 $('#kIn').textContent=money(v.income);$('#kOut').textContent=money(v.regular);
 $('#kNet').textContent=money(v.income-v.regular);$('#monthOne').textContent=money(v.one);
 $('#monthTotal').textContent=money(v.total);
 $('#modeNote').textContent=`Rolling 1 month · ${range.first} to ${range.last}`;
};
const yb411BudgetOld=actualBudget;
actualBudget=function(){
 if(S.mode!=='detailed'){yb411BudgetOld();return;}
 const h=yb411History(12),months=h.selected,rows=yb411ValidRows().filter(t=>months.includes(t.date.slice(0,7))),v=yb411Numbers(rows);
 const scale=12/h.months,annualIn=v.income*scale,annualOut=v.regular*scale,annualOne=v.one*scale;
 $('#annualIn').textContent=money(annualIn);$('#annualOut').textContent=money(annualOut);
 $('#annualNet').textContent=money(annualIn-annualOut);$('#annualOne').textContent=money(annualOne);
 $('#annualTotal').textContent=money(annualIn-annualOut-annualOne);
 const label=$('#yb411AnnualPeriod');if(label)label.textContent=h.count?`Annualized from ${h.count} observed month${h.count===1?'':'s'} · ${h.start}–${h.end}`:'No imported history';
 const warn=$('#yb411AnnualWarning');if(warn)warn.innerHTML=h.count&&h.count<6?`<div class="yb411-warning" role="status">Limited history: only ${h.count} observed month${h.count===1?'':'s'} of transactions. Annualized income and spending may be misleading, particularly for seasonal or irregular flows.</div>`:'';
};
const yb411MetricsOld=monthMetrics;
monthMetrics=function(m){
 if(S.mode!=='detailed')return yb411MetricsOld(m);
 const v=yb411Numbers(yb411ValidRows().filter(t=>t.date.startsWith(m)));
 return [v.income,v.regular+v.one,v.total];
};
// Override insight lookback to use the latest observed months, not months relative to today.
insightTransactions=function(n){
 const months=yb411History(n).selected;
 return yb411ValidRows().filter(t=>months.includes(t.date.slice(0,7))&&yb411Spend(t)>0);
};
const yb411InsightsOld=renderInsights;
renderInsights=function(){
 yb411InsightsOld();
 const requested=+($('#insightsWindow')?.value||6),h=yb411History(requested),n=h.months;
 const a=insightTransactions(requested),total=a.reduce((s,t)=>s+yb411Spend(t),0);
 const sum=$('#insightSummary');if(sum){const cells=sum.querySelectorAll('div');if(cells[0])cells[0].innerHTML=`<small>Outflows · ${h.count} observed months</small><b>${money(total)}</b>`;if(cells[1])cells[1].innerHTML=`<small>Average monthly outflow</small><b>${money(total/n)}</b>`;}
 const cats=new Map(),merchants=new Map();a.forEach(t=>{const v=yb411Spend(t),cat=t.category||'Other',merchant=t.merchant||t.desc||'Unknown';cats.set(cat,(cats.get(cat)||0)+v);const item=merchants.get(merchant)||{sum:0,count:0};item.sum+=v;item.count++;merchants.set(merchant,item)});
 const priorKeys=yb411History(24).keys.filter(m=>m<h.start).slice(-h.count);
 const prior=yb411ValidRows().filter(t=>priorKeys.includes(t.date.slice(0,7))&&yb411Spend(t)>0),prev=new Map();prior.forEach(t=>prev.set(t.category||'Other',(prev.get(t.category||'Other')||0)+yb411Spend(t)));
 const trends=$('#insightTrends');if(trends)trends.innerHTML=cats.size?`<table><thead><tr><th>Category</th><th>Monthly average</th><th>Change vs prior period</th></tr></thead><tbody>${[...cats].sort((a,b)=>b[1]-a[1]).map(([cat,v])=>{const old=priorKeys.length?(prev.get(cat)||0)/priorKeys.length:null,avg=v/n,delta=old===null?null:avg-old,pct=old?delta/old*100:null;return `<tr><td>${yb49Escape(cat)}</td><td>${money(avg)}</td><td class="${delta>0?'amount out':'amount in'}">${pct===null?'Insufficient baseline':`${delta>0?'+':''}${pct.toFixed(0)}% (${money(delta)}/mo)`}</td></tr>`}).join('')}</tbody></table>`:'<p class="muted">Import transactions to see category trends.</p>';
 const merchantsEl=$('#merchantInsights');if(merchantsEl)merchantsEl.innerHTML=merchants.size?`<table><thead><tr><th>Merchant</th><th>Transactions</th><th>Monthly average</th></tr></thead><tbody>${[...merchants].sort((a,b)=>b[1].sum-a[1].sum).slice(0,15).map(([name,v])=>`<tr><td>${yb49Escape(name)}</td><td>${v.count}</td><td>${money(v.sum/n)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No merchant spending yet.</p>';
 const warning=$('#yb411HistoryWarning');if(warning)warning.innerHTML=h.count&&h.count<6?`<div class="yb411-warning" role="status">Limited transaction history: ${h.count} observed month${h.count===1?'':'s'} (fewer than 6). Category averages, trends and departures may be unrepresentative or misleading. Missing months and seasonal expenses can affect comparisons.</div>`:'';
};
// Reuse the corrected denominator in the suggestion/scenario calculations.
yb49MonthlyData=function(){
 const n=+($('#insightsWindow')?.value||6),rows=insightTransactions(n),h=yb411History(n),cats=new Map(),merchants=new Map();
 for(const t of rows){const amount=yb411Spend(t);if(!amount)continue;const cat=t.category||'Other',name=t.merchant||t.desc||'Unknown';cats.set(cat,(cats.get(cat)||0)+amount);const k=cat+'\u0001'+name;merchants.set(k,(merchants.get(k)||0)+amount);}
 return {n:h.months,cats,merchants,rows};
};
// Income must explicitly be classified Income, including cashflow and netflow bars.
// Keep chart periods anchored to the last transaction in Advanced mode.
const yb411ChartMonthsOld=chartMonths;
chartMonths=function(){
 if(S.mode!=='detailed'||!yb411MonthKeys().length)return yb411ChartMonthsOld();
 const latest=yb411MonthKeys().at(-1),count=+S.chartMonths||6,base=new Date(latest+'-01T12:00:00');
 return Array.from({length:count},(_,i)=>{const d=new Date(base);d.setMonth(d.getMonth()-(count-1-i));return isoLocal(d).slice(0,7)});
};
// Stable alphabetical display; preserve original category indices for delete buttons.
renderRules=function(){
 const cats=[...S.cats].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}));
 $('#ruleCat').innerHTML=cats.map(c=>`<option>${yb49Escape(c)}</option>`).join('');
 $('#rulesList').innerHTML=S.rules.map(r=>`<div class="row"><span>If description contains <b>${yb49Escape(r.text)}</b> → ${yb49Escape(r.cat)}</span><button data-delrule="${r.id}">×</button></div>`).join('');
 $('#catList').innerHTML=cats.map(c=>`<span class="category-chip"><span>${yb49Escape(c)}</span><button type="button" data-delcat="${S.cats.indexOf(c)}" aria-label="Delete category">×</button></span>`).join(' ');
};
// Historical recurring transactions are inferred forward into the visible calendar month.
const yb411CalendarOld=renderCalendar;
renderCalendar=function(){
 yb411CalendarOld();
 if(!yb48.showInferred)return;
 const grid=$('#calendarGrid');if(!grid)return;
 const y=calDate.getFullYear(),m=calDate.getMonth();
 const first=new Date(y,m,1),last=new Date(y,m+1,0,23,59,59);
 const inferred=yb48Recurrences();
 const cells=grid.querySelectorAll('.day:not(.head)');
 const offset=first.getDay(),start=new Date(y,m,1-offset);
 for(let i=0;i<cells.length;i++){
  const d=new Date(start);d.setDate(start.getDate()+i);
  if(d<new Date(new Date().toDateString())||d.getMonth()!==m)continue;
  const key=isoLocal(d);
  for(const c of inferred){
   const lastSeen=new Date(c.last+'T12:00:00');
   const next=new Date(d.getFullYear(),d.getMonth(),Math.min(c.anchorDay,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()),12);
   if(isoLocal(next)!==key||next<=lastSeen)continue;
   if([...cells[i].querySelectorAll('.event')].some(el=>el.textContent.includes(c.name)&&el.textContent.includes('estimated')))continue;
   const el=document.createElement('div');el.className='event '+c.type;el.textContent=`${c.name} (estimated) ${c.type==='in'?'+':'−'}${money(c.amount)}`;cells[i].appendChild(el);
  }
 }
};
// Align deficit suggestions with the exact rolling interval displayed on Dashboard.
yb49DashboardDeficit=function(){
 if(S.mode==='detailed'){
  const range=yb411RollingRows();
  if(range)return {month:range.first+' to '+range.last,total:yb411Numbers(range.rows).total,source:'rolling imported transactions'};
 }
 const ym=isoLocal(new Date()).slice(0,7);
 return {month:ym,total:monthMetrics(ym)[2],source:'cash-flow plan'};
};
// Re-render after all older wrappers have completed, so none can overwrite corrected values.
const yb411RenderOld=render;
render=function(){yb411RenderOld();dashboardKPIs();actualBudget();renderChart();renderInsights();renderRules();renderCalendar();renderUpcoming7();yb49RenderDeficit();yb49RenderPreset();};
render();


// YouBudget v4.12: category-aware plan, corrected income classification, stacked chart.
// Income is a positive non-transfer transaction explicitly categorized Income; the source
// can be any imported non-card account. Bank metadata are not always populated by importers.
function yb412IsIncome(t){return !!t&&!t.reconciled&&String(t.category||'').trim().toLowerCase()==='income'&&+t.amount>0&&t.type!=='card_payment'&&t.accountType!=='card'&&String(t.category).toLowerCase()!=='transfers';}
yb411Income=yb412IsIncome;
function yb412IncomeAudit(){return yb411ValidRows().filter(t=>t.category?.toLowerCase()==='income').map(t=>({date:t.date,amount:t.amount,accountType:t.accountType,category:t.category,reconciled:t.reconciled}));}
window.YouBudgetIncomeAudit=yb412IncomeAudit;
const yb412OriginalOpen=openPlannedFlowDialog;
openPlannedFlowDialog=function(flow=null){
 const selector=$('#yb412PlanCategory');selector.innerHTML='<option value="">Unassigned</option>'+[...S.cats].sort((a,b)=>a.localeCompare(b)).map(c=>`<option value="${yb49Escape(c)}">${yb49Escape(c)}</option>`).join('');
 selector.value=flow?.category||'';$('#yb412PlanMode').value=flow?.integration||'add';
 $('#yb412CategoryLabel').hidden=$('#yb412ModeLabel').hidden=S.mode!=='detailed';
 yb412OriginalOpen(flow);
};
const yb412Submit=$('#monthlyForm').onsubmit;
$('#monthlyForm').onsubmit=function(e){
 const id=$('#monthlyEditId').value;
 const existing=id?S.monthly.find(x=>String(x.id)===id):null;
 const category=$('#yb412PlanCategory').value, integration=$('#yb412PlanMode').value;
 yb412Submit.call(this,e);
 const saved=existing?S.monthly.find(x=>String(x.id)===id):S.monthly.at(-1);
 if(saved){saved.category=category;saved.integration=integration;save();render();}
};
const yb412RenderMonthlyOld=renderMonthly;
renderMonthly=function(){yb412RenderMonthlyOld();if(S.mode!=='detailed')return;const rows=$$('#monthlyBody tr');rows.forEach((row,i)=>{const f=[...S.monthly].sort((a,b)=>(a.day||0)-(b.day||0))[i];if(!f)return;const cell=row.cells[1];if(cell){const extra=document.createElement('div');extra.className='muted';extra.textContent=(f.category||'Unassigned')+' · '+(f.integration==='override'?'Override category forecast':'Add to forecast');cell.appendChild(extra);}})};
// Rolling month spending categories use precisely the same transactions as Monthly overview.
const yb412OldCats=renderCats;
renderCats=function(month){if(S.mode==='detailed'){const r=yb411RollingRows();if(r){yb412OldCats(r.rows);if($('#catsPeriod'))$('#catsPeriod').textContent=`Rolling month · ${r.first} to ${r.last}`;return;}}yb412OldCats(month);};
// Monthly / yearly totals: income is identified from category, regardless of source account metadata.
const yb412OldNumbers=yb411Numbers;
yb411Numbers=function(rows){const v=yb412OldNumbers(rows);v.income=rows.filter(yb412IsIncome).reduce((sum,t)=>sum+Number(t.amount||0),0);v.total=v.income-v.regular-v.one;return v;};
// Exclude non-discretionary categories from all automated savings suggestions.
const yb412OldSuggestions=yb49Suggestions;
yb49Suggestions=function(){return yb412OldSuggestions().filter(x=>!/^(tax|taxes|income|housing)$/i.test(String(x.category||''))&&!/\b(tax|taxes|income|housing)\b/i.test(String(x.name||'')));};
// Also suppress the original Spending insights suggestion renderer for excluded categories.
const yb412OldInsights=renderInsights;
renderInsights=function(){yb412OldInsights();const el=$('#savingIdeas');if(!el)return;el.querySelectorAll('.suggestion').forEach(node=>{const title=node.querySelector('b')?.textContent||'';if(/\b(tax|taxes|income|housing)\b/i.test(title))node.remove();});if(!el.querySelector('.suggestion'))el.innerHTML='<p class="muted">No actionable discretionary saving opportunities identified from the available transactions.</p>';};
// Monthly stacked histograms: five largest categories by aggregate volume per direction,
// with all remaining categories grouped into Other inflows / Other outflows.
function yb412ChartData(months){
 const rows=yb411ValidRows(),incoming=new Map(),outgoing=new Map();
 const perMonth=months.map(m=>{const inn=new Map(),out=new Map();for(const t of rows){if(!t.date.startsWith(m))continue;const cat=t.category||'Other';if(yb412IsIncome(t)){inn.set(cat,(inn.get(cat)||0)+t.amount);incoming.set(cat,(incoming.get(cat)||0)+t.amount);}const spend=yb411Spend(t);if(spend>0){out.set(cat,(out.get(cat)||0)+spend);outgoing.set(cat,(outgoing.get(cat)||0)+spend);}}return {inn,out};});
 const top=m=>[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);return {perMonth,topIn:top(incoming),topOut:top(outgoing)};
}
const yb412Palette=['#3159c9','#41a1c7','#35bba5','#9a83d6','#e0a14e','#9ba8bb'];
function yb412StackedChart(el,months,metrics){
 const {perMonth,topIn,topOut}=yb412ChartData(months),W=760,H=245,L=58,R=12,T=12,B=36,ph=H-T-B,pw=W-L-R,step=pw/months.length,bw=Math.min(23,step*.26);
 const grouped=(map,top,other)=>{const pairs=top.map(k=>[k,map.get(k)||0]).filter(x=>x[1]>0);const extra=[...map].filter(([k])=>!top.includes(k)).reduce((s,[,v])=>s+v,0);if(extra>0)pairs.push([other,extra]);return pairs;};
 const max=niceMax(Math.max(1,...perMonth.map(v=>Math.max([...v.inn.values()].reduce((a,b)=>a+b,0),[...v.out.values()].reduce((a,b)=>a+b,0)))));
 let svg=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`;
 for(let i=0;i<=4;i++){const y=T+ph-(max*i/4)/max*ph;svg+=`<line class="gridline" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="axis-label" x="${L-7}" y="${y+3}" text-anchor="end">${fmtAxis(max*i/4)}</text>`;}
 const esc=yb49Escape;
 perMonth.forEach((v,i)=>{const x=L+step*(i+.5);for(const [direction,map,top,other,xx] of [['Inflows',v.inn,topIn,'Other inflows',x-bw-2],['Outflows',v.out,topOut,'Other outflows',x+2]]){
 const parts=grouped(map,top,other),total=parts.reduce((a,b)=>a+b[1],0);let running=0;parts.forEach(([cat,amount])=>{const index=top.indexOf(cat),color=yb412Palette[index<0?5:index],height=amount/max*ph,y=T+ph-(running+amount)/max*ph;svg+=`<rect x="${xx}" y="${y}" width="${bw}" height="${Math.max(.5,height)}" fill="${color}" data-tip="${esc(months[i])} · ${direction} total: ${esc(money(total))} · ${esc(cat)}: ${esc(money(amount))}"/>`;running+=amount;});}
 svg+=`<text class="month-label" x="${x}" y="${H-10}" text-anchor="middle">${new Date(months[i]+'-02').toLocaleString('en',{month:'short'})}</text>`;});el.innerHTML=svg+'</svg>';
 const legend=$('#yb412Legend');if(legend)legend.innerHTML='<span>Top five inflow/outflow categories across displayed months · Other combines the remainder</span>';
}
const yb412OldChart=renderChart;
renderChart=function(){yb412OldChart();if(S.mode==='detailed'){const months=chartMonths();yb412StackedChart($('#chart'),months,months.map(monthMetrics));tooltipSetup();}};
// Forecast category projection uses the same annualized historical category spending base as
// the Yearly budget. It is optional to avoid silently double-counting historical and planned flows.
S.categoryForecastEnabled=S.categoryForecastEnabled||false;
function yb412CategoryRates(){const h=yb411History(12),rows=yb411ValidRows().filter(t=>h.selected.includes(t.date.slice(0,7))),by=new Map();for(const t of rows){const v=t.behaviour==='oneoff'?0:yb411Spend(t);if(v>0)by.set(t.category||'Other',(by.get(t.category||'Other')||0)+v);}return [...by].map(([cat,total])=>({category:cat,monthly:total/h.months}));}
const yb412ForecastOld=forecastSeries;
forecastSeries=function(days=S.forecastHorizon,withScenarios=true){
 if(S.mode!=='detailed'||!S.categoryForecastEnabled)return yb412ForecastOld(days,withScenarios);
 const original=yb412ForecastOld(days,withScenarios),rates=yb412CategoryRates(),start=ybToday(),end=new Date(start);end.setDate(end.getDate()+days);
 const plan=ybPlanBetween(start,end),overrideCats=new Set(plan.filter(f=>f.integration==='override'&&f.category&&f.type==='out').map(f=>f.category));
 const existing=new Set(plan.filter(f=>f.category&&f.type==='out').map(f=>f.category));
 // Add historical category baselines only where not already covered by a categorized plan;
 // 'override' means the planned amount replaces the category baseline, not both.
 const addRates=rates.filter(r=>!existing.has(r.category));
 const daily=addRates.reduce((s,r)=>s+r.monthly*12/365.2425,0);
 let balanceAdjustment=0;for(let i=0;i<original.points.length;i++){if(i>0)balanceAdjustment-=daily;original.points[i].balance+=balanceAdjustment;}
 original.endBalance+=balanceAdjustment;
 original.low=original.points.reduce((low,x)=>x.balance<low.balance?{balance:x.balance,date:x.date}:low,{balance:Infinity,date:start});
 return original;
};
const yb412OldForecastPage=renderForecastPage;
renderForecastPage=function(){yb412OldForecastPage();const el=$('#yb412ForecastCategories');if(!el)return;
 if(S.mode!=='detailed'){el.innerHTML='';return;}
 const rates=yb412CategoryRates();el.innerHTML=`<label><input type="checkbox" id="yb412UseHistory" ${S.categoryForecastEnabled?'checked':''}> Include annualized spending-by-category estimates from Yearly Budget in the forecast</label><p class="muted">${rates.length} historical spending categories available. Categorized planned outflows replace the historical estimate for their category, preventing obvious double counting. Estimates are based on up to 12 observed months and may be inaccurate if statements are incomplete or spending changes.</p>`;
 el.querySelector('#yb412UseHistory').onchange=e=>{S.categoryForecastEnabled=e.target.checked;save();renderForecastPage();};
};
const yb412OldRender=render;
render=function(){yb412OldRender();renderCats();renderMonthly();renderChart();renderForecastPage();renderInsights();};
render();


// ---- YouBudget v4.13: one projection engine for statement-derived flows and manual plans ----
// Actual transaction records are never modified by these estimates.
function yb413Category(f){return String(f.category||'').trim().toLowerCase();}
function yb413ManualRate(f){return (+f.amount||0)*(annualFactor(f.frequency)/12);}
function yb413ManualAdjustment(){
 const h=yb411History(12),months=h.selected,rows=yb411ValidRows().filter(t=>months.includes(t.date.slice(0,7)));
 const historic=new Map();
 for(const t of rows){
   const income=yb412IsIncome(t),expense=t.behaviour==='oneoff'?0:yb411Spend(t);
   if(!income&&!expense)continue;
   const key=(income?'in:':'out:')+String(t.category||'Other').trim().toLowerCase();
   historic.set(key,(historic.get(key)||0)+(income?+t.amount:expense)/h.months);
 }
 let inDelta=0,outDelta=0;
 const groups=new Map();
 for(const f of S.monthly||[]){
   if(f.frequency==='once')continue; // one-offs remain in their dated projections
   const key=f.type+':'+yb413Category(f);
   const list=groups.get(key)||[];list.push(f);groups.set(key,list);
 }
 for(const [key,flows] of groups){
   const amount=flows.reduce((s,f)=>s+yb413ManualRate(f),0);
   const replace=flows.some(f=>f.integration==='override'&&yb413Category(f));
   const delta=amount-(replace?(historic.get(key)||0):0);
   if(key.startsWith('in:'))inDelta+=delta;else outDelta+=delta;
 }
 return {inDelta,outDelta,groups};
}
function yb413ApplySummary(income,out,one,annual=false){
 const d=yb413ManualAdjustment(),factor=annual?12:1;
 return {income:income+d.inDelta*factor,out:out+d.outDelta*factor,one,
   total:income+d.inDelta*factor-out-d.outDelta*factor-one};
}
// Consistent Income base: latest rolling month, including in the annualized display.
// Other categories retain the up-to-12-observed-month average.
function yb414IncomePlan(){
 const rows=yb411RollingRows()?.rows||[];
 const base=rows.filter(yb412IsIncome).reduce((sum,t)=>sum+Number(t.amount||0),0);
 const entries=(S.monthly||[]).filter(f=>f.type==='in'&&f.frequency!=='once');
 const incomePlans=entries.filter(f=>yb413Category(f)==='income');
 const otherPlans=entries.filter(f=>yb413Category(f)!=='income');
 const override=incomePlans.some(f=>f.integration==='override');
 const incomePlan=incomePlans.reduce((sum,f)=>sum+yb413ManualRate(f),0);
 const other=otherPlans.reduce((sum,f)=>sum+yb413ManualRate(f),0);
 return {base,monthly:(override?incomePlan:base+incomePlan)+other,override};
}
function yb414OutPlan(){
 const d=yb413ManualAdjustment();return d.outDelta;
}
const yb413DashboardBefore=dashboardKPIs;
dashboardKPIs=function(){
 yb413DashboardBefore();
 if(S.mode!=='detailed')return;
 const range=yb411RollingRows();if(!range)return;
 const v=yb411Numbers(range.rows),income=yb414IncomePlan().monthly,out=v.regular+yb414OutPlan();
 $('#kIn').textContent=money(income);$('#kOut').textContent=money(out);
 $('#kNet').textContent=money(income-out);
 $('#monthOne').textContent=money(v.one);$('#monthTotal').textContent=money(income-out-v.one);
};
const yb413BudgetBefore=actualBudget;
actualBudget=function(){
 yb413BudgetBefore();
 if(S.mode!=='detailed')return;
 const h=yb411History(12),rows=yb411ValidRows().filter(t=>h.selected.includes(t.date.slice(0,7))),v=yb411Numbers(rows);
 const income=yb414IncomePlan().monthly*12;
 const out=v.regular*12/h.months+yb414OutPlan()*12,one=v.one*12/h.months;
 $('#annualIn').textContent=money(income);$('#annualOut').textContent=money(out);
 $('#annualNet').textContent=money(income-out);
 $('#annualOne').textContent=money(one);$('#annualTotal').textContent=money(income-out-one);
 const label=$('#yb411AnnualPeriod');if(label)label.textContent=`Annualized: latest rolling-month income; spending from ${h.count} observed month${h.count===1?'':'s'}`;
};
function yb413Dates(start,end){const out=[];let d=new Date(start);d.setHours(12,0,0,0);while(d<=end){out.push(new Date(d));d.setDate(d.getDate()+1);}return out;}
function yb413ProjectedEvents(start,end){
 const plans=ybPlanBetween(start,end).map(f=>({...f,source:'manual'}));
 if(S.mode!=='detailed')return {discrete:plans,baseline:[]};
 const manual=(S.monthly||[]).filter(f=>f.category&&f.integration==='override');
 const override=new Set(manual.map(f=>f.type+':'+yb413Category(f)));
 const recurring=yb48Recurrences();
 const inferred=[];
 for(const c of recurring){
   const cat=String(c.category||'').toLowerCase();
   // When an override targets a category, its manually entered flows replace detected flows in that category.
   if(override.has(c.type+':'+cat))continue;
   let d=new Date(c.last+'T12:00:00');
   for(let n=0;n<120;n++){
     const y=d.getFullYear(),m=d.getMonth()+1;
     d=new Date(y,m,Math.min(c.anchorDay,new Date(y,m+1,0).getDate()),12);
     if(d>end)break;
     if(d>=start)inferred.push({when:new Date(d),type:c.type,amount:c.amount,name:c.name,category:c.category||'',source:'inferred',inferred:true});
   }
 }
 // Project the non-recurring portion of observed monthly category spending and income.
 // A detected recurring item is deducted from its category run-rate before its dated
 // occurrence is included. This avoids counting it once as a daily average and again as a bill.
 const h=yb411History(12),rows=yb411ValidRows().filter(t=>h.selected.includes(t.date.slice(0,7)));
 const rates=new Map();
 for(const t of rows){
   if(t.behaviour==='oneoff')continue;const income=yb412IsIncome(t),spent=yb411Spend(t);if(!income&&!spent)continue;
   const cat=String(t.category||'Other').trim().toLowerCase(),key=(income?'in:':'out:')+cat;
   rates.set(key,(rates.get(key)||0)+(income?+t.amount:spent)/h.months);
 }
 for(const c of recurring){
   const key=c.type+':'+String(c.category||'').trim().toLowerCase();
   if(rates.has(key))rates.set(key,Math.max(0,rates.get(key)-c.amount));
 }
 const days=yb413Dates(start,end),baseline=[];
 for(const [key,monthly] of rates){
   if(override.has(key)||monthly<=0)continue;
   const type=key.startsWith('in:')?'in':'out';
   const daily=monthly*12/365.2425;
   for(const when of days)baseline.push({when,type,amount:daily,source:'historical',category:key.slice(4)});
 }
 return {discrete:[...plans,...inferred].sort((a,b)=>a.when-b.when),baseline};
}
function yb413AllEvents(start,end){const v=yb413ProjectedEvents(start,end);return [...v.discrete,...v.baseline].sort((a,b)=>a.when-b.when);}
function yb413Upcoming(days){
 const now=ybToday(),end=new Date(now);end.setDate(end.getDate()+days);
 return yb413ProjectedEvents(now,end).discrete;
}
renderUpcoming7=function(){
 const el=$('#upcoming7');if(!el)return;
 const x=yb413Upcoming(7);
 el.innerHTML=x.length?`<table class="flow7-table"><thead><tr><th>Date</th><th>Flow</th><th>Amount</th></tr></thead><tbody>${x.map(f=>`<tr><td>${f.when.toLocaleDateString('en-SG',{day:'2-digit',month:'short'})}</td><td>${yb49Escape(f.name)}${f.inferred?' <span class="muted">(statement estimate)</span>':''}</td><td class="amount ${f.type}">${f.type==='in'?'+':'−'}${money(f.amount)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No dated planned or detected recurring flows in the next 7 days. Historical category averages may still affect the balance forecast.</p>';
};
renderUpcoming=function(){
 const x=yb413Upcoming(30),all=yb413AllEvents(ybToday(),new Date(ybToday().getTime()+30*86400000));
 const net=all.reduce((s,f)=>s+(f.type==='in'?+f.amount:-f.amount),0);
 if($('#kUpcoming'))$('#kUpcoming').textContent=money(net);
 if($('#upcoming'))$('#upcoming').innerHTML=x.slice(0,12).map(f=>`<div class="row"><div><b>${yb49Escape(f.name)}</b><div class="muted">${f.when.toLocaleDateString()}${f.inferred?' · statement estimate':''}</div></div><b class="amount ${f.type}">${f.type==='in'?'+':'−'}${money(f.amount)}</b></div>`).join('')||'<p class="muted">No dated flows detected. Historical averages can still affect the forecast.</p>';
};
const yb413ForecastBefore=forecastSeries;
forecastSeries=function(days=S.forecastHorizon,withScenarios=true){
 if(S.mode!=='detailed')return yb413ForecastBefore(days,withScenarios);
 // Existing v4.12 historical forecast is opt-in. Prevent it from adding the
 // same category run-rates again: compute the old plan/scenario series with it disabled.
 const old=S.categoryForecastEnabled;S.categoryForecastEnabled=false;
 let result;
 try{result=yb413ForecastBefore(days,withScenarios)}finally{S.categoryForecastEnabled=old;}
 const start=ybToday(),end=new Date(start);end.setDate(end.getDate()+days);
 const inferred=yb413ProjectedEvents(start,end);
 const events=[...inferred.discrete.filter(f=>f.source==='inferred'),...inferred.baseline];
 const changes=new Map();
 for(const f of events){const k=isoLocal(f.when);changes.set(k,(changes.get(k)||0)+(f.type==='in'?+f.amount:-f.amount));}
 let offset=0;
 result.points=result.points.map(pt=>{offset+=changes.get(isoLocal(pt.date))||0;return {...pt,balance:pt.balance+offset};});
 result.endBalance=result.points.at(-1)?.balance??result.endBalance;
 result.low=result.points.reduce((a,b)=>b.balance<a.balance?{balance:b.balance,date:b.date}:a,{balance:Infinity,date:start});
 return result;
};
// Enrich detected recurring candidates with the original transaction category.
const yb413RecurrencesBefore=yb48Recurrences;
yb48Recurrences=function(){
 const candidates=yb413RecurrencesBefore();
 return candidates.map(c=>{
   const t=[...S.tx].reverse().find(t=>(t.merchant||t.desc||'').trim().replace(/\s+/g,' ').toLowerCase()===c.name.toLowerCase()&&(t.amount>0?'in':'out')===c.type);
   return {...c,category:t?.category||''};
 });
};
// Keep the v4.12 optional checkbox as a visible indicator of the new default behavior.
const yb413ForecastPageBefore=renderForecastPage;
renderForecastPage=function(){
 yb413ForecastPageBefore();
 const el=$('#yb412ForecastCategories');
 if(el&&S.mode==='detailed')el.innerHTML='';
};
const yb413RenderBefore=render;
render=function(){yb413RenderBefore();dashboardKPIs();actualBudget();renderUpcoming();renderUpcoming7();renderForecastPage();};
render();

// YouBudget v4.15 — enforce strict plan-only Basic edition presentation.
// Imported transactions remain stored locally, but are not included or shown in Basic.
function yb415BasicOnly(){
 const basic=S.mode==='basic';document.body.classList.toggle('yb-basic-only',basic);
 const pages=['transactions','import','insights','rules'];
 for(const id of pages){
   const page=document.getElementById(id);
   if(page)page.classList.toggle('yb415-transactions-only',basic);
   document.querySelectorAll(`[data-page="${id}"]`).forEach(x=>x.classList.toggle('yb415-transactions-only',basic));
 }
 // Dashboard sections sourced solely from imported transactions.
 for(const id of ['recent','cats']){const el=document.getElementById(id);if(el){const panel=el.closest('.panel');if(panel)panel.classList.toggle('yb415-transactions-only',basic);}}
 const catsPeriod=document.getElementById('catsPeriod');if(catsPeriod&&basic)catsPeriod.textContent='';
 // Forecast comparison and suggestions depend on actual transaction data.
 for(const id of ['planActual','recurringSuggestions','multiplierPanel','yb412ForecastCategories']){const el=document.getElementById(id);if(el){const panel=el.closest('.panel');if(panel&&id!=='yb412ForecastCategories')panel.classList.toggle('yb415-transactions-only',basic);else el.classList.toggle('yb415-transactions-only',basic);}}
 // If the user switches from Advanced while a transaction page is active,
 // return to Dashboard rather than leaving a hidden page selected.
 const active=document.querySelector('section.page.active');
 if(basic&&active&&pages.includes(active.id)){
   active.classList.remove('active');document.getElementById('dashboard')?.classList.add('active');
   document.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page==='dashboard'));
 }
 // Basic chart and summaries already use planInstancesRange/monthMetrics.
 // The plan-only forecast is selected by the existing mode guard in forecastSeries.
}
const yb415RenderBefore=render;
render=function(){yb415RenderBefore();yb415BasicOnly();};
render();

// v4.15.1 — final Basic-edition guard for Monthly Overview.
// Earlier dashboard render wrappers may reintroduce transaction-derived values.
// Apply this *after* all dashboard calculations, using scheduled plan occurrences only.
function yb4151BasicMonthlyOverview(){
  if(S.mode!=='basic')return;
  const now=new Date();
  const first=new Date(now.getFullYear(),now.getMonth(),1);
  const last=new Date(now.getFullYear(),now.getMonth()+1,0,23,59,59);
  const planned=planInstancesRange(first,last);
  const sum=(type,oneOff)=>planned.filter(f=>f.type===type && (f.frequency==='once')===oneOff).reduce((s,f)=>s+(Number(f.amount)||0),0);
  const income=sum('in',false),out=sum('out',false),oneOffOut=sum('out',true);
  const oneOffIn=sum('in',true);
  const net=income-out;
  const fields={kIn:income,kOut:out,kNet:net,monthOne:oneOffOut,monthTotal:net+oneOffIn-oneOffOut};
  for(const [id,value] of Object.entries(fields)){
    const el=document.getElementById(id);if(el)el.textContent=money(value);
  }
  const note=document.getElementById('modeNote');if(note)note.textContent='Cash-flow plan only · current calendar month';
}
const yb4151RenderPrevious=render;
render=function(){yb4151RenderPrevious();yb4151BasicMonthlyOverview();};
yb4151BasicMonthlyOverview();
