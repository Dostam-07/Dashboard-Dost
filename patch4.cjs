const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/<Panel className="flex flex-col min-w-\[300px\]"/g, '<Panel id="main-content" className="flex flex-col min-w-0"');
code = code.replace(/<Panel defaultSize=\{20\} collapsible=\{true\} maxSize=\{30\} minSize=\{15\}/, '<Panel id="left-sidebar" defaultSize={15} collapsible={true} maxSize={30} minSize={15}');
code = code.replace(/<Panel defaultSize=\{20\} collapsible=\{true\} maxSize=\{40\} minSize=\{15\}/, '<Panel id="right-sidebar" defaultSize={20} collapsible={true} maxSize={40} minSize={15}');
fs.writeFileSync('src/App.tsx', code);
