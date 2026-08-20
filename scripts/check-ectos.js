const fs = require('fs');
const path = require('path');
const { refineMedication } = require('./refine-all-func.js');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

const ectos = meds.filter(m => 
  /ectoparasiticide|acaricide|insecticide|phoxim|deltamethrin|cypermethrin|cyfluthrin|diazinon|amitraz|flumethrin/i.test(m.notes + ' ' + m.generic_name + ' ' + m.brand_name)
);

console.log(`Found ${ectos.length} ectoparasiticide/insecticide medications:`);
ectos.forEach(m => {
  const ref = refineMedication(m);
  console.log(`[ID ${m.id}] ${m.brand_name} | Generic: ${m.generic_name}`);
  console.log(`  Desc: ${m.unit_description} | CurrentRoute: ${m.route} -> RefinedRoute: ${ref.route}`);
  console.log(`  Notes: ${m.notes.substring(0, 100)}...`);
});
