import { createBrowserRouter, Outlet } from "react-router";
import LandingPage from "./pages/LandingPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import ResultsPage from "./pages/ResultsPage";
import ChecklistPage from "./pages/ChecklistPage";
import FAQPage from "./pages/FAQPage";
import { BenefitsProvider } from "./context/BenefitsContext";

// Root layout component that wraps all routes with BenefitsProvider
function RootLayout() {
  return (
    <BenefitsProvider>
      <Outlet />
    </BenefitsProvider>
  );
}

// 404 Not Found component
function NotFound() {
  return <div className="min-h-screen bg-white p-20 text-center text-black dark:bg-slate-950 dark:text-slate-100">404 Not Found</div>;
}

// Create browser router with all routes
export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        path: "screener",
        Component: QuestionnairePage,
      },
      {
        path: "results",
        Component: ResultsPage,
      },
      {
        path: "checklist",
        Component: ChecklistPage,
      },
      {
        path: "faq",
        Component: FAQPage,
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
