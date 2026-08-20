const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

const SPECIFIC_UPDATES = {
  '853': {
    dosage_form: 'oral powder',
    route: 'PO',
    generic_name: 'Piperazine + Artemisia herb',
    dose_min: 100,
    dose_max: 100
  },
  '201': {
    generic_name: 'Sodium Bicarbonate + Boric acid + Antiseptics'
  },
  '359': {
    generic_name: 'DL-Methionine + L-Carnitine + Choline + B-Vitamins'
  },
  '387': {
    generic_name: 'Silymarin + Carnitine + Choline + B-Vitamins'
  },
  '388': {
    generic_name: 'Sodium Bicarbonate + Boric acid + Menthol'
  },
  '458': {
    generic_name: 'Neomycin + Sulphaguanidine + Kaolin'
  },
  '459': {
    generic_name: 'Neomycin + Sulfonamides + Kaolin + Pectin'
  },
  '460': {
    generic_name: 'Neomycin + Streptomycin + Sulfonamides'
  },
  '461': {
    generic_name: 'Neomycin + Sulphaguanidine + Kaolin + Pectin'
  },
  '462': {
    generic_name: 'Oral Electrolytes + Citrus Pulp + Probiotics'
  },
  '464': {
    generic_name: 'Neomycin + Sulfaguanidine + Bismuth'
  },
  '493': {
    generic_name: 'Triple Sulfonamides + Dextrose + Electrolytes'
  },
  '494': {
    generic_name: 'L-Carnitine + Sorbitol + Choline + Artichoke'
  },
  '550': {
    generic_name: 'Saccharomyces + Magnesium Carbonate + Minerals'
  },
  '655': {
    generic_name: 'Triple Sulfonamides + Streptomycin'
  },
  '656': {
    generic_name: 'Saccharomyces cerevisiae + Digestive Enzymes'
  },
  '675': {
    generic_name: 'Neomycin + Sulfaguanidine + Kaolin'
  },
  '765': {
    generic_name: 'Oregano Oil (Essential Oil Antiseptic)'
  },
  '875': {
    generic_name: 'Triple Sulfonamides + Streptomycin'
  },
  '876': {
    generic_name: 'Benzyl Benzoate + Salicylic Acid + Sulfur'
  },
  '924': {
    generic_name: 'Acetyl DL-Methionine + Choline + B-Vitamins'
  },
  '938': {
    generic_name: 'Yeast Extract (Saccharomyces) + Tannins'
  },
  '983': {
    generic_name: 'Vitamin B Complex + Nicotinamide'
  },
  '1024': {
    generic_name: 'Calcium Gluconate + Magnesium + Vitamins'
  }
};

const updatedMeds = meds.map(med => {
  const m = { ...med };
  const u = SPECIFIC_UPDATES[m.id];
  if (u) {
    Object.assign(m, u);
  }
  return m;
});

// Write default-medications.js
const defaultMedsPath = path.join(__dirname, '..', 'default-medications.js');
const jsOutput = `// Large default medications database for VetCalc\nwindow.DEFAULT_MEDICATIONS = ${JSON.stringify(updatedMeds, null, 6)};\n`;
fs.writeFileSync(defaultMedsPath, jsOutput, 'utf8');
console.log(`Updated ${defaultMedsPath}`);

// Write medications.csv
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
for (const med of updatedMeds) {
  const row = headers.map(h => escapeCsvValue(formatFieldValue(med, h)));
  csvRows.push(row.join(','));
}

const csvPath = path.join(__dirname, '..', 'medications.csv');
try {
  fs.writeFileSync(csvPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  console.log(`Successfully updated ${csvPath}`);
} catch (err) {
  if (err.code === 'EBUSY') {
    console.warn(`Note: ${csvPath} is locked. Saved to medications_new.csv.`);
    const backupPath = path.join(__dirname, '..', 'medications_new.csv');
    fs.writeFileSync(backupPath, '\uFEFF' + csvRows.join('\r\n'), 'utf8');
  } else {
    throw err;
  }
}
