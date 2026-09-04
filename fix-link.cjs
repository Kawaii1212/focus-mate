const fs = require('fs');
const path = require('path');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    if (!content.includes('next/link')) {
        return;
    }

    let modified = false;

    // Replace to= with href=
    const newContent = content.replace(/<Link([^>]+)to=/g, '<Link$1href=');
    if (newContent !== content) {
        content = newContent;
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Processed ${filepath}`);
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat && stat.isDirectory()) {
            walk(filepath);
        } else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
            processFile(filepath);
        }
    });
}

walk(path.join(__dirname, 'src'));
