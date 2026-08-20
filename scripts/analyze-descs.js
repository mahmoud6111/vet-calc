const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

const descTypes = {};
meds.forEach(m => {
  const desc = m.unit_description || 'EMPTY';
  // Normalize desc by removing company in parentheses and specific numbers
  const norm = desc
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\d+(\.\d+)?\s*(ml|l|gm|g|kg|mg|dose|bolus|tab|sachet|vial|ampoule)/gi, '$2')
    .trim();
  descTypes[norm] = (descTypes[norm] || 0) + 1;
});

console.log('Normalized unit descriptions:');
console.log(JSON.stringify(descTypes, null, 2));
