const fs = require('fs');
const path = require('path');

// google-translate-api-x: Ucretsiz Google Translate - API key gerektirmez
const translate = require('google-translate-api-x');

// Same language list as translate-all.js
const languages = {
    en: 'English', tr: 'Turkish', ar: 'Arabic', de: 'German', es: 'Spanish',
    fr: 'French', pt: 'Portuguese', ru: 'Russian', zh: 'Chinese', ja: 'Japanese',
    ko: 'Korean', hi: 'Hindi', it: 'Italian', nl: 'Dutch', sv: 'Swedish',
    no: 'Norwegian', da: 'Danish', fi: 'Finnish', pl: 'Polish', cs: 'Czech',
    el: 'Greek', he: 'Hebrew', hu: 'Hungarian', ro: 'Romanian', sk: 'Slovak',
    uk: 'Ukrainian', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', th: 'Thai',
    bn: 'Bengali', ta: 'Tamil', te: 'Telugu', mr: 'Marathi', fa: 'Persian',
    ur: 'Urdu', bg: 'Bulgarian', hr: 'Croatian', sr: 'Serbian', sl: 'Slovenian',
    lt: 'Lithuanian', lv: 'Latvian', et: 'Estonian', sw: 'Swahili', af: 'Afrikaans',
    is: 'Icelandic', ga: 'Irish', mt: 'Maltese', am: 'Amharic', hy: 'Armenian',
    az: 'Azerbaijani', ka: 'Georgian', kk: 'Kazakh', uz: 'Uzbek', ky: 'Kyrgyz',
    tk: 'Turkmen', mn: 'Mongolian', my: 'Burmese', km: 'Khmer', lo: 'Lao',
    ne: 'Nepali', si: 'Sinhala', mk: 'Macedonian', sq: 'Albanian', bs: 'Bosnian',
    tl: 'Filipino', zu: 'Zulu', yo: 'Yoruba', ha: 'Hausa', ig: 'Igbo',
    ny: 'Chichewa', sn: 'Shona', so: 'Somali', mg: 'Malagasy', mi: 'Maori',
    gl: 'Galician', ca: 'Catalan', eu: 'Basque', cy: 'Welsh', gd: 'Scottish Gaelic',
    lb: 'Luxembourgish', fy: 'Frisian', pa: 'Punjabi', gu: 'Gujarati', kn: 'Kannada',
    ml: 'Malayalam', or: 'Odia', sd: 'Sindhi', ps: 'Pashto', ku: 'Kurdish',
    eo: 'Esperanto', ht: 'Haitian Creole', ceb: 'Cebuano', jw: 'Javanese',
    su: 'Sundanese', xh: 'Xhosa', yi: 'Yiddish', be: 'Belarusian', co: 'Corsican',
    la: 'Latin', sm: 'Samoan', st: 'Sesotho', tg: 'Tajik',
    // Variant locales
    'pt-BR': 'Portuguese', 'zh-CN': 'Chinese', 'zh-TW': 'Chinese'
};

// Error module directories
const errorsBasePath = path.join(__dirname, '../common/livestock-api/src/errors/locales/modules/backend');
const errorModules = ['common', 'livestocktrading'];

// ============================
// Parse .ts error file → { KEY: "value", ... }
// ============================
function parseErrorFile(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = {};

    const regex = /^\s+([\w]+):\s*"((?:[^"\\]|\\.)*)"/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
        errors[match[1]] = match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    return errors;
}

// ============================
// Write error map to .ts file
// ============================
function writeErrorFile(filePath, errors) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let output = 'export default {\n  translation: {\n    error: {';
    for (const [key, value] of Object.entries(errors)) {
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        output += `\n      ${key}: "${escaped}",`;
    }
    output += '\n    }\n  }\n};';
    fs.writeFileSync(filePath, output, 'utf8');
}

// ============================
// Google Translate code for variant locales
// ============================
function getTranslateCode(langCode) {
    const codes = {
        'pt-BR': 'pt',
        'zh-CN': 'zh-CN',
        'zh-TW': 'zh-TW',
    };
    return codes[langCode] || langCode;
}

// ============================
// Translate texts via free Google Translate (google-translate-api-x)
// Batch translate with retry and rate limiting
// ============================
async function translateTexts(texts, targetLang) {
    if (!texts.length) return [];

    const batchSize = 20; // Ucretsiz API icin daha kucuk batch
    const results = [];
    const translateCode = getTranslateCode(targetLang);

    for (let i = 0; i < texts.length; i += batchSize) {
        const chunk = texts.slice(i, i + batchSize);
        let retries = 3;

        while (retries > 0) {
            try {
                // google-translate-api-x batch ceviri destekler
                const translated = await translate(chunk, {
                    from: 'tr',
                    to: translateCode,
                });

                if (Array.isArray(translated)) {
                    results.push(...translated.map(t => t.text));
                } else {
                    results.push(translated.text);
                }

                const progress = Math.min(i + batchSize, texts.length);
                process.stdout.write(`\r    Cevriliyor: ${progress}/${texts.length}`);
                break; // basarili, donguyu kir
            } catch (error) {
                retries--;
                if (retries > 0 && (error.message.includes('429') || error.message.includes('Too Many'))) {
                    // Rate limit - bekle ve tekrar dene
                    const waitTime = (4 - retries) * 2000;
                    process.stdout.write(`\r    Rate limit, ${waitTime / 1000}s bekleniyor...`);
                    await new Promise(r => setTimeout(r, waitTime));
                } else if (retries === 0) {
                    console.error(`\n    Ceviri hatasi: ${error.message}`);
                    // Fallback: Turkce orijinal
                    results.push(...chunk);
                    break;
                }
            }
        }

        // Rate limit korumasi (ucretsiz API icin daha uzun bekleme)
        await new Promise(r => setTimeout(r, 500));
    }

    if (texts.length > 0) console.log('');
    return results;
}

// ============================
// Process a single language for a single module
// ============================
async function processLanguage(mod, langCode, trErrors, forceAll) {
    const langPath = path.join(errorsBasePath, mod, `${langCode}.ts`);
    const existing = parseErrorFile(langPath);

    const toTranslate = {};
    const preserved = {};

    for (const [key, trValue] of Object.entries(trErrors)) {
        if (forceAll) {
            toTranslate[key] = trValue;
        } else if (existing[key] && existing[key] !== trValue) {
            // Zaten cevrilmis (deger Turkce'den farkli) → koru
            preserved[key] = existing[key];
        } else {
            // Yeni key veya cevrilmemis (deger Turkce ile ayni) → cevir
            toTranslate[key] = trValue;
        }
    }

    let translatedMap = {};

    if (Object.keys(toTranslate).length > 0) {
        const keys = Object.keys(toTranslate);
        const values = Object.values(toTranslate);
        const translated = await translateTexts(values, langCode);

        keys.forEach((key, i) => {
            translatedMap[key] = translated[i];
        });
    }

    // Merge: preserved + newly translated, in tr.ts key order
    const result = {};
    for (const key of Object.keys(trErrors)) {
        if (preserved[key]) {
            result[key] = preserved[key];
        } else if (translatedMap[key]) {
            result[key] = translatedMap[key];
        } else {
            result[key] = trErrors[key];
        }
    }

    writeErrorFile(langPath, result);

    return {
        translated: Object.keys(toTranslate).length,
        preserved: Object.keys(preserved).length,
        total: Object.keys(trErrors).length,
    };
}

// ============================
// Main: translate error files
// ============================
async function translateErrors(targetLangs, forceAll = false) {
    console.log('[OK] Ucretsiz Google Translate kullaniliyor (API key gerektirmez).\n');

    for (const mod of errorModules) {
        const trPath = path.join(errorsBasePath, mod, 'tr.ts');
        const trErrors = parseErrorFile(trPath);

        if (Object.keys(trErrors).length === 0) {
            console.log(`[WARN] ${mod}/tr.ts bos veya bulunamadi, atlaniyor...`);
            continue;
        }

        console.log(`[INFO] Modul: ${mod} (${Object.keys(trErrors).length} hata kodu)`);

        let totalTranslated = 0;
        let totalPreserved = 0;

        for (const [langCode, langName] of Object.entries(targetLangs)) {
            if (langCode === 'tr') continue;

            process.stdout.write(`  ${langCode.padEnd(6)} (${langName})... `);

            const stats = await processLanguage(mod, langCode, trErrors, forceAll);

            if (stats.translated > 0) {
                console.log(`${stats.translated} cevrildi, ${stats.preserved} korundu`);
            } else {
                console.log(`guncel (${stats.preserved} ceviri korundu)`);
            }

            totalTranslated += stats.translated;
            totalPreserved += stats.preserved;

            // Diller arasi bekleme
            if (stats.translated > 0) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        console.log(`  [OK] ${mod}: ${totalTranslated} cevrildi, ${totalPreserved} korundu`);
    }
}

// ============================
// Sync mode: just add new keys with Turkish fallback (no translation)
// ============================
async function syncKeys() {
    console.log('[INFO] Sync modu: Yeni keyler Turkce fallback ile ekleniyor...\n');

    for (const mod of errorModules) {
        const trPath = path.join(errorsBasePath, mod, 'tr.ts');
        const trErrors = parseErrorFile(trPath);

        if (Object.keys(trErrors).length === 0) {
            console.log(`[WARN] ${mod}/tr.ts bos veya bulunamadi, atlaniyor...`);
            continue;
        }

        console.log(`[INFO] Modul: ${mod} (${Object.keys(trErrors).length} hata kodu)`);

        const moduleDir = path.join(errorsBasePath, mod);
        const files = fs.readdirSync(moduleDir).filter(f => f.endsWith('.ts') && f !== 'tr.ts');

        for (const file of files) {
            const langCode = file.replace('.ts', '');
            const langPath = path.join(moduleDir, file);
            const existing = parseErrorFile(langPath);

            const result = {};
            let newKeys = 0;
            let removedKeys = 0;

            for (const [key, trValue] of Object.entries(trErrors)) {
                if (existing[key]) {
                    result[key] = existing[key];
                } else {
                    result[key] = trValue;
                    newKeys++;
                }
            }

            for (const key of Object.keys(existing)) {
                if (!trErrors[key]) removedKeys++;
            }

            writeErrorFile(langPath, result);

            if (newKeys > 0 || removedKeys > 0) {
                console.log(`  ${langCode.padEnd(6)} → +${newKeys} yeni, -${removedKeys} kaldirilan`);
            }
        }

        console.log(`  [OK] ${mod} senkronize edildi.`);
    }
}

// ============================
// CLI
// ============================
const args = process.argv.slice(2);
const command = args[0];

if (command === '--all') {
    console.log('Tum hata mesajlari yeniden cevriliyor (force)...\n');
    translateErrors(languages, true).catch(console.error);

} else if (command === '--missing') {
    console.log('Cevrilmemis hata mesajlari cevriliyor...\n');
    translateErrors(languages, false).catch(console.error);

} else if (command === '--sync') {
    syncKeys().catch(console.error);

} else if (command && languages[command]) {
    console.log(`Sadece ${command} (${languages[command]}) diline cevriliyor...\n`);
    const single = { [command]: languages[command] };
    translateErrors(single, false).catch(console.error);

} else {
    console.log(`
Livestock Trading - Hata Mesajlari Ceviri Araci

Bu script backend ErrorCodeExporter tarafindan uretilen tr.ts
dosyasini kaynak alarak diger dillere cevirir.
Ucretsiz Google Translate kullanir, API key GEREKTIRMEZ.

Kullanim:
  node translate-errors.js --missing   Sadece cevrilmemis keyleri cevir (onerilen)
  node translate-errors.js --all       Tum keyleri yeniden cevir (force)
  node translate-errors.js --sync      Cevirmeden sadece yeni keyleri senkronize et
  node translate-errors.js en          Sadece Ingilizce'ye cevir
  node translate-errors.js de          Sadece Almanca'ya cevir

Nasil calisir:
  1. tr.ts dosyasini kaynak olarak okur (ErrorCodeExporter uretir)
  2. Her dil icin mevcut cevirileri korur
  3. Sadece yeni veya cevrilmemis keyleri Google Translate ile cevirir
  4. Silinen keyleri otomatik temizler

Desteklenen diller: ${Object.keys(languages).length}
  ${Object.entries(languages).map(([c, n]) => `${c}: ${n}`).join(', ')}
`);
}
