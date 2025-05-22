
import { lazy } from "react";
import { Outlet } from "react-router-dom";
import { AuthRequired } from "@/components/auth-required";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Note: This file is not currently used by the application
// All routing is handled in App.tsx

// This is kept for reference purposes
const exampleRoutes = [
  {
    path: "/",
    element: (
      <AuthRequired>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </AuthRequired>
    ),
    children: [
      { index: true, element: <div>Home</div> },
      { path: "example", element: <div>Example</div> },
    ]
  }
];

export const routes = exampleRoutes;
