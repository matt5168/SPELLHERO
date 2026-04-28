// engine.js - 核心邏輯與 API 引擎 (包含 NVIDIA 與 MiniMax 預設模型)

window.LEVEL_DATA = [{level:1,reqExp:0,title:"新手學徒",icon:"🌱",color:"text-[#8b9586]",bg:"bg-[#e6e9e4]",border:"border-[#c4cec1]"},{level:2,reqExp:150,title:"拼字新手",icon:"🥉",color:"text-[#cca677]",bg:"bg-[#f4ebd9]",border:"border-[#e0c9aa]"},{level:3,reqExp:400,title:"熟練拼手",icon:"🥈",color:"text-[#8a847c]",bg:"bg-[#dedad4]",border:"border-[#b8b3aa]"},{level:4,reqExp:800,title:"單字達人",icon:"🥇",color:"text-[#c2b49a]",bg:"bg-[#f2efe6]",border:"border-[#d9cfbb]"},{level:5,reqExp:1500,title:"英語小將",icon:"🏅",color:"text-[#768e8b]",bg:"bg-[#e2eae8]",border:"border-[#b2cbc7]"},{level:6,reqExp:2500,title:"智慧神童",icon:"💡",color:"text-[#8b9586]",bg:"bg-[#e6e9e4]",border:"border-[#c4cec1]"},{level:7,reqExp:4000,title:"拼字菁英",icon:"💎",color:"text-[#6b8b9c]",bg:"bg-[#dfe8ef]",border:"border-[#abc8d9]"},{level:8,reqExp:6000,title:"詞彙大師",icon:"👑",color:"text-[#968b95]",bg:"bg-[#e9e6e8]",border:"border-[#cfc6ce]"},{level:9,reqExp:8500,title:"傳奇英雄",icon:"🐉",color:"text-[#b5847e]",bg:"bg-[#f2e7e6]",border:"border-[#dcb5b0]"},{level:10,reqExp:12000,title:"終極神人",icon:"🌌",color:"text-[#a67c52]",bg:"bg-[#f0e6d8]",border:"border-[#c9a785]"}];
window.getCurrentLevelInfo = exp => { let c = window.LEVEL_DATA[0]; for(let i=0;i<window.LEVEL_DATA.length;i++) { if(exp>=window.LEVEL_DATA[i].reqExp) c=window.LEVEL_DATA[i]; else break; } return { current: c, nextLevel: window.LEVEL_DATA.find(l=>l.level===c.level+1)||null }; };

window.GRAMMAR_NOTEBOOKS = window.GRAMMAR_NOTEBOOKS || {};
window.RAW_NOTEBOOKS = window.RAW_NOTEBOOKS || {};

window.getActiveGrammarDB = function(notebooks) {
    let target = [];
    const nbArray = Array.isArray(notebooks) ? notebooks : ['All'];
    if (nbArray.includes('All')) { Object.keys(window.GRAMMAR_NOTEBOOKS).forEach(k => { if (Array.isArray(window.GRAMMAR_NOTEBOOKS[k])) { target = target.concat(window.GRAMMAR_NOTEBOOKS[k]); } }); } 
    else { nbArray.forEach(nb => { if (window.GRAMMAR_NOTEBOOKS[nb] && Array.isArray(window.GRAMMAR_NOTEBOOKS[nb])) { target = target.concat(window.GRAMMAR_NOTEBOOKS[nb]); } }); }
    return target;
};

window.DB_BY_NOTEBOOK = {}; window.ALL_WORDS = []; window.ALL_PHRASES = [];
window.GLOBAL_DICT = new Map();

Object.keys(window.RAW_NOTEBOOKS).forEach(notebook => {
    window.DB_BY_NOTEBOOK[notebook] = { words: [], phrases: [] };
    if(Array.isArray(window.RAW_NOTEBOOKS[notebook])) {
        window.RAW_NOTEBOOKS[notebook].forEach(word => {
            const cw = String(word).trim(); if (!cw) return; const key = cw.toLowerCase();
            let qObj; 
            if (window.GLOBAL_DICT.has(key)) { qObj = window.GLOBAL_DICT.get(key); } 
            else { qObj = { id: "q_" + key + "_" + Math.random(), answer: cw, hint: (window.SH_DICTIONARY && window.SH_DICTIONARY[key]) || "" }; window.GLOBAL_DICT.set(key, qObj); if (cw.indexOf(' ') !== -1 || cw.indexOf('-') !== -1 || cw.indexOf('...') !== -1) { window.ALL_PHRASES.push(qObj); } else { window.ALL_WORDS.push(qObj); } }
            const isPhrase = cw.indexOf(' ') !== -1 || cw.indexOf('-') !== -1 || cw.indexOf('...') !== -1; 
            const targetArr = isPhrase ? window.DB_BY_NOTEBOOK[notebook].phrases : window.DB_BY_NOTEBOOK[notebook].words;
            if (!targetArr.includes(qObj)) targetArr.push(qObj);
        });
    }
});

window.getActiveDB = function(notebooks, mode) {
    let targetWords = []; let targetPhrases = [];
    const nbArray = Array.isArray(notebooks) ? notebooks : ['All'];
    if (nbArray.includes('All')) { targetWords = window.ALL_WORDS; targetPhrases = window.ALL_PHRASES; } 
    else { nbArray.forEach(nb => { if (window.DB_BY_NOTEBOOK[nb]) { if (Array.isArray(window.DB_BY_NOTEBOOK[nb].words)) targetWords = targetWords.concat(window.DB_BY_NOTEBOOK[nb].words); if (Array.isArray(window.DB_BY_NOTEBOOK[nb].phrases)) targetPhrases = targetPhrases.concat(window.DB_BY_NOTEBOOK[nb].phrases); } }); targetWords = Array.from(new Set(targetWords)); targetPhrases = Array.from(new Set(targetPhrases)); }
    if (mode === 'word') return targetWords; if (mode === 'phrase') return targetPhrases; return [...targetWords, ...targetPhrases];
};

window.SOUND_ENGINE = {
  ctx: null, init: function() { if (!this.ctx) { const AudioContext = window.AudioContext || window.webkitAudioContext; if (AudioContext) this.ctx = new AudioContext(); } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; },
  playCorrect: function() { try { const ctx = this.init(); if (!ctx) return; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; const now = ctx.currentTime; osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.1); osc.frequency.setValueAtTime(783.99, now + 0.2); osc.frequency.setValueAtTime(1046.50, now + 0.3); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.3, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5); osc.start(now); osc.stop(now + 0.5); } catch (e) {} },
  playWrong: function() { try { const ctx = this.init(); if (!ctx) return; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sawtooth'; const now = ctx.currentTime; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.3); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.3, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3); } catch (e) {} },
  playVictory: function() { try { const ctx = this.init(); if (!ctx) return; const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; const times = [0, 0.15, 0.3, 0.45, 0.6, 0.75]; notes.forEach(function(freq, i) { const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'square'; const t = ctx.currentTime + times[i]; osc.frequency.setValueAtTime(freq, t); gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.15, t + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2); osc.start(t); osc.stop(t + 0.2); }); } catch (e) {} },
  playCoin: function() { try { const ctx = this.init(); if (!ctx) return; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; const now = ctx.currentTime; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.3, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); osc.start(now); osc.stop(now + 0.2); } catch (e) {} },
  playLevelUp: function() { try { const ctx = this.init(); if (!ctx) return; const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; notes.forEach(function(freq, i) { const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; const t = ctx.currentTime + i * 0.12; osc.frequency.setValueAtTime(freq, t); gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.4, t + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4); osc.start(t); osc.stop(t + 0.4); }); } catch (e) {} },
  playCombo: function() { try { const ctx = this.init(); if (!ctx) return; const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'triangle'; const now = ctx.currentTime; osc.frequency.setValueAtTime(800, now); osc.frequency.linearRampToValueAtTime(1200, now + 0.1); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.2, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); osc.start(now); osc.stop(now + 0.3); } catch (e) {} }
};

window.SYSTEM_ENGINE = {
  isCorrect: (ui, ca, qType, sentence = "") => {
      if (!qType || qType === 'fill') {
          return String(ui||'').trim().toLowerCase().replace(/\s+/g, ' ') === String(ca||'').trim().toLowerCase().replace(/\s+/g, ' ') ? 1 : 0;
      }
      if (qType === 'reorder') {
          if (!Array.isArray(ui)) return 0;
          const cleanStr = s => String(s || "").replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim().toLowerCase();
          return cleanStr(ui.join(' ')) === cleanStr(ca) ? 1 : 0;
      }
      return 0;
  },
  capitalize: s => { const str = String(s||""); const fc = str.search(/[a-zA-Z]/); return fc === -1 ? str : str.substring(0, fc) + str.charAt(fc).toUpperCase() + str.substring(fc + 1); },
  
  createHintMask: w => String(w||"").split(' ').map(wd => { let f=false, r=""; for(let i=0;i<wd.length;i++){ if(/[a-zA-Z]/.test(wd[i])){ if(!f){ r+=wd[i]; f=true; }else{ r+='_'; } }else{ r+=wd[i]; } } return r; }).join(' '),
  
  extractJSONObjects: function(text) {
      let cleaned = String(text||"").replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      let objects = []; let braceCount = 0; let inString = false; let escape = false; let startIdx = -1;
      for (let i = 0; i < cleaned.length; i++) {
          let char = cleaned[i]; if (escape) { escape = false; continue; } if (char === '\\') { escape = true; continue; } if (char === '"') { inString = !inString; continue; }
          if (!inString) { if (char === '{') { if (braceCount === 0) startIdx = i; braceCount++; } else if (char === '}') { braceCount--; if (braceCount === 0 && startIdx !== -1) { try { objects.push(JSON.parse(cleaned.substring(startIdx, i + 1))); } catch(e) {} startIdx = -1; } } }
      } return objects;
  }
};

window.shuffleArray = arr => { const n = [...arr]; for (let i = n.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); let t = n[i]; n[i] = n[j]; n[j] = t; } return n; };
window.generateVocabOptions = (ca, fDB) => { const s = String(ca||""); const opts = new Set([s]); const safeDB = Array.isArray(fDB) ? fDB : []; const pool = safeDB.filter(i => String(i.answer||"").toLowerCase() !== s.toLowerCase()); const sp = window.shuffleArray([...pool]); for (let i = 0; i < sp.length; i++) { if (opts.size >= 4) break; opts.add(String(sp[i].answer||"")); } return window.shuffleArray(Array.from(opts)); };
window.escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

window.Obfuscator = {
    prefix: "SH_ENC:", salt: "SpellingHero2026",
    encode: function(str) { if (!str) return ""; if (str.startsWith(this.prefix)) return str; let xorStr = ""; for (let i = 0; i < str.length; i++) { xorStr += String.fromCharCode(str.charCodeAt(i) ^ this.salt.charCodeAt(i % this.salt.length)); } return this.prefix + btoa(xorStr); },
    decode: function(str) { if (!str) return ""; if (!str.startsWith(this.prefix)) return str; try { let b64 = str.substring(this.prefix.length); let xorStr = atob(b64); let result = ""; for (let i = 0; i < xorStr.length; i++) { result += String.fromCharCode(xorStr.charCodeAt(i) ^ this.salt.charCodeAt(i % this.salt.length)); } return result; } catch(e) { return str; } }
};

window.getGeminiKey = () => window.Obfuscator.decode(localStorage.getItem('gemini_api_key')) || "";
window.getOpenRouterKey = () => window.Obfuscator.decode(localStorage.getItem('openrouter_api_key')) || "";
window.getGroqKey = () => window.Obfuscator.decode(localStorage.getItem('groq_api_key')) || "";
window.getOpenAITtsKey = () => window.Obfuscator.decode(localStorage.getItem('sh_openai_tts_key')) || "";
window.getNvidiaKey = () => window.Obfuscator.decode(localStorage.getItem('nvidia_api_key')) || "";

class Mutex {
    constructor() { this.queue = Promise.resolve(); }
    async lock(delayMs = 4500) { let unlockNext; const willLock = new Promise(resolve => unlockNext = resolve); const willUnlock = this.queue.then(() => new Promise(res => setTimeout(res, delayMs))); this.queue = this.queue.then(() => willLock); await willUnlock; return unlockNext; }
    lockMicro() { let unlockNext = () => {}; return unlockNext; }
}

window.GEMINI_DEFAULT_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemma-3-27b-it",
    "gemma-3-12b-it",
    "gemma-3-4b-it",
    "gemma-3n-e4b-it"
];

class PersistentAIClient {
    constructor() { 
        this.geminiKey = window.getGeminiKey(); this.openRouterKey = window.getOpenRouterKey(); this.groqKey = window.getGroqKey(); this.openAITtsKey = window.getOpenAITtsKey(); this.nvidiaKey = window.getNvidiaKey();
        this.lastCallTime = { groq: 0, google: 0, openrouter: 0, openai: 0, nvidia: 0 }; 
        this.cooldowns = { groq: 3000, google: 4000, openrouter: 2000, openai: 2000, nvidia: 2000 }; 
        this.mutex = new Mutex();
        this.circuitBreakers = { groq: { failures: 0, lockUntil: 0 }, google: { failures: 0, lockUntil: 0 }, openrouter: { failures: 0, lockUntil: 0 }, openai: { failures: 0, lockUntil: 0 }, nvidia: { failures: 0, lockUntil: 0 } };
    }
    checkCircuitBreaker(engine) { if (Date.now() < this.circuitBreakers[engine].lockUntil) { const remain = Math.ceil((this.circuitBreakers[engine].lockUntil - Date.now()) / 1000); throw new Error(`[Circuit Breaker] ${engine.toUpperCase()} 引擎處於冷卻中 (剩餘 ${remain}s)`); } }
    recordFailure(engine, retryAfterMs = 0) { const cb = this.circuitBreakers[engine]; cb.failures += 1; if (retryAfterMs > 0) { cb.lockUntil = Date.now() + retryAfterMs; cb.failures = 0; return; } if (cb.failures >= 3) { cb.lockUntil = Date.now() + (5 * 60 * 1000); cb.failures = 0; } }
    recordSuccess(engine) { this.circuitBreakers[engine].failures = 0; }
    getEngineStatus(provider) { const now = Date.now(); if (now < this.circuitBreakers[provider].lockUntil) return 'red'; if (now - this.lastCallTime[provider] < this.cooldowns[provider]) return 'yellow'; return 'green'; }
    updateKeys(gKey, oKey, grKey, oaKey, nvKey) { if (gKey) this.geminiKey = gKey; if (oKey) this.openRouterKey = oKey; if (grKey) this.groqKey = grKey; if (oaKey) this.openAITtsKey = oaKey; if (nvKey) this.nvidiaKey = nvKey; }

    async checkAvailableGeminiModels() {
        if (!this.geminiKey) return window.GEMINI_DEFAULT_MODELS;
        try {
            const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + this.geminiKey);
            if (!res.ok) return window.GEMINI_DEFAULT_MODELS;
            const data = await res.json();
            const allModels = (data.models || [])
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name.replace('models/', ''));
            const merged = Array.from(new Set([...allModels, ...window.GEMINI_DEFAULT_MODELS]));
            merged.sort((a, b) => {
                const rank = s => {
                    if (s.startsWith('gemini-2.5')) return 0;
                    if (s.startsWith('gemini-2.0')) return 1;
                    if (s.startsWith('gemini-1.')) return 2;
                    if (s.startsWith('gemma')) return 3;
                    return 4;
                };
                return rank(a) - rank(b) || a.localeCompare(b);
            });
            return merged;
        } catch(e) {
            return window.GEMINI_DEFAULT_MODELS;
        }
    }

    async checkAvailableGroqModels() {
        if (!this.groqKey) return null;
        try {
            const res = await fetch('https://api.groq.com/openai/v1/models', {
                headers: { 'Authorization': `Bearer ${this.groqKey}` }
            });
            if (res.ok) {
                const data = await res.json();
                return data.data.map(m => m.id).filter(id => !id.includes('whisper') && !id.includes('vision')).sort();
            }
        } catch(e) {}
        return null;
    }

    async checkAvailableNvidiaModels() {
        if (!this.nvidiaKey) return ["z-ai/glm4.7", "moonshotai/kimi-k2-instruct", "minimaxai/minimax-m2.7", "meta/llama-3.1-70b-instruct", "meta/llama-3.1-8b-instruct", "nvidia/llama-3.1-nemotron-70b-instruct"];
        try {
            const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
                headers: { 'Authorization': `Bearer ${this.nvidiaKey}` }
            });
            if (res.ok) {
                const data = await res.json();
                const filtered = data.data.map(m => m.id).filter(id => !id.includes('vision') && !id.includes('embedding') && !id.includes('tts')).sort();
                if (!filtered.includes("moonshotai/kimi-k2-instruct")) filtered.unshift("moonshotai/kimi-k2-instruct");
                if (!filtered.includes("z-ai/glm4.7")) filtered.unshift("z-ai/glm4.7");
                if (!filtered.includes("minimaxai/minimax-m2.7")) filtered.unshift("minimaxai/minimax-m2.7");
                return filtered;
            }
        } catch(e) {}
        return ["z-ai/glm4.7", "moonshotai/kimi-k2-instruct", "minimaxai/minimax-m2.7", "meta/llama-3.1-70b-instruct", "meta/llama-3.1-8b-instruct", "nvidia/llama-3.1-nemotron-70b-instruct"];
    }

    async checkAvailableModels(signal) { 
        const today = new Date().toLocaleDateString(); const cachedModel = localStorage.getItem('sh_gemini_model_cache'); const cacheDate = localStorage.getItem('sh_gemini_model_cache_date');
        if (cachedModel && cacheDate === today) return { gemini: cachedModel };
        let bg = "gemini-2.0-flash"; 
        try { 
            const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + this.geminiKey, signal ? {signal} : {}); 
            if (res.ok) { 
                const data = await res.json(); 
                const vm = (data.models || []).filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')).map(m => m.name.replace('models/', '')); 
                if (vm.indexOf('gemini-2.5-flash') !== -1) bg = 'gemini-2.5-flash'; else if (vm.indexOf('gemini-2.0-flash') !== -1) bg = 'gemini-2.0-flash'; else if (vm.indexOf('gemini-1.5-flash') !== -1) bg = 'gemini-1.5-flash'; 
                localStorage.setItem('sh_gemini_model_cache', bg); localStorage.setItem('sh_gemini_model_cache_date', today);
            } 
        } catch (e) {} return { gemini: bg }; 
    }

    async callGemini(modelName, systemPrompt, userQuery, signal, onChunk, onLog, taskType = "batch", retryCount = 0) {
        this.checkCircuitBreaker('google'); let unlock = () => {};
        const isMicro = taskType === 'micro';
        try {
            unlock = isMicro ? this.mutex.lockMicro() : await this.mutex.lock(4500);
            const localController = new AbortController(); const onAbort = () => localController.abort(new Error("AbortError")); if (signal) signal.addEventListener('abort', onAbort);
            let firstChunk = false; const baseTTFT = 12000; const ttftLimit = isMicro ? 6000 : baseTTFT;
            const ttftTimeout = setTimeout(() => { if (!firstChunk) { localController.abort(new Error("TIMEOUT_TTFT")); } }, ttftLimit);
            const resolvedModel = isMicro ? (localStorage.getItem('sh_gemini_model_selected') || localStorage.getItem('sh_gemini_model_cache') || 'gemini-2.0-flash') : modelName;
            const url = "https://generativelanguage.googleapis.com/v1beta/models/" + resolvedModel + ":streamGenerateContent?alt=sse&key=" + this.geminiKey;
            const payload = { contents: [{ role: "user", parts: [{ text: userQuery }] }], systemInstruction: { role: "system", parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "text/plain", temperature: 0.1, maxOutputTokens: 1500 } };
            const startTime = Date.now(); onLog && onLog(`📡 [Gemini] 發送請求 (${resolvedModel})...`);
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: localController.signal });
            if (!res.ok) {
                clearTimeout(ttftTimeout); let errBody = ""; try { errBody = await res.text(); } catch(e){} const errMsg = `HTTP ${res.status} ${errBody.substring(0, 100).replace(/\n/g, ' ')}`;
                onLog && onLog(`📥 [Gemini] 異常: ${errMsg}`);
                if (res.status === 429 || res.status >= 500) {
                    const retryAfter = res.headers.get('Retry-After'); let delayMs = retryAfter ? (isNaN(retryAfter) ? (new Date(retryAfter).getTime() - Date.now()) : (parseInt(retryAfter) * 1000)) : 30000;
                    this.recordFailure('google', Math.max(delayMs, 30000)); 
                    throw new Error('FATAL_ROUTING: ' + errMsg);
                } else if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) { 
                    this.recordFailure('google', 60000); throw new Error('FATAL: ' + errMsg); 
                }
                this.recordFailure('google'); throw new Error(errMsg);
            }
            this.recordSuccess('google');
            const reader = res.body.getReader(); const decoder = new TextDecoder("utf-8"); let fullText = ""; let buffer = "";
            while (true) {
                const { done, value } = await reader.read(); if (done) break;
                if (!firstChunk) { firstChunk = true; clearTimeout(ttftTimeout); onLog && onLog(`⚡ [Gemini] 收到首批串流封包！`); }
                buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop(); 
                for (let i=0; i<lines.length; i++) { 
                    let line = lines[i].trim(); 
                    if (line.startsWith('data: ')) { try { const data = JSON.parse(line.slice(6)); if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) { fullText += data.candidates[0].content.parts[0].text; if(onChunk) onChunk(fullText, resolvedModel); } } catch(e) {} } 
                }
            } 
            if (signal) signal.removeEventListener('abort', onAbort); unlock(); return { rawText: fullText, modelName: resolvedModel.toUpperCase(), provider: "google" };
        } catch (e) {
            unlock(); if (retryCount < 3 && !e.message.includes('Circuit Breaker') && !e.message.includes('FATAL') && e.name !== 'AbortError') { const backoffMs = (Math.pow(2, retryCount) * 5000) + (Math.random() * 5000); onLog && onLog(`[重試] Gemini 等待 ${Math.round(backoffMs/1000)}s...`); await new Promise(r => setTimeout(r, backoffMs)); return this.callGemini(modelName, systemPrompt, userQuery, signal, onChunk, onLog, taskType, retryCount + 1); } throw e;
        }
    }

    async callOpenRouter(systemPrompt, userQuery, signal, onChunk, onLog, specificModel = "openrouter/auto", taskType = "batch", retryCount = 0) {
        this.checkCircuitBreaker('openrouter'); let unlock = () => {};
        const isMicro = taskType === 'micro';
        try {
            unlock = isMicro ? this.mutex.lockMicro() : await this.mutex.lock(4500);
            const localController = new AbortController(); const onAbort = () => localController.abort(new Error("AbortError")); if (signal) signal.addEventListener('abort', onAbort);
            let firstChunk = false; const baseTTFT = 15000; const ttftLimit = isMicro ? 7000 : baseTTFT;
            const ttftTimeout = setTimeout(() => { if (!firstChunk) { localController.abort(new Error("TIMEOUT_TTFT")); } }, ttftLimit);
            const url = 'https://openrouter.ai/api/v1/chat/completions';
            const combinedContent = "System Instructions:\n" + systemPrompt + "\n\nUser Request:\n" + userQuery;
            const payload = { model: specificModel, messages: [ { role: "user", content: combinedContent } ], stream: true, temperature: 0.1, max_tokens: 1500 };
            const startTime = Date.now(); onLog && onLog(`📡 [OR] 發送請求 (${specificModel})...`);
            const res = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer ' + this.openRouterKey, 'Content-Type': 'application/json', 'HTTP-Referer': window.location.href, 'X-Title': 'Spelling Hero' }, body: JSON.stringify(payload), signal: localController.signal });
            if (!res.ok) {
                clearTimeout(ttftTimeout); let errBody = ""; try { errBody = await res.text(); } catch(e){} const errMsg = `HTTP ${res.status} ${errBody.substring(0, 100).replace(/\n/g, ' ')}`;
                onLog && onLog(`📥 [OR] 異常: ${errMsg}`);
                if (res.status === 429 || res.status >= 500) {
                    const retryAfter = res.headers.get('Retry-After'); let delayMs = retryAfter ? (isNaN(retryAfter) ? (new Date(retryAfter).getTime() - Date.now()) : (parseInt(retryAfter) * 1000)) : 30000;
                    this.recordFailure('openrouter', Math.max(delayMs, 30000)); 
                    throw new Error('FATAL_ROUTING: ' + errMsg);
                } else if (res.status === 400 || res.status === 401 || res.status === 402 || res.status === 403) { 
                    this.recordFailure('openrouter', 60000); throw new Error('FATAL: ' + errMsg); 
                }
                this.recordFailure('openrouter'); throw new Error(errMsg);
            }
            this.recordSuccess('openrouter');
            const reader = res.body.getReader(); const decoder = new TextDecoder("utf-8"); let fullText = ""; let buffer = ""; let actualModel = specificModel;
            while (true) {
                const { done, value } = await reader.read(); if (done) break;
                if (!firstChunk) { firstChunk = true; clearTimeout(ttftTimeout); onLog && onLog(`⚡ [OR] 收到首批串流封包！`); }
                buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop();
                for (let i=0; i<lines.length; i++) {
                    let line = lines[i].trim();
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') { 
                        try { const data = JSON.parse(line.slice(6)); if (data.model) actualModel = data.model; let added = false;
                        if (data.choices && data.choices[0]) {
                            let delta = data.choices[0].delta;
                            let msg = data.choices[0].message;
                            if (delta) {
                                if (delta.reasoning_content) { fullText += delta.reasoning_content; added = true; }
                                if (delta.content !== undefined && delta.content !== null) { fullText += delta.content; added = true; }
                            } else if (msg && msg.content !== undefined && msg.content !== null) {
                                fullText += msg.content; added = true;
                            }
                        }
                        if (added && onChunk) onChunk(fullText, actualModel); } catch(e) {} 
                    }
                }
            } 
            if (signal) signal.removeEventListener('abort', onAbort); unlock(); return { rawText: fullText, modelName: actualModel.toUpperCase(), provider: "openrouter" };
        } catch (e) {
            unlock(); if (retryCount < 3 && !e.message.includes('Circuit Breaker') && !e.message.includes('FATAL') && e.name !== 'AbortError') { const backoffMs = (Math.pow(2, retryCount) * 5000) + (Math.random() * 5000); onLog && onLog(`[重試] OR 等待 ${Math.round(backoffMs/1000)}s...`); await new Promise(r => setTimeout(r, backoffMs)); return this.callOpenRouter(systemPrompt, userQuery, signal, onChunk, onLog, specificModel, taskType, retryCount + 1); } throw e;
        }
    }

    async callGroq(systemPrompt, userQuery, signal, onChunk, onLog, specificModel = "llama-3.3-70b-versatile", taskType = "batch", retryCount = 0) {
        this.checkCircuitBreaker('groq'); let unlock = () => {};
        const isMicro = taskType === 'micro';
        try {
            unlock = isMicro ? this.mutex.lockMicro() : await this.mutex.lock(4500);
            const localController = new AbortController(); const onAbort = () => localController.abort(new Error("AbortError")); if (signal) signal.addEventListener('abort', onAbort);
            let firstChunk = false; const baseTTFT = 8000; const ttftLimit = isMicro ? 4000 : baseTTFT;
            const ttftTimeout = setTimeout(() => { if (!firstChunk) { localController.abort(new Error("TIMEOUT_TTFT")); } }, ttftLimit);
            const url = 'https://api.groq.com/openai/v1/chat/completions';
            const payload = { model: specificModel, messages: [ { role: "system", content: systemPrompt }, { role: "user", content: userQuery } ], stream: true, temperature: 0.1, max_tokens: 1500 };
            if (specificModel === "z-ai/glm4.7") {
                payload.chat_template_kwargs = { enable_thinking: true, clear_thinking: false };
                payload.temperature = 1.0;
                payload.top_p = 1.0;
                payload.max_tokens = 4096;
            }
            const startTime = Date.now(); onLog && onLog(`📡 [Groq] 發送請求 (${specificModel})...`);
            const res = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer ' + this.groqKey, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: localController.signal });
            if (!res.ok) {
                clearTimeout(ttftTimeout); let errBody = ""; try { errBody = await res.text(); } catch(e){} const errMsg = `HTTP ${res.status} ${errBody.substring(0, 100).replace(/\n/g, ' ')}`;
                onLog && onLog(`📥 [Groq] 異常: ${errMsg}`);
                if (res.status === 429 || res.status >= 500) {
                    const retryAfter = res.headers.get('Retry-After') || res.headers.get('x-ratelimit-reset'); let delayMs = retryAfter ? (isNaN(retryAfter) ? (new Date(retryAfter).getTime() - Date.now()) : (parseInt(retryAfter) * 1000)) : 30000;
                    this.recordFailure('groq', Math.max(delayMs, 30000)); 
                    throw new Error('FATAL_ROUTING: ' + errMsg);
                } else if (res.status === 400 || res.status === 401 || res.status === 403) { 
                    this.recordFailure('groq', 60000); throw new Error('FATAL: ' + errMsg); 
                }
                this.recordFailure('groq'); throw new Error(errMsg);
            }
            this.recordSuccess('groq');
            const reader = res.body.getReader(); const decoder = new TextDecoder("utf-8"); let fullText = ""; let buffer = ""; let actualModel = specificModel;
            while (true) {
                const { done, value } = await reader.read(); if (done) break;
                if (!firstChunk) { firstChunk = true; clearTimeout(ttftTimeout); onLog && onLog(`⚡ [Groq] 收到首批串流封包！`); }
                buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop();
                for (let i=0; i<lines.length; i++) {
                    let line = lines[i].trim();
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') { 
                        try { const data = JSON.parse(line.slice(6)); if (data.model) actualModel = data.model; let added = false;
                        if (data.choices && data.choices[0]) {
                            let delta = data.choices[0].delta;
                            let msg = data.choices[0].message;
                            if (delta) {
                                if (delta.reasoning_content) { fullText += delta.reasoning_content; added = true; }
                                if (delta.content !== undefined && delta.content !== null) { fullText += delta.content; added = true; }
                            } else if (msg && msg.content !== undefined && msg.content !== null) {
                                fullText += msg.content; added = true;
                            }
                        }
                        if (added && onChunk) onChunk(fullText, actualModel); } catch(e) {} 
                    }
                }
            } 
            if (signal) signal.removeEventListener('abort', onAbort); unlock(); return { rawText: fullText, modelName: actualModel.toUpperCase(), provider: "groq" };
        } catch (e) {
            unlock(); if (retryCount < 3 && !e.message.includes('Circuit Breaker') && !e.message.includes('FATAL') && e.name !== 'AbortError') { const backoffMs = (Math.pow(2, retryCount) * 5000) + (Math.random() * 5000); onLog && onLog(`[重試] Groq 等待 ${Math.round(backoffMs/1000)}s...`); await new Promise(r => setTimeout(r, backoffMs)); return this.callGroq(systemPrompt, userQuery, signal, onChunk, onLog, specificModel, taskType, retryCount + 1); } throw e;
        }
    }
    
    async callOpenAI(systemPrompt, userQuery, signal, onChunk, onLog, specificModel = "gpt-4o-mini", taskType = "batch", retryCount = 0) {
        this.checkCircuitBreaker('openai'); let unlock = () => {};
        const isMicro = taskType === 'micro';
        try {
            unlock = isMicro ? this.mutex.lockMicro() : await this.mutex.lock(4500);
            const localController = new AbortController(); const onAbort = () => localController.abort(new Error("AbortError")); if (signal) signal.addEventListener('abort', onAbort);
            let firstChunk = false; const baseTTFT = 15000; const ttftLimit = isMicro ? 7000 : baseTTFT;
            const ttftTimeout = setTimeout(() => { if (!firstChunk) { localController.abort(new Error("TIMEOUT_TTFT")); } }, ttftLimit);
            const url = 'https://api.openai.com/v1/chat/completions';
            const payload = { model: specificModel, messages: [ { role: "system", content: systemPrompt }, { role: "user", content: userQuery } ], stream: true, temperature: 0.1, max_tokens: 1500 };
            if (specificModel === "z-ai/glm4.7") {
                payload.chat_template_kwargs = { enable_thinking: true, clear_thinking: false };
                payload.temperature = 1.0;
                payload.top_p = 1.0;
                payload.max_tokens = 4096;
            }
            const startTime = Date.now(); onLog && onLog(`📡 [OpenAI] 發送請求 (${specificModel})...`);
            const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${this.openAITtsKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: localController.signal });
            if (!res.ok) {
                clearTimeout(ttftTimeout); let errBody = ""; try { errBody = await res.text(); } catch(e){} const errMsg = `HTTP ${res.status} ${errBody.substring(0, 100).replace(/\n/g, ' ')}`;
                onLog && onLog(`📥 [OpenAI] 異常: ${errMsg}`);
                if (res.status === 429 || res.status >= 500) {
                    const retryAfter = res.headers.get('Retry-After'); let delayMs = retryAfter ? (isNaN(retryAfter) ? (new Date(retryAfter).getTime() - Date.now()) : (parseInt(retryAfter) * 1000)) : 30000;
                    this.recordFailure('openai', Math.max(delayMs, 30000)); 
                    throw new Error('FATAL_ROUTING: ' + errMsg);
                } else if (res.status === 400 || res.status === 401 || res.status === 403) { 
                    this.recordFailure('openai', 60000); throw new Error('FATAL: ' + errMsg); 
                }
                this.recordFailure('openai'); throw new Error(errMsg);
            }
            this.recordSuccess('openai');
            const reader = res.body.getReader(); const decoder = new TextDecoder("utf-8"); let fullText = ""; let buffer = ""; let actualModel = specificModel;
            while (true) {
                const { done, value } = await reader.read(); if (done) break;
                if (!firstChunk) { firstChunk = true; clearTimeout(ttftTimeout); onLog && onLog(`⚡ [OpenAI] 收到首批串流封包！`); }
                buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop();
                for (let i=0; i<lines.length; i++) {
                    let line = lines[i].trim();
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') { 
                        try { const data = JSON.parse(line.slice(6)); if (data.model) actualModel = data.model; let added = false;
                        if (data.choices && data.choices[0]) {
                            let delta = data.choices[0].delta;
                            let msg = data.choices[0].message;
                            if (delta) {
                                if (delta.reasoning_content) { fullText += delta.reasoning_content; added = true; }
                                if (delta.content !== undefined && delta.content !== null) { fullText += delta.content; added = true; }
                            } else if (msg && msg.content !== undefined && msg.content !== null) {
                                fullText += msg.content; added = true;
                            }
                        }
                        if (added && onChunk) onChunk(fullText, actualModel); } catch(e) {} 
                    }
                }
            } 
            if (signal) signal.removeEventListener('abort', onAbort); unlock(); return { rawText: fullText, modelName: actualModel.toUpperCase(), provider: "openai" };
        } catch (e) {
            unlock(); if (retryCount < 3 && !e.message.includes('Circuit Breaker') && !e.message.includes('FATAL') && e.name !== 'AbortError') { const backoffMs = (Math.pow(2, retryCount) * 5000) + (Math.random() * 5000); onLog && onLog(`[重試] OpenAI 等待 ${Math.round(backoffMs/1000)}s...`); await new Promise(r => setTimeout(r, backoffMs)); return this.callOpenAI(systemPrompt, userQuery, signal, onChunk, onLog, specificModel, taskType, retryCount + 1); } throw e;
        }
    }

    async callNvidia(systemPrompt, userQuery, signal, onChunk, onLog, specificModel = "minimaxai/minimax-m2.7", taskType = "batch", retryCount = 0) {
        this.checkCircuitBreaker('nvidia'); let unlock = () => {};
        const isMicro = taskType === 'micro';
        try {
            unlock = isMicro ? this.mutex.lockMicro() : await this.mutex.lock(4500);
            const localController = new AbortController(); const onAbort = () => localController.abort(new Error("AbortError")); if (signal) signal.addEventListener('abort', onAbort);
            let firstChunk = false; const baseTTFT = 8000; const ttftLimit = isMicro ? 4000 : baseTTFT;
            const ttftTimeout = setTimeout(() => { if (!firstChunk) { localController.abort(new Error("TIMEOUT_TTFT")); } }, ttftLimit);
            const url = 'https://integrate.api.nvidia.com/v1/chat/completions';
            const payload = { model: specificModel, messages: [ { role: "system", content: systemPrompt }, { role: "user", content: userQuery } ], stream: true, temperature: 0.1, max_tokens: 1500 };
            if (specificModel === "z-ai/glm4.7") {
                payload.chat_template_kwargs = { enable_thinking: true, clear_thinking: false };
                payload.temperature = 1.0;
                payload.top_p = 1.0;
                payload.max_tokens = 4096;
            }
            const startTime = Date.now(); onLog && onLog(`📡 [NVIDIA] 發送請求 (${specificModel})...`);
            const res = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer ' + this.nvidiaKey, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: localController.signal });
            if (!res.ok) {
                clearTimeout(ttftTimeout); let errBody = ""; try { errBody = await res.text(); } catch(e){} const errMsg = `HTTP ${res.status} ${errBody.substring(0, 100).replace(/\n/g, ' ')}`;
                onLog && onLog(`📥 [NVIDIA] 異常: ${errMsg}`);
                if (res.status === 429 || res.status >= 500) {
                    const retryAfter = res.headers.get('Retry-After'); let delayMs = retryAfter ? (isNaN(retryAfter) ? (new Date(retryAfter).getTime() - Date.now()) : (parseInt(retryAfter) * 1000)) : 30000;
                    this.recordFailure('nvidia', Math.max(delayMs, 30000));
                    throw new Error('FATAL_ROUTING: ' + errMsg);
                } else if (res.status === 400 || res.status === 401 || res.status === 403) {
                    this.recordFailure('nvidia', 60000); throw new Error('FATAL: ' + errMsg);
                }
                this.recordFailure('nvidia'); throw new Error(errMsg);
            }
            this.recordSuccess('nvidia');
            const reader = res.body.getReader(); const decoder = new TextDecoder("utf-8"); let fullText = ""; let buffer = ""; let actualModel = specificModel;
            while (true) {
                const { done, value } = await reader.read(); if (done) break;
                if (!firstChunk) { firstChunk = true; clearTimeout(ttftTimeout); onLog && onLog(`⚡ [NVIDIA] 收到首批串流封包！`); }
                buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop();
                for (let i=0; i<lines.length; i++) {
                    let line = lines[i].trim();
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try { const data = JSON.parse(line.slice(6)); if (data.model) actualModel = data.model; let added = false;
                        if (data.choices && data.choices[0]) {
                            let delta = data.choices[0].delta;
                            let msg = data.choices[0].message;
                            if (delta) {
                                if (delta.reasoning_content) { fullText += delta.reasoning_content; added = true; }
                                if (delta.content !== undefined && delta.content !== null) { fullText += delta.content; added = true; }
                            } else if (msg && msg.content !== undefined && msg.content !== null) {
                                fullText += msg.content; added = true;
                            }
                        }
                        if (added && onChunk) onChunk(fullText, actualModel); } catch(e) {}
                    }
                }
            }
            if (signal) signal.removeEventListener('abort', onAbort); unlock(); return { rawText: fullText, modelName: actualModel.toUpperCase(), provider: "nvidia" };
        } catch (e) {
            unlock(); if (retryCount < 3 && !e.message.includes('Circuit Breaker') && !e.message.includes('FATAL') && e.name !== 'AbortError') { const backoffMs = (Math.pow(2, retryCount) * 5000) + (Math.random() * 5000); onLog && onLog(`[重試] NVIDIA 等待 ${Math.round(backoffMs/1000)}s...`); await new Promise(r => setTimeout(r, backoffMs)); return this.callNvidia(systemPrompt, userQuery, signal, onChunk, onLog, specificModel, taskType, retryCount + 1); } throw e;
        }
    }
}
window.sharedAIClient = new PersistentAIClient();

window.resolveGrammarTags = function(qObj) {
    if (!qObj || (!qObj.answer && !qObj.sentence)) return qObj;
    let newQ = JSON.parse(JSON.stringify(qObj));
    let memory = {};

    const tagRegex = /\[([A-Z_]+)_(\d+)\]/g;
    const replaceTag = (match, tagClass, tagId) => {
        const memKey = `${tagClass}_${tagId}`;
        if (!memory[memKey]) {
            const pool = window.TAG_POOLS && window.TAG_POOLS[tagClass];
            if (pool && Array.isArray(pool) && pool.length > 0) {
                memory[memKey] = pool[Math.floor(Math.random() * pool.length)];
            } else {
                memory[memKey] = match; 
            }
        }
        return memory[memKey];
    };

    newQ.answer = String(newQ.answer || "").replace(tagRegex, replaceTag);
    newQ.sentence = String(newQ.sentence || "").replace(tagRegex, replaceTag);

    const hintRegex = /\[([A-Z_]+)_(\d+)_HINT\]/g;
    newQ.hint = String(newQ.hint || "").replace(hintRegex, (match, tagClass, tagId) => {
        const memKey = `${tagClass}_${tagId}`;
        const word = memory[memKey];
        if (word) {
            const dictEntry = window.SH_DICTIONARY && window.SH_DICTIONARY[word.toLowerCase()];
            return dictEntry ? dictEntry.split(/[;；]/)[0] : word; 
        }
        return match;
    });

    const fixArticles = (str) => {
        return str.replace(/\b([Aa])n?\s+([a-zA-Z])/g, (m, article, nextChar) => {
            const isVowel = /[aeiouAEIOU]/.test(nextChar);
            if (article === 'A') return isVowel ? 'An ' + nextChar : 'A ' + nextChar;
            return isVowel ? 'an ' + nextChar : 'a ' + nextChar;
        });
    };

    newQ.answer = fixArticles(newQ.answer);
    newQ.sentence = fixArticles(newQ.sentence);
    
    const _fixMode = (typeof window !== 'undefined' && window.GRAMMAR_FIX_MODE) ? window.GRAMMAR_FIX_MODE : 'rule';
    if (_fixMode === 'rule' || _fixMode === 'both') {
        const _OBJ_MAP = { he:'him', she:'her', i:'me', we:'us', they:'them', you:'you', it:'it' };
        const _fixObjCase = (str) => str.replace(
            /\b(with|for|to|at|of|about|from|by|without|after|before)\b\s+\b(he|she|I|we|they)\b/gi,
            (m, prep, pronoun) => prep + ' ' + (_OBJ_MAP[pronoun.toLowerCase()] || pronoun)
        );
        newQ.sentence = _fixObjCase(newQ.sentence);
        newQ.answer   = _fixObjCase(newQ.answer);
    }

    newQ.resolvedValues = Object.values(memory).join('_').replace(/\s+/g, '');
    return newQ;
};
