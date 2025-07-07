import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { session, signOut } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto flex justify-between items-center px-4 py-4">
        <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition-colors">
          FinSync
        </Link>
        <nav>
          <ul className="flex space-x-4 items-center">
            {session ? (
              <>
                <li>
                  <Link 
                    to="/dashboard" 
                    className="hover:text-blue-200 transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <span className="text-blue-200 text-sm">
                    {session.user?.email}
                  </span>
                </li>
                <li>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    Logout
                  </Button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link 
                    to="/login" 
                    className="hover:text-blue-200 transition-colors font-medium"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/register" 
                    className="hover:text-blue-200 transition-colors font-medium"
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;