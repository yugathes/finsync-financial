import React from 'react';
import { useSession } from '../hooks/useSession'; // Assuming useSession hook provides user info

const DashboardPage = () => {
  const { user } = useSession(); // Destructure user from useSession

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {user ? (
        <p>Welcome, {user.email}!</p>
      ) : (
        <p>Loading user data...</p>
      )}
      <p>This is a placeholder for the main dashboard content.</p>
      {/* Placeholder for IncomeSummary or other components */}
      {/* <IncomeSummary /> */}
    </div>
  );
};

export default DashboardPage;
