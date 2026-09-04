import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'react-router-dom' not in content:
        return

    # Add "use client" if not present
    if '"use client"' not in content and "'use client'" not in content:
        content = '"use client";\n\n' + content

    # Replace import
    imports = re.search(r'import\s+\{([^}]+)\}\s+from\s+[\'"]react-router-dom[\'"];', content)
    if imports:
        imported_items = [i.strip() for i in imports.group(1).split(',')]
        new_imports = []
        next_nav_imports = []
        
        if 'Link' in imported_items:
            new_imports.append("import Link from 'next/link';")
        if 'NavLink' in imported_items:
            # We'll just map NavLink to Link for now to prevent breaking
            new_imports.append("import Link from 'next/link';")
            content = content.replace('<NavLink', '<Link').replace('</NavLink>', '</Link>')
        if 'useNavigate' in imported_items:
            next_nav_imports.append('useRouter')
        if 'useLocation' in imported_items:
            next_nav_imports.append('usePathname')
            next_nav_imports.append('useSearchParams')
            
        if next_nav_imports:
            new_imports.append(f"import {{ {', '.join(next_nav_imports)} }} from 'next/navigation';")
            
        content = content[:imports.start()] + '\n'.join(new_imports) + content[imports.end():]

    # Replace usages
    content = content.replace('useNavigate()', 'useRouter()')
    
    # Simple replacement for navigate('path') to router.push('path')
    # We will do a regex to handle state
    # navigate('/study', { state: { ... } }) -> router.push('/study?state=' + encodeURIComponent(JSON.stringify({ ... })))
    # For simplicity, let's just replace `const navigate = useRouter();` and let the developer fix complex ones, or do a simple replace:
    content = re.sub(r'\bnavigate\(([^,]+)\)', r'router.push(\1)', content)
    # With state: navigate('/path', { state: obj, replace: true })
    # This is harder to regex reliably. Let's do a more robust regex or just simple replacements
    content = re.sub(r'const navigate\s*=', 'const router =', content)
    content = content.replace('navigate(', 'router.push(')

    if 'useLocation' in imports.group(1) if imports else False:
        content = content.replace('useLocation()', '{ pathname: usePathname(), searchParams: useSearchParams() }')
        content = content.replace('location.state', "(() => { try { return JSON.parse(searchParams?.get('state') || 'null'); } catch { return null; } })()")
        content = content.replace('location.pathname', 'pathname')
        content = content.replace('const location = {', 'const { pathname, searchParams } = {') # Fix destructuring if they used `const location =`
        # Actually it's better to just do:
        content = re.sub(r'const location\s*=\s*\{\s*pathname:\s*usePathname\(\),\s*searchParams:\s*useSearchParams\(\)\s*\}', 
                         r'const pathname = usePathname();\n  const searchParams = useSearchParams();\n  const location = { pathname, state: (() => { try { return JSON.parse(searchParams?.get(\'state\') || \'null\'); } catch { return null; } })() };', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {filepath}")

for filepath in glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True):
    process_file(filepath)
