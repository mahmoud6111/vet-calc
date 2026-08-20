const fs = require('fs');
const path = require('path');
const { classifyMedication } = require('./classify-meds.js');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

const classified = meds.map(m => {
  const c = classifyMedication(m);
  return {
    ...m,
    dosage_form: c.form,
    route: c.route,
    concentration_unit: c.unit,
    concentration_value: c.val,
    category: c.category
  };
});

console.log(`Total medications: ${classified.length}`);

// Group by category
const catCounts = {};
const routeCounts = {};
const formCounts = {};
classified.forEach(m => {
  catCounts[m.category] = (catCounts[m.category] || 0) + 1;
  routeCounts[m.route] = (routeCounts[m.route] || 0) + 1;
  formCounts[m.dosage_form] = (formCounts[m.dosage_form] || 0) + 1;
});

console.log('\nCategories:', JSON.stringify(catCounts, null, 2));
console.log('\nRoutes:', JSON.stringify(routeCounts, null, 2));
console.log('\nDosage Forms:', JSON.stringify(formCounts, null, 2));

// Check any drug where dosage_form is injectable and route is PO
const injPO = classified.filter(m => m.dosage_form === 'injectable' && m.route === 'PO');
console.log(`\nInjectable with route PO: ${injPO.length}`);

// Check any drug where dosage_form is injectable and route is Topical
const injTop = classified.filter(m => m.dosage_form === 'injectable' && m.route === 'Topical');
console.log(`Injectable with route Topical: ${injTop.length}`);

// Check any drug where species is large animal and route is PO but desc has vial/amp
const largePOVial = classified.filter(m => 
  ['large_animal', 'cattle', 'horse', 'sheep_goat', 'camel', 'poultry'].includes(m.species) &&
  m.route === 'PO' &&
  /vial|amp/i.test(m.unit_description)
);
console.log(`Large animal PO with vial in desc: ${largePOVial.length}`);
if (largePOVial.length > 0) {
  largePOVial.forEach(m => console.log(`  [ID ${m.id}] ${m.brand_name} | Desc: ${m.unit_description} | Notes: ${m.notes.substring(0, 80)}`));
}
