import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import ForceChangePassword from '@/pages/internal/ForceChangePassword';

// Pages publiques
import Home from '@/pages/public/Home';
import Mission from '@/pages/public/Mission';
import Formations from '@/pages/public/Formations';
import Centres from '@/pages/public/Centres';
import PublicCible from '@/pages/public/PublicCible';
import Partenaires from '@/pages/public/Partenaires';
import Actualites from '@/pages/public/Actualites';
import Contact from '@/pages/public/Contact';

// Auth
import Login from '@/pages/auth/Login';

// Pages internes
import Profile from '@/pages/internal/Profile';
import Messaging from '@/pages/internal/Messaging';
import Reports from '@/pages/internal/Reports';
import Notifications from '@/pages/internal/Notifications';
import Dashboard from '@/pages/internal/Dashboard';
import Users from '@/pages/internal/Users';
import Decisions from '@/pages/internal/Decisions';
import Courrier from '@/pages/internal/Courrier';
import Documents from '@/pages/internal/Documents';
import Formateurs from '@/pages/internal/Formateurs';
import Statistiques from '@/pages/internal/Statistiques';
import Personnel from "@/pages/internal/Personnel";
import Journal from "@/pages/internal/Journal";
import Equipement from "@/pages/internal/Equipement";
import Discipline from "@/pages/internal/Discipline";
import InternalChildren from "@/pages/internal/Children";
import InternalCenters from "@/pages/internal/Centers";
import InternalFormations from "@/pages/internal/Formations";
import SuperAdmin from '@/pages/SuperAdmin';
import HRPersonnel from '@/pages/internal/hr/Personnel';
import HRLeave from '@/pages/internal/hr/Leave';
import HRAttendance from '@/pages/internal/hr/Attendance';
import HRTrainings from '@/pages/internal/hr/Trainings';
import HREvaluations from '@/pages/internal/hr/Evaluations';
import HRDisciplinary from '@/pages/internal/hr/Disciplinary';
import HRApprovals from '@/pages/internal/hr/Approvals';
import HRMecanisation from '@/pages/internal/hr/Mecanisation';
import HROrganigram from '@/pages/internal/hr/Organigram';
import HRAgenda from '@/pages/internal/hr/Agenda';
import HRMeetings from '@/pages/internal/hr/Meetings';
import HRResources from '@/pages/internal/hr/Resources';
import FinanceBudget from '@/pages/internal/finance/Budget';
import FinanceExpenses from '@/pages/internal/finance/Expenses';
import FinanceInvoices from '@/pages/internal/finance/Invoices';
import FinanceReports from '@/pages/internal/finance/Reports';
import InternalLayout from '@/components/Layout/InternalLayout';

function AppLayout() {
  const location = useLocation();
  const { mustChangePassword, setMustChangePassword } = useAuth();
  const isSuperAdmin = location.pathname === '/superadmin';
  const isLogin = location.pathname === '/login';
  const isInternal = location.pathname.startsWith('/internal');
  const hideLayout = isSuperAdmin || isLogin || isInternal;

  // Force password change on first login
  if (mustChangePassword && !isLogin) {
    return <ForceChangePassword onPasswordChanged={() => setMustChangePassword(false)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {!hideLayout && <Header />}
      <main className={hideLayout ? '' : 'min-h-screen'}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/formations" element={<Formations />} />
          <Route path="/centres" element={<Centres />} />
          <Route path="/public-cible" element={<PublicCible />} />
          <Route path="/partenaires" element={<Partenaires />} />
          <Route path="/actualites" element={<Actualites />} />
          <Route path="/contact" element={<Contact />} />

          {/* Authentification */}
          <Route path="/login" element={<Login />} />

{/* Routes internes protégées */}
          <Route path="/internal/dashboard" element={<ProtectedRoute><InternalLayout><Dashboard /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/users" element={<ProtectedRoute><InternalLayout><Users /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/decisions" element={<ProtectedRoute><InternalLayout><Decisions /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/courrier" element={<ProtectedRoute><InternalLayout><Courrier /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/documents" element={<ProtectedRoute><InternalLayout><Documents /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/profile" element={<ProtectedRoute><InternalLayout><Profile /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/messaging" element={<ProtectedRoute><InternalLayout><Messaging /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/reports" element={<ProtectedRoute><InternalLayout><Reports /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/notifications" element={<ProtectedRoute><InternalLayout><Notifications /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/formateurs" element={<ProtectedRoute><InternalLayout><Formateurs /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/statistiques" element={<ProtectedRoute><InternalLayout><Statistiques /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/personnel" element={<ProtectedRoute><InternalLayout><Personnel /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/journal" element={<ProtectedRoute><InternalLayout><Journal /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/equipement" element={<ProtectedRoute><InternalLayout><Equipement /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/discipline" element={<ProtectedRoute><InternalLayout><Discipline /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/children" element={<ProtectedRoute><InternalLayout><InternalChildren /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/centers" element={<ProtectedRoute><InternalLayout><InternalCenters /></InternalLayout></ProtectedRoute>} />
          <Route path="/internal/formations" element={<ProtectedRoute><InternalLayout><InternalFormations /></InternalLayout></ProtectedRoute>} />
          <Route path="/superadmin" element={<ProtectedRoute requiredLevel="superadmin"><SuperAdmin /></ProtectedRoute>} />
                <Route path="/internal/hr/personnel" element={<ProtectedRoute><InternalLayout><HRPersonnel /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/leave" element={<ProtectedRoute><InternalLayout><HRLeave /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/attendance" element={<ProtectedRoute><InternalLayout><HRAttendance /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/trainings" element={<ProtectedRoute><InternalLayout><HRTrainings /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/evaluations" element={<ProtectedRoute><InternalLayout><HREvaluations /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/disciplinary" element={<ProtectedRoute><InternalLayout><HRDisciplinary /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/approvals" element={<ProtectedRoute><InternalLayout><HRApprovals /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/mecanisation" element={<ProtectedRoute><InternalLayout><HRMecanisation /></InternalLayout></ProtectedRoute>} />
                <Route path="/internal/hr/organigram" element={<ProtectedRoute><InternalLayout><HROrganigram /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/agenda" element={<ProtectedRoute><InternalLayout><HRAgenda /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/meetings" element={<ProtectedRoute><InternalLayout><HRMeetings /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/resources" element={<ProtectedRoute><InternalLayout><HRResources /></InternalLayout></ProtectedRoute>} />
                <Route path="/internal/finance/budget" element={<ProtectedRoute><InternalLayout><FinanceBudget /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/finance/expenses" element={<ProtectedRoute><InternalLayout><FinanceExpenses /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/finance/invoices" element={<ProtectedRoute><InternalLayout><FinanceInvoices /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/finance/reports" element={<ProtectedRoute><InternalLayout><FinanceReports /></InternalLayout></ProtectedRoute>} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
