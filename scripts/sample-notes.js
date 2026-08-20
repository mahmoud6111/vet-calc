const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

const largeDrugs = meds.slice(83);

console.log('Sample notes from large animal drugs:');
for (let i = 0; i < 20; i++) {
  const m = largeDrugs[i * 45];
  console.log(`[ID ${m.id}] ${m.brand_name} (${m.species})`);
  console.log(`  Generic: ${m.generic_name}`);
  console.log(`  Current: Form=${m.dosage_form} | Route=${m.route} | Unit=${m.concentration_unit} | ConcVal=${m.concentration_value} | Freq=${m.frequency}`);
  console.log(`  UnitDesc: ${m.unit_description}`);
  console.log(`  Notes: ${m.notes}`);
  console.log('----------------------------------------------------');
}
