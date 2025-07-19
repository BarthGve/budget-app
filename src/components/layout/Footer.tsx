export function Footer() {
  return (
    <footer className="w-full bg-gray-800 text-white p-8 text-center">
      <div className="max-w-6xl mx-auto">
        <p className="text-lg mb-4">
          &copy; {new Date().getFullYear()} BudgetApp. Tous droits réservés.
        </p>
        <div className="flex justify-center space-x-6 mb-4">
          <a href="/cgu" className="hover:text-purple-400 transition-colors duration-300">Conditions Générales d'Utilisation</a>
          <a href="/politique-confidentialite" className="hover:text-purple-400 transition-colors duration-300">Politique de confidentialité</a>
          <a href="/contact" className="hover:text-purple-400 transition-colors duration-300">Contact</a>
        </div>
        <p className="text-sm text-gray-400">
          Conçu avec passion pour vous aider à gérer vos finances.
        </p>
      </div>
    </footer>
  );
}
