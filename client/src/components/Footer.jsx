import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-700 text-white p-4 mt-8 text-center">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} FinSync. All rights reserved.</p>
        <p>Your Personal Finance Tracker</p>
      </div>
    </footer>
  );
};

export default Footer;
