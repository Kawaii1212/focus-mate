const fs = require('fs');
const path = require('path');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    if (!content.includes('react-router-dom')) {
        return;
    }

    if (!content.includes('"use client"') && !content.includes("'use client'")) {
        content = '"use client";\n\n' + content;
    }

    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"];/g;
    let match = importRegex.exec(content);
    if (match) {
        const importedItems = match[1].split(',').map(i => i.trim());
        let newImports = [];
        let nextNavImports = [];
        
        if (importedItems.includes('Link') || importedItems.includes('NavLink')) {
            newImports.push("import Link from 'next/link';");
            if (importedItems.includes('NavLink')) {
                content = content.replace(/<NavLink/g, '<Link').replace(/<\/NavLink>/g, '</Link>');
            }
        }
        if (importedItems.includes('useNavigate')) {
            nextNavImports.push('useRouter');
        }
        if (importedItems.includes('useLocation')) {
            nextNavImports.push('usePathname');
            nextNavImports.push('useSearchParams');
        }
        
        if (nextNavImports.length > 0) {
            newImports.push(`import { ${nextNavImports.join(', ')} } from 'next/navigation';`);
        }
        
        content = content.replace(match[0], newImports.join('\n'));
    }

    content = content.replace(/useNavigate\(\)/g, 'useRouter()');
    content = content.replace(/const navigate\s*=/g, 'const router =');
    content = content.replace(/navigate\(/g, 'router.push(');

    if (content.includes('useLocation')) {
        content = content.replace(/useLocation\(\)/g, '{ pathname: usePathname(), searchParams: useSearchParams() }');
        content = content.replace(/location\.state/g, "(() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })()");
        content = content.replace(/location\.pathname/g, 'pathname');
        
        content = content.replace(
            /const location\s*=\s*\{\s*pathname:\s*usePathname\(\),\s*searchParams:\s*useSearchParams\(\)\s*\}/g,
            `const pathname = usePathname();\n  const searchParams = useSearchParams();\n  const location = { pathname, state: (() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })() };`
        );
    }

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Processed ${filepath}`);
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
