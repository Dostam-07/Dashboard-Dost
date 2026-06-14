const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace flex child containers that lack min-w-0
// This is aggressive, might need refinement.
code = code.replace(
    /className="([^"]*flex[^"]*)"/g,
    (match, p1) => {
        if (!p1.includes('min-w-0') && !p1.includes('min-w-full')) {
            return `className="${p1} min-w-0"`;
        }
        return match;
    }
);

fs.writeFileSync('src/App.tsx', code);
