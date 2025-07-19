import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { 
  DollarSign, 
  Users, 
  Shield, 
  BarChart3,
  CheckCircle
} from "lucide-react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import CGU from "./pages/CGU";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import Contact from "./pages/Contact";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UpdatePassword from "./pages/UpdatePassword";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Goodbye from "./pages/Goodbye";
import { Toaster } from "./components/ui/sonner";

function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-gray-900">
            Gérez votre budget,
            <br />
            <span className="text-purple-600">ensemble.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            L'application collaborative qui simplifie la gestion de vos finances personnelles.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-medium transition-colors"
              >
                Commencer gratuitement
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-medium"
            >
              Voir la démo
            </Button>
          </div>

          {/* Simple trust indicators */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Gratuit</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Collaboratif</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Fonctionnalités principales
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tout ce dont vous avez besoin pour gérer vos finances efficacement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Suivi des dépenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Enregistrez et catégorisez facilement toutes vos dépenses pour une vue d'ensemble claire.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Collaboration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Partagez vos budgets avec votre famille et gérez vos finances à plusieurs en temps réel.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Analyses et rapports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Obtenez des insights détaillés pour prendre des décisions financières éclairées.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez comment BudgetApp améliore la vie financière de nos utilisateurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="p-6 bg-white border border-gray-200">
              <CardContent className="pt-6">
                <p className="text-gray-700 mb-6 italic">
                  "Enfin une app qui permet à toute la famille de suivre le budget ensemble. 
                  Plus de disputes sur les dépenses, tout est transparent !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">ML</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Marie L.</div>
                    <div className="text-sm text-gray-500">Mère de famille</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="p-6 bg-white border border-gray-200">
              <CardContent className="pt-6">
                <p className="text-gray-700 mb-6 italic">
                  "Super simple à utiliser, même pour quelqu'un comme moi qui n'aime pas 
                  la paperasse. Je vois enfin où va mon argent !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">TD</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Thomas D.</div>
                    <div className="text-sm text-gray-500">Freelance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="p-6 bg-white border border-gray-200">
              <CardContent className="pt-6">
                <p className="text-gray-700 mb-6 italic">
                  "On a économisé 300€ par mois depuis qu'on utilise BudgetApp. 
                  La collaboration en temps réel change tout !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">SA</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sophie & Alex</div>
                    <div className="text-sm text-gray-500">Couple</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Prêt à reprendre le contrôle de vos finances ?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'utilisateurs qui ont déjà simplifié leur gestion budgétaire.
          </p>
          <Link to="/register">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-medium"
            >
              Commencer maintenant
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            Gratuit • Sans engagement • Configuration en 2 minutes
          </p>
        </div>
      </section>
    </>
  );
}

function App() {
  const location = useLocation();
  const showNavAndFooter =
    !location.pathname.startsWith("/dashboard") &&
    !location.pathname.startsWith("/admin-dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 text-gray-900">
      {showNavAndFooter && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cgu" element={<CGU />} />
        <Route
          path="/politique-confidentialite"
          element={<PolitiqueConfidentialite />}
        />
        <Route path="/contact" element={<Contact />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
        <Route path="/goodbye" element={<Goodbye />} />
      </Routes>
      {showNavAndFooter && <Footer />}
      <Toaster />
    </div>
  );
}

export default App;
