const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

// Find all placeholder medications
const placeholders = meds.filter(m => /specific mg\/kg dose not available/i.test(m.notes || ''));
console.log(`Total placeholder medications: ${placeholders.length}`);

// Group placeholders by generic_name
const phByGeneric = {};
placeholders.forEach(m => {
  const g = (m.generic_name || 'N/A').trim();
  if (!phByGeneric[g]) phByGeneric[g] = [];
  phByGeneric[g].push({
    id: m.id,
    brand: m.brand_name,
    species: m.species,
    route: m.route,
    form: m.dosage_form,
    desc: m.unit_description,
    notesSnippet: m.notes.substring(0, 120)
  });
});

console.log('\nPlaceholders by Generic Name:');
Object.entries(phByGeneric).sort((a, b) => b[1].length - a[1].length).forEach(([g, list]) => {
  console.log(`\n=== ${g} (${list.length} meds) ===`);
  list.slice(0, 3).forEach(m => {
    console.log(`  [ID ${m.id}] ${m.brand} (${m.species}) | Route: ${m.route} | Form: ${m.form} | Desc: ${m.desc}`);
    console.log(`    Notes: ${m.notesSnippet}`);
  });
});
