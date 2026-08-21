const fs = require('fs');
const path = require('path');

const defaultMedsPath = path.join(__dirname, '..', 'default-medications.js');
const csvPath = path.join(__dirname, '..', 'medications.csv');

const content = fs.readFileSync(defaultMedsPath, 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

function cleanNoteText(note) {
  if (!note) return '';
  let str = note.trim();

  // Deduplicate repeated Ref: Ref:
  str = str.replace(/Ref:\s*Ref:/gi, 'Ref:');
  
  // Split on pipe delimiters
  const pipes = str.split(/\s*\|\s*/);
  
  const cleanedPipes = pipes.map(pipe => {
    let p = pipe.trim();
    if (!p.includes('...')) return p;

    // Remove the ... and anything after it in this pipe segment
    let text = p.replace(/\.\.\..*$/, '').trim();

    // Check if there are bullet points (' - ', ' • ', '» ', '\n- ')
    const lastBulletIdx = Math.max(text.lastIndexOf(' - '), text.lastIndexOf(' • '), text.lastIndexOf(' » '));
    const lastPeriodIdx = text.lastIndexOf('. ');
    const lastSemicolonIdx = text.lastIndexOf('; ');

    let bestCutoff = -1;

    if (lastBulletIdx > 30) {
      bestCutoff = lastBulletIdx;
    } else if (lastPeriodIdx > 30) {
      bestCutoff = lastPeriodIdx + 1;
    } else if (lastSemicolonIdx > 30) {
      bestCutoff = lastSemicolonIdx + 1;
    }

    if (bestCutoff > 20) {
      text = text.substring(0, bestCutoff).trim();
    } else {
      text = text.replace(/\s+[^\s]+$/, '').trim();
    }

    // Clean dangling section headers or trailing colons/dashes
    text = text.replace(/[\s\-•:,;]+$/, '').trim();
    text = text.replace(/\b(USES|PROPERTIES|PROPERITIES|INDICATIONS|PHARMACOLOGY|DOSAGE|COMPOSITION|DESCRIPTION|PRESENTATION|ACTIVITY|PHARMACEUTICAL FORM|M\.O\.A|Target species|Indication|Properties|Composition)\b[\s:.-]*$/i, '').trim();
    text = text.replace(/[\s\-•:,;]+$/, '').trim();

    if (text && !/[.!?]$/.test(text)) {
      text += '.';
    }
    return text;
  }).filter(p => p && p.length > 5);

  const uniquePipes = [];
  cleanedPipes.forEach(p => {
    if (!uniquePipes.some(u => u.toLowerCase() === p.toLowerCase())) {
      uniquePipes.push(p);
    }
  });

  let res = uniquePipes.join(' | ');
  res = res.replace(/Ref:\s*Ref:/gi, 'Ref:');
  res = res.replace(/Properities:/gi, 'Properties:');
  res = res.replace(/against\.\s+most/gi, 'against most');
  res = res.replace(/anti-ipflammatory/gi, 'anti-inflammatory');
  res = res.replace(/non-steroidal antinflammalory/gi, 'non-steroidal anti-inflammatory');
  res = res.replace(/\s+/g, ' ').trim();
  return res;
}

// Process all meds
let modifiedCount = 0;
const cleanedMeds = meds.map(med => {
  const original = med.notes || '';
  const cleaned = cleanNoteText(original);
  if (cleaned !== original) {
    modifiedCount++;
  }
  return {
    ...med,
    notes: cleaned
  };
});

console.log(`Cleaned notes for ${modifiedCount} of ${cleanedMeds.length} medications.`);

// Save default-medications.js
const jsOutput = `// Large default medications database for VetCalc\nwindow.DEFAULT_MEDICATIONS = ${JSON.stringify(cleanedMeds, null, 6)};\n`;
fs.writeFileSync(defaultMedsPath, jsOutput, 'utf8');
console.log(`Saved updated ${defaultMedsPath}`);

// Update medications.csv
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

const csvRows = [headers.join(',')];
for (const med of cleanedMeds) {
  const row = headers.map(h => escapeCsvValue(formatFieldValue(med, h)));
  csvRows.push(row.join(','));
}

try {
  fs.writeFileSync(csvPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  console.log(`Saved updated ${csvPath}`);
} catch (err) {
  console.warn('Could not write CSV directly (may be open in another program):', err.message);
}
