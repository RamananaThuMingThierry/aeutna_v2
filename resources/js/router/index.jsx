import React from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";

import AdminLayout from "../layouts/AdminLayout";
import RootLayout from "../layouts/RootLayout";
import DashboardPage from "../pages/admin/DashboardPage";
import UsersPage from "../pages/admin/UsersPage";
import ProfilePage from "../pages/account/ProfilePage";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

function PlaceholderPage({ title, description }) {
  return (
    <section style={{ padding: "2rem" }}>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function PublicShell() {
  return (
    <div>
      <Outlet />
    </div>
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
        element: <PublicShell />,
        children: [
          {
            index: true,
            element: (
              <PlaceholderPage
                title="Accueil"
                description="Point d'entree public du frontend."
              />
            ),
          },
          {
            path: "about",
            element: (
              <PlaceholderPage
                title="A propos"
                description="Page publique en attente d'implementation."
              />
            ),
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
            element: (
              <PlaceholderPage
                title="Galerie"
                description="Module galerie en attente d'implementation."
              />
            ),
          },
          {
            path: "reservations",
            element: (
              <PlaceholderPage
                title="Reservations"
                description="Module reservations en attente d'implementation."
              />
            ),
          },
          {
            path: "sliders",
            element: (
              <PlaceholderPage
                title="Sliders"
                description="Module sliders en attente d'implementation."
              />
            ),
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
            element: (
              <PlaceholderPage
                title="Contacts"
                description="Module contacts en attente d'implementation."
              />
            ),
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
            element: (
              <PlaceholderPage
                title="Activity logs"
                description="Journal d'activite en attente d'implementation."
              />
            ),
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
