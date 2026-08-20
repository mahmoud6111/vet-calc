const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

function classifyMedication(med) {
  const id = med.id;
  const brand = (med.brand_name || '').trim();
  const generic = (med.generic_name || '').trim();
  const desc = (med.unit_description || '').trim();
  const notes = (med.notes || '').trim();
  const freq = (med.frequency || '').trim();
  const origRoute = (med.route || '').trim();
  const origForm = (med.dosage_form || '').trim();
  const origUnit = (med.concentration_unit || '').trim();
  const origVal = med.concentration_value;

  const fullText = `${brand} | ${generic} | ${desc} | ${freq} | ${notes}`;
  const routeText = `${freq} | ${notes} | ${desc} | ${brand}`;

  let form = origForm;
  let route = origRoute;
  let unit = origUnit;
  let val = origVal;

  // -------------------------------------------------------------
  // 1. INTRAMAMMARY (Mastitis teat infusions)
  // -------------------------------------------------------------
  if (
    /\b(intramammary|intra-mammary|mastitis syringe|teat infusion|infusion into teat|dry cow therapy|lactating cow therapy|udder infusion)\b/i.test(fullText) ||
    (/\bmast\b/i.test(brand) && /syringe|teat|udder/i.test(desc + ' ' + notes)) ||
    (/syringes/i.test(desc) && /mastitis|udder|teat|cloxacillin|cefquinome|ampicillin/i.test(notes + ' ' + generic))
  ) {
    route = 'Intramammary';
    form = 'intramammary infusion';
    if (unit === 'mg/tab' || unit === 'mg/ml') unit = 'mg/syringe';
    return { id, brand, form, route, unit, val, category: 'Intramammary' };
  }

  // -------------------------------------------------------------
  // 2. INTRAUTERINE (Oblets, flushes, pessaries, vaginal tablets)
  // -------------------------------------------------------------
  if (
    /\b(intrauterine|intra-uterine|uterine flush|oblet for intrauterine|post-partum uterine|metritis|vaginal tablets)\b/i.test(fullText) &&
    !/\b(im\/iv|iv\/im|intravenous|intramuscular|systemic injection)\b/i.test(freq) &&
    !/solution for injection/i.test(desc)
  ) {
    route = 'Intrauterine';
    form = /\b(bolus|oblet|tablet|tablets)\b/i.test(desc + ' ' + notes) ? 'intrauterine bolus' : 'intrauterine solution';
    if (unit === 'mg/tab') unit = 'mg/bolus';
    return { id, brand, form, route, unit, val, category: 'Intrauterine' };
  }

  // -------------------------------------------------------------
  // 3. OPHTHALMIC (Eye)
  // -------------------------------------------------------------
  if (/\b(ophthalmic|eye drop|eye drops|eye ointment|conjunctival)\b/i.test(fullText)) {
    route = 'Ophthalmic';
    form = /ointment/i.test(desc + ' ' + notes) ? 'ointment' : 'eye drops';
    if (unit === 'mg/tab') unit = 'mg/ml';
    return { id, brand, form, route, unit, val, category: 'Ophthalmic' };
  }

  // -------------------------------------------------------------
  // 4. OTIC (Ear)
  // -------------------------------------------------------------
  if (/\b(ear drops|instill in ear|auricular|ear canal)\b/i.test(fullText) || (/\botic\b/i.test(fullText) && !/antibiotic|osmotic|probiotic/i.test(fullText))) {
    route = 'Otic';
    form = 'ear drops';
    if (unit === 'mg/tab') unit = 'drop/dose';
    return { id, brand, form, route, unit, val, category: 'Otic' };
  }

  // -------------------------------------------------------------
  // 5. POUR-ON / SPOT-ON
  // -------------------------------------------------------------
  if (/\b(pour-on|pour on|spot-on|spot on)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    route = 'Pour-on';
    form = 'pour-on';
    if (unit === 'mg/tab') unit = 'mg/ml';
    return { id, brand, form, route, unit, val, category: 'Pour-on' };
  }

  // -------------------------------------------------------------
  // 6. TOPICAL (Ointments, Creams, Gels, Sprays, External washes/dips)
  // -------------------------------------------------------------
  if (
    (/\b(ointment|cream|gel)\b/i.test(desc) || /\b(ointment|cream)\b/i.test(brand)) &&
    !/vial|ampoule|solution for injection|inject/i.test(desc)
  ) {
    route = 'Topical';
    form = /cream/i.test(desc + ' ' + brand) ? 'cream' : /gel/i.test(desc + ' ' + brand) ? 'gel' : 'ointment';
    if (unit === 'mg/ml' || unit === 'mg/tab') unit = 'mg/g';
    return { id, brand, form, route, unit, val, category: 'Topical Ointment/Cream' };
  }

  if (
    (/\b(spray|wound spray|healing promoter|antiseptic wash|plunge dip|dip treatment|wash or spray|bathing|cutaneous spray|fog)\b/i.test(desc + ' ' + notes + ' ' + brand)) &&
    !/vial|ampoule|solution for injection/i.test(desc)
  ) {
    route = 'Topical';
    form = /spray/i.test(desc + ' ' + brand) ? 'spray' : 'topical solution';
    if (unit === 'mg/tab') unit = 'mg/ml';
    return { id, brand, form, route, unit, val, category: 'Topical Spray/Wash' };
  }

  // External ectoparasiticides (Diazinon, Phoxim, Deltamethrin, Cypermethrin, Amitraz, etc. when not pour-on or injectable)
  if (
    /ectoparasiticide|acaricide|insecticide|pesticide/i.test(notes) &&
    /washing|spraying|plunge dip|dip|spray|external use/i.test(notes) &&
    !/vial|ampoule|inject/i.test(desc)
  ) {
    route = 'Topical';
    form = /spray/i.test(desc + ' ' + brand) ? 'spray' : 'topical solution';
    if (unit === 'mg/tab') unit = 'mg/ml';
    return { id, brand, form, route, unit, val, category: 'Topical Ectoparasiticide' };
  }

  // -------------------------------------------------------------
  // 7. INJECTABLES (Vials, Ampoules, Solutions/Suspensions for injection, Vaccines)
  // -------------------------------------------------------------
  const isVialOrAmp = /\b(vial|vials|ampoule|ampoules|amp\b|amps\b|injection|injectable|solution for injection|suspension for injection|sterile solution|sterile suspension|freeze-dried vaccine|inactivated.*vaccine|live.*vaccine|vaccine)\b/i.test(desc + ' ' + notes + ' ' + brand);
  const hasInjectionRouteInFreq = /\b(im\/iv|iv\/im|iv\/im\/sc|im\/sc|iv\/sc|im|iv|sc|deep im|slow iv)\b/i.test(freq);
  const isInjectableDesc = /vial|amp|injection/i.test(desc);

  if (isVialOrAmp || hasInjectionRouteInFreq || isInjectableDesc) {
    form = 'injectable';
    if (unit === 'mg/tab' || unit === 'mg/5ml') unit = 'mg/ml';

    // Parse exact route
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
    } else if (hasIM && !hasIV && !hasSC) {
      route = 'IM';
    } else if (hasIV && !hasIM && !hasSC) {
      route = 'IV';
    } else if (hasSC && !hasIV && !hasIM) {
      route = 'SC';
    } else if (hasIV && hasIM) {
      route = 'IV/IM';
    } else if (hasIM && hasSC) {
      route = 'IM/SC';
    } else if (hasIV && hasSC) {
      route = 'IV/SC';
    } else {
      if (['IV/IM/SC', 'IV/IM', 'IM/SC', 'IV/SC', 'IM', 'IV', 'SC'].includes(origRoute)) {
        route = origRoute;
      } else {
        route = 'IM/IV';
      }
    }

    return { id, brand, form, route, unit, val, category: 'Injectable' };
  }

  // -------------------------------------------------------------
  // 8. ORAL FORMULATIONS (PO)
  // -------------------------------------------------------------
  route = 'PO';

  // Oral Pastes
  if (/\b(paste|oral paste)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    form = 'oral paste';
    if (unit === 'mg/tab') unit = 'mg/syringe';
    return { id, brand, form, route, unit, val, category: 'Oral Paste' };
  }

  // Boluses / Oblets
  if (/\b(bolus|boluses|oblet|oblets|4 bolus)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    form = 'bolus';
    if (unit === 'mg/ml' || unit === 'mg/tab') unit = 'mg/bolus';
    return { id, brand, form, route, unit, val, category: 'Oral Bolus' };
  }

  // Powders / Sachets
  if (/\b(sachet|sachets|powder|water soluble powder|soluble powder|kg powder|gm powder)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    form = 'oral powder';
    if (unit === 'mg/ml' || unit === 'mg/tab') unit = 'mg/g';
    return { id, brand, form, route, unit, val, category: 'Oral Powder' };
  }

  // Syrups / Solutions / Drenches in Bottles
  if (/\b(bottle|1l|500 ml|490 ml|2.2l|200 ml|120 ml|syrup|drench|oral drench|oral suspension|oral solution|drinking water)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    if (/syrup/i.test(desc + ' ' + brand)) {
      form = 'syrup';
      if (unit === 'mg/tab') unit = 'mg/5ml';
    } else if (/drench/i.test(desc + ' ' + notes + ' ' + brand)) {
      form = 'oral drench';
      if (unit === 'mg/tab') unit = 'mg/ml';
    } else if (/suspension/i.test(desc + ' ' + notes + ' ' + brand)) {
      form = 'oral suspension';
      if (unit === 'mg/tab') unit = 'mg/ml';
    } else {
      form = 'oral solution';
      if (unit === 'mg/tab') unit = 'mg/ml';
    }
    return { id, brand, form, route, unit, val, category: 'Oral Liquid/Drench' };
  }

  // Tablets / Capsules
  if (/\b(capsule|capsules|cap\b)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    form = 'capsule';
    if (unit === 'mg/ml') unit = 'mg/cap';
    return { id, brand, form, route, unit, val, category: 'Oral Capsule' };
  }

  if (/\b(tablet|tablets|tab\b|effervescent tablets)\b/i.test(desc + ' ' + notes + ' ' + brand)) {
    form = 'tablet';
    if (unit === 'mg/ml') unit = 'mg/tab';
    return { id, brand, form, route, unit, val, category: 'Oral Tablet' };
  }

  return { id, brand, form, route, unit, val, category: 'Oral Default' };
}

module.exports = { classifyMedication };
