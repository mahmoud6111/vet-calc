"""
Build a searchable drug index from extracted Plumb's text.
Groups text by drug name for fast lookup.
"""
import json
import re
import os

with open('scripts/plumbs_text.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

print(f"Loaded {len(pages)} pages from Plumb's")

# Build drug entry index: drug_name -> full text block
drug_index = {}
current_drug = None
current_text = []

for page_obj in pages:
    text = page_obj['text']
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect drug name headers (ALL CAPS lines, typically drug name)
        # Pattern: line is all caps (or mostly) and < 60 chars, appears after a page number
        upper_check = re.sub(r'[\s\-,/&+®]', '', line)
        if (len(line) > 2 and len(line) < 80 and 
            upper_check.isupper() and upper_check.isalpha() and
            not line.startswith('DOSE') and
            not line.startswith('DRUG') and
            not line.startswith('USE') and
            not line.startswith('MONITOR') and
            not line.startswith('PHARMACOL') and
            not line.startswith('CONTRAIND') and
            not line.startswith('ADVERSE') and
            not line.startswith('CLIENT') and
            not line.startswith('OVERDOS') and
            not line.startswith('PRESCRIB') and
            not line.startswith('STORAGE')):
            # Save previous drug
            if current_drug and current_text:
                full_text = '\n'.join(current_text)
                if current_drug not in drug_index:
                    drug_index[current_drug] = full_text
                else:
                    drug_index[current_drug] += '\n' + full_text
            current_drug = line.strip()
            current_text = [line]
        else:
            if current_drug:
                current_text.append(line)

# Save last drug
if current_drug and current_text:
    drug_index[current_drug] = '\n'.join(current_text)

print(f"Indexed {len(drug_index)} drug entries")
print("Sample drugs:", list(drug_index.keys())[:20])

# Save index
with open('scripts/plumbs_index.json', 'w', encoding='utf-8') as f:
    json.dump(drug_index, f, ensure_ascii=False, indent=2)

print(f"Saved index to scripts/plumbs_index.json ({os.path.getsize('scripts/plumbs_index.json')//1024} KB)")
