const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

const zeroDose = meds.filter(m => m.dose_mg_per_kg_min === 0 && m.dose_mg_per_kg_max === 0);
console.log(`Total zero-dose items: ${zeroDose.length}`);

// Group by route/form/indication
const groups = {};
zeroDose.forEach(m => {
  const key = `${m.dosage_form} | ${m.route}`;
  groups[key] = (groups[key] || 0) + 1;
});
console.log('Zero-dose breakdown by Form & Route:', groups);

// Any zero-dose item without clear dosing in notes
const unclear = zeroDose.filter(m => {
  const n = m.notes || '';
  return !/(dosing|dose|apply|infuse|drop|sachet|bolus|ml|iu|mcg|gm|tablet|ampoule|tablets|suppository|dilute|wash)/i.test(n);
});
console.log(`\nZero-dose items with UNCLEAR notes: ${unclear.length}`);
if (unclear.length > 0) {
  unclear.forEach(m => console.log(`  [ID ${m.id}] ${m.brand_name} | Notes: ${m.notes}`));
}
