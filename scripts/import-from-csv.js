const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'medications.csv');
const rawContent = fs.readFileSync(csvPath, 'utf8');

// Basic CSV parser that handles quotes and multiline strings
function parseCSV(text) {
  // Remove UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++; // skip \n
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
}

const parsedRows = parseCSV(rawContent);
if (parsedRows.length < 2) {
  console.error('No data rows found in CSV.');
  process.exit(1);
}

const headers = parsedRows[0].map(h => h.trim());
const numericFields = new Set(['dose_mg_per_kg_min', 'dose_mg_per_kg_max', 'concentration_value', 'concentration_ml']);

function normalizeSpecies(sp) {
  if (!sp) return 'both';
  const clean = sp.toLowerCase().trim();
  if (['both', 'dogs and cats', 'dogs & cats', 'dog and cat', 'dog & cat', 'pets'].includes(clean)) {
    return 'both';
  }
  if (['dog', 'dogs', 'canine'].includes(clean)) return 'dog';
  if (['cat', 'cats', 'feline'].includes(clean)) return 'cat';
  if (['cattle', 'cow', 'bovine'].includes(clean)) return 'cattle';
  if (['horse', 'horses', 'equine'].includes(clean)) return 'horse';
  if (['sheep_goat', 'sheep and goat', 'sheep & goat', 'sheep', 'goat', 'caprine', 'ovine'].includes(clean)) return 'sheep_goat';
  if (['camel', 'camels'].includes(clean)) return 'camel';
  if (['poultry', 'chicken', 'birds', 'avian'].includes(clean)) return 'poultry';
  if (['large_animal', 'large animal', 'large animals', 'livestock'].includes(clean)) return 'large_animal';
  return clean;
}

const medications = [];

for (let i = 1; i < parsedRows.length; i++) {
  const row = parsedRows[i];
  const med = {};

  headers.forEach((header, colIndex) => {
    let val = row[colIndex] !== undefined ? row[colIndex].trim() : '';

    if (numericFields.has(header)) {
      if (val === '' || val === null) {
        med[header] = null;
      } else {
        const num = Number(val);
        med[header] = isNaN(num) ? val : num;
      }
    } else if (header === 'species') {
      med[header] = normalizeSpecies(val);
    } else {
      med[header] = val;
    }
  });

  medications.push(med);
}

const outputPath = path.join(__dirname, '..', 'default-medications.js');
const jsContent = `// Large default medications database for VetCalc\nwindow.DEFAULT_MEDICATIONS = ${JSON.stringify(medications, null, 6)};\n`;

fs.writeFileSync(outputPath, jsContent, 'utf8');
console.log(`Successfully converted CSV to ${outputPath} (${medications.length} medications).`);
