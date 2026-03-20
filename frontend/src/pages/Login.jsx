import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
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
      setError("Por favor llene todos los campos.");
      return;
    }

    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('¡Bienvenido!');
      navigate("/home");
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <style>
        {`
          .glass-card {
            width: 420px;
            padding: 45px;
            border-radius: 20px;
            background: rgba(14, 90, 97, 0.25);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            border: 1px solid rgba(255, 255, 255, 0.35);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
            color: white;
            text-align: center;
          }

          .input-container {
            position: relative;
            margin-bottom: 20px;
          }

          .input {
            width: 100%;
            height: 50px;
            padding: 0 50px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.35);
            background: rgba(255,255,255,0.08);
            color: white;
            outline: none;
            font-size: 14px;
            box-sizing: border-box;
            transition: all 0.3s;
          }

          .input:focus {
            background: rgba(255,255,255,0.15);
            border-color: rgba(255,255,255,0.6);
          }

          .input::placeholder {
            color: rgba(255,255,255,0.7);
          }

          .icon-left {
            position: absolute;
            top: 50%;
            left: 18px;
            transform: translateY(-50%);
            color: white;
            font-size: 16px;
            opacity: 0.9;
          }

          .icon-right {
            position: absolute;
            top: 50%;
            right: 18px;
            transform: translateY(-50%);
            color: white;
            font-size: 16px;
            cursor: pointer;
            opacity: 0.9;
            transition: opacity 0.2s;
          }

          .icon-right:hover {
            opacity: 1;
          }

          .btn {
            width: 100%;
            height: 50px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #0E5A61, #15777F);
            color: white;
            font-size: 15px;
            cursor: pointer;
            transition: 0.3s;
            margin-top: 10px;
            font-weight: 600;
          }

          .btn:hover:not(:disabled) {
            opacity: 0.85;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(21, 119, 127, 0.4);
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .error {
            background: rgba(255,0,0,0.2);
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 13px;
            border: 1px solid rgba(255,0,0,0.3);
          }

          .forgot-password {
            margin-top: 15px;
            color: rgba(255,255,255,0.8);
            font-size: 13px;
            cursor: pointer;
            transition: color 0.2s;
          }

          .forgot-password:hover {
            color: white;
            text-decoration: underline;
          }

          .demo-info {
            margin-top: 25px;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            font-size: 12px;
            text-align: left;
          }

          .demo-info strong {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
          }
        `}
      </style>

      <div className="glass-card">
        <h2 style={{ marginBottom: "10px", fontWeight: "600", fontSize: "28px" }}>
          Emanuel Church
        </h2>

        <p style={{ marginBottom: "30px", opacity: 0.9 }}>
          Bienvenido a la OA Mundial
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={hacerLogin}>
          <div className="input-container">
            <FaUser className="icon-left" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              disabled={loading}
            />
          </div>

          <div className="input-container">
            <FaLock className="icon-left" />
            <input
              type={mostrarPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              disabled={loading}
            />
            <div
              className="icon-right"
              onClick={() => setMostrarPassword(!mostrarPassword)}
            >
              {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div 
          className="forgot-password"
          onClick={() => navigate('/forgot-password')}
        >
          ¿Olvidaste tu contraseña?
        </div>

        {/* Información de credenciales de demostración */}
        <div className="demo-info">
          <strong>Credenciales de prueba:</strong>
          <div>Email: admin@sistema.com</div>
          <div>Contraseña: 1234</div>
        </div>
      </div>
    </div>
  );
}
