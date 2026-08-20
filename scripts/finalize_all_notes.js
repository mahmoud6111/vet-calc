const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

function clean(str) {
  return (str || '').trim().replace(/\s+/g, ' ');
}

const SPECIFIC_FIXES = {
  '34': { // Aironyl (dog)
    dose_min: 0.03,
    dose_max: 0.05,
    notes: 'Category: Bronchodilator (Beta-2 Agonist). Terbutaline relaxes bronchial smooth muscle. Indications: Canine asthma, chronic bronchitis, and collapsing trachea. Dosage: Dogs 0.03-0.05 mg/kg (or 1.25-5 mg per dog) PO q8-12h. Ref: Plumb\'s 9th Ed. p. 1105.'
  },
  '35': { // Aironyl (cat)
    dose_min: 0.03,
    dose_max: 0.05,
    notes: 'Category: Bronchodilator (Beta-2 Agonist). Terbutaline relaxes bronchial smooth muscle. Indications: Feline allergic asthma and bronchospasm. Dosage: Cats 0.03-0.05 mg/kg (or 0.3-1.25 mg per cat) PO q8-12h. Ref: Plumb\'s 9th Ed. p. 1105.'
  },
  '38': { // Mucogel / Epicogel
    notes: 'Category: Antacid (Aluminium/Magnesium Hydroxide). Neutralizes gastric acid and protects mucosal lining. Indications: Gastric ulcers, reflux esophagitis, hyperphosphatemia in renal disease. Dosage: Dogs/Cats 0.5-1 ml/kg PO q6-8h. Give 1-2 hours apart from other medications. Ref: Plumb\'s 9th Ed. p. 48.'
  },
  '143': { // Avil
    dose_min: 1,
    dose_max: 1,
    notes: 'Category: Antihistamine (H1 Blocker). Pheniramine maleate. Indications: Acute allergic reactions, urticaria, serum sickness, insect stings, and pruritus. Dosage: Cattle/Horses: 1 mg/kg (approx. 3-4 ampoules per animal) IV/IM; Sheep/Goats: 1 ampoule IM. Ref: Merck Vet Manual.'
  },
  '220': { // Arina-ject
    notes: 'Category: Metabolic Tonic / Rumen Stimulant. Combined vitamins, phosphorus, and metabolic activators. Indications: Anemia, debility, rumen stasis, indigestion, and surgical convalescence. Dosage: Cattle/Horses: 10-20 mL IM/SC; Calves/Sheep: 5-10 mL. Ref: Manufacturer label.'
  },
  '324': { // Eucarbon
    notes: 'Category: Gastrointestinal Adsorbent / Antidote. Activated charcoal and natural sulfur for poison adsorption. Indications: Ingestion of plant alkaloids, rodenticides, organophosphates, and chemicals. Dosage: 1-4 g/kg PO slurry in water via stomach tube or syringe. Ref: Plumb\'s 9th Ed. p. 18.'
  },
  '325': { // Carbosylane
    notes: 'Category: Gastrointestinal Adsorbent / Antidote. Activated charcoal and simethicone for toxin binding and antiflatulent action. Indications: Acute poisonings and intestinal fermentation. Dosage: 1-4 g/kg PO slurry in water. Ref: Plumb\'s 9th Ed. p. 18.'
  },
  '326': { // Olive Oil
    notes: 'Category: Physical Demulcent / Emollient. Coats mucous membranes to soothe irritation. Indications: Ingestion of corrosive/caustic chemicals (acids, alkalis). Dosage: Horses/Cattle: 500-1000 mL PO via stomach tube; Small animals: 10-50 mL PO. ⚠️ Contraindicated in fat-soluble toxicosis. Ref: Merck Vet Manual.'
  },
  '332': { // Artamin 250
    dose_min: 10,
    dose_max: 15,
    notes: 'Category: Chelating Agent / Heavy Metal Antidote. D-Penicillamine forms soluble complexes with heavy metals for urinary excretion. Indications: Chronic lead poisoning, copper storage hepatopathy, and cystine urolithiasis. Dosage: Dogs 10-15 mg/kg PO q12h on an empty stomach. Ref: Plumb\'s 9th Ed. p. 918.'
  },
  '333': { // Potassium Permanganate
    notes: 'Category: Chemical Antidote (Oxidizing Agent). 0.02% (1:5000) solution oxidizes poisons in the gastric lumen. Indications: Poisoning by alkaloids (strychnine, nicotine, morphine), phosphorus, and cyanide. Dosage: Administer 1-2 Liters of 1:5000 solution PO via stomach tube for gastric lavage. Ref: Merck Vet Manual.'
  },
  '334': { // Hydrogen Peroxide
    notes: 'Category: Emetic (Gastric Irritant). 3% Hydrogen Peroxide directly stimulates gastric mucosal sensory receptors to induce rapid vomiting. Indications: Immediate induction of emesis in dogs within 1-2 hours of toxin ingestion. Dosage: Dogs: 1-2 mL/kg (max 45 mL) PO once. ⚠️ Avoid in cats. Ref: Plumb\'s 9th Ed. p. 574.'
  },
  '336': { // Soapy Water
    notes: 'Category: Chemical Antidote (Neutralizing / Emetic). Mild alkaline soap solution that neutralizes ingested acids and acts as a mechanical emetic. Indications: Emergency ingestion of concentrated mineral acids. Dosage: 1-2 Liters PO via stomach tube for large animals. Ref: Merck Vet Manual.'
  },
  '337': { // Vinegar (Acetic Acid)
    notes: 'Category: Chemical Antidote (Acidifying Agent). 5% Acetic acid lowers ruminal pH, converting toxic free ammonia into unabsorbable ammonium (NH4+) ions. Indications: Acute non-protein nitrogen (urea) and ammonia poisoning in cattle and sheep. Dosage: Cattle: 2-6 Liters PO via stomach tube; Sheep: 0.5-1 Liter PO. Ref: Plumb\'s 9th Ed. p. 13.'
  },
  '338': { // Copper Sulfate
    notes: 'Category: Chemical Antidote / Astringent. Forms insoluble copper phosphide precipitate with ingested phosphorus. Indications: Acute yellow phosphorus and zinc phosphide rodenticide ingestion. Dosage: Dissolve 2-4 g in 500 mL water and administer PO immediately; follow with gastric lavage. Ref: Merck Vet Manual.'
  },
  '387': { // Bovipak
    notes: 'Category: Metabolic Tonic / Liver Support. Concentrated vitamins, carnitine, choline, silymarin (milk thistle), and propylene glycol. Indications: Subclinical/clinical ketosis, fatty liver syndrome, and post-partum anorexia in dairy cows. Dosage: Cattle: 100 mL PO daily for 3-5 days. Ref: Manufacturer label.'
  },
  '410': { // Banmith
    dose_min: 12.5,
    dose_max: 12.5,
    notes: 'Category: Anthelmintic (Tetrahydropyrimidine). Pyrantel tartrate. Indications: Gastrointestinal roundworms, pinworms, and strongyles in horses, cattle, and sheep. Dosage: Cattle/Horses/Sheep: 12.5 mg/kg (or 10 g powder / 100 kg body weight) PO single dose. Ref: Plumb\'s 9th Ed. p. 1018.'
  },
  '623': { // Diazinon
    notes: 'Category: Ectoparasiticide (Organophosphate). Contact insecticide inhibiting acetylcholinesterase. Indications: Control of ticks, lice, mange mites, and blowfly strike. Dosage: Dilute in water per label (1:1000 for plunge dipping or spraying). For external veterinary use only. Withdrawal: Meat 14-28 days. Ref: Merck Vet Manual.'
  },
  '630': { // Cebacil gel
    notes: 'Category: Ectoparasiticide (Organophosphate). Phoxim 50%. Indications: Sarcoptic mange, psoroptic mange, lice, and tick infestations. Dosage: Apply topically to localized mange lesions or dilute 1:1000 for full wash/dip. External use only. Withdrawal: Meat 14-28 days. Ref: Merck Vet Manual.'
  },
  '938': { // Farma forte
    notes: 'Category: Prebiotic / Rumen Stabilizer. Inactive yeast extract (Saccharomyces cerevisiae) and natural tannins. Indications: Enteric stabilization, diarrhea prevention, and appetite stimulation. Dosage: Calves: 10-20 g PO daily; Poultry: 1-2 kg per ton of feed. Ref: Manufacturer label.'
  }
};

const finalMeds = meds.map(med => {
  const m = { ...med };
  const fix = SPECIFIC_FIXES[m.id];
  if (fix) {
    if (fix.dose_min !== undefined) m.dose_mg_per_kg_min = fix.dose_min;
    if (fix.dose_max !== undefined) m.dose_mg_per_kg_max = fix.dose_max;
    if (fix.notes) m.notes = fix.notes;
  }
  return m;
});

// Write default-medications.js
const defaultMedsPath = path.join(__dirname, '..', 'default-medications.js');
const jsOutput = `// Large default medications database for VetCalc\nwindow.DEFAULT_MEDICATIONS = ${JSON.stringify(finalMeds, null, 6)};\n`;
fs.writeFileSync(defaultMedsPath, jsOutput, 'utf8');
console.log(`Updated ${defaultMedsPath} with ${finalMeds.length} medications.`);

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
for (const med of finalMeds) {
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
