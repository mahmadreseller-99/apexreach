import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, 'src');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath, filelist);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      filelist.push(filePath);
    }
  });
  return filelist;
};

const files = walkSync(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Dashboard pages pattern
  const p1 = /const\s+\[(currentUser|user),\s*set(?:Current)?User\]\s*=\s*useState\([^)]*\);\s*(?:eslint-disable-next-line.*\s*)?useEffect\(\s*\(\)\s*=>\s*\{\s*base44\.auth\.me\(\)\.then\((?:setCurrentUser|setUser)\)\.catch\(\(\)\s*=>\s*\{\}\);\s*\},?\s*\[\]\);?/g;
  
  if (p1.test(content)) {
    content = content.replace(p1, (match, varName) => {
      return `const { user: ${varName} } = useAuth();`;
    });
    if (!content.includes('useAuth')) {
      content = `import { useAuth } from '@/lib/AuthContext';\n` + content;
    }
    changed = true;
  }

  // One line pattern for SmtpManagement, etc if the first pattern did not match perfectly due to variations
  const p2 = /useEffect\(\s*\(\)\s*=>\s*\{\s*base44\.auth\.me\(\)\.then\((?:setCurrentUser|setUser)\)\.catch\(\(\)\s*=>\s*\{\}\);\s*\},?\s*\[\]\);?/g;
  if (p2.test(content)) {
      content = content.replace(p2, '');
      content = content.replace(/const\s+\[(currentUser|user),\s*set(?:Current)?User\]\s*=\s*useState\([^)]*\);/g, 'const { user: $1 } = useAuth();');
      if (!content.includes('useAuth')) {
          content = `import { useAuth } from '@/lib/AuthContext';\n` + content;
      }
      changed = true;
  }

  // Any remaining base44.auth to auth. (For Login, Signup, AuthContext, Settings)
  if (content.includes('base44.auth.')) {
     content = content.replace(/base44\.auth\./g, 'auth.');
     
     // Ensure auth is imported if we just swapped it
     if (content.match(/import\s+\{.*base44.*\}\s+from\s+.*apiClient/)) {
         content = content.replace(/import\s+\{([^}]*)\}\s+from\s+([^;]*apiClient[^;]*);/, (m, p1, p2) => {
             if (p1.includes('auth')) return m;
             if (p1.trim() === 'base44') return `import { base44, auth } from ${p2};`;
             return `import { ${p1}, auth } from ${p2};`;
         });
     } else if (content.match(/import\s+\{.*base44.*\}\s+from\s+.*base44Client/)) {
         content = content.replace(/import\s+\{([^}]*)\}\s+from\s+([^;]*base44Client[^;]*);/, (m, p1, p2) => {
             if (p1.includes('auth')) return m;
             if (p1.trim() === 'base44') return `import { base44, auth } from ${p2};`;
             return `import { ${p1}, auth } from ${p2};`;
         });
     } else {
         if(!content.includes('auth } from')) {
            content = `import { auth } from '@/api/apiClient';\n` + content;
         }
     }
     changed = true;
  }

  // Clean empty useEffect that might be left behind (e.g. Settings.jsx)
  content = content.replace(/useEffect\(\(\)\s*=>\s*\{\s*\},?\s*\[\]\);/g, '');

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
});
