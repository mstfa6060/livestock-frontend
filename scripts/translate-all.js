const fs = require('fs');
const path = require('path');
const { Translate } = require('@google-cloud/translate').v2;

// Google Cloud Translation API Key - loaded from environment variable
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
if (!API_KEY) {
    console.error('GOOGLE_TRANSLATE_API_KEY env variable gerekli. .env.local dosyasına ekleyin.');
    process.exit(1);
}

const translate = new Translate({
    key: API_KEY,
});

// 50 Hedef Dil
const languages = {
    en: 'English',
    tr: 'Turkish',
    ar: 'Arabic',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    hi: 'Hindi',
    it: 'Italian',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
    pl: 'Polish',
    cs: 'Czech',
    el: 'Greek',
    he: 'Hebrew',
    hu: 'Hungarian',
    ro: 'Romanian',
    sk: 'Slovak',
    uk: 'Ukrainian',
    vi: 'Vietnamese',
    id: 'Indonesian',
    ms: 'Malay',
    th: 'Thai',
    bn: 'Bengali',
    ta: 'Tamil',
    te: 'Telugu',
    mr: 'Marathi',
    fa: 'Persian',
    ur: 'Urdu',
    bg: 'Bulgarian',
    hr: 'Croatian',
    sr: 'Serbian',
    sl: 'Slovenian',
    lt: 'Lithuanian',
    lv: 'Latvian',
    et: 'Estonian',
    sw: 'Swahili',
    af: 'Afrikaans',
    is: 'Icelandic',
    ga: 'Irish',
    mt: 'Maltese',
    am: 'Amharic',
    hy: 'Armenian'
};

// Dosya yollari
const messagesDir = path.join(__dirname, '../messages');
const sourceFile = path.join(messagesDir, 'tr.json');

// Turkce kaynak dosyayi oku
function readSourceFile() {
    try {
        const content = fs.readFileSync(sourceFile, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('tr.json dosyasi okunamadi:', error.message);
        process.exit(1);
    }
}

// Nested objeyi duzlestir (flatten)
function flattenObject(obj, prefix = '') {
    let result = {};
    for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(result, flattenObject(obj[key], newKey));
        } else {
            result[newKey] = obj[key];
        }
    }
    return result;
}

// Duz objeyi nested hale getir (unflatten)
function unflattenObject(flatObj) {
    const result = {};
    for (const flatKey in flatObj) {
        const keys = flatKey.split('.');
        let current = result;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = flatObj[flatKey];
    }
    return result;
}

// Metinleri batch halinde cevir
async function translateTexts(texts, targetLang, batchSize = 100) {
    const results = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const chunk = texts.slice(i, i + batchSize);

        try {
            const [translated] = await translate.translate(chunk, {
                from: 'tr',
                to: targetLang,
            });

            if (Array.isArray(translated)) {
                results.push(...translated);
            } else {
                results.push(translated);
            }

            // Ilerleme goster
            const progress = Math.min(i + batchSize, texts.length);
            process.stdout.write(`\r  Cevriliyor: ${progress}/${texts.length}`);

        } catch (error) {
            console.error(`\n  API hatasi: ${error.message}`);
            // Hata durumunda orijinal metni kullan
            results.push(...chunk);
        }

        // Rate limit korunmasi
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(''); // Yeni satir
    return results;
}

// Bir dile ceviri yap
async function translateToLanguage(langCode, langName) {
    console.log(`\n${langCode.toUpperCase()} (${langName}) diline cevriliyor...`);

    // Kaynak veriyi oku
    const sourceData = readSourceFile();
    const flatData = flattenObject(sourceData);
    const keys = Object.keys(flatData);
    const values = Object.values(flatData);

    console.log(`  Toplam ifade: ${keys.length}`);

    // Cevir
    const translatedValues = await translateTexts(values, langCode);

    // Sonuclari birlestir
    const translatedObj = {};
    keys.forEach((key, i) => {
        translatedObj[key] = translatedValues[i];
    });

    // Nested yapiya donustur
    const nested = unflattenObject(translatedObj);

    // JSON dosyasina kaydet
    const outputPath = path.join(messagesDir, `${langCode}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(nested, null, 2), 'utf8');

    console.log(`  ${langCode}.json olusturuldu`);
}

// Sadece eksik dilleri cevir
async function translateMissing() {
    console.log('Eksik dil dosyalari kontrol ediliyor...\n');

    const existingFiles = fs.readdirSync(messagesDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));

    const missingLanguages = Object.entries(languages)
        .filter(([code]) => !existingFiles.includes(code) && code !== 'tr');

    if (missingLanguages.length === 0) {
        console.log('Tum dil dosyalari mevcut!');
        return;
    }

    console.log(`Eksik diller: ${missingLanguages.map(([c]) => c).join(', ')}\n`);

    for (const [langCode, langName] of missingLanguages) {
        await translateToLanguage(langCode, langName);
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\nTum eksik ceviriler tamamlandi!');
}

// Tum dilleri cevir (tr haric)
async function translateAll() {
    console.log('Tum dillere ceviri baslatiliyor...\n');
    console.log(`Kaynak: tr.json`);
    console.log(`Hedef: ${Object.keys(languages).length - 1} dil\n`);

    for (const [langCode, langName] of Object.entries(languages)) {
        if (langCode === 'tr') continue; // Turkce kaynaktir, atla

        await translateToLanguage(langCode, langName);
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n Tum ceviriler tamamlandi!');
}

// Tek bir dili cevir
async function translateSingle(langCode) {
    if (!languages[langCode]) {
        console.error(`Gecersiz dil kodu: ${langCode}`);
        console.log('Gecerli kodlar:', Object.keys(languages).join(', '));
        process.exit(1);
    }

    await translateToLanguage(langCode, languages[langCode]);
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === '--all') {
    translateAll().catch(console.error);
} else if (command === '--missing') {
    translateMissing().catch(console.error);
} else if (command && languages[command]) {
    translateSingle(command).catch(console.error);
} else {
    console.log(`
Livestock Trading - Ceviri Araci

Kullanim:
  node translate-all.js --all       Tum dillere cevir (${Object.keys(languages).length - 1} dil)
  node translate-all.js --missing   Sadece eksik dilleri cevir
  node translate-all.js en          Sadece Ingilizce'ye cevir
  node translate-all.js de          Sadece Almanca'ya cevir

Desteklenen diller:
  ${Object.entries(languages).map(([c, n]) => `${c}: ${n}`).join('\n  ')}

Oncesinde:
  1. Google Cloud Console'dan Translation API aktif edin
  2. API Key olusturun
  3. API_KEY degiskenini guncelleyin veya:
     set GOOGLE_TRANSLATE_API_KEY=your_key_here (Windows)
     export GOOGLE_TRANSLATE_API_KEY=your_key_here (Linux/Mac)
`);
}
