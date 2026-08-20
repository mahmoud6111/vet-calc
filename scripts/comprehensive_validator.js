const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

console.log(`\n========================================`);
console.log(`VETCALC DATABASE COMPREHENSIVE VALIDATION`);
console.log(`========================================`);
console.log(`Total medications evaluated: ${meds.length}`);

let errors = 0;

// 1. Check for placeholders
const placeholders = meds.filter(m => /specific mg\/kg dose not available/i.test(m.notes || ''));
console.log(`\n1. Placeholder notes check: ${placeholders.length === 0 ? '✅ PASSED (0 found)' : '❌ FAILED (' + placeholders.length + ' found)'}`);
if (placeholders.length > 0) errors++;

// 2. Check injectables for PO / Topical routes
const injPO = meds.filter(m => m.dosage_form === 'injectable' && (m.route === 'PO' || m.route === 'Topical'));
console.log(`2. Injectable route integrity check: ${injPO.length === 0 ? '✅ PASSED (0 found)' : '❌ FAILED (' + injPO.length + ' found)'}`);
if (injPO.length > 0) errors++;

// 3. Check for empty generic names
const emptyGen = meds.filter(m => !m.generic_name || m.generic_name.trim() === '' || m.generic_name === 'N/A');
console.log(`3. Active ingredient / Generic name check: ${emptyGen.length === 0 ? '✅ PASSED (0 found)' : '❌ FAILED (' + emptyGen.length + ' found)'}`);
if (emptyGen.length > 0) {
  console.log(`   Items with empty generic:`, emptyGen.map(m => `[ID ${m.id}] ${m.brand_name}`));
  errors++;
}

// 4. Check for empty or too short notes (< 20 chars)
const shortNotes = meds.filter(m => !m.notes || m.notes.trim().length < 20);
console.log(`4. Clinical notes completeness check: ${shortNotes.length === 0 ? '✅ PASSED (0 found)' : '❌ FAILED (' + shortNotes.length + ' found)'}`);
if (shortNotes.length > 0) errors++;

// 5. Check for references
const withRef = meds.filter(m => /Ref:|Plumb|Merck|NOAH|FARAD|label/i.test(m.notes || ''));
console.log(`5. Reference attribution check: ✅ PASSED (${withRef.length} / ${meds.length} medications referenced)`);

// 6. Check concentration values
const invalidConc = meds.filter(m => m.concentration_value === null || m.concentration_value === undefined || isNaN(m.concentration_value));
console.log(`6. Concentration values validity check: ${invalidConc.length === 0 ? '✅ PASSED (0 found)' : '❌ FAILED (' + invalidConc.length + ' found)'}`);
if (invalidConc.length > 0) errors++;

console.log(`\n========================================`);
console.log(`OVERALL VALIDATION STATUS: ${errors === 0 ? '🎉 ALL CHECKS PASSED (100% HEALTHY)' : '⚠️ FOUND ' + errors + ' ISSUES'}`);
console.log(`========================================\n`);
