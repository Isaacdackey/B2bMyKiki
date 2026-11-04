const fs = require('fs');
const path = require('path');

const compDir = 'd:/JOB/kiki traiteur/INFO/site/front/kikitraiteur/kiki_front/src/app/gestionnaire/components';
const components = ['dashboard', 'demandes', 'agenda', 'mediatheque', 'cms', 'clients', 'personnel', 'google-sync'];
for (const comp of components) {
  const file = path.join(compDir, comp, comp + '.component.ts');
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/template: \\<div/g, 'template: `<div');
    content = content.replace(/<\/div>\\`/g, '</div>`');
    content = content.replace(/<\/div>\\/g, '</div>`');
    content = content.replace(/template: \\\\<div/g, 'template: `<div');
    content = content.replace(/<\/div>\\\\`/g, '</div>`');
    fs.writeFileSync(file, content, 'utf8');
  }
}
console.log("Fixed files");
