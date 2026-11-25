/* YouBudget rule-based categoriser: no AI, no server, runs in the browser.
   Cascade, from the most to the least reliable level; the first level that recognises the movement decides:
     1. bank      - category supplied by the bank in the export (mapped to the app categories)
     2. type      - operation type from the wording (fees, taxes, cash, salary, rent, card settlement...)
     3. merchant  - known merchant / brand (dictionary for Italy, Singapore, UK, US and global brands)
     4. similar   - very similar to a movement already categorised (token similarity)
   User rules and manual choices are applied by the app before this cascade and always win.
   Every result says which level decided and why, so the user can check it. */
(function () {
  'use strict';
  const D = window.YB_CATEGORIZER_DATA;
  if (!D) return;

  const fold = s => String(s ?? '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const normText = s => fold(s).replace(/[^A-Z0-9]+/g, ' ').trim();          // "Amazon.it*Mktp" -> "AMAZON IT MKTP"
  const key = s => fold(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();  // bank category key

  // ---- merchant dictionary: compiled once into [{words, prefix, cat, region, len}] sorted longest first ----
  const entries = [];
  for (const [region, cats] of Object.entries(D.merchants)) {
    for (const [cat, list] of Object.entries(cats)) {
      for (const raw of list) {
        const prefix = raw.endsWith('*');
        const words = normText(prefix ? raw.slice(0, -1) : raw);
        if (words) entries.push({ words, prefix, cat, region, raw, len: words.length });
      }
    }
  }
  entries.sort((a, b) => b.len - a.len);
  // Some banks (Fineco) cut descriptions into fixed-width chunks, splitting words: "PIZZ ERIA", "TELECOMITALIA".
  // So a second pass looks for longer keywords (5+ letters) in the text with all spaces removed.
  const compactEntries = entries.filter(e => e.words.replace(/ /g, '').length >= 5).map(e => ({ ...e, compact: e.words.replace(/ /g, '') }));
  function dictionaryMatch(text) {
    const padded = ' ' + text + ' ';
    for (const e of entries) {
      if (e.prefix ? padded.includes(' ' + e.words) : padded.includes(' ' + e.words + ' ')) return e;
    }
    const compact = text.replace(/ /g, '');
    for (const e of compactEntries) if (compact.includes(e.compact)) return e;
    return null;
  }

  // ---- merchant name extraction ----
  const noisePrefix = new RegExp('^(?:' + D.noisePrefixes.map(normText).join('|') + ')\\s+');
  const noiseRe = new RegExp('(^| )(?:' + D.noiseWords.map(normText).sort((a, b) => b.length - a.length).join('|') + ')(?= |$)', 'g');
  function merchant(desc) {
    let s = fold(desc).replace(/\s+/g, ' ').trim();
    for (const re of D.merchantPatterns) { const m = s.match(re); if (m && m[1] && m[1].trim().length > 2) { s = m[1]; break; } }
    s = s.replace(/\bCARTA N\b.*$|\bCARD (NO|NUMBER)\b.*$|\bDATA OPERAZIONE\b.*$|\bDEL \d{2}[\/.]\d{2}[\/.]\d{2,4}.*$/, ' ')
      .replace(/\*{2,}\s*\d+/g, ' ')                                   // masked card numbers
      .replace(/\b\d{1,2}[\/.-]\d{1,2}([\/.-]\d{2,4})?\b/g, ' ')       // dates
      .replace(/\b\d{1,2}[:.]\d{2}(:\d{2})?\b/g, ' ')                  // times
      .replace(/\b(?=[A-Z0-9]*\d)[A-Z0-9]{6,}\b/g, ' ')                 // ids, references, long numbers
      .replace(/[^A-Z0-9&' ]+/g, ' ').replace(/\s+/g, ' ').trim();
    for (let i = 0; i < 3; i++) s = s.replace(noisePrefix, '');
    // drop the street address and what follows: "PEWE X CITY VIA MERULANA 46 ROMA" -> "PEWE X CITY"
    s = s.replace(/^(\S+(?: \S+)*?) (?:VIA|V LE|VIALE|PIAZZA|P ZA|P ZZA|PZA|CORSO|C SO|LARGO|LGO|VICOLO|STRADA|LOC|LOCALITA|FRAZ|NUM RIF|RIF|STREET|ST|ROAD|RD|AVENUE|AVE)\b.*$/, '$1');
    const kept = s.split(' ').filter(w => w && !/^\d+$/.test(w));
    let words = s.replace(noiseRe, ' ').split(' ').filter(w => w && !/^\d+$/.test(w));
    if (words.join('').length < 4) words = kept;                       // never reduce a name to a couple of letters
    const out = words.slice(0, 4).join(' ');
    return out ? out.replace(/\b([A-Z])([A-Z']*)\b/g, (m, a, b) => a + b.toLowerCase()) : String(desc || '').trim();
  }

  // ---- similarity index over movements already categorised by a reliable level ----
  const stop = new Set(D.stopWords.map(normText));
  const tokens = s => new Set(normText(s).split(' ').filter(w => w.length > 2 && !stop.has(w) && !/^\d+$/.test(w)));
  const RELIABLE = new Set(['manual', 'rule', 'bank', 'type', 'merchant']);
  let index = null, indexSig = '';
  function buildIndex(history) {
    const sig = history.length + ':' + history.filter(t => RELIABLE.has(t.classificationSource) || t.manualOverride).length;
    if (index && sig === indexSig) return index;
    index = []; indexSig = sig;
    for (const t of history) {
      if (!(RELIABLE.has(t.classificationSource) || t.manualOverride) || !t.category || t.category === 'Other') continue;
      const tk = tokens(t.merchant || merchant(t.desc));
      if (tk.size) index.push({ tk, cat: t.category, label: t.merchant || t.desc });
    }
    return index;
  }
  function similar(t, history) {
    const tk = tokens(t.merchant || merchant(t.desc));
    if (!tk.size || !history || !history.length) return null;
    let best = null;
    for (const h of buildIndex(history)) {
      let inter = 0; for (const w of tk) if (h.tk.has(w)) inter++;
      if (!inter) continue;
      const score = inter / (tk.size + h.tk.size - inter);                // Jaccard similarity
      if (!best || score > best.score) best = { score, cat: h.cat, label: h.label };
    }
    return best && best.score >= 0.6 ? best : null;
  }

  // ---- the cascade ----
  const STREET = /\b(?:VIA|VIALE|V LE|PIAZZA|P ZA|PZA|P ZZA|PIAZZALE|CORSO|C SO|LARGO|LGO|VICOLO|STRADA|LOCALITA|LOC|STREET|ROAD|AVENUE)\b(?: (?:DEL|DELLA|DELL|DEI|DEGLI|DELLE|DI|DA|SAN|SANTA|S))*(?: \S+){1,2}/g;
  function classify(t, opts = {}) {
    const amount = Number(t.amount) || 0;
    const text = normText(t.desc || t.merchant || '');
    const levels = opts.levels || { bank: true, type: true, merchant: true, similar: true };

    if (levels.bank && t.bankCategory) {
      const k = key(t.bankCategory);
      if (D.bankCategories[k]) return { category: D.bankCategories[k], source: 'bank', detail: 'bank category: ' + t.bankCategory, confidence: 0.9 };
    }
    if (levels.type) {
      for (const r of D.typeRules) {
        if ((r.sign === 'in' && amount < 0) || (r.sign === 'out' && amount > 0)) continue;
        if (r.re.test(text)) return { category: r.cat, source: 'type', detail: r.label, confidence: 0.85 };
      }
    }
    if (levels.merchant) {
      // the merchant name first, then the whole description without street names ("VIA DELL ACQUEDOTTO" is not a water bill)
      const e = dictionaryMatch(normText(t.merchant || merchant(t.desc))) || dictionaryMatch(text.replace(STREET, ' '));
      if (e) return { category: e.cat, source: 'merchant', detail: e.raw.replace('*', '') + ' (' + e.region + ')', confidence: 0.8 };
    }
    if (levels.similar) {
      const s = similar(t, opts.history);
      if (s) return { category: s.cat, source: 'similar', detail: 'similar to ' + s.label, confidence: Math.round(s.score * 70) / 100 };
    }
    return null;
  }

  // Learned rules compare merchant names without spaces, so "CONA D" and "CONAD" are the same shop.
  const compact = s => normText(s).replace(/ /g, '');
  function learnedRuleMatches(ruleText, t) {
    const r = compact(ruleText);
    if (r.length < 4) return false;
    const m = compact(t.merchant || merchant(t.desc));
    return m === r || (r.length >= 6 && m.startsWith(r));
  }

  window.YBCategorizer = { classify, merchant, normText, compact, dictionaryMatch, learnedRuleMatches, data: D, version: D.version };
})();
