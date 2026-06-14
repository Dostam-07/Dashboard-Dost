
const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix lines 2211 - 2215
code = code.replace(
    /        \)\}\n        \s?\(\n          <PanelResizeHandle/g,
    '        {!isLeftSidebarCollapsed && (\n          <PanelResizeHandle'
);
// The closing brace is still there. Wait, looking at the previous file view:
// 2211:         )}
// 2213:         (
// 2214:           <PanelResizeHandle ...
// 2215:         )}

// So 2211 is a ")}", 2213 is "(", 2214 is PanelResizeHandle, 2215 is ")}".
// This is very messed up.

// Let's replace the whole block from 2211 to 2215.

code = code.replace(
    /        \)\}\n        \s?\(\n          <PanelResizeHandle[\s\S]*?className="w-1\.5 bg-slate-200\/50 hover:bg-indigo-500 dark:bg-zinc-900 dark:hover:bg-indigo-500 transition-colors cursor-col-resize shrink-0" \/>\n        \)\}/g,
    '        {!isLeftSidebarCollapsed && (\n          <PanelResizeHandle className="w-1.5 bg-slate-200/50 hover:bg-indigo-500 dark:bg-zinc-900 dark:hover:bg-indigo-500 transition-colors cursor-col-resize shrink-0" />\n        )}'
);

fs.writeFileSync('src/App.tsx', code);
