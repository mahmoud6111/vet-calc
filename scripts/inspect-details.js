const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

console.log('=== Samples of Injectable + PO (first 10) ===');
const injPO = meds.filter(m => m.dosage_form === 'injectable' && m.route === 'PO');
injPO.slice(0, 10).forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name} | Generic: ${m.generic_name} | Species: ${m.species}`);
  console.log(`  Form: ${m.dosage_form} | Route: ${m.route} | Freq: ${m.frequency} | Unit: ${m.concentration_unit} | UnitDesc: ${m.unit_description}`);
  console.log(`  Notes: ${m.notes.substring(0, 150)}...`);
  console.log('---');
});

console.log('\n=== Samples of Injectable + Topical (first 10) ===');
const injTopical = meds.filter(m => m.dosage_form === 'injectable' && m.route === 'Topical');
injTopical.slice(0, 10).forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name} | Generic: ${m.generic_name} | Species: ${m.species}`);
  console.log(`  Form: ${m.dosage_form} | Route: ${m.route} | Freq: ${m.frequency} | Unit: ${m.concentration_unit} | UnitDesc: ${m.unit_description}`);
  console.log(`  Notes: ${m.notes.substring(0, 150)}...`);
  console.log('---');
});

console.log('\n=== Samples of Tablet + PO (first 10) ===');
const tabPO = meds.filter(m => m.dosage_form === 'tablet' && m.route === 'PO');
tabPO.slice(0, 10).forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name} | Generic: ${m.generic_name} | Species: ${m.species}`);
  console.log(`  Form: ${m.dosage_form} | Route: ${m.route} | Freq: ${m.frequency} | Unit: ${m.concentration_unit} | UnitDesc: ${m.unit_description}`);
  console.log(`  Notes: ${m.notes.substring(0, 150)}...`);
  console.log('---');
});
