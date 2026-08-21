const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

const aminoglycosides = meds.filter(m => {
  const g = (m.generic_name || '').toLowerCase();
  return g.includes('gentamicin') || g.includes('amikacin') || g.includes('neomycin') || g.includes('kanamycin') || g.includes('streptomycin') || g.includes('apramycin') || g.includes('spectinomycin') || g.includes('paromomycin');
});

console.log(`Found ${aminoglycosides.length} aminoglycosides/aminocyclitols:`);
aminoglycosides.forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name} | Generic: ${m.generic_name} | Form: ${m.dosage_form} | Species: ${m.species}`);
});
