import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const hacerLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (email.trim() === "" || password.trim() === "") {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome!');
      navigate("/home");
    } catch (error) {
      setError(error.message || 'Login error. Please try again.');
      toast.error(error.message || 'Login error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          height: 100vh;
          width: 100vw;
          font-family: 'Lato', sans-serif;
          overflow: hidden;
        }

        /* ── PANEL IZQUIERDO ── */
        .login-left {
          width: 52%;
          background: #1a5490;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 48px 32px;
        }

        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.07) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.18) 0%, transparent 55%);
        }

        .login-left::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .left-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: fadeSlideUp 0.8s ease both;
          width: 100%;
        }

        .logo-wrap {
          width: 80%;
          max-width: 100px;
          overflow: hidden;
          display: flex;
          justify-content: flex-start;
          margin-bottom: 28px;
        }

        .church-logo {
          width: 105%;
          height: auto;
          filter: brightness(0) invert(1);
          display: block;
        }

        .church-name {
          font-family: 'Cinzel', serif;
          font-size: 40px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 2px;
          line-height: 1.2;
          margin-bottom: 12px;
          text-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }

        .church-subtitle {
          font-family: 'Lato', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: rgba(255,255,255,0.75);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 48px;
        }

        .divider-left {
          width: 60px;
          height: 2px;
          background: rgba(255,255,255,0.35);
          margin-bottom: 40px;
        }

        .verse {
          font-family: 'Lato', sans-serif;
          font-size: 14px;
          font-style: italic;
          color: rgba(255,255,255,0.65);
          max-width: 420px;
          line-height: 1.8;
        }

        .verse span {
          display: block;
          margin-top: 10px;
          font-style: normal;
          font-weight: 700;
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          letter-spacing: 1px;
        }

        .geo-tl, .geo-br {
          position: absolute;
          width: 220px;
          height: 220px;
          border: 1.5px solid rgba(255,255,255,0.10);
          border-radius: 50%;
          z-index: 1;
        }
        .geo-tl { top: -80px; left: -80px; }
        .geo-br { bottom: -80px; right: -80px; }

        /* ── PANEL DERECHO ── */
        .login-right {
          width: 48%;
          background: #f8f9fc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px 64px;
          position: relative;
        }

        .login-right::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #1a5490 0%, #2a72b8 50%, #1a5490 100%);
        }

        .form-wrapper {
          width: 100%;
          max-width: 380px;
          animation: fadeSlideUp 0.9s 0.1s ease both;
        }

        .form-greeting {
          font-family: 'Cinzel', serif;
          font-size: 28px;
          font-weight: 600;
          color: #1a2d5a;
          margin-bottom: 6px;
        }

        .form-desc {
          font-size: 13px;
          color: #8a97b0;
          margin-bottom: 36px;
          letter-spacing: 0.3px;
        }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #5a6a85;
          margin-bottom: 8px;
        }

        .field-wrap {
          position: relative;
          margin-bottom: 22px;
        }

        .field-icon {
          position: absolute;
          top: 50%;
          left: 16px;
          transform: translateY(-50%);
          color: #1a5490;
          font-size: 14px;
          opacity: 0.7;
        }

        .field-input {
          width: 100%;
          height: 52px;
          padding: 0 48px;
          border: 1.5px solid #dde3ef;
          border-radius: 10px;
          background: #ffffff;
          color: #1a2d5a;
          font-size: 14px;
          font-family: 'Lato', sans-serif;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
        }

        .field-input:focus {
          border-color: #1a5490;
          box-shadow: 0 0 0 3px rgba(26,84,144,0.1);
        }

        .field-input::placeholder { color: #b0bcd0; }

        .eye-btn {
          position: absolute;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #8a97b0;
          font-size: 15px;
          padding: 4px;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #1a5490; }

        .error-box {
          background: #fff2f2;
          border: 1px solid #ffc5c5;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #c0392b;
          margin-bottom: 18px;
        }

        .btn-login {
          width: 100%;
          height: 52px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #1a5490 0%, #2a72b8 100%);
          color: white;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-family: 'Lato', sans-serif;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          margin-top: 8px;
          box-shadow: 0 4px 18px rgba(26,84,144,0.3);
        }

        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(26,84,144,0.4);
        }

        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

        .forgot-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
        }
        .forgot-line { flex: 1; height: 1px; background: #dde3ef; }
        .forgot {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #1a5490;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .forgot:hover { opacity: 0.65; }

        /* ── PERDOMOSOFT ── */
        .footer-brand {
          position: absolute;
          bottom: 20px;
          font-size: 11px;
          color: #c0cad8;
          letter-spacing: 0.5px;
          opacity: 0.6;
          transition: opacity 0.3s;
          user-select: none;
        }
        .footer-brand:hover { opacity: 1; }

        /* ── LOADER ── */
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .login-root { flex-direction: column; }
          .login-left { width: 100%; min-height: 260px; padding: 32px 24px; }
          .logo-wrap { width: 65%; max-width: 260px; }
          .church-name { font-size: 22px; }
          .verse { display: none; }
          .login-right { width: 100%; padding: 36px 28px; }
          .login-right::before { width: 100%; height: 4px; top: 0; left: 0; }
        }
      `}</style>

      <div className="login-root">

        {/* ── PANEL IZQUIERDO ── */}
        <div className="login-left">
          <div className="geo-tl" />
          <div className="geo-br" />
          <div className="left-content">

            {/* Contenedor recortado para centrar el logo visualmente */}
            <div className="logo-wrap">
              <img
                src="/Logo_RD-removebg-preview.png"
                alt="Emanuel Church Logo"
                className="church-logo"
                onError={(e) => { e.target.parentElement.style.display = 'none'; }}
              />
            </div>

            <h1 className="church-name">Emanuel Church</h1>
            <p className="church-subtitle">Management System</p>
            <div className="divider-left" />
            <p className="verse">
              "I can do all things through Christ who strengthens me."
              <span>— Philippians 4:13</span>
            </p>
          </div>
        </div>

        {/* ── PANEL DERECHO ── */}
        <div className="login-right">
          <div className="form-wrapper">
            <h2 className="form-greeting">Welcome</h2>
            <p className="form-desc">Enter your credentials to continue</p>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={hacerLogin}>
              <div>
                <label className="field-label">Email Address</label>
                <div className="field-wrap">
                  <FaEnvelope className="field-icon" />
                  <input
                    type="email"
                    placeholder="admin@sistema.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <FaLock className="field-icon" />
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                  >
                    {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>

            <div className="forgot-wrap">
              <div className="forgot-line" />
              <p className="forgot" onClick={() => navigate('/forgot-password')}>
                Forgot your password?
              </p>
              <div className="forgot-line" />
            </div>
          </div>

          {/* ── PERDOMOSOFT ── */}
          <p className="footer-brand">© 2025 Emanuel Church · OA Mundial</p>
        </div>

      </div>
    </>
  );
}
