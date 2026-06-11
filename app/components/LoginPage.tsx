import { useState } from "react";
import { Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import campusLogo from "../../imports/KJUSYS2-1.png";

interface LoginPageProps {
  onLogin: (mode: "student" | "admin") => void;
  onBack: () => void;
}

export default function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [emailError, setEmailError]       = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword]   = useState(false);

  const validateEmailField = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return "Email Address is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return "Enter a valid email format.";
    return "";
  };

  const validatePasswordField = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return "Password is required.";
    if (trimmed.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmailField(email);
    const passwordErr = validatePasswordField(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      const firstInvalidId = emailErr ? "email-input" : "password-input";
      const el = document.getElementById(firstInvalidId);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    setError("");
    if (trimmedEmail === "admin@campus.edu" && trimmedPassword === "admin123") {
      onLogin("admin");
      return;
    }
    setError("Invalid admin credentials. Please try again.");
  };

  const getEmailInputCls = () => {
    if (emailError) {
      return "w-full pl-11 pr-4 py-3 text-sm bg-white border border-red-500 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-[0_0_0_2px_rgba(239,68,68,0.2)]";
    }
    return "w-full pl-11 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all";
  };

  const getPasswordInputCls = () => {
    if (passwordError) {
      return "w-full pl-11 pr-11 py-3 text-sm bg-white border border-red-500 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all shadow-[0_0_0_2px_rgba(239,68,68,0.2)]";
    }
    return "w-full pl-11 pr-11 py-3 text-sm bg-white border border-gray-200 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all";
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f4f8" }}>
      {/* Back to Home — outside the card */}
      <div className="px-8 pt-7 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm transition-colors"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-start justify-center px-4 pt-6 pb-12">
        <div
          className="w-full overflow-hidden"
          style={{
            maxWidth: 520,
            borderRadius: 20,
            boxShadow: "0 8px 40px #0000001a, 0 2px 12px #00000010",
            background: "linear-gradient(160deg, #cef3f8 0%, #e8fafc 18%, #ffffff 45%)",
          }}
        >
          {/* Inner padded content */}
          <div className="px-10 pt-12 pb-10">
            {/* Logo — centered */}
            <div className="flex justify-center mb-8">
              <img
                src={campusLogo}
                alt="Kristu Jayanti University"
                className="h-12 object-contain"
              />
            </div>

            {/* Heading */}
            <div className="text-center mb-7">
              <h1
                className="text-gray-900 mb-1"
                style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.01em" }}
              >
                Admin Login
              </h1>
              <p className="text-gray-500 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                Sign in to access the admin dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  className="block text-sm text-gray-800 mb-2"
                  style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email-input"
                    type="text"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setEmailError("");
                      setError("");
                    }}
                    onBlur={() => setEmailError(validateEmailField(email))}
                    placeholder="Enter your email"
                    className={getEmailInputCls()}
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  />
                </div>
                {emailError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1 pl-2 font-medium" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    <AlertCircle size={12} className="shrink-0" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-sm text-gray-800 mb-2"
                  style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setPasswordError("");
                      setError("");
                    }}
                    onBlur={() => setPasswordError(validatePasswordField(password))}
                    placeholder="Enter your password"
                    className={getPasswordInputCls()}
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    title={showPassword ? "Hide Password" : "Show Password"}
                    aria-label={showPassword ? "Hide Password" : "Show Password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full transition-colors duration-150 hover:bg-cyan-50 active:scale-90"
                    style={{ color: showPassword ? "#0891b2" : "#64748b" }}
                  >
                    {showPassword
                      ? <Eye size={17} />
                      : <EyeOff size={17} />
                    }
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1 pl-2 font-medium" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    <AlertCircle size={12} className="shrink-0" />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Sign In button */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3 rounded-full text-white text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "#0891b2", fontFamily: "DM Sans, sans-serif", fontSize: "0.95rem" }}
                >
                  Sign In
                </button>
              </div>
            </form>

            {/* Credentials hint / Validation / Error */}
            <div
              className="mt-6 rounded-2xl p-4"
              style={
                error
                  ? { background: "#fff1f2", border: "1px solid #fecdd3" }
                  : { background: "#f0f9ff", border: "1px solid #e0f2fe" }
              }
            >
              {error ? (
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700" style={{ fontFamily: "DM Sans, sans-serif" }}>{error}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  <span className="font-bold text-gray-800">Admin Credentials:</span><br />
                  Email: admin@campus.edu<br />
                  Password: admin123
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
