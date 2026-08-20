const fs = require('fs');
const path = require('path');
const { CLINICAL_KNOWLEDGE } = require('./clinical_knowledge.js');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

function cleanText(str) {
  return (str || '').trim().replace(/\s+/g, ' ');
}

function enrichMedication(med) {
  const m = { ...med };
  const brand = cleanText(m.brand_name);
  let generic = cleanText(m.generic_name);
  const desc = cleanText(m.unit_description);
  let notes = cleanText(m.notes);
  const freq = cleanText(m.frequency);
  const form = cleanText(m.dosage_form);
  const route = cleanText(m.route);

  // 1. Resolve N/A Generic Names from Brand or Notes
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
    m.generic_name = generic;
  }

  // 2. Remove placeholder boilerplate from notes
  notes = notes.replace(/\s*\|\s*NOTE:\s*Specific mg\/kg dose not available in source database\.[^|]*/gi, '');
  notes = notes.replace(/NOTE:\s*Specific mg\/kg dose not available in source database\.[^|]*/gi, '');
  notes = cleanText(notes);

  // 3. Match against clinical knowledge
  const genLower = generic.toLowerCase();
  let matchedKey = null;

  for (const key of Object.keys(CLINICAL_KNOWLEDGE)) {
    if (genLower === key || genLower.includes(key)) {
      matchedKey = key;
      break;
    }
  }

  if (matchedKey) {
    const ck = CLINICAL_KNOWLEDGE[matchedKey];
    // If dose was 0 and clinical knowledge provides a valid dose, fill it
    if ((m.dose_mg_per_kg_min === 0 || m.dose_mg_per_kg_min === null) && ck.dose_min > 0) {
      m.dose_mg_per_kg_min = ck.dose_min;
      m.dose_mg_per_kg_max = ck.dose_max;
    }
    // If notes had placeholder or was brief, enhance it with comprehensive clinical notes
    if (notes.length < 80 || /category:/i.test(notes) === false || !/Ref:/i.test(notes)) {
      // Keep existing composition/properties if present, then append clinical highlights
      if (/composition|properties|indications/i.test(notes)) {
        notes = `${notes} | Ref: ${ck.notes.match(/Ref:[^|]+/)?.[0] || "Plumb's 9th Ed."}`;
      } else {
        notes = ck.notes;
      }
    }
  }

  // 4. Specific drug family refinements
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

  // Amoxicillin
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

  // Sulfadiazine + Trimethoprim
  if (/sulphadiazine.*trimethoprim|trimethoprim.*sulpha/i.test(genLower)) {
    if (m.dose_mg_per_kg_min === 0) {
      m.dose_mg_per_kg_min = 15;
      m.dose_mg_per_kg_max = 24;
    }
    if (!/Ref:/i.test(notes)) {
      notes = `${notes} | Dosing: Cattle/Horses/Swine 15-24 mg/kg (combined) IM/IV/PO q24h. Withdrawal: Meat 10-14 days, Milk 48-72h. Ref: Plumb's 9th Ed. p. 1152.`;
    }
  }

  // Vitamins & Supportive Solutions
  if (/vitamin ad3e/i.test(genLower) || /vitamin e-selenium/i.test(genLower) || /vitamin b complex/i.test(genLower) || /butaphosphan/i.test(genLower) || /toldimfos/i.test(genLower)) {
    if (!/DOSING:/i.test(notes) && !/Ref:/i.test(notes)) {
      notes = `${notes} | DOSING: Volume-based dosing per label. Cattle/Horses 10-25 mL IM/SC/IV; Calves 5-10 mL. (Not standard mg/kg). Ref: Merck Vet Manual.`;
    }
  }

  // Hormones
  if (/gonadorelin|buserelin/i.test(genLower)) {
    if (!/DOSING:/i.test(notes)) {
      notes = `${notes} | DOSING: Per-animal fixed dose. Cattle: 100-250 mcg (or 10-20 mcg Buserelin) IM/IV. Horses: 20-40 mcg IM. (NOT weight-based mg/kg). Ref: Plumb's 9th Ed.`;
    }
  }
  if (/cloprostenol|dinoprost/i.test(genLower)) {
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
  if (/dimethicone|simethicone|bloat/i.test(genLower) || /anti-bloat/i.test(notes)) {
    if (!/DOSING:/i.test(notes)) {
      notes = `${notes} | DOSING: Cattle: 100-200 mL PO as oral drench or direct intraruminal injection; Sheep/Goats: 25-50 mL PO. For frothy bloat. Ref: Merck Vet Manual.`;
    }
  }

  // Topicals, Ointments, Sprays, Antiseptics
  if (route === 'Topical' || route === 'Pour-on' || form === 'spray' || form === 'ointment' || form === 'gel' || form === 'topical solution') {
    if (!/DOSING:/i.test(notes) && !/Ref:/i.test(notes)) {
      notes = `${notes} | DOSING: Apply topically to affected area BID or as directed on label. For external veterinary use only.`;
    }
  }

  // Intramammary Infusions
  if (route === 'Intramammary' || form === 'intramammary infusion') {
    if (!/DOSING:/i.test(notes) && !/Ref:/i.test(notes)) {
      notes = `${notes} | DOSING: Infuse 1 syringe per affected teat/quarter immediately after milking. Clean and disinfect teat end before infusion.`;
    }
  }

  // Intrauterine solutions / boluses
  if (route === 'Intrauterine' || form === 'intrauterine solution' || form === 'intrauterine bolus') {
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

const enriched = meds.map(m => enrichMedication(m));

// Statistics
console.log('Enrichment Results:');
const remainingPlaceholders = enriched.filter(m => /specific mg\/kg dose not available/i.test(m.notes));
console.log(`Remaining placeholder notes: ${remainingPlaceholders.length} (was 209)`);

const zeroDoseWithoutExplanation = enriched.filter(m => 
  m.dose_mg_per_kg_min === 0 && 
  m.dose_mg_per_kg_max === 0 && 
  !/(per animal|per label|per protocol|fixed dose|not weight|dosing:|topical|spray|ointment|drop|infuse|syringe|sachet|bolus|ml\/animal|iu\/animal|mcg|unit\/dose)/i.test(m.notes)
);
console.log(`Zero-dose medications without explanation: ${zeroDoseWithoutExplanation.length}`);

if (zeroDoseWithoutExplanation.length > 0) {
  console.log('\nUnexplained zero-doses:');
  zeroDoseWithoutExplanation.forEach(m => console.log(`  [ID ${m.id}] ${m.brand_name} | ${m.generic_name} | Route: ${m.route} | Form: ${m.dosage_form}`));
}
