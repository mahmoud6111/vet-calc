const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

console.log('Total meds:', meds.length);

// Let's inspect all fields across all meds
meds.forEach(m => {
  // Check if notes contain route info
  const text = (m.brand_name + ' ' + m.generic_name + ' ' + m.unit_description + ' ' + m.notes + ' ' + m.frequency).toLowerCase();
  
  // Extract potential routes from text:
  // IV, IM, SC, PO / oral / drench / bolus / drinking water / feed, Topical / pour-on / spray / ointment / cream / intramammary / intrauterine / ophthalmic / otic
});

console.log('Sample full record for ID 84:');
console.log(JSON.stringify(meds.find(m => m.id === '84'), null, 2));

console.log('Sample full record for ID 87:');
console.log(JSON.stringify(meds.find(m => m.id === '87'), null, 2));

console.log('Sample full record for ID 146:');
console.log(JSON.stringify(meds.find(m => m.id === '146'), null, 2));
