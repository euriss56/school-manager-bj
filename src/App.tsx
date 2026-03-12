import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import RegisterSchool from "./pages/RegisterSchool";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInscriptions from "./pages/admin/AdminInscriptions";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminPaiements from "./pages/admin/AdminPaiements";
import AdminNotes from "./pages/admin/AdminNotes";
import AdminEmploisDuTemps from "./pages/admin/AdminEmploisDuTemps";
import AdminAbsences from "./pages/admin/AdminAbsences";
import AdminAnnonces from "./pages/admin/AdminAnnonces";
import AdminMessagerie from "./pages/admin/AdminMessagerie";
import AdminStatistiques from "./pages/admin/AdminStatistiques";
import AdminParametres from "./pages/admin/AdminParametres";

// Other role dashboards
import EnseignantDashboard from "./pages/enseignant/EnseignantDashboard";
import ParentDashboard from "./pages/parent/ParentDashboard";
import EtudiantDashboard from "./pages/etudiant/EtudiantDashboard";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/inscription-ecole" element={<RegisterSchool />} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="inscriptions" element={<AdminInscriptions />} />
              <Route path="classes" element={<AdminClasses />} />
              <Route path="paiements" element={<AdminPaiements />} />
              <Route path="notes" element={<AdminNotes />} />
              <Route path="emplois-du-temps" element={<AdminEmploisDuTemps />} />
              <Route path="absences" element={<AdminAbsences />} />
              <Route path="annonces" element={<AdminAnnonces />} />
              <Route path="messagerie" element={<AdminMessagerie />} />
              <Route path="statistiques" element={<AdminStatistiques />} />
              <Route path="parametres" element={<AdminParametres />} />
            </Route>

            {/* Enseignant routes */}
            <Route path="/enseignant" element={<ProtectedRoute allowedRoles={["enseignant"]}><EnseignantDashboard /></ProtectedRoute>} />

            {/* Parent routes */}
            <Route path="/parent" element={<ProtectedRoute allowedRoles={["parent"]}><ParentDashboard /></ProtectedRoute>} />

            {/* Etudiant routes */}
            <Route path="/etudiant" element={<ProtectedRoute allowedRoles={["etudiant"]}><EtudiantDashboard /></ProtectedRoute>} />

            {/* Super Admin routes */}
            <Route path="/superadmin" element={<ProtectedRoute allowedRoles={["superadmin"]}><SuperAdminDashboard /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
