const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

const first83 = meds.slice(0, 83);
console.log(`First 83 medications:`);
first83.forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name} | Species: ${m.species} | Form: ${m.dosage_form} | Route: ${m.route} | Unit: ${m.concentration_unit} | Freq: ${m.frequency}`);
});
