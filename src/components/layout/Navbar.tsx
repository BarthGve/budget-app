import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { CircleUserRound } from "lucide-react";

export function Navbar() {
  return (
    <nav className="w-full bg-white shadow-md p-4 flex justify-between items-center fixed top-0 z-50">
      <div className="text-2xl font-bold text-purple-600">
        <Link to="/">BudgetApp</Link>
      </div>
      <div>
        <Link to="/login">
          <Button
            variant="ghost"
            className="text-purple-600 hover:bg-purple-50 hover:text-purple-700"
          >
            Se connecter <CircleUserRound />
          </Button>
        </Link>
      </div>
    </nav>
  );
}
