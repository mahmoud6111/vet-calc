const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const medications = JSON.parse(jsonMatch);

console.log(`Loaded ${medications.length} medications.`);

const headers = [
  'id',
  'brand_name',
  'generic_name',
  'species',
  'dose_mg_per_kg_min',
  'dose_mg_per_kg_max',
  'concentration_value',
  'concentration_unit',
  'concentration_ml',
  'dosage_form',
  'route',
  'frequency',
  'unit_description',
  'notes'
];

function formatFieldValue(med, header) {
  let val = med[header];
  if (header === 'species') {
    if (val === 'both') return 'dogs and cats';
  }
  return val;
}

function escapeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

const csvRows = [];
csvRows.push(headers.join(','));

for (const med of medications) {
  const row = headers.map(h => escapeCsvValue(formatFieldValue(med, h)));
  csvRows.push(row.join(','));
}

const outputPath = path.join(__dirname, '..', 'medications.csv');
try {
  fs.writeFileSync(outputPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  console.log(`Successfully generated CSV at: ${outputPath} (${medications.length} rows)`);
} catch (err) {
  if (err.code === 'EBUSY') {
    console.warn(`Note: ${outputPath} is locked by another program (e.g. Excel). Saved to medications_new.csv instead.`);
    const backupPath = path.join(__dirname, '..', 'medications_new.csv');
    fs.writeFileSync(backupPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  } else {
    throw err;
  }
}
