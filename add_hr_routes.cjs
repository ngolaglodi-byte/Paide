const fs = require("fs");
let code = fs.readFileSync("/app/src/App.tsx", "utf8");

if (code.includes("hr/Personnel")) { console.log("Routes already added"); process.exit(0); }

// Add imports
const oldImport = "import SuperAdmin from '@/pages/SuperAdmin';";
const newImports = `import SuperAdmin from '@/pages/SuperAdmin';
import HRPersonnel from '@/pages/internal/hr/Personnel';
import HRPayroll from '@/pages/internal/hr/Payroll';
import HRLeave from '@/pages/internal/hr/Leave';
import HRAttendance from '@/pages/internal/hr/Attendance';
import HRTrainings from '@/pages/internal/hr/Trainings';
import HREvaluations from '@/pages/internal/hr/Evaluations';
import HRContracts from '@/pages/internal/hr/Contracts';
import HRDisciplinary from '@/pages/internal/hr/Disciplinary';
import HRApprovals from '@/pages/internal/hr/Approvals';`;

code = code.replace(oldImport, newImports);

// Add routes before the last Route or before </Routes>
const closingRoutes = code.lastIndexOf("</Routes>");
if (closingRoutes === -1) { console.log("No </Routes> found"); process.exit(1); }

const hrRoutes = `        <Route path="/internal/hr/personnel" element={<ProtectedRoute><InternalLayout><HRPersonnel /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/payroll" element={<ProtectedRoute><InternalLayout><HRPayroll /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/leave" element={<ProtectedRoute><InternalLayout><HRLeave /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/attendance" element={<ProtectedRoute><InternalLayout><HRAttendance /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/trainings" element={<ProtectedRoute><InternalLayout><HRTrainings /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/evaluations" element={<ProtectedRoute><InternalLayout><HREvaluations /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/contracts" element={<ProtectedRoute><InternalLayout><HRContracts /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/disciplinary" element={<ProtectedRoute><InternalLayout><HRDisciplinary /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/approvals" element={<ProtectedRoute><InternalLayout><HRApprovals /></InternalLayout></ProtectedRoute>} />
`;

code = code.substring(0, closingRoutes) + hrRoutes + "        " + code.substring(closingRoutes);
fs.writeFileSync("/app/src/App.tsx", code);
console.log("HR routes added to App.tsx");
