
const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Regex for the broken block
code = code.replace(
    /\s+\)\}\n+\s+\(\n+\s+<PanelResizeHandle className="w-1\.5 bg-slate-200\/50 hover:bg-indigo-500 dark:bg-zinc-900 dark:hover:bg-indigo-500 transition-colors cursor-col-resize shrink-0" \/>\n+\s+\)\}/, 
    '\n        {!isLeftSidebarCollapsed && (\n          <PanelResizeHandle className="w-1.5 bg-slate-200/50 hover:bg-indigo-500 dark:bg-zinc-900 dark:hover:bg-indigo-500 transition-colors cursor-col-resize shrink-0" />\n        )}'
);

fs.writeFileSync('src/App.tsx', code);
