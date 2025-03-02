import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-gray-100">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default Layout;