const fs = require('fs');
const path = require('path');
const { CLINICAL_KNOWLEDGE_FULL } = require('./clinical_knowledge_full.js');
const { CLINICAL_KNOWLEDGE } = require('./clinical_knowledge.js');

const KNOWLEDGE = { ...CLINICAL_KNOWLEDGE, ...CLINICAL_KNOWLEDGE_FULL };

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

function cleanText(str) {
  return (str || '').trim().replace(/\s+/g, ' ');
}

function processMedication(med) {
  const m = { ...med };
  const brand = cleanText(m.brand_name);
  let generic = cleanText(m.generic_name);
  const desc = cleanText(m.unit_description);
  let notes = cleanText(m.notes);
  let freq = cleanText(m.frequency);
  let form = cleanText(m.dosage_form);
  let route = cleanText(m.route);

  // -------------------------------------------------------------
  // 1. SPECIFIC MISMATCH CORRECTIONS
  // -------------------------------------------------------------
  if (m.id === '314') { // Mannitol
    m.route = 'IV';
    m.dosage_form = 'injectable';
    route = 'IV';
    form = 'injectable';
  }
  if (m.id === '509') { // Dimethicone
    m.route = 'PO';
    m.dosage_form = 'oral suspension';
    route = 'PO';
    form = 'oral suspension';
  }
  if (m.id === '623' || m.id === '689' || m.id === '984') { // Diazinon, Diacidol, Ectofox
    m.route = 'Topical';
    m.dosage_form = 'topical solution';
    route = 'Topical';
    form = 'topical solution';
  }

  // -------------------------------------------------------------
  // 2. RESOLVE N/A GENERICS
  // -------------------------------------------------------------
  if (generic === 'N/A' || !generic) {
    if (/Scourban/i.test(brand)) generic = 'Neomycin + Sulphaguanidine + Kaolin';
    else if (/Mange Cide/i.test(brand)) generic = 'Monosulfiram / Sulfur';
    else if (/Banscour/i.test(brand)) generic = 'Neomycin + Sulphonamides + Pectin';
    else if (/Epsom/i.test(brand)) generic = 'Magnesium Sulfate';
    else if (/Liquid paraffin|Paraffin/i.test(brand)) generic = 'Liquid Paraffin';
    else if (/Duphalac/i.test(brand)) generic = 'Lactulose';
    else if (/Bloatryl/i.test(brand)) generic = 'Dimethicone + Turpentine Oil';
    else if (/Bloatzal/i.test(brand)) generic = 'Methyl Silicon + Turpentine Oil';
    else if (/Dimethicone/i.test(brand)) generic = 'Dimethicone';
    else if (/Tymponal/i.test(brand)) generic = 'Simethicone + Essential Oils';
    else if (/Phytopan/i.test(brand)) generic = 'Pyrethroid / Fipronil';
    else if (/Laxavet/i.test(brand)) generic = 'Magnesium Carbonate + Sodium Carbonate';
    else if (/Gentian/i.test(brand)) generic = 'Gentian Violet';
    else if (/FlyBlock/i.test(brand)) generic = 'Cyfluthrin + Citronella';
    else if (/Verrutrat/i.test(brand)) generic = 'Chlorobutanol';
    else if (/Sedacol/i.test(brand)) generic = 'Sorbitol';
    else if (/Fungistop/i.test(brand)) generic = 'Difenoconazole';
    else if (/Boviplex/i.test(brand)) generic = 'Vitamin B Complex + Iron';
    else if (/First Plex/i.test(brand)) generic = 'Vitamin B Complex + Vitamin C + Iron';
    else if (/Gentaprim/i.test(brand)) generic = 'Sulphadimethoxine + Trimethoprim + Gentamicin';
    else if (/Mastodin/i.test(brand)) generic = 'Iodine + Camphor + Herbal extract';
    else if (/Ecto tick/i.test(brand)) generic = 'Thymol + Menthol';
    else if (/Effydral|Electrall|Lactadral/i.test(brand)) generic = 'Oral Electrolytes + Dextrose';
    else if (/Neodigestol|Rumin Booster|Ruminoantacid|Digest punch/i.test(brand)) generic = 'Digestive Enzymes + Rumen Probiotics';
    else if (/Ornipural|Biohepatol|Livarol/i.test(brand)) generic = 'Betaine + Sorbitol + Liver Stimulants';
    else if (/Coccicure/i.test(brand)) generic = 'Sulfaquinoxaline + Diaveridine';
    else if (/Trisulpha/i.test(brand)) generic = 'Triple Sulfonamides';
    else if (/Start Aid/i.test(brand)) generic = 'Colostrum + Electrolytes + Vitamins';
    else if (/Super Immune/i.test(brand)) generic = 'Beta-glucan + Vitamins + Zinc';
    m.generic_name = generic;
  }

  // -------------------------------------------------------------
  // 3. REMOVE PLACEHOLDER BOILERPLATE
  // -------------------------------------------------------------
  notes = notes.replace(/\s*\|\s*NOTE:\s*Specific mg\/kg dose not available in source database\.[^|]*/gi, '');
  notes = notes.replace(/NOTE:\s*Specific mg\/kg dose not available in source database\.[^|]*/gi, '');
  notes = cleanText(notes);

  // -------------------------------------------------------------
  // 4. KNOWLEDGE BASE MATCHING
  // -------------------------------------------------------------
  const genLower = generic.toLowerCase();
  let matchedKey = null;

  for (const key of Object.keys(KNOWLEDGE)) {
    if (genLower === key || genLower.includes(key)) {
      matchedKey = key;
      break;
    }
  }

  if (matchedKey) {
    const ck = KNOWLEDGE[matchedKey];
    if ((m.dose_mg_per_kg_min === 0 || m.dose_mg_per_kg_min === null) && ck.dose_min > 0) {
      m.dose_mg_per_kg_min = ck.dose_min;
      m.dose_mg_per_kg_max = ck.dose_max;
    }
    if (notes.length < 80 || /category:/i.test(notes) === false || !/Ref:/i.test(notes)) {
      if (/composition|properties|indications/i.test(notes)) {
        notes = `${notes} | Ref: ${ck.notes.match(/Ref:[^|]+/)?.[0] || "Plumb's 9th Ed."}`;
      } else {
        notes = ck.notes;
      }
    }
  }

  // -------------------------------------------------------------
  // 5. TAILORED CLINICAL REFINEMENTS
  // -------------------------------------------------------------
  // Diclofenac
  if (/diclofenac/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 1;
      m.dose_mg_per_kg_max = 2.5;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle/Horses 1-2.5 mg/kg IM q24h. Withdrawal: Meat 28 days. Ref: Merck Vet Manual.`;
    }
  }

  // Amoxicillin (standalone)
  if (/amoxicillin/i.test(genLower) && !/clavulanic/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 7;
      m.dose_mg_per_kg_max = 15;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle/Sheep/Swine 7-15 mg/kg IM/SC q24h. Dogs/Cats 10-20 mg/kg PO/SC/IM q12h. Withdrawal: Meat 14-21 days, Milk 48-72h. Ref: Plumb's 9th Ed. p. 57.`;
    }
  }

  // Tilmicosin
  if (/tilmicosin/i.test(genLower)) {
    m.dose_mg_per_kg_min = 10;
    m.dose_mg_per_kg_max = 10;
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle 10 mg/kg SC single dose. ⚠️ LETHAL IV! Avoid horses/swine. Withdrawal: Meat 42 days. Ref: Plumb's 9th Ed. p. 1125.`;
    }
  }

  // Sulfadiazine / Sulfadoxine + Trimethoprim
  if (/trimethoprim/i.test(genLower) && /sulpha/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 15;
      m.dose_mg_per_kg_max = 24;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle/Horses/Swine 15-24 mg/kg (combined) IM/IV/PO q24h. Withdrawal: Meat 10-14 days, Milk 48-72h. Ref: Plumb's 9th Ed. p. 1152.`;
    }
  }

  // Atropine
  if (/atropine/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 0.02;
      m.dose_mg_per_kg_max = 0.5;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Pre-anesthetic/Bradycardia 0.02-0.04 mg/kg SC/IM/IV; Organophosphate Antidote 0.2-0.5 mg/kg (1/4 IV slowly, remainder SC/IM). Ref: Plumb's 9th Ed. p. 104.`;
    }
  }

  // Bromhexine / Ambroxol
  if (/bromohexine|bromhexine/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 0.2;
      m.dose_mg_per_kg_max = 2;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle/Horses 0.2-0.5 mg/kg IM/PO q24h; Dogs 2 mg/kg PO q12h; Cats 0.5 mg/kg PO q12h. Ref: Plumb's 9th Ed. p. 147.`;
    }
  }
  if (/ambroxol/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 0.3;
      m.dose_mg_per_kg_max = 1;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Large animals 0.3-0.6 mg/kg IV/IM q24h; Small animals 0.5-1 mg/kg PO q12h. Ref: Merck Vet Manual.`;
    }
  }

  // Diclazuril / Halofuginone / Amprolium
  if (/diclazuril/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 1;
      m.dose_mg_per_kg_max = 1;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Calves/Lambs 1 mg/kg (1 ml/2.5 kg) PO single dose. Ref: NOAH Compendium.`;
    }
  }
  if (/halofuginone/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 0.1;
      m.dose_mg_per_kg_max = 0.1;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Calves 0.1 mg/kg (2 ml/10 kg) PO once daily for 7 days after feeding. Ref: NOAH Compendium.`;
    }
  }
  if (/amprolium/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 5;
      m.dose_mg_per_kg_max = 10;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle/Sheep: Prevention 5 mg/kg PO daily for 21 days; Treatment 10 mg/kg PO daily for 5 days. Ref: Plumb's 9th Ed. p. 68.`;
    }
  }

  // Neostigmine
  if (/neostigmine/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 0.01;
      m.dose_mg_per_kg_max = 0.02;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle 0.01-0.02 mg/kg (2-4 mg/animal) SC/IM for rumen atony; Dogs 0.04 mg/kg SC/IM. Ref: Plumb's 9th Ed. p. 805.`;
    }
  }

  // Vitamin K
  if (/menadione|phytomenadione|vitamin k/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 0.5;
      m.dose_mg_per_kg_max = 2.5;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Large animals 0.5-2.5 mg/kg SC/IM; Dogs/Cats 2.5-5 mg/kg SC/PO q12-24h for anticoagulant toxicity. Ref: Plumb's 9th Ed. p. 946.`;
    }
  }

  // Methylene Blue
  if (/methylene blue/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 1;
      m.dose_mg_per_kg_max = 2;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle/Sheep 1-2 mg/kg (1-2 ml/kg of 1% sol) slow IV for nitrate poisoning. ⚠️ Contraindicated in cats. Ref: Plumb's 9th Ed. p. 734.`;
    }
  }

  // Penicillin G
  if (/penicillin g/i.test(genLower) && !/streptomycin/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 10;
      m.dose_mg_per_kg_max = 20;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle/Horses/Sheep 10,000-20,000 IU/kg (10-20 mg/kg) IM q24h. Withdrawal: Meat 10-14 days, Milk 48-72h. Ref: Plumb's 9th Ed. p. 910.`;
    }
  }

  // Vitamins, Minerals, Electrolytes, Supportive Solutions
  if (/vitamin|calcium|phosphorus|amino acid|iron|mineral|metabolase|catosal|tonics|digestive/i.test(genLower) || /supportive/i.test(notes)) {
    if (!/DOSING:/i.test(notes) && !/Ref:/i.test(notes)) {
      notes = `${notes} | DOSING: Volume-based dosing per label. Cattle/Horses 10-25 mL IM/SC/IV; Calves/Foals 5-10 mL. (Not standard mg/kg). Ref: Merck Vet Manual.`;
    }
  }

  // Hormones (fixed per-animal)
  if (/gonadorelin|buserelin|lh|fsh|hcg|lutropin|estrogen|progesterone/i.test(genLower) || /hormone/i.test(notes)) {
    if (!/DOSING:/i.test(notes)) {
      notes = `${notes} | DOSING: Per-animal fixed dose. Cattle: 100-250 mcg (or 10-20 mcg Buserelin) IM/IV. (NOT weight-based mg/kg). Ref: Plumb's 9th Ed.`;
    }
  }
  if (/cloprostenol|dinoprost|prostaglandin/i.test(genLower)) {
    if (!/DOSING:/i.test(notes)) {
      notes = `${notes} | DOSING: Per-animal fixed dose. Cattle: 500 mcg Cloprostenol (or 25 mg Dinoprost) IM. ⚠️ Induces abortion! Pregnant women avoid handling. Ref: Plumb's 9th Ed.`;
    }
  }
  if (/oxytocin/i.test(genLower)) {
    if (!/DOSING:/i.test(notes)) {
      notes = `${notes} | DOSING: Per-animal dose. Cattle/Horses: 10-30 IU IV/IM. Uterine contraction & milk letdown. Ensure cervix is dilated before use in dystocia. Ref: Plumb's 9th Ed.`;
    }
  }

  // Anti-bloat (Dimethicone / Bloatryl / Tymponal)
  if (/dimethicone|simethicone|silicon|turpentine/i.test(genLower) || /anti-bloat/i.test(notes)) {
    if (!/DOSING:/i.test(notes)) {
      notes = `${notes} | DOSING: Cattle: 100-200 mL PO as oral drench or direct intraruminal injection; Sheep/Goats: 25-50 mL PO. For frothy bloat. Ref: Merck Vet Manual.`;
    }
  }

  // Laxatives & Purgatives
  if (/paraffin|magnesium sulfate|epsom|laxative|laxavet|duphalac/i.test(genLower) || /laxative/i.test(notes)) {
    if (!/DOSING:/i.test(notes)) {
      notes = `${notes} | DOSING: Cattle/Horses: 250-500 g Epsom salts or 1-2 Liters Mineral Oil PO via stomach tube; Sheep: 50-100 g. Ref: Merck Vet Manual.`;
    }
  }

  // Topicals, Ointments, Sprays, Antiseptics, Dips
  if (route === 'Topical' || route === 'Pour-on' || form === 'spray' || form === 'ointment' || form === 'gel' || form === 'topical solution' || /topical/i.test(notes) || /antiseptic/i.test(notes) || /ectoparasiticide/i.test(notes)) {
    if (!/DOSING:/i.test(notes) && !/Ref:/i.test(notes)) {
      notes = `${notes} | DOSING: Apply topically to affected area BID or as directed on label. For external veterinary use only.`;
    }
  }

  // Intramammary Infusions
  if (route === 'Intramammary' || form === 'intramammary infusion' || /mastitis/i.test(notes)) {
    if (!/DOSING:/i.test(notes) && !/Ref:/i.test(notes)) {
      notes = `${notes} | DOSING: Infuse 1 syringe per affected teat/quarter immediately after milking. Disinfect teat end before infusion.`;
    }
  }

  // Intrauterine solutions / boluses
  if (route === 'Intrauterine' || form === 'intrauterine solution' || form === 'intrauterine bolus' || /intrauterine|metritis|uterine/i.test(notes)) {
    if (!/DOSING:/i.test(notes) && !/Ref:/i.test(notes)) {
      notes = `${notes} | DOSING: 1-2 boluses or 1 vial/syringe intrauterine infusion post-calving or for endometritis/metritis treatment.`;
    }
  }

  // Vaccines
  if (/vaccine|toxoid|bacterin/i.test(notes) || /vaccine/i.test(brand) || /vaccine/i.test(generic)) {
    if (!/DOSING:/i.test(notes)) {
      notes = `${notes} | DOSING: Cattle: 2-5 mL SC; Sheep/Goats: 2 mL SC. Booster in 4-6 weeks, then annual revaccination. Shake well before use.`;
    }
  }

  m.notes = cleanText(notes);
  return m;
}

const enrichedMeds = meds.map(m => processMedication(m));

// Write default-medications.js
const defaultMedsPath = path.join(__dirname, '..', 'default-medications.js');
const jsOutput = `// Large default medications database for VetCalc\nwindow.DEFAULT_MEDICATIONS = ${JSON.stringify(enrichedMeds, null, 6)};\n`;
fs.writeFileSync(defaultMedsPath, jsOutput, 'utf8');
console.log(`Updated ${defaultMedsPath} with ${enrichedMeds.length} enriched medications.`);

// Update medications.csv (with retry/handling for locked file)
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
for (const med of enrichedMeds) {
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
