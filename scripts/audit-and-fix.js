const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

function analyzeDrug(m) {
  const brand = m.brand_name || '';
  const generic = m.generic_name || '';
  const desc = m.unit_description || '';
  const notes = m.notes || '';
  const freq = m.frequency || '';
  const fullText = `${brand} | ${generic} | ${desc} | ${freq} | ${notes}`;

  let suggestedRoute = m.route;
  let suggestedForm = m.dosage_form;
  let suggestedConcUnit = m.concentration_unit;

  // Check routes from frequency and notes first (very explicit in these veterinary entries)
  // Look for patterns like "IM/IV", "IV/IM/SC", "SC", "IM", "IV", "PO", "Topical", "Intramammary", "Intrauterine", "Pour-on", "Oral", "in drinking water"

  // 1. Check if it's Intramammary
  if (/intramammary|intra-mammary|mastitis syringe|teat infusion/i.test(fullText)) {
    suggestedRoute = 'Intramammary';
    suggestedForm = 'intramammary infusion';
    if (suggestedConcUnit === 'mg/tab') suggestedConcUnit = 'mg/syringe';
  }
  // 2. Check if it's Intrauterine
  else if (/intrauterine|intra-uterine|uterine flush|oblet/i.test(fullText)) {
    suggestedRoute = 'Intrauterine';
    suggestedForm = /tablet|bolus|oblet/i.test(fullText) ? 'intrauterine bolus' : 'intrauterine solution';
  }
  // 3. Check if it's Pour-on / Spot-on / Topical
  else if (/pour-on|pour on|spot-on|spot on/i.test(fullText) && !/injectable|vial|solution for injection/i.test(desc)) {
    suggestedRoute = 'Pour-on';
    suggestedForm = 'pour-on solution';
  }
  else if (/ointment|cream|gel\b|skin spray|wound spray|healing promoter|antiseptic wash/i.test(fullText) && !/vial|ampoule|solution for injection/i.test(desc)) {
    suggestedRoute = 'Topical';
    suggestedForm = /ointment/i.test(fullText) ? 'ointment' : /cream/i.test(fullText) ? 'cream' : /spray/i.test(fullText) ? 'spray' : 'topical';
  }
  else if (/eye drop|ophthalmic/i.test(fullText)) {
    suggestedRoute = 'Ophthalmic';
    suggestedForm = 'eye drops';
  }
  else if (/ear drop|otic/i.test(fullText)) {
    suggestedRoute = 'Otic';
    suggestedForm = 'ear drops';
  }
  // 4. Check if it's Oral / PO (drinking water, drench, feed, bolus, oral suspension, oral powder, oral solution, tablet, paste)
  else if (
    /drinking water|in water|in feed|oral powder|oral solution|oral suspension|drench|oral drench|oral paste|bolus|oblet|sachet/i.test(desc) ||
    /drinking water|in water|in feed|oral drench|drench|oral powder|oral paste/i.test(notes) ||
    /sachet|powder|drench/i.test(brand)
  ) {
    suggestedRoute = 'PO';
    if (/bolus|oblet/i.test(fullText)) {
      suggestedForm = 'bolus';
      if (suggestedConcUnit === 'mg/ml') suggestedConcUnit = 'mg/bolus';
    } else if (/sachet|powder/i.test(fullText)) {
      suggestedForm = 'oral powder';
      if (suggestedConcUnit === 'mg/ml' || suggestedConcUnit === 'mg/tab') suggestedConcUnit = 'mg/g';
    } else if (/drench/i.test(fullText)) {
      suggestedForm = 'oral drench';
      if (suggestedConcUnit === 'mg/tab') suggestedConcUnit = 'mg/ml';
    } else if (/oral suspension|suspension/i.test(fullText)) {
      suggestedForm = 'oral suspension';
      if (suggestedConcUnit === 'mg/tab') suggestedConcUnit = 'mg/ml';
    } else if (/paste/i.test(fullText)) {
      suggestedForm = 'oral paste';
    } else if (/drinking water|oral solution/i.test(fullText)) {
      suggestedForm = 'oral solution';
      if (suggestedConcUnit === 'mg/tab') suggestedConcUnit = 'mg/ml';
    }
  }
  // 5. Check if it's Injectable (vial, ampoule, solution for injection, IM, IV, SC)
  else if (
    /vial|ampoule|amp\b|injection|injectable|solution for injection/i.test(desc) ||
    /vial|ampoule|injectable|solution for injection/i.test(notes) ||
    /injectable/i.test(brand) ||
    /injectable/i.test(m.dosage_form)
  ) {
    suggestedForm = 'injectable';
    if (suggestedConcUnit === 'mg/tab') {
      suggestedConcUnit = 'mg/ml';
    }

    // Determine injection route from frequency, notes, desc
    // Check specific combinations in text:
    const hasIV = /\b(iv|i\/v|intravenous|intravenously)\b/i.test(freq + ' ' + notes);
    const hasIM = /\b(im|i\/m|intramuscular|intramuscularly)\b/i.test(freq + ' ' + notes);
    const hasSC = /\b(sc|sq|s\/c|subcutaneous|subcutaneously)\b/i.test(freq + ' ' + notes);
    const hasPO = /\b(po|p\.o\.|oral|orally)\b/i.test(freq + ' ' + notes);

    if (hasIV && hasIM && hasSC) {
      suggestedRoute = 'IV/IM/SC';
    } else if (hasIV && hasIM) {
      suggestedRoute = 'IV/IM';
    } else if (hasIM && hasSC) {
      suggestedRoute = 'IM/SC';
    } else if (hasIV && hasSC) {
      suggestedRoute = 'IV/SC';
    } else if (hasIM) {
      suggestedRoute = 'IM';
    } else if (hasIV) {
      suggestedRoute = 'IV';
    } else if (hasSC) {
      suggestedRoute = 'SC';
    } else {
      // Default injectable route if not specified in text
      if (m.route === 'PO' || m.route === 'Topical') {
        suggestedRoute = 'IM/IV'; // standard default for vet injectables
      }
    }
  }
  // 6. Check if it's a real tablet / capsule
  else if (/tablet|capsule|cap\b|tab\b/i.test(desc) || /tablet|capsule/i.test(notes)) {
    suggestedRoute = 'PO';
    suggestedForm = /capsule/i.test(desc + ' ' + notes) ? 'capsule' : 'tablet';
    if (suggestedConcUnit === 'mg/ml') suggestedConcUnit = 'mg/tab';
  }

  return {
    id: m.id,
    brand: m.brand_name,
    species: m.species,
    oldRoute: m.route,
    newRoute: suggestedRoute,
    oldForm: m.dosage_form,
    newForm: suggestedForm,
    oldUnit: m.concentration_unit,
    newUnit: suggestedConcUnit,
    desc: m.unit_description,
    freq: m.frequency,
    changed: (m.route !== suggestedRoute || m.dosage_form !== suggestedForm || m.concentration_unit !== suggestedConcUnit)
  };
}

const results = meds.map(analyzeDrug);
const changed = results.filter(r => r.changed);
console.log(`Total medications analyzed: ${meds.length}`);
console.log(`Medications with changes: ${changed.length}`);

console.log('\n=== Sample of 30 changed records ===');
changed.slice(0, 30).forEach(r => {
  console.log(`[ID ${r.id}] ${r.brand} (${r.species})`);
  console.log(`  Route: ${r.oldRoute} -> ${r.newRoute}`);
  console.log(`  Form:  ${r.oldForm} -> ${r.newForm}`);
  console.log(`  Unit:  ${r.oldUnit} -> ${r.newUnit}`);
  console.log(`  Desc:  ${r.desc}`);
  console.log(`  Freq:  ${r.freq}`);
  console.log('---');
});
