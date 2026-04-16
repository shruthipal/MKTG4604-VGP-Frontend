import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/business",
    Component: BusinessDashboard,
  },
  {
    path: "/buyer",
    Component: BuyerDashboard,
  },
]);
