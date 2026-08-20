const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

// Comprehensive dictionary of Species-Specific Doses & Contraindications
// Sources: Plumb's Veterinary Drug Handbook (9th Edition), Merck Veterinary Manual, NOAH Compendium, FARAD

const SPECIES_DOSING_RULES = {
  'phenylbutazone': {
    horse: { min: 2.2, max: 4.4, freq: 'q12-24h (taper after day 1)', route: 'IV or PO' },
    cattle: { min: 4.4, max: 8.8, freq: 'q48h (beef only)', route: 'IV (Strictly prohibited in female dairy cattle >20mo)' },
    dog: { min: 7, max: 7, freq: 'q8h', route: 'PO (max 800mg/day with food)' },
    cat: { contraindicated: true, warning: '⛔ Strictly CONTRAINDICATED in cats due to high risk of severe toxicity and renal failure.' },
    poultry: { contraindicated: true, warning: '⛔ Strictly contraindicated in poultry / food-producing birds.' }
  },
  'flunixin meglumine': {
    horse: { min: 1.1, max: 1.1, freq: 'q12-24h', route: 'IV or IM (Visceral pain/colic & endotoxemia)' },
    cattle: { min: 1.1, max: 2.2, freq: 'q24h (max 3 days)', route: 'IV (Meat w/d: 4d, Milk w/d: 36h)' },
    sheep_goat: { min: 1.1, max: 2.2, freq: 'q24h', route: 'IV or IM' },
    camel: { min: 1.1, max: 2.2, freq: 'q24h', route: 'IV' },
    dog: { min: 0.5, max: 1.0, freq: 'Single dose only', route: 'IV or SC (Do not repeat due to severe GI ulcer risk)' },
    cat: { contraindicated: true, warning: '⛔ Contraindicated in cats (high risk of fatal GI ulceration and renal failure).' }
  },
  'meloxicam': {
    cattle: { min: 0.5, max: 0.5, freq: 'Single dose', route: 'SC or IV (Meat w/d: 15d, Milk w/d: 5d)' },
    horse: { min: 0.6, max: 0.6, freq: 'q24h', route: 'IV or PO' },
    sheep_goat: { min: 0.5, max: 0.5, freq: 'Single dose', route: 'SC or PO' },
    camel: { min: 0.5, max: 0.5, freq: 'Single dose', route: 'SC or IV' },
    dog: { min: 0.1, max: 0.2, freq: '0.2 mg/kg day 1, then 0.1 mg/kg q24h', route: 'PO or SC' },
    cat: { min: 0.05, max: 0.1, freq: '0.1-0.2 mg/kg single SC dose, or 0.05 mg/kg PO q24-48h', route: 'SC or PO' },
    poultry: { min: 0.5, max: 1.0, freq: 'q12-24h', route: 'PO or IM' }
  },
  'ketoprofen': {
    cattle: { min: 3.0, max: 3.0, freq: 'q24h for 1-3 days', route: 'IV or deep IM (0-day milk withdrawal!)' },
    horse: { min: 2.2, max: 2.2, freq: 'q24h for 3-5 days', route: 'IV' },
    sheep_goat: { min: 3.0, max: 3.0, freq: 'q24h', route: 'IM or IV' },
    camel: { min: 3.0, max: 3.0, freq: 'q24h', route: 'IM or IV' },
    dog: { min: 1.0, max: 2.0, freq: 'q24h (max 3-5 days)', route: 'PO, SC or IM' },
    cat: { min: 1.0, max: 2.0, freq: 'q24h (max 1-2 days)', route: 'PO or SC' }
  },
  'diclofenac sodium': {
    cattle: { min: 1.0, max: 2.5, freq: 'q24h (1-3 days)', route: 'Deep IM (Meat w/d: 28d)' },
    horse: { min: 1.0, max: 2.5, freq: 'q24h', route: 'IM or IV' },
    sheep_goat: { min: 1.0, max: 2.0, freq: 'q24h', route: 'IM' },
    camel: { min: 1.0, max: 2.0, freq: 'q24h', route: 'IM' },
    dog: { contraindicated: true, warning: '⛔ NOT recommended in dogs (high incidence of severe gastrointestinal perforation).' },
    cat: { contraindicated: true, warning: '⛔ Strictly CONTRAINDICATED in cats.' }
  },
  'dipyrone': {
    cattle: { min: 10.0, max: 25.0, freq: 'q8-12h', route: 'IV or deep IM' },
    horse: { min: 10.0, max: 20.0, freq: 'q8-12h (Spasmodic colic)', route: 'Slow IV or IM' },
    sheep_goat: { min: 10.0, max: 20.0, freq: 'q8-12h', route: 'IM' },
    camel: { min: 10.0, max: 25.0, freq: 'q8-12h', route: 'IV or IM' },
    dog: { min: 25.0, max: 50.0, freq: 'q8-12h', route: 'SC, IM or IV' },
    cat: { min: 10.0, max: 25.0, freq: 'q12-24h (use with caution)', route: 'SC' }
  },
  'dexamethasone': {
    cattle: { min: 0.02, max: 0.1, freq: 'Single dose / q24h', route: 'IV or IM (⚠️ Induces abortion in late pregnancy!)' },
    horse: { min: 0.02, max: 0.05, freq: 'q24h', route: 'IV or IM' },
    sheep_goat: { min: 0.02, max: 0.1, freq: 'Single dose', route: 'IM (⚠️ Induces abortion!)' },
    camel: { min: 0.02, max: 0.05, freq: 'q24h', route: 'IV or IM' },
    dog: { min: 0.05, max: 0.2, freq: 'q12-24h', route: 'IV, IM or SC' },
    cat: { min: 0.05, max: 0.2, freq: 'q12-24h', route: 'IV, IM or SC' }
  },
  'gentamicin': {
    cattle: { min: 5.0, max: 6.6, freq: 'q24h', route: 'IV or IM (Meat w/d: 40d; extended in calves)' },
    horse: { min: 6.6, max: 6.6, freq: 'q24h', route: 'IV or IM' },
    sheep_goat: { min: 5.0, max: 6.6, freq: 'q24h', route: 'IV or IM' },
    camel: { min: 5.0, max: 6.6, freq: 'q24h', route: 'IV or IM' },
    dog: { min: 5.0, max: 8.0, freq: 'q24h', route: 'IV, SC or IM' },
    cat: { min: 5.0, max: 8.0, freq: 'q24h', route: 'IV, SC or IM' }
  },
  'oxytetracycline': {
    cattle: { min: 10.0, max: 20.0, freq: 'LA (200mg/ml): 20 mg/kg single dose; Standard: 10 mg/kg q24h', route: 'IM or slow IV (Meat w/d: 28d, Milk w/d: 7d)' },
    sheep_goat: { min: 10.0, max: 20.0, freq: 'LA: 20 mg/kg single dose; Standard: 10 mg/kg q24h', route: 'IM' },
    camel: { min: 10.0, max: 20.0, freq: 'LA: 20 mg/kg single dose', route: 'IM' },
    horse: { min: 5.0, max: 10.0, freq: 'q24h (give slowly in large IV volume)', route: 'Slow IV ONLY (Avoid IM/rapid IV)' },
    dog: { min: 10.0, max: 20.0, freq: 'q8-12h', route: 'PO, SC or IM' },
    cat: { min: 10.0, max: 20.0, freq: 'q8-12h', route: 'PO, SC or IM' },
    poultry: { min: 20.0, max: 50.0, freq: 'In water/feed', route: 'PO' }
  },
  'florfenicol': {
    cattle: { min: 20.0, max: 40.0, freq: '20 mg/kg IM q48h (2 doses) OR 40 mg/kg SC single dose', route: 'IM or SC (⚠️ NEVER GIVE IV. Prohibited in lactating dairy)' },
    sheep_goat: { min: 20.0, max: 40.0, freq: '20 mg/kg IM q48h or 40 mg/kg SC once', route: 'IM or SC' },
    camel: { min: 20.0, max: 40.0, freq: '20 mg/kg IM q48h', route: 'IM or SC' },
    horse: { contraindicated: true, warning: '⛔ Strictly CONTRAINDICATED in horses (causes severe, often fatal acute colitis and dysbiosis).' },
    dog: { min: 20.0, max: 30.0, freq: 'q12-24h (refractory cases)', route: 'PO or SC' },
    cat: { min: 20.0, max: 25.0, freq: 'q12-24h', route: 'PO or SC' }
  },
  'tilmicosin': {
    cattle: { min: 10.0, max: 10.0, freq: 'Single dose', route: 'SC ONLY (⚠️ LETHAL IF GIVEN IV! Meat w/d: 42d)' },
    sheep_goat: { min: 10.0, max: 10.0, freq: 'Single dose', route: 'SC ONLY (⚠️ LETHAL IV!)' },
    horse: { contraindicated: true, warning: '⛔ FATAL in horses! Tilmicosin induces lethal cardiovascular collapse in equines.' },
    dog: { contraindicated: true, warning: '⛔ Contraindicated in dogs (cardiotoxic).' },
    cat: { contraindicated: true, warning: '⛔ Contraindicated in cats.' }
  },
  'enrofloxacin': {
    cattle: { min: 2.5, max: 5.0, freq: '2.5-5 mg/kg q24h or 7.5-12.5 mg/kg single SC dose', route: 'SC or IM (Prohibited in lactating dairy cattle)' },
    sheep_goat: { min: 2.5, max: 5.0, freq: 'q24h for 3-5 days', route: 'SC or IM' },
    camel: { min: 2.5, max: 5.0, freq: 'q24h', route: 'SC or IM' },
    dog: { min: 5.0, max: 10.0, freq: 'q24h or divided q12h', route: 'PO, SC or IM' },
    cat: { min: 5.0, max: 5.0, freq: 'q24h (⚠️ DO NOT EXCEED 5 mg/kg due to irreversible feline retinal blindness!)', route: 'PO or SC' },
    poultry: { min: 10.0, max: 15.0, freq: 'In drinking water for 3-5 days', route: 'PO' }
  },
  'marbofloxacin': {
    cattle: { min: 2.0, max: 8.0, freq: '2 mg/kg q24h x 3-5d OR 8 mg/kg IM single dose', route: 'IM, SC or IV (Meat w/d: 6d, Milk w/d: 36h)' },
    sheep_goat: { min: 2.0, max: 2.0, freq: 'q24h', route: 'IM or SC' },
    camel: { min: 2.0, max: 2.0, freq: 'q24h', route: 'IM or SC' },
    dog: { min: 2.75, max: 5.5, freq: 'q24h', route: 'PO, SC or IV' },
    cat: { min: 2.75, max: 5.5, freq: 'q24h', route: 'PO, SC or IV' }
  },
  'ivermectin': {
    cattle: { min: 0.2, max: 0.2, freq: '1 ml/50 kg single dose', route: 'SC (Meat w/d: 35-49d; avoid dairy)' },
    sheep_goat: { min: 0.2, max: 0.2, freq: '1 ml/50 kg single dose', route: 'SC' },
    camel: { min: 0.2, max: 0.2, freq: '1 ml/50 kg single dose', route: 'SC' },
    horse: { min: 0.2, max: 0.2, freq: 'Single dose', route: 'PO paste ONLY (Avoid IM/IV injection!)' },
    dog: { min: 0.05, max: 0.2, freq: 'Single dose (⚠️ Verify MDR1 status in Collies/Shepherds!)', route: 'PO or SC' },
    cat: { min: 0.2, max: 0.4, freq: 'Single dose', route: 'PO or SC' }
  },
  'albendazole': {
    cattle: { min: 7.5, max: 10.0, freq: '7.5-10 mg/kg roundworms; 10-15 mg/kg liver flukes', route: 'PO (⚠️ Contraindicated in 1st trimester pregnancy!)' },
    sheep_goat: { min: 5.0, max: 7.5, freq: '5-7.5 mg/kg roundworms; 7.5-10 mg/kg flukes', route: 'PO (⚠️ Avoid 1st trimester)' },
    camel: { min: 7.5, max: 10.0, freq: 'Single dose', route: 'PO' },
    dog: { min: 25.0, max: 50.0, freq: 'q12h for 3-5 days (Giardia/parasites)', route: 'PO' },
    cat: { min: 25.0, max: 50.0, freq: 'q12-24h for 3-5 days', route: 'PO' }
  },
  'levamisole': {
    cattle: { min: 7.5, max: 7.5, freq: '1 ml/10 kg (of 7.5% sol) single dose', route: 'SC or PO (Meat w/d: 3-7d, Milk w/d: 48h)' },
    sheep_goat: { min: 7.5, max: 7.5, freq: 'Single dose', route: 'SC or PO' },
    camel: { min: 5.0, max: 7.5, freq: 'Single dose', route: 'SC or PO' },
    horse: { contraindicated: true, warning: '⛔ Not recommended in horses (narrow therapeutic index, CNS toxicity).' },
    dog: { min: 2.0, max: 5.0, freq: 'Immune stimulant / microfilaricide', route: 'PO' },
    cat: { contraindicated: true, warning: '⛔ Narrow margin of safety in cats.' }
  },
  'ceftiofur': {
    cattle: { min: 1.1, max: 2.2, freq: 'q24h for 3-5 days', route: 'IM or SC (0-DAY MILK WITHDRAWAL!)' },
    horse: { min: 2.2, max: 4.4, freq: 'q12-24h', route: 'IM or IV' },
    sheep_goat: { min: 1.1, max: 2.2, freq: 'q24h', route: 'IM or SC' },
    camel: { min: 1.1, max: 2.2, freq: 'q24h', route: 'IM or SC' },
    dog: { min: 2.2, max: 4.4, freq: 'q24h', route: 'SC or IM' }
  },
  'tylosin': {
    cattle: { min: 10.0, max: 20.0, freq: 'q24h (max 5 days)', route: 'IM (Meat w/d: 21d, Milk w/d: 4d)' },
    sheep_goat: { min: 10.0, max: 10.0, freq: 'q24h', route: 'IM' },
    camel: { min: 10.0, max: 10.0, freq: 'q24h', route: 'IM' },
    horse: { contraindicated: true, warning: '⛔ Strictly CONTRAINDICATED in horses (causes severe, often fatal clostridial enteritis).' },
    dog: { min: 10.0, max: 25.0, freq: 'q12h (Tylosin-responsive enteropathy)', route: 'PO' },
    cat: { min: 10.0, max: 20.0, freq: 'q12h', route: 'PO' },
    poultry: { min: 20.0, max: 50.0, freq: 'In water for CRD', route: 'PO' }
  },
  'nitroxynil': {
    cattle: { min: 10.0, max: 13.0, freq: '1 ml/34 kg (of 34% sol) single SC dose', route: 'SC ONLY (Meat w/d: 60d; strictly prohibited in dairy milk)' },
    sheep_goat: { min: 10.0, max: 13.0, freq: '1 ml/34 kg single dose', route: 'SC ONLY' },
    camel: { min: 10.0, max: 10.0, freq: 'Single dose', route: 'SC' },
    horse: { contraindicated: true, warning: '⛔ Not indicated in horses.' },
    dog: { contraindicated: true, warning: '⛔ Contraindicated in small animals.' },
    cat: { contraindicated: true, warning: '⛔ Contraindicated in cats.' }
  },
  'rafoxanide': {
    cattle: { min: 7.5, max: 7.5, freq: 'Single dose', route: 'PO or SC (Meat w/d: 28d; avoid dairy)' },
    sheep_goat: { min: 7.5, max: 7.5, freq: 'Single dose (Fasciola & nasal bots)', route: 'PO or SC' },
    camel: { min: 7.5, max: 7.5, freq: 'Single dose', route: 'PO' },
    horse: { contraindicated: true, warning: '⛔ Contraindicated in horses.' },
    dog: { contraindicated: true, warning: '⛔ Contraindicated in dogs.' },
    cat: { contraindicated: true, warning: '⛔ Contraindicated in cats.' }
  },
  'amprolium': {
    cattle: { min: 5.0, max: 10.0, freq: 'Prevention: 5 mg/kg x 21d; Treatment: 10 mg/kg x 5d', route: 'PO drench or in feed' },
    sheep_goat: { min: 5.0, max: 10.0, freq: '5-10 mg/kg PO daily x 5d', route: 'PO' },
    poultry: { min: 10.0, max: 20.0, freq: '125-250 ppm in drinking water for 5-7 days', route: 'PO (in water)' },
    dog: { min: 100.0, max: 200.0, freq: 'q24h for 7 days (Coccidiosis)', route: 'PO' },
    cat: { min: 100.0, max: 200.0, freq: 'q24h for 7 days', route: 'PO' }
  }
};

// Parse concentration from product text
function extractCommercialConcentration(med) {
  const brand = med.brand_name || '';
  const desc = med.unit_description || '';
  const notes = med.notes || '';
  const generic = (med.generic_name || '').toLowerCase();
  const text = `${brand} ${desc} ${notes}`;

  // Check for percentage in brand name (e.g. "20%", "5%", "10%", "2.5%", "1%", "34%", "50%", "30%", "25%")
  const percentMatch = brand.match(/(\d+(?:\.\d+)?)\s*%/i) || desc.match(/(\d+(?:\.\d+)?)\s*%/i);
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1]);
    if (pct > 0 && pct <= 100) {
      return pct * 10; // 1% = 10 mg/ml, 20% = 200 mg/ml
    }
  }

  // Check for "X gm / 100 ml" in notes
  const g100Match = notes.match(/(\d+(?:\.\d+)?)\s*(?:gm|g|gram|grams)\s*(?:in|\/|per|each)\s*100\s*ml/i) ||
                    notes.match(/each\s*100\s*ml\s*contains:?\s*[-:]?\s*[^,.\n]+?\s*(\d+(?:\.\d+)?)\s*(?:gm|g|gram|grams)/i);
  if (g100Match) {
    const grams = parseFloat(g100Match[1]);
    if (grams > 0 && grams <= 100) {
      return (grams * 1000) / 100; // 20 gm / 100 ml = 200 mg/ml
    }
  }

  // Check for "X mg / ml" in notes
  const mgMlMatch = notes.match(/(\d+(?:\.\d+)?)\s*mg\s*\/\s*ml/i) ||
                    notes.match(/each\s*1\s*ml\s*contains:?\s*[-:]?\s*[^,.\n]+?\s*(\d+(?:\.\d+)?)\s*mg/i);
  if (mgMlMatch) {
    const mg = parseFloat(mgMlMatch[1]);
    if (mg > 0 && mg <= 1000) {
      return mg;
    }
  }

  // Standard veterinary defaults by active ingredient if concentration_value was 100 placeholder
  if (generic.includes('ivermectin') && !generic.includes('nitroxynil')) {
    return 10; // Standard 1% Ivermectin = 10 mg/ml
  }
  if (generic.includes('doramectin')) {
    return 10; // Standard 1% Doramectin = 10 mg/ml
  }
  if (generic.includes('florfenicol')) {
    return 300; // Standard 30% Florfenicol = 300 mg/ml
  }
  if (generic.includes('phenylbutazone')) {
    return 200; // Standard 20% Phenylbutazone = 200 mg/ml
  }
  if (generic.includes('dipyrone') || generic.includes('metamizole')) {
    return 500; // Standard 50% Dipyrone = 500 mg/ml
  }
  if (generic.includes('tilmicosin')) {
    return 300; // Standard 30% Tilmicosin = 300 mg/ml
  }
  if (generic.includes('tylosin')) {
    return 200; // Standard 20% Tylosin = 200 mg/ml
  }
  if (generic.includes('flunixin')) {
    return 50; // Standard 5% Flunixin Meglumine = 50 mg/ml
  }
  if (generic.includes('ketoprofen')) {
    return 100; // Standard 10% Ketoprofen = 100 mg/ml
  }
  if (generic.includes('meloxicam')) {
    if (/20|2%/i.test(text)) return 20;
    if (/5|0.5%/i.test(text)) return 5;
    return 20; // Standard 20 mg/ml for large animals
  }
  if (generic.includes('nitroxynil')) {
    if (/34/i.test(text)) return 340;
    if (/25/i.test(text)) return 250;
    return 340;
  }
  if (generic.includes('oxytetracycline')) {
    if (/la\s*300|30%/i.test(text)) return 300;
    if (/la|20%/i.test(text)) return 200;
    if (/10%/i.test(text)) return 100;
    if (/5%/i.test(text)) return 50;
    return 200; // Default LA 200
  }
  if (generic.includes('enrofloxacin')) {
    if (/20%/i.test(text)) return 200;
    if (/10%/i.test(text)) return 100;
    if (/5%/i.test(text)) return 50;
    return 100; // Default 10%
  }
  if (generic.includes('marbofloxacin')) {
    if (/16%/i.test(text)) return 160;
    if (/10%/i.test(text)) return 100;
    if (/2%/i.test(text)) return 20;
    return 100;
  }
  if (generic.includes('sulphadimidine') || generic.includes('sulfamethazine')) {
    return 333; // Standard 33.3% Sulphadimidine = 333 mg/ml
  }
  if (generic.includes('trimethoprim') && generic.includes('sulpha')) {
    return 240; // Standard 24% Potentiated Sulpha = 240 mg/ml
  }
  if (generic.includes('albendazole')) {
    if (/10%/i.test(text)) return 100;
    if (/2.5%/i.test(text)) return 25;
    return 100;
  }
  if (generic.includes('levamisole')) {
    if (/10%/i.test(text)) return 100;
    if (/7.5%/i.test(text)) return 75;
    return 75;
  }

  return med.concentration_value || 100;
}

let updatedConcCount = 0;
let updatedSpeciesDosesCount = 0;

const processedMeds = meds.map(med => {
  const m = { ...med };
  const genericLower = (m.generic_name || '').toLowerCase();

  // 1. Fix Commercial Concentration
  if (m.dosage_form === 'injectable' || m.dosage_form === 'oral solution' || m.dosage_form === 'syrup' || m.dosage_form === 'oral suspension') {
    const accurateConc = extractCommercialConcentration(m);
    if (accurateConc && accurateConc !== m.concentration_value) {
      m.concentration_value = accurateConc;
      m.concentration_unit = 'mg/ml';
      m.concentration_ml = 1;
      updatedConcCount++;
    }
  }

  // 2. Attach Species Dosing Rules
  for (const [key, rules] of Object.entries(SPECIES_DOSING_RULES)) {
    if (genericLower === key || genericLower.includes(key)) {
      m.species_doses = rules;
      updatedSpeciesDosesCount++;
      break;
    }
  }

  return m;
});

console.log(`Updated concentrations for ${updatedConcCount} medications.`);
console.log(`Attached species-specific dosing rules for ${updatedSpeciesDosesCount} medications.`);

// Save to default-medications.js
const defaultMedsPath = path.join(__dirname, '..', 'default-medications.js');
const jsOutput = `// Large default medications database for VetCalc\nwindow.DEFAULT_MEDICATIONS = ${JSON.stringify(processedMeds, null, 6)};\n`;
fs.writeFileSync(defaultMedsPath, jsOutput, 'utf8');
console.log(`Updated ${defaultMedsPath}`);

// Save to medications.csv
const headers = [
  'id',
  'brand_name',
  'generic_name',
  'species',
  'dose_mg_per_kg_min',
  'dose_mg_per_kg_max',
  'concentration_value',
  'concentration_unit',
  'concentration_ml',
  'dosage_form',
  'route',
  'frequency',
  'unit_description',
  'notes'
];

function formatFieldValue(med, header) {
  let val = med[header];
  if (header === 'species') {
    if (val === 'both') return 'dogs and cats';
  }
  return val;
}

function escapeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

const csvRows = [headers.join(',')];
for (const med of processedMeds) {
  const row = headers.map(h => escapeCsvValue(formatFieldValue(med, h)));
  csvRows.push(row.join(','));
}

const csvPath = path.join(__dirname, '..', 'medications.csv');
try {
  fs.writeFileSync(csvPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  console.log(`Successfully updated ${csvPath}`);
} catch (err) {
  if (err.code === 'EBUSY') {
    console.warn(`Note: ${csvPath} is locked. Saved to medications_new.csv.`);
    const backupPath = path.join(__dirname, '..', 'medications_new.csv');
    fs.writeFileSync(backupPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  } else {
    throw err;
  }
}
