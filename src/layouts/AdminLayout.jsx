// src/layouts/AdminLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <header>Admin Panel</header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
