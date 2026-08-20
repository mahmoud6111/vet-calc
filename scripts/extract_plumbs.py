import pdfplumber
import sys
import json

pdf_path = r"d:\vet calc\Plumb's veterinary drug handbook (Plumb, 9th Edition).pdf"

# Extract all text from the PDF
all_text = []
with pdfplumber.open(pdf_path) as pdf:
    total = len(pdf.pages)
    print(f"Total pages: {total}", flush=True)
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            all_text.append({'page': i+1, 'text': text})
        if i % 50 == 0:
            print(f"  Processed page {i+1}/{total}", flush=True)

# Save to file for further processing
with open(r"d:\vet calc\scripts\plumbs_text.json", 'w', encoding='utf-8') as f:
    json.dump(all_text, f, ensure_ascii=False)

print(f"\nDone. Extracted {len(all_text)} pages with text.")
print(f"Total characters: {sum(len(p['text']) for p in all_text):,}")
