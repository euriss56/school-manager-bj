import { GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-6 h-6 text-secondary" />
              <span className="text-lg font-bold font-sans">SchoolManager</span>
            </div>
            <p className="text-sm opacity-80">
              Le logiciel de gestion scolaire conçu pour les établissements du Bénin.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 font-sans">Produit</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#fonctionnalites" className="hover:opacity-100">Fonctionnalités</a></li>
              <li><a href="#tarifs" className="hover:opacity-100">Tarifs</a></li>
              <li><a href="#faq" className="hover:opacity-100">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 font-sans">Contact</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>contact@schoolmanager.bj</li>
              <li>+229 97 00 00 00</li>
              <li>Cotonou, Bénin</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 font-sans">Légal</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="#" className="hover:opacity-100">Mentions légales</a></li>
              <li><a href="#" className="hover:opacity-100">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:opacity-100">CGU</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-60">
          © 2025 SchoolManager. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
