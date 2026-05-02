const fs = require("fs");
let code = fs.readFileSync("/app/src/components/Layout/InternalLayout.tsx", "utf8");

// Add HR menu items to Secrétaire role
const oldSecretaire = `'Secrétaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/users', label: 'Utilisateurs', icon: Users },
        { path: '/internal/courrier', label: 'Courrier', icon: Inbox },
        { path: '/internal/documents', label: 'Documents', icon: FolderOpen },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],`;

const newSecretaire = `'Secrétaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/users', label: 'Utilisateurs', icon: Users },
        { path: '/internal/hr/personnel', label: 'RH — Personnel', icon: UserCheck },
        { path: '/internal/hr/payroll', label: 'RH — Paie', icon: DollarSign },
        { path: '/internal/hr/leave', label: 'RH — Congés', icon: Calendar },
        { path: '/internal/hr/attendance', label: 'RH — Présences', icon: Clock },
        { path: '/internal/hr/trainings', label: 'RH — Formations', icon: BookOpen },
        { path: '/internal/hr/evaluations', label: 'RH — Évaluations', icon: Target },
        { path: '/internal/hr/contracts', label: 'RH — Contrats', icon: FileText },
        { path: '/internal/hr/disciplinary', label: 'RH — Discipline', icon: Shield },
        { path: '/internal/courrier', label: 'Courrier', icon: Inbox },
        { path: '/internal/documents', label: 'Documents', icon: FolderOpen },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],`;

if (!code.includes(oldSecretaire)) {
  console.log("Secretaire menu not found in expected format");
  process.exit(1);
}

code = code.replace(oldSecretaire, newSecretaire);

// Also add approvals menu to responsable roles
const rolesToAddApprovals = ['Ministre','Coordinateur National','Coordinateur Provincial'];
rolesToAddApprovals.forEach(role => {
  const searchPattern = `'${role}': [`;
  const idx = code.indexOf(searchPattern);
  if (idx !== -1) {
    const msgLineIdx = code.indexOf("label: 'Messages'", idx);
    if (msgLineIdx !== -1) {
      const lineEnd = code.indexOf("\n", msgLineIdx);
      const toInsert = ",\n        { path: '/internal/hr/approvals', label: 'RH — Approbations', icon: Shield }";
      // Only insert if not already there
      if (code.indexOf("/internal/hr/approvals", idx) === -1 || code.indexOf("/internal/hr/approvals", idx) > code.indexOf("]", idx)) {
        code = code.substring(0, lineEnd-2) + toInsert + code.substring(lineEnd-2);
      }
    }
  }
});

// Also add for Coordinateur Sous-Provincial and Chef de Centre
['Coordinateur Sous-Provincial','Chef de Centre','Directeur Centre'].forEach(role => {
  const searchPattern = `'${role}': [`;
  const idx = code.indexOf(searchPattern);
  if (idx !== -1) {
    const msgLineIdx = code.indexOf("label: 'Messages'", idx);
    if (msgLineIdx !== -1) {
      const lineEnd = code.indexOf("\n", msgLineIdx);
      const toInsert = ",\n        { path: '/internal/hr/approvals', label: 'RH — Approbations', icon: Shield }";
      if (code.indexOf("/internal/hr/approvals", idx) === -1 || code.indexOf("/internal/hr/approvals", idx) > code.indexOf("]", idx)) {
        code = code.substring(0, lineEnd-2) + toInsert + code.substring(lineEnd-2);
      }
    }
  }
});

// Add missing icon imports
if (!code.includes("DollarSign,")) {
  code = code.replace("  Settings,\n} from 'lucide-react';", "  Settings,\n  DollarSign,\n  Clock,\n} from 'lucide-react';");
}

fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", code);
console.log("MENU UPDATED");
