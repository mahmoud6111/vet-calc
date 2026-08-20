const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

console.log('Searching for concentration mismatches between notes and concentration_value...');

const mismatches = [];

meds.forEach(m => {
  const notes = m.notes || '';
  const val = m.concentration_value;
  const unit = m.concentration_unit;

  // Match "X gm / 100 ml" or "X gm in 100 ml" or "X gm per 100 ml"
  const g100Match = notes.match(/(\d+(?:\.\d+)?)\s*(?:gm|g|gram|grams)\s*(?:in|\/|per|each)\s*100\s*ml/i) ||
                    notes.match(/each\s*100\s*ml\s*contains:?\s*[-:]?\s*[^,.\n]+?\s*(\d+(?:\.\d+)?)\s*(?:gm|g|gram|grams)/i);
  if (g100Match) {
    const grams = parseFloat(g100Match[1]);
    const expectedMgPerMl = (grams * 1000) / 100; // e.g. 20 gm / 100 ml = 200 mg/ml
    if (unit === 'mg/ml' && val !== expectedMgPerMl) {
      mismatches.push({
        id: m.id,
        brand: m.brand_name,
        generic: m.generic_name,
        currentVal: val,
        expectedMgPerMl: expectedMgPerMl,
        snippet: g100Match[0]
      });
    }
  }

  // Match "X mg / ml" or "X mg/ml"
  const mgMlMatch = notes.match(/(\d+(?:\.\d+)?)\s*mg\s*\/\s*ml/i) ||
                    notes.match(/each\s*1\s*ml\s*contains:?\s*[-:]?\s*[^,.\n]+?\s*(\d+(?:\.\d+)?)\s*mg/i);
  if (mgMlMatch) {
    const mg = parseFloat(mgMlMatch[1]);
    if (unit === 'mg/ml' && val !== mg && !g100Match) {
      mismatches.push({
        id: m.id,
        brand: m.brand_name,
        generic: m.generic_name,
        currentVal: val,
        expectedMgPerMl: mg,
        snippet: mgMlMatch[0]
      });
    }
  }
});

console.log(`Found ${mismatches.length} potential concentration mismatches:`);
mismatches.forEach(m => {
  console.log(`  [ID ${m.id}] ${m.brand} (${m.generic}) -> Current: ${m.currentVal} mg/ml, Expected from note: ${m.expectedMgPerMl} mg/ml (from "${m.snippet}")`);
});
