/* YouBudget v4.7 internationalization foundation. Financial data stays local. */
(()=>{
'use strict';
const LANGS={"en": "English", "id": "Bahasa Indonesia", "th": "ไทย", "vi": "Tiếng Việt", "hi": "हिन्दी", "pt-BR": "Português (Brasil)", "pt": "Português", "es": "Español", "fr": "Français", "de": "Deutsch", "it": "Italiano", "nl": "Nederlands", "ja": "日本語", "zh-Hans": "简体中文", "zh-Hant": "繁體中文", "ko": "한국어", "ms": "Bahasa Melayu", "fil": "Filipino", "ar": "العربية", "pl": "Polski", "cs": "Čeština", "hu": "Magyar", "ro": "Română", "sv": "Svenska", "no": "Norsk", "da": "Dansk", "af": "Afrikaans", "el": "Ελληνικά", "bn": "বাংলা", "ta": "தமிழ்", "te": "తెలుగు", "mr": "मराठी"};
const MARKET={"USD": ["en-US", "en"], "EUR": ["de-DE", "de"], "GBP": ["en-GB", "en"], "JPY": ["ja-JP", "ja"], "SGD": ["en-SG", "en"], "AUD": ["en-AU", "en"], "CAD": ["en-CA", "en"], "CHF": ["de-CH", "de"], "CNY": ["zh-CN", "zh-Hans"], "HKD": ["zh-HK", "zh-Hant"], "INR": ["hi-IN", "hi"], "KRW": ["ko-KR", "ko"], "NZD": ["en-NZ", "en"], "SEK": ["sv-SE", "sv"], "NOK": ["nb-NO", "no"], "DKK": ["da-DK", "da"], "PLN": ["pl-PL", "pl"], "CZK": ["cs-CZ", "cs"], "HUF": ["hu-HU", "hu"], "RON": ["ro-RO", "ro"], "AED": ["ar-AE", "ar"], "SAR": ["ar-SA", "ar"], "THB": ["th-TH", "th"], "MYR": ["ms-MY", "ms"], "IDR": ["id-ID", "id"], "PHP": ["fil-PH", "fil"], "VND": ["vi-VN", "vi"], "ZAR": ["en-ZA", "en"], "BRL": ["pt-BR", "pt-BR"], "MXN": ["es-MX", "es"]};
const ID={"Dashboard": "Dasbor", "Forecast & scenarios": "Prakiraan & skenario", "Spending insights": "Analisis pengeluaran", "Cash-flow plan": "Rencana arus kas", "Import": "Impor", "Transactions": "Transaksi", "Calendar": "Kalender", "Categories & rules": "Kategori & aturan", "Settings": "Pengaturan", "About": "Tentang", "Pricing": "Harga", "Share YouBudget": "Bagikan YouBudget", "Start planning free": "Mulai merencanakan gratis", "Explore a demo": "Lihat demo", "Your cash flow at a glance": "Ringkasan arus kas Anda", "Preferences": "Preferensi", "Currency": "Mata uang", "Language & region": "Bahasa & wilayah", "Language": "Bahasa", "Use browser locale": "Gunakan bahasa browser", "Change first-use preferences": "Ubah preferensi awal", "Monthly cash flow": "Arus kas bulanan", "Monthly net flow": "Arus kas bersih bulanan", "Projected balance": "Perkiraan saldo", "Recurring suggestions": "Saran pengeluaran berulang", "No account or server required.": "Tidak perlu akun atau server.", "Know what your money": "Ketahui kondisi keuangan Anda", "looks like tomorrow": "untuk hari esok", "PERSONAL CASH-FLOW PLANNING": "PERENCANAAN ARUS KAS PRIBADI", "YOUR NEXT 30 DAYS": "30 HARI KE DEPAN", "Cash outlook": "Perkiraan kas", "Today": "Hari ini", "Simple • Private • Customisable": "Sederhana • Privat • Fleksibel", "Basic — cash planner": "Dasar — perencana kas", "Advanced — statements + budget": "Lanjutan — laporan & anggaran", "Back to Home": "Kembali ke Beranda", "Welcome to YouBudget": "Selamat datang di YouBudget", "Continue": "Lanjutkan", "Use my browser’s language and region": "Gunakan bahasa dan wilayah browser", "Get started": "Mulai", "SIMPLE PRICING": "HARGA SEDERHANA", "MONTHLY": "BULANAN", "YEARLY · SAVE $10": "TAHUNAN · HEMAT $10", "Explore YouBudget": "Jelajahi YouBudget", "Feature description": "Deskripsi fitur"};
const KEY='youbudget.i18n.v1';
const currencyCodes=Object.keys(MARKET);
const languageCodes=Object.keys(LANGS);
const q=s=>document.querySelector(s);
const regionMap={'US':'USD','GB':'GBP','JP':'JPY','SG':'SGD','AU':'AUD','CA':'CAD','CH':'CHF','CN':'CNY','HK':'HKD','IN':'INR','KR':'KRW','NZ':'NZD','SE':'SEK','NO':'NOK','DK':'DKK','PL':'PLN','CZ':'CZK','HU':'HUF','RO':'RON','AE':'AED','SA':'SAR','TH':'THB','MY':'MYR','ID':'IDR','PH':'PHP','VN':'VND','ZA':'ZAR','BR':'BRL','MX':'MXN'};
for(const r of ['DE','FR','ES','IT','PT','NL','GR','IE','BE','AT','FI'])regionMap[r]='EUR';
function supportedLanguage(tag){
 const s=String(tag||'').toLowerCase();
 if(s.startsWith('pt-br'))return 'pt-BR';
 if(s.startsWith('zh-hant')||/^zh-(tw|hk|mo)/.test(s))return 'zh-Hant';
 if(s.startsWith('zh'))return 'zh-Hans';
 const key=languageCodes.find(k=>k.toLowerCase()===s)||languageCodes.find(k=>s===k.toLowerCase().split('-')[0]||s.startsWith(k.toLowerCase()+'-'));
 return key||null;
}
function detect(){
 const tags=navigator.languages?.length?navigator.languages:[navigator.language||'en-US'];
 const language=tags.map(supportedLanguage).find(Boolean)||'en';
 let currency='USD';
 for(const tag of tags){
  try {const region=new Intl.Locale(tag).maximize().region; if(regionMap[region]){currency=regionMap[region];break;}}catch(e){}
 }
 return {language,currency};
}
let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){saved=null}
const inferred=detect();
let prefs=saved||{language:inferred.language,currency:inferred.currency,automatic:true};
if(!LANGS[prefs.language])prefs.language='en';
if(!currencyCodes.includes(prefs.currency))prefs.currency='USD';
function setPrefs(next,saveIt=true){
 prefs={...prefs,...next};
 if(prefs.automatic){const x=detect();prefs.language=x.language;prefs.currency=x.currency}
 if(!LANGS[prefs.language])prefs.language='en';
 if(!currencyCodes.includes(prefs.currency))prefs.currency='USD';
 if(saveIt)localStorage.setItem(KEY,JSON.stringify(prefs));
 document.documentElement.lang=prefs.language;
 document.documentElement.dir=prefs.language==='ar'?'rtl':'ltr';
 if(typeof S!=='undefined'&&typeof save==='function'){S.currency=prefs.currency;save();if(typeof render==='function')render()}
 updateUI();
}
const originals=new WeakMap();
function translate(root=document){
 const nodes=root.querySelectorAll?root.querySelectorAll('h1,h2,h3,h4,p,button,a,label,option,th,small,.eyebrow,.trust,.tag,.privacy,.subtitle,.marketing-lead,.story-copy,.price'): [];
 nodes.forEach(el=>{
  if(el.closest('#localeWelcome')||el.closest('.locale-settings'))return;
  if(el.children.length && [...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).length===0)return;
  for(const node of el.childNodes){
   if(node.nodeType!==3||!node.textContent.trim())continue;
   if(!originals.has(node))originals.set(node,node.textContent);
   const orig=originals.get(node),trim=orig.trim();
   const translated=prefs.language==='id'?(ID[trim]||trim):trim;
   if(translated!==trim||node.textContent!==orig)node.textContent=orig.replace(trim,translated);
  }
 });
}
function currencyOptions(select){
 if(!select)return;
 select.innerHTML=currencyCodes.map(code=>'<option value="'+code+'">'+code+' — '+new Intl.DisplayNames([prefs.language],{type:'currency'}).of(code)+'</option>').join('');
 select.value=prefs.currency;
}
function languageOptions(select){
 if(!select)return;
 select.innerHTML=languageCodes.map(code=>'<option value="'+code+'">'+LANGS[code]+'</option>').join('');
 select.value=prefs.language;
}
function updateUI(){
 ['#languageSelect','#welcomeLanguage'].forEach(s=>languageOptions(q(s)));
 ['#welcomeCurrency'].forEach(s=>currencyOptions(q(s)));
 if(q('#currencySelect'))q('#currencySelect').value=prefs.currency;
 if(q('#autoLocale'))q('#autoLocale').checked=!!prefs.automatic;
 if(q('#welcomeAuto'))q('#welcomeAuto').checked=!!prefs.automatic;
 translate();
}
if(q('#languageSelect'))q('#languageSelect').addEventListener('change',e=>setPrefs({language:e.target.value,automatic:false}));
if(q('#currencySelect'))q('#currencySelect').addEventListener('change',e=>setPrefs({currency:e.target.value,automatic:false}));
if(q('#autoLocale'))q('#autoLocale').addEventListener('change',e=>setPrefs({automatic:e.target.checked}));
if(q('#welcomeLanguage'))q('#welcomeLanguage').addEventListener('change',e=>{prefs.language=e.target.value;prefs.automatic=false;q('#welcomeAuto').checked=false});
if(q('#welcomeCurrency'))q('#welcomeCurrency').addEventListener('change',e=>{prefs.currency=e.target.value;prefs.automatic=false;q('#welcomeAuto').checked=false});
if(q('#welcomeAuto'))q('#welcomeAuto').addEventListener('change',e=>{prefs.automatic=e.target.checked;if(e.target.checked){Object.assign(prefs,detect());updateUI()}});
const welcome=q('#localeWelcome');
function showWelcome(){if(welcome){updateUI();welcome.classList.remove('hidden')}}
if(q('#reopenLocale'))q('#reopenLocale').addEventListener('click',showWelcome);
if(q('#welcomeContinue'))q('#welcomeContinue').addEventListener('click',()=>{setPrefs({...prefs});welcome.classList.add('hidden')});
if(!saved&&welcome)showWelcome();
else setPrefs({...prefs},false);
// Ensure user-entered transaction/category/merchant values are never translated.
window.YouBudgetI18n={get preferences(){return {...prefs}},languages:LANGS,markets:MARKET,detect,setPreferences:setPrefs,translate};
})();
