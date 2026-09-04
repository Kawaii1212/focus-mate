const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const dirname = path.dirname(filepath);

    const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
    let modified = false;

    content = content.replace(importRegex, (match, importPath) => {
        // importPath is something like '../../components/foo'
        const resolvedPath = path.resolve(dirname, importPath);
        
        // If the resolved path is inside srcDir, we can use @/
        if (resolvedPath.startsWith(srcDir)) {
            const relativeToSrc = path.relative(srcDir, resolvedPath);
            const newImportPath = '@/' + relativeToSrc.replace(/\\/g, '/');
            modified = true;
            return `from '${newImportPath}'`;
        }
        return match;
    });

    if (modified) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Updated imports in ${filepath}`);
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

walk(path.join(__dirname, 'src', 'app'));
