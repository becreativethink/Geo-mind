/* GeoMind v6 — clean rewrite
   - Multi-provider AI router (Gemini, OpenAI, Anthropic, Mistral, OpenRouter, HuggingFace)
   - Plan + usage tracking enforced server-side via Firebase rules (see firebase-rules.json)
   - DOCX export, history, compare, chat
*/
(function(){
'use strict';

if (!window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey === 'REPLACE_ME') {
  document.getElementById('fbErrBanner').hidden = false;
  document.getElementById('fbErrBanner').textContent = '⚠️ Edit firebase-config.js with your Firebase credentials.';
}

firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db   = firebase.database();

/* ---------- Models catalog ---------- */
const AI_MODELS = [
  { id:'gemini-2.0-flash',           provider:'gemini',    label:'Gemini 2.0 Flash',     desc:'Fast & powerful' },
  { id:'gemini-1.5-flash',           provider:'gemini',    label:'Gemini 1.5 Flash',     desc:'Recommended default' },
  { id:'gemini-1.5-pro',             provider:'gemini',    label:'Gemini 1.5 Pro',       desc:'High accuracy' },
  { id:'gpt-4o-mini',                provider:'openai',    label:'GPT-4o mini',          desc:'Fast & cheap OpenAI' },
  { id:'gpt-4o',                     provider:'openai',    label:'GPT-4o',               desc:'OpenAI flagship' },
  { id:'gpt-4.1-mini',               provider:'openai',    label:'GPT-4.1 mini',         desc:'Latest OpenAI mini' },
  { id:'claude-3-5-sonnet-20241022', provider:'anthropic', label:'Claude 3.5 Sonnet',    desc:'Anthropic flagship' },
  { id:'claude-3-haiku-20240307',    provider:'anthropic', label:'Claude 3 Haiku',       desc:'Fast Anthropic' },
  { id:'mistral-large-latest',       provider:'mistral',   label:'Mistral Large',        desc:'Mistral flagship' },
  { id:'mistral-small-latest',       provider:'mistral',   label:'Mistral Small',        desc:'Mistral fast' },
  { id:'meta-llama/llama-3-70b-instruct', provider:'openrouter', label:'Llama 3 70B (OpenRouter)', desc:'Meta via OpenRouter' },
  { id:'deepseek/deepseek-chat',     provider:'openrouter', label:'DeepSeek Chat',       desc:'DeepSeek via OpenRouter' },
];
const PROVIDER_LABELS = {
  gemini:'🔵 Gemini', openai:'🟢 OpenAI', anthropic:'🟠 Anthropic',
  mistral:'🟣 Mistral', openrouter:'⚫ OpenRouter', huggingface:'🤗 HuggingFace'
};

/* ---------- Plans ---------- */
const PLANS = {
  free_trial:{ name:'Free Trial', price:'₹0 / 14 days', reportLimit:5,  chatLimit:8,  compareLimit:2,  durationDays:14 },
  starter:   { name:'Starter',    price:'₹149/mo',       reportLimit:12, chatLimit:20, compareLimit:5,  durationDays:30 },
  standard:  { name:'Standard',   price:'₹249/mo',       reportLimit:25, chatLimit:40, compareLimit:12, durationDays:30 },
  premium:   { name:'Premium',    price:'₹399/mo',       reportLimit:50, chatLimit:60, compareLimit:20, durationDays:30 },
};

/* ---------- State ---------- */
let currentUser = null;
let userProfile = null;
let userSettings = { model:'gemini-1.5-flash', apiKey:'' };
let adminKeys = {};       // {gemini:'...', openai:'...', ...}
let adminModelOverride = null;
let lastReport = null;

/* ---------- UI helpers ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
function toast(msg, kind='ok', ms=3000){
  const t = $('#toast'); t.textContent = msg; t.className = 'toast '+kind; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(()=>t.hidden=true, ms);
}
function setMsg(el, text, kind=''){ el.className='msg '+kind; el.textContent = text; }

/* ---------- Auth ---------- */
$('#btnLogin').onclick = async () => {
  const e=$('#authEmail').value.trim(), p=$('#authPass').value;
  if(!e||!p) return setMsg($('#authMsg'),'Enter email & password','err');
  try{ await auth.signInWithEmailAndPassword(e,p); }
  catch(err){ setMsg($('#authMsg'), err.message, 'err'); }
};
$('#btnSignup').onclick = async () => {
  const e=$('#authEmail').value.trim(), p=$('#authPass').value;
  if(!e||p.length<6) return setMsg($('#authMsg'),'Password must be 6+ chars','err');
  try{ await auth.createUserWithEmailAndPassword(e,p); }
  catch(err){ setMsg($('#authMsg'), err.message, 'err'); }
};
$('#btnReset').onclick = async () => {
  const e=$('#authEmail').value.trim();
  if(!e) return setMsg($('#authMsg'),'Enter your email first','err');
  try{ await auth.sendPasswordResetEmail(e); setMsg($('#authMsg'),'Reset email sent','ok'); }
  catch(err){ setMsg($('#authMsg'), err.message, 'err'); }
};
$('#btnLogout').onclick = () => auth.signOut();

auth.onAuthStateChanged(async user => {
  if (!user) {
    $('#authScreen').hidden = false;
    $('#appScreen').hidden  = true;
    return;
  }
  currentUser = user;
  $('#authScreen').hidden = true;
  $('#appScreen').hidden  = false;
  $('#userName').textContent = user.email;
  await loadProfile();
  await loadSettings();
  await loadAdminConfig();
  buildModelSelector();
  renderUsage();
  renderPlanTab();
  renderHistory();
});

/* ---------- Profile + settings ---------- */
async function loadProfile(){
  const snap = await db.ref('users/'+currentUser.uid+'/profile').once('value');
  if (snap.exists()) { userProfile = snap.val(); }
  else {
    userProfile = {
      email: currentUser.email,
      displayName: currentUser.email.split('@')[0],
      plan: 'free_trial',
      planStart: Date.now(),
      planEnd: Date.now() + 14*86400000,
      reportsUsed: 0, chatsUsed: 0, comparesUsed: 0,
      totalReports: 0, totalChats: 0, totalCompares: 0,
      createdAt: Date.now()
    };
    await db.ref('users/'+currentUser.uid+'/profile').set(userProfile);
  }
  // expire trial
  if (userProfile.plan === 'free_trial' && Date.now() > (userProfile.planEnd||0)) {
    toast('Your free trial has ended. Please upgrade.', 'warn', 5000);
  }
}
async function saveProfile(patch){
  Object.assign(userProfile, patch);
  await db.ref('users/'+currentUser.uid+'/profile').update(patch);
}
async function loadSettings(){
  const snap = await db.ref('users/'+currentUser.uid+'/settings').once('value');
  if (snap.exists()) userSettings = Object.assign(userSettings, snap.val());
  $('#setName').value  = userProfile.displayName||'';
  $('#setKey').value   = userSettings.apiKey||'';
}
async function loadAdminConfig(){
  try{
    const snap = await db.ref('adminConfig/providerKeys').once('value');
    if (snap.exists()) adminKeys = snap.val()||{};
    const m = await db.ref('adminConfig/defaultModel').once('value');
    if (m.exists()) adminModelOverride = m.val();
  } catch(e){ console.warn('admin config read blocked (ok if rules deny)', e); }
}

/* ---------- Settings save ---------- */
$('#btnSaveSettings').onclick = async () => {
  const name = $('#setName').value.trim();
  const model = $('#setModel').value;
  const key   = $('#setKey').value.trim();
  userSettings.model = model;
  userSettings.apiKey = key;
  await db.ref('users/'+currentUser.uid+'/settings').set(userSettings);
  await saveProfile({ displayName: name||userProfile.displayName });
  toast('Settings saved');
};
$('#btnExport').onclick = async () => {
  const snap = await db.ref('users/'+currentUser.uid).once('value');
  const blob = new Blob([JSON.stringify(snap.val()||{}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'geomind-data.json'; a.click();
};
$('#btnDelete').onclick = async () => {
  if(!confirm('Delete your account and all data? This cannot be undone.')) return;
  try{
    await db.ref('users/'+currentUser.uid).remove();
    await currentUser.delete();
    toast('Account deleted');
  } catch(e){ toast('Re-login required: '+e.message, 'err'); }
};

/* ---------- Tabs ---------- */
$$('.tab').forEach(t => t.onclick = () => {
  $$('.tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  const id = t.dataset.tab;
  $$('.tab-panel').forEach(p => p.hidden = (p.id !== 'tab-'+id));
  if (id==='history') renderHistory();
  if (id==='plan') renderPlanTab();
});

/* ---------- Model selector ---------- */
function buildModelSelector(){
  const sel = $('#setModel'); sel.innerHTML='';
  const groups = {};
  AI_MODELS.forEach(m => { (groups[m.provider]=groups[m.provider]||[]).push(m); });
  Object.entries(groups).forEach(([prov, list]) => {
    const og = document.createElement('optgroup');
    og.label = PROVIDER_LABELS[prov]||prov;
    list.forEach(m => {
      const o = document.createElement('option');
      o.value = m.id; o.textContent = m.label; og.appendChild(o);
    });
    sel.appendChild(og);
  });
  sel.value = userSettings.model;
  sel.onchange = () => {
    const m = AI_MODELS.find(x=>x.id===sel.value);
    $('#modelDesc').textContent = m ? (PROVIDER_LABELS[m.provider]+' — '+m.desc) : '';
  };
  sel.onchange();
}

/* ---------- Usage widget ---------- */
function renderUsage(){
  const p = PLANS[userProfile.plan] || PLANS.free_trial;
  const w = $('#usageWidget');
  const own = userSettings.apiKey ? ' (own key — unlimited)' : '';
  w.innerHTML = `
    <span class="pill">Plan: <b>${p.name}</b>${own}</span>
    <span class="pill">Reports: ${userProfile.reportsUsed||0}/${p.reportLimit}</span>
    <span class="pill">Chats: ${userProfile.chatsUsed||0}/${p.chatLimit}</span>
    <span class="pill">Compares: ${userProfile.comparesUsed||0}/${p.compareLimit}</span>
  `;
}

/* ---------- Plan tab ---------- */
function renderPlanTab(){
  const p = PLANS[userProfile.plan]||PLANS.free_trial;
  const end = userProfile.planEnd ? new Date(userProfile.planEnd).toLocaleDateString() : '—';
  $('#planInfo').innerHTML = `<p>You are on <b>${p.name}</b>. Active until <b>${end}</b>.</p>
    <p class="muted small">To upgrade, contact the admin or use the admin dashboard.</p>`;
  const grid = $('#planGrid'); grid.innerHTML='';
  Object.entries(PLANS).forEach(([k,pl])=>{
    const c = document.createElement('div');
    c.className = 'plan-card' + (k===userProfile.plan?' active':'');
    c.innerHTML = `<h4>${pl.name}</h4><div class="price">${pl.price}</div>
      <ul><li>${pl.reportLimit} reports</li><li>${pl.chatLimit} chats</li><li>${pl.compareLimit} comparisons</li><li>${pl.durationDays} days</li></ul>`;
    grid.appendChild(c);
  });
}

/* ---------- Quota check ---------- */
function checkQuota(kind){
  if (userSettings.apiKey) return true; // own key bypass
  const p = PLANS[userProfile.plan]||PLANS.free_trial;
  if (Date.now() > (userProfile.planEnd||0)) { toast('Plan expired — please renew', 'err'); return false; }
  if (kind==='report'  && (userProfile.reportsUsed||0)  >= p.reportLimit)  { toast('Report limit reached','err'); return false; }
  if (kind==='chat'    && (userProfile.chatsUsed||0)    >= p.chatLimit)    { toast('Chat limit reached','err'); return false; }
  if (kind==='compare' && (userProfile.comparesUsed||0) >= p.compareLimit) { toast('Compare limit reached','err'); return false; }
  return true;
}
async function bumpUsage(kind){
  const map = { report:['reportsUsed','totalReports'], chat:['chatsUsed','totalChats'], compare:['comparesUsed','totalCompares'] };
  const [u,t] = map[kind];
  const patch = {}; patch[u] = (userProfile[u]||0)+1; patch[t] = (userProfile[t]||0)+1;
  await saveProfile(patch);
  renderUsage();
}

/* ---------- AI router ---------- */
async function callAI(prompt, opts={}){
  const modelId = adminModelOverride || userSettings.model;
  const m = AI_MODELS.find(x=>x.id===modelId) || AI_MODELS[0];
  const provider = m.provider;
  const userKey = userSettings.apiKey;
  const adminKey = adminKeys[provider];
  const key = userKey || adminKey;
  if (!key) throw new Error(`No API key configured for ${provider}. Add your own key in Settings, or ask admin to add one.`);
  const sys = opts.system || 'You are GeoMind, a careful UPSC-prep assistant. Answer in clear, well-structured markdown.';

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m.id}:generateContent?key=${encodeURIComponent(key)}`;
    const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents:[{role:'user', parts:[{text: sys+'\n\n'+prompt}]}] }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || 'Gemini error');
    return j.candidates?.[0]?.content?.parts?.[0]?.text || '(empty)';
  }
  if (provider === 'openai' || provider === 'openrouter') {
    const url = provider==='openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';
    const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body: JSON.stringify({ model: m.id, messages:[{role:'system',content:sys},{role:'user',content:prompt}] }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || (provider+' error'));
    return j.choices?.[0]?.message?.content || '(empty)';
  }
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body: JSON.stringify({ model:m.id, max_tokens:2048, system:sys, messages:[{role:'user',content:prompt}] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || 'Anthropic error');
    return j.content?.[0]?.text || '(empty)';
  }
  if (provider === 'mistral') {
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body: JSON.stringify({ model:m.id, messages:[{role:'system',content:sys},{role:'user',content:prompt}] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || j.message || 'Mistral error');
    return j.choices?.[0]?.message?.content || '(empty)';
  }
  if (provider === 'huggingface') {
    const r = await fetch('https://api-inference.huggingface.co/models/'+encodeURIComponent(m.id), {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body: JSON.stringify({ inputs: sys+'\n\n'+prompt, parameters:{max_new_tokens:1024} })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'HuggingFace error');
    return Array.isArray(j) ? (j[0]?.generated_text||'(empty)') : (j.generated_text||'(empty)');
  }
  throw new Error('Unknown provider: '+provider);
}

/* ---------- Markdown -> HTML (tiny) ---------- */
function mdToHtml(md){
  let h = md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.*)$/gm,'<h3>$1</h3>')
    .replace(/^## (.*)$/gm,'<h2>$1</h2>')
    .replace(/^# (.*)$/gm,'<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')
    .replace(/\*(.+?)\*/g,'<i>$1</i>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m=>'<ul>'+m+'</ul>');
  return h.replace(/\n{2,}/g,'<br><br>');
}

/* ---------- Ask ---------- */
$('#btnAsk').onclick = async () => {
  const q = $('#askInput').value.trim();
  if (!q) return toast('Enter a topic','warn');
  if (!checkQuota('report')) return;
  const lang = $('#askLang').value;
  const sys = lang==='hi' ? 'आप GeoMind हैं। UPSC प्रश्नों का स्पष्ट हिंदी मार्कडाउन उत्तर दें।' : null;
  const prompt = `Topic: ${q}\n\nProduce a structured report with sections: Overview, Background, Key facts, Important data, UPSC angle, Conclusion.`;
  $('#askOut').innerHTML = '<i>Generating…</i>';
  $('#btnAsk').disabled = true;
  try {
    const txt = await callAI(prompt, sys?{system:sys}:{});
    lastReport = { topic:q, text:txt, ts:Date.now(), lang };
    $('#askOut').innerHTML = mdToHtml(txt);
    $('#btnDownload').hidden = false;
    await bumpUsage('report');
    await db.ref('users/'+currentUser.uid+'/history/reports').push(lastReport);
  } catch(e){ $('#askOut').innerHTML = '<span style="color:#ff8888">'+e.message+'</span>'; }
  finally { $('#btnAsk').disabled = false; }
};

$('#btnDownload').onclick = () => {
  if (!lastReport) return;
  const html = `<html><head><meta charset="utf-8"><title>${lastReport.topic}</title></head>
    <body><h1>${lastReport.topic}</h1>${mdToHtml(lastReport.text)}</body></html>`;
  const blob = new Blob(['\ufeff', html], {type:'application/msword'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = lastReport.topic.replace(/[^a-z0-9]+/gi,'_').slice(0,40)+'.doc';
  a.click();
};

/* ---------- Chat ---------- */
const chatHistory = [];
$('#btnChat').onclick = async () => {
  const q = $('#chatInput').value.trim();
  if (!q) return;
  if (!checkQuota('chat')) return;
  $('#chatInput').value = '';
  appendBubble('u', q);
  chatHistory.push({role:'user', content:q});
  const ph = appendBubble('a', '…');
  try{
    const prompt = chatHistory.map(m=>(m.role==='user'?'User: ':'Assistant: ')+m.content).join('\n\n') + '\nAssistant:';
    const reply = await callAI(prompt);
    ph.textContent = reply;
    chatHistory.push({role:'assistant', content:reply});
    await bumpUsage('chat');
    await db.ref('users/'+currentUser.uid+'/history/chats').push({q, a:reply, ts:Date.now()});
  } catch(e){ ph.textContent = '⚠ '+e.message; }
};
$('#chatInput').addEventListener('keydown', e=>{ if(e.key==='Enter') $('#btnChat').click(); });
function appendBubble(kind, text){
  const div = document.createElement('div');
  div.className = 'bubble '+kind;
  div.textContent = text;
  $('#chatLog').appendChild(div);
  $('#chatLog').scrollTop = 1e9;
  return div;
}

/* ---------- Compare ---------- */
$('#btnCompare').onclick = async () => {
  const a=$('#cmpA').value.trim(), b=$('#cmpB').value.trim();
  if (!a||!b) return toast('Enter both topics','warn');
  if (!checkQuota('compare')) return;
  $('#cmpOut').innerHTML='<i>Comparing…</i>';
  try{
    const txt = await callAI(`Compare "${a}" vs "${b}" in a markdown table with rows: Definition, Location, Significance, UPSC relevance, Key difference. Then a 4-line summary.`);
    $('#cmpOut').innerHTML = mdToHtml(txt);
    await bumpUsage('compare');
    await db.ref('users/'+currentUser.uid+'/history/compares').push({a,b,text:txt,ts:Date.now()});
  } catch(e){ $('#cmpOut').innerHTML='<span style="color:#ff8888">'+e.message+'</span>'; }
};

/* ---------- History ---------- */
async function renderHistory(){
  const list = $('#historyList'); list.innerHTML = 'Loading…';
  const snap = await db.ref('users/'+currentUser.uid+'/history').once('value');
  const data = snap.val()||{};
  const all = [];
  Object.entries(data.reports||{}).forEach(([k,v])=>all.push({type:'Report',title:v.topic,ts:v.ts,body:v.text}));
  Object.entries(data.chats||{}).forEach(  ([k,v])=>all.push({type:'Chat',  title:v.q,    ts:v.ts,body:v.a}));
  Object.entries(data.compares||{}).forEach(([k,v])=>all.push({type:'Compare',title:`${v.a} vs ${v.b}`,ts:v.ts,body:v.text}));
  all.sort((x,y)=>y.ts-x.ts);
  if (!all.length) { list.innerHTML='<p class="muted">Nothing yet.</p>'; return; }
  list.innerHTML='';
  all.forEach(it => {
    const d = document.createElement('div');
    d.className = 'history-item';
    d.innerHTML = `<b>${it.type}</b> · ${new Date(it.ts).toLocaleString()}<br>${escapeHtml(it.title||'')}`;
    d.onclick = () => {
      const dlg = document.createElement('div');
      dlg.className='output';
      dlg.innerHTML = `<h3>${escapeHtml(it.title||'')}</h3>`+mdToHtml(it.body||'');
      d.replaceWith(dlg);
    };
    list.appendChild(d);
  });
}
function escapeHtml(s){return (s||'').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));}

})();
