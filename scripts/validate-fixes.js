const fs = require('fs');
const path = require('path');
const { refineMedication } = require('./refine-all-func.js');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

const refinedMeds = meds.map(m => {
  const ref = refineMedication(m);
  return {
    ...m,
    dosage_form: ref.form,
    route: ref.route,
    concentration_unit: ref.unit,
    concentration_value: ref.val
  };
});

console.log('=== RUNNING INTEGRITY CHECKS ===');

// Check 1: Any injectable with route PO?
const injPO = refinedMeds.filter(m => m.dosage_form === 'injectable' && m.route === 'PO');
console.log(`Check 1 - Injectables with route PO: ${injPO.length} (Expected: 0)`);
if (injPO.length > 0) {
  injPO.forEach(m => console.log(`  [ID ${m.id}] ${m.brand_name} | Desc: ${m.unit_description} | Notes: ${m.notes.substring(0, 80)}`));
}

// Check 2: Any injectable with route Topical?
const injTop = refinedMeds.filter(m => m.dosage_form === 'injectable' && m.route === 'Topical');
console.log(`Check 2 - Injectables with route Topical: ${injTop.length} (Expected: 0)`);
if (injTop.length > 0) {
  injTop.forEach(m => console.log(`  [ID ${m.id}] ${m.brand_name} | Desc: ${m.unit_description} | Notes: ${m.notes.substring(0, 80)}`));
}

// Check 3: Any tablet with concentration unit mg/ml?
const tabMl = refinedMeds.filter(m => m.dosage_form === 'tablet' && m.concentration_unit === 'mg/ml');
console.log(`Check 3 - Tablets with unit mg/ml: ${tabMl.length} (Expected: 0)`);
if (tabMl.length > 0) {
  tabMl.forEach(m => console.log(`  [ID ${m.id}] ${m.brand_name} | Desc: ${m.unit_description}`));
}

// Check 4: Any injectable with concentration unit mg/tab?
const injTab = refinedMeds.filter(m => m.dosage_form === 'injectable' && m.concentration_unit === 'mg/tab');
console.log(`Check 4 - Injectables with unit mg/tab: ${injTab.length} (Expected: 0)`);
if (injTab.length > 0) {
  injTab.forEach(m => console.log(`  [ID ${m.id}] ${m.brand_name} | Desc: ${m.unit_description}`));
}

// Check 5: Check Medgent specifically
const medgent = refinedMeds.filter(m => m.brand_name.includes('Medgent'));
console.log('\n=== Medgent records ===');
medgent.forEach(m => {
  console.log(`[ID ${m.id}] ${m.brand_name}: Form=${m.dosage_form}, Route=${m.route}, Unit=${m.concentration_unit}, Freq=${m.frequency}`);
});

// Check 6: Check sample large animal drugs
const largeMeds = refinedMeds.filter(m => ['large_animal', 'cattle', 'horse', 'sheep_goat', 'camel', 'poultry'].includes(m.species));
console.log(`\nTotal large animal medications: ${largeMeds.length}`);
const largeRouteCounts = {};
largeMeds.forEach(m => {
  largeRouteCounts[m.route] = (largeRouteCounts[m.route] || 0) + 1;
});
console.log('Large animal routes breakdown:', JSON.stringify(largeRouteCounts, null, 2));
