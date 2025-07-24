import React from "react";
import { Routes, Route } from "react-router";
import AppLayout from "../layout/AppLayout.tsx";
import Home from "../pages/Dashboard/Home.tsx";

export default function AppRoutes(): React.ReactElement {
  return (
    <Routes>
      {/* Dashboard Layout */}
      <Route element={<AppLayout />}>
        <Route index path="/" element={<Home />} />
      </Route>
    </Routes>
  );
}
