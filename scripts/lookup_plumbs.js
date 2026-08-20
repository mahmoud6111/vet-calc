const fs = require('fs');
const path = require('path');

const indexData = JSON.parse(fs.readFileSync(path.join(__dirname, 'plumbs_index.json'), 'utf8'));
const pagesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'plumbs_text.json'), 'utf8'));

function searchPlumbs(query) {
  const q = query.trim().toUpperCase();
  const results = [];

  // Direct match in drug sections
  for (const [key, text] of Object.entries(indexData)) {
    if (key.includes(q)) {
      results.push({ key, text: text.substring(0, 1500) });
    }
  }

  // If no direct section match, search in all pages
  if (results.length === 0) {
    const regex = new RegExp(`\\b${query}\\b`, 'i');
    for (const p of pagesData) {
      if (regex.test(p.text)) {
        results.push({ page: p.page, text: p.text.substring(0, 1500) });
        if (results.length >= 5) break;
      }
    }
  }

  return results;
}

if (process.argv[2]) {
  const res = searchPlumbs(process.argv[2]);
  console.log(`Found ${res.length} matches for "${process.argv[2]}":`);
  res.forEach((r, idx) => {
    console.log(`\n--- Match ${idx + 1} (${r.key || 'Page ' + r.page}) ---`);
    console.log(r.text.substring(0, 500) + '...');
  });
}

module.exports = { searchPlumbs };
