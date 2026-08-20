const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

// Collect all unique generic names
const generics = {};
meds.forEach(m => {
  const g = (m.generic_name || 'N/A').trim();
  if (!generics[g]) generics[g] = [];
  generics[g].push({
    id: m.id,
    brand: m.brand_name,
    species: m.species,
    dose_min: m.dose_mg_per_kg_min,
    dose_max: m.dose_mg_per_kg_max,
    route: m.route,
    form: m.dosage_form,
    hasPlaceholder: /specific mg\/kg dose not available/i.test(m.notes || ''),
    dose0: m.dose_mg_per_kg_min === 0 && m.dose_mg_per_kg_max === 0
  });
});

console.log(`Unique generic names: ${Object.keys(generics).length}`);

// Sort by count of meds
const sortedGenerics = Object.entries(generics).sort((a, b) => b[1].length - a[1].length);

console.log('\nTop 40 Generic Names:');
sortedGenerics.slice(0, 40).forEach(([g, list]) => {
  const placeholders = list.filter(m => m.hasPlaceholder).length;
  const zeroDoses = list.filter(m => m.dose0).length;
  console.log(`${g} (${list.length} meds) - ${placeholders} placeholders, ${zeroDoses} zero-doses`);
});
