import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout.tsx";
import SignInForm from "../../components/auth/SignInForm";
import { useLocation, Navigate } from 'react-router';
import { useAuthContext } from '../../context/AuthContext';

export default function SignIn() {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();

  // Nếu đã đăng nhập, redirect về trang trước đó hoặc dashboard
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return (
    <>
      <PageMeta
        title="React.js SignIn Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js SignIn Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
