import { GoogleIcon } from "../icons/GoogleIcon";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface GoogleLoginButtonProps {
  label?: string;
}

export const GoogleLoginButton = ({
  label = "Continuar con Google",
}: GoogleLoginButtonProps) => {
  const handleClick = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <button type="button" className="auth-button-google" onClick={handleClick}>
      <GoogleIcon />
      <span>{label}</span>
    </button>
  );
};
