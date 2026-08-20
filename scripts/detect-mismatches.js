const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

console.log('Analyzing 1043 medications...');

let routeMismatches = [];

meds.forEach(m => {
  const fullText = [
    m.brand_name,
    m.generic_name,
    m.dosage_form,
    m.route,
    m.concentration_unit,
    m.unit_description,
    m.frequency,
    m.notes
  ].join(' | ');

  // Detect true administration routes from text
  const textLower = fullText.toLowerCase();

  // Route mentions in notes / frequency / unit_desc
  const mentionsIM = /\b(im|i\/m|intramuscular|intramuscularly)\b/i.test(fullText);
  const mentionsIV = /\b(iv|i\/v|intravenous|intravenously)\b/i.test(fullText);
  const mentionsSC = /\b(sc|sq|s\/c|subcutaneous|subcutaneously)\b/i.test(fullText);
  const mentionsPO = /\b(po|p\.o\.|oral|orally|drench|drinking water|in water|feed|in feed|bolus|tablet|syrup|capsule)\b/i.test(fullText);
  const mentionsTopical = /\b(topical|topically|pour-on|pour on|spray|ointment|cream|shampoo|dip|spot-on|spot on)\b/i.test(fullText);
  const mentionsIntramammary = /\b(intramammary|intra-mammary|udder|teat)\b/i.test(fullText);
  const mentionsIntrauterine = /\b(intrauterine|intra-uterine|uterus|flush)\b/i.test(fullText);
  const mentionsOphthalmic = /\b(eye|ophthalmic|conjunctival)\b/i.test(fullText);
  const mentionsOtic = /\b(ear|otic|auricular)\b/i.test(fullText);

  // Dosage form mentions
  const isVialOrAmp = /vial|ampoule|amp\b|injection|injectable|solution for injection/i.test(m.unit_description + ' ' + m.notes + ' ' + m.brand_name);
  const isOintmentOrCream = /ointment|cream|gel\b|spray/i.test(m.unit_description + ' ' + m.notes + ' ' + m.brand_name);
  const isOralForm = /sachet|powder|drinking water|oral solution|oral suspension|drench|bolus|paste|syrup/i.test(m.unit_description + ' ' + m.notes + ' ' + m.brand_name);

  routeMismatches.push({
    id: m.id,
    brand: m.brand_name,
    species: m.species,
    currentForm: m.dosage_form,
    currentRoute: m.route,
    currentUnit: m.concentration_unit,
    unitDesc: m.unit_description,
    freq: m.frequency,
    mentions: {
      IM: mentionsIM,
      IV: mentionsIV,
      SC: mentionsSC,
      PO: mentionsPO,
      Topical: mentionsTopical,
      Intramammary: mentionsIntramammary,
      Intrauterine: mentionsIntrauterine,
      Ophthalmic: mentionsOphthalmic,
      Otic: mentionsOtic,
      isVial: isVialOrAmp,
      isOintment: isOintmentOrCream,
      isOralForm: isOralForm
    },
    sampleNotes: m.notes.substring(0, 100)
  });
});

// Let's find medications where currentRoute is PO but it is clearly an injection (vial/amp + IM/IV/SC)
const injectableAsPO = routeMismatches.filter(m => 
  (m.currentRoute === 'PO' || m.currentForm === 'tablet') &&
  (m.mentions.isVial || m.mentions.IM || m.mentions.IV || m.mentions.SC) &&
  !m.mentions.isOralForm
);

console.log('Injectable misclassified as PO/tablet:', injectableAsPO.length);

// Let's find medications where currentRoute is Topical but it is clearly an injection
const injectableAsTopical = routeMismatches.filter(m => 
  m.currentRoute === 'Topical' &&
  (m.mentions.isVial || m.mentions.IM || m.mentions.IV || m.mentions.SC) &&
  !m.mentions.isOintment && !m.mentions.Topical
);

console.log('Injectable misclassified as Topical:', injectableAsTopical.length);
