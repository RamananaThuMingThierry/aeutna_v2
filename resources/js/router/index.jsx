import React from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import PublicLayout from "../layouts/PublicLayout";
import ActivitiesPage from "../pages/admin/ActivitiesPage";
import AnnualFeesPage from "../pages/admin/AnnualFeesPage";
import AxesPage from "../pages/admin/AxesPage";
import ContactsAdminPage from "../pages/admin/ContactsAdminPage";
import DetailMemberPage from "../pages/admin/DetailMemberPage";
import EducationLevelsPage from "../pages/admin/EducationLevelsPage";
import FeePaymentsPage from "../pages/admin/FeePaymentsPage";
import FormActivityPage from "../pages/admin/FormActivityPage";
import FormMemberPage from "../pages/admin/FormMemberPage";
import FunctionsPage from "../pages/admin/FunctionsPage";
import GalleryAdminPage from "../pages/admin/GalleryAdminPage";
import MembersPage from "../pages/admin/MembersPage";
import MembershipCardsPage from "../pages/admin/MembershipCardsPage";
import RootLayout from "../layouts/RootLayout";
import SlidesPage from "../pages/admin/SlidesPage";
import ActivityLogPage from "../pages/admin/ActivityLogPage";
import DashboardPage from "../pages/admin/DashboardPage";
import UsersPage from "../pages/admin/UsersPage";
import ProfilePage from "../pages/account/ProfilePage";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ActivitiesPublicPage from "../pages/public/ActivitiesPublicPage";
import AboutPage from "../pages/public/AboutPage";
import BecomeMemberPage from "../pages/public/BecomeMemberPage";
import BureauPage from "../pages/public/BureauPage";
import ContactsPage from "../pages/public/ContactsPage";
import GalleryPage from "../pages/public/GalleryPage";
import HomePage from "../pages/public/HomePage";
import MemberApplicationsPage from "../pages/admin/MemberApplicationsPage";

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
            element: <HomePage />,
          },
          {
            path: "about",
            element: <AboutPage />,
          },
          {
            path: "gallery",
            element: <GalleryPage />,
          },
          {
            path: "bureau",
            element: <BureauPage />,
          },
          {
            path: "devenir-membre",
            element: <BecomeMemberPage />,
          },
          {
            path: "activities",
            element: <ActivitiesPublicPage />,
          },
          {
            path: "contacts",
            element: <ContactsPage />,
          },
          {
            path: "login",
            element: <Login />,
          },
          {
            path: "register",
            element: <Register />,
          },
          {
            path: "forgot-password",
            element: (
              <PlaceholderPage
                title="Mot de passe oublie"
                description="Flux a implementer cote API et frontend."
              />
            ),
          },
          {
            path: "verify-code",
            element: (
              <PlaceholderPage
                title="Verification code"
                description="Flux a implementer cote API et frontend."
              />
            ),
          },
          {
            path: "reset-password",
            element: (
              <PlaceholderPage
                title="Reinitialisation mot de passe"
                description="Flux a implementer cote API et frontend."
              />
            ),
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
            path: "members",
            element: <MembersPage />,
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
