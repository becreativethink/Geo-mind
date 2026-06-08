/* ════════════════════════════════════════════════════════════════
   GEOMIND v5 — MULTI-MODEL · ADMIN DASHBOARD · IMPROVED NAV
   Architecture:
   • Admin dashboard → separate admin-dashboard.html (password gated)
   • Multi-provider AI: Gemini, OpenAI, Anthropic, Mistral, OpenRouter
   • Monthly limits, DOCX downloads, 10+ model options
   • Firebase adminAPI/ stores keys — users cannot read/write
════════════════════════════════════════════════════════════════ */

/* ── FIREBASE CONFIG ─────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyD10aCUKg1YRao4bzCmOkiVpKV2HWqshz4",
  authDomain: "geogide-7d25e.firebaseapp.com",
  databaseURL: "https://geogide-7d25e-default-rtdb.firebaseio.com",
  projectId: "geogide-7d25e",
  storageBucket: "geogide-7d25e.firebasestorage.app",
  messagingSenderId: "55868267996",
  appId: "1:55868267996:web:e0f9174c1e6c5109670319"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();

/* ── Firebase readiness check ─────────────────────────────────── */
(function checkFirebaseReady() {
  if (typeof firebase === 'undefined' || !firebase.auth || !firebase.database) {
    const banner = document.getElementById('fbErrBanner');
    if (banner) banner.style.display = 'block';
    console.error('[GeoMind] Firebase failed to load — CDN may be blocked');
  } else {
    console.log('[GeoMind] Firebase ready ✓');
  }
})();

/* ── ADMIN UID WHITELIST ─────────────────────────────── */
/* Admin UID is stored in Firebase at adminConfig/adminUid  */
/* On load we compare currentUser.uid to this value         */
let isAdmin = false;

/* ── AI MODELS CATALOG ───────────────────────────────── */
/* Provider types: gemini | openai | anthropic | mistral | openrouter | zai */
const AI_MODELS = [
  // ── Google Gemini ──
  { id:'gemini-2.0-flash',              provider:'gemini',     label:'Gemini 2.0 Flash',           desc:'Latest Google model — fast & powerful' },
  { id:'gemini-2.0-flash-thinking-exp', provider:'gemini',     label:'Gemini 2.0 Flash Thinking',   desc:'Experimental reasoning model' },
  { id:'gemini-1.5-flash',              provider:'gemini',     label:'Gemini 1.5 Flash',            desc:'Fast, efficient — recommended for most users' },
  { id:'gemini-1.5-flash-8b',           provider:'gemini',     label:'Gemini 1.5 Flash-8B',         desc:'Lightweight, ultra-fast' },
  { id:'gemini-1.5-pro',                provider:'gemini',     label:'Gemini 1.5 Pro',              desc:'High accuracy — best for detailed reports' },
  { id:'gemini-pro',                    provider:'gemini',     label:'Gemini Pro (Classic)',         desc:'Reliable classic Gemini model' },
  // ── ChatGPT / OpenAI ──
  { id:'gpt-4.1',                       provider:'openai',     label:'GPT-4.1',                     desc:'OpenAI latest — most capable model' },
  { id:'gpt-4.1-mini',                  provider:'openai',     label:'GPT-4.1 Mini',                desc:'Fast & affordable GPT-4.1 variant' },
  { id:'gpt-4.1-nano',                  provider:'openai',     label:'GPT-4.1 Nano',                desc:'Smallest, fastest GPT-4.1 model' },
  { id:'gpt-4o',                        provider:'openai',     label:'GPT-4o',                      desc:'OpenAI flagship — fast & multimodal' },
  { id:'gpt-4o-mini',                   provider:'openai',     label:'GPT-4o Mini',                 desc:'Affordable OpenAI model — great balance' },
  { id:'o4-mini',                       provider:'openai',     label:'o4-mini',                     desc:'OpenAI reasoning model — fast & smart' },
  { id:'o3',                            provider:'openai',     label:'o3',                          desc:'OpenAI advanced reasoning — high accuracy' },
  { id:'o3-mini',                       provider:'openai',     label:'o3-mini',                     desc:'Compact reasoning model — efficient' },
  { id:'o1',                            provider:'openai',     label:'o1',                          desc:'OpenAI deep reasoning model' },
  { id:'o1-mini',                       provider:'openai',     label:'o1-mini',                     desc:'Compact o1 — fast reasoning' },
  { id:'gpt-4-turbo',                   provider:'openai',     label:'GPT-4 Turbo',                 desc:'High accuracy, long context' },
  { id:'gpt-3.5-turbo',                 provider:'openai',     label:'GPT-3.5 Turbo',               desc:'Fast and cost-effective' },
  // ── Z.ai (Yi + GLM models) ──
  { id:'yi-lightning',                  provider:'zai',        label:'Yi Lightning',                desc:'Z.ai fastest model — ultra-low latency' },
  { id:'yi-lightning-lite',             provider:'zai',        label:'Yi Lightning Lite',           desc:'Z.ai lightweight — fastest responses' },
  { id:'yi-large',                      provider:'zai',        label:'Yi Large',                    desc:'Z.ai flagship — highest quality' },
  { id:'yi-large-turbo',                provider:'zai',        label:'Yi Large Turbo',              desc:'Z.ai large model optimised for speed' },
  { id:'yi-large-preview',              provider:'zai',        label:'Yi Large Preview',            desc:'Z.ai latest preview model' },
  { id:'yi-medium',                     provider:'zai',        label:'Yi Medium',                   desc:'Z.ai balanced model — speed & quality' },
  { id:'yi-medium-200k',                provider:'zai',        label:'Yi Medium 200K',              desc:'Z.ai 200K context window model' },
  { id:'yi-spark',                      provider:'zai',        label:'Yi Spark',                    desc:'Z.ai compact everyday model' },
  { id:'yi-vision',                     provider:'zai',        label:'Yi Vision',                   desc:'Z.ai multimodal model with image support' },
  { id:'glm-5',                         provider:'zai',        label:'GLM-5',                       desc:'Zhipu AI GLM-5 — latest flagship GLM' },
  { id:'glm-4.7',                       provider:'zai',        label:'GLM-4.7',                     desc:'Zhipu AI GLM-4.7 — high capability' },
  { id:'glm-4.6',                       provider:'zai',        label:'GLM-4.6',                     desc:'Zhipu AI GLM-4.6 — balanced' },
  { id:'glm-4.5',                       provider:'zai',        label:'GLM-4.5',                     desc:'Zhipu AI GLM-4.5 — efficient' },
  { id:'glm-4.7-flash',                 provider:'zai',        label:'GLM-4.7 Flash',               desc:'Zhipu AI GLM-4.7 Flash — ultra-fast' },
  { id:'glm-4-6v',                      provider:'zai',        label:'GLM-4.6V',                    desc:'Zhipu AI GLM-4.6V — vision + language' },
  { id:'glm-4-32b',                     provider:'zai',        label:'GLM-4 32B',                   desc:'Zhipu AI GLM-4 32B — large context model' },
  // ── Anthropic ──
  { id:'claude-3-5-sonnet-20241022',    provider:'anthropic',  label:'Claude 3.5 Sonnet',           desc:'Anthropic flagship — excellent reasoning' },
  { id:'claude-3-haiku-20240307',       provider:'anthropic',  label:'Claude 3 Haiku',              desc:'Fast, efficient Anthropic model' },
  { id:'claude-3-sonnet-20240229',      provider:'anthropic',  label:'Claude 3 Sonnet',             desc:'Balanced Anthropic model' },
  { id:'claude-3-opus-20240229',        provider:'anthropic',  label:'Claude 3 Opus',               desc:'Most powerful Anthropic model' },
  // ── Mistral ──
  { id:'mistral-large-latest',          provider:'mistral',    label:'Mistral Large',               desc:'Flagship Mistral — high accuracy' },
  { id:'mistral-small-latest',          provider:'mistral',    label:'Mistral Small',               desc:'Fast, efficient Mistral model' },
  { id:'open-mistral-7b',               provider:'mistral',    label:'Mistral 7B',                  desc:'Compact open Mistral model' },
  { id:'open-mixtral-8x7b',             provider:'mistral',    label:'Mixtral 8x7B',                desc:'Mixture-of-experts architecture' },
  // ── OpenRouter ──
  { id:'meta-llama/llama-3-70b-instruct',             provider:'huggingface', label:'Llama 3 70B',          desc:'Meta open-source flagship — via HuggingFace' },
  { id:'meta-llama/llama-3-8b-instruct',              provider:'openrouter',  label:'Llama 3 8B',           desc:'Compact Meta model via OpenRouter' },
  { id:'google/gemma-2-9b-it',                        provider:'openrouter',  label:'Gemma 2 9B',           desc:'Google Gemma via OpenRouter' },
  { id:'google/gemma-2-27b-it',                       provider:'huggingface', label:'Gemma 2 27B',          desc:'Google Gemma 2 large — via HuggingFace' },
  { id:'deepseek/deepseek-chat',                      provider:'openrouter',  label:'DeepSeek Chat',        desc:'High-performance Chinese AI via OpenRouter' },
  { id:'Qwen/Qwen2.5-72B-Instruct',                   provider:'huggingface', label:'Qwen 2.5 72B',         desc:'Alibaba Qwen 2.5 flagship — via HuggingFace' },
  { id:'Qwen/Qwen2.5-7B-Instruct',                    provider:'huggingface', label:'Qwen 2.5 7B (HF)',     desc:'Alibaba Qwen 2.5 7B — fast & compact via HuggingFace' },
  { id:'qwen/qwen-2-72b-instruct',                    provider:'openrouter',  label:'Qwen 2 72B',           desc:'Alibaba Qwen 2 flagship via OpenRouter' },
  { id:'mistralai/Mixtral-8x7B-Instruct-v0.1',        provider:'huggingface', label:'Mixtral 8x7B',         desc:'Mistral mixture-of-experts — via HuggingFace' },
  { id:'mistralai/Mistral-7B-Instruct-v0.3',          provider:'huggingface', label:'Mistral 7B Instruct',  desc:'Fast open Mistral 7B — via HuggingFace' },
  { id:'microsoft/phi-3-medium-128k-instruct',        provider:'openrouter',  label:'Phi-3 Medium',         desc:'Microsoft Phi-3 via OpenRouter' },
  { id:'cohere/command-r-plus',                       provider:'openrouter',  label:'Command R+',           desc:'Cohere retrieval-optimized via OpenRouter' },
  // ── Bytez ──
  { id:'Qwen/Qwen2.5-7B',                              provider:'bytez',       label:'Qwen 2.5 7B',          desc:'Alibaba Qwen 2.5 7B — fast & efficient via Bytez' },
];

const PROVIDER_LABELS = {
  gemini:'🔵 Google Gemini', openai:'🟢 ChatGPT / OpenAI', anthropic:'🟠 Anthropic',
  mistral:'🟣 Mistral', openrouter:'⚫ OpenRouter', zai:'🟡 Z.ai (Yi + GLM Models)',
  huggingface:'🤗 HuggingFace', bytez:'⚡ Bytez'
};

/* ── PLAN DEFINITIONS ────────────────────────────────── */
const PLANS = {
  free_trial: { name:'Free Trial',    price:'₹0 / 14 days',genLimit:5,  chatLimit:8,  comparisonLimit:2,   duration:'14 Days',   activationDays:0, emoji:'🚀', color:'--pfree_trial',  tagline:'Experience GeoMind free for 14 days'  },
  starter:    { name:'Starter',       price:'₹149/mo',      genLimit:12, chatLimit:20, comparisonLimit:5,   duration:'Monthly',   activationDays:3, emoji:'★',  color:'--pbasic',       tagline:'Perfect for regular exam prep'        },
  standard:   { name:'Standard',      price:'₹249/mo',      genLimit:25, chatLimit:40, comparisonLimit:12,  duration:'Monthly',   activationDays:4, emoji:'✦',  color:'--pstd',         tagline:'The complete UPSC preparation toolkit'},
  premium:    { name:'Premium',       price:'₹399/mo',      genLimit:50, chatLimit:60, comparisonLimit:20,  duration:'Monthly',   activationDays:7, emoji:'♛',  color:'--pprem',        tagline:'Unlimited power for serious toppers'  },
  payperuse:  { name:'Pay Per Use',   price:'₹15/session',  genLimit:2,  chatLimit:3,  comparisonLimit:1,   duration:'24 Hours',  activationDays:0, emoji:'⚡', color:'--pcustom',      tagline:'Use once, pay once — no commitment'   }
};
const PLAN_FEATURES = {
  free_trial: ['No API key needed — instant start','5 reports · 8 chats · 2 comparisons','System-assigned AI (automatic)','Full feature access for 14 days','One-time offer — new users only','Auto-expires · no card needed'],
  starter:    ['12 AI reports / month','20 chat messages / month','5 comparisons / month','No API key needed','All learning modes (Quiz, Timeline)','History & sharing · Email support'],
  standard:   ['25 AI reports / month','40 chat messages / month','12 comparisons / month','No API key needed','Priority AI processing','All modes + comparison history','Chat support'],
  premium:    ['50 AI reports / month','60 chat messages / month','20 comparisons / month','No API key needed','Dual admin keys — max reliability','Fastest AI · 24/7 priority support','Download reports (PDF / DOCX)','Dedicated model assignment'],
  payperuse:  ['₹15 per session (24 hrs)','Own API key = high limits (reports/chats/compare)','No API key = 2 reports + 3 chats + 1 comparison','No monthly commitment','Instant activation','Pay as you go — zero subscription']
};

/* ── STATE ───────────────────────────────────────────── */
let currentUser  = null;
let userProfile  = {
  plan: null,
  // ── NEW accurate tracking fields ──
  totalReports:     0,      // lifetime — never resets
  totalChats:       0,      // lifetime — never resets
  totalComparisons: 0,      // lifetime comparisons — never resets
  planUsed:         0,      // reports since planStartDate — resets on plan activation
  planChatUsed:     0,      // chats since planStartDate — resets on plan activation
  comparisonUsed:   0,      // comparisons since planStartDate — resets on plan activation
  planStartDate:    null,   // ISO timestamp of last plan activation
  // ── Legacy fields kept for backward compat ──
  monthlyGenerationsUsed: 0,
  monthlyMessagesUsed:    0,
  lastResetMonth: ''
};
let userSettings = { apiKey:'', model:'gemini-1.5-flash' };
let adminAPIConfig   = null;
let adminGlobalModel = null;  // from adminSettings/selectedModel
let curLang  = 'en';
let curData  = {};

/* ── FIREBASE AUTH ───────────────────────────────────── */
auth.onAuthStateChanged(async user => {
  if (!user) {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display  = 'none';
    return;
  }
  currentUser = user;
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').style.display  = 'flex';
  await loadUserProfile();
  await loadUserSettings();
  await loadAdminAPIConfig();
  await checkAdminStatus();
  // Check if admin changed the plan remotely since last session
  await checkPlanChangedRemotely();
  // Check trial expiry
  if (isTrialExpired() && userProfile.plan === 'free_trial') {
    // Don't silently downgrade — show upgrade popup
    toast('⏱ Your 14-day free trial has ended. Please upgrade to continue.', 'warn');
    setTimeout(() => showTrialExpiredPopup(), 800);
  }
  buildModelSelector();
  initMap();
  updateNavUI();
  updateUsageWidget();
  setupOfflineMode();
  checkSharedReportLink();
  // Show free trial popup for new free users
  checkAndShowTrialPopup();
  // Poll for remote plan changes every 60 seconds (e.g., admin activates a plan)
  setInterval(checkPlanChangedRemotely, 60000);
});

/* ── ADMIN CHECK ─────────────────────────────────────── */
async function checkAdminStatus() {
  try {
    const snap = await db.ref('adminConfig/adminUids/' + currentUser.uid).once('value');
    isAdmin = snap.exists() && snap.val() === true;
    // Show/hide admin nav buttons
    document.querySelectorAll('.admin-tab, .admin-mob').forEach(el => {
      el.style.display = isAdmin ? (el.classList.contains('admin-mob') ? 'inline-flex' : 'inline-flex') : 'none';
    });
  } catch(e) { isAdmin = false; }
}

function goAdminDash() {
  // Open admin dashboard in new tab
  window.open('admin-dashboard.html', '_blank');
}

/* ── MODEL SELECTOR BUILD ────────────────────────────── */
function buildModelSelector() {
  const sel = document.getElementById('settingsModel');
  sel.innerHTML = '';
  const groups = {};
  AI_MODELS.forEach(m => {
    if (!groups[m.provider]) groups[m.provider] = [];
    groups[m.provider].push(m);
  });
  Object.entries(groups).forEach(([prov, models]) => {
    const og = document.createElement('optgroup');
    og.label = PROVIDER_LABELS[prov] || prov;
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.label;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
  sel.value = userSettings.model || 'gemini-1.5-flash';
  showModelDesc();
}

function showModelDesc() {
  const sel = document.getElementById('settingsModel');
  const m = AI_MODELS.find(x => x.id === sel.value);
  const desc = document.getElementById('modelDesc');
  if (m && desc) desc.textContent = (PROVIDER_LABELS[m.provider]||m.provider) + ' — ' + m.desc;
}

/* ── USER PROFILE ────────────────────────────────────── */
async function loadUserProfile() {
  try {
    const snap = await db.ref('users/' + currentUser.uid).once('value');
    if (snap.exists()) {
      userProfile = { ...userProfile, ...snap.val() };
      // ── Migration: existing users missing new fields ──
      let needsMigration = false;
      if (userProfile.totalReports === undefined) {
        // Derive totalReports from query history length (one-time migration)
        try {
          const qSnap = await db.ref('users/'+currentUser.uid+'/queries').once('value');
          userProfile.totalReports = qSnap.exists() ? Object.keys(qSnap.val()).length : 0;
        } catch(e) { userProfile.totalReports = 0; }
        needsMigration = true;
      }
      if (userProfile.totalChats === undefined) {
        try {
          const cSnap = await db.ref('users/'+currentUser.uid+'/chats').once('value');
          userProfile.totalChats = cSnap.exists() ? Object.keys(cSnap.val()).length : 0;
        } catch(e) { userProfile.totalChats = 0; }
        needsMigration = true;
      }
      if (userProfile.planUsed === undefined)      { userProfile.planUsed = 0; needsMigration = true; }
      if (userProfile.planChatUsed === undefined)  { userProfile.planChatUsed = 0; needsMigration = true; }
      if (userProfile.comparisonUsed === undefined)   { userProfile.comparisonUsed = 0;   needsMigration = true; }
      if (userProfile.usingOwnAPI === undefined)       { userProfile.usingOwnAPI = false;    needsMigration = true; }
      if (userProfile.totalComparisons === undefined) { userProfile.totalComparisons = 0; needsMigration = true; }
      if (userProfile.planStartDate === undefined) {
        // Set planStartDate to start of current month so old reports don't contaminate
        userProfile.planStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        needsMigration = true;
      }
      if (needsMigration) {
        await savePlanUsageFields();
        console.log('[GeoMind] Migrated user profile to v5.1 tracking');
      }
    } else {
      // Brand new user → create profile WITHOUT activating trial yet
      // Popup will prompt them to activate
      const now = new Date();
      userProfile = {
        name:            currentUser.displayName || currentUser.email.split('@')[0],
        email:           currentUser.email,
        phone:           '',
        plan:            'free_trial',   // plan set, but trial NOT started yet
        totalReports:    0,
        totalChats:      0,
        totalComparisons:0,
        planUsed:        0,
        planChatUsed:    0,
        comparisonUsed:  0,
        planStartDate:   now.toISOString(),
        trialStartDate:  null,           // null = trial NOT yet activated → popup will show
        trialEndDate:    null,
        trialUsed:       false,          // false = never used → popup will show
        monthlyGenerationsUsed: 0,
        monthlyMessagesUsed:    0,
        lastResetMonth:  monthStr(),
        signupDate:      now.toISOString()
      };
      await db.ref('users/' + currentUser.uid).set(userProfile);
    }
    updateNavUI();
    updateUsageWidget();
  } catch(e) { console.error('loadUserProfile:', e); }
}

async function loadUserSettings() {
  try {
    const snap = await db.ref('users/' + currentUser.uid + '/settings').once('value');
    if (snap.exists()) userSettings = { ...userSettings, ...snap.val() };
    updateSettingsUI();
  } catch(e) { console.warn('loadUserSettings:', e); }
}

async function loadAdminAPIConfig() {
  try {
    const [apiSnap, modelSnap] = await Promise.all([
      db.ref('adminAPI/' + currentUser.uid).once('value'),
      db.ref('adminSettings/selectedModel').once('value')
    ]);
    adminAPIConfig   = apiSnap.exists()   ? apiSnap.val()   : null;
    adminGlobalModel = modelSnap.exists() ? modelSnap.val() : null;
    console.log('[GeoMind] adminGlobalModel:', adminGlobalModel);
  } catch(e) { adminAPIConfig = null; adminGlobalModel = null; }
}

function monthStr() { return new Date().toISOString().substring(0,7); }

/* ── SAVE FUNCTIONS ──────────────────────────────────── */

// Save only the plan-usage fields (fast, called on every report/chat/comparison)
async function savePlanUsageFields() {
  if (!currentUser) return;
  try {
    await db.ref('users/' + currentUser.uid).update({
      totalReports:     userProfile.totalReports     || 0,
      totalChats:       userProfile.totalChats       || 0,
      totalComparisons: userProfile.totalComparisons || 0,
      planUsed:         userProfile.planUsed         || 0,
      planChatUsed:     userProfile.planChatUsed     || 0,
      comparisonUsed:   userProfile.comparisonUsed   || 0,
      planStartDate:    userProfile.planStartDate     || new Date().toISOString()
    });
  } catch(e) { console.warn('savePlanUsageFields:', e); }
}

// Save full profile (name, phone, plan, etc.)
async function saveUserProfile() {
  if (!currentUser) return;
  try {
    await db.ref('users/' + currentUser.uid).update({
      name:            userProfile.name  || '',
      phone:           userProfile.phone || '',
      plan:            userProfile.plan,
      totalReports:    userProfile.totalReports   || 0,
      totalChats:      userProfile.totalChats     || 0,
      planUsed:        userProfile.planUsed       || 0,
      planChatUsed:    userProfile.planChatUsed   || 0,
      planStartDate:   userProfile.planStartDate  || new Date().toISOString(),
      // Keep legacy fields so old code doesn't break
      monthlyGenerationsUsed: userProfile.monthlyGenerationsUsed || 0,
      monthlyMessagesUsed:    userProfile.monthlyMessagesUsed    || 0,
      lastResetMonth:         userProfile.lastResetMonth         || monthStr()
    });
  } catch(e) { console.warn('saveUserProfile error:', e); }
}

/* ── PLAN ACTIVATION — called by admin when activating a plan ── */
async function activatePlan(newPlan) {
  const now = new Date().toISOString();
  userProfile.plan            = newPlan;
  userProfile.planStartDate   = now;
  userProfile.planUsed        = 0;
  userProfile.planChatUsed    = 0;
  userProfile.comparisonUsed  = 0;
  console.log('[GeoMind] Plan activated:', newPlan, 'Start:', now);
  await saveUserProfile();
  updateNavUI();
  updateUsageWidget();
}

/* ══════════════════════════════════════════════════════
   FREE TRIAL SYSTEM
   Firebase: freeTrialAPI/{apiId} → {apiKey, usageCount, maxUsage:5, status}
   ══════════════════════════════════════════════════════ */

/* Step 1: Show trial popup on first login (if not already used/active) */
function checkAndShowTrialPopup() {
  if (!currentUser) return;
  const plan          = userProfile.plan;
  const isPaid        = ['starter','standard','premium','payperuse','custom'].includes(plan);
  const isActiveTrial = plan === 'free_trial' && userProfile.trialStartDate && !isTrialExpired();

  // Already on a good active plan — no popup needed
  if (isPaid || isActiveTrial) return;

  // Trial never activated (new user or user who skipped it before)
  const trialNeverStarted = !userProfile.trialStartDate && !userProfile.trialUsed;
  if (trialNeverStarted) {
    setTimeout(() => showTrialPopup(), 1200);
    return;
  }

  // Trial expired — show expired popup
  if (isTrialExpired() && plan === 'free_trial') {
    setTimeout(() => showTrialExpiredPopup(), 1200);
  }
}

function showTrialPopupManual() {
  // Called when user explicitly clicks "Activate Trial"
  showTrialPopup();
}

function showTrialPopup() {
  // Only block if trial is ALREADY active or on a paid plan
  const plan   = userProfile.plan;
  const isPaid = ['starter','standard','premium','payperuse','custom'].includes(plan);
  if (isPaid) return;
  // If trial already started and not expired, no need to show activation popup
  if (userProfile.trialStartDate && !isTrialExpired()) return;
  let modal = document.getElementById('trialPopupModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'trialPopupModal';
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);
      z-index:99990;display:flex;align-items:center;justify-content:center;padding:20px;`;
    modal.innerHTML = `
      <div style="background:linear-gradient(160deg,#0d1828 0%,#080d17 100%);
        border:1px solid rgba(0,229,200,0.3);border-radius:22px;padding:32px 26px;
        max-width:390px;width:100%;box-shadow:0 0 80px rgba(0,229,200,0.12),0 32px 80px rgba(0,0,0,0.8);
        animation:authIn 0.4s cubic-bezier(0.22,1,0.36,1);">
        <div style="text-align:center;margin-bottom:22px;">
          <div style="font-size:52px;margin-bottom:8px;filter:drop-shadow(0 0 16px rgba(0,229,200,0.4))">🚀</div>
          <div style="font-size:22px;font-weight:900;color:#e8edf8;margin-bottom:6px;letter-spacing:-0.02em;">Try Free Trial for 14 Days!</div>
          <div style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,rgba(0,229,200,0.15),rgba(74,158,255,0.12));
            border:1px solid rgba(0,229,200,0.35);border-radius:20px;padding:4px 14px;
            font-size:11px;font-weight:800;color:#00e5c8;margin-bottom:10px;">🌟 BEST WAY TO START</div>
          <div style="font-size:13px;color:#8899bb;line-height:1.7;">
            Instant AI access — <strong style="color:#e8edf8">no API key, no payment</strong> needed.<br>
            Experience real GeoMind power before you upgrade.
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:16px;margin-bottom:18px;">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:center;">
            <div style="padding:8px;background:rgba(0,229,200,0.06);border-radius:10px;border:1px solid rgba(0,229,200,0.12);">
              <div style="font-size:26px;font-weight:900;color:#00e5c8;font-family:monospace;line-height:1">5</div>
              <div style="font-size:10px;color:#5a6a88;margin-top:4px;font-weight:600">AI Reports</div>
            </div>
            <div style="padding:8px;background:rgba(74,158,255,0.06);border-radius:10px;border:1px solid rgba(74,158,255,0.12);">
              <div style="font-size:26px;font-weight:900;color:#4a9eff;font-family:monospace;line-height:1">8</div>
              <div style="font-size:10px;color:#5a6a88;margin-top:4px;font-weight:600">Chats</div>
            </div>
            <div style="padding:8px;background:rgba(157,122,255,0.06);border-radius:10px;border:1px solid rgba(157,122,255,0.12);">
              <div style="font-size:26px;font-weight:900;color:#9d7aff;font-family:monospace;line-height:1">2</div>
              <div style="font-size:10px;color:#5a6a88;margin-top:4px;font-weight:600">Comparisons</div>
            </div>
          </div>
          <div style="text-align:center;margin-top:10px;font-size:10px;color:#3a4a62;">
            ⏱ Valid for 14 days · One-time offer · No card required
          </div>
        </div>
        <button onclick="activateFreeTrial()" id="trialActivateBtn"
          style="width:100%;padding:15px;background:linear-gradient(135deg,#00e5c8,#4a9eff);
          border:none;border-radius:13px;font-weight:900;font-size:15px;color:#04060e;
          cursor:pointer;transition:all 0.2s;margin-bottom:10px;letter-spacing:0.02em;
          box-shadow:0 4px 20px rgba(0,229,200,0.3);">
          🚀 Activate Free Trial — It's Free!
        </button>
        <button onclick="closeTrialPopup()"
          style="width:100%;padding:10px;background:transparent;border:1px solid rgba(255,255,255,0.08);
          border-radius:11px;font-size:12px;color:#3a4a62;cursor:pointer;transition:color 0.2s;"
          onmouseover="this.style.color='#5a6a88'" onmouseout="this.style.color='#3a4a62'">
          No thanks, I'll use my own API key
        </button>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
}
function closeTrialPopup() {
  const m = document.getElementById('trialPopupModal');
  if (m) m.style.display = 'none';
}

/* Step 2: Assign a free trial API key and activate the trial plan */
async function activateFreeTrial() {
  const btn = document.getElementById('trialActivateBtn');
  if (btn) { btn.textContent = '⏳ Activating…'; btn.disabled = true; }

  try {
    // Find an available free trial API key
    const apiKey = await assignFreeTrialAPI();
    if (!apiKey) {
      toast('⚠ No trial slots available right now. Please add your own API key or purchase a plan.', 'err');
      if (btn) { btn.textContent = '🚀 Activate Free Trial'; btn.disabled = false; }
      return;
    }

    const now     = new Date();
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    userProfile.plan            = 'free_trial';
    userProfile.planStartDate   = now.toISOString();
    userProfile.planUsed        = 0;
    userProfile.planChatUsed    = 0;
    userProfile.comparisonUsed  = 0;
    userProfile.trialStartDate  = now.toISOString();
    userProfile.trialEndDate    = endDate.toISOString();
    userProfile.trialUsed       = true;
    userProfile.assignedTrialAPI = apiKey;

    await db.ref('users/' + currentUser.uid).update({
      plan:             'free_trial',
      planStartDate:    now.toISOString(),
      planUsed:         0,
      planChatUsed:     0,
      comparisonUsed:   0,
      trialStartDate:   now.toISOString(),
      trialEndDate:     endDate.toISOString(),
      trialUsed:        true,
      assignedTrialAPI: apiKey
    });

    closeTrialPopup();
    updateNavUI();
    updateUsageWidget();
    toast('🚀 Free Trial activated! 14 days of AI access — enjoy GeoMind!', 'ok');
    console.log('[FreeTrial] Activated. API assigned. Ends:', endDate.toISOString());

  } catch(e) {
    console.error('[activateFreeTrial]', e);
    toast('Failed to activate trial: ' + e.message, 'err');
    if (btn) { btn.textContent = '🚀 Activate Free Trial'; btn.disabled = false; }
  }
}

/* Step 3: Find and reserve a free trial API key from freeTrialAPI collection */
async function assignFreeTrialAPI() {
  try {
    const snap = await db.ref('freeTrialAPI').orderByChild('status').equalTo('active').once('value');
    if (!snap.exists()) return null;

    const entries = Object.entries(snap.val());
    // Find one where usageCount < maxUsage
    for (const [id, entry] of entries) {
      const used = entry.usageCount || 0;
      const max  = entry.maxUsage  || 5;
      if (entry.status === 'active' && used < max) {
        // Increment usage count
        await db.ref('freeTrialAPI/' + id + '/usageCount').transaction(count => (count || 0) + 1);
        console.log('[FreeTrial] Assigned API from slot:', id, 'usage:', used + 1, '/', max);
        return entry.apiKey;
      }
    }
    return null; // all slots full
  } catch(e) {
    console.warn('[assignFreeTrialAPI]', e.message);
    return null;
  }
}

/* Step 4: Check if free trial has expired */
function isTrialExpired() {
  if (userProfile.plan !== 'free_trial') return false;
  if (!userProfile.trialEndDate) return true;
  return new Date() > new Date(userProfile.trialEndDate);
}

/* Show blocking expiry popup */
function showTrialExpiredPopup() {
  let modal = document.getElementById('trialExpiredModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'trialExpiredModal';
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(12px);
      z-index:99991;display:flex;align-items:center;justify-content:center;padding:20px;`;
    modal.innerHTML = `
      <div style="background:linear-gradient(160deg,#111929 0%,#0a0f1c 100%);
        border:1px solid rgba(255,107,122,0.3);border-radius:20px;padding:32px 28px;
        max-width:360px;width:100%;box-shadow:0 0 60px rgba(255,107,122,0.15),0 32px 80px rgba(0,0,0,0.7);
        animation:authIn 0.4s cubic-bezier(0.22,1,0.36,1);text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">⏱</div>
        <div style="font-size:20px;font-weight:800;color:#e8edf8;margin-bottom:8px;">Free Trial Expired</div>
        <div style="font-size:13px;color:#b8c4d8;line-height:1.6;margin-bottom:20px;">
          Your 14-day free trial has ended.<br>
          Upgrade to continue using GeoMind AI.
        </div>
        <button onclick="goPage('plans');document.getElementById('trialExpiredModal').style.display='none';"
          style="width:100%;padding:13px;background:linear-gradient(135deg,#4a9eff,#9d7aff);
          border:none;border-radius:12px;font-weight:800;font-size:14px;color:#fff;
          cursor:pointer;margin-bottom:10px;">
          ⭐ View Plans & Upgrade
        </button>
        <button onclick="goPage('settings');document.getElementById('trialExpiredModal').style.display='none';"
          style="width:100%;padding:10px;background:transparent;border:1px solid rgba(255,255,255,0.1);
          border-radius:10px;font-size:12px;color:#5a6a88;cursor:pointer;">
          Add my own API key (Free Plan)
        </button>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
}

/* Step 5: Get trial API key for paid/trial users */
function getTrialAPIKey() {
  return userProfile.assignedTrialAPI || null;
}

/* Step 6: Report API failure — mark key inactive and create admin alert */
async function reportAPIFailure(apiKey, errorMsg) {
  if (!apiKey) return;
  try {
    // Find the freeTrialAPI entry with this key and mark inactive
    const snap = await db.ref('freeTrialAPI').orderByChild('apiKey').equalTo(apiKey).once('value');
    if (snap.exists()) {
      const id = Object.keys(snap.val())[0];
      await db.ref('freeTrialAPI/' + id + '/status').set('inactive');
      console.warn('[FreeTrial] API key marked inactive:', id);
    }
    // Create admin alert
    await db.ref('adminAlerts').push({
      message:   'Free Trial API failed — Replace API Key',
      apiKey:    apiKey.substring(0, 12) + '…',
      errorMsg:  errorMsg || 'Unknown error',
      timestamp: new Date().toISOString(),
      read:      false
    });
    console.warn('[FreeTrial] Admin alert created for failed API');
  } catch(e) {
    console.warn('[reportAPIFailure]', e.message);
  }
}

/* Step 7: Get remaining trial days for display */
function getTrialDaysRemaining() {
  if (userProfile.plan !== 'free_trial' || !userProfile.trialEndDate) return 0;
  const ms = new Date(userProfile.trialEndDate) - new Date();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}



/* ── MONTHLY REPORT COUNT (computed dynamically, never stored) ── */
function monthStr() { return new Date().toISOString().substring(0,7); }

/* Compute this-month report count from query history — no stored counter */
async function computeMonthlyReports() {
  if (!currentUser) return 0;
  try {
    const snap = await db.ref('users/'+currentUser.uid+'/queries').once('value');
    if (!snap.exists()) return 0;
    const monthStart = monthStr(); // "2025-03"
    return Object.values(snap.val()).filter(q => {
      const ts = q.timestamp || q.createdAt || '';
      return ts.startsWith(monthStart);
    }).length;
  } catch(e) { return 0; }
}

/* Compute plan-cycle report count from query history (most accurate source) */
async function computePlanUsedFromHistory() {
  if (!currentUser || !userProfile.planStartDate) return 0;
  try {
    const snap = await db.ref('users/'+currentUser.uid+'/queries').once('value');
    if (!snap.exists()) return 0;
    const planStart = userProfile.planStartDate;
    return Object.values(snap.val()).filter(q => {
      const ts = q.timestamp || q.createdAt || '';
      return ts >= planStart;
    }).length;
  } catch(e) { return 0; }
}



/* ── PLAN LIMIT VALIDATION ───────────────────────────── */

function _hasActivePlan() {
  const plan = userProfile.plan;
  if (!plan || plan === null) return false;  // no active plan
  // free_trial is active only if not expired
  if (plan === 'free_trial') return !isTrialExpired();
  return true; // starter/standard/premium/payperuse/custom
}

function canGenerate() {
  if (!_hasActivePlan()) {
    _showNoPlanMessage();
    return false;
  }
  const plan = userProfile.plan || 'free_trial';
  // Block expired trials
  if (plan === 'free_trial' && isTrialExpired()) { showTrialExpiredPopup(); return false; }
  // payperuse with own API key → high limit (999)
  if (plan === 'payperuse' && userProfile.usingOwnAPI && userSettings.apiKey?.trim()) return true;
  // All plans: check planUsed vs limit
  const limit = getPlanGenLimit();
  const used  = userProfile.planUsed || 0;
  console.log(`[canGenerate] plan=${plan} planUsed=${used} limit=${limit}`);
  return used < limit;
}

function canChat() {
  if (!_hasActivePlan()) {
    _showNoPlanMessage();
    return false;
  }
  const plan = userProfile.plan || 'free_trial';
  if (plan === 'free_trial' && isTrialExpired()) { showTrialExpiredPopup(); return false; }
  if (plan === 'payperuse' && userProfile.usingOwnAPI && userSettings.apiKey?.trim()) return true;
  const limit = getPlanChatLimit();
  const used  = userProfile.planChatUsed || 0;
  return used < limit;
}

function canCompare() {
  if (!_hasActivePlan()) {
    _showNoPlanMessage();
    return false;
  }
  const plan = userProfile.plan || 'free_trial';
  if (plan === 'free_trial' && isTrialExpired()) { showTrialExpiredPopup(); return false; }
  if (plan === 'payperuse' && userProfile.usingOwnAPI && userSettings.apiKey?.trim()) return true;
  const limit = getPlanComparisonLimit();
  const used  = userProfile.comparisonUsed || 0;
  console.log(`[canCompare] plan=${plan} comparisonUsed=${used} limit=${limit}`);
  return used < limit;
}

function getPlanComparisonLimit() {
  const plan = userProfile.plan || 'free_trial';
  // payperuse with own API → very high limit
  if (plan === 'payperuse' && userProfile.usingOwnAPI && userSettings.apiKey?.trim()) return 999;
  if (plan === 'payperuse') return userProfile.customComparisonLimit ?? PLANS.payperuse.comparisonLimit;
  return PLANS[plan]?.comparisonLimit ?? 2;
}

function getPlanGenLimit() {
  const plan = userProfile.plan || 'free_trial';
  if (plan === 'payperuse' && userProfile.usingOwnAPI && userSettings.apiKey?.trim()) return 999;
  if (plan === 'payperuse') return userProfile.customGenLimit ?? PLANS.payperuse.genLimit;
  return PLANS[plan]?.genLimit ?? 5;
}

function getPlanChatLimit() {
  const plan = userProfile.plan || 'free_trial';
  if (plan === 'payperuse' && userProfile.usingOwnAPI && userSettings.apiKey?.trim()) return 999;
  if (plan === 'payperuse') return userProfile.customChatLimit ?? PLANS.payperuse.chatLimit;
  return PLANS[plan]?.chatLimit ?? 8;
}

function getNoKeyMessage() {
  return `Your plan has expired or has no quota. Please <a href="#" onclick="goPage('plans');return false;" style="color:var(--cyan)">upgrade your plan</a> or add your own API key in <strong>Settings</strong>.`;
}

async function incrementGeneration() {
  // totalReports = lifetime counter, never resets
  userProfile.totalReports = (userProfile.totalReports || 0) + 1;
  // planUsed = plan-cycle counter, resets only when plan activated
  userProfile.planUsed     = (userProfile.planUsed     || 0) + 1;
  // Keep legacy field in sync for any old code that reads it
  userProfile.monthlyGenerationsUsed = (userProfile.monthlyGenerationsUsed || 0) + 1;
  await savePlanUsageFields();
  updateNavUI();
  updateUsageWidget();
}

async function incrementChat() {
  userProfile.totalChats   = (userProfile.totalChats   || 0) + 1;
  userProfile.planChatUsed = (userProfile.planChatUsed || 0) + 1;
  userProfile.monthlyMessagesUsed = (userProfile.monthlyMessagesUsed || 0) + 1;
  await savePlanUsageFields();
  updateNavUI();
  updateUsageWidget();
}

async function incrementComparison() {
  userProfile.totalComparisons = (userProfile.totalComparisons || 0) + 1;
  userProfile.comparisonUsed   = (userProfile.comparisonUsed   || 0) + 1;
  await savePlanUsageFields();
  updateNavUI();
  updateUsageWidget();
}

/* Detect if plan changed since last login (admin activated remotely) */
async function checkPlanChangedRemotely() {
  if (!currentUser) return;
  try {
    const snap = await db.ref('users/' + currentUser.uid).once('value');
    if (!snap.exists()) return;
    const remote = snap.val();
    const localPlan   = userProfile.plan;
    const remotePlan  = remote.plan;
    const remoteStart = remote.planStartDate;
    // If admin changed the plan AND updated planStartDate, reset local counters
    if (remotePlan !== localPlan || (remoteStart && remoteStart !== userProfile.planStartDate)) {
      console.log(`[GeoMind] Plan changed remotely: ${localPlan} → ${remotePlan}`);
      userProfile.plan             = remotePlan;
      userProfile.planStartDate    = remoteStart || new Date().toISOString();
      userProfile.planUsed         = remote.planUsed         ?? 0;
      userProfile.planChatUsed     = remote.planChatUsed     ?? 0;
      userProfile.comparisonUsed   = remote.comparisonUsed   ?? 0;
      userProfile.totalReports     = remote.totalReports     ?? userProfile.totalReports;
      userProfile.totalChats       = remote.totalChats       ?? userProfile.totalChats;
      userProfile.totalComparisons = remote.totalComparisons ?? userProfile.totalComparisons;
      userProfile.usingOwnAPI   = remote.usingOwnAPI   ?? false;
      userProfile.customApiKey  = remote.customApiKey  ?? '';
      if (remotePlan !== localPlan && remotePlan !== 'free' && remotePlan !== 'free_trial') {
        toast(`🎉 Your plan has been upgraded to ${PLANS[remotePlan]?.name || remotePlan}!`, 'ok');
      }
      updateNavUI();
      updateUsageWidget();
    }
  } catch(e) { console.warn('[checkPlanChangedRemotely]', e); }
}



/* ── SETTINGS SAVE/LOAD ──────────────────────────────── */
async function saveSettings() {
  if (!currentUser) return;
  const key   = document.getElementById('settingsApiKey').value.trim();
  const model = document.getElementById('settingsModel').value;
  userSettings = { apiKey: key, model };
  try {
    await db.ref('users/' + currentUser.uid + '/settings').set(userSettings);
    // If user is on payperuse plan and provides an API key → activate own-API mode
    if (userProfile.plan === 'payperuse' && key) {
      userProfile.usingOwnAPI = true;
      userProfile.customApiKey = key;
      await db.ref('users/' + currentUser.uid).update({ usingOwnAPI: true, customApiKey: key });
      toast('✓ Settings saved! Pay Per Use unlocked with your own API key.', 'ok');
    } else if (userProfile.plan === 'payperuse' && !key) {
      userProfile.usingOwnAPI = false;
      await db.ref('users/' + currentUser.uid).update({ usingOwnAPI: false });
      toast('Settings saved. Using admin-assigned API (limited usage).', 'ok');
    } else {
      toast('Settings saved!', 'ok');
    }
    updateSettingsUI();
    updateNavUI();
    updateUsageWidget();
  } catch(e) { toast('Failed to save: ' + e.message, 'err'); }
}

function updateSettingsUI() {
  const keyEl   = document.getElementById('settingsApiKey');
  const modelEl = document.getElementById('settingsModel');
  if (keyEl)   keyEl.value   = userSettings.apiKey || '';
  if (modelEl) { modelEl.value = userSettings.model || 'gemini-1.5-flash'; showModelDesc(); }
  const plan    = userProfile.plan || 'free_trial';
  const hasKey  = !!(userSettings.apiKey && userSettings.apiKey.trim());
  const hasAdminKey = !!(adminAPIConfig?.reportAPIKey);
  const box     = document.getElementById('apiStatusBox');
  const txt     = document.getElementById('apiStatusText');

  // AI Configuration: ONLY visible when plan === 'custom'
  const aiSection = document.getElementById('aiConfigSection');
  if (aiSection) {
    const canSeeAI = (plan === 'custom');
    aiSection.style.display = canSeeAI ? '' : 'none';
    // Remove any stale notice
    const notice = document.getElementById('aiConfigNotice');
    if (notice) notice.remove();
  }

  if (!box) return;

  if (plan === 'payperuse' && hasKey && userProfile.usingOwnAPI) {
    box.className = 'api-status';
    txt.textContent = '⚡ Pay Per Use — Own API mode: High usage limits active. Your API quota applies.';
  } else if (plan === 'payperuse' && !hasKey) {
    box.className = 'api-status no-key';
    txt.innerHTML = '⚡ Pay Per Use — <strong>Add your own API key</strong> to unlock high limits, or use admin API (limited).';
  } else if (plan !== 'free_trial' && hasAdminKey) {
    box.className = 'api-status';
    txt.textContent = `Admin-assigned API key active for ${PLANS[plan]?.name || plan} plan.`;
  } else if (hasKey) {
    box.className = 'api-status';
    txt.textContent = 'Your API key is configured. Reports will use your quota.';
  } else {
    box.className = 'api-status no-key';
    txt.textContent = 'No API key configured. Add your key above or purchase a plan.';
  }
}

/* ── API KEY RESOLUTION ──────────────────────────────── */
function getReportAPIKey() {
  const plan = userProfile.plan || 'free_trial';
  // Free trial: use system-assigned trial API key
  if (plan === 'free_trial') {
    const trialKey = getTrialAPIKey();
    if (trialKey) return trialKey;
  }
  // payperuse with own API: use user's own key
  if (plan === 'payperuse' && userProfile.usingOwnAPI && userSettings.apiKey?.trim()) {
    return userSettings.apiKey.trim();
  }
  // Paid plans: admin-assigned key takes priority
  if (adminAPIConfig?.reportAPIKey) return adminAPIConfig.reportAPIKey;
  // Fallback: user's own API key
  if (userSettings.apiKey) return userSettings.apiKey;
  return null;
}
function getChatAPIKey() {
  const plan = userProfile.plan || 'free_trial';
  if (plan === 'free_trial') {
    const trialKey = getTrialAPIKey();
    if (trialKey) return trialKey;
  }
  if (plan === 'payperuse' && userProfile.usingOwnAPI && userSettings.apiKey?.trim()) {
    return userSettings.apiKey.trim();
  }
  if (adminAPIConfig?.chatAPIKey) return adminAPIConfig.chatAPIKey;
  if (userSettings.apiKey) return userSettings.apiKey;
  return null;
}
function getSelectedModel(forChat=false) {
  const plan = userProfile.plan || 'free_trial';
  if (plan === 'free_trial') {
    return adminGlobalModel || 'gemini-1.5-flash';
  }
  if (plan === 'payperuse' && userProfile.usingOwnAPI) {
    return userSettings.model || 'gemini-1.5-flash';
  }
  if (plan !== 'free_trial') {
    if (forChat  && adminAPIConfig?.chatModel)   return adminAPIConfig.chatModel;
    if (!forChat && adminAPIConfig?.reportModel) return adminAPIConfig.reportModel;
    if (adminGlobalModel) return adminGlobalModel;
  }
  return userSettings.model || 'gemini-1.5-flash';
}

/* ── MULTI-PROVIDER AI CALL ──────────────────────────── */
function getProviderForModel(modelId) {
  const m = AI_MODELS.find(x => x.id === modelId);
  return m ? m.provider : 'gemini';
}

async function callAI(prompt, apiKey, modelId) {
  const provider = getProviderForModel(modelId);
  console.log('[callAI] provider='+provider+' model='+modelId);
  if (!navigator.onLine) throw new Error('No internet connection. Check your network and try again.');
  try {
    if (provider === 'gemini') {
      return await callGemini(prompt, apiKey, modelId);
    } else if (provider === 'openai') {
      return await callOpenAI(prompt, apiKey, modelId);
    } else if (provider === 'anthropic') {
      return await callAnthropic(prompt, apiKey, modelId);
    } else if (provider === 'mistral') {
      return await callMistral(prompt, apiKey, modelId);
    } else if (provider === 'openrouter') {
      return await callOpenRouter(prompt, apiKey, modelId);
    } else if (provider === 'zai') {
      return await callZAI(prompt, apiKey, modelId);
    } else if (provider === 'huggingface') {
      return await callHuggingFace(prompt, apiKey, modelId);
    } else if (provider === 'bytez') {
      return await callBytez(prompt, apiKey, modelId);
    } else {
      return await callGemini(prompt, apiKey, modelId);
    }
  } catch(e) {
    // Only rethrow as network error if it's genuinely a connectivity failure
    if (e instanceof TypeError &&
        (e.message.includes('Failed to fetch') || e.message.includes('NetworkError') || e.message.includes('net::ERR_'))) {
      throw new Error('Network error: Could not reach the AI server. Check your internet connection or try a different provider in Settings.');
    }
    // If trial API key failed → report it and alert admin
    if (userProfile.plan === 'free_trial' && userProfile.assignedTrialAPI) {
      const errStr = e.message || '';
      if (errStr.includes('401') || errStr.includes('403') || errStr.includes('invalid')) {
        reportAPIFailure(userProfile.assignedTrialAPI, errStr).catch(() => {});
      }
    }
    throw e;
  }
}

async function callGemini(prompt, apiKey, model) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(endpoint, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.3,maxOutputTokens:4096} })
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    if (resp.status === 400 && errBody.includes('API_KEY_INVALID')) throw new Error('Invalid Gemini API key. Check your key in Settings.');
    if (resp.status === 429) throw new Error('Gemini quota exceeded. Try again later or upgrade your plan.');
    throw new Error(`Gemini API error ${resp.status}: ${errBody.substring(0,120)}`);
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenAI(prompt, apiKey, model) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
    body: JSON.stringify({ model, messages:[{role:'user',content:prompt}], max_tokens:4096, temperature:0.3 })
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    if (resp.status === 401) throw new Error('Invalid OpenAI API key. Check your key in Settings.');
    if (resp.status === 429) throw new Error('OpenAI quota exceeded. Try again later.');
    throw new Error(`OpenAI API error ${resp.status}: ${errBody.substring(0,120)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(prompt, apiKey, model) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},
    body: JSON.stringify({ model, max_tokens:4096, messages:[{role:'user',content:prompt}] })
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    if (resp.status === 401) throw new Error('Invalid Anthropic API key. Check your key in Settings.');
    if (resp.status === 429) throw new Error('Anthropic quota exceeded. Try again later.');
    throw new Error(`Anthropic API error ${resp.status}: ${errBody.substring(0,120)}`);
  }
  const data = await resp.json();
  return data.content?.[0]?.text || '';
}

async function callMistral(prompt, apiKey, model) {
  const resp = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
    body: JSON.stringify({ model, messages:[{role:'user',content:prompt}], max_tokens:4096, temperature:0.3 })
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    if (resp.status === 401) throw new Error('Invalid Mistral API key. Check your key in Settings.');
    throw new Error(`Mistral API error ${resp.status}: ${errBody.substring(0,120)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOpenRouter(prompt, apiKey, model) {
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey,'HTTP-Referer':'https://geomind.app','X-Title':'GeoMind'},
    body: JSON.stringify({ model, messages:[{role:'user',content:prompt}], max_tokens:4096, temperature:0.3 })
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    if (resp.status === 401) throw new Error('Invalid OpenRouter API key. Check your key in Settings.');
    throw new Error(`OpenRouter API error ${resp.status}: ${errBody.substring(0,120)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callZAI(prompt, apiKey, model) {
  /* Z.ai uses an OpenAI-compatible chat completions endpoint */
  const resp = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
    body: JSON.stringify({ model, messages:[{role:'user',content:prompt}], max_tokens:4096, temperature:0.3 })
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    if (resp.status === 401) throw new Error('Invalid Z.ai API key. Get your key from platform.z.ai and check Settings.');
    if (resp.status === 429) throw new Error('Z.ai quota exceeded. Try again later.');
    if (resp.status === 404) throw new Error(`Z.ai model "${model}" not found. Try a different Yi model.`);
    throw new Error(`Z.ai API error ${resp.status}: ${errBody.substring(0,120)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callHuggingFace(prompt, apiKey, model) {
  /* HuggingFace Inference Providers — new router endpoint (supports browser CORS)
     Old: api-inference.huggingface.co  ← deprecated, CORS issues
     New: router.huggingface.co/v1/chat/completions  ← OpenAI-compatible, CORS OK
     Token from: huggingface.co/settings/tokens  (needs "Inference" permission) */
  const resp = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.3
    })
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    if (resp.status === 401) throw new Error('Invalid HuggingFace token. Go to huggingface.co/settings/tokens, create a token with "Make calls to Inference Providers" permission, and paste it in Settings.');
    if (resp.status === 403) throw new Error(`HuggingFace: Access denied for model "${model}". You may need to accept the model license on its HuggingFace page.`);
    if (resp.status === 503 || resp.status === 504) throw new Error('HuggingFace model is loading or busy. Wait 20–30 seconds and try again.');
    if (resp.status === 429) throw new Error('HuggingFace rate limit reached. Try again shortly.');
    if (resp.status === 404) throw new Error(`HuggingFace model "${model}" not found or not available on Inference Providers.`);
    throw new Error(`HuggingFace API error ${resp.status}: ${errBody.substring(0, 120)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callBytez(prompt, apiKey, model) {
  /* Bytez native API — matches the Python SDK:
       sdk.model("Qwen/Qwen2.5-7B").run([{role, content}])
     REST equivalent:
       POST https://api.bytez.com/model/v2/{model}/run
       Authorization: {BYTEZ_KEY}   ← no "Bearer" prefix
       Body: { messages: [...] }
     Response: { error, output }  where output is the reply string */
  const encodedModel = encodeURIComponent(model);
  const resp = await fetch(`https://api.bytez.com/model/v2/${encodedModel}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey   // Bytez uses raw key, no "Bearer"
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      params: { max_new_tokens: 4096, temperature: 0.3 }
    })
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    if (resp.status === 401) throw new Error('Invalid Bytez API key. Get yours at bytez.com/api and add it in Settings.');
    if (resp.status === 429) throw new Error('Bytez rate limit reached. Try again shortly.');
    if (resp.status === 404) throw new Error(`Bytez model "${model}" not found. Check the model name.`);
    if (resp.status === 503) throw new Error('Bytez model is loading. Please wait and try again.');
    throw new Error(`Bytez API error ${resp.status}: ${errBody.substring(0, 120)}`);
  }
  const data = await resp.json();
  if (data.error) throw new Error(`Bytez error: ${data.error}`);
  /* output can be a string or an array of generated_text objects */
  if (typeof data.output === 'string') return data.output;
  if (Array.isArray(data.output)) {
    const item = data.output[0];
    return item?.generated_text ?? item?.content ?? JSON.stringify(item);
  }
  return data.output?.generated_text ?? data.output?.content ?? String(data.output ?? '');
}

/* ── AUTH FUNCTIONS ──────────────────────────────────── */
function showCard(which) {
  document.getElementById('loginCard').style.display  = which==='login'  ? 'block':'none';
  document.getElementById('signupCard').style.display = which==='signup' ? 'block':'none';
}
async function doLogin() {
  const email = document.getElementById('lemail').value.trim();
  const pwd   = document.getElementById('lpwd').value;
  const btn   = document.getElementById('lbtn');
  const err   = document.getElementById('lerr');
  const ok    = document.getElementById('lok');
  err.style.display='none'; ok.style.display='none';

  // ── Validation ──
  if (!email || !pwd) { showAmsg(err,'Please fill in all fields.'); return; }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { showAmsg(err,'Enter a valid email address.'); return; }
  if (pwd.length < 6) { showAmsg(err,'Password must be at least 6 characters.'); return; }

  // ── Guard: Firebase must be ready ──
  if (typeof firebase === 'undefined' || !firebase.auth) {
    showAmsg(err,'Connection error. Please check your internet and reload the page.');
    return;
  }

  const resetBtn = () => { btn.disabled=false; btn.textContent='Sign In'; };
  btn.disabled=true; btn.innerHTML='<span class="spin-xs"></span>Signing in…';

  // ── Safety timeout: re-enable after 15s ──
  const timeout = setTimeout(resetBtn, 15000);

  try {
    await auth.signInWithEmailAndPassword(email, pwd);
    clearTimeout(timeout);
    ok.textContent='Login successful! Loading…'; ok.style.display='block';
    // btn stays disabled intentionally — page will transition via onAuthStateChanged
  } catch(e) {
    clearTimeout(timeout);
    resetBtn();
    showAmsg(err, authErr(e.code));
    console.error('[doLogin]', e.code, e.message);
  }
}
function chkPwd(v) {
  const b=document.getElementById('pwdBar');
  b.className='pwd-bar'+(v.length<4?'':v.length<8?' w':v.length<12&&!/[!@#$%^&*]/.test(v)?' m':' s');
}
async function doSignup() {
  const name  = document.getElementById('sname').value.trim();
  const email = document.getElementById('semail').value.trim();
  const pwd   = document.getElementById('spwd').value;
  const cpwd  = document.getElementById('scpwd').value;
  const cls   = document.getElementById('scls').value;
  const exam  = document.getElementById('sexam').value;
  const btn   = document.getElementById('sbtn');
  const err   = document.getElementById('serr');
  const ok    = document.getElementById('sok');
  err.style.display='none'; ok.style.display='none';

  // ── Validation ──
  if (!name)  { showAmsg(err,'Please enter your full name.'); return; }
  if (!email) { showAmsg(err,'Please enter your email address.'); return; }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { showAmsg(err,'Enter a valid email address.'); return; }
  if (!pwd || !cpwd) { showAmsg(err,'Please fill in both password fields.'); return; }
  if (pwd.length < 8) { showAmsg(err,'Password must be at least 8 characters.'); return; }
  if (pwd !== cpwd) { showAmsg(err,'Passwords do not match. Please re-enter.'); return; }

  // ── Guard: Firebase must be ready ──
  if (typeof firebase === 'undefined' || !firebase.auth) {
    showAmsg(err,'Connection error. Please check your internet and reload the page.');
    return;
  }

  const resetBtn = () => { btn.disabled=false; btn.textContent='Create Free Account'; };
  btn.disabled=true; btn.innerHTML='<span class="spin-xs w"></span>Creating account…';

  // ── Safety timeout: re-enable after 20s ──
  const timeout = setTimeout(resetBtn, 20000);

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pwd);
    await cred.user.updateProfile({displayName: name});
    await db.ref('users/'+cred.user.uid).set({
      name, email, phone:'',
      classLevel: cls||'Competitive', examType: exam||'UPSC',
      plan:'free_trial', monthlyGenerationsUsed:0, monthlyMessagesUsed:0,
      lastResetMonth: monthStr(), signupDate: new Date().toISOString()
    });
    clearTimeout(timeout);
    ok.textContent='Account created! Loading GeoMind…'; ok.style.display='block';
    // btn stays disabled — page transitions via onAuthStateChanged
  } catch(e) {
    clearTimeout(timeout);
    resetBtn();
    showAmsg(err, authErr(e.code));
    console.error('[doSignup]', e.code, e.message);
  }
}
function showAmsg(el,msg){el.textContent=msg;el.style.display='block';}
function authErr(code) {
  return ({
    'auth/user-not-found':'No account found with this email.',
    'auth/wrong-password':'Incorrect password.',
    'auth/invalid-email':'Invalid email format.',
    'auth/email-already-in-use':'Email already registered. Try signing in.',
    'auth/weak-password':'Password too weak (min 8 chars).',
    'auth/too-many-requests':'Too many attempts. Please wait.',
    'auth/invalid-credential':'Invalid email or password.',
    'auth/network-request-failed':'Network error. Check your connection.',
  })[code]||'Authentication failed. Please try again.';
}
async function doLogout() {
  try { await auth.signOut(); } catch(e) { toast('Logout error: '+e.message,'err'); }
}
document.getElementById('lemail').addEventListener('keydown', e=>{if(e.key==='Enter')doLogin();});
document.getElementById('lpwd').addEventListener('keydown',  e=>{if(e.key==='Enter')doLogin();});
document.getElementById('sname').addEventListener('keydown',  e=>{if(e.key==='Enter')doSignup();});
document.getElementById('semail').addEventListener('keydown', e=>{if(e.key==='Enter')doSignup();});
document.getElementById('spwd').addEventListener('keydown',  e=>{if(e.key==='Enter')doSignup();});
document.getElementById('scpwd').addEventListener('keydown', e=>{if(e.key==='Enter')doSignup();});
document.getElementById('reportModal').addEventListener('click', e=>{
  if(e.target===document.getElementById('reportModal')) closeReportModal();
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeReportModal(); });

/* ── PAGE NAVIGATION ─────────────────────────────────── */
function _hasActivePlan() {
  const plan = userProfile.plan;
  if (!plan || plan === null) return false;
  if (plan === 'free_trial') return !isTrialExpired();
  // All paid plans (starter/standard/premium/payperuse/custom) are active
  return true;
}

function goPage(name) {
  // Access control — block restricted pages if no active plan
  const RESTRICTED = ['map', 'compare'];
  if (RESTRICTED.includes(name) && !_hasActivePlan()) {
    _showNoPlanBlock(name);
    return;
  }

  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(name+'Page').classList.add('active');
  document.querySelectorAll('.page-tab').forEach(t=>t.classList.remove('active'));
  const dt = document.getElementById('pt-'+name);
  if (dt) dt.classList.add('active');
  document.querySelectorAll('.mob-tab').forEach(t=>t.classList.remove('active'));
  const mt = document.getElementById('mpt-'+name);
  if (mt) mt.classList.add('active');
  if (name==='history')  loadHistoryPage();
  if (name==='plans')    renderPlansPage();
  if (name==='compare')  initCompare();
  if (name==='profile')  { updateProfilePage(); loadProgressStats(); }
  if (name==='settings') { updateSettingsUI(); buildModelSelector(); }
  if (name==='map' && map) setTimeout(()=>map.invalidateSize(),100);
}

function _showNoPlanBlock(targetPage) {
  // Show a friendly block modal directing user to plans/trial
  let modal = document.getElementById('noPlanModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'noPlanModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(14px);z-index:99980;display:flex;align-items:center;justify-content:center;padding:20px;';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div style="background:linear-gradient(160deg,#0d1828,#080d17);border:1px solid rgba(74,124,255,0.3);border-radius:22px;padding:30px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 0 60px rgba(74,124,255,0.12),0 32px 80px rgba(0,0,0,0.8);animation:authIn 0.4s ease;">
    <div style="font-size:44px;margin-bottom:12px">🔒</div>
    <div style="font-size:20px;font-weight:900;color:#e8edf8;margin-bottom:8px">No Active Plan</div>
    <div style="font-size:13px;color:#8899bb;line-height:1.7;margin-bottom:20px">
      You need an active plan to access <strong style="color:#e8edf8">${targetPage.charAt(0).toUpperCase()+targetPage.slice(1)}</strong>.<br>
      Start your <strong style="color:#00e5c8">free 14-day trial</strong> or upgrade to unlock everything.
    </div>
    <button onclick="document.getElementById('noPlanModal').style.display='none';goPage('plans');" style="width:100%;padding:13px;background:linear-gradient(135deg,#00e5c8,#4a9eff);border:none;border-radius:12px;font-weight:900;font-size:14px;color:#04060e;cursor:pointer;margin-bottom:10px;box-shadow:0 4px 20px rgba(0,229,200,0.3);">
      ⭐ View Plans & Start Trial
    </button>
    <button onclick="document.getElementById('noPlanModal').style.display='none';" style="width:100%;padding:10px;background:transparent;border:1px solid rgba(255,255,255,0.08);border-radius:10px;font-size:12px;color:#3a4a62;cursor:pointer;">
      Back
    </button>
  </div>`;
  modal.style.display = 'flex';
}

/* ── MAP ─────────────────────────────────────────────── */
let map, mapMarker;
let pendingLat=null, pendingLon=null;
let pendingCountryCode=null;  // ISO2 code e.g. "IN", "US" — fetched on map click
const _flagCache = {};         // cache countryCode → flag img URL

function initMap() {
  if (map) return;
  map = L.map('map',{zoomControl:true}).setView([20.59,78.96],4);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    attribution:'&copy; OpenStreetMap &copy; CARTO', maxZoom:19
  }).addTo(map);
  map.on('click', e=>{
    pendingLat = e.latlng.lat; pendingLon = e.latlng.lng;
    pendingCountryCode = null; // reset — will be fetched below
    console.log('[map click] lat='+pendingLat.toFixed(4)+' lon='+pendingLon.toFixed(4));
    placePin(pendingLat, pendingLon, '#00d4aa');
    showPill(pendingLat, pendingLon);
    // Animate send button
    const btn=document.getElementById('sendBtn');
    btn.style.boxShadow='0 6px 28px rgba(0,212,170,0.55)';
    btn.style.transform='scale(1.06)';
    btn.style.transition='all 0.3s cubic-bezier(0.34,1.56,0.64,1)';
    setTimeout(()=>{btn.style.transform='scale(1)';},350);
    setTimeout(()=>{btn.style.boxShadow='0 4px 18px rgba(0,212,170,0.35)';},1200);
    // Auto-fill country + fetch ISO2 code (both non-blocking)
    const inp=document.getElementById('countryInput');
    fetchGeo(pendingLat, pendingLon)
      .then(g=>{
        const c=g.address?.country||'';
        if(c && inp && !inp.value.trim()) inp.value=c;
      }).catch(()=>{});
    // Separately fetch ISO2 country code for flag image
    fetchCountryCode(pendingLat, pendingLon)
      .then(code=>{ pendingCountryCode = code; console.log('[flag] countryCode='+code); })
      .catch(()=>{});
    toast('📍 Location selected — press ⚡ Send Report','ok');
  });
  // Error handler for tile failures
  map.on('tileerror', ()=>{ console.warn('[map] tile load error'); });
}
function placePin(lat,lng,color) {
  if (mapMarker) map.removeLayer(mapMarker);
  mapMarker = L.circleMarker([lat,lng],{radius:9,fillColor:color,color:'#fff',weight:2,fillOpacity:0.95}).addTo(map);
}
function showPill(lat,lng) {
  const p=document.getElementById('cpill');
  p.style.display='block'; p.textContent=lat.toFixed(4)+'°  '+lng.toFixed(4)+'°';
}

/* ── SEND HANDLER ────────────────────────────────────── */
async function handleSend() {
  console.log('[handleSend] pendingLat='+pendingLat+' pendingLon='+pendingLon);
  if (pendingLat===null||pendingLon===null) {
    toast('📍 Please click a location on the map first.','err');
    const mapEl=document.getElementById('map');
    if(mapEl){
      mapEl.style.boxShadow='0 0 0 3px var(--red)';
      mapEl.style.transition='box-shadow 0.3s';
      setTimeout(()=>{mapEl.style.boxShadow='';},2000);
    }
    // Scroll to map on mobile
    const sendBar=document.querySelector('.send-bar');
    if(sendBar) sendBar.scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }
  const plan = userProfile.plan||'free_trial';
  if (!canGenerate()) {
    if (!plan || plan === null) showNoKeyError();
    else showLimitReached('generation');
    return;
  }
  // Check network
  if (!navigator.onLine) {
    const cached=await loadCachedReport(pendingLat,pendingLon);
    if(cached){curData=cached;updateMapTooltip(cached.geo,cached.ai);renderReport(pendingLat,pendingLon,cached.geo,cached.country,cached.wiki,cached.ai);toast('📶 Offline — showing cached report','warn');}
    else{toast('📶 You are offline and no cached report exists for this location.','err');}
    return;
  }
  await generateReport(pendingLat, pendingLon);
}
function showNoKeyError() {
  document.getElementById('idleBox').style.display='none';
  document.getElementById('loadbox').style.display='none';
  const w=document.getElementById('resultWrap'); w.style.display='block';
  w.innerHTML=`<div class="ebox" style="color:var(--amber);background:rgba(255,202,69,0.06);border-color:rgba(255,202,69,0.3)">
    ⚠ <strong>API Key Required</strong><br><br>You are on the Free plan. ${getNoKeyMessage()}<br><br>
    <button onclick="goPage('settings')" style="background:rgba(0,229,200,0.1);border:1px solid rgba(0,229,200,0.3);color:var(--cyan);padding:7px 18px;border-radius:7px;font-weight:700;font-size:12px">⚙ Go to Settings</button>
  </div>`;
  goTab('a',document.getElementById('t-a'));
}

/* ── REPORT PIPELINE ─────────────────────────────────── */
async function generateReport(lat, lon) {
  showLoading();
  console.log('[generateReport] lat='+lat.toFixed(4)+' lon='+lon.toFixed(4));
  try {
    // ── Check cache first ─────────────────────────────
    step('Checking cache…', 6);
    const cached = await loadCachedReport(lat, lon);
    if (cached) {
      step('✓ Loaded from cache — instant!', 100);
      curData = cached;
      updateMapTooltip(cached.geo, cached.ai);
      renderReport(lat, lon, cached.geo, cached.country, cached.wiki, cached.ai);
      toast('⚡ Report loaded from cache instantly', 'ok');
      return;
    }
    step('📍 Looking up location…',14);
    const geo = await fetchGeo(lat, lon);
    const locName = geo.address?.city || geo.address?.state || geo.address?.country || 'this location';
    step('🌍 Fetching country data for '+locName+'…',28);
    const country = await fetchCountry(geo.address?.country||'');
    step('📖 Fetching Wikipedia summary…',42);
    const wiki = await fetchWiki(geo.address?.city||geo.address?.state||geo.address?.country||'');
    step('🤖 AI generating report — please wait…',58);
    const ai = await generateAIReport(lat, lon, geo, country, wiki);
    step('💾 Saving report…',82);
    await incrementGeneration();
    await saveQuery(lat, lon, geo, ai);
    await cacheReport(lat, lon, geo, country, wiki, ai);
    step('✓ Report complete!',100);
    curData = {geo, country, wiki, lat, lon, ai};
    updateMapTooltip(geo, ai);
    renderReport(lat, lon, geo, country, wiki, ai);
  } catch(err) {
    console.error('[generateReport]', err);
    let msg = err.message || 'Unknown error occurred.';

    // ── Accurate error classification ──────────────────
    if (!navigator.onLine) {
      // Device is genuinely offline
      msg = '📶 You are offline. Connect to the internet and try again.';

    } else if (msg.includes('No API key') || msg.includes('API key required')) {
      msg = '🔑 No API key configured. Go to <strong>Settings ⚙</strong> and add your API key, or purchase a plan.';

    } else if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('key')) {
      msg = '❌ Invalid API key. Check your key in <strong>Settings ⚙</strong> and make sure it has the correct permissions.';

    } else if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
      msg = '⏱ API quota exceeded. Wait a moment and try again, or switch to a different model in Settings.';

    } else if (msg.includes('403') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('access denied')) {
      msg = '🚫 API access denied. Your key may not have permission for this model. Check Settings ⚙.';

    } else if (msg.includes('503') || msg.toLowerCase().includes('loading') || msg.toLowerCase().includes('unavailable')) {
      msg = '🔄 AI model is loading or busy. Wait 20 seconds and try again.';

    } else if (msg.toLowerCase().includes('json') || msg.toLowerCase().includes('syntaxerror') || msg.toLowerCase().includes('parse')) {
      msg = '⚠ The AI returned an unexpected response format. Try again or switch to a different model in Settings.';

    } else if (
      msg.toLowerCase().includes('failed to fetch') ||
      msg.toLowerCase().includes('networkerror') ||
      msg.toLowerCase().includes('network error') ||
      msg.toLowerCase().includes('err_name_not_resolved') ||
      msg.toLowerCase().includes('err_connection') ||
      (err instanceof TypeError && msg.toLowerCase().includes('fetch'))
    ) {
      // Only show network error when it's actually a network issue (not just any fetch)
      msg = '📶 Could not reach the AI server. Check your internet connection, or try a different AI model in Settings.';

    } else if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('aborted')) {
      msg = '⏰ Request timed out. Check your connection and try again, or switch to a faster model.';

    } else {
      // Generic fallback — show clear message + contact
      msg = '🤔 Something went wrong while generating your report.<br>'
          + '<span style="color:var(--text2)">' + (msg || 'Unknown error') + '</span>';
    }
    // Always append contact hint
    msg += '<br><span style="font-size:11px;color:var(--muted)">Problem persists? Email '
         + '<a href="mailto:becreativethink3@gmail.com" style="color:var(--cyan);font-weight:600">becreativethink3@gmail.com</a>'
         + '</span>';
    showErrWithRetry(msg);
  }
}

/* ── Show error with retry button ──────────────────────── */
function showErrWithRetry(msg) {
  const wrap = document.getElementById('resultWrap');
  document.getElementById('idleBox').style.display = 'none';
  document.getElementById('loadbox').style.display = 'none';
  wrap.style.display = 'block';
  wrap.innerHTML = `
    <div class="ebox" style="text-align:left">
      <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:10px">⚠ Report Generation Failed</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:14px">${msg}</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:16px">
        If the problem persists, email us at
        <a href="mailto:becreativethink3@gmail.com" style="color:var(--cyan);font-weight:700">becreativethink3@gmail.com</a>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="retryLastReport()" style="
          padding:10px 22px;
          background:linear-gradient(135deg,var(--primary),var(--secondary));
          color:#fff;font-weight:700;font-size:12px;
          border:none;border-radius:10px;cursor:pointer;
          box-shadow:0 4px 14px rgba(74,124,255,0.35);
        ">🔄 Try Again</button>
        <button onclick="goPage('settings')" style="
          padding:10px 18px;
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
          color:var(--text2);font-size:12px;font-weight:600;
          border-radius:10px;cursor:pointer;
        ">⚙ Settings</button>
      </div>
    </div>`;
}

/* ── Retry last report — same lat/lon, no page reset ───── */
function retryLastReport() {
  if (pendingLat === null || pendingLon === null) {
    toast('No location selected — please click the map first.', 'err');
    return;
  }
  // Clear error UI
  document.getElementById('resultWrap').style.display = 'none';
  document.getElementById('resultWrap').innerHTML = '';
  // Re-run with same coordinates
  toast('Retrying…', 'warn');
  generateReport(pendingLat, pendingLon);
}
function updateMapTooltip(geo, ai) {
  const tip=document.getElementById('ptip');
  document.getElementById('ptName').textContent = ai.locationId?.nearestCity||geo.address?.city||'';
  document.getElementById('ptLang').innerHTML   = ai.localInfo?.localLanguages?'🗣 '+ai.localInfo.localLanguages:'';
  document.getElementById('ptLoc').textContent  = [geo.address?.state,geo.address?.country].filter(Boolean).join(', ');
  tip.style.display='block';
  if (ai.localInfo?.famousFor?.length) {
    const fb=document.getElementById('famBar'); fb.style.display='block';
    fb.innerHTML='⭐ '+ai.localInfo.famousFor.map(f=>`<span class="fi-chip">${f}</span>`).join('');
  }
}

/* ── DATA FETCHERS ───────────────────────────────────── */

/* fetchGeo: NON-FATAL — returns empty address object if it fails.
   This means a bad geocoding response will NEVER block report generation. */
async function fetchGeo(lat, lon) {
  console.log('[fetchGeo] lat='+lat.toFixed(4)+' lon='+lon.toFixed(4));
  const emptyFallback = { address: {
    country: document.getElementById('countryInput')?.value.trim() || '',
    city: '', state: ''
  }};

  // AbortController (WebView-safe — AbortSignal.timeout() not available in old Android)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers: { 'Accept-Language': 'en' }, signal: controller.signal }
    );
    clearTimeout(timer);
    if (!r.ok) {
      console.warn('[fetchGeo] HTTP', r.status, '— using fallback');
      return emptyFallback;
    }
    const data = await r.json();
    console.log('[fetchGeo] address:', data.address?.city || data.address?.state || data.address?.country || 'unknown');
    return data;
  } catch(e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      console.warn('[fetchGeo] timed out — using fallback');
    } else {
      console.warn('[fetchGeo] error:', e.message, '— using fallback');
    }
    // Return fallback — do NOT throw. Report generation continues.
    return emptyFallback;
  }
}

async function fetchCountry(name) {
  if (!name) return null;
  try {
    const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`);
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d) ? d[0] : null;
  } catch(e) {
    console.warn('[fetchCountry]', e.message);
    return null;
  }
}

async function fetchWiki(place) {
  if (!place) return null;
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(place)}`);
    return r.ok ? r.json() : null;
  } catch(e) {
    console.warn('[fetchWiki]', e.message);
    return null;
  }
}


/* ── AI REPORT GENERATOR ─────────────────────────────── */
async function generateAIReport(lat, lon, geo, country, wiki) {
  const apiKey = getReportAPIKey();
  if (!apiKey) {
    if (!userProfile.plan || userProfile.plan==='free') throw new Error('No API key configured. Please add your API key in Settings.');
    throw new Error('No API key available. Please contact support.');
  }
  const model  = getSelectedModel(false);
  const cls    = gv('classLevel');
  const exam   = gv('examType');
  const mode   = gv('learningMode');
  const addr   = geo.address||{};
  const loc    = [addr.city,addr.state,addr.country].filter(Boolean).join(', ')||`${lat},${lon}`;
  const country_input = document.getElementById('countryInput').value.trim()||addr.country||'';
  const userQ  = document.getElementById('userQuestion').value.trim();
  const lPick  = document.getElementById('langPick');
  const langName = lPick?lPick.options[lPick.selectedIndex].text.replace(/^[\uD83C][\uDDE6-\uDDFF]{2}\s*/,''):'English';

  const prompt = `You are GeoMind — an Expert AI Educational Geo-Intelligence System for Indian competitive exam preparation (UPSC, SSC, State PCS, Class 11-12 Geography).

GENERATE A DETAILED, COMPREHENSIVE, EXAM-READY REPORT. Every field MUST have 2-3 detailed sentences minimum with specific facts, names, dates, and numbers. No vague or one-word answers.

LOCATION: ${loc} | LAT: ${lat} | LON: ${lon}
COUNTRY: ${country_input} | STATE: ${addr.state||'?'} | DISTRICT: ${addr.county||addr.district||'?'}
CLASS: ${cls} | EXAM: ${exam} | MODE: ${mode} | RESPONSE LANGUAGE: ${langName}
${userQ?'STUDENT QUESTION: '+userQ:''}
WIKI: ${wiki?.extract?.substring(0,500)||'N/A'}
POPULATION: ${country?.population||'?'} | CAPITAL: ${country?.capital?.[0]||'?'}
LANGUAGES: ${country?.languages?Object.values(country.languages).join(', '):'N/A'}

REPORT STRUCTURE RULES:
- geography.terrain: Describe landforms, elevation range, hills, plains, plateaus in 2-3 sentences
- geography.climate: Name the climate zone, annual rainfall mm, temperature range, seasons with months
- geography.soilType: Specific soil types (alluvial/black/red/laterite etc.) with agricultural significance
- geography.rivers: Name all major rivers, tributaries, their origin and destination
- geography.naturalResources: List minerals, forests, energy sources with quantities if known
- agriculture.majorCrops: Each entry = "CropName — reason it grows here (soil/climate factor)"
- agriculture.whyCropsGrow: Detailed agri-geography explanation with soil, rainfall, temperature data
- history.ancient/medieval/modern/freedomMovement: Specific dynasties, rulers, battles, years, events
- economy.majorIndustries: Each entry = "IndustryName — scale/significance with numbers"
- currentRelevance.developmentProjects: Real government schemes, missions, corridors relevant here
- localInfo.importantFacts: 4 unique, exam-specific facts ONLY about this location
- timeline: 5 specific historical events with exact years
- quiz.mcqs: 5 MCQs specific to this location — not generic India geography
- examFocus: 4 key points a student MUST remember for competitive exams
- chartData: MUST provide estimated numeric data for charts. Use real/approximate regional data with units.
  * chartData.rainfall_mm: approximate annual rainfall in mm (e.g. 800 for semi-arid, 1500 for humid)
  * chartData.temperature_summer_c: average summer temperature in Celsius
  * chartData.temperature_winter_c: average winter temperature in Celsius
  * chartData.forest_cover_pct: estimated forest cover percentage (0-100)
  * chartData.agri_land_pct: estimated agricultural land percentage (0-100)
  * chartData.crops: array of {name, rank_pct} where rank_pct is relative importance (top crop=100, others proportionally less, based on regional data)
  * chartData.industries: array of {name, rank_pct} relative economic importance (100=most important)
  * chartData.population_approx: approximate population (number, e.g. 500000 for city, 5000000 for large district)
  If exact data unknown, use best regional estimate and note "~" prefix. Never use 0 unless truly negligible.

Return ONLY compact valid JSON (no markdown, no backticks, no explanation outside JSON):
{"locationId":{"country":"","state":"","district":"","nearestCity":"","coordinates":""},"geography":{"terrain":"2-3 detailed sentences","climate":"2-3 detailed sentences with data","soilType":"specific types and significance","rivers":"all major rivers named","naturalResources":"specific resources listed"},"agriculture":{"majorCrops":["Crop1 — reason","Crop2 — reason","Crop3 — reason"],"whyCropsGrow":"detailed agri-geo explanation","irrigationSources":"rivers/canals/groundwater with names","seasonalPattern":"Kharif/Rabi/Zaid with months"},"history":{"ancient":"specific dynasties and periods","medieval":"specific rulers and events","modern":"British era and key events","freedomMovement":"specific freedom fighters and events from this region"},"economy":{"majorIndustries":["Industry1 — scale","Industry2 — scale","Industry3 — scale"],"gdpContribution":"contribution data if known","employmentPattern":"dominant employment sectors"},"currentRelevance":{"environmentalIssues":"specific local environmental challenges","developmentProjects":"real schemes and projects — PMGSY, Smart City, Industrial Corridor etc.","strategicImportance":"border/defense/trade significance if any"},"localInfo":{"localLanguages":"languages and dialects","famousFor":["specific thing 1","specific thing 2","specific thing 3"],"famousPlaces":["Place1 — why famous","Place2 — why famous"],"famousPersonalities":["Person1 — contribution","Person2 — contribution"],"festivals":["Festival1 — season","Festival2 — season"],"localCuisine":["dish1","dish2"],"importantFacts":["unique exam fact 1","unique exam fact 2","unique exam fact 3","unique exam fact 4"]}${userQ?',"userAnswer":"Detailed answer to: '+userQ+' — minimum 4 sentences with specific data and facts"':''},"chartData":{"rainfall_mm":0,"temperature_summer_c":0,"temperature_winter_c":0,"forest_cover_pct":0,"agri_land_pct":0,"crops":[{"name":"Crop1","rank_pct":100},{"name":"Crop2","rank_pct":70}],"industries":[{"name":"Industry1","rank_pct":100},{"name":"Industry2","rank_pct":65}],"population_approx":0}},"timeline":[{"year":"YYYY","event":"detailed event description"},{"year":"YYYY","event":"detailed event description"},{"year":"YYYY","event":"detailed event description"},{"year":"YYYY","event":"detailed event description"},{"year":"YYYY","event":"detailed event description"}],"quiz":{"mcqs":[{"q":"Location-specific question","options":["A. option","B. option","C. option","D. option"],"answer":"A"},{"q":"question","options":["A. option","B. option","C. option","D. option"],"answer":"B"},{"q":"question","options":["A. option","B. option","C. option","D. option"],"answer":"C"},{"q":"question","options":["A. option","B. option","C. option","D. option"],"answer":"D"},{"q":"question","options":["A. option","B. option","C. option","D. option"],"answer":"A"}],"assertionReason":[{"assertion":"factual assertion about this location","reason":"scientific/historical reason","answer":"Both A and R are true and R is the correct explanation"},{"assertion":"assertion","reason":"reason","answer":"Both A and R are true but R is NOT the correct explanation"}],"mapQuestion":"Describe exact map position, surrounding states/countries, nearest major city"},"examFocus":["Exam point 1 — unique to this location","Exam point 2 — must-know fact","Exam point 3 — often asked in exams","Exam point 4 — recent development"]}
All values in ${langName}. Produce complete, highly detailed, exam-ready content with specific facts, numbers, and names throughout.`;

  const raw = await callAI(prompt, apiKey, model);
  let text = raw.replace(/```json|```/g,'').trim();
  const f=text.indexOf('{'), l=text.lastIndexOf('}');
  if (f!==-1&&l!==-1) text=text.substring(f,l+1);
  try { return JSON.parse(text); } catch { return fixJSON(text); }
}

function fixJSON(s) {
  let inStr=false,esc=false;
  for(let i=0;i<s.length;i++){if(esc){esc=false;continue;}if(s[i]==='\\'){esc=true;continue;}if(s[i]==='"')inStr=!inStr;}
  if(inStr)s+='"';
  let op=0,ar=0;inStr=false;esc=false;
  for(let i=0;i<s.length;i++){if(esc){esc=false;continue;}if(s[i]==='\\'){esc=true;continue;}if(s[i]==='"'){inStr=!inStr;continue;}if(inStr)continue;if(s[i]==='{')op++;else if(s[i]==='}')op--;else if(s[i]==='[')ar++;else if(s[i]===']')ar--;}
  s=s.replace(/,\s*([}\]])/g,'$1');
  while(ar-->0)s+=']'; while(op-->0)s+='}';
  return JSON.parse(s);
}
function gv(id){const e=document.getElementById(id);return e?e.value:'';}

/* ── FIREBASE SAVE ───────────────────────────────────── */
async function saveQuery(lat,lon,geo,ai) {
  if (!currentUser) return;
  const addr=geo.address||{};
  const rec={
    userId:currentUser.uid, latitude:parseFloat(lat), longitude:parseFloat(lon),
    selectedPlace:ai.locationId?.nearestCity||addr.city||addr.state||addr.country||'',
    country:addr.country||'', state:addr.state||'',
    userClass:gv('classLevel'), examType:gv('examType'), mode:gv('learningMode'), language:curLang,
    userQuestion:document.getElementById('userQuestion').value.trim(),
    aiResponse:JSON.stringify(ai), famousFor:ai.localInfo?.famousFor||[],
    localLanguages:ai.localInfo?.localLanguages||'',
    timestamp:new Date().toISOString()
  };
  try { await db.ref('users/'+currentUser.uid+'/queries').push(rec); }
  catch(e){console.warn('saveQuery:',e);}
}
async function saveChatMsg(q, ans) {
  if (!currentUser || !curData.lat) return;
  const record = {
    location:  curData.ai?.locationId?.nearestCity || '',
    country:   curData.ai?.locationId?.country || '',
    lat:       curData.lat,
    lon:       curData.lon,
    question:  q,
    answer:    ans,
    timestamp: new Date().toISOString()
  };
  try {
    // Save to legacy path (for progress stats query)
    await db.ref('users/' + currentUser.uid + '/chats').push(record);
    // Also save to new chatHistory path for Chat History page
    await db.ref('chatHistory/' + currentUser.uid).push(record);
  } catch(e) { console.warn('[saveChatMsg]', e.message); }
}


/* ── TABS (MAP PAGE) ─────────────────────────────────── */
function goTab(name,btn) {
  document.querySelectorAll('.tpanel').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on'));
  document.getElementById('tp-'+name).classList.add('on');
  btn.classList.add('on');
  if(name==='h') loadHistoryTab();
  if(name==='p') renderPricingTab();
}

/* ── HISTORY ─────────────────────────────────────────── */
async function loadHistoryTab() {
  const hc=document.getElementById('hcontent');
  hc.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);font-size:11px"><div class="spin-lg" style="margin:0 auto 10px"></div>Loading…</div>';
  await renderHistoryInto(hc, true);
}

async function loadHistoryPage() {
  const activeTab = _histTab || 'reports';
  // Ensure only the right tab is visible
  const repContent  = document.getElementById('historyPageContent');
  const cmpContent  = document.getElementById('historyCompareContent');
  const chatContent = document.getElementById('historyChatContent');
  [repContent, cmpContent, chatContent].forEach(el => { if (el) el.style.display = 'none'; });

  if (activeTab === 'compare') {
    if (cmpContent) cmpContent.style.display = 'block';
    loadComparisonHistory();
  } else if (activeTab === 'chat') {
    if (chatContent) chatContent.style.display = 'block';
    loadChatHistory();
  } else {
    if (repContent) { repContent.style.display = 'block'; }
    if (repContent) repContent.innerHTML = '<div class="hempty"><div class="spin-lg" style="margin:0 auto 12px"></div><p>Loading reports…</p></div>';
    await renderHistoryInto(repContent, false);
  }
}

/* ════════════════════════════════════════════════════
   HISTORY RENDERING ENGINE — v2 (full fix)
   Pagination: 20 per page, all sorted newest-first
   ════════════════════════════════════════════════════ */
const HIST_PAGE_SIZE = 20;
let _histAllEntries = [];   // full sorted dataset
let _histCurrentPage = 1;  // active page
let _histContainer   = null;
let _histCompact     = false;
let _histSearchQuery = '';

async function renderHistoryInto(container, compact) {
  _histContainer = container;
  _histCompact   = compact;
  try {
    console.log('[GeoMind History] Fetching all records for uid:', currentUser.uid);
    const snap = await db.ref('users/' + currentUser.uid + '/queries').once('value');

    if (!snap.exists() || !snap.val()) {
      console.log('[GeoMind History] No records found');
      container.innerHTML = `
        <div class="hempty">
          <div class="hempty-icon">📍</div>
          <p>No history yet.<br>Start exploring the map!</p>
        </div>`;
      return;
    }

    const raw = snap.val();
    // Sort ALL entries newest-first — NO limit
    _histAllEntries = Object.entries(raw)
      .map(([id, rec]) => ({ id, ...rec }))
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    console.log('[GeoMind History] Total records:', _histAllEntries.length);

    _histCurrentPage = 1;
    _histSearchQuery = '';
    _renderHistPage(container, compact);
  } catch(e) {
    console.error('[GeoMind History] Load error:', e);
    container.innerHTML = `<div class="ebox">❌ Failed to load history: ${e.message}</div>`;
  }
}

function _renderHistPage(container, compact) {
  if (!container) return;

  // Filter by search query
  const q = (_histSearchQuery || '').toLowerCase().trim();
  const filtered = q
    ? _histAllEntries.filter(r =>
        (r.selectedPlace || '').toLowerCase().includes(q) ||
        (r.state || '').toLowerCase().includes(q) ||
        (r.country || '').toLowerCase().includes(q)
      )
    : _histAllEntries;

  const total    = filtered.length;
  const totalPgs = Math.max(1, Math.ceil(total / HIST_PAGE_SIZE));
  const page     = Math.min(_histCurrentPage, totalPgs);
  const start    = (page - 1) * HIST_PAGE_SIZE;
  const pageData = filtered.slice(start, start + HIST_PAGE_SIZE);

  console.log(`[GeoMind History] Rendering page ${page}/${totalPgs}, items ${start+1}–${start+pageData.length} of ${total}`);

  let html = '';

  // ── Search bar + controls row ─────────────────────
  html += `
    <div style="margin-bottom:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <div class="hist-search-bar" style="flex:1;min-width:200px;">
        <span class="hist-search-icon">🔍</span>
        <input type="text" placeholder="Search locations…" value="${_histSearchQuery}"
          oninput="histSearchFilter(this.value)" id="histSearchInput"/>
      </div>
      <button class="hclr" onclick="clearHistory()">🗑 Clear All</button>
    </div>`;

  // ── Count row ─────────────────────────────────────
  html += `<div class="hist-count">
    <strong>${total}</strong> record${total !== 1 ? 's' : ''}
    ${q ? ` matching "<em>${q}</em>"` : ''}
    ${totalPgs > 1 ? ` · Page <strong>${page}</strong> of <strong>${totalPgs}</strong>` : ''}
  </div>`;

  if (total === 0) {
    html += `<div class="hempty"><div class="hempty-icon">🔍</div><p>No results for "${q}"</p></div>`;
    container.innerHTML = html;
    return;
  }

  // ── Cards grid ────────────────────────────────────
  if (!compact) html += `<div class="hgrid">`;

  pageData.forEach((rec, idx) => {
    const d  = new Date(rec.timestamp);
    const ds = isNaN(d)
      ? (rec.timestamp || '—')
      : d.toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})
        + ' · ' + d.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});

    // Store record by ID for retrieval (avoids URL encoding giant JSON)
    const safeId = encodeURIComponent(rec.id);

    const classTag = rec.userClass ? `<span class="hmeta-tag">${rec.userClass}</span>` : '';
    const examTag  = rec.examType  ? `<span class="hmeta-tag amber">${rec.examType}</span>`  : '';
    const modeTag  = rec.learningMode ? `<span class="hmeta-tag green">${rec.learningMode}</span>` : '';

    const famousPreview = (rec.famousFor || []).slice(0, 2).join(', ');
    const locationLine  = [rec.state, rec.country].filter(Boolean).join(', ') || 'Unknown region';

    html += `
      <div class="hitem" onclick="previewHistByIdOrEnc('${safeId}')">
        <div class="hitem-top">
          <div class="hitem-pin">📍</div>
          <div class="hitem-title">
            <div class="hname" title="${rec.selectedPlace || 'Unknown'}">${rec.selectedPlace || 'Unknown Location'}</div>
            <div class="hmeta" style="margin-top:2px;">${locationLine}</div>
          </div>
        </div>
        ${classTag || examTag || modeTag ? `<div class="hmeta-tags">${classTag}${examTag}${modeTag}</div>` : ''}
        ${famousPreview ? `<div class="hmeta" style="margin-top:6px;color:var(--text2)">⭐ ${famousPreview}</div>` : ''}
        <div class="hcoord">📡 ${(rec.latitude||0).toFixed(4)}°, ${(rec.longitude||0).toFixed(4)}°</div>
        <div class="hitem-divider"></div>
        <div class="hitem-footer">
          <div class="hts">${ds}</div>
          <div class="hitem-actions">
            <button class="h-view-btn" onclick="event.stopPropagation();previewHistByIdOrEnc('${safeId}')">📊 Report</button>
            <button class="h-map-btn"  onclick="event.stopPropagation();reloadHistById('${safeId}')">🗺 Map</button>
          </div>
        </div>
      </div>`;
  });

  if (!compact) html += '</div>';

  // ── Pagination ────────────────────────────────────
  if (totalPgs > 1) {
    html += `<div class="hist-pagination">
      <button class="hist-page-btn" onclick="histGoPage(1)" ${page<=1?'disabled':''}>«</button>
      <button class="hist-page-btn" onclick="histGoPage(${page-1})" ${page<=1?'disabled':''}>‹ Prev</button>
      <span class="hist-page-info">${page} / ${totalPgs}</span>
      <button class="hist-page-btn" onclick="histGoPage(${page+1})" ${page>=totalPgs?'disabled':''}>Next ›</button>
      <button class="hist-page-btn" onclick="histGoPage(${totalPgs})" ${page>=totalPgs?'disabled':''}>»</button>
    </div>`;
  }

  container.innerHTML = html;
}

/* ── Search filter (debounced) ───────────────────── */
let _histSearchTimer = null;
function histSearchFilter(query) {
  clearTimeout(_histSearchTimer);
  _histSearchTimer = setTimeout(() => {
    _histSearchQuery  = query;
    _histCurrentPage  = 1;
    _renderHistPage(_histContainer, _histCompact);
  }, 280);
}

/* ── Pagination handler ──────────────────────────── */
function histGoPage(p) {
  const total    = (_histSearchQuery
    ? _histAllEntries.filter(r =>
        (r.selectedPlace||'').toLowerCase().includes(_histSearchQuery.toLowerCase()) ||
        (r.state||'').toLowerCase().includes(_histSearchQuery.toLowerCase()) ||
        (r.country||'').toLowerCase().includes(_histSearchQuery.toLowerCase())
      )
    : _histAllEntries).length;
  const totalPgs = Math.max(1, Math.ceil(total / HIST_PAGE_SIZE));
  _histCurrentPage = Math.max(1, Math.min(p, totalPgs));
  _renderHistPage(_histContainer, _histCompact);
  // Scroll to top of container
  if (_histContainer) _histContainer.scrollTop = 0;
}

/* ── Look up record from in-memory cache ─────────── */
function _getHistRecById(safeId) {
  const id = decodeURIComponent(safeId);
  return _histAllEntries.find(r => r.id === id) || null;
}

/* ── Preview by ID — fetches from Firebase if cache empty ── */
async function previewHistByIdOrEnc(safeId) {
  let rec = _getHistRecById(safeId);
  if (!rec) {
    // Cache miss — reload from Firebase then retry
    try {
      const id  = decodeURIComponent(safeId);
      const snap = await db.ref('users/' + currentUser.uid + '/queries/' + id).once('value');
      if (snap.exists()) {
        rec = { id, ...snap.val() };
        // Repopulate cache if it is empty
        if (_histAllEntries.length === 0) {
          const allSnap = await db.ref('users/' + currentUser.uid + '/queries').once('value');
          if (allSnap.exists()) {
            _histAllEntries = Object.entries(allSnap.val())
              .map(([k, v]) => ({ id: k, ...v }))
              .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          }
        }
      }
    } catch(e) { /* fall through */ }
  }
  if (!rec) { toast('Report not found — try reloading the History tab', 'err'); return; }
  previewHistReport(encodeURIComponent(JSON.stringify(rec)));
}

/* ── Open on Map — fetches from Firebase if cache empty ── */
async function reloadHistById(safeId) {
  let rec = _getHistRecById(safeId);
  if (!rec) {
    try {
      const id   = decodeURIComponent(safeId);
      const snap = await db.ref('users/' + currentUser.uid + '/queries/' + id).once('value');
      if (snap.exists()) rec = { id, ...snap.val() };
    } catch(e) { /* fall through */ }
  }
  if (!rec) { toast('Location not found — try reloading the History tab', 'err'); return; }
  reloadHist(encodeURIComponent(JSON.stringify(rec)));
}
async function clearHistory(fromSettings=false) {
  if (!confirm('Delete all your report history? This cannot be undone.')) return;
  await db.ref('users/'+currentUser.uid+'/queries').remove();
  _histAllEntries  = [];
  _histCurrentPage = 1;
  toast('History cleared','ok');
  if (!fromSettings) {
    // Refresh both tabs
    loadHistoryTab();
    const hc = document.getElementById('historyPageContent');
    if (hc) hc.innerHTML = '<div class="hempty"><div class="hempty-icon">📍</div><p>No history yet. Start exploring the map!</p></div>';
  }
}
function reloadHist(enc) {
  try {
    const rec=JSON.parse(decodeURIComponent(enc));
    if (!rec||!rec.aiResponse) return;
    const ai=JSON.parse(rec.aiResponse);
    curData={geo:{address:{country:rec.country,state:rec.state,city:rec.selectedPlace}},lat:rec.latitude,lon:rec.longitude,ai};
    pendingLat=rec.latitude; pendingLon=rec.longitude;
    if(document.getElementById('classLevel')) document.getElementById('classLevel').value=rec.userClass||'Competitive';
    if(document.getElementById('examType'))   document.getElementById('examType').value  =rec.examType||'UPSC';
    placePin(rec.latitude,rec.longitude,'#3b82f6');
    map.setView([rec.latitude,rec.longitude],8);
    showPill(rec.latitude,rec.longitude);
    renderReport(rec.latitude,rec.longitude,{address:{country:rec.country,state:rec.state,city:rec.selectedPlace}},null,null,ai);
    goPage('map'); goTab('a',document.getElementById('t-a'));
    toast('Loaded from history (no API call)','ok');
  } catch(e) { toast('Load failed: '+e.message,'err'); }
}

/* ── CHAT ────────────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════
   CHART.JS VISUALIZATION ENGINE  — GeoMind v5
   Section 10: Report · Chat · Comparison Charts
   ═══════════════════════════════════════════════════════════ */

// ── Chart color palette (dark-theme safe) ──────────────────
const CHART_COLORS = {
  cyan:   'rgba(0,229,200,0.8)',
  blue:   'rgba(74,158,255,0.8)',
  green:  'rgba(52,211,153,0.8)',
  amber:  'rgba(255,202,69,0.8)',
  purple: 'rgba(157,122,255,0.8)',
  red:    'rgba(255,100,100,0.8)',
  teal:   'rgba(20,184,166,0.8)',
  orange: 'rgba(251,146,60,0.8)',
};
const PALETTE = Object.values(CHART_COLORS);

// Shared Chart.js default config for dark theme
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#b8c4d8', font: { size: 11, family: 'Inter, sans-serif' }, boxWidth: 14 }
    },
    tooltip: {
      backgroundColor: 'rgba(10,15,28,0.95)',
      titleColor: '#e8edf8',
      bodyColor: '#b8c4d8',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
    }
  },
  scales: {
    x: { ticks: { color: '#8899bb', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#8899bb', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
  }
};

// ── Destroy any existing Chart on a canvas (prevents memory leak) ──
function destroyChart(canvasId) {
  const existing = Chart.getChart(canvasId);
  if (existing) existing.destroy();
}

// ── Create a wrapper div for a chart ──────────────────────
function makeChartBox(title, height = 220) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
    border-radius:12px;padding:14px 12px;margin:10px 0;
  `;
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-size:11px;font-weight:700;color:var(--cyan);margin-bottom:10px;letter-spacing:0.04em;text-transform:uppercase;';
  titleEl.textContent = title;
  wrap.appendChild(titleEl);
  const canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = `position:relative;height:${height}px;width:100%;`;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;';
  canvasWrap.appendChild(canvas);
  wrap.appendChild(canvasWrap);
  return { wrap, canvas };
}

// ── Render a single generic chart ─────────────────────────
/* ════════════════════════════════════════════════════════════
   CHART ENGINE v3 — Strict validation + correct units
   ════════════════════════════════════════════════════════════ */

/* ── Normalise raw values to smart display values + scale ── */
function _smartScale(values) {
  const max = Math.max(...values.filter(v => isFinite(v) && v > 0));
  if (!max || max === 0) return { scaled: values, scaleLabel: '', scaleFactor: 1 };
  if (max >= 10000000)  return { scaled: values.map(v => +(v/10000000).toFixed(2)),  scaleLabel: '× 1 Crore',   scaleFactor: 10000000 };
  if (max >= 100000)    return { scaled: values.map(v => +(v/100000).toFixed(2)),     scaleLabel: '× 1 Lakh',    scaleFactor: 100000   };
  if (max >= 1000)      return { scaled: values.map(v => +(v/1000).toFixed(2)),       scaleLabel: '× 1000',      scaleFactor: 1000     };
  return { scaled: values.map(v => +Number(v).toFixed(2)), scaleLabel: '', scaleFactor: 1 };
}

/* ── Validate & normalise pie/doughnut values to sum=100 ─── */
function _validatePieValues(values) {
  const nums   = values.map(v => Math.max(0, Number(v) || 0));
  const total  = nums.reduce((s, v) => s + v, 0);
  if (total === 0) return null;                     // no data
  if (total > 110 || total < 90) {
    // Convert raw numbers to percentages
    return nums.map(v => +((v / total) * 100).toFixed(1));
  }
  // Already ≈ 100 — round to 1 decimal and fix rounding residual
  const pct = nums.map(v => +((v / total) * 100).toFixed(1));
  const diff = +(100 - pct.reduce((s, v) => s + v, 0)).toFixed(1);
  if (diff !== 0) pct[pct.length - 1] = +(pct[pct.length - 1] + diff).toFixed(1);
  return pct;
}

/* ── Main chart renderer ──────────────────────────────────── */
function renderSingleChart(container, type, title, labels, values, colors, opts) {
  // Basic guards
  if (!labels || labels.length < 1 || !values || values.length < 1) return false;
  const rawNums = values.map(v => Number(v) || 0);
  if (rawNums.every(v => v === 0)) return false;

  const clrs    = (colors || PALETTE).slice(0, labels.length);
  const yUnit   = (opts && opts.yLabel) || '';
  const isPie   = (type === 'pie' || type === 'doughnut');

  /* ── PIE: enforce sum=100 ── */
  let finalValues = rawNums;
  let finalUnit   = yUnit;
  let noteText    = '';
  let finalType   = type;

  if (isPie) {
    const pct = _validatePieValues(rawNums);
    if (!pct) return false;                    // all zeros → skip

    const anyOver = pct.some(v => v > 99.5);  // one slice >99% → not a real distribution
    if (anyOver) {
      finalType  = 'bar';                      // degrade to bar — pie would be meaningless
      finalValues = rawNums;
      noteText   = '⚠ Values not suitable for pie — shown as bar chart';
    } else {
      finalValues = pct;
      finalUnit   = '%';
      noteText    = '~ Percentages normalised to 100%';
    }
  }

  /* ── BAR/LINE: smart scaling ── */
  let scaleLabel = '';
  let scaleFactor = 1;
  if (finalType === 'bar' || finalType === 'line') {
    const ss = _smartScale(finalValues);
    finalValues  = ss.scaled;
    scaleLabel   = ss.scaleLabel;
    scaleFactor  = ss.scaleFactor;
    if (scaleLabel) {
      finalUnit = (yUnit ? yUnit + '  ' : '') + '(' + scaleLabel + ')';
    }
  }

  /* ── Build Chart.js config ── */
  const cfg = JSON.parse(JSON.stringify(CHART_DEFAULTS));

  if (finalType === 'pie' || finalType === 'doughnut') {
    delete cfg.scales;
    cfg.plugins = cfg.plugins || {};
    cfg.plugins.legend = { display: true, position: 'bottom', labels: { color: '#b8c4d8', font: { size: 10 }, padding: 12 } };
    cfg.plugins.tooltip = { callbacks: {
      label: function(ctx) {
        return '  ' + ctx.label + ':  ' + ctx.parsed.toFixed(1) + '%';
      }
    }};
    // Show % labels on slices via datalabels if available (graceful)
    cfg.plugins.datalabels = false;
  } else {
    // Y axis
    cfg.scales = cfg.scales || {};
    cfg.scales.y = cfg.scales.y || {};
    cfg.scales.y.beginAtZero = true;
    cfg.scales.y.ticks = { color: '#8899bb', font: { size: 10 } };
    cfg.scales.y.grid  = { color: 'rgba(255,255,255,0.05)' };
    if (finalUnit) {
      cfg.scales.y.title = { display: true, text: finalUnit, color: '#7a8faa', font: { size: 9 } };
    }
    // X axis — prevent label overlap
    cfg.scales.x = cfg.scales.x || {};
    cfg.scales.x.ticks = {
      color: '#8899bb', font: { size: 10 },
      maxRotation: 35, minRotation: 0,
      callback: function(val, idx) {
        const lbl = this.getLabelForValue ? this.getLabelForValue(idx) : labels[idx];
        return lbl && lbl.length > 14 ? lbl.substring(0, 13) + '…' : lbl;
      }
    };
    cfg.scales.x.grid = { color: 'rgba(255,255,255,0.04)' };
    // Tooltip
    cfg.plugins = cfg.plugins || {};
    cfg.plugins.tooltip = { callbacks: {
      label: function(ctx) {
        const raw = (ctx.parsed.y * scaleFactor);
        const disp = scaleFactor > 1 ? raw.toLocaleString('en-IN') : ctx.parsed.y;
        return '  ' + (ctx.dataset.label || ctx.label) + ':  ' + disp + (yUnit ? ' ' + yUnit : '');
      }
    }};
  }

  const { wrap, canvas } = makeChartBox(title, isPie || finalType === 'doughnut' ? 220 : 210);
  canvas.id = 'chart-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  container.appendChild(wrap);

  new Chart(canvas, {
    type: finalType,
    data: {
      labels,
      datasets: [{
        label: title,
        data: finalValues,
        backgroundColor: finalType === 'bar' ? clrs.map(c => c.replace('0.8','0.55')) : clrs,
        borderColor:     finalType === 'bar' ? clrs : 'transparent',
        borderWidth:  finalType === 'bar' ? 1.5 : 0,
        borderRadius: finalType === 'bar' ? 6   : 0,
        hoverOffset:  finalType === 'doughnut' ? 10 : 0,
      }]
    },
    options: cfg
  });

  // Add note if values were adjusted
  if (noteText) {
    const note = document.createElement('div');
    note.style.cssText = 'font-size:9px;color:var(--muted);text-align:right;margin-top:-4px;margin-bottom:6px;font-style:italic;';
    note.textContent = noteText;
    wrap.appendChild(note);
  }
  return true;
}

// ── Extract crop data from AI agriculture object ───────────
// ── Extract crop data — uses AI chartData if available ────
function extractCropsChart(ai) {
  // Priority 1: use structured chartData with real percentages
  if (ai && ai.chartData && ai.chartData.crops && ai.chartData.crops.length >= 2) {
    const items  = ai.chartData.crops.slice(0, 6);
    const labels = items.map(c => String(c.name || c).substring(0, 20));
    const values = items.map(c => Math.round(Number(c.rank_pct) || 0));
    if (values.some(v => v > 0)) {
      return {
        labels, values,
        unit: 'Relative importance (%)',
        note: '~ Estimated relative importance based on regional agricultural data'
      };
    }
  }
  // Priority 2: fallback — parse crop name strings, use proportional ranking
  const crops = ai && ai.agriculture && ai.agriculture.majorCrops;
  if (!crops || crops.length < 2) return null;
  const labels = crops.map(c => (typeof c === 'string' ? c : String(c)).split(/[—\-–]/)[0].trim().substring(0, 20));
  // Proportional ranking: 100%, 75%, 55%, 40%, 30%...
  const baseRanks = [100, 75, 55, 40, 30, 22];
  const values    = crops.map((_, i) => baseRanks[i] !== undefined ? baseRanks[i] : Math.max(20 - i * 3, 5));
  return {
    labels, values,
    unit: 'Relative importance (%)',
    note: '~ Relative importance ranking (estimated). Not official production data.'
  };
}

// ── Extract industry/economy data ─────────────────────────
function extractEconomyChart(ai) {
  // Priority 1: structured chartData
  if (ai && ai.chartData && ai.chartData.industries && ai.chartData.industries.length >= 2) {
    const items  = ai.chartData.industries.slice(0, 6);
    const labels = items.map(i => String(i.name || i).substring(0, 18));
    const values = items.map(i => Math.round(Number(i.rank_pct) || 0));
    if (values.some(v => v > 0)) {
      return {
        labels, values,
        unit: 'Relative importance (%)',
        note: '~ Estimated relative economic importance'
      };
    }
  }
  // Priority 2: fallback from majorIndustries strings
  const inds = ai && ai.economy && ai.economy.majorIndustries;
  if (!inds || inds.length < 2) return null;
  const labels = inds.map(ind => (typeof ind === 'string' ? ind.split(/[—\-–]/)[0].trim().substring(0, 18) : String(ind)));
  const baseRanks = [100, 70, 50, 35, 25, 18];
  const values    = inds.map((_, i) => baseRanks[i] !== undefined ? baseRanks[i] : Math.max(15 - i * 3, 5));
  return {
    labels, values,
    unit: 'Relative importance (%)',
    note: '~ Relative importance ranking (estimated).'
  };
}

// ── Extract climate chart data ─────────────────────────────
function extractClimateChart(ai) {
  if (!ai || !ai.chartData) return null;
  const cd = ai.chartData;
  const items = [];
  if (cd.rainfall_mm && Number(cd.rainfall_mm) > 0)        items.push({ label: 'Annual Rainfall', value: Number(cd.rainfall_mm),        unit: 'mm' });
  if (cd.temperature_summer_c && Number(cd.temperature_summer_c) > 0) items.push({ label: 'Summer Temp',    value: Number(cd.temperature_summer_c),  unit: '°C' });
  if (cd.temperature_winter_c && Number(cd.temperature_winter_c) > 0) items.push({ label: 'Winter Temp',    value: Number(cd.temperature_winter_c),  unit: '°C' });
  if (items.length < 2) {
    // Try to parse from climate text
    const climateText = (ai.geography && ai.geography.climate) || '';
    const rainfallMatch = climateText.match(/(\d{3,4})\s*mm/);
    const tempMatch     = climateText.match(/(\d{2,3})\s*[°º]C/);
    if (rainfallMatch) items.push({ label: 'Annual Rainfall', value: parseInt(rainfallMatch[1]), unit: 'mm' });
    if (tempMatch)     items.push({ label: 'Max Temperature',  value: parseInt(tempMatch[1]),    unit: '°C' });
  }
  if (items.length < 2) return null;
  return {
    labels: items.map(i => i.label + ' (' + i.unit + ')'),
    values: items.map(i => i.value),
    unit:   'mixed',
    note:   '~ Climate estimates based on regional data'
  };
}

// ── Extract land-use chart ─────────────────────────────────
function extractLandUseChart(ai) {
  if (!ai || !ai.chartData) return null;
  const cd = ai.chartData;
  const items = [];
  if (cd.agri_land_pct    && Number(cd.agri_land_pct)    > 0) items.push({ label: 'Agricultural', value: Number(cd.agri_land_pct)    });
  if (cd.forest_cover_pct && Number(cd.forest_cover_pct) > 0) items.push({ label: 'Forest Cover',  value: Number(cd.forest_cover_pct) });
  if (items.length < 2) return null;

  // Ensure the three slices sum to exactly 100%
  const partial = items.reduce((s, i) => s + i.value, 0);
  const capped  = Math.min(partial, 100);
  const other   = +(100 - capped).toFixed(1);
  if (other > 1) items.push({ label: 'Urban / Other', value: other });

  // Normalise to 100%
  const total = items.reduce((s, i) => s + i.value, 0);
  const pct   = items.map(i => +((i.value / total) * 100).toFixed(1));
  // Fix rounding residual on last slice
  const diff  = +(100 - pct.reduce((s, v) => s + v, 0)).toFixed(1);
  if (diff !== 0) pct[pct.length - 1] = +(pct[pct.length - 1] + diff).toFixed(1);

  return {
    labels: items.map(i => i.label),
    values: pct,
    unit:   '%',
    note:   '~ Land-use breakdown (sums to 100%). Approximate regional estimate.'
  };
}

// ── Build Info Cards (Key Facts) ──────────────────────────
function renderInfoCards(container, ai) {
  const facts = ai?.localInfo?.importantFacts;
  const examFocus = ai?.examFocus;
  const items = [...(facts || []), ...(examFocus || [])].slice(0, 6);
  if (!items.length) return;
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin:10px 0;';
  items.forEach((fact, i) => {
    const card = document.createElement('div');
    card.style.cssText = `
      background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
      border-radius:10px;padding:10px 12px;font-size:11px;color:#b8c4d8;line-height:1.5;
      border-left:3px solid ${PALETTE[i % PALETTE.length]};
    `;
    card.textContent = fact;
    grid.appendChild(card);
  });
  const wrap = document.createElement('div');
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-size:11px;font-weight:700;color:var(--cyan);margin-bottom:8px;letter-spacing:0.04em;text-transform:uppercase;margin-top:14px;';
  titleEl.textContent = '📌 Key Facts & Exam Focus';
  wrap.appendChild(titleEl);
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

// ── Climate/Geography Mini Cards ─────────────────────────
function renderGeoCards(container, ai) {
  const geo = ai?.geography;
  if (!geo) return;
  const items = [
    { icon: '⛰', label: 'Terrain',   val: geo.terrain },
    { icon: '🌡', label: 'Climate',   val: geo.climate },
    { icon: '🌊', label: 'Rivers',    val: geo.rivers  },
    { icon: '🌱', label: 'Soil Type', val: geo.soilType },
  ].filter(x => x.val && x.val.length > 3);
  if (!items.length) return;
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:10px 0;';
  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.style.cssText = `
      background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
      border-radius:10px;padding:10px 12px;
    `;
    card.innerHTML = `
      <div style="font-size:18px;margin-bottom:4px">${item.icon}</div>
      <div style="font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${item.label}</div>
      <div style="font-size:10px;color:#b8c4d8;line-height:1.4">${item.val.substring(0, 90)}…</div>
    `;
    grid.appendChild(card);
  });
  const wrap = document.createElement('div');
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-size:11px;font-weight:700;color:var(--cyan);margin-bottom:8px;letter-spacing:0.04em;text-transform:uppercase;margin-top:14px;';
  titleEl.textContent = '🌏 Geography Overview';
  wrap.appendChild(titleEl);
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

// ── Helper: add unit note below a chart ───────────────────
function _chartNote(container, text) {
  const note = document.createElement('div');
  note.style.cssText = 'font-size:9px;color:var(--muted);text-align:right;margin-top:-4px;margin-bottom:8px;font-style:italic;';
  note.textContent = text;
  container.appendChild(note);
}

// ── MAIN: Render all report charts into a container ───────
function renderReportCharts(container, ai) {
  if (!ai || !container) return;

  // ── Header ──
  const divider = document.createElement('div');
  divider.style.cssText = 'margin:18px 0 10px;border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;';
  const vizTitle = document.createElement('div');
  vizTitle.style.cssText = 'font-size:13px;font-weight:800;color:var(--text);margin-bottom:2px;';
  vizTitle.innerHTML = '📊 Data Visualizations';
  const vizSub = document.createElement('div');
  vizSub.style.cssText = 'font-size:10px;color:var(--muted);margin-bottom:12px;';
  vizSub.textContent = ai && ai.chartData
    ? 'Charts generated from AI-estimated regional data. Values marked ~ are approximate.'
    : 'Charts show relative importance rankings. ~ Estimated, not official statistics.';
  divider.appendChild(vizTitle);
  divider.appendChild(vizSub);
  container.appendChild(divider);

  // 1 — Geography Info Cards
  renderGeoCards(container, ai);

  // 2 — Crops Bar Chart (with unit label)
  const crops = extractCropsChart(ai);
  if (crops) {
    const title = '🌾 Major Crops — ' + (crops.unit || 'Relative importance %');
    renderSingleChart(container, 'bar', title, crops.labels, crops.values,
      [CHART_COLORS.green, CHART_COLORS.teal, CHART_COLORS.cyan, CHART_COLORS.blue, CHART_COLORS.purple],
      { yLabel: crops.unit || '%' }
    );
    _chartNote(container, crops.note || '~ Estimated relative importance');
  }

  // 3 — Industries Doughnut (with unit label)
  const econ = extractEconomyChart(ai);
  if (econ) {
    const title = '💼 Key Industries — ' + (econ.unit || 'Relative importance %');
    renderSingleChart(container, 'doughnut', title, econ.labels, econ.values, PALETTE);
    _chartNote(container, econ.note || '~ Estimated relative economic importance');
  }

  // 4 — Climate Chart (rainfall + temperature)
  const climate = extractClimateChart(ai);
  if (climate) {
    renderSingleChart(container, 'bar', '🌡 Climate Data', climate.labels, climate.values,
      [CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.cyan],
      { yLabel: '' }
    );
    _chartNote(container, climate.note || '~ Approximate climate values');
  }

  // 5 — Land Use Doughnut
  const landUse = extractLandUseChart(ai);
  if (landUse) {
    renderSingleChart(container, 'doughnut', '🗺 Land Use (% of area)', landUse.labels, landUse.values,
      [CHART_COLORS.green, CHART_COLORS.teal, CHART_COLORS.amber]
    );
    _chartNote(container, landUse.note || '~ Approximate land-use breakdown');
  }

  // 6 — Key Facts Info Cards
  renderInfoCards(container, ai);
}

// ── Chat: parse AI response for embedded chart JSON ────────
function parseChatCharts(rawAnswer) {
  // AI may return JSON with text + charts array
  try {
    const parsed = JSON.parse(rawAnswer);
    if (parsed.text && parsed.charts) return parsed;
  } catch (_) {}
  // Try to extract JSON block from mixed response
  const jsonMatch = rawAnswer.match(/\{[\s\S]*"charts"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/);
  if (jsonMatch) {
    try { const p = JSON.parse(jsonMatch[0]); if (p.charts) return p; } catch (_) {}
  }
  return { text: rawAnswer, charts: [] };
}

// ── Chat: render chart data below a message ──────────────
function renderChatCharts(container, charts) {
  if (!charts || !charts.length) return;
  charts.forEach(function(chart) {
    if (!chart.labels || !chart.values || chart.labels.length < 2) return;
    if (chart.values.every(function(v){ return !v || v === 0; })) return;
    const type  = chart.type  || 'bar';
    const unit  = chart.unit  || '';
    const displayTitle = chart.title
      ? (unit && !chart.title.includes(unit) ? chart.title + '  (' + unit + ')' : chart.title)
      : 'Data';
    renderSingleChart(container, type, displayTitle, chart.labels, chart.values, PALETTE, { yLabel: unit });
    if (unit) {
      const note = document.createElement('div');
      note.style.cssText = 'font-size:9px;color:var(--muted);text-align:right;margin-top:-4px;margin-bottom:6px;font-style:italic;';
      note.textContent = '~ Values in ' + unit + '. Approximate regional data.';
      container.appendChild(note);
    }
  });
}

// ── Comparison: side-by-side bar chart ───────────────────
function renderComparisonCharts(container, aiA, aiB, nameA, nameB) {
  if (!aiA || !aiB || !container) return;

  // ── Helper: build labeled comparison dataset for a chart ──
  function _cmpDataset(aiX, nameX, field, colorX, baseRanks) {
    if (aiX && aiX.chartData && aiX.chartData[field] && aiX.chartData[field].length >= 1) {
      return aiX.chartData[field].slice(0, 5).map(function(item) {
        return { name: String(item.name || item).substring(0, 16), val: Math.round(Number(item.rank_pct) || 0) };
      });
    }
    // fallback: majorCrops or majorIndustries strings
    var src = field === 'crops' ? (aiX && aiX.agriculture && aiX.agriculture.majorCrops) : (aiX && aiX.economy && aiX.economy.majorIndustries);
    if (!src) return [];
    return src.slice(0, 5).map(function(s, i) {
      return { name: (typeof s === 'string' ? s.split(/[—\-–]/)[0].trim().substring(0, 16) : String(s)), val: baseRanks[i] !== undefined ? baseRanks[i] : Math.max(20 - i * 4, 5) };
    });
  }
  var RANK5 = [100, 75, 55, 38, 25];

  // 1 — Crops comparison
  var cA = _cmpDataset(aiA, nameA, 'crops', CHART_COLORS.cyan, RANK5);
  var cB = _cmpDataset(aiB, nameB, 'crops', CHART_COLORS.blue, RANK5);
  var allCropNames = Array.from(new Set(cA.map(function(x){return x.name;}).concat(cB.map(function(x){return x.name;})))).slice(0,6);

  if (allCropNames.length >= 2) {
    var valsA = allCropNames.map(function(n){ var f=cA.find(function(x){return x.name===n;}); return f?f.val:0; });
    var valsB = allCropNames.map(function(n){ var f=cB.find(function(x){return x.name===n;}); return f?f.val:0; });
    var { wrap: wCrops, canvas: cvCrops } = makeChartBox('🌾 Crops: ' + nameA + ' vs ' + nameB + '  (relative importance %)', 230);
    container.appendChild(wCrops);
    var cfgCrops = JSON.parse(JSON.stringify(CHART_DEFAULTS));
    cfgCrops.scales.y.title   = { display: true, text: 'Relative importance (%)', color: '#8899bb', font: { size: 9 } };
    cfgCrops.scales.y.min     = 0;
    cfgCrops.scales.y.max     = 110;
    cfgCrops.scales.y.ticks   = { color: '#8899bb', font: { size: 10 }, callback: function(v){ return v+'%'; } };
    cfgCrops.scales.x.ticks   = { color: '#8899bb', font: { size: 9 }, maxRotation: 30 };
    cfgCrops.plugins.tooltip  = { callbacks: { label: function(c){ return '  '+c.dataset.label+':  '+c.parsed.y+'%'; } } };
    cfgCrops.plugins.legend   = { display: true, position: 'bottom', labels: { color: '#b8c4d8', font: { size: 10 } } };
    new Chart(cvCrops, { type: 'bar', data: { labels: allCropNames,
      datasets: [
        { label: nameA, data: valsA, backgroundColor: CHART_COLORS.cyan, borderRadius: 5 },
        { label: nameB, data: valsB, backgroundColor: CHART_COLORS.blue, borderRadius: 5 }
      ]}, options: cfgCrops });
    var noteC = document.createElement('div');
    noteC.style.cssText = 'font-size:9px;color:var(--muted);text-align:right;margin-top:-4px;margin-bottom:8px;font-style:italic;';
    noteC.textContent = '~ Estimated relative importance (100 = most prominent crop in that region)';
    container.appendChild(noteC);
  }

  // 2 — Industries comparison
  var iA = _cmpDataset(aiA, nameA, 'industries', CHART_COLORS.green, RANK5);
  var iB = _cmpDataset(aiB, nameB, 'industries', CHART_COLORS.amber, RANK5);
  var allIndNames = Array.from(new Set(iA.map(function(x){return x.name;}).concat(iB.map(function(x){return x.name;})))).slice(0,6);

  if (allIndNames.length >= 2) {
    var vIA = allIndNames.map(function(n){ var f=iA.find(function(x){return x.name===n;}); return f?f.val:0; });
    var vIB = allIndNames.map(function(n){ var f=iB.find(function(x){return x.name===n;}); return f?f.val:0; });
    var { wrap: wInd, canvas: cvInd } = makeChartBox('💼 Industries: ' + nameA + ' vs ' + nameB + '  (relative importance %)', 230);
    container.appendChild(wInd);
    var cfgInd = JSON.parse(JSON.stringify(CHART_DEFAULTS));
    cfgInd.scales.y.title  = { display: true, text: 'Relative importance (%)', color: '#8899bb', font: { size: 9 } };
    cfgInd.scales.y.min    = 0;
    cfgInd.scales.y.max    = 110;
    cfgInd.scales.y.ticks  = { color: '#8899bb', font: { size: 10 }, callback: function(v){ return v+'%'; } };
    cfgInd.scales.x.ticks  = { color: '#8899bb', font: { size: 9 }, maxRotation: 30 };
    cfgInd.plugins.tooltip = { callbacks: { label: function(c){ return '  '+c.dataset.label+':  '+c.parsed.y+'%'; } } };
    cfgInd.plugins.legend  = { display: true, position: 'bottom', labels: { color: '#b8c4d8', font: { size: 10 } } };
    new Chart(cvInd, { type: 'bar', data: { labels: allIndNames,
      datasets: [
        { label: nameA, data: vIA, backgroundColor: CHART_COLORS.green, borderRadius: 5 },
        { label: nameB, data: vIB, backgroundColor: CHART_COLORS.amber, borderRadius: 5 }
      ]}, options: cfgInd });
    var noteI = document.createElement('div');
    noteI.style.cssText = 'font-size:9px;color:var(--muted);text-align:right;margin-top:-4px;margin-bottom:8px;font-style:italic;';
    noteI.textContent = '~ Estimated relative importance (100 = dominant sector in that region)';
    container.appendChild(noteI);
  }

  // 3 — Rainfall comparison (if chartData available)
  if (aiA.chartData && aiB.chartData &&
      Number(aiA.chartData.rainfall_mm) > 0 && Number(aiB.chartData.rainfall_mm) > 0) {
    var { wrap: wRain, canvas: cvRain } = makeChartBox('🌧 Annual Rainfall Comparison (mm)', 200);
    container.appendChild(wRain);
    var cfgRain = JSON.parse(JSON.stringify(CHART_DEFAULTS));
    cfgRain.scales.y.title     = { display: true, text: 'Annual Rainfall (mm)', color: '#8899bb', font: { size: 9 } };
    cfgRain.scales.y.beginAtZero = true;
    cfgRain.scales.y.ticks     = { color: '#8899bb', font: { size: 10 }, callback: function(v){ return v+' mm'; } };
    cfgRain.plugins.tooltip    = { callbacks: { label: function(c){ return '  '+c.label+':  '+c.parsed.y.toLocaleString('en-IN')+' mm'; } } };
    cfgRain.plugins.legend     = { display: false };
    new Chart(cvRain, { type: 'bar', data: {
      labels: [nameA, nameB],
      datasets: [{ label: 'Rainfall (mm)',
        data: [Number(aiA.chartData.rainfall_mm), Number(aiB.chartData.rainfall_mm)],
        backgroundColor: [CHART_COLORS.blue, CHART_COLORS.cyan], borderRadius: 8
      }]}, options: cfgRain });
    var noteR = document.createElement('div');
    noteR.style.cssText = 'font-size:9px;color:var(--muted);text-align:right;margin-top:-4px;margin-bottom:8px;font-style:italic;';
    noteR.textContent = '~ Approximate annual rainfall in millimetres';
    container.appendChild(noteR);
  }

  // 3 — Side-by-side Geography Info Cards for both locations
  const geoFields = [
    { key: 'terrain',   icon: '⛰', label: 'Terrain'   },
    { key: 'climate',   icon: '🌡', label: 'Climate'   },
    { key: 'soilType',  icon: '🌱', label: 'Soil'      },
    { key: 'rivers',    icon: '🌊', label: 'Rivers'    },
  ];
  const geoTitle = document.createElement('div');
  geoTitle.style.cssText = 'font-size:11px;font-weight:700;color:var(--cyan);margin:14px 0 8px;letter-spacing:0.04em;text-transform:uppercase;';
  geoTitle.textContent = '🌏 Geography Side-by-Side';
  container.appendChild(geoTitle);
  const geoGrid = document.createElement('div');
  geoGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;';
  [[aiA, nameA, CHART_COLORS.cyan], [aiB, nameB, CHART_COLORS.blue]].forEach(([ai, name, color]) => {
    const col = document.createElement('div');
    col.style.cssText = `background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px;border-top:2px solid ${color};`;
    const locName = document.createElement('div');
    locName.style.cssText = 'font-size:11px;font-weight:800;color:#e8edf8;margin-bottom:8px;';
    locName.textContent = name;
    col.appendChild(locName);
    geoFields.forEach(f => {
      const val = ai?.geography?.[f.key];
      if (!val) return;
      const row = document.createElement('div');
      row.style.cssText = 'margin-bottom:5px;';
      row.innerHTML = `<span style="font-size:9px;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:1px">${f.icon} ${f.label}</span><span style="font-size:10px;color:#b8c4d8;line-height:1.4">${val.substring(0,80)}…</span>`;
      col.appendChild(row);
    });
    geoGrid.appendChild(col);
  });
  container.appendChild(geoGrid);

  const note = document.createElement('div');
  note.style.cssText = 'font-size:9px;color:var(--muted);margin-top:8px;text-align:center;';
  note.textContent = '* Bar chart values show relative ranking from AI-reported data, not official statistics.';
  container.appendChild(note);
}

async function sendChat() {
  // Improved: check network before chat
  const inp=document.getElementById('cinput');
  const q=inp.value.trim();
  if (!q) return;
  // If no location selected, use last history entry as context fallback
  if (!curData.lat) {
    if (_histAllEntries && _histAllEntries.length > 0) {
      const last = _histAllEntries[0];
      if (last && last.aiResponse) {
        try {
          const ai = JSON.parse(last.aiResponse);
          curData = {
            geo: { address: { city: last.selectedPlace||'', state: last.state||'', country: last.country||'' } },
            lat: last.latitude || 0, lon: last.longitude || 0, ai: ai
          };
          toast('💬 Answering from your last report: ' + (last.selectedPlace||'history'), 'warn');
        } catch(e) {
          toast('Select a map location first to start chatting', 'err'); return;
        }
      } else {
        toast('Select a map location first to start chatting', 'err'); return;
      }
    } else {
      toast('Select a map location first to start chatting', 'err'); return;
    }
  }
  if (!_hasActivePlan()) {
    _showNoPlanBlock('chat');
    return;
  }
  if (!canChat()) {
    if (userProfile.plan==='free_trial' && isTrialExpired()) { showTrialExpiredPopup(); return; }
    showLimitReached('chat'); goTab('p',document.getElementById('t-p')); return;
  }
  inp.value='';
  const msgs=document.getElementById('cmsgs');
  document.getElementById('cnoloc')?.remove();
  const ts=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  const div=document.createElement('div'); div.className='cmsg';
  const aid='ca'+Date.now();
  div.innerHTML=`<div class="cmq">${q}</div><div class="cma" id="${aid}"><div class="chat-typing-indicator"><span></span><span></span><span></span></div></div><div class="cmts">${ts}</div>`;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight;
  // Human-like delay before API call (simulates "reading" the question)
  await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
  const addr=curData.geo?.address||{};
  const loc=[addr.city,addr.state,addr.country].filter(Boolean).join(', ');
  const lPick=document.getElementById('langPick');
  const langName=lPick?lPick.options[lPick.selectedIndex].text.replace(/^[\uD83C][\uDDE6-\uDDFF]{2}\s*/,''):'English';

  // Chart-aware prompt: ask AI for structured data when question implies data
  const wantsChart = /crop|industry|economy|GDP|rainfall|climate|population|compare|production|statistics|data|numbers|percentage|hectare|tonne|mm|kg|lakh|crore/i.test(q);
  const prompt = wantsChart
    ? `You are a geography & history tutor. Location: ${loc}.
Context: ${curData.wiki?.extract?.substring(0,250)||''} | Famous: ${curData.ai?.localInfo?.famousFor?.join(', ')||''}
Answer in ${langName}. Question: ${q}

DATA QUALITY RULES (VERY IMPORTANT):
- Always include units: mm for rainfall, °C for temperature, lakh tonnes for crops, % for percentages
- Use approximate real data from regional knowledge (e.g. Punjab wheat ~170 lakh tonnes, Kerala rainfall ~3000mm)
- Mark estimates with ~ prefix (e.g. ~1200 mm, ~45 lakh tonnes)
- NEVER use meaningless numbers like 1,2,3,4,5 as values

If you have DATA to show as a chart, return ONLY valid JSON:
{"text":"Your 2-4 sentence answer with specific numbers and units.","charts":[{"type":"bar","title":"Chart Title (unit)","labels":["Item1 (~unit)","Item2 (~unit)"],"values":[real_number,real_number],"unit":"lakh tonnes"}]}

If no real data available: {"text":"Your answer here. (Data not available for chart)","charts":[]}

IMPORTANT: Include chart ONLY with meaningful values with units. Tooltip must show value + unit.`
    : `You are a geography & history tutor. Location: ${loc}.
Context: ${curData.wiki?.extract?.substring(0,250)||''} | Famous: ${curData.ai?.localInfo?.famousFor?.join(', ')||''}
Answer in ${langName}. Question: ${q}
Give a clear, academic, 2-4 sentence answer with specific facts, numbers, and units where applicable (e.g. 1200 mm rainfall, 45 lakh tonnes wheat, 32°C summer temperature).`;

  let answerText = 'No response received.';
  let chartData = [];
  try {
    const apiKey=getChatAPIKey();
    if (!apiKey) throw new Error('No API key available for chat.');
    const model=getSelectedModel(true);
    const rawAnswer = await callAI(prompt, apiKey, model);
    if (wantsChart) {
      const parsed = parseChatCharts(rawAnswer);
      answerText = parsed.text || rawAnswer;
      chartData = parsed.charts || [];
    } else {
      answerText = rawAnswer;
    }
    await incrementChat();
    await saveChatMsg(q, answerText);
  } catch(e) { answerText='Error: '+e.message; }

  // Update answer with formatted streaming-style reveal
  const answerEl = document.getElementById(aid);
  if (answerEl) {
    const formatted = answerText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^[•\-]\s+/gm, '<span style="color:var(--cyan);margin-right:4px">▸</span>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    // Animate text reveal character by character (fast)
    answerEl.innerHTML = '';
    answerEl.classList.add('chat-answer-reveal');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formatted;
    answerEl.appendChild(tempDiv);
    tempDiv.style.animation = 'chatReveal 0.4s ease both';
  }

  // Render charts below the message (if any valid charts)
  if (chartData.length) {
    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = 'margin-top:8px;';
    renderChatCharts(chartContainer, chartData);
    if (chartContainer.children.length) {
      div.appendChild(chartContainer);
    }
  }

  msgs.scrollTop=msgs.scrollHeight;
}
document.getElementById('cinput').addEventListener('keydown', e=>{if(e.key==='Enter')sendChat();});

/* ── REPORT RENDER ───────────────────────────────────── */
function renderReport(lat,lon,geo,country,wiki,ai) {
  const addr    = geo.address || {};
  const name    = ai.locationId?.nearestCity||addr.city||addr.state||addr.country||`${parseFloat(lat).toFixed(2)}°, ${parseFloat(lon).toFixed(2)}°`;
  const langs   = ai.localInfo?.localLanguages || '';
  const mode    = gv('learningMode');

  // ── Flag: use live countryCode if available, else emoji fallback ──
  const countryCode = pendingCountryCode ||
    curData.countryCode ||
    (country?.cca2) || null;

  const flagHtml = countryCode
    ? getFlagImg(countryCode, ai.locationId?.country || addr.country, 22)
    : getFlagEmoji(ai.locationId?.country || '') + ' ';

  let h = `<div class="loc-badge">
    <div>
      <div class="loc-name" style="display:flex;align-items:center;">${flagHtml}<span>${name}</span></div>
      <div class="loc-sub">${[ai.locationId?.state, ai.locationId?.country].filter(Boolean).join(' · ')}</div>
      ${langs?`<div class="loc-lang">🗣 ${langs}</div>`:''}
    </div>
    <div class="cbadge">LAT ${parseFloat(lat).toFixed(4)}°<br>LON ${parseFloat(lon).toFixed(4)}°<br><span style="color:var(--pprem);font-size:9px">${(PLANS[userProfile.plan]?.name||'Free').toUpperCase()}</span></div>
  </div>`;

  if (wiki?.extract) h+=`<div class="wiki-box">📖 ${wiki.extract.substring(0,280)}…</div>`;
  if (ai.userAnswer) h+=`<div class="epill" style="color:var(--blue);border-color:rgba(74,158,255,0.25)">💬 ${ai.userAnswer}</div>`;

  // ── Build full report content (hidden initially) ──
  let fullContent = '';

  if (ai.localInfo) {
    const li=ai.localInfo;
    fullContent+=S('★','Local Info & Famous Places',`
      ${R('Languages', li.localLanguages)}
      ${R('Famous For', (li.famousFor||[]).map(f=>`<span class="tag tp">${f}</span>`).join(''))}
      ${R('Famous Places', (li.famousPlaces||[]).map(f=>`<span class="tag tb">${f}</span>`).join(''))}
      ${R('Famous People', (li.famousPersonalities||[]).map(f=>`<span class="tag tg">${f}</span>`).join(''))}
      ${R('Festivals', (li.festivals||[]).map(f=>`<span class="tag ty">${f}</span>`).join(''))}
      ${R('Cuisine', (li.localCuisine||[]).map(f=>`<span class="tag tr">${f}</span>`).join(''))}
      ${(li.importantFacts||[]).map(f=>`<div class="epill">📌 ${f}</div>`).join('')}
    `,true);
  }

  fullContent+=S('01','Location',`
    ${R('Country',ai.locationId?.country)}${R('State',ai.locationId?.state)}
    ${R('District',ai.locationId?.district)}${R('Nearest City',ai.locationId?.nearestCity)}
    ${R('Coordinates',ai.locationId?.coordinates)}
  `);
  if (mode!=='Quiz Mode') fullContent+=S('02','Geography',`
    ${R('Terrain',ai.geography?.terrain)}${R('Climate',ai.geography?.climate)}
    ${R('Soil',ai.geography?.soilType)}${R('Rivers',ai.geography?.rivers)}
    ${R('Resources',ai.geography?.naturalResources)}
  `);
  fullContent+=S('03','Agriculture',`
    <div class="srow"><span class="slbl">Major Crops</span><span class="sval">${(ai.agriculture?.majorCrops||[]).map(c=>`<span class="tag ty">${c}</span>`).join('')}</span></div>
    ${R('Why Crops Grow',ai.agriculture?.whyCropsGrow)}${R('Irrigation',ai.agriculture?.irrigationSources)}${R('Season',ai.agriculture?.seasonalPattern)}
  `);
  fullContent+=S('04','History',`
    ${R('Ancient',ai.history?.ancient)}${R('Medieval',ai.history?.medieval)}
    ${R('Modern',ai.history?.modern)}${R('Freedom Movement',ai.history?.freedomMovement)}
  `);
  fullContent+=S('05','Economy',`
    <div class="srow"><span class="slbl">Industries</span><span class="sval">${(ai.economy?.majorIndustries||[]).map(i=>`<span class="tag tb">${i}</span>`).join('')}</span></div>
    ${R('GDP',ai.economy?.gdpContribution)}${R('Employment',ai.economy?.employmentPattern)}
  `);
  fullContent+=S('06','Current Relevance',`
    ${R('Environment',ai.currentRelevance?.environmentalIssues)}
    ${R('Projects',ai.currentRelevance?.developmentProjects)}
    ${R('Strategic',ai.currentRelevance?.strategicImportance)}
  `);
  if (mode==='Timeline Mode'||mode==='Full Analysis') {
    const tl=(ai.timeline||[]).map(t=>`<div class="tli"><div class="tldot"></div><div class="tlyear">${t.year}</div><div class="tltext">${t.event}</div></div>`).join('');
    fullContent+=S('07','Historical Timeline',`<div class="tl">${tl}</div>`);
  }
  if (mode==='Quiz Mode'||mode==='Full Analysis') {
    let qh='<div style="margin-bottom:8px;font-size:10px;color:var(--muted)">Click options to check answers.</div>';
    (ai.quiz?.mcqs||[]).forEach((q,i)=>{
      qh+=`<div class="mcqi"><div class="mcqq">Q${i+1}. ${q.q}</div>${(q.options||[]).map((opt,oi)=>{const L=['A','B','C','D'][oi];return`<span class="mcqo" onclick="chkMCQ(this,'${L}','${q.answer}')">${opt}</span>`;}).join('')}</div>`;
    });
    (ai.quiz?.assertionReason||[]).forEach((ar,i)=>{
      qh+=`<div class="mcqi"><div class="mcqq">AR${i+1}. <b>A:</b> ${ar.assertion}<br><b>R:</b> ${ar.reason}</div><div style="font-size:10px;color:var(--muted);margin-top:4px">Ans: <span style="color:var(--cyan)">${ar.answer}</span></div></div>`;
    });
    if (ai.quiz?.mapQuestion) qh+=`<div class="mcqi"><div class="mcqq">🗺 ${ai.quiz.mapQuestion}</div></div>`;
    fullContent+=S('08','Quiz',qh);
  }
  const ef=(ai.examFocus||[]).map(q=>`<div class="epill">⚡ ${q}</div>`).join('');
  fullContent+=S('09',`Exam Focus — ${gv('examType')||'UPSC'}`,ef);

  // ── See More / See Less toggle ──
  // Show first 2 sections by default, rest hidden under "See More"
  const sections = fullContent.split('<div class="scard">').filter(Boolean);
  const previewCount = 2;
  const previewHTML  = sections.slice(0, previewCount).map(s=>'<div class="scard">'+s).join('');
  const restHTML     = sections.slice(previewCount).map(s=>'<div class="scard">'+s).join('');
  const expandId     = 'exp_'+Date.now();

  h += previewHTML;
  if (restHTML) {
    h += `<div id="${expandId}" style="display:none">${restHTML}</div>
    <button class="see-more-btn" id="smb_${expandId}"
      onclick="toggleSeeMore('${expandId}','smb_${expandId}')">
      ▾ See More
    </button>`;
  } else {
    h += fullContent; // if < 2 sections, just show all
  }

  // ── Share only (no download buttons) ──
  h += `<div class="share-row" style="margin-top:12px;">
    <div class="share-label">🔗 Share This Report</div>
    <button class="share-btn share-wa" onclick="shareReport('whatsapp')">📱 WhatsApp</button>
    <button class="share-btn share-tg" onclick="shareReport('telegram')">✈ Telegram</button>
    <button class="share-btn share-em" onclick="shareReport('email')">📧 Email</button>
    <button class="share-btn share-cp" onclick="shareReport('copy')">📋 Copy Link</button>
  </div>`;

  // Store countryCode on curData so reloadHist can use it
  if (countryCode) curData.countryCode = countryCode;

  const wrap=document.getElementById('resultWrap');
  wrap.innerHTML=h; wrap.style.display='block';
  document.getElementById('idleBox').style.display='none';
  document.getElementById('loadbox').style.display='none';
  goTab('a',document.getElementById('t-a'));

  // ── Inject Chart.js Visualizations AFTER DOM is set ──
  if (ai) {
    requestAnimationFrame(() => {
      try {
        const chartSection = document.createElement('div');
        chartSection.id = 'report-charts-' + Date.now();
        chartSection.style.cssText = 'padding:0 2px;';
        renderReportCharts(chartSection, ai);
        // Insert before share row
        const shareRow = wrap.querySelector('.share-row');
        if (shareRow) {
          wrap.insertBefore(chartSection, shareRow);
        } else {
          wrap.appendChild(chartSection);
        }
      } catch(chartErr) {
        console.warn('[GeoMind Charts]', chartErr.message);
      }
    });
  }
}

function toggleSeeMore(contentId, btnId) {
  const el  = document.getElementById(contentId);
  const btn = document.getElementById(btnId);
  if (!el || !btn) return;
  const isHidden = el.style.display === 'none';
  el.style.display  = isHidden ? 'block' : 'none';
  btn.textContent   = isHidden ? '▴ See Less' : '▾ See More';
  btn.style.background = isHidden ? 'rgba(0,229,200,0.05)' : '';
  if (isHidden) el.scrollIntoView({behavior:'smooth', block:'nearest'});
}



function S(num,title,content,open=false){
  const id='sc_'+Math.random().toString(36).substr(2,6);
  return `<div class="scard"><div class="shdr" onclick="togS('${id}',this)"><span class="snum">${num}</span><span class="stitle">${title}</span><span class="chev ${open?'o':''}">▾</span></div><div class="sbody ${open?'':'hid'}" id="${id}">${content}</div></div>`;
}
function R(label,val){
  const v=(val&&val.toString().trim())?val:'<span style="color:var(--muted)">N/A</span>';
  return `<div class="srow"><span class="slbl">${label}</span><span class="sval">${v}</span></div>`;
}
function togS(id,hdr){document.getElementById(id).classList.toggle('hid');hdr.querySelector('.chev').classList.toggle('o');}
function chkMCQ(el,sel,correct){
  el.closest('.mcqi').querySelectorAll('.mcqo').forEach(o=>{
    o.style.pointerEvents='none';
    const L=o.textContent.trim()[0];
    if(L===correct)o.classList.add('ok');
    else if(L===sel&&sel!==correct)o.classList.add('no');
  });
}
/* ── FLAG DISPLAY — dynamic flagcdn.com (never hardcoded) ── */
/* Returns an <img> tag for the country flag, falls back to 🌍 emoji.
   countryCode = ISO2 code e.g. "IN", "US", "FR"               */
function getFlagImg(countryCode, countryName, size=20) {
  if (!countryCode) return '🌍';
  const code = countryCode.toLowerCase();
  const url  = `https://flagcdn.com/w40/${code}.png`;
  return `<img src="${url}" alt="${countryName||code}" title="${countryName||code}"
    style="width:${size}px;height:auto;border-radius:3px;vertical-align:middle;margin-right:6px;box-shadow:0 1px 4px rgba(0,0,0,0.3);"
    onerror="this.style.display='none';this.nextSibling&&this.nextSibling.nodeType===3||(this.insertAdjacentText('afterend','🌍'))"
  />`;
}

/* Fetch country code from BigDataCloud reverse geocoding (free, no key needed) */
async function fetchCountryCode(lat, lon) {
  // Use AbortController (WebView-safe) instead of AbortSignal.timeout()
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!r.ok) return null;
    const d = await r.json();
    return d.countryCode || null;   // "IN", "US", "FR" etc.
  } catch(e) {
    clearTimeout(timer);
    console.warn('[fetchCountryCode]', e.message);
    return null;
  }
}

/* Legacy emoji helper kept for backward compat in compare view */
function getFlagEmoji(countryName) {
  const map={
    'India':'🇮🇳','United States':'🇺🇸','United Kingdom':'🇬🇧','China':'🇨🇳',
    'Brazil':'🇧🇷','Russia':'🇷🇺','France':'🇫🇷','Germany':'🇩🇪','Japan':'🇯🇵',
    'Australia':'🇦🇺','Canada':'🇨🇦','Pakistan':'🇵🇰','Bangladesh':'🇧🇩',
    'Nepal':'🇳🇵','Sri Lanka':'🇱🇰','Indonesia':'🇮🇩','Turkey':'🇹🇷','Egypt':'🇪🇬',
    'Saudi Arabia':'🇸🇦','UAE':'🇦🇪','Italy':'🇮🇹','Spain':'🇪🇸','Mexico':'🇲🇽',
    'South Korea':'🇰🇷','Thailand':'🇹🇭','Vietnam':'🇻🇳','Philippines':'🇵🇭',
    'Nigeria':'🇳🇬','South Africa':'🇿🇦','Kenya':'🇰🇪','Ethiopia':'🇪🇹'
  };
  return map[countryName] || '🌍';
}

/* ── DOWNLOAD FEATURE ────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════════
   GEOMIND DOWNLOAD SYSTEM  v3.0
   Three independent functions: downloadReport → buildDocx → dlBlob
   Each is self-contained with its own error handling.
   DOM fallback: if curData.ai is missing we read from #resultWrap.
═══════════════════════════════════════════════════════════════ */

function downloadReport(fmt) {
  /* ── Guard: need either curData.ai OR visible report in the DOM ── */
  const hasData = curData && curData.ai;
  const wrap    = document.getElementById('resultWrap');
  const hasDOM  = wrap && wrap.innerText && wrap.innerText.trim().length > 20;

  if (!hasData && !hasDOM) {
    toast('Generate a report first, then download.', 'err');
    return;
  }

  const ai   = hasData ? curData.ai : {};
  const raw  = ai.locationId?.nearestCity
             || ai.locationId?.district
             || (wrap ? wrap.querySelector('.loc-name')?.textContent : '')
             || 'GeoMind-Report';
  /* Safe ASCII filename — strip non-alphanumeric except space/dash */
  const name = raw.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').trim() || 'GeoMind-Report';
  const date = new Date().toLocaleDateString('en-IN');
  const lat  = parseFloat(curData?.lat) || 0;
  const lon  = parseFloat(curData?.lon) || 0;

  /* ── Route to format handler ─────────────────────────────────── */
  try {
    if      (fmt === 'json')  _dlJSON (ai, name, lat, lon);
    else if (fmt === 'txt')   _dlTXT  (ai, name, date, lat, lon, wrap);
    else if (fmt === 'pdf')   _dlPDF  (ai, name, date, lat, lon, wrap);
    else if (fmt === 'docx')  _dlDOCX (ai, name, date, lat, lon);
  } catch (err) {
    console.error('[GeoMind Download] Fatal:', err);
    toast('Download error: ' + err.message, 'err');
  }
}

/* ─── JSON ─────────────────────────────────────────────────────── */
function _dlJSON(ai, name, lat, lon) {
  const payload = {
    location: { lat, lon, ...ai.locationId },
    report:   ai,
    generatedAt: new Date().toISOString(),
    generatedBy: 'GeoMind v5.0'
  };
  dlBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    name + '-geomind.json'
  );
}

/* ─── TXT ─────────────────────────────────────────────────────── */
function _dlTXT(ai, name, date, lat, lon, wrap) {
  const D = '-'.repeat(40);
  const H = '='.repeat(50);
  let t = '';

  t += 'GEOMIND AI REPORT\n' + H + '\n';
  t += 'Location : ' + name + '\n';
  t += 'Date     : ' + date + '\n';
  t += 'LAT      : ' + lat.toFixed(6) + '\n';
  t += 'LON      : ' + lon.toFixed(6) + '\n';
  t += H + '\n\n';

  const addObj = (title, obj) => {
    if (!obj || typeof obj !== 'object') return;
    t += title + '\n' + D + '\n';
    Object.entries(obj).forEach(([k, v]) => {
      const val = Array.isArray(v) ? v.join(', ') : (v != null ? String(v) : '—');
      t += '  ' + k + ': ' + val + '\n';
    });
    t += '\n';
  };

  addObj('LOCATION',         ai.locationId);
  addObj('GEOGRAPHY',        ai.geography);
  addObj('AGRICULTURE',      ai.agriculture);
  addObj('HISTORY',          ai.history);
  addObj('ECONOMY',          ai.economy);
  addObj('CURRENT RELEVANCE',ai.currentRelevance);
  addObj('LOCAL INFO',       ai.localInfo);

  if (Array.isArray(ai.timeline) && ai.timeline.length) {
    t += 'HISTORICAL TIMELINE\n' + D + '\n';
    ai.timeline.forEach(e => {
      t += '  ' + (e.year || '') + '  :  ' + (e.event || '') + '\n';
    });
    t += '\n';
  }

  if (Array.isArray(ai.examFocus) && ai.examFocus.length) {
    t += 'EXAM FOCUS\n' + D + '\n';
    ai.examFocus.forEach(f => { t += '  * ' + f + '\n'; });
    t += '\n';
  }

  /* DOM fallback: if ai data was sparse, append visible text */
  if (wrap && (!ai.locationId) && wrap.innerText) {
    t += '\n--- REPORT TEXT ---\n';
    t += wrap.innerText.replace(/\n{3,}/g, '\n\n');
  }

  t += H + '\nGenerated by GeoMind v5.0\n';

  dlBlob(
    new Blob(['\uFEFF' + t], { type: 'text/plain;charset=utf-8' }),
    name + '-geomind.txt'
  );
}

/* ─── PDF ─────────────────────────────────────────────────────── */
function _dlPDF(ai, name, date, lat, lon, wrap) {
  /* Resolve jsPDF from all known CDN global patterns */
  let JsPDF = null;
  try { JsPDF = window.jspdf?.jsPDF || window.jsPDF?.jsPDF || window.jsPDF || window.jspdf; }
  catch(_) {}

  if (typeof JsPDF !== 'function') {
    toast('PDF library loading — please wait 3s and try again.', 'warn');
    /* Dynamically inject CDN if it somehow failed to load */
    if (!window._jspdfLoading) {
      window._jspdfLoading = true;
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload  = () => { window._jspdfLoading = false; toast('PDF ready — click PDF again!', 'ok'); };
      s.onerror = () => { window._jspdfLoading = false; toast('PDF library failed to load.', 'err'); };
      document.head.appendChild(s);
    }
    return;
  }

  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = 210;  // page width mm
  const PH  = 297;
  const ML  = 14;   // margin left
  const MR  = 196;  // margin right (PW - 14)
  const TW  = MR - ML; // text width
  let   y   = 0;

  /* ── Helper: auto page break ── */
  const checkY = (needed) => { if (y + needed > PH - 14) { doc.addPage(); y = 18; } };

  /* ── Header banner ── */
  doc.setFillColor(0, 107, 92);
  doc.rect(0, 0, PW, 30, 'F');
  doc.setFontSize(17); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('GeoMind AI Report', ML, 13);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 240, 230);
  doc.text(name + '   |   ' + date + '   |   ' + lat.toFixed(4) + 'deg, ' + lon.toFixed(4) + 'deg', ML, 22);
  y = 38;

  /* ── Section renderer ── */
  const pdfSection = (title, obj) => {
    if (!obj || typeof obj !== 'object' || !Object.keys(obj).length) return;
    checkY(12);
    /* Section title */
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 107, 92);
    doc.text(title.toUpperCase(), ML, y);
    /* Underline */
    doc.setDrawColor(0, 107, 92); doc.setLineWidth(0.3);
    doc.line(ML, y + 1, ML + doc.getTextWidth(title.toUpperCase()), y + 1);
    y += 6;
    /* Rows */
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(40, 40, 40);
    Object.entries(obj).forEach(([k, v]) => {
      const val  = Array.isArray(v) ? v.join(', ') : (v != null ? String(v) : '—');
      const line = k + ': ' + val;
      const wrapped = doc.splitTextToSize(line, TW - 4);
      wrapped.forEach(l => { checkY(5); doc.text(l, ML + 3, y); y += 4.8; });
    });
    y += 3;
  };

  pdfSection('Location',          ai.locationId);
  pdfSection('Geography',         ai.geography);
  pdfSection('Agriculture',       ai.agriculture);
  pdfSection('History',           ai.history);
  pdfSection('Economy',           ai.economy);
  pdfSection('Current Relevance', ai.currentRelevance);
  pdfSection('Local Info',        ai.localInfo);

  /* ── Timeline ── */
  if (Array.isArray(ai.timeline) && ai.timeline.length) {
    checkY(12);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 107, 92);
    doc.text('HISTORICAL TIMELINE', ML, y); y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(40, 40, 40);
    ai.timeline.forEach(e => {
      const line = (e.year || '') + '  :  ' + (e.event || '');
      const wrapped = doc.splitTextToSize(line, TW - 4);
      wrapped.forEach(l => { checkY(5); doc.text(l, ML + 3, y); y += 4.8; });
    });
    y += 3;
  }

  /* ── Exam Focus ── */
  if (Array.isArray(ai.examFocus) && ai.examFocus.length) {
    checkY(12);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 107, 92);
    doc.text('EXAM FOCUS', ML, y); y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(40, 40, 40);
    ai.examFocus.forEach(f => {
      const wrapped = doc.splitTextToSize('* ' + f, TW - 4);
      wrapped.forEach(l => { checkY(5); doc.text(l, ML + 3, y); y += 4.8; });
    });
  }

  /* ── DOM fallback: if AI data sparse, print raw visible text ── */
  if (wrap && !ai.locationId && wrap.innerText) {
    const lines = doc.splitTextToSize(wrap.innerText.replace(/\n{3,}/g, '\n\n'), TW);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
    lines.forEach(l => { checkY(5); doc.text(l, ML, y); y += 4.8; });
  }

  /* ── Footer on every page ── */
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 160);
    doc.text('GeoMind v5.0   |   Page ' + p + ' of ' + pages, ML, PH - 6);
    doc.text('geomind.app', PW - 14 - doc.getTextWidth('geomind.app'), PH - 6);
  }

  dlBlob(doc.output('blob'), name + '-geomind.pdf');
}

/* ─── DOCX ────────────────────────────────────────────────────── */
function _dlDOCX(ai, name, date, lat, lon) {
  /* Build a clean Word-compatible HTML document.
     Uses text/html MIME + BOM — Word opens .doc files built this way natively.
     NOTE: variable is named docHtml (NOT html) to avoid any scope collision. */
  const teal = '#006B5C';

  let docHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + name + ' — GeoMind</title>';
  docHtml += '<style>';
  docHtml += 'body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#111;max-width:720px;margin:30px auto;line-height:1.5;}';
  docHtml += 'h1{font-size:20pt;color:' + teal + ';border-bottom:3px solid ' + teal + ';padding-bottom:8px;margin-bottom:4px;}';
  docHtml += 'h2{font-size:12pt;color:' + teal + ';margin:18px 0 6px;border-left:4px solid ' + teal + ';padding-left:8px;}';
  docHtml += '.meta{font-size:9pt;color:#666;margin-bottom:22px;}';
  docHtml += 'table{width:100%;border-collapse:collapse;margin-bottom:12px;}';
  docHtml += 'td{padding:5px 8px;border-bottom:1px solid #ddd;font-size:10pt;vertical-align:top;}';
  docHtml += 'td.key{font-weight:600;color:#333;width:150px;white-space:nowrap;}';
  docHtml += '.tag{display:inline-block;padding:1px 7px;margin:2px;background:#e8f5e9;border-radius:8px;font-size:9pt;color:#2e7d32;}';
  docHtml += '.pill{background:#f0faf8;border-left:3px solid ' + teal + ';padding:5px 10px;margin:4px 0;font-size:10pt;}';
  docHtml += '.tl-row{display:flex;gap:12px;padding:5px 0;border-bottom:1px solid #eee;font-size:10pt;}';
  docHtml += '.tl-year{font-weight:700;min-width:55px;color:' + teal + ';}';
  docHtml += '.qbox{background:#f9f9f9;border:1px solid #eee;padding:8px;margin:5px 0;border-radius:4px;font-size:10pt;}';
  docHtml += '.qtext{font-weight:600;margin-bottom:4px;}';
  docHtml += '</style></head><body>';

  docHtml += '<h1>GeoMind AI Report</h1>';
  docHtml += '<div class="meta">';
  docHtml += 'Location: <b>' + name + '</b>&nbsp;&nbsp;|&nbsp;&nbsp;';
  docHtml += 'Date: ' + date + '&nbsp;&nbsp;|&nbsp;&nbsp;';
  docHtml += 'LAT: ' + lat.toFixed(6) + '&nbsp;&nbsp;LON: ' + lon.toFixed(6) + '&nbsp;&nbsp;|&nbsp;&nbsp;';
  docHtml += 'Generated by GeoMind v5.0';
  docHtml += '</div>';

  /* Section helper */
  const addSection = (title, obj) => {
    if (!obj || typeof obj !== 'object' || !Object.keys(obj).length) return;
    docHtml += '<h2>' + title + '</h2><table>';
    Object.entries(obj).forEach(([k, v]) => {
      const isArr = Array.isArray(v);
      const val   = isArr
        ? v.map(x => '<span class="tag">' + x + '</span>').join(' ')
        : (v != null ? String(v) : '&mdash;');
      docHtml += '<tr><td class="key">' + k + '</td><td>' + val + '</td></tr>';
    });
    docHtml += '</table>';
  };

  addSection('Location',          ai.locationId);
  addSection('Geography',         ai.geography);
  addSection('Agriculture',       ai.agriculture);
  addSection('History',           ai.history);
  addSection('Economy',           ai.economy);
  addSection('Current Relevance', ai.currentRelevance);
  addSection('Local Info',        ai.localInfo);

  /* Timeline — BUG WAS HERE: was using html+= instead of docHtml+= */
  if (Array.isArray(ai.timeline) && ai.timeline.length) {
    docHtml += '<h2>Historical Timeline</h2>';
    ai.timeline.forEach(e => {
      docHtml += '<div class="tl-row">';
      docHtml += '<div class="tl-year">' + (e.year  || '') + '</div>';
      docHtml += '<div>'                 + (e.event || '') + '</div>';
      docHtml += '</div>';
    });
  }

  /* Quiz */
  if (Array.isArray(ai.quiz?.mcqs) && ai.quiz.mcqs.length) {
    docHtml += '<h2>Quiz</h2>';
    ai.quiz.mcqs.forEach((q, i) => {
      docHtml += '<div class="qbox"><div class="qtext">Q' + (i+1) + '. ' + q.q + '</div>';
      docHtml += (q.options || []).join('&nbsp;&nbsp;');
      docHtml += '&nbsp;&nbsp;<b>[Answer: ' + q.answer + ']</b></div>';
    });
  }

  /* Exam Focus — BUG WAS HERE: was using html+= instead of docHtml+= */
  if (Array.isArray(ai.examFocus) && ai.examFocus.length) {
    docHtml += '<h2>Exam Focus</h2>';
    ai.examFocus.forEach(f => {
      docHtml += '<div class="pill">&#9889; ' + f + '</div>';
    });
  }

  docHtml += '</body></html>';

  dlBlob(
    new Blob(['\uFEFF' + docHtml], { type: 'text/html;charset=utf-8' }),
    name + '-geomind.doc'
  );
}

/* ─── dlBlob: Universal file download ─────────────────────────── */
/* ════════════════════════════════════════════════════════════════
   GEOMIND  dlBlob  v4.0  — Multi-strategy cross-environment download
   Works on: Chrome · Firefox · Safari · Android Chrome · WebView · Kodular
   ════════════════════════════════════════════════════════════════ */

/* ── Environment detection ──────────────────────────────────────── */
function _isWebView() {
  const ua = navigator.userAgent || '';
  /* Kodular / App Inventor WebViews identify themselves */
  if (/Kodular|AppInventor|MIT-AI2/i.test(ua)) return true;
  /* Generic Android WebView signal: wv flag or no Chrome version in UA */
  if (/Android/i.test(ua) && /wv|WebView/i.test(ua))  return true;
  /* Android Chrome has "Chrome/X" but WebView also does — detect via APIs */
  if (typeof window.Android !== 'undefined')           return true;   // injected Java bridge
  /* If download attribute is NOT honoured (feature-detect) */
  const a = document.createElement('a');
  if (typeof a.download === 'undefined')               return true;
  return false;
}

function _isMobileChrome() {
  return /Android/i.test(navigator.userAgent) && /Chrome/i.test(navigator.userAgent)
      && !/wv|WebView/i.test(navigator.userAgent);
}

/* ── Core anchor-click trigger ──────────────────────────────────── */
function _triggerAnchor(href, filename) {
  const a = document.createElement('a');
  a.href  = href;
  a.download = filename;
  a.setAttribute('download', filename);
  a.setAttribute('target', '_blank');   // helps some WebViews
  a.style.cssText = 'visibility:hidden;position:absolute;left:0;top:0;width:0;height:0;';
  document.body.appendChild(a);
  a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  setTimeout(() => { try { document.body.removeChild(a); } catch(_){} }, 2000);
}

/* ── Method: window.open data-URI (WebView new-tab route) ───────── */
function _openDataURITab(dataURI, filename) {
  try {
    const w = window.open(dataURI, '_blank');
    if (w) {
      toast('File opened in new tab — tap ⋮ → Download to save.', 'ok');
      return true;
    }
  } catch(_) {}
  return false;
}

/* ── Method: location.href data-URI (last-resort for tiny files) ── */
function _locationHref(dataURI) {
  try {
    window.location.href = dataURI;
    return true;
  } catch(_) {}
  return false;
}

/* ── WebView Save Modal — shows file for manual long-press save ─── */
function _showWebViewSaveModal(dataURI, filename, mimeLabel) {
  // Remove any stale modal
  const old = document.getElementById('_wvSaveModal');
  if (old) old.remove();

  const ext   = filename.split('.').pop().toUpperCase();
  const isTxt = /txt/i.test(ext);

  const modal = document.createElement('div');
  modal.id = '_wvSaveModal';
  modal.style.cssText = [
    'position:fixed;inset:0;z-index:999999;',
    'background:rgba(0,0,0,0.82);',
    'display:flex;align-items:center;justify-content:center;',
    'padding:16px;box-sizing:border-box;'
  ].join('');

  modal.innerHTML = `
<div style="background:#1a1f2e;border:1px solid rgba(0,229,200,0.25);border-radius:18px;
            width:100%;max-width:420px;max-height:90vh;overflow:hidden;
            display:flex;flex-direction:column;box-shadow:0 40px 80px rgba(0,0,0,0.7);">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;
              padding:16px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.08);">
    <div>
      <div style="font-size:15px;font-weight:700;color:#e8f4f2;">
        📥 Save Report — <span style="color:#00e5c8;">${ext}</span>
      </div>
      <div style="font-size:11px;color:#7c9a96;margin-top:2px;">${filename}</div>
    </div>
    <button id="_wvClose" style="background:rgba(255,255,255,0.07);border:none;color:#7c9a96;
                                  width:30px;height:30px;border-radius:50%;font-size:14px;
                                  cursor:pointer;">✕</button>
  </div>

  <!-- Instructions -->
  <div style="padding:14px 20px 10px;">
    <div style="font-size:12px;color:#7c9a96;margin-bottom:10px;">
      Your browser blocked the automatic download. Use one of these methods:
    </div>

    <!-- Method 1: Open in new tab -->
    <div style="background:rgba(0,229,200,0.07);border:1px solid rgba(0,229,200,0.2);
                border-radius:10px;padding:12px 14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:#00e5c8;margin-bottom:6px;">
        ① Open &amp; Save (Recommended)
      </div>
      <div style="font-size:11px;color:#9eaba9;margin-bottom:8px;">
        Opens the file in a new tab. Then tap <strong style="color:#e8f4f2;">⋮ → Download</strong> or
        <strong style="color:#e8f4f2;">Share → Save to Files</strong>.
      </div>
      <button id="_wvOpenTab"
        style="width:100%;padding:9px;background:rgba(0,229,200,0.15);
               border:1px solid rgba(0,229,200,0.3);color:#00e5c8;
               border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">
        🔗 Open in New Tab
      </button>
    </div>

    <!-- Method 2: Copy base64 / share -->
    <div style="background:rgba(157,122,255,0.07);border:1px solid rgba(157,122,255,0.2);
                border-radius:10px;padding:12px 14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:#c084fc;margin-bottom:6px;">
        ② Direct Download Attempt
      </div>
      <div style="font-size:11px;color:#9eaba9;margin-bottom:8px;">
        Forces a download via data URI. May open in browser — then use
        <strong style="color:#e8f4f2;">Share → Save</strong>.
      </div>
      <button id="_wvDirectDl"
        style="width:100%;padding:9px;background:rgba(157,122,255,0.12);
               border:1px solid rgba(157,122,255,0.25);color:#c084fc;
               border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">
        ⬇ Force Download
      </button>
    </div>

    ${isTxt ? `
    <!-- Method 3 (TXT only): Copy text -->
    <div style="background:rgba(74,158,255,0.07);border:1px solid rgba(74,158,255,0.2);
                border-radius:10px;padding:12px 14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:#4a9eff;margin-bottom:6px;">
        ③ Copy Text to Clipboard
      </div>
      <div style="font-size:11px;color:#9eaba9;margin-bottom:8px;">
        Copy the full report text, then paste into any app or notes.
      </div>
      <button id="_wvCopyText"
        style="width:100%;padding:9px;background:rgba(74,158,255,0.10);
               border:1px solid rgba(74,158,255,0.25);color:#4a9eff;
               border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">
        📋 Copy Report Text
      </button>
    </div>` : ''}

    <!-- Method 4: Web Share API -->
    <div id="_wvShareWrap" style="display:none;background:rgba(34,197,94,0.07);
                border:1px solid rgba(34,197,94,0.2);border-radius:10px;
                padding:12px 14px;margin-bottom:10px;">
      <div style="font-size:12px;font-weight:700;color:#22c55e;margin-bottom:6px;">
        ④ Share via Android Sheet
      </div>
      <div style="font-size:11px;color:#9eaba9;margin-bottom:8px;">
        Opens Android's native share sheet so you can save to Drive, Files, etc.
      </div>
      <button id="_wvShare"
        style="width:100%;padding:9px;background:rgba(34,197,94,0.10);
               border:1px solid rgba(34,197,94,0.25);color:#22c55e;
               border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">
        ↗ Share / Export
      </button>
    </div>

    <!-- Status row -->
    <div id="_wvStatus" style="font-size:11px;color:#00e5c8;min-height:16px;
                                text-align:center;margin-top:2px;"></div>
  </div>
</div>`;

  document.body.appendChild(modal);

  // ── Close ──────────────────────────────────────────────────────────────
  const close = () => { try { modal.remove(); } catch(_){} };
  document.getElementById('_wvClose').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  const setStatus = (msg, ok) => {
    const s = document.getElementById('_wvStatus');
    if (s) { s.textContent = msg; s.style.color = ok ? '#22c55e' : '#ff6b7a'; }
  };

  // ── Open in new tab ────────────────────────────────────────────────────
  document.getElementById('_wvOpenTab').addEventListener('click', () => {
    try {
      const w = window.open(dataURI, '_blank');
      if (w) { setStatus('✓ Opened! Tap ⋮ → Download to save.', true); }
      else   { setStatus('Popup blocked — try Force Download below.', false); }
    } catch(e) { setStatus('Failed: ' + e.message, false); }
  });

  // ── Force download ─────────────────────────────────────────────────────
  document.getElementById('_wvDirectDl').addEventListener('click', () => {
    try {
      const a = document.createElement('a');
      a.href      = dataURI;
      a.download  = filename;
      a.setAttribute('download', filename);
      a.style.cssText = 'visibility:hidden;position:absolute;left:0;top:0;';
      document.body.appendChild(a);
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      setTimeout(() => { try { document.body.removeChild(a); } catch(_){} }, 2000);
      setStatus('Download triggered — check your Downloads folder.', true);
    } catch(e) { setStatus('Failed: ' + e.message, false); }
  });

  // ── Copy text (TXT only) ───────────────────────────────────────────────
  const copyBtn = document.getElementById('_wvCopyText');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      try {
        /* Decode base64 text from data URI */
        const b64  = dataURI.split(',')[1] || '';
        const text = atob(b64);            // works because TXT is base64-encoded
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => setStatus('✓ Copied to clipboard!', true))
            .catch(() => _fallbackCopy(text, setStatus));
        } else {
          _fallbackCopy(text, setStatus);
        }
      } catch(e) { setStatus('Copy failed: ' + e.message, false); }
    });
  }

  // ── Web Share API ─────────────────────────────────────────────────────
  if (navigator.share && navigator.canShare) {
    const shareWrap = document.getElementById('_wvShareWrap');
    if (shareWrap) shareWrap.style.display = 'block';
    document.getElementById('_wvShare').addEventListener('click', async () => {
      try {
        /* Convert dataURI back to File for sharing */
        const res  = await fetch(dataURI);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'GeoMind Report', text: filename });
          setStatus('✓ Shared successfully!', true);
        } else {
          await navigator.share({ title: 'GeoMind Report', text: 'Download: ' + filename, url: dataURI });
          setStatus('✓ Share sheet opened!', true);
        }
      } catch(e) {
        if (e.name !== 'AbortError') setStatus('Share failed: ' + e.message, false);
      }
    });
  }
}

/* ── Textarea clipboard fallback ────────────────────────────────── */
function _fallbackCopy(text, setStatus) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    setStatus(ok ? '✓ Copied to clipboard!' : 'Copy failed — try manually.', ok);
  } catch(e) {
    if (setStatus) setStatus('Copy failed: ' + e.message, false);
  }
}

/* ════════════════════════════════════════════════════════════════
   dlBlob  — main entry point called by all _dl* formatters
   Strategy waterfall:
     M1  Blob URL + anchor click          (desktop Chrome/FF/Edge, Android Chrome)
     M2  FileReader data-URI + anchor     (older Safari, some WebViews)
     M3  FileReader data-URI + window.open (WebView new-tab route)
     M4  FileReader data-URI + location   (last-resort tiny-file route)
     M5  _showWebViewSaveModal            (Kodular / fully locked WebViews)
   ════════════════════════════════════════════════════════════════ */
function dlBlob(blob, filename) {
  if (!blob || !filename) { console.error('[dlBlob] missing blob or filename'); return; }

  const wv = _isWebView();
  console.log('[dlBlob] env → isWebView=' + wv + ' | ua=' + navigator.userAgent.substring(0,80));

  /* ── Helper: attempt anchor click on a given href ── */
  const tryAnchor = (href) => {
    const a = document.createElement('a');
    a.href  = href;
    a.download = filename;
    a.setAttribute('download', filename);
    a.setAttribute('target', '_blank');
    a.style.cssText = 'visibility:hidden;position:absolute;left:0;top:0;width:0;height:0;';
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    setTimeout(() => { try { document.body.removeChild(a); } catch(_){} }, 2000);
  };

  /* ══ FAST PATH: Desktop / Android Chrome (not WebView) ══════════ */
  if (!wv) {
    /* M1 — Blob URL (standard, fastest) */
    try {
      const url = URL.createObjectURL(blob);
      tryAnchor(url);
      setTimeout(() => { try { URL.revokeObjectURL(url); } catch(_){} }, 3000);
      toast('⬇ Downloading ' + filename + ' …', 'ok');
      return;
    } catch(e1) {
      console.warn('[dlBlob] M1 failed:', e1.message);
    }

    /* M2 — FileReader data-URI anchor (fallback for no createObjectURL) */
    try {
      const r = new FileReader();
      r.onload  = () => { tryAnchor(r.result); toast('⬇ Downloading ' + filename + ' …', 'ok'); };
      r.onerror = () => toast('Download error — try again.', 'err');
      r.readAsDataURL(blob);
      return;
    } catch(e2) {
      console.warn('[dlBlob] M2 failed:', e2.message);
    }
  }

  /* ══ WEBVIEW PATH ════════════════════════════════════════════════ */
  /* Convert blob → base64 data-URI first (needed for all WebView methods) */
  try {
    const reader = new FileReader();

    reader.onload = function() {
      const dataURI = reader.result;   // "data:mime/type;base64,AAAA..."
      const ext     = filename.split('.').pop().toLowerCase();

      console.log('[dlBlob] WebView path | dataURI length=' + dataURI.length);

      /* M3 — Anchor click on data-URI  (works in some WebViews) */
      let m3ok = false;
      try {
        tryAnchor(dataURI);
        m3ok = true;
      } catch(e3) { console.warn('[dlBlob] M3 failed:', e3.message); }

      /* M4 — window.open data-URI (WebView new-tab, reliable in MIUI, Samsung) */
      let m4ok = false;
      try {
        const w = window.open(dataURI, '_blank');
        if (w !== null && w !== undefined) m4ok = true;
      } catch(e4) { console.warn('[dlBlob] M4 failed:', e4.message); }

      /* M5 — location.href for plain-text / small files only */
      let m5ok = false;
      if (!m4ok && ext === 'txt' && dataURI.length < 500000) {
        try { window.location.href = dataURI; m5ok = true; }
        catch(e5) { console.warn('[dlBlob] M5 failed:', e5.message); }
      }

      /* If any silent method may have worked, show a soft toast */
      if (m3ok || m4ok) {
        toast('⬇ Download started — check Downloads folder or new tab.', 'ok');
        /* Also show the modal after a short delay as a backup */
        setTimeout(() => {
          const hasFile = document.getElementById('_wvSaveModal');
          if (!hasFile) _showWebViewSaveModal(dataURI, filename, ext.toUpperCase());
        }, 2200);
        return;
      }

      /* M6 — Full modal (guaranteed fallback — always works) */
      _showWebViewSaveModal(dataURI, filename, ext.toUpperCase());
    };

    reader.onerror = () => {
      toast('Download failed — unable to read file.', 'err');
    };

    reader.readAsDataURL(blob);

  } catch(ex) {
    console.error('[dlBlob] WebView path crashed:', ex.message);
    toast('Download failed: ' + ex.message, 'err');
  }
}

/* ══════════════════════════════════════════════════════
   SECTION 4 — REPORT CACHE SYSTEM
   ══════════════════════════════════════════════════════ */
function _cacheKey(lat, lon) {
  // Round to 2 decimal places for approximate location matching (~1.1km)
  return `${parseFloat(lat).toFixed(2)}_${parseFloat(lon).toFixed(2)}`;
}
async function cacheReport(lat, lon, geo, country, wiki, ai) {
  if (!currentUser) return;
  try {
    const key = _cacheKey(lat, lon);
    const rec = {
      userId: currentUser.uid,
      location: ai.locationId?.nearestCity||geo.address?.city||'',
      latitude: parseFloat(lat), longitude: parseFloat(lon),
      reportContent: JSON.stringify(ai),
      geoData: JSON.stringify(geo),
      countryData: country ? JSON.stringify(country) : null,
      wikiData: wiki ? JSON.stringify({extract: wiki.extract?.substring(0,500)||''}) : null,
      timestamp: new Date().toISOString()
    };
    await db.ref(`reports/${currentUser.uid}/${key}`).set(rec);
    console.log('[cache] saved report for', key);
  } catch(e) { console.warn('[cache] save failed:', e.message); }
}
async function loadCachedReport(lat, lon) {
  if (!currentUser) return null;
  try {
    const key = _cacheKey(lat, lon);
    const snap = await db.ref(`reports/${currentUser.uid}/${key}`).once('value');
    if (!snap.exists()) return null;
    const rec = snap.val();
    const ai = JSON.parse(rec.reportContent);
    const geo = rec.geoData ? JSON.parse(rec.geoData) : {address:{}};
    const country = rec.countryData ? JSON.parse(rec.countryData) : null;
    const wiki = rec.wikiData ? JSON.parse(rec.wikiData) : null;
    console.log('[cache] hit for', key);
    return {lat, lon, geo, country, wiki, ai};
  } catch(e) { console.warn('[cache] load failed:', e.message); return null; }
}

/* ══════════════════════════════════════════════════════
   SECTION 5 — OFFLINE MODE
   ══════════════════════════════════════════════════════ */
function setupOfflineMode() {
  const banner = document.getElementById('offlineBanner');
  const update = () => {
    if (!navigator.onLine) { banner.classList.add('show'); }
    else { banner.classList.remove('show'); }
  };
  window.addEventListener('online',  update);
  window.addEventListener('offline', update);
  update();
}

/* ══════════════════════════════════════════════════════
   SECTION 6 — LEARNING PROGRESS TRACKER
   ══════════════════════════════════════════════════════ */
async function loadProgressStats() {
  if (!currentUser) return;
  try {
    const [qSnap, cSnap] = await Promise.all([
      db.ref('users/'+currentUser.uid+'/queries').once('value'),
      db.ref('users/'+currentUser.uid+'/chats').once('value')
    ]);
    const queries = qSnap.val()  || {};
    const chats   = cSnap.val()  || {};
    const entries = Object.values(queries);

    // 1. Total lifetime reports (never resets)
    const totalReports = entries.length;

    // 2. Monthly reports (computed dynamically — no stored counter needed)
    const monthStart = monthStr(); // "2025-03"
    const monthlyReports = entries.filter(e => {
      const ts = e.timestamp || e.createdAt || '';
      return ts.startsWith(monthStart);
    }).length;

    // 3. Plan-usage reports (since planStartDate — resets on plan activation)
    const planStartDate = userProfile.planStartDate || '';
    const planUsedFromHistory = planStartDate
      ? entries.filter(e => {
          const ts = e.timestamp || e.createdAt || '';
          return ts >= planStartDate;
        }).length
      : (userProfile.planUsed || 0);

    // Reconcile: if history-based count differs from stored planUsed, prefer history
    if (planUsedFromHistory !== (userProfile.planUsed || 0) && userProfile.plan !== null) {
      console.log(`[GeoMind] Reconciling planUsed: stored=${userProfile.planUsed} history=${planUsedFromHistory}`);
      userProfile.planUsed = planUsedFromHistory;
      await savePlanUsageFields();
      updateNavUI();
      updateUsageWidget();
    }

    // Unique locations and countries
    const locations = new Set(entries.map(e =>
      `${parseFloat(e.latitude||0).toFixed(1)}_${parseFloat(e.longitude||0).toFixed(1)}`
    )).size;
    const countries = new Set(entries.map(e => e.country||'').filter(Boolean)).size;
    const chatCount = Object.values(chats).length;

    // Update profile stats display
    const setEl = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
    setEl('statReports',   totalReports);
    setEl('statLocations', locations);
    setEl('statChats',     chatCount);
    setEl('statCountries', countries);

    // Total comparisons from userProfile
    setEl('statComparisons', userProfile.totalComparisons || 0);

    // Update totalReports in userProfile if it drifted
    if (userProfile.totalReports !== totalReports) {
      userProfile.totalReports = totalReports;
      await savePlanUsageFields();
    }

    // Update profile page breakdown elements
    const monthEl = document.getElementById('statMonthly');
    if (monthEl) monthEl.textContent = monthlyReports;
    const planEl = document.getElementById('statPlanUsed');
    if (planEl) {
      const limit = getPlanGenLimit();
      planEl.textContent = `${planUsedFromHistory}/${limit}`;
    }
    const cmpEl = document.getElementById('statCompareUsed');
    if (cmpEl) {
      const cmpLimit = getPlanComparisonLimit();
      const cmpUsed  = userProfile.comparisonUsed || 0;
      cmpEl.textContent = `${cmpUsed}/${cmpLimit}`;
    }
    const totalEl = document.getElementById('statReportsTotal');
    if (totalEl) totalEl.textContent = totalReports;

  } catch(e) { console.warn('[progress]', e.message); }
}

/* ══════════════════════════════════════════════════════
   SECTION 7 — REPORT SHARING
   ══════════════════════════════════════════════════════ */
function shareReport(platform) {
  if (!curData || !curData.ai) { toast('Generate a report first to share it.','err'); return; }
  const loc  = curData.ai.locationId?.nearestCity || curData.ai.locationId?.country || 'this location';
  const coord= `${parseFloat(curData.lat||0).toFixed(4)},${parseFloat(curData.lon||0).toFixed(4)}`;
  // Build a share link (deep link back into GeoMind with coords)
  const baseUrl = window.location.href.split('?')[0];
  const shareUrl = `${baseUrl}?lat=${encodeURIComponent(curData.lat)}&lon=${encodeURIComponent(curData.lon)}`;
  const text = `📍 GeoMind AI Report: ${loc}\n🌐 Coordinates: ${coord}\n\nCheck the full geo-intelligence report here: ${shareUrl}`;
  const enc  = encodeURIComponent(text);
  const urlEnc = encodeURIComponent(shareUrl);

  if (platform === 'whatsapp') {
    window.open(`https://wa.me/?text=${enc}`, '_blank');
  } else if (platform === 'telegram') {
    window.open(`https://t.me/share/url?url=${urlEnc}&text=${encodeURIComponent('📍 GeoMind AI Report: '+loc)}`, '_blank');
  } else if (platform === 'email') {
    const subject = encodeURIComponent(`GeoMind Report: ${loc}`);
    const body    = encodeURIComponent(`Hi,\n\nI generated an AI geography report for ${loc} on GeoMind.\n\n${shareUrl}\n\nCoordinates: ${coord}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  } else if (platform === 'copy') {
    const ta = document.createElement('textarea');
    ta.value = shareUrl;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(ta);
    ta.select(); ta.setSelectionRange(0,9999);
    try { document.execCommand('copy'); toast('🔗 Share link copied!','ok'); }
    catch(e) { toast('Copy failed — '+(e.message||'unknown'),'err'); }
    document.body.removeChild(ta);
    // Also try modern clipboard
    if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).catch(()=>{});
  }
}

// Check URL params on page load to auto-load a shared report link
function checkSharedReportLink() {
  try {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat'));
    const lon = parseFloat(params.get('lon'));
    if (!isNaN(lat) && !isNaN(lon)) {
      // Clean the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
      // Wait a beat for the app to fully initialize, then trigger the report
      setTimeout(() => {
        pendingLat = lat; pendingLon = lon;
        placePin(lat, lon, '#00d4aa');
        showPill(lat, lon);
        goPage('map');
        toast('📤 Loading shared report…', 'ok');
        setTimeout(() => handleSend(), 800);
      }, 1200);
    }
  } catch(e) { console.warn('[sharedLink]', e.message); }
}

// Open full report in the existing preview modal (section 8 — single report access)
function openReportFile() {
  if (!curData || !curData.ai) { toast('No report loaded yet.','err'); return; }
  // Build a fake history record from curData and use the existing preview modal
  const rec = {
    selectedPlace: curData.ai?.locationId?.nearestCity || '',
    country: curData.geo?.address?.country || '',
    state:   curData.geo?.address?.state || '',
    latitude:  curData.lat,
    longitude: curData.lon,
    aiResponse: JSON.stringify(curData.ai),
    timestamp: new Date().toISOString()
  };
  previewHistReport(encodeURIComponent(JSON.stringify(rec)));
}

/* ══════════════════════════════════════════════════════
   SECTION 9 — PASSWORD MANAGEMENT
   ══════════════════════════════════════════════════════ */
async function changePassword() {
  const currentPwd = document.getElementById('pwdCurrent').value;
  const newPwd     = document.getElementById('pwdNew').value;
  const confirmPwd = document.getElementById('pwdConfirm').value;
  const fb         = document.getElementById('pwdFeedback');

  const show = (msg, type) => {
    fb.textContent = msg;
    fb.className = 'pwd-feedback ' + type;
  };

  if (!currentPwd || !newPwd || !confirmPwd) { show('Please fill in all password fields.','err'); return; }
  if (newPwd.length < 8) { show('New password must be at least 8 characters.','err'); return; }
  if (newPwd !== confirmPwd) { show('New passwords do not match.','err'); return; }
  if (newPwd === currentPwd) { show('New password must be different from current.','err'); return; }

  try {
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js').catch(()=>null) || {};
    // Use compat SDK re-auth approach
    const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPwd);
    await currentUser.reauthenticateWithCredential(credential);
    await currentUser.updatePassword(newPwd);
    show('✓ Password updated successfully!', 'ok');
    document.getElementById('pwdCurrent').value = '';
    document.getElementById('pwdNew').value = '';
    document.getElementById('pwdConfirm').value = '';
    toast('Password changed successfully!','ok');
  } catch(e) {
    const msgs = {
      'auth/wrong-password': 'Current password is incorrect.',
      'auth/weak-password':  'New password is too weak (min 8 chars).',
      'auth/requires-recent-login': 'Please sign out and sign back in before changing password.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
    };
    show(msgs[e.code] || 'Error: ' + e.message, 'err');
  }
}

/* ══════════════════════════════════════════════════════
   LOCATION COMPARISON — Mini-Map Click to Set (v3)
   ══════════════════════════════════════════════════════ */
let compareA = null, compareB = null;
let _cmpMapA  = null, _cmpMapB  = null;
let _cmpPinA  = null, _cmpPinB  = null;
let _cmpMapsInited = false;

/* ── Initialise both mini Leaflet maps (called once) ── */
function _initCompareMaps() {
  if (_cmpMapsInited) return;

  const elA = document.getElementById('cmpMapA');
  const elB = document.getElementById('cmpMapB');
  if (!elA || !elB) return; // DOM not ready yet

  _cmpMapsInited = true;

  const tileUrl  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const tileOpts = { attribution: '', maxZoom: 18 };
  const center   = [20.59, 78.96];
  const zoom     = 3;

  // ── Map A ──
  _cmpMapA = L.map(elA, {
    zoomControl: true,
    attributionControl: false,
    preferCanvas: true
  }).setView(center, zoom);
  L.tileLayer(tileUrl, tileOpts).addTo(_cmpMapA);
  _cmpMapA.on('click', function(e) { _onCmpMapClick('A', e.latlng.lat, e.latlng.lng); });

  // ── Map B ──
  _cmpMapB = L.map(elB, {
    zoomControl: true,
    attributionControl: false,
    preferCanvas: true
  }).setView(center, zoom);
  L.tileLayer(tileUrl, tileOpts).addTo(_cmpMapB);
  _cmpMapB.on('click', function(e) { _onCmpMapClick('B', e.latlng.lat, e.latlng.lng); });
}

/* ── Called on every visit to compare page ── */
function initCompare() {
  // Maps need the DOM to be visible before init — delay slightly
  setTimeout(function() {
    _initCompareMaps();

    // Force size recalculation after paint
    setTimeout(function() {
      if (_cmpMapA) _cmpMapA.invalidateSize();
      if (_cmpMapB) _cmpMapB.invalidateSize();
    }, 200);

    // Restore persisted selections
    if (compareA) _renderCmpPin('A', compareA.lat, compareA.lon, compareA.name);
    if (compareB) _renderCmpPin('B', compareB.lat, compareB.lon, compareB.name);

    _refreshCompareRunBtn();
  }, 80);
}

/* ── User clicked on mini-map ── */
async function _onCmpMapClick(slot, lat, lon) {
  // Show loading in status
  _setCmpStatus(slot, 'Locating…', false);

  // Place pin immediately
  _renderCmpPin(slot, lat, lon, lat.toFixed(4) + '°, ' + lon.toFixed(4) + '°');

  // Reverse-geocode to get proper name
  try {
    const url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon + '&zoom=10&addressdetails=1';
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    const addr = data.address || {};
    const name = addr.city || addr.town || addr.village || addr.county
               || addr.state_district || addr.state || addr.country
               || (lat.toFixed(2) + '°, ' + lon.toFixed(2) + '°');
    const sub  = [addr.state, addr.country].filter(Boolean).join(', ') || '';

    // Update pin data
    const geoObj = { address: { city: addr.city||addr.town||addr.village||'', state: addr.state||'', country: addr.country||'', county: addr.county||'' } };
    if (slot === 'A') {
      compareA = { lat: lat, lon: lon, geo: geoObj, ai: {}, name: name, sub: sub };
    } else {
      compareB = { lat: lat, lon: lon, geo: geoObj, ai: {}, name: name, sub: sub };
    }

    _renderCmpPin(slot, lat, lon, name);
    toast('📍 Location ' + slot + ': ' + name, 'ok');
  } catch(e) {
    // Keep coordinates as name on failure
    const name = lat.toFixed(3) + '°, ' + lon.toFixed(3) + '°';
    const geoObj = { address: {} };
    if (slot === 'A') {
      compareA = { lat: lat, lon: lon, geo: geoObj, ai: {}, name: name, sub: '' };
    } else {
      compareB = { lat: lat, lon: lon, geo: geoObj, ai: {}, name: name, sub: '' };
    }
    toast('📍 Location ' + slot + ' set', 'ok');
  }

  _refreshCompareRunBtn();
}

/* ── Place / move pin on a mini-map ── */
function _renderCmpPin(slot, lat, lon, name) {
  const isA   = slot === 'A';
  const lmap  = isA ? _cmpMapA  : _cmpMapB;
  let   lpin  = isA ? _cmpPinA  : _cmpPinB;
  const color = isA ? '#00e5c8' : '#4a7cff';
  const card  = document.getElementById(isA ? 'cmpCardA' : 'cmpCardB');
  const nameEl= document.getElementById(isA ? 'cmpNameA' : 'cmpNameB');
  const hintEl= document.getElementById(isA ? 'cmpHintA' : 'cmpHintB');

  if (!lmap) return;

  // Remove old pin
  if (lpin) { lmap.removeLayer(lpin); }

  // Create coloured circle marker
  const newPin = L.circleMarker([lat, lon], {
    radius: 9,
    fillColor: color,
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.9
  }).addTo(lmap);
  newPin.bindTooltip(name, { permanent: false, direction: 'top' });

  if (isA) _cmpPinA = newPin; else _cmpPinB = newPin;

  lmap.setView([lat, lon], 7, { animate: true });

  // Update UI
  if (nameEl) nameEl.textContent = name;
  if (hintEl) hintEl.textContent = 'Tap to change';
  if (card)   card.classList.add('has-pin');
  _setCmpStatus(slot, name, true);
}

/* ── Status bar text ── */
function _setCmpStatus(slot, text, active) {
  const isA = slot === 'A';
  const txtEl = document.getElementById(isA ? 'cmpStatusTextA' : 'cmpStatusTextB');
  const dot   = document.querySelector(isA ? '.cmp-dot-a' : '.cmp-dot-b');
  if (txtEl) txtEl.textContent = text;
  if (dot) {
    if (active) dot.classList.add('active');
    else        dot.classList.remove('active');
  }
}

/* ── Clear one pin ── */
function clearComparePin(slot) {
  const isA = slot === 'A';
  const lmap = isA ? _cmpMapA : _cmpMapB;
  const lpin = isA ? _cmpPinA : _cmpPinB;

  if (lpin && lmap) { lmap.removeLayer(lpin); }
  if (isA) { compareA = null; _cmpPinA = null; }
  else     { compareB = null; _cmpPinB = null; }

  const card   = document.getElementById(isA ? 'cmpCardA' : 'cmpCardB');
  const nameEl = document.getElementById(isA ? 'cmpNameA' : 'cmpNameB');
  const hintEl = document.getElementById(isA ? 'cmpHintA' : 'cmpHintB');
  if (card)   card.classList.remove('has-pin');
  if (nameEl) nameEl.textContent = '';
  if (hintEl) hintEl.textContent = 'Tap map to select';
  _setCmpStatus(slot, 'Not selected', false);
  _refreshCompareRunBtn();
  toast('Location ' + slot + ' cleared', 'warn');
}

/* ── Enable / animate run button ── */
function _refreshCompareRunBtn() {
  const btn = document.getElementById('compareRunBtn');
  if (!btn) return;
  btn.disabled = !(compareA && compareB);
  if (compareA && compareB) {
    btn.style.animation = 'pulse 0.6s ease';
    setTimeout(function() { btn.style.animation = ''; }, 700);
  }
}

/* Legacy stub — no longer needed but kept for safety */
function setComparePin(which) {
  toast('Tap directly on the map above to select Location ' + which, 'warn');
}

async function runComparison() {
  if (!compareA || !compareB) { toast('Select both locations first.','err'); return; }

  // ── Comparison limit check ──
  if (!canCompare()) {
    const plan  = userProfile.plan || 'free_trial';
    const limit = getPlanComparisonLimit();
    const used  = userProfile.comparisonUsed || 0;
    if (plan === 'free_trial') {
      toast('Add your API key in Settings to use comparisons.','err');
    } else {
      showErr(`⚖ Comparison limit reached (${used}/${limit}). Upgrade your plan to compare more locations.`);
    }
    return;
  }

  document.getElementById('compareLoad').style.display  = 'flex';
  document.getElementById('compareResult').style.display = 'none';
  document.getElementById('compareRunBtn').disabled = true;

  const cStep = (msg, pct) => {
    document.getElementById('cmpStep').textContent = msg;
    document.getElementById('cmpPfill').style.width = pct + '%';
  };

  try {
    cStep('Loading data for Location A…', 20);
    const dataA = await _getCompareData(compareA);
    cStep('Loading data for Location B…', 50);
    const dataB = await _getCompareData(compareB);
    cStep('Generating comparison…', 80);
    // Increment before rendering so limit is always accurate
    await incrementComparison();
    renderComparison(dataA, dataB);
    cStep('Done!', 100);
  } catch(e) {
    toast('Comparison failed: ' + e.message, 'err');
    console.error('[compare]', e);
  } finally {
    document.getElementById('compareLoad').style.display = 'none';
    document.getElementById('compareRunBtn').disabled = false;
  }
}

async function _getCompareData(pin) {
  // Try cache first
  const cached = await loadCachedReport(pin.lat, pin.lon);
  if (cached) return cached;
  // Use existing pin.ai if it's loaded from current session
  if (pin.ai && pin.ai.locationId) return pin;
  // Fetch fresh (no AI increment — comparison uses existing data)
  const geo     = await fetchGeo(pin.lat, pin.lon).catch(()=>({address:{}}));
  const country = await fetchCountry(geo.address?.country||'').catch(()=>null);
  const wiki    = await fetchWiki(geo.address?.city||geo.address?.state||geo.address?.country||'').catch(()=>null);
  // Fetch AI for comparison
  const apiKey  = getReportAPIKey();
  if (!apiKey) throw new Error('No API key — set one in Settings.');
  const model   = getSelectedModel(false);
  const loc     = [geo.address?.city, geo.address?.state, geo.address?.country].filter(Boolean).join(', ');
  const prompt  = `You are an Educational Geo-Intelligence System.\nLOCATION: ${loc} | LAT: ${pin.lat} | LON: ${pin.lon}\nReturn ONLY compact valid JSON (no markdown):\n{"locationId":{"country":"","state":"","nearestCity":"","coordinates":""},"geography":{"terrain":"","climate":"","soilType":"","rivers":""},"agriculture":{"majorCrops":[""],"irrigationSources":""},"history":{"ancient":"","modern":""},"economy":{"majorIndustries":[""],"gdpContribution":""},"currentRelevance":{"environmentalIssues":"","strategicImportance":""},"localInfo":{"localLanguages":"","famousFor":[""]}}`;
  const raw = await callAI(prompt, apiKey, model);
  let text = raw.replace(/```json|```/g,'').trim();
  const f=text.indexOf('{'),l=text.lastIndexOf('}');
  if(f!==-1&&l!==-1) text=text.substring(f,l+1);
  const ai = JSON.parse(text);
  await cacheReport(pin.lat, pin.lon, geo, country, wiki, ai);
  return {lat:pin.lat, lon:pin.lon, geo, country, wiki, ai};
}

function renderComparison(dA, dB) {
  const aiA = dA.ai, aiB = dB.ai;
  const nameA = aiA.locationId?.nearestCity || compareA.name;
  const nameB = aiB.locationId?.nearestCity || compareB.name;
  const flagA = getFlagEmoji(aiA.locationId?.country||'');
  const flagB = getFlagEmoji(aiB.locationId?.country||'');

  const row = (label, a, b) => {
    const va = Array.isArray(a) ? a.join(', ') : (a||'—');
    const vb = Array.isArray(b) ? b.join(', ') : (b||'—');
    return `<tr><td>${label}</td><td>${va}</td><td>${vb}</td></tr>`;
  };

  let h = `<table class="compare-table">
    <thead><tr>
      <th>Category</th>
      <th>${flagA} ${nameA}</th>
      <th>${flagB} ${nameB}</th>
    </tr></thead><tbody>`;

  h += `<tr><td colspan="3" style="background:rgba(0,229,200,0.05);color:var(--cyan);font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;">🌏 Geography</td></tr>`;
  h += row('Terrain',    aiA.geography?.terrain,    aiB.geography?.terrain);
  h += row('Climate',    aiA.geography?.climate,    aiB.geography?.climate);
  h += row('Soil Type',  aiA.geography?.soilType,   aiB.geography?.soilType);
  h += row('Rivers',     aiA.geography?.rivers,     aiB.geography?.rivers);

  h += `<tr><td colspan="3" style="background:rgba(52,211,153,0.05);color:var(--green);font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;">🌾 Agriculture</td></tr>`;
  h += row('Major Crops',aiA.agriculture?.majorCrops, aiB.agriculture?.majorCrops);
  h += row('Irrigation', aiA.agriculture?.irrigationSources, aiB.agriculture?.irrigationSources);

  h += `<tr><td colspan="3" style="background:rgba(74,158,255,0.05);color:var(--blue);font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;">💰 Economy</td></tr>`;
  h += row('Industries',  aiA.economy?.majorIndustries, aiB.economy?.majorIndustries);
  h += row('GDP Role',    aiA.economy?.gdpContribution, aiB.economy?.gdpContribution);

  h += `<tr><td colspan="3" style="background:rgba(157,122,255,0.05);color:var(--purple);font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;">📜 History</td></tr>`;
  h += row('Ancient',    aiA.history?.ancient, aiB.history?.ancient);
  h += row('Modern',     aiA.history?.modern,  aiB.history?.modern);

  h += `<tr><td colspan="3" style="background:rgba(255,202,69,0.05);color:var(--amber);font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.07em;">★ Local Info</td></tr>`;
  h += row('Languages',  aiA.localInfo?.localLanguages, aiB.localInfo?.localLanguages);
  h += row('Famous For', aiA.localInfo?.famousFor,      aiB.localInfo?.famousFor);
  h += row('Strategic',  aiA.currentRelevance?.strategicImportance, aiB.currentRelevance?.strategicImportance);
  h += row('Environment',aiA.currentRelevance?.environmentalIssues, aiB.currentRelevance?.environmentalIssues);

  h += '</tbody></table>';

  const wrap = document.getElementById('compareResult');
  wrap.innerHTML = h;
  wrap.style.display = 'block';
  toast('✓ Comparison ready!','ok');

  // ── Inject Side-by-Side Charts ──
  requestAnimationFrame(() => {
    try {
      const chartSection = document.createElement('div');
      chartSection.style.cssText = 'margin-top:16px;padding:0 2px;';
      const chartTitle = document.createElement('div');
      chartTitle.style.cssText = 'font-size:13px;font-weight:800;color:var(--text);margin-bottom:4px;';
      chartTitle.innerHTML = '📊 Visual Comparison';
      const chartSub = document.createElement('div');
      chartSub.style.cssText = 'font-size:10px;color:var(--muted);margin-bottom:10px;';
      chartSub.textContent = 'Charts show relative prominence from AI data. Not official statistics.';
      chartSection.appendChild(chartTitle);
      chartSection.appendChild(chartSub);
      renderComparisonCharts(chartSection, aiA, aiB, nameA, nameB);
      wrap.appendChild(chartSection);
    } catch(chartErr) {
      console.warn('[GeoMind Comparison Charts]', chartErr.message);
    }
  });

  // Save to Firebase comparison history (fire-and-forget, never blocks UI)
  saveComparisonHistory(nameA, nameB, aiA, aiB, h).catch(e =>
    console.warn('[saveComparisonHistory]', e.message)
  );
}

/* ══════════════════════════════════════════════════════
   COMPARISON HISTORY
   Firebase path: comparisonHistory/{uid}/{pushId}
   ══════════════════════════════════════════════════════ */

async function saveComparisonHistory(nameA, nameB, aiA, aiB, resultHtml) {
  if (!currentUser) return;
  const record = {
    locationA:   { name: nameA, country: aiA.locationId?.country||'', state: aiA.locationId?.state||'', lat: compareA?.lat||0, lon: compareA?.lon||0 },
    locationB:   { name: nameB, country: aiB.locationId?.country||'', state: aiB.locationId?.state||'', lat: compareB?.lat||0, lon: compareB?.lon||0 },
    resultHtml:  resultHtml,   // full rendered table — no API call needed to reopen
    aiA:         JSON.stringify(aiA),
    aiB:         JSON.stringify(aiB),
    timestamp:   new Date().toISOString()
  };
  await db.ref('comparisonHistory/' + currentUser.uid).push(record);
  console.log('[saveComparisonHistory] saved:', nameA, 'vs', nameB);
}

async function loadComparisonHistory() {
  const container = document.getElementById('historyCompareContent');
  if (!container) return;
  container.innerHTML = '<div class="hempty"><div class="spin-lg" style="margin:0 auto 12px"></div><p>Loading comparison history…</p></div>';
  try {
    const snap = await db.ref('comparisonHistory/' + currentUser.uid).once('value');
    if (!snap.exists() || !snap.val()) {
      container.innerHTML = '<div class="hempty"><div style="font-size:44px;opacity:0.2">⚖</div><p>No comparisons yet. Go to Compare tab, select two locations, and run a comparison.</p></div>';
      return;
    }
    const entries = Object.entries(snap.val()).sort((a,b) =>
      (b[1].timestamp||'').localeCompare(a[1].timestamp||'')
    );
    let html = `<button class="cmp-clr-btn" onclick="clearComparisonHistory()">🗑 Clear Comparison History</button>
      <div class="cmp-hist-grid">`;
    entries.forEach(([id, rec]) => {
      const d  = new Date(rec.timestamp);
      const ds = isNaN(d) ? rec.timestamp :
        d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' ' +
        d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
      const flagA = getFlagEmoji(rec.locationA?.country||'');
      const flagB = getFlagEmoji(rec.locationB?.country||'');
      const enc   = encodeURIComponent(id);
      html += `<div class="cmp-hist-item" onclick="openCompareHistRecord('${enc}')">
        <div class="cmp-hist-vs">
          <div class="cmp-hist-loc">${flagA} ${rec.locationA?.name||'Location A'}</div>
          <div class="cmp-hist-sep">VS</div>
          <div class="cmp-hist-loc" style="text-align:right">${rec.locationB?.name||'Location B'} ${flagB}</div>
        </div>
        <div class="cmp-hist-meta">
          ${[rec.locationA?.state, rec.locationA?.country].filter(Boolean).join(', ')}
          &nbsp;↔&nbsp;
          ${[rec.locationB?.state, rec.locationB?.country].filter(Boolean).join(', ')}
        </div>
        <div class="cmp-hist-footer">
          <div class="cmp-hist-ts">${ds}</div>
          <button class="cmp-hist-btn" onclick="event.stopPropagation();openCompareHistRecord('${enc}')">📊 View Result</button>
        </div>
      </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = `<div class="ebox">Failed to load: ${e.message}</div>`;
  }
}

async function openCompareHistRecord(encId) {
  const id = decodeURIComponent(encId);
  try {
    const snap = await db.ref('comparisonHistory/' + currentUser.uid + '/' + id).once('value');
    if (!snap.exists()) { toast('Record not found', 'err'); return; }
    const rec   = snap.val();
    const nameA = (rec.locationA && rec.locationA.name) || 'Location A';
    const nameB = (rec.locationB && rec.locationB.name) || 'Location B';

    const modal = document.getElementById('compareHistModal');
    const body  = document.getElementById('chmBody');
    const title = document.getElementById('chmTitle');

    title.textContent = '⚖ ' + nameA + ' vs ' + nameB;

    // Show table HTML
    body.innerHTML = rec.resultHtml || '<div class="hempty">No result data stored.</div>';

    // Re-render charts from saved AI data (they were not stored in resultHtml)
    if (rec.aiA && rec.aiB) {
      requestAnimationFrame(function() {
        try {
          var aiA = JSON.parse(rec.aiA);
          var aiB = JSON.parse(rec.aiB);
          var chartWrap = document.createElement('div');
          chartWrap.style.cssText = 'margin-top:16px;padding:0 2px;';
          var chartTitle = document.createElement('div');
          chartTitle.style.cssText = 'font-size:13px;font-weight:800;color:var(--text);margin-bottom:4px;';
          chartTitle.textContent = '📊 Visual Comparison';
          var chartSub = document.createElement('div');
          chartSub.style.cssText = 'font-size:10px;color:var(--muted);margin-bottom:10px;';
          chartSub.textContent = 'Charts based on saved AI data.';
          chartWrap.appendChild(chartTitle);
          chartWrap.appendChild(chartSub);
          if (typeof renderComparisonCharts === 'function') {
            renderComparisonCharts(chartWrap, aiA, aiB, nameA, nameB);
          }
          body.appendChild(chartWrap);
        } catch(chartErr) {
          console.warn('[cmpHistCharts]', chartErr);
        }
      });
    }

    modal.style.display = 'flex';
  } catch(e) {
    toast('Failed to open: ' + e.message, 'err');
  }
}

function closeCompareHistModal() {
  const modal = document.getElementById('compareHistModal');
  if (modal) modal.style.display = 'none';
}

async function clearComparisonHistory() {
  if (!confirm('Delete all your comparison history?')) return;
  await db.ref('comparisonHistory/' + currentUser.uid).remove();
  toast('Comparison history cleared', 'ok');
  loadComparisonHistory();
}

/* ── History page tab switcher ────────────────────────── */
let _histTab = 'reports'; // track active tab
function switchHistTab(tab) {
  _histTab = tab;
  const repContent  = document.getElementById('historyPageContent');
  const cmpContent  = document.getElementById('historyCompareContent');
  const chatContent = document.getElementById('historyChatContent');
  const repTab      = document.getElementById('htab-reports');
  const cmpTab      = document.getElementById('htab-compare');
  const chatTab     = document.getElementById('htab-chat');

  // Hide ALL panels with inline style (overrides any CSS)
  [repContent, cmpContent, chatContent].forEach(el => {
    if (el) el.style.display = 'none';
  });
  [repTab, cmpTab, chatTab].forEach(el => {
    if (el) el.classList.remove('active');
  });

  // Show selected panel — must use 'block' (not '') so CSS won't override
  if (tab === 'reports') {
    if (repContent)  { repContent.style.display  = 'block'; }
    if (repTab)      { repTab.classList.add('active'); }
    renderHistoryInto(repContent, false);
  } else if (tab === 'compare') {
    if (cmpContent)  { cmpContent.style.display  = 'block'; }
    if (cmpTab)      { cmpTab.classList.add('active'); }
    loadComparisonHistory();
  } else if (tab === 'chat') {
    if (chatContent) { chatContent.style.display = 'block'; }
    if (chatTab)     { chatTab.classList.add('active'); }
    loadChatHistory();
  }

  console.log('[GeoMind History] Switched to tab:', tab);
}

/* ══════════════════════════════════════════════════════
   CHAT HISTORY
   Firebase path: chatHistory/{uid}/{pushId}
   ══════════════════════════════════════════════════════ */

async function loadChatHistory() {
  const container = document.getElementById('historyChatContent');
  if (!container) return;
  container.innerHTML = '<div class="hempty"><div class="spin-lg" style="margin:0 auto 12px"></div><p>Loading chat history…</p></div>';
  try {
    const snap = await db.ref('chatHistory/' + currentUser.uid).once('value');
    if (!snap.exists() || !snap.val()) {
      container.innerHTML = '<div class="hempty"><div style="font-size:44px;opacity:0.2">💬</div><p>No chat history yet. Ask follow-up questions on a report to start a conversation.</p></div>';
      return;
    }

    // Group chats by location
    const entries = Object.entries(snap.val()).sort((a, b) =>
      (b[1].timestamp || '').localeCompare(a[1].timestamp || '')
    );

    // Group by location name
    const groups = {};
    entries.forEach(([id, rec]) => {
      const key = rec.location || rec.lat?.toFixed(2) + ',' + rec.lon?.toFixed(2) || 'Unknown';
      if (!groups[key]) groups[key] = { location: rec.location, country: rec.country, lat: rec.lat, lon: rec.lon, msgs: [] };
      groups[key].msgs.push({ id, ...rec });
    });

    let html = `<button class="cmp-clr-btn" onclick="clearChatHistory()">🗑 Clear Chat History</button>
      <div class="cmp-hist-grid">`;

    Object.entries(groups).forEach(([locKey, grp]) => {
      const latest = grp.msgs[0];
      const d  = new Date(latest.timestamp);
      const ds = isNaN(d) ? latest.timestamp :
        d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) + ' ' +
        d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
      const encKey = encodeURIComponent(locKey);
      html += `<div class="cmp-hist-item" onclick="openChatHistGroup('${encKey}')">
        <div class="cmp-hist-vs" style="flex-direction:column;align-items:flex-start;gap:4px">
          <div style="font-size:13px;font-weight:700;color:var(--text)">💬 ${grp.location || locKey}</div>
          ${grp.country ? `<div style="font-size:10px;color:var(--muted)">${grp.country}</div>` : ''}
        </div>
        <div class="cmp-hist-meta">${grp.msgs.length} message${grp.msgs.length > 1 ? 's' : ''}</div>
        <div class="cmp-hist-meta" style="font-style:italic;color:var(--dim)">"${(latest.question || '').substring(0, 60)}${latest.question?.length > 60 ? '…' : ''}"</div>
        <div class="cmp-hist-footer">
          <div class="cmp-hist-ts">${ds}</div>
          <button class="cmp-hist-btn" onclick="event.stopPropagation();openChatHistGroup('${encKey}')">💬 View</button>
        </div>
      </div>`;
    });
    html += '</div>';
    container.innerHTML = html;

    // Store groups for modal use
    window._chatHistGroups = groups;
  } catch(e) {
    container.innerHTML = `<div class="ebox">Failed to load: ${e.message}</div>`;
  }
}

function openChatHistGroup(encKey) {
  const locKey = decodeURIComponent(encKey);
  const grp    = window._chatHistGroups?.[locKey];
  if (!grp) { toast('Chat history not loaded yet.', 'err'); return; }

  const modal = document.getElementById('compareHistModal');
  const body  = document.getElementById('chmBody');
  const title = document.getElementById('chmTitle');

  title.textContent = `💬 ${grp.location || locKey}`;

  let html = `<div style="font-size:11px;color:var(--muted);margin-bottom:12px">${grp.msgs.length} messages · ${grp.country || ''}</div>`;
  grp.msgs.slice().reverse().forEach(msg => {
    const d  = new Date(msg.timestamp);
    const ds = isNaN(d) ? '' : d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) + ' ' + d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    html += `<div style="margin-bottom:14px;padding:10px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;">
      <div class="cmq" style="margin-bottom:6px">💬 ${msg.question}</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6">${msg.answer}</div>
      <div style="font-size:10px;color:var(--dim);margin-top:6px">${ds}</div>
    </div>`;
  });

  body.innerHTML = html;
  modal.style.display = 'flex';
}

async function clearChatHistory() {
  if (!confirm('Delete all your chat history?')) return;
  await db.ref('chatHistory/' + currentUser.uid).remove();
  toast('Chat history cleared', 'ok');
  loadChatHistory();
}



/* ── REPORT PREVIEW MODAL ─────────────────────────── */
let _previewRec = null;

function previewHistReport(enc) {
  try {
    const rec = JSON.parse(decodeURIComponent(enc));
    if (!rec || !rec.aiResponse) { toast('No report data saved for this entry','err'); return; }
    const ai = JSON.parse(rec.aiResponse);
    _previewRec = rec;
    const name = rec.selectedPlace || 'Unknown';
    const loc = [rec.state, rec.country].filter(Boolean).join(', ');
    document.getElementById('rmodalTitle').textContent = `📊 ${name}${loc ? ' · ' + loc : ''}`;

    let html = '';

    // Helper: render a data section
    const section = (icon, title, obj) => {
      if (!obj || !Object.keys(obj).length) return '';
      let s = `<div class="rp-section"><h4>${icon} ${title}</h4>`;
      Object.entries(obj).forEach(([k, v]) => {
        const isArr = Array.isArray(v);
        s += `<div class="rp-row"><div class="rp-key">${k}</div><div class="rp-val">`;
        if (isArr && v.length) {
          s += `<div class="rp-tags">${v.map(x => `<span class="rp-tag">${x}</span>`).join('')}</div>`;
        } else {
          s += `${v || '—'}`;
        }
        s += `</div></div>`;
      });
      return s + '</div>';
    };

    html += section('📍', 'Location', ai.locationId);
    html += section('🌏', 'Geography', ai.geography);
    html += section('🌾', 'Agriculture', ai.agriculture);
    html += section('📜', 'History', ai.history);
    html += section('💰', 'Economy', ai.economy);
    html += section('🔭', 'Current Relevance', ai.currentRelevance);
    html += section('★', 'Local Info', ai.localInfo);

    // Timeline
    if (ai.timeline && ai.timeline.length) {
      html += `<div class="rp-section"><h4>⏳ Historical Timeline</h4>`;
      ai.timeline.forEach(t => {
        html += `<div class="rp-tl-item"><div class="rp-tl-year">${t.year}</div><div class="rp-val">${t.event}</div></div>`;
      });
      html += '</div>';
    }

    // Exam Focus
    if (ai.examFocus && ai.examFocus.length) {
      html += `<div class="rp-section"><h4>⚡ Exam Focus Points</h4>`;
      ai.examFocus.forEach(f => { html += `<div class="rp-ep">${f}</div>`; });
      html += '</div>';
    }

    // Charts container placeholder (injected after render)
    html += `<div id="histChartContainer" style="margin-top:10px"></div>`;

    // Download bar inside modal
    html += `<div class="rp-dl-bar">
      <button class="dl-btn dl-txt"  onclick="previewDownload('txt')">⬇ .TXT</button>
      <button class="dl-btn dl-json" onclick="previewDownload('json')">⬇ .JSON</button>
      <button class="dl-btn dl-pdf"  onclick="previewDownload('pdf')">⬇ .PDF</button>
      <button class="dl-btn dl-docx" onclick="previewDownload('docx')">⬇ .DOCX</button>
    </div>`;

    document.getElementById('rmodalBody').innerHTML = html;

    // ── Inject charts after DOM paint (same as live report) ──
    requestAnimationFrame(() => {
      const chartContainer = document.getElementById('histChartContainer');
      if (chartContainer && typeof renderReportCharts === 'function') {
        try { renderReportCharts(chartContainer, ai); } catch(e) { console.warn('Chart render:', e); }
      }
    });

    const rm = document.getElementById('reportModal');
    rm.style.display = '';
    rm.classList.add('open');
  } catch(e) { toast('Preview failed: ' + e.message, 'err'); }
}


function closeReportModal() {
  const rm = document.getElementById('reportModal');
  rm.classList.remove('open');
  setTimeout(() => { if (!rm.classList.contains('open')) rm.style.display = 'none'; }, 50);
}

function reportModalGoMap() {
  if (!_previewRec) return;
  closeReportModal();
  reloadHist(encodeURIComponent(JSON.stringify(_previewRec)));
}

function previewDownload(fmt) {
  /* Load the record into curData then call normal downloadReport */
  if (!_previewRec) return;
  try {
    const ai = JSON.parse(_previewRec.aiResponse);
    curData = {
      geo: { address: { country: _previewRec.country, state: _previewRec.state, city: _previewRec.selectedPlace } },
      lat: _previewRec.latitude,
      lon: _previewRec.longitude,
      ai
    };
    downloadReport(fmt);
  } catch(e) { toast('Download failed: ' + e.message, 'err'); }
}

/* ── PLANS PAGE ──────────────────────────────────────── */
function renderPlansPage() { renderPlansInto(document.getElementById('plansPageContent')); }
function renderPricingTab() { renderPlansInto(document.getElementById('pricingContent')); }
function renderPlansInto(wrap) {
  const currentPlan = userProfile.plan || 'free_trial';
  let html = `<div class="pricing-title">🌟 GeoMind Plans</div>
    <div class="pricing-sub">From free trial to unlimited power — choose the plan that fits your exam prep goals.<br>Paid plans include admin-managed API keys · No setup needed · Activate instantly.</div>
    <div class="plans-grid">`;
  const planOrder = ['free_trial', 'starter', 'standard', 'premium', 'payperuse'];
  planOrder.forEach(key => {
    const P = PLANS[key]; if (!P) return;
    const feats      = PLAN_FEATURES[key] || [];
    const isCur      = key === currentPlan;
    const isPopular  = key === 'standard';
    const isTrial    = key === 'free_trial';
    const alreadyUsedTrial = userProfile.trialUsed || userProfile.trialStartDate;

    let btnClick, btnLabel, btnDisabled = '';
    if (key === 'free_trial') {
      btnClick = `goPage('settings')`;
      btnLabel = '⚙ Add API Key';
    } else if (key === 'free_trial') {
      if (isCur) { btnClick = ''; btnLabel = '✓ Trial Active'; btnDisabled = 'disabled'; }
      else if (alreadyUsedTrial) { btnClick = ''; btnLabel = 'Trial Used'; btnDisabled = 'disabled'; }
      else { btnClick = `showTrialPopup()`; btnLabel = '🚀 Start Free Trial'; }
    } else {
      btnClick  = isCur ? '' : `openPlanModal('${key}')`;
      btnLabel  = isCur ? '✓ Current Plan' : `Purchase ${P.name}`;
      btnDisabled = isCur ? 'disabled' : '';
    }

    // badge color mapping
    const badgeKey = key === 'free_trial' ? 'free_trial' :
                     key === 'starter'    ? 'basic'      :
                     key === 'payperuse'  ? 'custom'     : key;

    html += `<div class="plan-card ${key}${isCur?' current-plan':''}${isPopular?' popular-plan':''}${isTrial?' trial-plan':''}">
      ${isPopular ? '<div class="popular-badge">⭐ MOST POPULAR · BEST VALUE</div>' : ''}
      ${isTrial   ? '<div class="popular-badge" style="background:linear-gradient(135deg,#00c8a0,#3a8eff);letter-spacing:0.04em;">🌟 BEST WAY TO START</div>' : ''}
      <div class="plan-header">
        <div style="flex:1">
          <div class="plan-name pn-${badgeKey}">${P.emoji} ${P.name}</div>
          ${P.tagline ? `<div style="font-size:9px;color:var(--muted);margin-top:3px;line-height:1.4;font-style:italic">${P.tagline}</div>` : ''}
          ${isCur ? '<span class="plan-active-badge" style="margin-top:5px;display:inline-block">✓ ACTIVE</span>' : ''}
        </div>
        <div class="plan-price" style="text-align:right;flex-shrink:0;margin-left:8px">
          <div class="amt">${key==='payperuse'?'₹15':key==='free_trial'?'₹0':P.price.replace('/mo','')}</div>
          <div class="per">${key==='payperuse'?'per session':key==='free_trial'?'14 days free':'per month'}</div>
        </div>
      </div>
      <div class="plan-features" style="margin-top:10px">
        ${feats.map(f => `<div class="pf ${f.includes('report')||f.includes('message')||f.includes('Dual')||f.includes('Priority')||f.includes('Fastest')||f.includes('PDF')?'highlight':''}"><span class="pf-check">✓</span>${f}</div>`).join('')}
      </div>
      <button class="plan-btn pb-${badgeKey}-btn" onclick="${btnClick}" ${btnDisabled}>
        ${btnLabel}
      </button>
    </div>`;
  });
  html+=`</div>
  <div class="pay-box">
    <h3>💳 How to Purchase a Plan</h3>
    <div class="pay-step"><div class="pay-num">1</div><div class="pay-text">Select a plan above and note the price.</div></div>
    <div class="pay-step"><div class="pay-num">2</div><div class="pay-text">Scan the QR code or send payment to:<br>
      <div class="pay-number" style="font-size:13px;margin:4px 0;">dhamijamonu79@oksbi</div>
      <div style="text-align:center;margin:8px 0;"><img src="data:image/jpeg;base64,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AAAAAAAAAAAAUUAUAQw0A8EwIQAAQgg4gwAAAAIAUAAQgUQw0AAXAAAAAAAAAAAAAAAAAAUQAAAUw0A8UoAwgAwwIgAgAoII8YIgAQwwA0UAAXAAAAAAAAAAAAAAAAAAQAAAQAUUAAwoAAgAAAAAAgAAgoQUAEoAAAAUUAAXAAAAAAAAAAAAAAAAAAUwwAAAQ00wEQoQg4wwwoAAwoAwwg4gQQwAAAgAAXAAAAAAAAAAAAAAAAAAUEMkIUEcgQcwgQgAEEEQooMQsAAUw0cMAwwMEAAXAAAAAAAAAAAAAAAAAAUcAgAUUQ0A8AwwAAIAAAQkg4AAwQQgUAU4AEUAAXAAAAAAAAAAAAAAAAAAA8kMIUEscEwEMAEYAAJECQ0oE4kcgEcUs44gcAAXAAAAAAAAAAAAAAAAAAEgEU0YAMMsAMMoMICitbMIkIQggAkIAIAgAUMAAXAAAAAAAAAAAAAAAAAAAEMQMccIA0UMAAEAJCnw5hUMMAIAAAEMAAAAUAAXAAAAAAAAAAAAAAAAAAAQcMIUQcYAQgAAMoGS8/7AMsIkgEMMAAMMIAUAAXAAAAAAAAAAAAAAAAAAEMMMEcMYEMIAAAEMASChAEMskMMYEIYMIAAIUAAXAAAAAAAAAAAAAAAAAAUEUQAQAMIEwAAAAsoIAAAIEgIMMIkMEAAAEcUAAXAAAAAAAAAAAAAAAAAAEcQMIAYEA4MEkMIAAgEsgMosIoIAUEMAAEAAUAAXAAAAAAAAAAAAAAAAAAUUEAAUQUEMAIAAAAAAAAIAIIAAsMAAUEEUAUUAAXAAAAAAAAAAAAAAAAAAUAAEAAUQA4MAAAAAAkMAEEAoAE8goIUIAEEcUAAXAAAAAAAAAAAAAAAAAAUUAUIAEAAIMgIEIAIEMgkgAsIoAA0AAIEQIAEAAXAAAAAAAAAAAAAAAAAAUUEMYQcEAwUAIoAAAgAoEMoogAIAUU8AUAEAQAAXAAAAAAAAAAAAAAAAAAUUAAAUUQYAAEIoAAIAAoEMIoIAAMUc8AQAAAEAAXAAAAAAAAAAAAAAAAAAUUAAEUAUEE8EAgIAIIIoAIgggAQgsIAAAAAAQAAXAAAAAAAAAAAAAAAAAAEMMMMMMIEI8AMIEMggoAIoMgAoEI8AIAUUAEMAAXAAAAAAAAAAAAAAAAAAUEAAAAAUEMwAAsAEEIosogogAoUo0QwAUYAUQAAXAAAAAAAAAAAAAAAAAAUUEMMMUUA0MEkAAokgMkMMMMAAoAUMMIAQIEIAAXAAAAAAAAAAAAAAAAAAUUAAAUUUAcwoQwwsMM4A4wwoEA4w0IAAAAAUUAAXAAAAAAAAAAAAAAAAAAUUAAAUUUA8EEoAMsMAAAMAAEMAAEAMIUMMMMUAAXAAAAAAAAAAAAAAAAAAUUAwwwUUQ08wgAIoAYAAQoAAAAUYgAQUAAAkUAAXAAAAAAAAAAAAAAAAAAUU8888sUQUAAgAgogcoAcAgAIc4ogUIAU888UAAXAAAAAAAAAAAAAAAAAAAAAAAAAQAQAAAAAgAAgAAAAAgAAAgAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAUEMYQogEEMIMEcgAMAEAEA8kIIMsIQUAAAAAXAAAAAAAAAAAAAAAAAAAAAAcoAAkoUUcEQMQ0Q0gEoAIAccgAscExAAAAAXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAgAAAAAAAAAAXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAxDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDRgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgIIIMgIAIMAEMYxIEIMME0F1AIAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAABrJbhBPJF5vTFrxbdJz1pVV7VRvh/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAgAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8QAAv/aAAwDAQACAAMAAAAQ/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wDD/PdP/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wDzvTj/AMU8U33333//AKvqNN9/8/siJO8//wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD9+zNT93y6o5S66aqr+r8oyJKZar5aqrb/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A9Lw//wD/AMQUG6M0QCG/mWs0Um2Uk8QqiK//AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APyPP8v/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8AvY//AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/ALX/AH//AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AC+++++++++++++++++++++++++++++++++++++0/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD9nPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPLt/8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/ANvPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPO//wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APLMMMMMMMPPPPPPPPPPPPPONPPPPGIOMMMMMMIPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPLDDDDDKPKPPPPHPPFPPNBFPHPPPPKFDDDDHKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPLDDHPKOPPHPPJNFFPPPDPPPPJCFKFODDCPKPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPPPPPKKIDLFPPFLPLPNJDNJPLFPKFKPPKPKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPPPPPPKKDPHFHPPPHPPHPPPPLDGBCFKPPKPKPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPLDDHPKKPLPPPDDDHDDDHPLDHFONKFLDDDPKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPDDDDHKKENLNJJFJJLHBJNPDLNINKFDDDDDKPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPLPPPPPPLKAFHPHPHHHHPHHNHPHBGBPPPPPPPPPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPLLPPPPKPDLDDHPJFJDDDHHPHPBJPONPPPKPPPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPLPPLDDKPPLFBDPJPPHNBDPDHFHPPGLGPKPPPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPPPPPDGKEFHNLHPDPPJFLNPPPFHPPLKDKODCPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPLPLDDLAFLPLHPBDHHPPHHHHBMNPPPDDPHKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APLDHPODLOCPLPPPNPPPHPJHPHBHLOBCFLPPKPKPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPPKPLHPDBDNPPBDDDFFPBFFLDGFPCLCPKLDPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPOLLKOCDPODPHPPDCPBOKNBPLFNGPPAOPPLCCPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPONPDLKLLHKPPDDPOFPPPDMPDNPLDLDPPLFPKKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APLPLOPKLLPJOPPPPAPPPk/LNHFHPKNHOLPPPPLPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPLKHKJLABIOMAHCPOBJgzNaHPHFHKPPICKCLMPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPPOPOOOOBFONPPFL1zmuv7PPPNNPPLOPPKPKPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPLNPPKKPNPEPFPMFPXNXRfIGPPFOPPMOPPLPKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APOMNNKIMIOMOPFPOGPLbPPPEOOMMIGEMJMPONKPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPOMPOMNPPKOMPEMNDINPPOEHGFPPKGNKMKPKOKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPJPMMOMPPAMMGMFPPLIIHOHMPNPPOMMPKPPOKPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPOOPKLJMMMMNPPPPPOMMFPMPFPEMNPPOKKPPKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPOPPKPOKKBPPPPPPPFPNNOHFFNECENPLPPKPLPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPOLOPMJNPMHPPPEPPNFFMGGNFLHOLPMKOPNPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPOPOMOMPBFMPFFPOFPFHPFPOMHPPKFKKPLMJPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPPKKLONOPOHFFPFPPFOMPPNPPOMIEKKPPPOPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APOMPMIKMJPJPOMHGMPMNHHPGPMPMAFMMNONPOIPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPMMMMMMMKMPMMPMMFHPPPFOFHPHIFPMKKKPOMPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPOMMMMNKOJOPOEHNENMOGHEPPMOCHLFKKIIOJPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPPPOPKKCPOHNPFGHNGFPPPPPFPPNPLPKOOOPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPPPPPPKKIDEJDDEMMFHJDDHOPJDDPPPPPKPKPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPPPPPKKAPGFPOEMHPPOPPEMHPNLHOKMMMJKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPLPPOPKPINPFPHFPHPPPNPPPPGFPPOPOPPPKPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPKPPPPKKLJLHDDPFDHNPPBPDFHFGDCNPOPPLKPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APLDDDDDDDLLLDPPDHPDHPLHLHDDDDPPDDDDDDHPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPOOJBLFOOKEOPMMOOPMOMMNAMJHPHMPNPPPPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8APPPPOPBOPFELKPMGAMHFOINMEIPLMJOAJFDfPPPPPf8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/APPPPPPPPPPPPPPPPPPLPPPPPPPPPPDHPPPPPPPPPPPf/wD/AP8A/wD/AP8A/wD/AP8A/wD/APe8888888888888888888888888888888888888888v/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8Aa088888888888888888888888888888888888888+/8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8AzvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvrP/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD9/wD/AO89f+++8/8As2TfvPPevdQT/fvv/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A+y4zLTypyzBJb56hpjxrzyhD5jhphZf/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wC//wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A+/8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A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" alt="UPI QR" style="width:140px;height:140px;border-radius:10px;border:2px solid var(--border2);"/></div>
    </div></div>
    <div class="pay-step"><div class="pay-num">3</div><div class="pay-text">Fill the <strong><a href="https://docs.google.com/forms/d/e/1FAIpQLSdnJDBF-I2v42KemUIkIlAt9llKqulPVXw0C5e88Ke6S5ZsRA/viewform" target="_blank" style="color:var(--cyan)">Google Form ↗</a></strong> with your name, email, phone, plan selected &amp; payment screenshot.</div></div>
    <div class="pay-step"><div class="pay-num">4</div><div class="pay-text">Admin reviews and activates your plan within <strong>7 days</strong>. You'll receive confirmation on your registered email.</div></div>
  </div>`;
  wrap.innerHTML=html;
}
function openPlanModal(planKey) {
  const P=PLANS[planKey];
  document.getElementById('modalTitle').textContent=`Purchase ${P.name} Plan`;
  document.getElementById('modalBody').innerHTML=`Upgrade to <strong>${P.name}</strong> for ${P.price}. Send payment then fill the Google Form.`;
  const modal = document.getElementById('planModal');
  modal.style.display = '';  // remove inline, let CSS class control
  modal.classList.add('open');
}
function closePlanModal() {
  const modal = document.getElementById('planModal');
  modal.classList.remove('open');
  setTimeout(() => { if (!modal.classList.contains('open')) modal.style.display = 'none'; }, 50);
}

/* ── PROFILE PAGE ────────────────────────────────────── */
function updateProfilePage() {
  const name=userProfile.name||currentUser?.displayName||currentUser?.email?.split('@')[0]||'?';
  const email=userProfile.email||currentUser?.email||'';
  const avEl = document.getElementById('profileAvBig');
  if (avEl) {
    if (userProfile.photoURL) {
      avEl.innerHTML = `<img src="${userProfile.photoURL}" alt="Avatar" class="profile-av-img" onerror="this.parentElement.textContent='${name.charAt(0).toUpperCase()}'"/>`;
    } else {
      avEl.textContent = name.charAt(0).toUpperCase();
    }
  }
  document.getElementById('profileName').textContent=name;
  document.getElementById('profileEmail').textContent=email;
  document.getElementById('profilePlanVal').textContent=PLANS[userProfile.plan||'free_trial']?.name||'Free';
  document.getElementById('pfName').value=name;
  document.getElementById('pfEmail').value=email;
  document.getElementById('pfPhone').value=userProfile.phone||'';
}
async function saveProfile() {
  if (!currentUser) return;
  const name=document.getElementById('pfName').value.trim();
  const phone=document.getElementById('pfPhone').value.trim();
  if (!name) { toast('Name cannot be empty','err'); return; }
  userProfile.name=name; userProfile.phone=phone;
  try {
    await db.ref('users/'+currentUser.uid).update({name,phone});
    await currentUser.updateProfile({displayName:name});
    updateNavUI(); updateProfilePage();
    toast('✓ Profile saved!','ok');
  } catch(e) { toast('Failed: '+e.message,'err'); }
}

/* ── SECTION 8: Profile Photo Upload ── */
async function uploadProfilePhoto(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (!file.type.startsWith('image/')) { toast('Please select an image file', 'err'); return; }
  if (file.size > 8 * 1024 * 1024) { toast('Photo must be under 8 MB', 'err'); return; }

  const progWrap = document.getElementById('profileUploadProgress');
  const progFill = document.getElementById('profileUploadFill');
  if (progWrap) { progWrap.style.display = 'block'; }
  if (progFill) { progFill.style.width = '10%'; }
  toast('Processing photo…', 'warn');

  try {
    // ── Step 1: Read file into canvas and compress/resize ──
    const dataUrl = await new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = function() {
        URL.revokeObjectURL(url);
        const MAX = 256; // max dimension px
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else       { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = url;
    });

    if (progFill) progFill.style.width = '60%';

    // ── Step 2: Try Firebase Storage first ──
    let finalUrl = null;
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      try {
        const storage = firebase.storage();
        const ext     = 'jpg';
        const ref     = storage.ref('profile_photos/' + currentUser.uid + '.' + ext);
        // Convert base64 data URL to blob
        const res  = await fetch(dataUrl);
        const blob = await res.blob();
        const snap = await ref.put(blob, { contentType: 'image/jpeg' });
        finalUrl   = await snap.ref.getDownloadURL();
        console.log('[Profile] Uploaded to Firebase Storage:', finalUrl);
      } catch(storageErr) {
        console.warn('[Profile] Firebase Storage failed, falling back to base64:', storageErr.message);
        finalUrl = null;
      }
    }

    // ── Step 3: Fallback — save compressed base64 to Realtime DB ──
    if (!finalUrl) {
      finalUrl = dataUrl; // compressed ≈ 10-30 KB
    }

    if (progFill) progFill.style.width = '90%';

    await _applyProfilePhoto(finalUrl);

    if (progFill) progFill.style.width = '100%';
    setTimeout(function() {
      if (progWrap) progWrap.style.display = 'none';
      if (progFill) progFill.style.width = '0%';
    }, 600);

  } catch(e) {
    console.error('[Profile upload]', e);
    toast('Upload failed: ' + e.message, 'err');
    if (progWrap) progWrap.style.display = 'none';
  }
}

async function _applyProfilePhoto(url) {
  try {
    userProfile.photoURL = url;
    await db.ref('users/' + currentUser.uid).update({ photoURL: url });
    // Update avatar display
    const avEl = document.getElementById('profileAvBig');
    if (avEl) {
      avEl.innerHTML = `<img src="${url}" alt="Avatar" class="profile-av-img" onerror="this.parentElement.textContent='${(userProfile.name||'?').charAt(0).toUpperCase()}'"/>`;
    }
    // Update nav avatar if it shows photo
    const navAv = document.getElementById('userAv');
    if (navAv) navAv.style.backgroundImage = `url(${url})`;
    toast('✓ Profile photo updated!', 'ok');
  } catch(e) { toast('Failed to save photo URL: ' + e.message, 'err'); }
}


/* ── DELETE ACCOUNT ─────────────────────────────────────── */
async function deleteAccount() {
  // Step 1: Confirmation popup
  const confirmed = await new Promise(resolve => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(12px);z-index:99995;display:flex;align-items:center;justify-content:center;padding:20px;';
    d.innerHTML = `<div style="background:#0d1828;border:1px solid rgba(255,107,122,0.3);border-radius:18px;padding:28px 22px;max-width:340px;width:100%;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,0.8);">
      <div style="font-size:36px;margin-bottom:10px">⚠️</div>
      <div style="font-size:18px;font-weight:900;color:#ff6b7a;margin-bottom:8px">Delete Account?</div>
      <div style="font-size:12px;color:#8899bb;line-height:1.7;margin-bottom:20px">
        This will <strong style="color:#ff6b7a">permanently delete</strong> your account, all reports, chat history, and saved data.<br>
        <strong>This cannot be undone.</strong>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button id="_delConfirm" style="flex:1;padding:12px;background:linear-gradient(135deg,#ff4444,#cc0000);border:none;border-radius:10px;color:#fff;font-weight:900;font-size:13px;cursor:pointer;">Yes, Delete Everything</button>
        <button id="_delCancel" style="flex:1;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#8899bb;font-size:13px;cursor:pointer;">Cancel</button>
      </div>
    </div>`;
    document.body.appendChild(d);
    d.querySelector('#_delConfirm').onclick = () => { document.body.removeChild(d); resolve(true); };
    d.querySelector('#_delCancel').onclick  = () => { document.body.removeChild(d); resolve(false); };
  });
  if (!confirmed) return;

  toast('Deleting account…', 'warn');
  try {
    const uid = currentUser.uid;
    // Delete all user data from Realtime DB
    await db.ref('users/' + uid).remove();
    await db.ref('chatHistory/' + uid).remove();
    await db.ref('comparisonHistory/' + uid).remove();
    // Delete Firebase Auth account
    await currentUser.delete();
    toast('Account deleted. Goodbye!', 'ok');
    setTimeout(() => window.location.reload(), 1500);
  } catch(e) {
    if (e.code === 'auth/requires-recent-login') {
      toast('Please log out and log back in, then try deleting again.', 'err');
    } else {
      toast('Delete failed: ' + e.message, 'err');
    }
  }
}

/* ── NAV + USAGE ─────────────────────────────────────── */
function updateNavUI() {
  const plan     = userProfile.plan || null;
  const P        = PLANS[plan] || PLANS.free_trial;
  const planUsed = userProfile.planUsed || 0;
  const chatUsed = userProfile.planChatUsed || 0;
  const name     = currentUser?.displayName || currentUser?.email?.split('@')[0] || '?';
  document.getElementById('userNm').textContent = name;
  document.getElementById('userAv').textContent = name.charAt(0).toUpperCase();
  const badge = document.getElementById('planBadge');
  // Use friendly badge label
  const badgeLabel = plan === 'free_trial' ? 'TRIAL' : plan.toUpperCase();
  badge.textContent = badgeLabel;
  badge.className   = `plan-badge pb-${plan}`;
  const usageMini = document.getElementById('usageMini');
  if (plan === 'free_trial') {
    const days = getTrialDaysRemaining();
    usageMini.textContent = `Trial: ${planUsed}/${P.genLimit} rpts · ${chatUsed}/${P.chatLimit} chats · ${days}d left`;
    // Turn red when ≤1 day left
    usageMini.style.color = days <= 1 ? 'var(--red)' : '';
  } else {
    usageMini.textContent = `Reports: ${planUsed}/${P.genLimit}  Chat: ${chatUsed}/${P.chatLimit}`;
    usageMini.style.color = '';
  }
}
function updateUsageWidget() {
  const plan     = userProfile.plan || null;
  const P        = PLANS[plan];
  const planUsed = userProfile.planUsed     || 0;
  const chatUsed = userProfile.planChatUsed || 0;
  const total    = userProfile.totalReports || 0;
  const hasKey   = !!(userSettings.apiKey && userSettings.apiKey.trim());
  const el       = document.getElementById('uwContent');
  if (!el) return;

  if (plan === 'free_trial') {
    // ── Free Trial specific widget with countdown ──
    const days    = getTrialDaysRemaining();
    const rUsed   = userProfile.planUsed        || 0;
    const cUsed   = userProfile.planChatUsed    || 0;
    const cpUsed  = userProfile.comparisonUsed  || 0;
    const rLimit  = PLANS.free_trial.genLimit;
    const cLimit  = PLANS.free_trial.chatLimit;
    const cpLimit = PLANS.free_trial.comparisonLimit;
    const rPct    = Math.min(100, (rUsed  / rLimit)  * 100);
    const cPct    = Math.min(100, (cUsed  / cLimit)  * 100);
    const cpPct   = Math.min(100, (cpUsed / cpLimit) * 100);
    const urgency = days <= 1 ? 'var(--red)' : days <= 3 ? 'var(--amber)' : 'var(--green)';
    el.innerHTML = `
      <!-- Countdown banner -->
      <div style="background:linear-gradient(135deg,rgba(0,229,200,0.1),rgba(74,158,255,0.08));border:1px solid rgba(0,229,200,0.25);border-radius:10px;padding:10px 12px;margin-bottom:10px;text-align:center;">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">🚀 Free Trial</div>
        <div style="font-size:22px;font-weight:800;color:${urgency};font-family:var(--ff-mono)">${days}</div>
        <div style="font-size:10px;color:var(--muted)">day${days !== 1 ? 's' : ''} remaining</div>
        ${days <= 2 ? `<div style="font-size:10px;color:var(--red);margin-top:4px;font-weight:700;">⚠ Trial ending soon!</div>` : ''}
      </div>
      <!-- Reports bar -->
      <div class="uw-row"><span class="uw-label">📊 Reports</span><span class="uw-val" style="${rPct>=90?'color:var(--red)':''}">${rUsed} / ${rLimit}</span></div>
      <div class="uw-bar"><div class="uw-bar-fill reports-fill ${rPct>=100?'danger':''}" style="width:${rPct}%"></div></div>
      <!-- Chat bar -->
      <div class="uw-row" style="margin-top:8px"><span class="uw-label">💬 Chats</span><span class="uw-val" style="${cPct>=90?'color:var(--red)':''}">${cUsed} / ${cLimit}</span></div>
      <div class="uw-bar"><div class="uw-bar-fill chats-fill ${cPct>=100?'danger':''}" style="width:${cPct}%"></div></div>
      <!-- Comparison bar -->
      <div class="uw-row" style="margin-top:8px"><span class="uw-label">⚖ Comparisons</span><span class="uw-val" style="${cpPct>=90?'color:var(--red)':''}">${cpUsed} / ${cpLimit}</span></div>
      <div class="uw-bar"><div class="uw-bar-fill compare-fill ${cpPct>=100?'danger':''}" style="width:${cpPct}%"></div></div>
      <!-- Upgrade CTA -->
      <button onclick="goPage('plans')" class="upgrade-cta-btn" style="margin-top:14px;">⭐ Upgrade to Paid Plan</button>`;
  } else if (plan === 'payperuse') {
    const hasOwnAPI = !!(userProfile.usingOwnAPI && userSettings.apiKey?.trim());
    const rUsed  = userProfile.planUsed       || 0;
    const cUsed  = userProfile.planChatUsed   || 0;
    const cpUsed = userProfile.comparisonUsed || 0;
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(52,211,153,0.08),rgba(0,229,200,0.06));border:1px solid rgba(52,211,153,0.2);border-radius:10px;padding:10px 12px;margin-bottom:10px;text-align:center;">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">⚡ Pay Per Use</div>
        ${hasOwnAPI
          ? '<div style="font-size:12px;color:var(--green);font-weight:700">✓ Own API Mode — High Limits Active</div>'
          : '<div style="font-size:11px;color:var(--amber);font-weight:700">Admin API — Limited Usage</div>'
        }
      </div>
      ${hasOwnAPI
        ? `<div style="font-size:10px;color:var(--muted);text-align:center;padding:6px 0">Your API key is in use. Reports/chats/comparisons use your own quota — very high limits apply.</div>`
        : `<div class="uw-row"><span class="uw-label">Reports Used</span><span class="uw-val">${rUsed} / 2</span></div>
           <div class="uw-bar"><div class="uw-bar-fill ${rUsed>=2?'danger':''}" style="width:${Math.min(100,rUsed/2*100)}%"></div></div>
           <div class="uw-row" style="margin-top:6px"><span class="uw-label">Chats Used</span><span class="uw-val">${cUsed} / 3</span></div>
           <button onclick="goPage('settings')" style="margin-top:10px;width:100%;padding:7px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.25);color:var(--green);border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">⚡ Add Own API → Unlock High Limits</button>`
      }`;
  } else {
    const genLimit  = getPlanGenLimit();
    const chatLimit = getPlanChatLimit();
    const genPct    = Math.min(100, (planUsed / genLimit)  * 100);
    const chatPct   = Math.min(100, (chatUsed / chatLimit) * 100);
    const planDate  = userProfile.planStartDate
      ? new Date(userProfile.planStartDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
      : '—';
    const cmpUsed  = userProfile.comparisonUsed  || 0;
    const cmpLimit = getPlanComparisonLimit();
    const cmpPct   = cmpLimit > 0 ? Math.min(100, (cmpUsed / cmpLimit) * 100) : 0;
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">Total Reports</div>
        <div style="font-size:14px;font-weight:800;color:var(--cyan);font-family:var(--ff-mono)">${total}</div>
      </div>
      <div class="uw-row"><span class="uw-label">Plan Reports Used</span><span class="uw-val" style="${genPct>=90?'color:var(--red)':''}">${planUsed} / ${genLimit}</span></div>
      <div class="uw-bar"><div class="uw-bar-fill reports-fill ${genPct>=100?'danger':''}" style="width:${genPct}%"></div></div>
      <div class="uw-row" style="margin-top:8px"><span class="uw-label">Chat Messages Used</span><span class="uw-val" style="${chatPct>=90?'color:var(--red)':''}">${chatUsed} / ${chatLimit}</span></div>
      <div class="uw-bar"><div class="uw-bar-fill chats-fill ${chatPct>=100?'danger':''}" style="width:${chatPct}%"></div></div>
      <div class="uw-row" style="margin-top:8px"><span class="uw-label">⚖ Comparisons Used</span><span class="uw-val" style="${cmpPct>=90?'color:var(--red)':''}">${cmpUsed} / ${cmpLimit}</span></div>
      <div class="uw-bar"><div class="uw-bar-fill compare-fill ${cmpPct>=100?'danger':''}" style="width:${cmpPct}%"></div></div>
      <div style="margin-top:10px;font-size:10px;color:var(--dim);text-align:center;line-height:1.6">
        <span style="color:var(--pprem)">${P.name}</span> · Active since ${planDate}<br>
        <span style="color:var(--muted)">Counts since plan activation only</span>
      </div>`;
  }
}
function showLimitReached(type) {
  const plan=userProfile.plan||'free_trial';
  const P=PLANS[plan];
  document.getElementById('idleBox').style.display='none';
  document.getElementById('loadbox').style.display='none';
  document.getElementById('resultWrap').style.display='block';
  document.getElementById('resultWrap').innerHTML=`
    <div class="limit-box">
      <span class="lb-icon">⚠</span>
      <div class="lb-title">Monthly Limit Reached</div>
      <div class="lb-desc">You've used all ${type==='generation'?P.genLimit+' reports':P.chatLimit+' chat messages'} this month on the <strong>${P.name}</strong> plan.<br>Limits reset monthly. Upgrade for more access.</div>
      <button class="lb-btn" onclick="goPage('plans')">⭐ View Plans & Upgrade</button>
    </div>`;
}

/* ── MULTILINGUAL ────────────────────────────────────── */
const L10N={
  en:{idle:'Click map, then Send Report',desc:'GeoMind generates AI-powered exam-ready reports.'},
  hi:{idle:'मानचित्र पर क्लिक करें, फिर Send दबाएं',desc:'GeoMind शैक्षिक रिपोर्ट बनाता है।'},
  fr:{idle:'Cliquez sur la carte, puis Envoyer',desc:'GeoMind génère des rapports éducatifs.'},
  ar:{idle:'انقر الخريطة ثم إرسال',desc:'GeoMind يولد تقارير.'}
};
function applyLang(code) {
  curLang=code;
  const L=L10N[code]||L10N.en;
  const t=document.getElementById('i-title'); const d=document.getElementById('i-desc');
  if(t)t.textContent=L.idle; if(d)d.textContent=L.desc;
}

/* ── UI HELPERS ──────────────────────────────────────── */
function showLoading() {
  document.getElementById('idleBox').style.display='none';
  document.getElementById('resultWrap').style.display='none';
  document.getElementById('famBar').style.display='none';
  document.getElementById('ptip').style.display='none';
  document.getElementById('loadbox').style.display='flex';
  document.getElementById('sendBtn').disabled=true;
  goTab('a',document.getElementById('t-a'));
}
function showErr(msg) {
  console.error('[showErr]', msg);
  document.getElementById('loadbox').style.display='none';
  document.getElementById('sendBtn').disabled=false;
  const w = document.getElementById('resultWrap');
  const isKeyErr = msg.includes('API key') || msg.includes('Settings') || msg.includes('key');
  const isNetErr = msg.includes('network') || msg.includes('Network') || msg.includes('internet') || msg.includes('connect') || msg.includes('fetch');
  const hint = isKeyErr
    ? 'Check your API key in Settings ⚙, or upgrade your plan.'
    : isNetErr
    ? 'Check your internet connection, then tap Try Again.'
    : 'Please try again. If the issue persists, contact support.';

  w.innerHTML = `<div class="ebox" style="text-align:center;padding:20px 16px;">
    <div style="font-size:32px;margin-bottom:10px">⚠️</div>
    <div style="font-weight:800;font-size:14px;margin-bottom:8px;color:var(--red)">Something went wrong</div>
    <div style="font-size:12px;color:var(--text2);margin-bottom:8px;line-height:1.6">${hint}</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:16px;line-height:1.5">
      I think some errors occurred. Please send your query to fix the problem at
      <a href="mailto:becreativethink3@gmail.com" style="color:var(--cyan);text-decoration:none;font-weight:700">becreativethink3@gmail.com</a>
      or tap <strong>Try Again</strong>.
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
      <button onclick="retryLastReport()" style="
        background:linear-gradient(135deg,var(--primary),var(--secondary));
        color:#fff;border:none;padding:10px 22px;border-radius:10px;
        font-weight:800;font-size:13px;cursor:pointer;
        box-shadow:0 4px 14px rgba(74,124,255,0.35);">
        ↺ Try Again
      </button>
      <button onclick="goPage('settings')" style="
        background:rgba(0,229,200,0.1);border:1px solid rgba(0,229,200,0.25);
        color:var(--cyan);padding:10px 18px;border-radius:10px;
        font-weight:700;font-size:12px;cursor:pointer;">
        ⚙ Settings
      </button>
    </div>
  </div>`;
  w.style.display = 'block';
  toast('⚠ ' + msg.substring(0,80), 'err');
}

/* Retry last report without resetting any user input */
function retryLastReport() {
  if (pendingLat === null || pendingLon === null) {
    toast('Please click a location on the map first', 'err');
    return;
  }
  // Keep user question and country input intact — just retry
  document.getElementById('resultWrap').style.display = 'none';
  document.getElementById('resultWrap').innerHTML = '';
  generateReport(pendingLat, pendingLon);
}
function clearAll() {
  pendingLat=null; pendingLon=null;
  document.getElementById('idleBox').style.display='flex';
  document.getElementById('loadbox').style.display='none';
  document.getElementById('resultWrap').style.display='none';
  document.getElementById('resultWrap').innerHTML='';
  document.getElementById('cpill').style.display='none';
  document.getElementById('famBar').style.display='none';
  document.getElementById('ptip').style.display='none';
  document.getElementById('sendBtn').disabled=false;
  document.getElementById('sendBtn').style.boxShadow='';
  document.getElementById('userQuestion').value='';
  document.getElementById('countryInput').value='';
  if(mapMarker){map.removeLayer(mapMarker);mapMarker=null;}
  curData={}; updateUsageWidget();
}
function step(msg,pct) {
  document.getElementById('lstep').textContent=msg;
  document.getElementById('pfill').style.width=pct+'%';
  if(pct>=100) setTimeout(()=>{document.getElementById('sendBtn').disabled=false;},600);
}
function toast(msg,type='ok') {
  const t=document.createElement('div');
  t.className='toast '+type; t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(),3500);
}

/* ══════════════════════════════════════════════════════
   GEOMIND v5.1 — ENHANCED ADDITIONS
   • Improved error messages
   • Map button validation fix  
   • Network error detection
   • Better UI feedback
   ══════════════════════════════════════════════════════ */

/* ── ENHANCED ERROR DETECTION ─────────────────────── */
function detectAndShowError(err) {
  const msg = err?.message || String(err) || 'Unknown error';
  let friendly = msg;
  let hint = '';
  if (msg.includes('No API key') || msg.includes('API key')) {
    friendly = '🔑 API Key Required';
    hint = 'Add your API key in <b>Settings</b> or <a href="#" onclick="goPage(\'plans\');return false" style="color:var(--cyan)">purchase a plan</a>.';
  } else if (msg.includes('401') || msg.includes('invalid') || msg.includes('Invalid')) {
    friendly = '❌ Invalid API Key';
    hint = 'Your API key appears incorrect. Please check it in <b>Settings ⚙</b>.';
  } else if (msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
    friendly = '⏱ Rate Limit Reached';
    hint = 'You\'ve hit the API rate limit. Wait a moment or upgrade your plan.';
  } else if (msg.includes('network') || msg.includes('Network') || msg.includes('Failed to fetch') || msg.includes('internet')) {
    friendly = '📶 Network Error';
    hint = 'Check your internet connection. If the problem persists, try a different AI model.';
  } else if (msg.includes('JSON') || msg.includes('parse') || msg.includes('SyntaxError')) {
    friendly = '⚠ AI Response Error';
    hint = 'The AI returned unexpected output. Try again or switch models in <b>Settings</b>.';
  } else if (msg.includes('AbortError') || msg.includes('timeout')) {
    friendly = '⏰ Request Timed Out';
    hint = 'The request took too long. Check your connection and try again.';
  } else if (msg.includes('503') || msg.includes('loading') || msg.includes('busy')) {
    friendly = '🔄 Service Busy';
    hint = 'The AI model is loading. Please wait 20–30 seconds and try again.';
  }
  showErr(friendly + (hint ? '<br><span style="font-size:11px;font-weight:400;color:var(--muted)">' + hint + '</span>' : ''));
}

/* ── ENHANCED MAP CLICK VALIDATION ──────────────────── */
function validateLocationSelected() {
  if (pendingLat === null || pendingLon === null) {
    const mapEl = document.getElementById('map');
    if (mapEl) {
      mapEl.style.transition = 'box-shadow 0.3s';
      mapEl.style.boxShadow = '0 0 0 3px var(--red), inset 0 0 30px rgba(255,107,122,0.1)';
      setTimeout(() => { mapEl.style.boxShadow = ''; }, 2200);
    }
    toast('📍 Please click a location on the map first.', 'err');
    const idle = document.getElementById('i-title');
    if (idle) {
      const orig = idle.textContent;
      idle.textContent = '⬆ Tap the map to select a location';
      idle.style.color = 'var(--red)';
      setTimeout(() => { idle.textContent = orig; idle.style.color = ''; }, 3000);
    }
    return false;
  }
  return true;
}

/* ── NETWORK STATUS MONITORING ───────────────────────── */
function initNetworkMonitor() {
  const update = () => {
    const banner = document.getElementById('offlineBanner');
    const statusDot = document.getElementById('statusDot');
    if (!navigator.onLine) {
      if (banner) banner.classList.add('show');
      if (statusDot) { statusDot.textContent = '● OFFLINE'; statusDot.style.color = 'var(--red)'; }
    } else {
      if (banner) banner.classList.remove('show');
      if (statusDot) { statusDot.textContent = '● ONLINE'; statusDot.style.color = 'var(--green)'; }
    }
  };
  window.addEventListener('online',  () => { update(); toast('📶 Back online!', 'ok'); });
  window.addEventListener('offline', () => { update(); toast('📶 You are offline.', 'err'); });
  // Only run update if we are genuinely offline (don't trigger on page load)
  if (!navigator.onLine) update();
}

/* ── SMOOTH PAGE TRANSITIONS ─────────────────────────── */
const _origGoPage = goPage;
window.goPage = function(name) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => { if (p.classList.contains('active')) p.style.opacity = '0.5'; });
  setTimeout(() => {
    pages.forEach(p => p.style.opacity = '');
    _origGoPage(name);
  }, 80);
};

/* ── KEYBOARD SHORTCUTS ──────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.altKey) {
    if (e.key === '1') goPage('map');
    if (e.key === '2') goPage('compare');
    if (e.key === '3') goPage('history');
    if (e.key === '4') goPage('plans');
    if (e.key === '5') goPage('profile');
    if (e.key === '6') goPage('settings');
  }
});

/* ── AUTO-SAVE QUESTION INPUT ────────────────────────── */
(function initAutoSave() {
  const q = document.getElementById('userQuestion');
  if (q) {
    const saved = sessionStorage.getItem('gm_last_question');
    if (saved) q.value = saved;
    q.addEventListener('input', () => sessionStorage.setItem('gm_last_question', q.value));
  }
})();

/* Network monitor is initialized inside auth.onAuthStateChanged via setupOfflineMode() */


/* ═══════════════════════════════════════════════════════
   SECTION 7 — MAP / REPORT RESIZABLE SLIDER
   Drag the divider to resize map ↔ right panel
   ═══════════════════════════════════════════════════════ */
(function initMapSlider() {
  const slider     = document.getElementById('mapSlider');
  const mapPanel   = document.getElementById('mapPanel');
  const rightPanel = document.getElementById('rightPanel');
  const mainWrap   = document.getElementById('mainWrap');
  if (!slider || !mapPanel || !rightPanel) return;

  let dragging  = false;
  let startPos  = 0;       // startX (desktop) or startY (mobile)
  let startSize = 0;       // start width (desktop) or start height (mobile)

  function isMobile() { return window.innerWidth <= 900; }

  function onStart(e) {
    dragging = true;
    const pt = e.touches ? e.touches[0] : e;
    startPos  = isMobile() ? pt.clientY : pt.clientX;
    startSize = isMobile()
      ? mapPanel.getBoundingClientRect().height
      : mapPanel.getBoundingClientRect().width;
    slider.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = isMobile() ? 'row-resize' : 'col-resize';
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    const pt = e.touches ? e.touches[0] : e;

    if (isMobile()) {
      // ── MOBILE: drag up/down to resize map height ──
      const dy   = (pt.clientY - startPos);
      const total = mainWrap.getBoundingClientRect().height - slider.offsetHeight;
      const minH  = 120;   // px — minimum map height
      const maxH  = total - 100; // minimum right panel 100px
      const newH  = Math.min(maxH, Math.max(minH, startSize + dy));
      mapPanel.style.flex   = 'none';
      mapPanel.style.height = newH + 'px';
      rightPanel.style.flex = '1';
      if (window.map) window.map.invalidateSize();
    } else {
      // ── DESKTOP: drag left/right to resize map width ──
      const dx   = (pt.clientX - startPos);
      const total = mainWrap.getBoundingClientRect().width - slider.offsetWidth;
      const minW  = 200;
      const maxW  = total - 220;
      const newW  = Math.min(maxW, Math.max(minW, startSize + dx));
      mapPanel.style.flex   = 'none';
      mapPanel.style.width  = newW + 'px';
      rightPanel.style.flex = '1';
      rightPanel.style.width = '';
      if (window.map) window.map.invalidateSize();
    }
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    slider.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (window.map) setTimeout(() => window.map.invalidateSize(), 60);
  }

  // Double-tap/double-click to reset to default
  let lastTap = 0;
  slider.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTap < 300) resetSlider();
    lastTap = now;
  });
  slider.addEventListener('dblclick', resetSlider);

  function resetSlider() {
    if (isMobile()) {
      mapPanel.style.flex   = 'none';
      mapPanel.style.height = '38vh';
      rightPanel.style.flex = '1';
    } else {
      mapPanel.style.flex   = '1';
      mapPanel.style.width  = '';
      rightPanel.style.flex = '0 0 360px';
      rightPanel.style.width = '360px';
    }
    if (window.map) setTimeout(() => window.map.invalidateSize(), 80);
    toast('Layout reset', 'ok');
  }

  slider.addEventListener('mousedown', onStart);
  slider.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
})();

/* ═══════════════════════════════════════════════════════
   SECTION 8 — LOAD PROFILE PHOTO FROM FIREBASE ON LOGIN
   ═══════════════════════════════════════════════════════ */
// Patch loadUserProfile to also load photoURL
const _origLoadUserProfile = typeof loadUserProfile === 'function' ? loadUserProfile : null;
async function _patchedLoadUserProfile() {
  if (_origLoadUserProfile) await _origLoadUserProfile();
  // Also restore photo from stored photoURL
  if (userProfile.photoURL) {
    const avEl = document.getElementById('profileAvBig');
    if (avEl) {
      const name = userProfile.name || '?';
      avEl.innerHTML = `<img src="${userProfile.photoURL}" alt="Avatar" class="profile-av-img" onerror="this.parentElement.textContent='${name.charAt(0).toUpperCase()}'"/>`;
    }
  }
}
