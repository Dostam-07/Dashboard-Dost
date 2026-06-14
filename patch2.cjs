const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/showNotification\(([`"'])(.*?)\1(?:, ".*?")?\);/g, (match, quote, message) => {
  if (message.toLowerCase().includes('auto-saved')) return match;
  return match + `\n    logActivity(String(${quote}${message}${quote}));`;
});
fs.writeFileSync('src/App.tsx', code);
