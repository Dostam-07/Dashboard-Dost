const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Ensure header has z-index
code = code.replace(
    'sticky top-0 z-30 w-full',
    'sticky top-0 z-40 w-full'
);

// Ensure sidebar has z-index
code = code.replace(
    'Panel id="left-sidebar"',
    'Panel id="left-sidebar" z-index={30}' // Wait, panel doesn't support z-index as a prop.
    // I need to add classes to the className.
);

// This is tricky because className already has classes.
// I will do a regex replacement on the sidebar definition to add z-index classes if missing.
code = code.replace(
  /Panel id="left-sidebar"[\s\S]*?className="([^"]*)"/g,
  (match, p1) => {
    let classes = p1;
    if (!classes.includes('z-30')) {
      classes += ' z-30';
    }
    return match.replace(p1, classes);
  }
);

// Ensure right sidebar has z-index
code = code.replace(
  /Panel id="right-sidebar"[\s\S]*?className="([^"]*)"/g,
  (match, p1) => {
    let classes = p1;
    if (!classes.includes('z-30')) {
      classes += ' z-30';
    }
    return match.replace(p1, classes);
  }
);

fs.writeFileSync('src/App.tsx', code);
