const fs = require('fs');
const path = require('path');
const { refineMedication } = require('./refine-all-func.js');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

const refinedMeds = meds.map(m => {
  const ref = refineMedication(m);
  return {
    ...m,
    dosage_form: ref.form,
    route: ref.route,
    concentration_unit: ref.unit,
    concentration_value: ref.val,
    reason: ref.reason
  };
});

const largePO = refinedMeds.filter(m => 
  ['large_animal', 'cattle', 'horse', 'sheep_goat', 'camel', 'poultry'].includes(m.species) &&
  m.route === 'PO'
);

console.log(`Checking ${largePO.length} large animal PO medications:`);
largePO.forEach((m, idx) => {
  console.log(`[${idx+1}] ID ${m.id} | ${m.brand_name} | Generic: ${m.generic_name}`);
  console.log(`     Form: ${m.dosage_form} | Unit: ${m.concentration_unit} | Desc: ${m.unit_description}`);
  console.log(`     Freq: ${m.frequency} | Reason: ${m.reason}`);
  console.log(`     Notes: ${m.notes.substring(0, 120)}...`);
  console.log('---');
});
