import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (email.trim() === "") {
      toast.error("Por favor ingrese su correo electrónico");
      return;
    }

    setLoading(true);
    
    // Simular envío de correo
    setTimeout(() => {
      setLoading(false);
      toast.success("Si el correo existe, recibirás instrucciones para recuperar tu contraseña");
      setTimeout(() => navigate("/"), 2000);
    }, 1500);
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

          .back-btn {
            margin-top: 15px;
            color: rgba(255,255,255,0.8);
            font-size: 13px;
            cursor: pointer;
            transition: color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .back-btn:hover {
            color: white;
          }
        `}
      </style>

      <div className="glass-card">
        <h2 style={{ marginBottom: "10px", fontWeight: "600", fontSize: "28px" }}>
          Recuperar Contraseña
        </h2>

        <p style={{ marginBottom: "30px", opacity: 0.9, fontSize: "14px" }}>
          Ingresa tu correo electrónico y te enviaremos instrucciones
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <FaEnvelope className="icon-left" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>
        </form>

        <div 
          className="back-btn"
          onClick={() => navigate('/')}
        >
          <FaArrowLeft />
          Volver al inicio de sesión
        </div>

        <div style={{ 
          marginTop: "25px", 
          padding: "15px", 
          background: "rgba(255,255,255,0.1)", 
          borderRadius: "10px", 
          fontSize: "12px",
          textAlign: "left"
        }}>
          <strong style={{ display: "block", marginBottom: "8px", fontSize: "13px" }}>
            Nota:
          </strong>
          <div>Esta función estará disponible cuando se implemente el backend con envío de correos.</div>
        </div>
      </div>
    </div>
  );
}
