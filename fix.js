const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const targetDir = 'c:/Users/Only Coding Account/QuestXP/frontend/src';
walkDir(targetDir, (filePath) => {
    if (filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let lines = content.split('\n');
        let changed = false;
        
        for (let i = 0; i < lines.length; i++) {
            let numQuotes = (lines[i].match(/"/g) || []).length;
            if (numQuotes % 2 !== 0 && lines[i].includes('className="')) {
                // Remove trailing \r if it exists, add quote, then add \r back if needed
                lines[i] = lines[i].replace(/\r?$/, '"$&');
                changed = true;
            }
        }
        
        if (changed) {
            fs.writeFileSync(filePath, lines.join('\n'));
            console.log('Fixed quotes in:', filePath);
        }
    }
});
