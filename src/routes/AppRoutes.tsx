import React from "react";
import { Routes, Route } from "react-router";
import AppLayout from "../layout/AppLayout.tsx";
import SignIn from "../pages/AuthPages/SignIn";
import Home from "../pages/Dashboard/Home.tsx";
import Permission from "../pages/Dashboard/Permission.tsx";
import Role from "../pages/Dashboard/Role.tsx";
import Chat from "../pages/Dashboard/Chat.tsx";
import ProtectedRoute from "../components/common/ProtectedRoute";

export default function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      {/* Protected Dashboard Routes */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index path="/" element={<Home />} />
        <Route path="/permission" element={<Permission />} />
        <Route path="/role" element={<Role />} />
        <Route path="/chat" element={<Chat />} />
      </Route>

      {/* Public Auth Routes */}
      <Route path="/signin" element={<SignIn />} />
    </Routes>
  );
}
