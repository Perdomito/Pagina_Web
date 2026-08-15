import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaArrowLeft, FaChurch, FaCheckCircle } from "react-icons/fa";
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useIdioma } from "../context/IdiomaContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { idioma } = useIdioma();
  const tx = (es, en) => (idioma === 'en' ? en : es); // bilingüe directo para textos sin clave en el diccionario central
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error(tx("Por favor ingresa tu correo electrónico", "Please enter your email address"));
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
    } catch {
      // Por seguridad, mostramos el mismo mensaje aunque falle o el correo no exista.
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"linear-gradient(160deg, #0d2d4a 0%, #134069 50%, #1a5490 100%)", fontFamily:"'Lato',sans-serif" }}>
      <style>{`
        .fp-input { width:100%; height:50px; padding:0 16px 0 46px; border-radius:10px; border:1.5px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.08); color:white; font-size:14px; box-sizing:border-box; outline:none; font-family:'Lato',sans-serif; transition:all 0.2s; }
        .fp-input:focus { border-color:rgba(255,255,255,0.5); background:rgba(255,255,255,0.12); }
        .fp-input::placeholder { color:rgba(255,255,255,0.5); }
        .fp-btn { width:100%; height:50px; border-radius:10px; border:none; background:white; color:#134069; font-size:15px; font-weight:700; cursor:pointer; font-family:'Lato',sans-serif; transition:all 0.2s; }
        .fp-btn:hover:not(:disabled) { background:#f0f4fa; transform:translateY(-1px); }
        .fp-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"40px", display:"none" }} className="hide-mobile" />

      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1, padding:"20px" }}>
        <div style={{ width:"100%", maxWidth:"420px" }}>
          <div style={{ textAlign:"center", marginBottom:"40px" }}>
            <div style={{ width:64, height:64, borderRadius:"16px", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <FaChurch size={28} color="white" />
            </div>
            <h1 style={{ color:"white", fontFamily:"'Cinzel',serif", fontSize:"22px", fontWeight:"600", letterSpacing:"2px", margin:0 }}>IGLESIA EMANUEL</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"12px", margin:"4px 0 0", letterSpacing:"1px" }}>{tx("SISTEMA DE GESTIÓN", "MANAGEMENT SYSTEM")}</p>
          </div>

          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"20px", padding:"36px", border:"1px solid rgba(255,255,255,0.12)", backdropFilter:"blur(10px)" }}>
            {!sent ? (
              <>
                <h2 style={{ color:"white", fontFamily:"'Cinzel',serif", fontSize:"20px", fontWeight:"600", margin:"0 0 8px", textAlign:"center" }}>{tx("¿Olvidaste tu contraseña?", "Forgot your password?")}</h2>                <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"13px", textAlign:"center", margin:"0 0 28px", lineHeight:"1.6" }}>
                {tx("Escribe tu correo y le avisaremos al administrador para que te ayude a recuperar el acceso.", "Enter your email and we'll let the administrator know so they can help you get back in.")}                </p>

                <form onSubmit={handleSubmit}>
                  <div style={{ position:"relative", marginBottom:"20px" }}>
                    <FaEnvelope style={{ position:"absolute", top:"50%", left:"16px", transform:"translateY(-50%)", color:"rgba(255,255,255,0.5)", fontSize:"15px" }} />
                    <input type="email" placeholder={tx("Correo electrónico", "Email address")} value={email} onChange={e => setEmail(e.target.value)} className="fp-input" disabled={loading} />
                  </div>
                  <button type="submit" className="fp-btn" disabled={loading}>
                  {loading ? tx('Enviando...', 'Sending...') : tx('Solicitar ayuda', 'Request Help')}                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:"48px", marginBottom:"16px", color: "#4CAF50" }}><FaCheckCircle /></div>
                <h2 style={{ color:"white", fontFamily:"'Cinzel',serif", fontSize:"18px", margin:"0 0 12px" }}>{tx("Listo, ya se avisó", "Done, admin notified")}</h2>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"13px", lineHeight:"1.7", margin:0 }}>
                  {tx("Si ese correo existe en el sistema, el administrador ya recibió una notificación y se pondrá en contacto contigo para ayudarte a restablecer tu contraseña.", "If that email exists in the system, the administrator already received a notification and will reach out to help you reset your password.")}
                </p>
              </div>
            )}

            <button onClick={() => navigate('/')} style={{ width:"100%", marginTop:"20px", padding:"12px", background:"transparent", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"10px", color:"rgba(255,255,255,0.7)", fontSize:"13px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", fontFamily:"'Lato',sans-serif", transition:"all 0.2s" }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white"; }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
              <FaArrowLeft size={12} /> {tx("Volver a iniciar sesión", "Back to Sign In")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
