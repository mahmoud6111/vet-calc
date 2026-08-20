const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

function determineRouteAndForm(med) {
  // Combine all text sources for analysis
  const brand = (med.brand_name || '').trim();
  const generic = (med.generic_name || '').trim();
  const desc = (med.unit_description || '').trim();
  const notes = (med.notes || '').trim();
  const freq = (med.frequency || '').trim();
  const origRoute = (med.route || '').trim();
  const origForm = (med.dosage_form || '').trim();
  const origUnit = (med.concentration_unit || '').trim();

  const text = `${brand} | ${generic} | ${desc} | ${freq} | ${notes}`;
  const lower = text.toLowerCase();

  let form = origForm;
  let route = origRoute;
  let unit = origUnit;

  // -------------------------------------------------------------
  // 1. SPECIFIC SPECIALIZED ROUTES
  // -------------------------------------------------------------
  
  // Intramammary
  if (/\b(intramammary|intra-mammary|mastitis syringe|teat infusion|infusion into teat|dry cow therapy|lactating cow therapy|udder infusion)\b/i.test(text)) {
    route = 'Intramammary';
    form = 'intramammary infusion';
    if (unit === 'mg/tab' || unit === 'mg/ml') unit = 'mg/syringe';
    return { id: med.id, brand, form, route, unit, reason: 'Intramammary keyword' };
  }

  // Intrauterine
  if (/\b(intrauterine|intra-uterine|uterine flush|uterus|oblet for intrauterine|post-partum uterine)\b/i.test(text) && !/systemic|im\/iv/i.test(freq)) {
    route = 'Intrauterine';
    form = /\b(bolus|oblet|tablet)\b/i.test(desc + ' ' + notes) ? 'intrauterine bolus' : 'intrauterine solution';
    if (unit === 'mg/tab') unit = 'mg/bolus';
    return { id: med.id, brand, form, route, unit, reason: 'Intrauterine keyword' };
  }

  // Ophthalmic (Eye)
  if (/\b(ophthalmic|eye drops|eye ointment|conjunctival|instill in eye)\b/i.test(text)) {
    route = 'Ophthalmic';
    form = /ointment/i.test(desc + ' ' + notes) ? 'ointment' : 'eye drops';
    return { id: med.id, brand, form, route, unit, reason: 'Ophthalmic keyword' };
  }

  // Otic (Ear) - be careful not to match 'antibiotic' or 'osmotic'
  if (/\b(otic|ear drops|instill in ear|auricular|ear canal)\b/i.test(text)) {
    route = 'Otic';
    form = 'ear drops';
    return { id: med.id, brand, form, route, unit, reason: 'Otic keyword' };
  }

  // Pour-on / Spot-on / Dip / External Wash
  if (/\b(pour-on|pour on|spot-on|spot on)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    route = 'Pour-on';
    form = 'pour-on';
    if (unit === 'mg/tab') unit = 'mg/ml';
    return { id: med.id, brand, form, route, unit, reason: 'Pour-on keyword' };
  }

  if (/\b(plunge dip|dip treatment|wash or spray|bathing|spray on body|wound spray)\b/i.test(notes) && !/vial|solution for injection/i.test(desc)) {
    route = 'Topical';
    form = /spray/i.test(desc + ' ' + brand) ? 'spray' : /cream/i.test(desc) ? 'cream' : /ointment/i.test(desc) ? 'ointment' : 'topical solution';
    return { id: med.id, brand, form, route, unit, reason: 'External topical wash/spray' };
  }

  if (/\b(ointment|cream|gel)\b/i.test(desc) && !/vial|ampoule|inject/i.test(desc)) {
    route = 'Topical';
    form = /cream/i.test(desc) ? 'cream' : /gel/i.test(desc) ? 'gel' : 'ointment';
    if (unit === 'mg/ml' || unit === 'mg/tab') unit = 'mg/g';
    return { id: med.id, brand, form, route, unit, reason: 'Ointment/Cream in desc' };
  }

  // -------------------------------------------------------------
  // 2. ORAL FORMULATIONS (PO)
  // Drinking water, oral drench, in feed, boluses, sachets, oral powder, oral solution, oral suspension, tablets, pastes
  // -------------------------------------------------------------
  const isOralExplicit = 
    /\b(drinking water|in drinking water|in water|in feed|oral drench|oral powder|oral solution|oral suspension|oral paste|oral bolus|sachet|water soluble powder|soluble powder|drench|bolus|oblet|syrup)\b/i.test(desc + ' ' + notes + ' ' + brand) ||
    /Administered by drinking|administered in drinking water|mixed with feed|administered orally|given orally|oral administration|per os|PO only/i.test(notes);

  const isInjectableExplicit = 
    /\b(vial|ampoule|amp\b|injection|injectable|solution for injection|suspension for injection|sterile solution|sterile suspension|freeze-dried vaccine|inactivated.*vaccine)\b/i.test(desc + ' ' + notes + ' ' + brand);

  // Check if it's an oral formulation (and not an injectable vial)
  if (isOralExplicit && !isInjectableExplicit) {
    route = 'PO';
    if (/\b(bolus|oblets|oblet)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
      form = 'bolus';
      if (unit === 'mg/ml' || unit === 'mg/tab') unit = 'mg/bolus';
    } else if (/\b(sachet|powder|water soluble powder)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
      form = 'oral powder';
      if (unit === 'mg/ml' || unit === 'mg/tab') unit = 'mg/g';
    } else if (/\b(drench)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
      form = 'oral drench';
      if (unit === 'mg/tab') unit = 'mg/ml';
    } else if (/\b(paste)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
      form = 'oral paste';
    } else if (/\b(suspension)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
      form = 'oral suspension';
      if (unit === 'mg/tab') unit = 'mg/ml';
    } else if (/\b(syrup)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
      form = 'syrup';
      if (unit === 'mg/tab') unit = 'mg/5ml';
    } else if (/\b(tablet|tab|tablets)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
      form = 'tablet';
      if (unit === 'mg/ml') unit = 'mg/tab';
    } else {
      form = 'oral solution';
      if (unit === 'mg/tab') unit = 'mg/ml';
    }
    return { id: med.id, brand, form, route, unit, reason: 'Oral formulation explicit' };
  }

  // -------------------------------------------------------------
  // 3. INJECTABLE FORMULATIONS (Vials, Ampoules, Injections)
  // Determine exact injection route: IV, IM, SC, or combination
  // -------------------------------------------------------------
  if (isInjectableExplicit || origForm === 'injectable' || /vial|ampoule/i.test(desc)) {
    form = 'injectable';
    if (unit === 'mg/tab') unit = 'mg/ml';

    // Let's inspect routes mentioned in frequency, notes, desc, and ref
    // Priority: Ref and Frequency and Notes
    // Look for explicit route combinations
    const routeText = `${freq} | ${notes} | ${desc}`;
    
    // Check for exact phrases
    const hasIVIMSC = /\b(iv\/im\/sc|im\/iv\/sc|sc\/im\/iv|iv,?\s*im,?\s*(and|or|&)?\s*sc|intravenous,?\s*intramuscular,?\s*(and|or|&)?\s*subcutaneous)\b/i.test(routeText);
    const hasIVIM = /\b(iv\/im|im\/iv|iv,?\s*(and|or|&)?\s*im|im,?\s*(and|or|&)?\s*iv|intravenous,?\s*(and|or|&)?\s*intramuscular|intramuscular,?\s*(and|or|&)?\s*intravenous)\b/i.test(routeText);
    const hasIMSC = /\b(im\/sc|sc\/im|im,?\s*(and|or|&)?\s*sc|sc,?\s*(and|or|&)?\s*im|intramuscular,?\s*(and|or|&)?\s*subcutaneous|subcutaneous,?\s*(and|or|&)?\s*intramuscular)\b/i.test(routeText);
    const hasIVSC = /\b(iv\/sc|sc\/iv|iv,?\s*(and|or|&)?\s*sc|sc,?\s*(and|or|&)?\s*iv|intravenous,?\s*(and|or|&)?\s*subcutaneous|subcutaneous,?\s*(and|or|&)?\s*intravenous)\b/i.test(routeText);
    
    const hasIV = /\b(iv|i\/v|intravenous|intravenously|slow iv|slow intravenous)\b/i.test(routeText);
    const hasIM = /\b(im|i\/m|intramuscular|intramuscularly|deep im|deep intramuscular)\b/i.test(routeText);
    const hasSC = /\b(sc|sq|s\/c|subcutaneous|subcutaneously)\b/i.test(routeText);

    if (hasIVIMSC) {
      route = 'IV/IM/SC';
    } else if (hasIVIM && hasSC) {
      route = 'IV/IM/SC';
    } else if (hasIVIM) {
      route = 'IV/IM';
    } else if (hasIMSC) {
      route = 'IM/SC';
    } else if (hasIVSC) {
      route = 'IV/SC';
    } else if (hasIV && !hasIM && !hasSC) {
      route = 'IV';
    } else if (hasIM && !hasIV && !hasSC) {
      route = 'IM';
    } else if (hasSC && !hasIV && !hasIM) {
      route = 'SC';
    } else if (hasIV && hasIM) {
      route = 'IV/IM';
    } else if (hasIM && hasSC) {
      route = 'IM/SC';
    } else if (hasIV && hasSC) {
      route = 'IV/SC';
    } else {
      // If it's an injection but no specific route matched in text, check previous route if valid injection route
      if (['IV/IM/SC', 'IV/IM', 'IM/SC', 'IV/SC', 'IM', 'IV', 'SC'].includes(origRoute)) {
        route = origRoute;
      } else {
        route = 'IM/IV'; // standard default for veterinary systemic injections
      }
    }

    return { id: med.id, brand, form, route, unit, reason: 'Injectable formulation' };
  }

  // -------------------------------------------------------------
  // 4. TABLETS / CAPSULES
  // -------------------------------------------------------------
  if (/\b(tablet|tab|tablets|capsule|cap|capsules)\b/i.test(desc + ' ' + notes)) {
    route = 'PO';
    form = /\b(capsule|cap)\b/i.test(desc) ? 'capsule' : 'tablet';
    if (unit === 'mg/ml') unit = form === 'capsule' ? 'mg/cap' : 'mg/tab';
    return { id: med.id, brand, form, route, unit, reason: 'Tablet/Capsule' };
  }

  return { id: med.id, brand, form, route, unit, reason: 'Fallback default' };
}

// Run analysis on all medications
let modifiedCount = 0;
let routeChanges = [];

meds.forEach(m => {
  const res = determineRouteAndForm(m);
  const changed = (m.route !== res.route || m.dosage_form !== res.form || m.concentration_unit !== res.unit);
  if (changed) {
    modifiedCount++;
    routeChanges.push({
      id: m.id,
      brand: m.brand_name,
      species: m.species,
      oldRoute: m.route,
      newRoute: res.route,
      oldForm: m.dosage_form,
      newForm: res.form,
      oldUnit: m.concentration_unit,
      newUnit: res.unit,
      reason: res.reason,
      desc: m.unit_description,
      freq: m.frequency
    });
  }
});

console.log(`Total medications: ${meds.length}`);
console.log(`Modified count: ${modifiedCount}`);

// Inspect remaining PO in large animal medications to make sure NO injectables have PO
const updatedRoutes = meds.map(m => {
  const res = determineRouteAndForm(m);
  return { ...m, route: res.route, dosage_form: res.form, concentration_unit: res.unit };
});

const remainingLargePO = updatedRoutes.filter(m => 
  ['large_animal', 'cattle', 'horse', 'sheep_goat', 'camel', 'poultry'].includes(m.species) &&
  m.route === 'PO'
);

console.log(`\nRemaining large animal medications with route PO: ${remainingLargePO.length}`);
remainingLargePO.forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name} | Form: ${m.dosage_form} | Unit: ${m.concentration_unit} | Desc: ${m.unit_description}`);
});
