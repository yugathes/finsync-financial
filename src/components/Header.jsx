import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

const Header = () => {
  const { session, signOut } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold hover:text-gray-300">
          FinSync
        </Link>
        <nav>
          <ul className="flex space-x-4">
            {session ? (
              <>
                <li>
                  <Link to="/dashboard" className="hover:text-gray-300">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="hover:text-gray-300">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-gray-300">
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
