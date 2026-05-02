const fs = require("fs");
let code = fs.readFileSync("/app/src/components/Layout/InternalLayout.tsx", "utf8");

// Fix the broken Messages items that have hr/approvals inside them
code = code.replace(
  /\{ path: '\/internal\/messaging', label: 'Messages', icon: MessageCircle,\s*\{ path: '\/internal\/hr\/approvals', label: 'RH — Approbations', icon: Shield \} \}/g,
  "{ path: '/internal/messaging', label: 'Messages', icon: MessageCircle },\n        { path: '/internal/hr/approvals', label: 'RH — Approbations', icon: Shield }"
);

fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", code);
console.log("Fixed");

// Show result
const lines = code.split('\n');
console.log(lines.slice(65, 85).join('\n'));
