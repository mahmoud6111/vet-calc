const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonStr = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonStr);

// Comprehensive dictionary of clinical data for all active ingredients and formulation types
// Sources: Plumb's Veterinary Drug Handbook 9th Ed., Merck Veterinary Manual, NOAH Compendium, FARAD

const CLINICAL_KNOWLEDGE = {
  // -------------------------------------------------------------
  // ANTIBIOTICS & ANTI-INFECTIVES
  // -------------------------------------------------------------
  'amoxicillin + clavulanic acid': {
    category: 'Antibiotic (Potentiated Penicillin)',
    notes: 'Category: Antibiotic (Potentiated Penicillin). Beta-lactam antibiotic with clavulanate beta-lactamase inhibitor. Broad-spectrum bactericidal activity against Gram-positive and Gram-negative aerobes/anaerobes. Indications: Skin, soft tissue, urinary, respiratory, and periodontal infections. Warnings: Contraindicated in animals with penicillin hypersensitivity; avoid oral use in small herbivores (rabbits, guinea pigs). Ref: Plumb\'s 9th Ed. p. 62.',
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
    notes: 'Category: Antibiotic (Aminoglycoside). Concentration-dependent bactericidal 30S ribosomal inhibitor with potent Gram-negative activity. Indications: Sepsis, severe pneumonia, intrauterine infusion in metritis, and resistant Gram-negative infections. Dosage: Cattle/Horses 6.6 mg/kg IV/IM q24h; Dogs/Cats 5-8 mg/kg IV/SC/IM q24h. Warnings: Nephrotoxic and ototoxic; ensure adequate hydration. Withdrawal: Cattle meat 40 days (extended for calves). Ref: Plumb\'s 9th Ed. p. 504.',
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
  'sulphadiazine + trimethoprim': {
    category: 'Antibiotic (Potentiated Sulfonamide)',
    notes: 'Category: Antibiotic (Potentiated Sulfonamide). Sequential double-blockade of bacterial folic acid synthesis resulting in bactericidal synergy. Indications: Respiratory infections, strangles in horses, alimentary tract infections, and mastitis/metritis. Dosage: Cattle/Horses/Swine/Sheep 15-24 mg/kg (combined) IM/IV/PO q24h; Dogs/Cats 15-30 mg/kg PO/SC q12-24h. Withdrawal: Meat 10-14 days, Milk 48-72 hours. Ref: Plumb\'s 9th Ed. p. 1152.',
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
  'metronidazole': {
    category: 'Antiprotozoal / Antibiotic (Nitroimidazole)',
    notes: 'Category: Antiprotozoal / Antibiotic (Nitroimidazole). Potent anaerobic bactericidal agent and antiprotozoal. Indications: Giardiasis, Trichomoniasis, anaerobic sepsis, hepatic encephalopathy, and canine/feline chronic diarrhea. Dosage: Dogs 10-25 mg/kg PO/IV q12h; Cats 8-15 mg/kg PO/IV q12h; Cattle (non-food) 10-20 mg/kg PO/IV q12h. ⚠️ Note: Prohibited in food-producing animals in many jurisdictions. Ref: Plumb\'s 9th Ed. p. 748.',
    dose_min: 10,
    dose_max: 25
  },

  // -------------------------------------------------------------
  // ANTI-INFLAMMATORIES (NSAIDs & STEROIDS)
  // -------------------------------------------------------------
  'flunixin meglumine': {
    category: 'NSAIDs',
    notes: 'Category: NSAIDs. Potent non-narcotic COX inhibitor with prominent analgesic, anti-inflammatory, and anti-endotoxic properties. Indications: Visceral pain from equine colic, acute bovine mastitis/metritis, and endotoxemia. Dosage: Cattle 1.1-2.2 mg/kg IV/IM q24h; Horses 1.1 mg/kg IV/IM q12-24h; Dogs 1 mg/kg IV/IM once. Withdrawal: Cattle meat 4 days, Milk 36 hours. Ref: Plumb\'s 9th Ed. p. 488.',
    dose_min: 1.1,
    dose_max: 2.2
  },
  'meloxicam': {
    category: 'NSAIDs',
    notes: 'Category: NSAIDs. Preferential COX-2 inhibitor with excellent anti-inflammatory and analgesic efficacy. Indications: Bovine respiratory disease, calf diarrhea (adjunct), acute mastitis, locomotor disorders, and perioperative orthopedic pain. Dosage: Cattle 0.5 mg/kg SC/IV single dose; Horses 0.6 mg/kg IV/PO q24h; Dogs 0.2 mg/kg initial then 0.1 mg/kg PO/SC q24h. Withdrawal: Cattle meat 15 days, Milk 5 days. Ref: Plumb\'s 9th Ed. p. 720.',
    dose_min: 0.2,
    dose_max: 0.5
  },
  'ketoprofen': {
    category: 'NSAIDs',
    notes: 'Category: NSAIDs. Dual inhibitor of COX and 5-lipoxygenase (LOX) offering strong analgesic and antipyretic relief. Indications: Acute musculoskeletal inflammation, lameness, colic in horses, and post-partum fever in cattle. Dosage: Cattle/Horses 3 mg/kg IV/IM q24h for 1-3 days; Dogs 1-2 mg/kg PO/SC/IM q24h (max 5 days). Advantage: 0-day milk withdrawal! Meat withdrawal: 4 days. Ref: Plumb\'s 9th Ed. p. 646.',
    dose_min: 1,
    dose_max: 3
  },
  'diclofenac sodium': {
    category: 'NSAIDs',
    notes: 'Category: NSAIDs. Potent phenylacetic acid NSAID providing rapid pain and pyrexia reduction. Indications: Musculoskeletal disorders, arthritis, acute lameness, and post-traumatic inflammation in cattle and horses. Dosage: Cattle/Horses 1-2.5 mg/kg IM q24h for 1-3 days. Warnings: Avoid intra-arterial injection; contraindicated in dehydrated or renal-compromised patients. Withdrawal: Meat 28 days. Ref: Merck Vet Manual.',
    dose_min: 1,
    dose_max: 2.5
  },
  'dipyrone': {
    category: 'NSAIDs (Pyrazolone)',
    notes: 'Category: NSAIDs (Pyrazolone). Metamizole non-opioid analgesic, spasmolytic, and antipyretic agent. Indications: Spasmodic colic, painful esophageal obstruction (choke), high fever, and rheumatic inflammation. Dosage: Cattle/Horses 10-25 mg/kg (20-50 ml/animal) IV/IM q8-12h; Dogs/Cats 25 mg/kg IV/IM q8h. Warnings: Prohibited in US food animals; approved in Egypt/EU with meat withdrawal (12-28 days). Ref: Merck Vet Manual.',
    dose_min: 10,
    dose_max: 25
  },
  'phenylbutazone': {
    category: 'NSAIDs',
    notes: 'Category: NSAIDs. Classic pyrazolone NSAID for equine musculoskeletal disorders, osteoarthritis, laminitis, and tendonitis. Dosage: Horses 2.2-4.4 mg/kg IV/PO q12h on day 1, then taper to 1.1-2.2 mg/kg q24h; Dogs 7 mg/kg PO q8h. ⚠️ STRICTLY PROHIBITED in female dairy cattle >20 months of age (causes human aplastic anemia risk). Ref: Plumb\'s 9th Ed. p. 942.',
    dose_min: 2.2,
    dose_max: 4.4
  },
  'piroxicam': {
    category: 'NSAIDs (Oxicam)',
    notes: 'Category: NSAIDs (Oxicam). Non-selective COX inhibitor with anti-inflammatory and transitional cell carcinoma (TCC) anti-neoplastic effects. Indications: Bladder TCC, squamous cell carcinoma, and refractory osteoarthritis in dogs. Dosage: Dogs 0.3 mg/kg PO q24-48h (always with food). Warnings: High risk of GI ulceration; monitor renal and GI health. Ref: Plumb\'s 9th Ed. p. 962.',
    dose_min: 0.3,
    dose_max: 0.3
  },
  'dexamethasone': {
    category: 'Corticosteroid (Glucocorticoid)',
    notes: 'Category: Corticosteroid (Glucocorticoid). Long-acting, potent glucocorticoid with 30x the anti-inflammatory potency of cortisol. Indications: Ketosis in dairy cattle, acute hypersensitivity/anaphylaxis, inflammatory musculoskeletal conditions, and induction of parturition. Dosage: Cattle/Horses 0.02-0.1 mg/kg IV/IM; Dogs/Cats 0.05-0.2 mg/kg IV/IM/SC. ⚠️ WARNING: Induces abortion in pregnant ruminants during last trimester! Withdrawal: Meat 8 days, Milk 72 hours. Ref: Plumb\'s 9th Ed. p. 347.',
    dose_min: 0.02,
    dose_max: 0.1
  },
  'prednisolone': {
    category: 'Corticosteroid (Glucocorticoid)',
    notes: 'Category: Corticosteroid (Glucocorticoid). Intermediate-acting glucocorticoid, active metabolite of prednisone. Indications: Allergic dermatitis, asthma in cats, autoimmune diseases (IMHA/ITP), and lymphoma. Dosage: Anti-inflammatory: 0.5-1 mg/kg PO/SC/IV q12-24h; Immunosuppressive: 2-4 mg/kg PO q12-24h (taper gradually). Ref: Plumb\'s 9th Ed. p. 981.',
    dose_min: 0.5,
    dose_max: 2
  },

  // -------------------------------------------------------------
  // ANTIPARASITICS & ANTHELMINTICS
  // -------------------------------------------------------------
  'ivermectin': {
    category: 'Anthelmintic (Macrocyclic Lactone)',
    notes: 'Category: Anthelmintic (Macrocyclic Lactone). Glutamate-gated chloride channel opener causing flaccid paralysis in nematodes and arthropods. Indications: Gastrointestinal roundworms, lungworms, sucking lice, mange mites, and cattle grubs (Hypoderma). Dosage: Cattle/Sheep/Camels 0.2 mg/kg (1 ml/50 kg) SC; Swine 0.3 mg/kg SC; Dogs (heartworm microfilaria) 0.05 mg/kg PO/SC. Warnings: Toxic to MDR1-mutant dog breeds (Collies); do not use in lactating dairy cows. Withdrawal: Meat 35-49 days. Ref: Plumb\'s 9th Ed. p. 636.',
    dose_min: 0.2,
    dose_max: 0.2
  },
  'ivermectin + clorsulon': {
    category: 'Anthelmintic (Endectocide + Flukicide)',
    notes: 'Category: Anthelmintic (Endectocide + Flukicide). Combined macrocyclic lactone and benzenedisulfonamide. Indications: Broad-spectrum control of adult liver flukes (Fasciola hepatica), gastrointestinal roundworms, lungworms, cattle grubs, sucking lice, and mange mites. Dosage: Cattle 0.2 mg/kg Ivermectin + 2 mg/kg Clorsulon (1 ml/50 kg) SC. Withdrawal: Meat 21-49 days; do not use in lactating dairy cattle. Ref: Plumb\'s 9th Ed. p. 256.',
    dose_min: 0.2,
    dose_max: 0.2
  },
  'albendazole': {
    category: 'Anthelmintic (Benzimidazole)',
    notes: 'Category: Anthelmintic (Benzimidazole). Broad-spectrum anthelmintic inhibiting tubulin polymerization. Indications: GI roundworms, lungworms, tapeworms (Moniezia), and adult liver flukes (Fasciola hepatica). Dosage: Cattle 7.5-10 mg/kg PO (roundworms/tapeworms) or 10-15 mg/kg PO (liver flukes); Sheep/Goats 5-7.5 mg/kg PO. ⚠️ WARNING: Teratogenic in 1st trimester of pregnancy (do not dose during first 30-45 days of gestation). Withdrawal: Meat 14 days, Milk 3 days. Ref: Plumb\'s 9th Ed. p. 26.',
    dose_min: 7.5,
    dose_max: 10
  },
  'levamisole': {
    category: 'Anthelmintic (Imidazothiazole)',
    notes: 'Category: Anthelmintic (Imidazothiazole). Cholinergic agonist causing spastic paralysis of nematodes; also acts as an immunostimulant at lower doses. Indications: Lungworms (Dictyocaulus), GI nematodes (Haemonchus, Ostertagia, Cooperia, Trichostrongylus). Dosage: Cattle/Sheep/Swine 7.5 mg/kg SC or PO single dose. Warnings: Narrow margin of safety; avoid in debilitated animals. Withdrawal: Meat 3-7 days, Milk 48 hours. Ref: Plumb\'s 9th Ed. p. 660.',
    dose_min: 7.5,
    dose_max: 7.5
  },
  'nitroxynil': {
    category: 'Anthelmintic (Flukicide / Halogenated Phenol)',
    notes: 'Category: Anthelmintic (Flukicide / Halogenated Phenol). Uncouples oxidative phosphorylation in trematodes and blood-sucking nematodes. Indications: Acute and chronic fascioliasis (Fasciola hepatica & F. gigantica) and Haemonchus contortus. Dosage: Cattle/Sheep 10 mg/kg (1 ml/34 kg of 34% solution) SC single dose; increase to 13 mg/kg for severe outbreaks. Warnings: Can stain skin/wool yellow. Withdrawal: Meat 60 days; strictly contraindicated in dairy animals producing milk for human consumption. Ref: NOAH Compendium.',
    dose_min: 10,
    dose_max: 13
  },
  'rafoxanide': {
    category: 'Anthelmintic (Salicylanilide)',
    notes: 'Category: Anthelmintic (Salicylanilide). Salicylanilide flukicide uncoupling oxidative phosphorylation in parasite mitochondria. Indications: Adult and immature Fasciola hepatica (>6-8 weeks), Haemonchus, Gaigeria, and nasal bot fly (Oestrus ovis) larvae in sheep. Dosage: Cattle/Sheep 7.5 mg/kg PO or 3 mg/kg SC. Withdrawal: Meat 28 days; do not use in lactating dairy animals. Ref: Merck Vet Manual.',
    dose_min: 7.5,
    dose_max: 7.5
  },
  'triclabendazole': {
    category: 'Anthelmintic (Benzimidazole Flukicide)',
    notes: 'Category: Anthelmintic (Benzimidazole Flukicide). Unique flukicide highly effective against ALL stages of Fasciola hepatica (early immature 1-week-old, immature, and adult flukes). Indications: Acute, subacute, and chronic fascioliasis in cattle and sheep. Dosage: Cattle 12 mg/kg PO; Sheep 10 mg/kg PO single dose. Withdrawal: Meat 56 days; not permitted in animals producing milk for human consumption. Ref: Merck Vet Manual.',
    dose_min: 10,
    dose_max: 12
  },
  'closantel': {
    category: 'Anthelmintic (Salicylanilide)',
    notes: 'Category: Anthelmintic (Salicylanilide). Long-acting salicylanilide effective against Fasciola hepatica (from 6-8 weeks), Haemonchus contortus, Oestrus ovis, and Hypoderma. Dosage: Cattle 5-10 mg/kg PO/SC; Sheep 10 mg/kg PO. Prolonged persistent activity protects against reinfection. Withdrawal: Meat 28-42 days. Ref: Merck Vet Manual.',
    dose_min: 5,
    dose_max: 10
  },
  'oxyclozanide': {
    category: 'Anthelmintic (Salicylanilide)',
    notes: 'Category: Anthelmintic (Salicylanilide). Salicylanilide anthelmintic for the treatment and control of adult Fasciola hepatica and Paramphistomum (rumen flukes). Dosage: Cattle 10-15 mg/kg PO; Sheep 15 mg/kg PO. Withdrawal: Meat 14 days, Milk 60 hours. Ref: Merck Vet Manual.',
    dose_min: 10,
    dose_max: 15
  },
  'imidocarb': {
    category: 'Antiprotozoal (Diamidine)',
    notes: 'Category: Antiprotozoal (Diamidine). Carbanilide derivative with potent babesicidal and anaplasmacidal activity. Indications: Bovine, equine, and canine Babesiosis (Babesia bovis, B. bigemina, B. caballi, B. canis) and Anaplasmosis. Dosage: Cattle Babesiosis 1.2 mg/kg SC/IM; Cattle Anaplasmosis 3 mg/kg SC; Horses 2.4-4 mg/kg IM; Dogs 6.6 mg/kg SC/IM. Withdrawal: Cattle meat 28-90 days, Milk 21 days. Ref: Plumb\'s 9th Ed. p. 605.',
    dose_min: 1.2,
    dose_max: 3
  },
  'quinuronium sulphate': {
    category: 'Antiprotozoal (Babesicide)',
    notes: 'Category: Antiprotozoal (Babesicide). Acridine derivative for rapid treatment of acute bovine and equine Babesiosis (Redwater fever). Dosage: Cattle/Horses 1 mg/kg (or 1 ml/50 kg of 5% solution) SC ONLY. ⚠️ WARNING: Narrow therapeutic index! Parasympathomimetic side effects (salivation, urination, trembling) may occur; have Atropine ready as antidote. Ref: Merck Vet Manual.',
    dose_min: 1,
    dose_max: 1
  },
  'diminazene aceturate': {
    category: 'Antiprotozoal (Diamidine)',
    notes: 'Category: Antiprotozoal (Diamidine). Aromatic diamidine for the treatment of Trypanosomiasis (T. congolense, T. vivax, T. brucei) and Babesiosis (B. bovis, B. bigemina). Dosage: Cattle/Sheep/Horses 3.5-7 mg/kg deep IM single dose. Withdrawal: Meat 21 days, Milk 3 days. Ref: Merck Vet Manual.',
    dose_min: 3.5,
    dose_max: 7
  },
  'buparvaquone': {
    category: 'Antiprotozoal (Hydroxynaphthoquinone)',
    notes: 'Category: Antiprotozoal (Hydroxynaphthoquinone). Specific curative agent for Theileriosis (East Coast Fever, Mediterranean Theileriosis caused by Theileria annulata and T. parva). Dosage: Cattle 2.5 mg/kg (1 ml/20 kg) deep IM in neck muscles. Repeat in 48-72 hours in severe cases. Withdrawal: Meat 42 days, Milk 48 hours. Ref: Merck Vet Manual.',
    dose_min: 2.5,
    dose_max: 2.5
  },

  // -------------------------------------------------------------
  // HORMONES & REPRODUCTIVE DRUGS
  // -------------------------------------------------------------
  'gonadorelin': {
    category: 'GnRH Hormone',
    notes: 'Category: GnRH Hormone. Synthetic decapeptide identical to endogenous Gonadotropin-Releasing Hormone. Causes surge release of LH and FSH. Indications: Follicular ovarian cysts, ovulation synchronization in timed AI (Ovsynch, Co-Synch), and improving first-service conception rate. Dosage: Cattle: 100-250 mcg (2-5 ml) IM/IV per animal fixed dose. Ref: Plumb\'s 9th Ed. p. 518.',
    dose_min: 0,
    dose_max: 0
  },
  'buserelin': {
    category: 'GnRH Hormone (Super-agonist)',
    notes: 'Category: GnRH Hormone (Super-agonist). Potent synthetic GnRH analog (40-200x more potent than native GnRH). Indications: Follicular cysts, delayed ovulation, estrus synchronization protocols, and improving pregnancy rates. Dosage: Cattle: 10-20 mcg (2.5-5 ml Receptal/Busol) IM/IV; Horses: 20-40 mcg IM. Dose is fixed per animal. Ref: Plumb\'s 9th Ed. p. 156.',
    dose_min: 0,
    dose_max: 0
  },
  'cloprostenol': {
    category: 'Prostaglandin F2α Analog',
    notes: 'Category: Prostaglandin F2α Analog. Synthetic PGF2α luteolytic agent causing regression of corpus luteum within 2-4 days. Indications: Estrus synchronization, luteal cysts, pyometra/endometritis, termination of mummified fetus, and induction of parturition. Dosage: Cattle: 500 mcg (2 ml Estrumate) IM per animal. ⚠️ CAUTION: Induces abortion! Pregnant women and asthmatics must avoid contact. Ref: Plumb\'s 9th Ed. p. 268.',
    dose_min: 0,
    dose_max: 0
  },
  'dinoprost': {
    category: 'Prostaglandin F2α (Natural)',
    notes: 'Category: Prostaglandin F2α (Natural). Natural PGF2α tromethamine salt inducing luteolysis, smooth muscle contraction, and cervical dilation. Indications: Estrus synchronization, pyometra, abortion induction, and uterine evacuation. Dosage: Cattle: 25 mg (5 ml Lutalyse) IM per animal; Mares: 5-10 mg IM; Swine: 10 mg IM. ⚠️ WARNING: Induces abortion and bronchospasm; handle with extreme care. Ref: Plumb\'s 9th Ed. p. 367.',
    dose_min: 0,
    dose_max: 0
  },
  'oxytocin': {
    category: 'Pituitary Hormone (Oxytocic)',
    notes: 'Category: Pituitary Hormone (Oxytocic). Stimulates rhythmic contraction of uterine smooth muscle and contraction of myoepithelial cells in mammary alveoli (milk letdown). Indications: Uterine inertia (dystocia - ensure cervix is dilated!), retained placenta, post-partum uterine hemorrhage, agalactia, and post-partum uterine involution. Dosage: Cattle/Horses: 10-30 IU IV/IM; Swine: 10-20 IU IM; Dogs: 1-5 IU SC/IM. Ref: Plumb\'s 9th Ed. p. 896.',
    dose_min: 0,
    dose_max: 0
  },

  // -------------------------------------------------------------
  // SUPPORTIVE, TONICS & METABOLIC
  // -------------------------------------------------------------
  'butaphosphan + vit b12': {
    category: 'Metabolic Stimulant / Tonic',
    notes: 'Category: Metabolic Stimulant / Tonic. Organic phosphorus compound (Butaphosphan) combined with Cyanocobalamin (Vit B12). Stimulates cellular metabolism, liver function, hematopoiesis, and immune vigor. Indications: Metabolic disorders, ketosis adjunct, post-partum fatigue, debility, muscular weakness, and stress recovery. Dosage: Cattle/Horses: 10-25 ml IV/IM/SC; Calves/Foals: 5-12 ml; Dogs: 1-5 ml; Cats: 0.5-2.5 ml. Dose is per animal. Ref: Plumb\'s 9th Ed. p. 159.',
    dose_min: 0,
    dose_max: 0
  },
  'toldimfos': {
    category: 'Phosphorus Supplement / Tonic',
    notes: 'Category: Phosphorus Supplement / Tonic. Organic phosphorus (Toldimfos sodium 20%) for the treatment and prevention of hypophosphatemia. Indications: Post-parturient hemoglobinuria (redwater of dairy cows), downer cow syndrome, pica, rickets, osteomalacia, and metabolic exhaustion. Dosage: Cattle/Horses: 10-25 ml (2-5 g) IV/IM/SC; Calves: 5-10 ml. Dose is volume-based per animal. Ref: Merck Vet Manual.',
    dose_min: 0,
    dose_max: 0
  },
  'vitamin ad3e': {
    category: 'Vitamin Supplement (Fat-soluble)',
    notes: 'Category: Vitamin Supplement (Fat-soluble). Concentrated fat-soluble vitamins for epithelial health, calcium/phosphorus metabolism, bone growth, and fertility. Indications: Hypovitaminosis, rickets, growth retardation, reproductive disorders, retained placenta, and white muscle disease prevention. Dosage: Cattle/Horses: 5-10 ml IM/SC; Calves/Foals: 2-5 ml; Sheep/Goats: 1-3 ml. Repeat in 2-3 months. Ref: Merck Vet Manual.',
    dose_min: 0,
    dose_max: 0
  },
  'vitamin e-selenium': {
    category: 'Antioxidant / Mineral Supplement',
    notes: 'Category: Antioxidant / Mineral Supplement. Potent biological antioxidant combination protecting cellular membranes against oxidative damage. Indications: White Muscle Disease (nutritional muscular dystrophy), stiff lamb disease, retained placenta, poor fertility, and immune stimulation. Dosage: Calves/Lambs: 1 ml per 25-50 kg IM/SC; Adult Cattle: 10-20 ml IM. Warnings: Avoid IV administration. Ref: Plumb\'s 9th Ed. p. 1195.',
    dose_min: 0,
    dose_max: 0
  },
  'calcium': {
    category: 'Electrolyte / Mineral (Calcium)',
    notes: 'Category: Electrolyte / Mineral (Calcium). Calcium borogluconate formulation for acute hypocalcemia (Milk fever / Parturient paresis in cattle, eclampsia in bitches). Indications: Tremors, recumbency, loss of consciousness due to acute calcium deficiency. Dosage: Cattle: 250-500 ml IV slowly by gravity over 15-20 minutes with cardiac auscultation; Bitches: 1-1.5 ml/kg 10% solution slowly IV. Ref: Plumb\'s 9th Ed. p. 165.',
    dose_min: 0,
    dose_max: 0
  },
  'dimethicone': {
    category: 'Anti-bloat (Surfactant)',
    notes: 'Category: Anti-bloat (Surfactant). Surface-active silicone agent that alters surface tension of trapped ruminal gas bubbles, causing them to coalesce into free gas for eructation. Indications: Acute frothy bloat in cattle, sheep, and goats caused by lush legumes (clover, alfalfa) or high-concentrate diets. Dosage: Cattle: 100-200 ml PO as oral drench or directly by intraruminal injection; Sheep/Goats: 25-50 ml PO. Ref: Merck Vet Manual.',
    dose_min: 0,
    dose_max: 0
  },
  'lactulose': {
    category: 'Laxative / Ammonia Reducer',
    notes: 'Category: Laxative / Ammonia Reducer. Synthetic non-absorbable disaccharide that acidifies colonic contents, trapping ammonia as unabsorbable ammonium ions and drawing water into bowel lumen. Indications: Hepatic encephalopathy and chronic constipation. Dosage: Dogs: 0.5-1 ml/kg (or 5-15 ml) PO q8h titrated to 2-3 soft stools/day; Cats: 0.5-1 ml/kg (or 2-5 ml) PO q8-12h; Cattle: 50-100 ml PO. Ref: Plumb\'s 9th Ed. p. 656.',
    dose_min: 0,
    dose_max: 0
  },
  'acepromazine': {
    category: 'Sedative / Pre-anesthetic (Phenothiazine)',
    notes: 'Category: Sedative / Pre-anesthetic (Phenothiazine). Dopamine D2 antagonist causing central sedation, tranquilization, antiemesis, and peripheral alpha-1 vasodilation. Indications: Chemical restraint, pre-anesthetic medication, and motion sickness antiemetic. Dosage: Dogs/Cats 0.025-0.1 mg/kg IV/IM/SC (max 3 mg); Horses 0.02-0.05 mg/kg IV/IM; Cattle 0.01-0.05 mg/kg IV/IM. Warnings: Causes penile prolapse in stallions and hypotension in hypovolemic patients. Ref: Plumb\'s 9th Ed. p. 4.',
    dose_min: 0.025,
    dose_max: 0.1
  },
  'clostridia vaccine': {
    category: 'Vaccine (Bacterial Toxoid/Bacterin)',
    notes: 'Category: Vaccine (Bacterial Toxoid/Bacterin). Multi-component clostridial toxoid protecting against Clostridium chauvoei (Blackleg), C. septicum (Malignant edema), C. novyi (Black disease), C. sordellii, and C. perfringens types B, C & D (Enterotoxemia / Pulpy kidney). Dosage: Cattle: 2-5 ml SC; Sheep/Goats: 2 ml SC. Booster 4-6 weeks later, then annually. Ref: Merck Vet Manual.',
    dose_min: 0,
    dose_max: 0
  }
};

console.log(`Knowledge base defined with ${Object.keys(CLINICAL_KNOWLEDGE).length} major drug families.`);

module.exports = { CLINICAL_KNOWLEDGE };
