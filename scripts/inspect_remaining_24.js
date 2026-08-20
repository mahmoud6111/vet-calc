const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

// 1. Injectable route issue
const injRouteIssue = meds.filter(m => m.dosage_form === 'injectable' && (m.route === 'PO' || m.route === 'Topical'));
console.log('Injectable route issue:');
injRouteIssue.forEach(m => console.log(`[ID ${m.id}] ${m.brand_name} | Form: ${m.dosage_form} | Route: ${m.route} | Desc: ${m.unit_description} | Notes: ${m.notes.substring(0, 100)}`));

// 2. Empty generic names
const emptyGen = meds.filter(m => !m.generic_name || m.generic_name.trim() === '' || m.generic_name === 'N/A');
console.log(`\nEmpty generics (${emptyGen.length}):`);
emptyGen.forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name} | Route: ${m.route} | Form: ${m.dosage_form}`);
  console.log(`  Notes: ${m.notes.substring(0, 150)}`);
});
