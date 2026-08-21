const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

console.log(`Auditing ${meds.length} medications for Food-Producing Animal Restrictions & Withdrawal Times...`);

const results = {
  prohibitedInFoodAnimals: [],
  prohibitedInDairy: [],
  equineOnlyInLargeAnimals: [],
  aminoglycosides: [],
  hasExplicitWithdrawal: [],
  missingWithdrawalInFoodSpecies: []
};

const foodSpecies = ['cattle', 'sheep_goat', 'camel', 'large_animal', 'poultry'];

meds.forEach(m => {
  const generic = (m.generic_name || '').toLowerCase();
  const brand = (m.brand_name || '').toLowerCase();
  const notes = (m.notes || '').toLowerCase();
  const species = m.species || '';
  const isFoodSp = foodSpecies.includes(species) || species === 'large_animal';

  // 1. Prohibited in food-producing animals
  if (generic.includes('chloramphenicol') || generic.includes('metronidazole') || generic.includes('nitrofurazone') || generic.includes('furazolidone') || notes.includes('not used in food producing') || notes.includes('not for food') || notes.includes('prohibited in food')) {
    results.prohibitedInFoodAnimals.push({ id: m.id, brand: m.brand_name, generic: m.generic_name, species: m.species, reason: 'Prohibited in food animals globally or manufacturer restriction' });
  }

  // 2. Aminoglycosides
  if (generic.includes('gentamicin') || generic.includes('amikacin') || generic.includes('tobramycin') || generic.includes('neomycin') || generic.includes('kanamycin')) {
    results.aminoglycosides.push({ id: m.id, brand: m.brand_name, generic: m.generic_name, species: m.species, form: m.dosage_form });
  }

  // 3. Prohibited in dairy / milk
  if (notes.includes('prohibited in lactating') || notes.includes('dairy') || notes.includes('milk w/d') || notes.includes('avoid dairy') || generic.includes('phenylbutazone') || generic.includes('nitroxynil') || generic.includes('tilmicosin')) {
    results.prohibitedInDairy.push({ id: m.id, brand: m.brand_name, generic: m.generic_name, species: m.species });
  }

  // 4. Withdrawal mentions
  if (notes.includes('meat w/d') || notes.includes('milk w/d') || notes.includes('withdrawal') || notes.includes('w/d:')) {
    results.hasExplicitWithdrawal.push({ id: m.id, brand: m.brand_name });
  } else if (isFoodSp && m.dose_mg_per_kg_min > 0) {
    results.missingWithdrawalInFoodSpecies.push({ id: m.id, brand: m.brand_name, generic: m.generic_name, species: m.species });
  }
});

console.log(`\nAudit Results:`);
console.log(`- Prohibited in Food Animals: ${results.prohibitedInFoodAnimals.length}`);
console.log(`- Aminoglycoside Products: ${results.aminoglycosides.length}`);
console.log(`- Dairy / Milk Restrictive / Specific Products: ${results.prohibitedInDairy.length}`);
console.log(`- Products with explicit withdrawal notes: ${results.hasExplicitWithdrawal.length}`);
console.log(`- Food-animal products without explicit withdrawal notes: ${results.missingWithdrawalInFoodSpecies.length}`);

fs.writeFileSync(path.join(__dirname, 'food_animal_audit.json'), JSON.stringify(results, null, 2), 'utf8');
console.log(`\nSaved detailed breakdown to scripts/food_animal_audit.json`);
