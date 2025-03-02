import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Menu, X, Zap } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-dark-800 border-b border-dark-600 fixed w-full z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <Zap className="h-8 w-8 text-glow-purple animate-glow-pulse" />
                <span className="ml-2 text-xl font-bold text-white glow-text">AI Agent MPC Hub</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className="border-glow-purple text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:text-glow-purple transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/integrations"
                    className="border-transparent text-gray-300 hover:text-white hover:border-glow-blue inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                  >
                    Integrations
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center">
                <span className="text-sm text-gray-300 mr-4">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-glow-purple text-white hover:bg-purple-700 px-3 py-2 rounded-md text-sm font-medium shadow-glow-sm hover:shadow-glow-md transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-glow-purple"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-dark-800">
          <div className="pt-2 pb-3 space-y-1">
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="bg-dark-700 border-l-4 border-glow-purple text-white block pl-3 pr-4 py-2 text-base font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/integrations"
                  className="border-transparent text-gray-300 hover:bg-dark-700 hover:border-glow-blue hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                >
                  Integrations
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-dark-600">
            {user ? (
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-glow-purple bg-opacity-20 flex items-center justify-center shadow-glow-sm">
                    <span className="text-white font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-auto flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-glow-purple"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 px-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-glow-purple text-white hover:bg-purple-700 px-3 py-2 rounded-md text-base font-medium text-center shadow-glow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;