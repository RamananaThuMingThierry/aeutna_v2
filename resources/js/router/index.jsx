import React, { Suspense, lazy } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import PublicLayout from "../layouts/PublicLayout";
import ActivitiesPage from "../pages/admin/ActivitiesPage";
import ActivityLogPage from "../pages/admin/ActivityLogPage";
import AnnualFeesPage from "../pages/admin/AnnualFeesPage";
import AxesPage from "../pages/admin/AxesPage";
import BulkMessagesPage from "../pages/admin/BulkMessagesPage";
import CashCategoriesPage from "../pages/admin/CashCategoriesPage";
import CashTransactionsPage from "../pages/admin/CashTransactionsPage";
import ContactsAdminPage from "../pages/admin/ContactsAdminPage";
import DashboardPage from "../pages/admin/DashboardPage";
import DetailMemberPage from "../pages/admin/DetailMemberPage";
import DetailReportPage from "../pages/admin/DetailReportPage";
import DonationsPage from "../pages/admin/DonationsPage";
import DocumentsPage from "../pages/admin/DocumentsPage";
import EducationLevelsPage from "../pages/admin/EducationLevelsPage";
import FeePaymentsPage from "../pages/admin/FeePaymentsPage";
import FormActivityPage from "../pages/admin/FormActivityPage";
import FormMemberPage from "../pages/admin/FormMemberPage";
import FormReportPage from "../pages/admin/FormReportPage";
import FunctionsPage from "../pages/admin/FunctionsPage";
import GalleryAdminPage from "../pages/admin/GalleryAdminPage";
import MaterialLoansPage from "../pages/admin/MaterialLoansPage";
import MaterialMaintenancesPage from "../pages/admin/MaterialMaintenancesPage";
import MaterialMovementsPage from "../pages/admin/MaterialMovementsPage";
import MaterialsPage from "../pages/admin/MaterialsPage";
import MemberApplicationsPage from "../pages/admin/MemberApplicationsPage";
import MembersPage from "../pages/admin/MembersPage";
import MembershipCardsPage from "../pages/admin/MembershipCardsPage";
import ReportsPage from "../pages/admin/ReportsPage";
import ReportScanPage from "../pages/admin/ReportScanPage";
import SlidesPage from "../pages/admin/SlidesPage";
import SuppliersPage from "../pages/admin/SuppliersPage";
import StatutesPage from "../pages/admin/StatutesPage";
import UsersPage from "../pages/admin/UsersPage";
import RootLayout from "../layouts/RootLayout";

import ProfilePage from "../pages/account/ProfilePage";

const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const VerifyCode = lazy(() => import("../pages/auth/VerifyCode"));
const AboutPage = lazy(() => import("../pages/public/AboutPage"));
const ActivitiesPublicPage = lazy(() => import("../pages/public/ActivitiesPublicPage"));
const BecomeMemberPage = lazy(() => import("../pages/public/BecomeMemberPage"));
const BureauPage = lazy(() => import("../pages/public/BureauPage"));
const ContactsPage = lazy(() => import("../pages/public/ContactsPage"));
const GalleryPage = lazy(() => import("../pages/public/GalleryPage"));
const HomePage = lazy(() => import("../pages/public/HomePage"));

function PlaceholderPage({ title, description }) {
  return (
    <section style={{ padding: "2rem" }}>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function MemberShell() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

function withSuspense(element) {
  return (
    <Suspense fallback={<div className="container py-5">Chargement...</div>}>
      {element}
    </Suspense>
  );
}

function RoleRoute({ allow, children }) {
  const rawRoles = localStorage.getItem("roles");

  let roles = [];

  try {
    roles = JSON.parse(rawRoles || "[]");
  } catch {
    roles = [];
  }

  const normalizedRoles = Array.isArray(roles)
    ? roles.map((role) => (typeof role === "string" ? role : role?.code)).filter(Boolean)
    : [];

  const isAllowed = allow.some((role) => normalizedRoles.includes(role));

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "email/verify",
        element: (
          <PlaceholderPage
            title="Verification email"
            description="Cette page sera implemente plus tard."
          />
        ),
      },
      {
        path: "/",
        element: <PublicLayout />,
        children: [
          {
            index: true,
            element: withSuspense(<HomePage />),
          },
          {
            path: "about",
            element: withSuspense(<AboutPage />),
          },
          {
            path: "gallery",
            element: withSuspense(<GalleryPage />),
          },
          {
            path: "bureau",
            element: withSuspense(<BureauPage />),
          },
          {
            path: "devenir-membre",
            element: withSuspense(<BecomeMemberPage />),
          },
          {
            path: "activities",
            element: withSuspense(<ActivitiesPublicPage />),
          },
          {
            path: "contacts",
            element: withSuspense(<ContactsPage />),
          },
          {
            path: "login",
            element: withSuspense(<Login />),
          },
          {
            path: "register",
            element: withSuspense(<Register />),
          },
          {
            path: "forgot-password",
            element: withSuspense(<ForgotPassword />),
          },
          {
            path: "verify-code",
            element: withSuspense(<VerifyCode />),
          },
          {
            path: "reset-password",
            element: withSuspense(<ResetPassword />),
          },
        ],
      },
      {
        path: "/account",
        element: (
          <RoleRoute allow={["member", "bureau", "admin", "super_admin"]}>
            <MemberShell />
          </RoleRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/account/profile" replace />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
        ],
      },
      {
        path: "/admin",
        element: (
          <RoleRoute allow={["bureau", "admin", "super_admin"]}>
            <AdminLayout />
          </RoleRoute>
        ),
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "axes",
            element: <AxesPage />,
          },
          {
            path: "education-levels",
            element: <EducationLevelsPage />,
          },
          {
            path: "functions",
            element: <FunctionsPage />,
          },
          {
            path: "activities",
            element: <ActivitiesPage />,
          },
          {
            path: "statutes",
            element: <StatutesPage />,
          },
          {
            path: "documents",
            element: <DocumentsPage />,
          },
          {
            path: "reports",
            element: <ReportsPage />,
          },
          {
            path: "reports/new",
            element: <FormReportPage />,
          },
          {
            path: "reports/:encryptedId",
            element: <DetailReportPage />,
          },
          {
            path: "reports/:encryptedId/edit",
            element: <FormReportPage />,
          },
          {
            path: "reports/:encryptedId/scan",
            element: <ReportScanPage />,
          },
          {
            path: "activities/new",
            element: <FormActivityPage />,
          },
          {
            path: "activities/:encryptedId/edit",
            element: <FormActivityPage />,
          },
          {
            path: "annual-fees",
            element: <AnnualFeesPage />,
          },
          {
            path: "fee-payments",
            element: <FeePaymentsPage />,
          },
          {
            path: "donations",
            element: <DonationsPage />,
          },
          {
            path: "cash-categories",
            element: <CashCategoriesPage />,
          },
          {
            path: "cash-transactions",
            element: <CashTransactionsPage />,
          },
          {
            path: "materials",
            element: <MaterialsPage />,
          },
          {
            path: "material-loans",
            element: <MaterialLoansPage />,
          },
          {
            path: "suppliers",
            element: <SuppliersPage />,
          },
          {
            path: "material-maintenances",
            element: <MaterialMaintenancesPage />,
          },
          {
            path: "material-movements",
            element: <MaterialMovementsPage />,
          },
          {
            path: "members",
            element: <MembersPage />,
          },
          {
            path: "bulk-messages",
            element: <BulkMessagesPage />,
          },
          {
            path: "member-applications",
            element: <MemberApplicationsPage />,
          },
          {
            path: "membership-cards",
            element: <MembershipCardsPage />,
          },
          {
            path: "members/new",
            element: <FormMemberPage />,
          },
          {
            path: "members/:encryptedId",
            element: <DetailMemberPage />,
          },
          {
            path: "members/:encryptedId/edit",
            element: <FormMemberPage />,
          },
          {
            path: "categories",
            element: (
              <PlaceholderPage
                title="Categories"
                description="Module categories en attente d'implementation."
              />
            ),
          },
          {
            path: "categories/:encryptedId",
            element: (
              <PlaceholderPage
                title="Gestion categorie"
                description="Page detail categorie en attente d'implementation."
              />
            ),
          },
          {
            path: "categories/:encryptedId/edit",
            element: (
              <PlaceholderPage
                title="Edition categorie"
                description="Page edition categorie en attente d'implementation."
              />
            ),
          },
          {
            path: "testimonials",
            element: (
              <PlaceholderPage
                title="Testimonials"
                description="Module testimonials en attente d'implementation."
              />
            ),
          },
          {
            path: "gallery",
            element: <GalleryAdminPage />,
          },
          {
            path: "sliders",
            element: <SlidesPage />,
          },
          {
            path: "users",
            element: <UsersPage />,
          },
          {
            path: "account/profile",
            element: <ProfilePage embedded />,
          },
          {
            path: "contacts",
            element: <ContactsAdminPage />,
          },
          {
            path: "notifications",
            element: (
              <PlaceholderPage
                title="Notifications"
                description="Module notifications en attente d'implementation."
              />
            ),
          },
          {
            path: "activity-logs",
            element: <ActivityLogPage />,
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
