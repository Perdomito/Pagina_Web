# Sistema de Gestión - Iglesia Emanuel

Sistema full-stack para gestionar miembros, contactos, estudios bíblicos, reportes y administración financiera.

## Stack

- **Frontend**: React 18 + React Router, estilos inline
- **Backend**: FastAPI + Neon PostgreSQL (rama `main`); Node proxy para deploy en HuggingFace
- **Auth**: JWT + roles/permisos en BD
- **i18n**: Context API + localStorage (ES/EN)

## Características

✅ Gestión de miembros y contactos  
✅ Reportes de evangelización y estudios bíblicos  
✅ Administración financiera y presupuestos  
✅ Control de usuarios, roles y permisos  
✅ Cambio de idioma (Español/Inglés)  
✅ Responsive, datos reales en Neon DB  

## Inicio rápido

### Frontend
```bash
cd frontend
npm install
npm start  # http://localhost:3000
```

### Backend
```bash
cd backend/API
python -m pip install -r requirements.txt
python app/main.py  # http://localhost:8000
```

**Notas importantes**: Consulta `CLAUDE.md` en la raíz del proyecto para convenciones y flujo de trabajo.
