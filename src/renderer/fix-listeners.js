const fs = require('fs');
const path = 'c:/Users/Gabriel/Desktop/Itens/Antigravity/Solari APP/src/renderer/renderer.js';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/(\w+)\.addEventListener/g, (match, p1) => {
    if (['document', 'window', 'ipcRenderer', 'radio', 'btn', 'div', 'li', 'el', 'customStyle', 'ws', 'modal', 'closeBtn'].includes(p1)) return match;
    return p1 + '?.addEventListener';
});

fs.writeFileSync(path, code);
console.log('Successfully added optional chaining to addEventListeners');
