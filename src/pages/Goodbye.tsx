import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

function Goodbye() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 text-gray-900 p-4 text-center">
      <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-4 animate-fade-in-down">
        Au revoir !
      </h1>
      <p className="text-xl md:text-2xl text-gray-700 mb-8 animate-fade-in-up">
        Nous sommes tristes de vous voir partir, mais nous espérons vous revoir
        très vite !
      </p>
      <Link to="/">
        <Button
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Retour à la page d'accueil
        </Button>
      </Link>
    </div>
  );
}

export default Goodbye;
