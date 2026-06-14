
const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove the !isLeftSidebarCollapsed && ( wrapping the sidebar Panel
code = code.replace(
  /\{!\s*isLeftSidebarCollapsed\s*&&\s*\(/g,
  '('
);
// This regex might be risky. Let's be more specific.

// Look for lines 2052 and 2211
// 2052:         {!isLeftSidebarCollapsed && (
// 2211:         )}

// Actually, I'll just change the Panel logic to always render.
// There is also a resize handle conditionally rendered.
// 2213:         {!isLeftSidebarCollapsed && (
// 2215:         )}

// Let's use string replace for the specifically known lines:

code = code.replace(
    /        \{\/\* PANEL A: LEFT SIDEBAR - PREMIUM NAVIGATION \*\/\}\n        \{!isLeftSidebarCollapsed && \(/g,
    '        {/* PANEL A: LEFT SIDEBAR - PREMIUM NAVIGATION */}\n        ('
);

// This seems hard to get right with just a regex.
// I'll try a different approach. I will edit the file manually to remove the wrappers.
fs.writeFileSync('src/App.tsx', code);
