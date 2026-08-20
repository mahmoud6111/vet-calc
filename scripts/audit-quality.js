const fs = require('fs');
const content = fs.readFileSync('default-medications.js', 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

// List ALL small animal meds (both/dog/cat) that have dose=0
const smallZero = meds.filter(m => ['both','dog','cat'].includes(m.species) && m.dose_mg_per_kg_min === 0 && m.dose_mg_per_kg_max === 0);
console.log('\nSmall animal meds with dose 0/0 (' + smallZero.length + '):');
smallZero.forEach(m => console.log('[ID ' + m.id + '] ' + m.brand_name + ' | ' + m.generic_name + ' | Route: ' + m.route + ' | Form: ' + m.dosage_form));

// Placeholder
const placeholder = meds.filter(m => /specific mg\/kg dose not available/i.test(m.notes || ''));
const speciesPH = {};
placeholder.forEach(m => { speciesPH[m.species] = (speciesPH[m.species] || 0) + 1; });
console.log('\nPlaceholder dose notes by species:', speciesPH);

// Large animal sample - meds with doses
const largeWithDose = meds.filter(m => !['both','dog','cat'].includes(m.species) && m.dose_mg_per_kg_min > 0);
console.log('\nLarge animal meds WITH real dose:', largeWithDose.length);
console.log('Large animal meds WITHOUT dose (dose=0):', meds.filter(m => !['both','dog','cat'].includes(m.species) && m.dose_mg_per_kg_min === 0 && m.dose_mg_per_kg_max === 0).length);
