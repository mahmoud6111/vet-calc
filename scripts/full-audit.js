const fs = require('fs');
const content = fs.readFileSync('default-medications.js', 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

// Full audit report
const problems = [];

meds.forEach(m => {
  const issues = [];
  const notes = m.notes || '';
  const isSmall = ['both','dog','cat'].includes(m.species);
  const dose0 = m.dose_mg_per_kg_min === 0 && m.dose_mg_per_kg_max === 0;
  const hasPlaceholder = /specific mg\/kg dose not available/i.test(notes);

  if (dose0 && !hasPlaceholder && !/(per animal|per label|per protocol|fixed dose|not weight)/i.test(notes)) {
    issues.push('MISSING_DOSE');
  }
  if (hasPlaceholder) {
    issues.push('PLACEHOLDER_NOTE');
  }
  if (!notes || notes.length < 30) {
    issues.push('MISSING_NOTES');
  }
  if (m.concentration_value === null || m.concentration_value === undefined || isNaN(m.concentration_value)) {
    issues.push('MISSING_CONCENTRATION');
  }

  if (issues.length > 0) {
    problems.push({
      id: m.id,
      brand: m.brand_name,
      generic: m.generic_name,
      species: m.species,
      dose_min: m.dose_mg_per_kg_min,
      dose_max: m.dose_mg_per_kg_max,
      form: m.dosage_form,
      route: m.route,
      freq: m.frequency,
      issues
    });
  }
});

// Group by issue type
const byIssue = {};
problems.forEach(p => {
  p.issues.forEach(i => {
    byIssue[i] = (byIssue[i] || 0) + 1;
  });
});

console.log('Total medications with problems:', problems.length);
console.log('Issues breakdown:', byIssue);
console.log('\nSmall animal problems:');
problems.filter(p => ['both','dog','cat'].includes(p.species)).forEach(p => {
  console.log(`  [ID ${p.id}] ${p.brand} | ${p.generic} → ${p.issues.join(', ')}`);
});
