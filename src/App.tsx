import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRoute from "@/components/RoleRoute";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { MainLayout } from "@/layouts/MainLayout";
import { InstitutionalLayout } from "@/layouts/InstitutionalLayout";
import { ProfessionalLayout } from "@/layouts/ProfessionalLayout";
import { DashboardPage } from "@/pages/institution/DashboardPage";
import { StudentsPage } from "@/pages/institution/StudentsPage";
import { AcademicPage } from "@/pages/institution/AcademicPage";
import { FacultyPage } from "@/pages/institution/FacultyPage";
import { FinancePage } from "@/pages/institution/FinancePage";
import { CommunicationPage } from "@/pages/institution/CommunicationPage";
import { SettingsPage } from "@/pages/institution/SettingsPage";

//==========================
// Título : Rotas lazy — públicas
//==========================
const Jornada = lazy(() => import("@/pages/public/Jornada"));
const Planos = lazy(() => import("@/pages/public/Planos"));
// [MVP-EXCLUÍDO Sprint 4+] const Marketplace = lazy(() => import("@/pages/public/Marketplace"));
const Sobre = lazy(() => import("@/pages/public/Sobre"));
const Contato = lazy(() => import("@/pages/public/Contato"));
const FAQ = lazy(() => import("@/pages/public/FAQ"));
// [MVP-EXCLUÍDO Sprint 4+] const Blog = lazy(() => import("@/pages/public/Blog"));
// [MVP-EXCLUÍDO Sprint 4+] const BlogPostDetail = lazy(() => import("@/pages/public/BlogPostDetail"));
const Instituicoes = lazy(() => import("@/pages/public/Instituicoes"));
const Editais = lazy(() => import("@/pages/public/Editais"));
const Profissionais = lazy(() => import("@/pages/public/Profissionais"));
// [MVP-EXCLUÍDO Sprint 4+] const Cursos = lazy(() => import("@/pages/public/Cursos"));

//==========================
// Título : Rotas lazy — autenticação
//==========================
const Auth = lazy(() => import("@/features/auth/pages/Auth"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const UpdatePassword = lazy(() => import("@/pages/auth/UpdatePassword"));
const LinkAccountPage = lazy(() => import("@/pages/auth/LinkAccount"));
const AcceptInvitation = lazy(() => import("@/pages/auth/AcceptInvitation"));

//==========================
// Título : Rotas lazy — aluno
//==========================
const StudentDashboard = lazy(() => import("@/pages/student/StudentDashboard"));
const StudentCoursePlayer = lazy(() => import("@/pages/student/StudentCoursePlayer"));
// [MVP-EXCLUÍDO sem ticket ativo] const Busca = lazy(() => import("@/pages/student/Busca"));
// [MVP-EXCLUÍDO sem ticket ativo] const BuscaMentores = lazy(() => import("@/pages/student/BuscaMentores"));

//==========================
// Título : Rotas lazy — professor
//==========================
const ProfessionalDashboard = lazy(() => import("@/pages/professional/ProfessionalDashboard"));
const ManageCourse = lazy(() => import("@/pages/professional/ManageCourse"));
const ProfessorClassManager = lazy(() => import("@/pages/professional/ClassManager"));

//==========================
// Título : Rotas lazy — instituição e portal
//==========================
const Portal = lazy(() => import("@/features/portal/pages/Portal"));
// [MVP-EXCLUÍDO Sprint 4+] const ProfessionalBlogDashboard = lazy(() => import("@/features/blog/pages/ProfessionalBlogDashboard"));
// [MVP-EXCLUÍDO Sprint 4+] const InstitutionalBlogDashboard = lazy(() => import("@/features/blog/pages/InstitutionalBlogDashboard"));
const SmartBulkImport = lazy(() => import("@/pages/institution/SmartBulkImport"));

//==========================
// Título : Rotas lazy — CPA
//==========================
const CPADashboard = lazy(() => import("@/pages/CPA/CPADashboard"));
const QuestionnaireBuilder = lazy(() => import("@/pages/CPA/QuestionnaireBuilder"));
const QuestionnaireResponse = lazy(() => import("@/pages/CPA/QuestionnaireResponse"));
const Results = lazy(() => import("@/pages/CPA/Results"));
const Commissions = lazy(() => import("@/pages/CPA/Commissions"));

// Social (fora do MVP)
// const Social = lazy(() => import("@/pages/social/Social"));
// const Chat = lazy(() => import("@/pages/social/Chat"));
// const Gamification = lazy(() => import("@/pages/social/Gamification"));

//==========================
// Título : Rotas lazy — perfil e legal
//==========================
const Profile = lazy(() => import("@/pages/profile/Profile"));
const Settings = lazy(() => import("@/pages/profile/Settings"));
// [MVP-EXCLUÍDO sem ticket ativo] const Calendario = lazy(() => import("@/pages/profile/Calendario"));

const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("@/pages/legal/TermsOfUse"));
const LGPD = lazy(() => import("@/pages/legal/LGPD"));

//==========================
// Título : Rotas lazy — onboarding e utilitários
//==========================
const OnboardingWizard = lazy(() => import("@/pages/onboarding/OnboardingWizard"));
const PaymentSuccess = lazy(() => import("@/pages/utility/PaymentSuccess"));


const PortalRouter = lazy(() => import("@/pages/utility/PortalRouter"));
const Refresh = lazy(() => import("@/pages/utility/Refresh"));
const ThankYou = lazy(() => import('@/pages/utility/ThankYou'));
const NotFound = lazy(() => import("@/pages/utility/NotFound"));
const HomePageWrapper = lazy(() => import("@/pages/HomePageWrapper"));

//==========================
// Título : Rotas lazy — admin
//==========================
const ManagementLayout = lazy(() => import("@/components/admin/ManagementLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const ProfileManagement = lazy(() => import("@/pages/admin/ProfileManagement"));
const UsersManagement = lazy(() => import("@/pages/admin/UsersManagement"));
const InstitutionsManagement = lazy(() => import("@/pages/admin/InstitutionsManagement"));
const PlansManagement = lazy(() => import("@/pages/admin/PlansManagement"));
const ModerationQueue = lazy(() => import("@/pages/admin/ModerationQueue"));
const AuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const FamilyDashboard = lazy(() => import("@/pages/family/FamilyDashboard"));
const IncidentManagement = lazy(() => import("@/pages/admin/IncidentManagement"));
const AdminFinance = lazy(() => import("@/pages/admin/AdminFinance"));
const EdictsManagement = lazy(() => import("@/pages/admin/EdictsManagement"));
const MassCommunication = lazy(() => import("@/pages/admin/MassCommunication"));
const ImportMonitor = lazy(() => import("@/pages/admin/ImportMonitor"));

const SentryRoutes = Sentry.withSentryRouting(Routes);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <ErrorBoundary>
      <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
        <SentryRoutes>
          {/* Routes wrapped in Main Layout (Navbar + Footer) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePageWrapper />} />
            <Route path="/jornada" element={<Jornada />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/contato" element={<Contato />} />
            {/* [MVP-EXCLUÍDO Sprint 4+] <Route path="/marketplace" element={<Marketplace />} /> */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/perfil/:id?" element={<Profile />} />
              <Route path="/instituicoes" element={<Instituicoes />} />
              <Route path="/editais" element={<Editais />} />
              <Route path="/profissionais" element={<Profissionais />} />
              {/* [MVP-EXCLUÍDO sem ticket ativo] <Route path="/mentores" element={<BuscaMentores />} /> */}
              <Route path="/portal/cpa" element={<CPADashboard />} />
              <Route path="/questionnaire/builder/:id" element={<QuestionnaireBuilder />} />
              <Route path="/portal/cpa/results/:questionnaireId" element={<Results />} />
              <Route path="/portal/cpa/commissions" element={<Commissions />} />
              {/* [MVP-EXCLUÍDO sem ticket ativo] <Route path="/social" element={<Social />} /> */}
              {/* [MVP-EXCLUÍDO sem ticket ativo] <Route path="/chat" element={<Chat />} /> */}
              {/* [MVP-EXCLUÍDO sem ticket ativo] <Route path="/gamification" element={<Gamification />} /> */}
              <Route path="/portal/setup" element={<OnboardingWizard />} />
              <Route path="/portal" element={<PortalRouter />} />



              {/* Student Portal — profile_type: personal */}
              <Route element={<RoleRoute allowedRoles={["personal"]} redirectTo="/portal" />}>
                <Route path="/portal/student" element={<StudentDashboard />} />
                <Route path="/portal/student/courses/:courseId" element={<StudentCoursePlayer />} />
                <Route path="/portal/student/courses/:courseId/lesson/:lessonId" element={<StudentCoursePlayer />} />
              </Route>

              {/* Family Portal */}
              <Route element={<RoleRoute allowedRoles={["family"]} redirectTo="/portal" />}>
                <Route path="/portal/family" element={<FamilyDashboard />} />
              </Route>

              {/* Professional Portal — profile_type: professional */}
              <Route element={<RoleRoute allowedRoles={["professional"]} redirectTo="/portal" />}>
                <Route path="/portal/professional" element={<ProfessionalLayout />}>
                  <Route index element={<ProfessionalDashboard />} />
                  {/* [MVP-EXCLUÍDO Sprint 4+] <Route path="blog" element={<ProfessionalBlogDashboard />} /> */}
                  <Route path="classes/:classId" element={<ProfessorClassManager />} />
                </Route>
                <Route path="/portal/professional/courses/:courseId/manage" element={<ManageCourse />} />
              </Route>

              {/* Institutional Portal — profile_type: institutional */}
              <Route element={<RoleRoute allowedRoles={["institutional"]} redirectTo="/portal" />}>
                <Route path="/portal/institutional" element={<InstitutionalLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="students" element={<StudentsPage />} />
                  <Route path="academic" element={<AcademicPage />} />
                  <Route path="faculty" element={<FacultyPage />} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="communication" element={<CommunicationPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* [MVP-EXCLUÍDO sem ticket ativo] <Route path="/calendario" element={<Calendario />} /> */}

              {/* Institutional-only bulk import */}
              <Route element={<RoleRoute allowedRoles={["institutional", "admin"]} redirectTo="/portal" />}>
                <Route path="/dashboard/upload-students" element={<SmartBulkImport />} />
                <Route path="/dashboard/upload-history" element={<SmartBulkImport />} />
              </Route>
              <Route path="/settings" element={<Settings />} />
              <Route path="/link-account" element={<LinkAccountPage />} />
              <Route path="/invitation/:institution_id" element={<AcceptInvitation />} />
            </Route>


            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos-de-uso" element={<TermsOfUse />} />
            <Route path="/lgpd" element={<LGPD />} />
            {/* [MVP-EXCLUÍDO sem ticket ativo] <Route path="/busca" element={<Busca />} /> */}
            <Route path="/faq" element={<FAQ />} />
            {/* [MVP-EXCLUÍDO Sprint 4+] <Route path="/blog" element={<Blog />} /> */}
            {/* [MVP-EXCLUÍDO Sprint 4+] <Route path="/blog/:slug" element={<BlogPostDetail />} /> */}
            <Route path="/questionnaire/:id" element={<QuestionnaireResponse />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            {/* [MVP-EXCLUÍDO Sprint 4+] <Route path="/course/:courseId" element={<Cursos />} /> */}
            <Route path="/refresh" element={<Refresh />} />
          </Route>


          {/* Admin: só profile_type admin */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={["admin"]} redirectTo="/" />}>
              <Route path="/admin" element={<ManagementLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="profiles" element={<ProfileManagement />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="institutions" element={<InstitutionsManagement />} />
                <Route path="plans" element={<PlansManagement />} />
                <Route path="moderation" element={<ModerationQueue />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="incidents" element={<IncidentManagement />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="edicts" element={<EdictsManagement />} />
                <Route path="communication" element={<MassCommunication />} />
                <Route path="imports" element={<ImportMonitor />} />
              </Route>
            </Route>
          </Route>

          {/* 404: por último */}
          <Route path="*" element={<NotFound />} />



        </SentryRoutes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
