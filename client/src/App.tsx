import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import LowStock from "./pages/LowStock";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import PointOfSale from "./pages/PointOfSale";
import CashClosing from "./pages/CashClosing";
import ScalePluManagement from "./pages/ScalePluManagement";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";

function ProtectedPage({ children }: { children: React.ReactNode }) { return <DashboardLayout>{children}</DashboardLayout>; }
function Router() { return <Switch><Route path="/login" component={Login} /><Route path="/"><ProtectedPage><Dashboard /></ProtectedPage></Route><Route path="/produtos"><ProtectedPage><Products /></ProtectedPage></Route><Route path="/plus"><ProtectedPage><ScalePluManagement /></ProtectedPage></Route><Route path="/estoque"><ProtectedPage><LowStock /></ProtectedPage></Route><Route path="/fechamento"><ProtectedPage><CashClosing /></ProtectedPage></Route><Route path="/pdv"><ProtectedPage><PointOfSale /></ProtectedPage></Route><Route path="/usuarios"><ProtectedPage><UserManagement /></ProtectedPage></Route><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
