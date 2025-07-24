import { BrowserRouter as Router } from "react-router";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppRoutes from "./routes/AppRoutes.tsx";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
    </>
  );
}
