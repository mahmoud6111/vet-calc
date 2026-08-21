const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

// ─── FOOD RESTRICTION RULES ────────────────────────────────────────────────

// 1. BANNED globally in all food-producing animals
const BANNED_GENERICS = [
  'chloramphenicol',
  'metronidazole',
  'nitroimidazole',
  'nitrofurazone',
  'furazolidone',
  'dimetridazole',
  'ipronidazole',
  'clenbuterol',
  'diethylstilbestrol',
  'chlorpromazine',
];

// 2. MANUFACTURER LABEL restriction — systemic injectable aminoglycosides
const MANUFACTURER_LABEL_GENERICS = [
  'gentamicin',
  'amikacin',
  'kanamycin',
  'isoxsuprine',
];
// Streptomycin is parenteral but has MRLs in EU for some species — flag only injectables
const STREPTOMYCIN_PARENTERAL = true;

// 3. DAIRY PROHIBITED — can use in beef/non-lactating, banned in dairy milk
const DAIRY_PROHIBITED_GENERICS = [
  'phenylbutazone',
  'nitroxynil',
  'florfenicol',
  'tilmicosin',
  'tulathromycin',
];
// Fluoroquinolones in dairy — banned in lactating dairy in EU/US
const DAIRY_FQ_GENERICS = [
  'enrofloxacin',
  'marbofloxacin',
  'danofloxacin',
  'difloxacin',
  'orbifloxacin',
  'pradofloxacin',
];

// 4. APPROVED food animal drugs with standard withdrawal times
const APPROVED_WITHDRAWAL = {
  'ceftiofur': { meat: 5, milk: 0, note: 'Ceftiofur has a 0-day milk withdrawal — safe for dairy.' },
  'cefquinome': { meat: 5, milk: 24, note: 'Cefquinome: Meat 5d, Milk 24h withdrawal.' },
  'ketoprofen': { meat: 3, milk: 0, note: 'Ketoprofen: 0-day milk withdrawal in most formulations.' },
  'flunixin': { meat: 4, milk: 36, note: 'Flunixin: Meat 4d, Milk 36h. IV use in cattle only.' },
  'meloxicam': { meat: 15, milk: 120, note: 'Meloxicam: Meat 15d, Milk 5 days (120h).' },
  'oxytetracycline': { meat: 28, milk: 168, note: 'Oxytetracycline: Meat 28d, Milk 7 days (168h). LA formulas: single dose.' },
  'tylosin': { meat: 21, milk: 96, note: 'Tylosin: Meat 21d, Milk 4 days (96h). IM use.' },
  'levamisole': { meat: 7, milk: 48, note: 'Levamisole: Meat 7d, Milk 48h.' },
  'albendazole': { meat: 14, milk: 72, note: 'Albendazole: Meat 14d, Milk 72h. Avoid in 1st trimester pregnancy.' },
  'ivermectin': { meat: 49, milk: null, note: 'Ivermectin: Meat 49d. Not for use in animals producing milk for human consumption.' },
  'doramectin': { meat: 70, milk: null, note: 'Doramectin: Meat 70d. Not for use in animals producing milk for human consumption.' },
  'eprinomectin': { meat: 0, milk: 0, note: 'Eprinomectin: 0-day meat and milk withdrawal. Only avermectin approved for dairy.' },
  'closantel': { meat: 42, milk: null, note: 'Closantel: Meat 42d. Not for use in dairy animals.' },
  'rafoxanide': { meat: 28, milk: null, note: 'Rafoxanide: Meat 28d. Not for use in dairy animals.' },
  'amoxicillin': { meat: 21, milk: 48, note: 'Amoxicillin: Meat 21d, Milk 48h.' },
  'ampicillin': { meat: 21, milk: 48, note: 'Ampicillin: Meat 21d, Milk 48h.' },
  'penicillin': { meat: 30, milk: 72, note: 'Penicillin G: Meat 30d, Milk 72h.' },
  'streptomycin': { meat: 30, milk: 72, note: 'Streptomycin (parenteral): Meat 30d, Milk 72h. Note: NOT for long-term use in food animals.' },
  'sulpha': { meat: 10, milk: 96, note: 'Sulphonamides: Meat 10d, Milk 4 days (96h). Check specific product labeling.' },
  'sulfa': { meat: 10, milk: 96, note: 'Sulphonamides: Meat 10d, Milk 4 days (96h).' },
  'sulfadiazine': { meat: 10, milk: 96, note: 'Sulphadiazine: Meat 10d, Milk 4 days (96h).' },
  'sulfadimidine': { meat: 10, milk: 96, note: 'Sulphadimidine: Meat 10d, Milk 4 days (96h).' },
  'trimethoprim': { meat: 10, milk: 96, note: 'Potentiated sulpha: Meat 10d, Milk 4 days (96h).' },
  'dexamethasone': { meat: 7, milk: 72, note: 'Dexamethasone: Meat 7d, Milk 72h. ⚠️ Induces abortion in late pregnancy.' },
  'prednisolone': { meat: 7, milk: 72, note: 'Prednisolone: Meat 7d, Milk 72h.' },
  'dipyrone': { meat: 4, milk: 24, note: 'Dipyrone (metamizole): Meat 4d, Milk 24h. Check local regulations.' },
  'diclofenac': { meat: 28, milk: null, note: 'Diclofenac: Meat 28d. Not recommended for dairy animals.' },
  'neomycin': { meat: 30, milk: 72, note: 'Oral neomycin: Meat 30d, Milk 72h. Topical/oral only — systemic not approved for food animals.' },
  'lincomycin': { meat: 7, milk: null, note: 'Lincomycin: Meat 7d. Not for dairy cattle.' },
  'spectinomycin': { meat: 7, milk: null, note: 'Spectinomycin: Meat 7d. Not established for dairy.' },
  'tiamulin': { meat: 7, milk: null, note: 'Tiamulin: Meat 7d. Swine and poultry primarily.' },
  'amprolium': { meat: 1, milk: 0, note: 'Amprolium: Meat 1d, Milk 0h. Safe for dairy calves.' },
  'decoquinate': { meat: 0, milk: 0, note: 'Decoquinate: 0-day withdrawal.' },
  'lasalocid': { meat: 5, milk: null, note: 'Lasalocid (ionophore): Meat 5d. NOT for dairy cattle.' },
  'monensin': { meat: 0, milk: null, note: 'Monensin (ionophore): 0-day meat. NOT for dairy cattle in US. Check local label.' },
  'fenbendazole': { meat: 7, milk: 0, note: 'Fenbendazole: Meat 7d, Milk 0 days. Safe for dairy.' },
  'oxfendazole': { meat: 7, milk: 120, note: 'Oxfendazole: Meat 7d, Milk 5 days (120h).' },
  'thiabendazole': { meat: 3, milk: 96, note: 'Thiabendazole: Meat 3d, Milk 4 days (96h).' },
  'mebendazole': { meat: 14, milk: null, note: 'Mebendazole: Meat 14d.' },
  'praziquantel': { meat: 14, milk: null, note: 'Praziquantel: Meat 14d.' },
  'calcium': { meat: 0, milk: 0, note: 'Calcium products: No withdrawal required.' },
  'vitamin': { meat: 0, milk: 0, note: 'Vitamin products: No withdrawal required in standard doses.' },
  'magnesium': { meat: 0, milk: 0, note: 'Magnesium products: No withdrawal required.' },
  'selenium': { meat: 30, milk: 48, note: 'Selenium: Meat 30d, Milk 48h. Risk of toxicity above label doses.' },
  'sorbitol': { meat: 0, milk: 0, note: 'Sorbitol: No withdrawal required.' },
  'oxytocin': { meat: 0, milk: 0, note: 'Oxytocin: No withdrawal required.' },
  'prostaglandin': { meat: 0, milk: 0, note: 'Prostaglandin products: No withdrawal required.' },
  'gnrh': { meat: 0, milk: 0, note: 'GnRH: No withdrawal required.' },
  'butylscopolamine': { meat: 0, milk: 0, note: 'Butylscopolamine: 0 withdrawal days.' },
  'lidocaine': { meat: 0, milk: 0, note: 'Lidocaine (local anaesthetic): No withdrawal when used as directed.' },
  'xylazine': { meat: 3, milk: 24, note: 'Xylazine: Meat 3d, Milk 24h (check local label).' },
  'atropine': { meat: 0, milk: 0, note: 'Atropine: No withdrawal required.' },
};

// Food animal species list
const FOOD_ANIMAL_SPECIES = ['cattle', 'sheep_goat', 'camel', 'large_animal', 'poultry'];

let updatedCount = 0;
let bannedCount = 0;
let manufacturerCount = 0;
let dairyCount = 0;
let approvedCount = 0;
let noChangeCount = 0;

const processedMeds = meds.map(med => {
  const m = { ...med };
  const genericLower = (m.generic_name || '').toLowerCase();
  const brandLower = (m.brand_name || '').toLowerCase();
  const formLower = (m.dosage_form || '').toLowerCase();
  const notesLower = (m.notes || '').toLowerCase();
  const isFoodAnimalSpecies = FOOD_ANIMAL_SPECIES.includes(m.species);

  // Already has restriction? Skip recalculation unless we want to override
  // We ALWAYS override to ensure accuracy

  // ── Check BANNED ───────────────────────────────────────────────────────────
  const isBanned = BANNED_GENERICS.some(bg => genericLower.includes(bg)) ||
                   notesLower.includes('carcinogenic') && isFoodAnimalSpecies;

  if (isBanned) {
    m.food_restriction = 'banned';
    m.meat_withdrawal_days = null;
    m.milk_withdrawal_hours = null;
    m.food_restriction_note = `BANNED in all food-producing animals worldwide (EU Reg 37/2010, FDA CVM). Never use in animals entering the food chain.`;
    bannedCount++;
    updatedCount++;
    return m;
  }

  // ── Check MANUFACTURER LABEL (systemic injectable aminoglycosides) ─────────
  const isAminoglycoside = MANUFACTURER_LABEL_GENERICS.some(mg => genericLower.includes(mg));
  const isParenteralStreptomycin = genericLower.includes('streptomycin') && 
                                    (formLower.includes('injectable') || m.route === 'IM' || m.route === 'IV' || m.route === 'SC');

  if ((isAminoglycoside && (formLower.includes('injectable') || m.route === 'IV' || m.route === 'IM' || m.route === 'SC'))
      || isParenteralStreptomycin) {
    m.food_restriction = 'manufacturer_label';
    m.meat_withdrawal_days = null;
    m.milk_withdrawal_hours = null;
    m.food_restriction_note = `Manufacturer Restriction: Not approved for food-producing animals. Systemic aminoglycosides (gentamicin/amikacin/kanamycin/streptomycin) accumulate irreversibly in renal cortical lysosomes of ruminants — residues persist 18–24 months. Approved for: Horses (non-food equines), Dogs, Cats. FARAD: If used extralabel in non-food breeding animals, minimum 24-month withdrawal applies.`;
    manufacturerCount++;
    updatedCount++;
    return m;
  }

  // ── Check DAIRY PROHIBITED ─────────────────────────────────────────────────
  const isDairyProhibited = DAIRY_PROHIBITED_GENERICS.some(dp => genericLower.includes(dp));
  const isDairyFQ = DAIRY_FQ_GENERICS.some(fq => genericLower.includes(fq));

  if (isDairyProhibited || isDairyFQ) {
    // Set specific withdrawal and dairy note
    let meatDays = null;
    let milkHours = null;
    let dairyNote = '';

    if (genericLower.includes('phenylbutazone')) {
      meatDays = 28; milkHours = null;
      dairyNote = `Phenylbutazone: STRICTLY PROHIBITED in female dairy cattle ≥20 months (causes human aplastic anemia risk via residues — FDA, EU). Meat: 28-day W/D in beef cattle. Do NOT use in animals producing milk for human consumption.`;
    } else if (genericLower.includes('nitroxynil')) {
      meatDays = 60; milkHours = null;
      dairyNote = `Nitroxynil: Meat W/D 60 days. PROHIBITED in animals producing milk for human consumption (excreted in milk for months — no established MRL in milk).`;
    } else if (genericLower.includes('florfenicol')) {
      meatDays = 28; milkHours = null;
      dairyNote = `Florfenicol: Meat W/D 28d (IM). PROHIBITED in female dairy cattle ≥20 months and in animals producing milk for human consumption (EU Reg 37/2010, FDA). ⚠️ NEVER administer by IV route.`;
    } else if (genericLower.includes('tilmicosin')) {
      meatDays = 42; milkHours = null;
      dairyNote = `Tilmicosin: Meat W/D 42 days (SC). PROHIBITED in lactating dairy cattle. ⚠️ FATAL if administered IV or to horses/dogs. SC use only in cattle and sheep.`;
    } else if (genericLower.includes('tulathromycin')) {
      meatDays = 49; milkHours = null;
      dairyNote = `Tulathromycin: Meat W/D 49 days. Not for use in female dairy cattle producing milk for human consumption (no established milk MRL).`;
    } else if (isDairyFQ) {
      meatDays = 28; milkHours = null;
      dairyNote = `Fluoroquinolone: Prohibited in lactating dairy cattle producing milk for human consumption (EU/US regulations — no established milk MRL). Meat W/D: 14–28 days depending on product. For beef cattle only.`;
    } else {
      meatDays = 28; milkHours = null;
      dairyNote = `Dairy-prohibited: Do not use in animals producing milk for human consumption.`;
    }

    m.food_restriction = 'dairy_prohibited';
    m.meat_withdrawal_days = meatDays;
    m.milk_withdrawal_hours = milkHours;
    m.food_restriction_note = dairyNote;
    dairyCount++;
    updatedCount++;
    return m;
  }

  // ── Check APPROVED with withdrawal times ───────────────────────────────────
  let matchedApproved = null;
  for (const [key, wdData] of Object.entries(APPROVED_WITHDRAWAL)) {
    if (genericLower.includes(key)) {
      matchedApproved = wdData;
      break;
    }
  }

  if (matchedApproved && isFoodAnimalSpecies) {
    m.food_restriction = 'none';
    m.meat_withdrawal_days = matchedApproved.meat;
    m.milk_withdrawal_hours = matchedApproved.milk;
    m.food_restriction_note = matchedApproved.note;
    approvedCount++;
    updatedCount++;
    return m;
  }

  // ── No restriction needed (small animals, topicals, etc.) ─────────────────
  if (!m.food_restriction) {
    m.food_restriction = 'none';
    m.meat_withdrawal_days = null;
    m.milk_withdrawal_hours = null;
    m.food_restriction_note = null;
    noChangeCount++;
  }

  return m;
});

console.log(`\n=== Food Safety Enrichment Results ===`);
console.log(`Total medications: ${meds.length}`);
console.log(`  BANNED:              ${bannedCount}`);
console.log(`  Manufacturer label:  ${manufacturerCount}`);
console.log(`  Dairy prohibited:    ${dairyCount}`);
console.log(`  Approved with W/D:   ${approvedCount}`);
console.log(`  No restriction:      ${noChangeCount}`);
console.log(`  Total updated:       ${updatedCount}`);

// Save to default-medications.js
const defaultMedsPath = path.join(__dirname, '..', 'default-medications.js');
const jsOutput = `// Large default medications database for VetCalc\nwindow.DEFAULT_MEDICATIONS = ${JSON.stringify(processedMeds, null, 6)};\n`;
fs.writeFileSync(defaultMedsPath, jsOutput, 'utf8');
console.log(`\nSaved → ${defaultMedsPath}`);

// Save CSV
const headers = [
  'id', 'brand_name', 'generic_name', 'species',
  'dose_mg_per_kg_min', 'dose_mg_per_kg_max',
  'concentration_value', 'concentration_unit', 'concentration_ml',
  'dosage_form', 'route', 'frequency', 'unit_description',
  'food_restriction', 'meat_withdrawal_days', 'milk_withdrawal_hours',
  'notes'
];
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  return `"${String(val).replace(/"/g, '""')}"`;
}
const csvRows = [headers.join(',')];
for (const med of processedMeds) {
  csvRows.push(headers.map(h => escapeCsv(med[h])).join(','));
}
const csvPath = path.join(__dirname, '..', 'medications_new.csv');
fs.writeFileSync(csvPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
console.log(`Saved → ${csvPath}`);
