const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

console.log('ID 1-83:');
const first83 = meds.slice(0, 83);
console.log('Species in first 83:', new Set(first83.map(m => m.species)));

console.log('\nID 84+:');
const rest = meds.slice(83);
console.log('Total in rest:', rest.length);
console.log('Species in rest:', new Set(rest.map(m => m.species)));
console.log('Routes in rest:', rest.reduce((acc, m) => { acc[m.route] = (acc[m.route] || 0) + 1; return acc; }, {}));
console.log('Forms in rest:', rest.reduce((acc, m) => { acc[m.dosage_form] = (acc[m.dosage_form] || 0) + 1; return acc; }, {}));
