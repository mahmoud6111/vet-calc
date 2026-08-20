const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

function fixMedication(med, index) {
  const m = { ...med };
  const brand = (m.brand_name || '').trim();
  const generic = (m.generic_name || '').trim();
  const desc = (m.unit_description || '').trim();
  const notes = (m.notes || '').trim();
  const freq = (m.frequency || '').trim();
  const fullText = `${brand} | ${generic} | ${desc} | ${freq} | ${notes}`;
  const routeText = `${freq} | ${notes} | ${desc} | ${brand}`;

  // Specific small animal edge cases (first 83)
  if (index < 83) {
    if (m.id === '13') { // Maxilase
      m.dosage_form = 'syrup';
      m.route = 'PO';
      m.concentration_unit = 'ml/dose';
    } else if (m.id === '73' || m.id === '74') { // Tobrin, Tobradex
      m.dosage_form = 'eye drops';
      m.route = 'Ophthalmic';
      m.concentration_unit = 'mg/ml';
    }
    return m;
  }

  // -------------------------------------------------------------
  // SPECIFIC FIXED OVERRIDES BY ID
  // -------------------------------------------------------------
  if (m.id === '261') { // Mastodin gel
    m.dosage_form = 'gel';
    m.route = 'Topical';
    m.concentration_unit = 'mg/ml';
    return m;
  }
  if (m.id === '347') { // Busol (Buserelin)
    m.dosage_form = 'injectable';
    m.route = 'IM/IV';
    m.concentration_unit = 'mg/ml';
    return m;
  }
  if (m.id === '367') { // MGA Progesterone
    m.dosage_form = 'injectable';
    m.route = 'IM';
    m.concentration_unit = 'mg/ml';
    return m;
  }
  if (m.id === '891') { // Ecto tick
    m.dosage_form = 'topical solution';
    m.route = 'Topical';
    m.concentration_unit = 'mg/g';
    return m;
  }

  // -------------------------------------------------------------
  // 1. INTRAMAMMARY
  // -------------------------------------------------------------
  if (
    /\b(intramammary|intra-mammary|mastitis syringe|teat infusion|infusion into teat|dry cow therapy|lactating cow therapy|udder infusion)\b/i.test(fullText) ||
    (/\bmast\b/i.test(brand) && /syringe|teat|udder/i.test(desc + ' ' + notes)) ||
    (/syringes/i.test(desc) && /mastitis|udder|teat|cloxacillin|cefquinome|ampicillin/i.test(notes + ' ' + generic))
  ) {
    m.route = 'Intramammary';
    m.dosage_form = 'intramammary infusion';
    if (m.concentration_unit === 'mg/tab' || m.concentration_unit === 'mg/ml') m.concentration_unit = 'mg/syringe';
    return m;
  }

  // -------------------------------------------------------------
  // 2. INTRAUTERINE
  // -------------------------------------------------------------
  if (
    /\b(intrauterine|intra-uterine|uterine flush|oblet for intrauterine|post-partum uterine|metritis|vaginal tablets)\b/i.test(fullText) &&
    !/\b(im\/iv|iv\/im|intravenous|intramuscular|systemic injection)\b/i.test(freq) &&
    !/solution for injection/i.test(desc)
  ) {
    m.route = 'Intrauterine';
    m.dosage_form = /\b(bolus|oblet|tablet|tablets)\b/i.test(desc + ' ' + notes) ? 'intrauterine bolus' : 'intrauterine solution';
    if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/bolus';
    return m;
  }

  // -------------------------------------------------------------
  // 3. OPHTHALMIC
  // -------------------------------------------------------------
  if (/\b(ophthalmic|eye drop|eye drops|eye ointment|conjunctival)\b/i.test(fullText)) {
    m.route = 'Ophthalmic';
    m.dosage_form = /ointment/i.test(desc + ' ' + notes) ? 'ointment' : 'eye drops';
    if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/ml';
    return m;
  }

  // -------------------------------------------------------------
  // 4. OTIC
  // -------------------------------------------------------------
  if (/\b(ear drops|instill in ear|auricular|ear canal)\b/i.test(fullText) || (/\botic\b/i.test(fullText) && !/antibiotic|osmotic|probiotic/i.test(fullText))) {
    m.route = 'Otic';
    m.dosage_form = 'ear drops';
    if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'drop/dose';
    return m;
  }

  // -------------------------------------------------------------
  // 5. POUR-ON / SPOT-ON
  // -------------------------------------------------------------
  if (/\b(pour-on|pour on|spot-on|spot on)\b/i.test(desc + ' ' + notes + ' ' + brand) || (/\bflumethrin\b/i.test(generic) && /bottle|backbone/i.test(desc + ' ' + notes))) {
    m.route = 'Pour-on';
    m.dosage_form = 'pour-on';
    if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/ml';
    return m;
  }

  // -------------------------------------------------------------
  // 6. TOPICAL
  // -------------------------------------------------------------
  if (
    (/\b(ointment|cream|gel)\b/i.test(desc) || /\b(ointment|cream)\b/i.test(brand)) &&
    !/vial|ampoule|solution for injection|inject/i.test(desc)
  ) {
    m.route = 'Topical';
    m.dosage_form = /cream/i.test(desc + ' ' + brand) ? 'cream' : /gel/i.test(desc + ' ' + brand) ? 'gel' : 'ointment';
    if (m.concentration_unit === 'mg/ml' || m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/g';
    return m;
  }

  if (
    (/\b(spray|wound spray|healing promoter|antiseptic wash|plunge dip|dip treatment|wash or spray|bathing|cutaneous spray|fog)\b/i.test(desc + ' ' + notes + ' ' + brand)) &&
    !/vial|ampoule|solution for injection/i.test(desc)
  ) {
    m.route = 'Topical';
    m.dosage_form = /spray/i.test(desc + ' ' + brand) ? 'spray' : 'topical solution';
    if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/ml';
    return m;
  }

  if (
    /ectoparasiticide|acaricide|insecticide|pesticide/i.test(notes) &&
    /washing|spraying|plunge dip|dip|spray|external use|dipterans|pasture/i.test(notes) &&
    !/vial|ampoule|inject/i.test(desc)
  ) {
    m.route = 'Topical';
    m.dosage_form = /spray/i.test(desc + ' ' + brand) ? 'spray' : 'topical solution';
    if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/ml';
    return m;
  }

  // -------------------------------------------------------------
  // 7. INJECTABLES
  // -------------------------------------------------------------
  const isVialOrAmp = /\b(vial|vials|ampoule|ampoules|amp\b|amps\b|injection|injectable|solution for injection|suspension for injection|sterile solution|sterile suspension|freeze-dried vaccine|inactivated.*vaccine|live.*vaccine|vaccine)\b/i.test(desc + ' ' + notes + ' ' + brand);
  const hasInjectionRouteInFreq = /\b(im\/iv|iv\/im|iv\/im\/sc|im\/sc|iv\/sc|im|iv|sc|deep im|slow iv)\b/i.test(freq);
  const isInjectableDesc = /vial|amp|injection/i.test(desc);

  if (isVialOrAmp || hasInjectionRouteInFreq || isInjectableDesc) {
    m.dosage_form = 'injectable';
    if (m.concentration_unit === 'mg/tab' || m.concentration_unit === 'mg/5ml') m.concentration_unit = 'mg/ml';

    // Parse exact route from text
    const hasIVIMSC = /\b(iv\/im\/sc|im\/iv\/sc|sc\/im\/iv|iv,?\s*im,?\s*(and|or|&)?\s*sc|intravenous,?\s*intramuscular,?\s*(and|or|&)?\s*subcutaneous)\b/i.test(routeText);
    const hasIVIM = /\b(iv\/im|im\/iv|iv,?\s*(and|or|&)?\s*im|im,?\s*(and|or|&)?\s*iv|intravenous,?\s*(and|or|&)?\s*intramuscular|intramuscular,?\s*(and|or|&)?\s*intravenous)\b/i.test(routeText);
    const hasIMSC = /\b(im\/sc|sc\/im|im,?\s*(and|or|&)?\s*sc|sc,?\s*(and|or|&)?\s*im|intramuscular,?\s*(and|or|&)?\s*subcutaneous|subcutaneous,?\s*(and|or|&)?\s*intramuscular)\b/i.test(routeText);
    const hasIVSC = /\b(iv\/sc|sc\/iv|iv,?\s*(and|or|&)?\s*sc|sc,?\s*(and|or|&)?\s*iv|intravenous,?\s*(and|or|&)?\s*subcutaneous|subcutaneous,?\s*(and|or|&)?\s*intravenous)\b/i.test(routeText);
    
    const hasIV = /\b(iv|i\/v|intravenous|intravenously|slow iv|slow intravenous)\b/i.test(routeText);
    const hasIM = /\b(im|i\/m|intramuscular|intramuscularly|deep im|deep intramuscular)\b/i.test(routeText);
    const hasSC = /\b(sc|sq|s\/c|subcutaneous|subcutaneously)\b/i.test(routeText);

    if (hasIVIMSC) {
      m.route = 'IV/IM/SC';
    } else if (hasIVIM && hasSC) {
      m.route = 'IV/IM/SC';
    } else if (hasIVIM) {
      m.route = 'IV/IM';
    } else if (hasIMSC) {
      m.route = 'IM/SC';
    } else if (hasIVSC) {
      m.route = 'IV/SC';
    } else if (hasIM && !hasIV && !hasSC) {
      m.route = 'IM';
    } else if (hasIV && !hasIM && !hasSC) {
      m.route = 'IV';
    } else if (hasSC && !hasIV && !hasIM) {
      m.route = 'SC';
    } else if (hasIV && hasIM) {
      m.route = 'IV/IM';
    } else if (hasIM && hasSC) {
      m.route = 'IM/SC';
    } else if (hasIV && hasSC) {
      m.route = 'IV/SC';
    } else {
      if (['IV/IM/SC', 'IV/IM', 'IM/SC', 'IV/SC', 'IM', 'IV', 'SC'].includes(m.route)) {
        // Keep current valid injectable route
      } else {
        m.route = 'IM/IV';
      }
    }

    return m;
  }

  // -------------------------------------------------------------
  // 8. ORAL FORMULATIONS (PO)
  // -------------------------------------------------------------
  m.route = 'PO';

  // Oral Pastes
  if (/\b(paste|oral paste)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    m.dosage_form = 'oral paste';
    if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/syringe';
    return m;
  }

  // Boluses / Oblets
  if (/\b(bolus|boluses|oblet|oblets|4 bolus)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    m.dosage_form = 'bolus';
    if (m.concentration_unit === 'mg/ml' || m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/bolus';
    return m;
  }

  // Powders / Sachets
  if (/\b(sachet|sachets|powder|water soluble powder|soluble powder|kg powder|gm powder)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    m.dosage_form = 'oral powder';
    if (m.concentration_unit === 'mg/ml' || m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/g';
    return m;
  }

  // Syrups / Solutions / Drenches in Bottles
  if (/\b(bottle|1l|500 ml|490 ml|2.2l|200 ml|120 ml|syrup|drench|oral drench|oral suspension|oral solution|drinking water)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    if (/syrup/i.test(desc + ' ' + brand)) {
      m.dosage_form = 'syrup';
      if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/5ml';
    } else if (/drench/i.test(desc + ' ' + notes + ' ' + brand)) {
      m.dosage_form = 'oral drench';
      if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/ml';
    } else if (/suspension/i.test(desc + ' ' + notes + ' ' + brand)) {
      m.dosage_form = 'oral suspension';
      if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/ml';
    } else {
      m.dosage_form = 'oral solution';
      if (m.concentration_unit === 'mg/tab') m.concentration_unit = 'mg/ml';
    }
    return m;
  }

  // Tablets / Capsules
  if (/\b(capsule|capsules|cap\b)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    m.dosage_form = 'capsule';
    if (m.concentration_unit === 'mg/ml') m.concentration_unit = 'mg/cap';
    return m;
  }

  if (/\b(tablet|tablets|tab\b|effervescent tablets)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    m.dosage_form = 'tablet';
    if (m.concentration_unit === 'mg/ml') m.concentration_unit = 'mg/tab';
    return m;
  }

  return m;
}

const updatedMeds = meds.map((m, idx) => fixMedication(m, idx));

// Write updated default-medications.js
const defaultMedsPath = path.join(__dirname, '..', 'default-medications.js');
const jsOutput = `// Large default medications database for VetCalc\nwindow.DEFAULT_MEDICATIONS = ${JSON.stringify(updatedMeds, null, 6)};\n`;
fs.writeFileSync(defaultMedsPath, jsOutput, 'utf8');
console.log(`Updated ${defaultMedsPath} with ${updatedMeds.length} medications.`);

// Update medications.csv (with try-catch if file is locked)
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
for (const med of updatedMeds) {
  const row = headers.map(h => escapeCsvValue(formatFieldValue(med, h)));
  csvRows.push(row.join(','));
}

const csvPath = path.join(__dirname, '..', 'medications.csv');
try {
  fs.writeFileSync(csvPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  console.log(`Updated ${csvPath} with ${updatedMeds.length} rows.`);
} catch (err) {
  if (err.code === 'EBUSY') {
    console.warn(`Warning: ${csvPath} is currently locked by another application (e.g. Excel). Saved backup to medications_new.csv`);
    const backupCsvPath = path.join(__dirname, '..', 'medications_new.csv');
    fs.writeFileSync(backupCsvPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  } else {
    throw err;
  }
}
