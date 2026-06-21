const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const GoogleLoginButton = () => {
  const handleClick = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <button
      type="button"
      className="auth-button auth-button-google"
      onClick={handleClick}
    >
      Continuar con Google
    </button>
  );
};
