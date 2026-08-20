const fs = require('fs');
const content = fs.readFileSync('default-medications.js', 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

const exactPoultry = meds.filter(m => m.species === 'poultry');
console.log('Medications with species: poultry =', exactPoultry.length);

const poultryMentions = meds.filter(m => 
  m.species !== 'poultry' && 
  /poultry|chicken|broiler|layer|chick\b/i.test(m.brand_name + ' ' + (m.unit_description || '') + ' ' + (m.notes || ''))
);
console.log('\nOther medications mentioning poultry:', poultryMentions.length);
poultryMentions.forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name} | Current species: ${m.species} | Generic: ${m.generic_name}`);
});
