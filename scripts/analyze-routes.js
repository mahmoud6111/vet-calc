const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'default-medications.js'), 'utf8');
const jsonMatch = content.replace(/^[\s\S]*?window\.DEFAULT_MEDICATIONS\s*=\s*/, '').replace(/;\s*$/, '');
const meds = JSON.parse(jsonMatch);

const largeMeds = meds.filter(m => ['large_animal', 'cattle', 'horse', 'sheep_goat', 'camel', 'poultry'].includes(m.species));
console.log('Total large animal meds:', largeMeds.length);

const routes = {};
const forms = {};
const routeFormCombos = {};

largeMeds.forEach(m => {
  routes[m.route] = (routes[m.route] || 0) + 1;
  forms[m.dosage_form] = (forms[m.dosage_form] || 0) + 1;
  const combo = `${m.dosage_form} + ${m.route}`;
  routeFormCombos[combo] = (routeFormCombos[combo] || 0) + 1;
});

console.log('Routes in large animal meds:', JSON.stringify(routes, null, 2));
console.log('Forms in large animal meds:', JSON.stringify(forms, null, 2));
console.log('Combos:', JSON.stringify(routeFormCombos, null, 2));
