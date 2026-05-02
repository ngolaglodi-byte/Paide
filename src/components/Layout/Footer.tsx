import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-official">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-dark font-bold text-xl">P</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">PAIDE</h3>
                <p className="text-secondary text-sm">Programme d'Appui aux Initiatives de Développement de l'Enfant</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Ministère de la Formation Professionnelle, Arts et Métiers - République Démocratique du Congo.
              Former pour transformer l'avenir de nos enfants.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-secondary hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-secondary hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-secondary hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-secondary hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/mission" className="text-gray-300 hover:text-secondary transition-colors">
                  Mission & Objectifs
                </Link>
              </li>
              <li>
                <Link to="/formations" className="text-gray-300 hover:text-secondary transition-colors">
                  Formations
                </Link>
              </li>
              <li>
                <Link to="/centres" className="text-gray-300 hover:text-secondary transition-colors">
                  Centres PAIDE
                </Link>
              </li>
              <li>
                <Link to="/public-cible" className="text-gray-300 hover:text-secondary transition-colors">
                  Public Cible
                </Link>
              </li>
              <li>
                <Link to="/partenaires" className="text-gray-300 hover:text-secondary transition-colors">
                  Nos Partenaires
                </Link>
              </li>
              <li>
                <Link to="/actualites" className="text-gray-300 hover:text-secondary transition-colors">
                  Actualités
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm">Siège Social</p>
                  <p className="text-white">Avenue des Cliniques</p>
                  <p className="text-white">Kinshasa, RDC</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-secondary flex-shrink-0" />
                <div>
                  <p className="text-white">+243 81 234 5678</p>
                  <p className="text-white">+243 99 876 5432</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-secondary flex-shrink-0" />
                <div>
                  <p className="text-white">info@paide.cd</p>
                  <p className="text-white">contact@paide.cd</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Séparateur et copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 PAIDE - Ministère de la Formation Professionnelle, Arts et Métiers. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/contact" className="text-gray-400 hover:text-secondary text-sm transition-colors">
                Nous contacter
              </Link>
              <Link to="/login" className="text-gray-400 hover:text-secondary text-sm transition-colors">
                Espace Interne
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}