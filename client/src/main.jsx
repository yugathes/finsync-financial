import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Assuming Tailwind CSS is set up here
import { AuthProvider } from './auth/AuthProvider';

// Retrieve Supabase URL and Key from environment variables
const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. ' +
    'Make sure you have VITE_REACT_APP_SUPABASE_URL and VITE_REACT_APP_SUPABASE_ANON_KEY in your .env file.'
  );
}


// Set environment variables for Supabase client (accessible via process.env in client.js)
// This is a common pattern for Create React App, but Vite uses import.meta.env.
// To make client.js work as is, we can set them on a global object or handle differently.
// For Vite, it's better to pass them directly or ensure client.js uses import.meta.env.

// Let's adjust supabase/client.js to use Vite's env variables directly.
// For now, this main.jsx will assume client.js can access them.
// If not, we'll need to modify client.js.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
