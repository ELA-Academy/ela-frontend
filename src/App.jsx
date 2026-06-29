import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import { TimerProvider } from "./context/TimerContext";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import SuperAdminSetup from "./pages/SuperAdminSetup";
import SetupPassword from "./pages/SetupPassword";
import AdminLayout from "./components/admin/AdminLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import ManageDepartments from "./pages/admin/ManageDepartments";
import ManageStaff from "./pages/admin/ManageStaff";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import Logout from "./components/Logout";
import AdmissionForm from "./pages/public/AdmissionForm";
import AdmissionsDashboard from "./pages/admin/admissions/AdmissionsDashboard";
import LeadsListPage from "./pages/admin/admissions/LeadsListPage";
import LeadDetailPage from "./pages/admin/admissions/LeadDetailPage";
import AccountingDashboard from "./pages/admin/accounting/AccountingDashboard";
import AdministrationDashboard from "./pages/admin/administration/AdministrationDashboard";
import GenericDashboard from "./pages/admin/department/GenericDashboard";
import ActivityFeedPage from "./pages/admin/ActivityFeedPage";
import ProfilePage from "./pages/admin/ProfilePage";
import MessagingPage from "./pages/admin/MessagingPage";
import EnrollmentDashboard from "./pages/admin/enrollment/EnrollmentDashboard";
import EnrollmentFormBuilder from "./pages/admin/enrollment/EnrollmentFormBuilder";
import PublicEnrollmentForm from "./pages/public/PublicEnrollmentForm";
import PublicFormFiller from "./pages/public/PublicFormFiller";
import AllTasksPage from "./pages/admin/AllTasksPage";
import BillingDashboard from "./pages/admin/billing/BillingDashboard";
import StudentLedgerPage from "./pages/admin/billing/StudentLedgerPage";
import AllStudentsPage from "./pages/admin/students/AllStudentsPage";
import StudentProfilePage from "./pages/admin/students/StudentProfilePage";
import RecurringPlansPage from "./pages/admin/billing/RecurringPlansPage";
import SubsidyAccountsPage from "./pages/admin/billing/SubsidyAccountsPage";
import MessageLogPage from "./pages/admin/administration/MessageLogPage";
import SubsidyDetailPage from "./pages/admin/billing/SubsidyDetailPage";
import ManageSuperAdmins from "./pages/admin/ManageSuperAdmins";
import ReportsPage from "./pages/admin/ReportsPage";

// Workspace boards
import BoardsPage from "./pages/admin/BoardsPage";
import BoardDetailPage from "./pages/admin/BoardDetailPage";
import InboxPage from "./pages/admin/InboxPage";
import DocsHubPage from "./pages/admin/DocsHubPage";
import WorkspaceLayout from "./components/admin/workspace/WorkspaceLayout";

function App() {
  return (
    <AuthProvider>
      <TimerProvider>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/superadmin" element={<SuperAdminSetup />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/admissions/apply" element={<AdmissionForm />} />
            <Route path="/enrollment/:token" element={<PublicEnrollmentForm />} />
            <Route path="/public/forms/:formId" element={<PublicFormFiller />} />
            <Route path="/setup-password" element={<SetupPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route element={<SuperAdminRoute />}>
                  <Route path="super-admins" element={<ManageSuperAdmins />} />
                  <Route path="departments" element={<ManageDepartments />} />
                  <Route path="staff" element={<ManageStaff />} />
                  <Route path="activity-feed" element={<ActivityFeedPage />} />
                </Route>
                <Route path="students" element={<AllStudentsPage />} />
                <Route
                  path="students/:studentId"
                  element={<StudentProfilePage />}
                />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<ProfilePage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="tasks" element={<AllTasksPage />} />
                
                {/* Workspace — shared sidebar layout */}
                <Route element={<WorkspaceLayout />}>
                  <Route path="boards" element={<BoardsPage />} />
                  <Route path="boards/:boardId" element={<BoardDetailPage />} />
                  <Route path="messaging" element={<MessagingPage />} />
                  <Route path="inbox" element={<InboxPage />} />
                  <Route path="docs" element={<DocsHubPage />} />
                </Route>
                <Route path="admissions" element={<AdmissionsDashboard />} />
                <Route path="admissions/leads" element={<LeadsListPage />} />
                <Route
                  path="admissions/leads/:token"
                  element={<LeadDetailPage />}
                />
                <Route path="accounting" element={<AccountingDashboard />} />
                <Route path="billing" element={<BillingDashboard />} />
                <Route
                  path="billing/accounts/:studentId"
                  element={<StudentLedgerPage />}
                />
                <Route
                  path="billing/recurring-plans"
                  element={<RecurringPlansPage />}
                />
                <Route
                  path="billing/subsidies"
                  element={<SubsidyAccountsPage />}
                />
                <Route
                  path="billing/subsidies/:subsidyId"
                  element={<SubsidyDetailPage />}
                />
                <Route path="enrollment" element={<EnrollmentDashboard />} />
                <Route
                  path="enrollment/forms/:formId"
                  element={<EnrollmentFormBuilder />}
                />
                <Route
                  path="administration"
                  element={<AdministrationDashboard />}
                />
                <Route
                  path="administration/message-log"
                  element={<MessageLogPage />}
                />
                <Route path="my-dashboard" element={<GenericDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TimerProvider>
    </AuthProvider>
  );
}

export default App;
