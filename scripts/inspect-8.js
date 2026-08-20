const fs = require('fs');
const path = require('path');
const { classifyMedication } = require('./classify-meds.js');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

const classified = meds.map(m => {
  const c = classifyMedication(m);
  return {
    ...m,
    dosage_form: c.form,
    route: c.route,
    concentration_unit: c.unit,
    concentration_value: c.val,
    category: c.category
  };
});

const injPO = classified.filter(m => m.dosage_form === 'injectable' && m.route === 'PO');
console.log('Injectables with route PO:');
injPO.forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name} | Generic: ${m.generic_name} | Species: ${m.species}`);
  console.log(`  Desc: ${m.unit_description} | Freq: ${m.frequency} | Category: ${m.category}`);
  console.log(`  Notes: ${m.notes}`);
  console.log('---');
});
