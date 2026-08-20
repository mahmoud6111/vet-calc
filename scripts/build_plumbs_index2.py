"""
Build a searchable drug index from Plumb's extracted text.
Simple approach: search for drug name headers and group content.
"""
import json
import re
import sys
import os

print("Loading Plumb's JSON...", flush=True)
with open(r'd:\vet calc\scripts\plumbs_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

print(f"Loaded {len(pages)} pages", flush=True)

# Concatenate all text with page markers
full_text = ''
for p in pages:
    full_text += f"\n\n[PAGE {p['page']}]\n{p['text']}"

print(f"Total chars: {len(full_text):,}", flush=True)

# Find drug entry start patterns:
# Plumb's format: "Drug Name N" where N is a page number, followed by drug name in ALL CAPS
# The pattern is: drug heading appears as "DRUGNAME\n" at the top of drug sections

# Extract sections using "Doses -" as a key anchor
# We'll build a lookup: generic_name -> doses text block

# Strategy: find all drug headings (ALLCAPS lines that are drug names)
# Then extract the full entry until next drug heading

drug_sections = {}

# Split on drug heading pattern - lines that are all uppercase words
# Plumb's uses "DRUGNAME" then "DRUGNAME 2" etc for continuation pages
lines = full_text.split('\n')
current_drug = None
current_lines = []

for line in lines:
    stripped = line.strip()
    if not stripped:
        continue
    
    # Drug heading: ALL CAPS, 2-60 chars, letters/spaces/hyphens only, no numbers at start
    # But NOT section headers within entries
    clean = re.sub(r'[\s\-,/&+®()\[\]]', '', stripped)
    is_heading = (
        len(stripped) >= 3 and
        len(stripped) <= 70 and
        clean.isupper() and
        bool(re.match(r'^[A-Z]', stripped)) and
        not re.search(r'\d', stripped[:3]) and
        not stripped.startswith('IV') and
        not stripped.startswith('SC') and
        not stripped.startswith('IM') and
        not stripped.startswith('PO ') and
        not stripped.endswith(':') and
        len(clean) > 2
    )
    
    # Exclude common section headers within drug entries
    section_headers = [
        'PHARMACOLOGY', 'PHARMACOKINETICS', 'CONTRAINDICATIONS', 'ADVERSE',
        'OVERDOSAGE', 'DRUG INTERACTIONS', 'LABORATORY', 'MONITORING',
        'CLIENT INFORMATION', 'DOSAGE FORMS', 'STORAGE', 'USES', 'CHEMISTRY',
        'PRESCRIBER', 'DOSES', 'WARNINGS', 'PRECAUTIONS'
    ]
    for sh in section_headers:
        if stripped.startswith(sh):
            is_heading = False
            break
    
    if is_heading:
        if current_drug and current_lines:
            entry_text = '\n'.join(current_lines)
            if current_drug not in drug_sections:
                drug_sections[current_drug] = entry_text
            else:
                drug_sections[current_drug] += '\n' + entry_text
        current_drug = stripped
        current_lines = [stripped]
    elif current_drug:
        current_lines.append(stripped)

# Save last entry
if current_drug and current_lines:
    drug_sections[current_drug] = '\n'.join(current_lines)

print(f"\nFound {len(drug_sections)} drug sections", flush=True)
print("Sample entries:", list(drug_sections.keys())[:30], flush=True)

# Save index
out_path = r'd:\vet calc\scripts\plumbs_index.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(drug_sections, f, ensure_ascii=False)

size_mb = os.path.getsize(out_path) / 1024 / 1024
print(f"\nSaved index: {out_path} ({size_mb:.1f} MB)", flush=True)

# Test lookup for key drugs
test_drugs = ['AMOXICILLIN', 'ENROFLOXACIN', 'MELOXICAM', 'FLUNIXIN', 'DOXYCYCLINE', 
               'KETOPROFEN', 'GENTAMICIN', 'OXYTETRACYCLINE', 'IVERMECTIN', 'ACEPROMAZINE']
print("\nTest lookups:")
for d in test_drugs:
    found = d in drug_sections
    if found:
        # Show doses section
        text = drug_sections[d]
        dose_idx = text.find('Doses -')
        if dose_idx >= 0:
            dose_snippet = text[dose_idx:dose_idx+300].replace('\n', ' ')
            print(f"  ✓ {d}: {dose_snippet[:150]}...")
        else:
            print(f"  ✓ {d}: (no Doses section found in entry)")
    else:
        print(f"  ✗ {d}: NOT FOUND")
