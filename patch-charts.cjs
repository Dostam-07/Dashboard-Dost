
const fs = require('fs');
let code = fs.readFileSync('src/components/ChartWrapper.tsx', 'utf8');

// Use a regex that handles potential whitespace/newlines between props
code = code.replace(
  /<ResponsiveContainer\s+width="100%"\s+height="100%"/g,
  '<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}'
);

fs.writeFileSync('src/components/ChartWrapper.tsx', code);
