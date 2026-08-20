const fs = require('fs');
const path = require('path');

const CLINICAL_KNOWLEDGE_FULL = {
  // -------------------------------------------------------------
  // ANTIBIOTICS & ANTI-INFECTIVES
  // -------------------------------------------------------------
  'amoxicillin + clavulanic acid': {
    category: 'Antibiotic (Potentiated Penicillin)',
    notes: 'Category: Antibiotic (Potentiated Penicillin). Beta-lactam antibiotic with clavulanate beta-lactamase inhibitor. Broad-spectrum bactericidal activity against Gram-positive and Gram-negative aerobes/anaerobes. Indications: Skin, soft tissue, urinary, respiratory, and periodontal infections. Warnings: Contraindicated in penicillin hypersensitivity; avoid oral use in small herbivores. Ref: Plumb\'s 9th Ed. p. 62.',
    dose_min: 12.5,
    dose_max: 25
  },
  'cefotaxime': {
    category: 'Antibiotic (3rd Gen Cephalosporin)',
    notes: 'Category: Antibiotic (3rd Gen Cephalosporin). Broad-spectrum bactericidal cephalosporin with excellent Gram-negative activity and CNS penetration. Indications: Severe sepsis, meningitis, respiratory infections, and perioperative surgical prophylaxis. Dosage: Dogs/Cats 20-50 mg/kg IV/IM q8h. Ref: Plumb\'s 9th Ed. p. 200.',
    dose_min: 20,
    dose_max: 50
  },
  'ceftriaxone': {
    category: 'Antibiotic (3rd Gen Cephalosporin)',
    notes: 'Category: Antibiotic (3rd Gen Cephalosporin). Extended-spectrum bactericidal cephalosporin with long half-life. Indications: Severe Gram-negative infections, osteomyelitis, sepsis, and CNS infections. Dosage: Dogs 15-50 mg/kg IV/IM/SC q12-24h; Cats 25-50 mg/kg IV/IM/SC q12-24h. Ref: Plumb\'s 9th Ed. p. 205.',
    dose_min: 15,
    dose_max: 50
  },
  'azithromycin': {
    category: 'Antibiotic (Macrolide / Azalide)',
    notes: 'Category: Antibiotic (Macrolide / Azalide). Long-acting azalide antibiotic inhibiting bacterial 50S ribosomal protein synthesis. Indications: Upper respiratory infections, Bartonellosis, feline chlamydiosis, and Babesiosis (with atovaquone). Dosage: Dogs/Cats 5-10 mg/kg PO q24h. Warnings: Potential hepatotoxicity and GI upset. Ref: Plumb\'s 9th Ed. p. 112.',
    dose_min: 5,
    dose_max: 10
  },
  'clarithromycin': {
    category: 'Antibiotic (Macrolide)',
    notes: 'Category: Antibiotic (Macrolide). Acid-stable macrolide antibiotic inhibiting 50S protein synthesis. Indications: Mycobacterial infections, Helicobacter, Rhodococcus equi (with rifampin in foals), and respiratory tract infections. Dosage: Dogs 4-12 mg/kg PO q12h; Cats 5-10 mg/kg PO q12h; Foals 7.5 mg/kg PO q12h. Ref: Plumb\'s 9th Ed. p. 248.',
    dose_min: 4,
    dose_max: 12
  },
  'cefalexin': {
    category: 'Antibiotic (1st Gen Cephalosporin)',
    notes: 'Category: Antibiotic (1st Gen Cephalosporin). Bactericidal beta-lactam active primarily against Gram-positive cocci (Staphylococcus pseudintermedius) and some Gram-negatives. Indications: Superficial and deep pyoderma, urinary tract infections, wound infections. Dosage: Dogs/Cats 15-30 mg/kg PO q8-12h; Injectable 10-15 mg/kg IM/SC q24h. Ref: Plumb\'s 9th Ed. p. 195.',
    dose_min: 15,
    dose_max: 30
  },
  'ciprofloxacin': {
    category: 'Antibiotic (Fluoroquinolone)',
    notes: 'Category: Antibiotic (Fluoroquinolone). Concentration-dependent bactericidal DNA gyrase inhibitor. Indications: Severe Gram-negative urinary, soft tissue, and systemic infections. Note: Oral bioavailability in dogs is variable (40-60%); enrofloxacin is preferred when possible. Dosage: Dogs 10-25 mg/kg PO q24h or divided q12h. Ref: Plumb\'s 9th Ed. p. 238.',
    dose_min: 10,
    dose_max: 25
  },
  'doxycycline': {
    category: 'Antibiotic (Tetracycline)',
    notes: 'Category: Antibiotic (Tetracycline). Lipophilic tetracycline with broad-spectrum and anti-inflammatory activity. Indications: Ehrlichiosis, Anaplasmosis, Lyme borreliosis, Mycoplasma, Leptospirosis, and Wolbachia in heartworm disease. Dosage: Dogs/Cats 5-10 mg/kg PO/IV q12-24h. Warnings: In cats, always follow oral tablets with water/food to prevent esophageal stricture. Ref: Plumb\'s 9th Ed. p. 386.',
    dose_min: 5,
    dose_max: 10
  },
  'oxytetracycline': {
    category: 'Antibiotic (Tetracycline)',
    notes: 'Category: Antibiotic (Tetracycline). Broad-spectrum bacteriostatic antibiotic inhibiting 30S protein synthesis. Indications: Bovine respiratory disease (BRD), Anaplasmosis, Foot rot, Leptospirosis, Wooden tongue, and Metritis. Dosage: Cattle/Sheep/Swine: Standard 5-10 mg/kg IV/IM q24h; LA (200 mg/ml) 20 mg/kg IM/SC single dose. Withdrawal: Meat 28 days, Milk 7 days. Ref: Plumb\'s 9th Ed. p. 892.',
    dose_min: 10,
    dose_max: 20
  },
  'gentamicin': {
    category: 'Antibiotic (Aminoglycoside)',
    notes: 'Category: Antibiotic (Aminoglycoside). Concentration-dependent bactericidal 30S ribosomal inhibitor with potent Gram-negative activity. Indications: Sepsis, severe pneumonia, intrauterine infusion in metritis, and resistant Gram-negative infections. Dosage: Cattle/Horses 6.6 mg/kg IV/IM q24h; Dogs/Cats 5-8 mg/kg IV/SC/IM q24h. Warnings: Nephrotoxic and ototoxic; ensure adequate hydration. Withdrawal: Cattle meat 40 days. Ref: Plumb\'s 9th Ed. p. 504.',
    dose_min: 5,
    dose_max: 6.6
  },
  'florfenicol': {
    category: 'Antibiotic (Phenicol)',
    notes: 'Category: Antibiotic (Phenicol). Synthetic broad-spectrum bacteriostatic 50S ribosomal inhibitor. Indications: Bovine Respiratory Disease (BRD - Mannheimia, Pasteurella, Histophilus), Infectious Bovine Keratoconjunctivitis (Pinkeye), and Foot rot. Dosage: Cattle 20 mg/kg IM q48h (2 doses) OR 40 mg/kg SC single dose. Warnings: Do NOT administer IV. Withdrawal: Meat 28 days (IM), 44 days (SC); contraindicated in lactating dairy cattle. Ref: Plumb\'s 9th Ed. p. 473.',
    dose_min: 20,
    dose_max: 40
  },
  'ceftiofur': {
    category: 'Antibiotic (3rd Gen Cephalosporin)',
    notes: 'Category: Antibiotic (3rd Gen Cephalosporin). Advanced veterinary cephalosporin with excellent Gram-negative and Gram-positive efficacy. Indications: Bovine Respiratory Disease, Acute interdigital necrobacillosis (Foot rot), and Acute post-partum metritis. Dosage: Cattle/Swine 1.1-2.2 mg/kg IM/SC q24h for 3-5 days. Advantage: 0-day milk withdrawal in dairy cattle! Meat withdrawal: 4 days. Ref: Plumb\'s 9th Ed. p. 202.',
    dose_min: 1.1,
    dose_max: 2.2
  },
  'tylosin': {
    category: 'Antibiotic (Macrolide)',
    notes: 'Category: Antibiotic (Macrolide). 50S ribosomal inhibitor active against Gram-positive bacteria, Mycoplasma, and Spirochetes. Indications: BRD, Mycoplasma pneumonia, vibrionic dysentery in swine, and Tylosin-responsive chronic enteropathy in dogs. Dosage: Cattle 10 mg/kg IM q24h; Swine 10 mg/kg IM q12h; Dogs 10-25 mg/kg PO q12h. Withdrawal: Cattle meat 21 days, Milk 4 days. Ref: Plumb\'s 9th Ed. p. 1175.',
    dose_min: 10,
    dose_max: 20
  },
  'tilmicosin': {
    category: 'Antibiotic (Macrolide)',
    notes: 'Category: Antibiotic (Macrolide). Long-acting semi-synthetic macrolide concentrated in pulmonary alveolar macrophages. Indications: Treatment and metaphylaxis of Bovine Respiratory Disease (BRD). Dosage: Cattle 10 mg/kg SC single dose ONLY. ⚠️ CAUTION: LETHAL if given IV! Strictly contraindicated in equines, goats, and swine. Withdrawal: Meat 42 days. Ref: Plumb\'s 9th Ed. p. 1125.',
    dose_min: 10,
    dose_max: 10
  },
  'enrofloxacin': {
    category: 'Antibiotic (Fluoroquinolone)',
    notes: 'Category: Antibiotic (Fluoroquinolone). Broad-spectrum bactericidal fluoroquinolone inhibiting bacterial topoisomerases. Indications: BRD, Colibacillosis, complex respiratory, urinary, and dermal infections. Dosage: Cattle/Swine 2.5-5 mg/kg SC/IM q24h or 7.5-12.5 mg/kg SC single dose; Dogs/Cats 5-10 mg/kg PO/SC/IM q24h. Warnings: Retinotoxicity in cats at high doses (>5 mg/kg). Prohibited in lactating dairy cattle. Withdrawal: Meat 28 days. Ref: Plumb\'s 9th Ed. p. 418.',
    dose_min: 2.5,
    dose_max: 10
  },
  'marbofloxacin': {
    category: 'Antibiotic (Fluoroquinolone)',
    notes: 'Category: Antibiotic (Fluoroquinolone). 3rd generation veterinary fluoroquinolone with high bioavailability and tissue penetration. Indications: BRD, acute mastitis, skin/urinary infections in small animals. Dosage: Cattle 2 mg/kg IM/SC/IV q24h for 3-5 days OR 8 mg/kg IM single dose; Dogs/Cats 2.75-5.5 mg/kg PO/SC/IV q24h. Withdrawal: Cattle meat 6 days (single dose), Milk 36 hours. Ref: Plumb\'s 9th Ed. p. 696.',
    dose_min: 2,
    dose_max: 8
  },
  'amoxicillin': {
    category: 'Antibiotic (Aminopenicillin)',
    notes: 'Category: Antibiotic (Aminopenicillin). Broad-spectrum bactericidal penicillin derivative. Indications: Respiratory, gastrointestinal, and urogenital infections in cattle, sheep, swine, dogs, and cats. Dosage: Cattle/Sheep/Swine 7-15 mg/kg IM/SC q24h; Dogs/Cats 10-20 mg/kg PO/SC/IM q12h. Withdrawal: Meat 14-21 days, Milk 48-72 hours. Ref: Plumb\'s 9th Ed. p. 57.',
    dose_min: 7,
    dose_max: 15
  },
  'penicillin g': {
    category: 'Antibiotic (Natural Penicillin)',
    notes: 'Category: Antibiotic (Natural Penicillin). Beta-lactam antibiotic active against Gram-positive aerobes and anaerobes (Streptococcus, Clostridium, Actinomyces). Indications: Blackleg, malignant edema, anthrax, tetanus, strangles in horses, and erysipelas in swine. Dosage: Cattle/Horses/Sheep 10,000-20,000 IU/kg (10-20 mg/kg) IM q24h. Withdrawal: Meat 10-14 days, Milk 48-72 hours. Ref: Plumb\'s 9th Ed. p. 910.',
    dose_min: 10,
    dose_max: 20
  },
  'sulphadiazine + trimethoprim': {
    category: 'Antibiotic (Potentiated Sulfonamide)',
    notes: 'Category: Antibiotic (Potentiated Sulfonamide). Sequential double-blockade of bacterial folic acid synthesis resulting in bactericidal synergy. Indications: Respiratory infections, strangles in horses, alimentary tract infections, and mastitis/metritis. Dosage: Cattle/Horses/Swine/Sheep 15-24 mg/kg (combined) IM/IV/PO q24h; Dogs/Cats 15-30 mg/kg PO/SC q12-24h. Withdrawal: Meat 10-14 days, Milk 48-72 hours. Ref: Plumb\'s 9th Ed. p. 1152.',
    dose_min: 15,
    dose_max: 24
  },
  'sulphadoxine + trimethoprim': {
    category: 'Antibiotic (Potentiated Sulfonamide)',
    notes: 'Category: Antibiotic (Potentiated Sulfonamide). Long-acting potentiated sulfonamide combination. Indications: Systemic, respiratory, urinary, and enteric infections in cattle, horses, and sheep. Dosage: Cattle/Horses/Sheep 15-24 mg/kg (1 ml/10-16 kg of 24% solution) IV or deep IM q24h for 3-5 days. Withdrawal: Meat 10-14 days, Milk 48 hours. Ref: NOAH Compendium.',
    dose_min: 15,
    dose_max: 24
  },
  'sulphadimidine': {
    category: 'Antibiotic (Sulfonamide)',
    notes: 'Category: Antibiotic (Sulfonamide). Broad-spectrum bacteriostatic sulfonamide (Sulfamethazine). Indications: Coccidiosis, Calf diphtheria, Foot rot, Bovine respiratory disease, and Bacterial enteritis. Dosage: Cattle/Sheep: Initial loading dose 100-200 mg/kg IV/SC/PO, then 50-100 mg/kg q24h for 3-5 days. Withdrawal: Meat 14-21 days, Milk 4-5 days. Ref: Plumb\'s 9th Ed. p. 1094.',
    dose_min: 50,
    dose_max: 100
  },
  'penicillin g + streptomycin': {
    category: 'Antibiotic (Penicillin + Aminoglycoside)',
    notes: 'Category: Antibiotic (Penicillin + Aminoglycoside). Classic synergistic bactericidal combination covering Gram-positive (Penicillin G) and Gram-negative (Streptomycin) pathogens. Indications: Mixed respiratory, wound, foot rot, and post-partum infections. Dosage: Cattle/Sheep/Horses: 8-10 mg/kg (or 10,000 IU/kg Pen + 10 mg/kg Strep) IM q24h. Withdrawal: Meat 28-30 days, Milk 60-72 hours. Ref: Plumb\'s 9th Ed. p. 915.',
    dose_min: 8,
    dose_max: 12
  },
  'lincomycin + spectinomycin': {
    category: 'Antibiotic (Lincosamide + Aminoglycoside)',
    notes: 'Category: Antibiotic (Lincosamide + Aminoglycoside). Broad-spectrum combination effective against Mycoplasma, Gram-positives, and enteric Gram-negatives. Indications: Infectious arthritis, enteritis, and Mycoplasma pneumonia in calves, sheep, and swine. Dosage: Cattle/Sheep/Swine 10-15 mg/kg (combined) IM q24h for 3-5 days. Withdrawal: Meat 14-21 days, Milk 48 hours. Ref: Plumb\'s 9th Ed. p. 673.',
    dose_min: 10,
    dose_max: 15
  },
  'kanamycin': {
    category: 'Antibiotic (Aminoglycoside)',
    notes: 'Category: Antibiotic (Aminoglycoside). Bactericidal 30S protein synthesis inhibitor against Gram-negative aerobes. Indications: Severe Gram-negative enteric, respiratory, and septicemic infections. Dosage: Cattle/Horses/Swine 5-10 mg/kg IM/SC q12h; Dogs/Cats 5-10 mg/kg IM/SC q8-12h. Warnings: Nephrotoxic; monitor renal status. Withdrawal: Meat 30 days. Ref: Plumb\'s 9th Ed. p. 642.',
    dose_min: 5,
    dose_max: 10
  },
  'spiramycin': {
    category: 'Antibiotic (Macrolide)',
    notes: 'Category: Antibiotic (Macrolide). 16-membered macrolide with high tissue concentration in lungs, udder, and genital tract. Indications: Bovine respiratory disease, infectious pododermatitis (foot rot), and clinical mastitis. Dosage: Cattle 20-30 mg/kg (approx. 75,000-100,000 IU/kg) IM q24h. Withdrawal: Meat 21 days, Milk 7 days. Ref: Merck Vet Manual.',
    dose_min: 20,
    dose_max: 30
  },
  'danofloxacin': {
    category: 'Antibiotic (Fluoroquinolone)',
    notes: 'Category: Antibiotic (Fluoroquinolone). Veterinary fluoroquinolone for bovine respiratory disease caused by Mannheimia haemolytica and Pasteurella multocida. Dosage: Cattle 6 mg/kg SC single dose OR 1.25 mg/kg SC/IM q24h for 3 days. Withdrawal: Meat 4 days. Prohibited in dairy cattle >20 months. Ref: Plumb\'s 9th Ed. p. 336.',
    dose_min: 1.25,
    dose_max: 6
  },
  'levofloxacin': {
    category: 'Antibiotic (Fluoroquinolone)',
    notes: 'Category: Antibiotic (Fluoroquinolone). L-isomer of ofloxacin with high potency against Gram-positive and Gram-negative aerobes. Indications: Severe respiratory and systemic bacterial infections. Dosage: Large animals 5-10 mg/kg IV/IM/SC q24h; Small animals 5-10 mg/kg PO/IV q24h. Ref: Plumb\'s 9th Ed. p. 665.',
    dose_min: 5,
    dose_max: 10
  },
  'chloramphenicol': {
    category: 'Antibiotic (Phenicol)',
    notes: 'Category: Antibiotic (Phenicol). Broad-spectrum bacteriostatic antibiotic inhibiting 50S ribosomal peptidyl transferase. Indications: Severe systemic, CNS, and ophthalmic infections in non-food animals. Dosage: Dogs/Cats 25-50 mg/kg PO/IM/IV q8-12h. ⚠️ STRICTLY PROHIBITED in food-producing animals due to human aplastic anemia risk. Ref: Plumb\'s 9th Ed. p. 215.',
    dose_min: 25,
    dose_max: 50
  },
  'neomycin': {
    category: 'Antibiotic (Aminoglycoside / Enteric)',
    notes: 'Category: Antibiotic (Aminoglycoside / Enteric). Poorly absorbed oral aminoglycoside for local gastrointestinal bacterial infections (Colibacillosis, Salmonella enteritis). Dosage: Calves/Foals/Dogs/Cats 10-20 mg/kg PO q12h. Withdrawal: Calves meat 30 days. Ref: Plumb\'s 9th Ed. p. 802.',
    dose_min: 10,
    dose_max: 20
  },

  // -------------------------------------------------------------
  // ANTIPARASITICS & ANTHELMINTICS
  // -------------------------------------------------------------
  'amprolium': {
    category: 'Antiprotozoal (Coccidiostat)',
    notes: 'Category: Antiprotozoal (Coccidiostat). Thiamine antagonist competitively inhibiting thiamine uptake in coccidia. Indications: Prevention and treatment of coccidiosis in calves, sheep, and poultry. Dosage: Cattle/Sheep: Prevention 5 mg/kg PO daily for 21 days; Treatment 10 mg/kg PO daily for 5 days. Poultry: 125-250 mg/L in drinking water. Withdrawal: Meat 24 hours. Ref: Plumb\'s 9th Ed. p. 68.',
    dose_min: 5,
    dose_max: 10
  },
  'diclazuril': {
    category: 'Antiprotozoal (Coccidiostat / Triazine)',
    notes: 'Category: Antiprotozoal (Coccidiostat / Triazine). Triazine antiprotozoal interrupting coccidial life cycle. Indications: Prevention and treatment of coccidiosis caused by Eimeria bovis, E. zuernii, E. crandallis, and E. ovinoidalis in calves and lambs. Dosage: Calves/Lambs 1 mg/kg (1 ml/2.5 kg) PO single dose. Withdrawal: Meat 0 days. Ref: NOAH Compendium.',
    dose_min: 1,
    dose_max: 1
  },
  'halofuginone': {
    category: 'Antiprotozoal (Cryptosporidiosis)',
    notes: 'Category: Antiprotozoal (Cryptosporidiosis). Quinazolinone alkaloid with antiprotozoal activity against Cryptosporidium parvum. Indications: Prevention and reduction of diarrhea due to diagnosed Cryptosporidium parvum in newborn calves. Dosage: Calves 0.1 mg/kg (2 ml/10 kg Halocur) PO once daily for 7 consecutive days after feeding. Withdrawal: Meat 13 days. Ref: NOAH Compendium.',
    dose_min: 0.1,
    dose_max: 0.1
  },
  'diazinon': {
    category: 'Ectoparasiticide (Organophosphate)',
    notes: 'Category: Ectoparasiticide (Organophosphate). Cholinesterase inhibitor for ectoparasite control. Indications: Ticks, sheep scab (Psoroptes ovis), biting/sucking lice, keds, and blowfly strike. Dosage: Dilute in water per label (e.g. 1:1000 for plunge dipping or high-pressure spray). For external use only. ⚠️ Organophosphate toxicity antidote: Atropine + 2-PAM. Ref: Merck Vet Manual.',
    dose_min: 0,
    dose_max: 0
  },
  'phoxim': {
    category: 'Ectoparasiticide (Organophosphate)',
    notes: 'Category: Ectoparasiticide (Organophosphate). External organophosphate insecticide. Indications: Psoroptic mange, sarcoptic mange, chorioptic mange, lice, keds, and tick infestations in sheep, goats, and cattle. Dosage: Topical plunge dip (1:1000) or spray (1:500). External application only. Withdrawal: Meat 14-28 days. Ref: Merck Vet Manual.',
    dose_min: 0,
    dose_max: 0
  },
  'quinapyramine': {
    category: 'Antiprotozoal (Trypanocide)',
    notes: 'Category: Antiprotozoal (Trypanocide). Curative and prophylactic agent for Trypanosomiasis (Surra caused by Trypanosoma evansi) in camels, horses, and cattle. Dosage: 3-5 mg/kg (or 1 sachet per 200-300 kg) SC/IM. Ensure deep injection and divide volume if large. Ref: Merck Vet Manual.',
    dose_min: 3,
    dose_max: 5
  },
  'pyrantel': {
    category: 'Anthelmintic (Tetrahydropyrimidine)',
    notes: 'Category: Anthelmintic (Tetrahydropyrimidine). Nicotinic receptor agonist causing depolarizing neuromuscular blockade and paralysis in nematodes. Indications: Ascarids, pinworms, hookworms, and large/small strongyles. Dosage: Horses 6.6-13.2 mg/kg (pamoate/tartrate) PO; Dogs/Cats 5-10 mg/kg PO. Ref: Plumb\'s 9th Ed. p. 1018.',
    dose_min: 5,
    dose_max: 13.2
  },

  // -------------------------------------------------------------
  // EMERGENCY, TOXICOLOGY & ANTIDOTES
  // -------------------------------------------------------------
  'atropine sulphate': {
    category: 'Anticholinergic / Antidote',
    notes: 'Category: Anticholinergic / Antidote. Competitive muscarinic acetylcholine receptor antagonist. Indications: Pre-anesthetic reduction of respiratory secretions, sinus bradycardia, and specific antidote for organophosphate / carbamate insecticide toxicity. Dosage: Pre-anesthetic/Bradycardia: Dogs/Cats 0.02-0.04 mg/kg SC/IM/IV; OP Toxicity Antidote: 0.2-0.5 mg/kg (give 1/4 IV slowly, remainder SC/IM, repeat as needed until atropinization). Ref: Plumb\'s 9th Ed. p. 104.',
    dose_min: 0.02,
    dose_max: 0.5
  },
  'activated charcoal': {
    category: 'Gastrointestinal Adsorbent / Antidote',
    notes: 'Category: Gastrointestinal Adsorbent / Antidote. Porous carbon adsorbent that binds ingested toxicants in the gastrointestinal lumen to prevent systemic absorption. Indications: Acute ingestion of poisons, rodenticides, medications, toxins, and plant poisons. Dosage: Dogs/Cats/Large Animals: 1-4 g/kg PO as a slurry in water (administer via stomach tube or syringe). Repeat q4-6h if enterohepatic recirculation occurs. Ref: Plumb\'s 9th Ed. p. 18.',
    dose_min: 0,
    dose_max: 0
  },
  'mannitol': {
    category: 'Osmotic Diuretic',
    notes: 'Category: Osmotic Diuretic. Non-reabsorbable osmotic diuretic drawing water from tissues into vascular space. Indications: Acute cerebral edema / head trauma, acute glaucoma, and promotion of diuresis in acute oliguric renal failure. Dosage: Dogs/Cats/Horses: 0.25-1 g/kg (1.25-5 ml/kg of 20% solution) IV slow infusion over 15-30 minutes. ⚠️ Route is IV ONLY. Ref: Plumb\'s 9th Ed. p. 692.',
    dose_min: 250,
    dose_max: 1000
  },
  'obidoxime chloride': {
    category: 'Antidote (Cholinesterase Reactivator)',
    notes: 'Category: Antidote (Cholinesterase Reactivator). Oxime antidote (Toxogonin) that reactivates phosphorylated acetylcholinesterase enzyme inhibited by organophosphate insecticides. Indications: Severe organophosphate poisoning in cattle, horses, and dogs (use in conjunction with Atropine). Dosage: Large animals: 2-4 mg/kg IV/IM slowly. Ref: Merck Vet Manual.',
    dose_min: 2,
    dose_max: 4
  },
  'dimercaprol (bal)': {
    category: 'Chelating Agent / Heavy Metal Antidote',
    notes: 'Category: Chelating Agent / Heavy Metal Antidote. Dithiol chelating agent forming stable, non-toxic cyclic complexes with heavy metal ions for urinary excretion. Indications: Acute arsenic, mercury, lead, and gold poisoning. Dosage: Small/Large Animals: 2.5-5 mg/kg deep IM q4h for 2 days, then q8-12h for 7-10 days. Ref: Plumb\'s 9th Ed. p. 363.',
    dose_min: 2.5,
    dose_max: 5
  },
  'methylene blue': {
    category: 'Antidote (Methemoglobinemia)',
    notes: 'Category: Antidote (Methemoglobinemia). Direct reducing agent converting methemoglobin (Fe3+) back to functional hemoglobin (Fe2+). Indications: Acute nitrate/nitrite toxicosis in ruminants and chlorate poisoning. Dosage: Cattle/Sheep: 1-2 mg/kg (or 1-2 ml/kg of 1% solution) slow IV. Repeat in 2-4 hours if cyanosis persists. ⚠️ Do NOT use in cats (causes severe Heinz body hemolytic anemia!). Ref: Plumb\'s 9th Ed. p. 734.',
    dose_min: 1,
    dose_max: 2
  },
  'neostigmine': {
    category: 'Parasympathomimetic (Cholinesterase Inhibitor)',
    notes: 'Category: Parasympathomimetic (Cholinesterase Inhibitor). Reversible acetylcholinesterase inhibitor augmenting acetylcholine at nicotinic and muscarinic sites. Indications: Non-obstructive ruminal atony in cattle, cecal impaction in horses, myasthenia gravis, and reversal of non-depolarizing neuromuscular blockade. Dosage: Cattle: 0.01-0.02 mg/kg (2-4 mg/animal) SC/IM; Dogs: 0.04 mg/kg SC/IM. Ref: Plumb\'s 9th Ed. p. 805.',
    dose_min: 0.01,
    dose_max: 0.02
  },
  'vitamin k1 / phytomenadione': {
    category: 'Hemostatic / Antidote (Vitamin K1)',
    notes: 'Category: Hemostatic / Antidote (Vitamin K1). Essential cofactor for hepatic synthesis of clotting factors II, VII, IX, and X. Indications: Anticoagulant rodenticide toxicosis (warfarin, brodifacoum) and sweet clover poisoning (dicoumarol) in cattle. Dosage: Dogs/Cats 2.5-5 mg/kg SC/PO q12-24h with fatty food for 3-4 weeks; Cattle 0.5-2.5 mg/kg SC/IM. Ref: Plumb\'s 9th Ed. p. 946.',
    dose_min: 0.5,
    dose_max: 5
  },

  // -------------------------------------------------------------
  // GASTROINTESTINAL & RESPIRATORY
  // -------------------------------------------------------------
  'bromhexine': {
    category: 'Mucolytic / Bronchial Secretagogue',
    notes: 'Category: Mucolytic / Bronchial Secretagogue. Secretolytic agent that disrupts acid mucopolysaccharide fibers in bronchial sputum, reducing viscosity and enhancing antibiotic penetration into pulmonary secretions. Indications: Acute/chronic bronchopneumonia, tracheobronchitis, and calf respiratory disease. Dosage: Cattle/Horses 0.2-0.5 mg/kg IM/PO q24h; Dogs 2 mg/kg PO q12h; Cats 0.5 mg/kg PO q12h. Ref: Plumb\'s 9th Ed. p. 147.',
    dose_min: 0.2,
    dose_max: 2
  },
  'ambroxol': {
    category: 'Mucolytic / Surfactant Stimulator',
    notes: 'Category: Mucolytic / Surfactant Stimulator. Active metabolite of bromhexine that stimulates surfactant synthesis and ciliary motility while thinning bronchial secretions. Indications: Acute and chronic respiratory disorders with abnormal mucous secretion. Dosage: Large animals: 0.3-0.6 mg/kg IV/IM q24h; Dogs/Cats: 0.5-1 mg/kg PO q12h. Ref: Merck Vet Manual.',
    dose_min: 0.3,
    dose_max: 1
  },
  'magnesium sulfate': {
    category: 'Saline Laxative / Purgative (Epsom Salt)',
    notes: 'Category: Saline Laxative / Purgative (Epsom Salt). Osmotic cathartic drawing water into intestinal lumen to stimulate peristalsis and evacuation. Indications: Constipation, simple indigestion, and bowel evacuation in ruminants and horses. Dosage: Cattle: 250-500 g PO dissolved in warm water via stomach tube; Sheep/Goats: 50-100 g PO; Dogs/Cats: 1-2 g PO. Ref: Merck Vet Manual.',
    dose_min: 0,
    dose_max: 0
  },
  'liquid paraffin': {
    category: 'Lubricant Laxative (Mineral Oil)',
    notes: 'Category: Lubricant Laxative (Mineral Oil). Non-absorbable fecal softening lubricant that coats intestinal walls and softens impacted fecal masses. Indications: Large colon impaction in horses, simple constipation, and sand colic. Dosage: Horses/Cattle: 1-4 Liters PO via stomach tube (ensure tube is in stomach to avoid fatal aspiration pneumonia!); Dogs: 5-30 ml PO; Cats: 2-5 ml PO. Ref: Plumb\'s 9th Ed. p. 764.',
    dose_min: 0,
    dose_max: 0
  },
  'magnesium carbonate + sodium carbonate': {
    category: 'Antacid / Laxative (Rumen Buffer)',
    notes: 'Category: Antacid / Laxative (Rumen Buffer). Neutralizing and buffering agent for rumen acidosis (grain overload) and mild impaction. Indications: Rumen acidosis, lactic indigestion, flatulence, and constipation in ruminants. Dosage: Cattle: 100-200 g PO dissolved in 1-2 Liters of warm water; Sheep/Goats: 25-50 g PO. Ref: Merck Vet Manual.',
    dose_min: 0,
    dose_max: 0
  }
};

module.exports = { CLINICAL_KNOWLEDGE_FULL };
