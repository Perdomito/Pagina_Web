from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.models import TipoMiembroEnum, CotizacionEstadoEnum


# ── Paises ─────────────────────────────────────────────────────────────────

class PaisBase(BaseModel):
    iso: Optional[str] = None
    nombre: str

class PaisCreate(PaisBase):
    pass

class PaisUpdate(BaseModel):
    iso: Optional[str] = None
    nombre: Optional[str] = None

class PaisOut(PaisBase):
    id: int
    model_config = {"from_attributes": True}


# ── Ciudades ───────────────────────────────────────────────────────────────

class CiudadBase(BaseModel):
    nombre: str
    nombre_ascii: Optional[str] = None
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    pais_iso2: Optional[str] = None
    admin_name: Optional[str] = None
    capital: Optional[str] = None
    population: Optional[int] = None
    worldcity_id: Optional[int] = None

class CiudadCreate(CiudadBase):
    pass

class CiudadUpdate(BaseModel):
    nombre: Optional[str] = None
    nombre_ascii: Optional[str] = None
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    pais_iso2: Optional[str] = None
    admin_name: Optional[str] = None
    capital: Optional[str] = None
    population: Optional[int] = None
    worldcity_id: Optional[int] = None

class CiudadOut(CiudadBase):
    id: int
    model_config = {"from_attributes": True}


# ── Roles ──────────────────────────────────────────────────────────────────

class RolBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class RolCreate(RolBase):
    pass

class RolUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

class RolOut(RolBase):
    id: int
    model_config = {"from_attributes": True}


# ── RolPermisos ────────────────────────────────────────────────────────────

class RolPermisoBase(BaseModel):
    rol_id: int
    permiso_id: int
    activo: bool = True

class RolPermisoCreate(RolPermisoBase):
    pass

class RolPermisoUpdate(BaseModel):
    activo: Optional[bool] = None

class RolPermisoOut(RolPermisoBase):
    model_config = {"from_attributes": True}


# ── Usuarios ───────────────────────────────────────────────────────────────

class UsuarioBase(BaseModel):
    id: str
    nombre: str
    email: EmailStr
    rol: int
    activo: bool = False

class UsuarioCreate(UsuarioBase):
    password_hash: str

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    password_hash: Optional[str] = None
    rol: Optional[int] = None
    activo: Optional[bool] = None

class UsuarioOut(UsuarioBase):
    fecha_registro: datetime
    model_config = {"from_attributes": True}


# ── Miembros ───────────────────────────────────────────────────────────────

class MiembroBase(BaseModel):
    id: str
    nombre: str
    identidad: Optional[str] = None
    pais: Optional[str] = None
    ciudad: Optional[str] = None
    edad: Optional[int] = None
    evangelizado_por: Optional[str] = None
    estado_civil: Optional[str] = None
    profesion: Optional[str] = None
    comentarios: Optional[str] = None
    tipo_miembro: TipoMiembroEnum
    pais_id: Optional[int] = None
    ciudad_id: Optional[int] = None

class MiembroCreate(MiembroBase):
    pass

class MiembroUpdate(BaseModel):
    nombre: Optional[str] = None
    identidad: Optional[str] = None
    pais: Optional[str] = None
    ciudad: Optional[str] = None
    edad: Optional[int] = None
    evangelizado_por: Optional[str] = None
    estado_civil: Optional[str] = None
    profesion: Optional[str] = None
    comentarios: Optional[str] = None
    tipo_miembro: Optional[TipoMiembroEnum] = None
    pais_id: Optional[int] = None
    ciudad_id: Optional[int] = None

class MiembroOut(MiembroBase):
    model_config = {"from_attributes": True}


# ── Contactos ──────────────────────────────────────────────────────────────

class ContactoBase(BaseModel):
    miembro_responsable: str
    nombre: str
    telefono: Optional[str] = None
    pais: Optional[str] = None
    notas: Optional[str] = None
    profesion: Optional[str] = None
    pais_id: Optional[int] = None
    miembro_responsable_id: Optional[str] = None
    ciudad_id: Optional[int] = None

class ContactoCreate(ContactoBase):
    pass

class ContactoUpdate(BaseModel):
    miembro_responsable: Optional[str] = None
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    pais: Optional[str] = None
    notas: Optional[str] = None
    profesion: Optional[str] = None
    pais_id: Optional[int] = None
    miembro_responsable_id: Optional[str] = None
    ciudad_id: Optional[int] = None

class ContactoOut(ContactoBase):
    id: int
    fecha_creacion: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ── Reportes ───────────────────────────────────────────────────────────────

class ReporteBase(BaseModel):
    miembro_que_reporta: str
    fecha: date
    tiempo_evangelizacion: Optional[timedelta] = None
    contactos_obtenidos: int = 0
    contactos_estudian: int = 0
    numero_estudios_dados: int = 0
    total_estudiantes: int = 0
    pais: Optional[str] = None
    pais_id: Optional[int] = None
    miembro_id: Optional[str] = None
    ciudad_id: Optional[int] = None

class ReporteCreate(ReporteBase):
    pass

class ReporteUpdate(BaseModel):
    miembro_que_reporta: Optional[str] = None
    fecha: Optional[date] = None
    tiempo_evangelizacion: Optional[timedelta] = None
    contactos_obtenidos: Optional[int] = None
    contactos_estudian: Optional[int] = None
    numero_estudios_dados: Optional[int] = None
    total_estudiantes: Optional[int] = None
    pais: Optional[str] = None
    pais_id: Optional[int] = None
    miembro_id: Optional[str] = None
    ciudad_id: Optional[int] = None

class ReporteOut(ReporteBase):
    id: int
    fecha_creacion: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ── Cotizaciones ───────────────────────────────────────────────────────────

class CotizacionBase(BaseModel):
    fecha: date
    solicitante: str
    concepto: str
    monto: Decimal
    moneda: str = "USD"
    estado: CotizacionEstadoEnum = CotizacionEstadoEnum.pendiente
    agregado_a_gastos: bool = False
    mes_agregado: Optional[int] = None
    anio_agregado: Optional[int] = None
    notas: Optional[str] = None
    miembro_id: Optional[str] = None

    @field_validator("mes_agregado")
    @classmethod
    def validar_mes(cls, v):
        if v is not None and not (1 <= v <= 12):
            raise ValueError("El mes debe estar entre 1 y 12")
        return v

class CotizacionCreate(CotizacionBase):
    pass

class CotizacionUpdate(BaseModel):
    fecha: Optional[date] = None
    solicitante: Optional[str] = None
    concepto: Optional[str] = None
    monto: Optional[Decimal] = None
    moneda: Optional[str] = None
    estado: Optional[CotizacionEstadoEnum] = None
    agregado_a_gastos: Optional[bool] = None
    mes_agregado: Optional[int] = None
    anio_agregado: Optional[int] = None
    notas: Optional[str] = None
    miembro_id: Optional[str] = None

class CotizacionOut(CotizacionBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    model_config = {"from_attributes": True}


# ── Presupuestos ───────────────────────────────────────────────────────────

TIPOS_GASTO_VALIDOS = [
    "presupuesto_recibido", "alquiler_local", "servicios_publicos",
    "materiales_evangelizacion", "alimentacion", "transporte",
    "comunicaciones", "otros_gastos",
]

class PresupuestoBase(BaseModel):
    pais: str
    mes: Optional[int] = None
    anio: int
    tipo_gasto: str
    concepto: Optional[str] = None
    monto: Decimal
    moneda: str
    tasa_cambio: Optional[Decimal] = None
    notas: Optional[str] = None
    pais_id: Optional[int] = None

    @field_validator("mes")
    @classmethod
    def validar_mes(cls, v):
        if v is not None and not (1 <= v <= 12):
            raise ValueError("El mes debe estar entre 1 y 12")
        return v

    @field_validator("tipo_gasto")
    @classmethod
    def validar_tipo_gasto(cls, v):
        if v not in TIPOS_GASTO_VALIDOS:
            raise ValueError(f"tipo_gasto debe ser uno de: {TIPOS_GASTO_VALIDOS}")
        return v

class PresupuestoCreate(PresupuestoBase):
    pass

class PresupuestoUpdate(BaseModel):
    pais: Optional[str] = None
    mes: Optional[int] = None
    anio: Optional[int] = None
    tipo_gasto: Optional[str] = None
    concepto: Optional[str] = None
    monto: Optional[Decimal] = None
    moneda: Optional[str] = None
    tasa_cambio: Optional[Decimal] = None
    notas: Optional[str] = None
    pais_id: Optional[int] = None

class PresupuestoOut(PresupuestoBase):
    id: int
    fecha_registro: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ── Ejecuciones ────────────────────────────────────────────────────────────

class EjecucionBase(BaseModel):
    pais: str
    mes: int
    anio: int
    monto_recibido_usd: Decimal
    presupuesto_id: Optional[int] = None
    notas: Optional[str] = None
    pais_id: Optional[int] = None

    @field_validator("mes")
    @classmethod
    def validar_mes(cls, v):
        if not (1 <= v <= 12):
            raise ValueError("El mes debe estar entre 1 y 12")
        return v

class EjecucionCreate(EjecucionBase):
    pass

class EjecucionUpdate(BaseModel):
    pais: Optional[str] = None
    mes: Optional[int] = None
    anio: Optional[int] = None
    monto_recibido_usd: Optional[Decimal] = None
    presupuesto_id: Optional[int] = None
    notas: Optional[str] = None
    pais_id: Optional[int] = None

class EjecucionOut(EjecucionBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    model_config = {"from_attributes": True}


# ── Gastos Reales ──────────────────────────────────────────────────────────

class GastoRealBase(BaseModel):
    ejecucion_id: int
    concepto: str
    monto: Decimal
    tipo_gasto: str

class GastoRealCreate(GastoRealBase):
    pass

class GastoRealUpdate(BaseModel):
    concepto: Optional[str] = None
    monto: Optional[Decimal] = None
    tipo_gasto: Optional[str] = None

class GastoRealOut(GastoRealBase):
    id: int
    fecha_creacion: datetime
    model_config = {"from_attributes": True}


# ── Estadísticas Países ────────────────────────────────────────────────────

class EstadisticaPaisBase(BaseModel):
    nombre_pais: str
    cantidad_miembros: int = 0
    cantidad_estudios: int = 0
    cantidad_reportes: int = 0
    color: Optional[str] = None
    mes: Optional[int] = None
    anio: int
    pais_id: Optional[int] = None

    @field_validator("mes")
    @classmethod
    def validar_mes(cls, v):
        if v is not None and not (1 <= v <= 12):
            raise ValueError("El mes debe estar entre 1 y 12")
        return v

class EstadisticaPaisCreate(EstadisticaPaisBase):
    pass

class EstadisticaPaisUpdate(BaseModel):
    nombre_pais: Optional[str] = None
    cantidad_miembros: Optional[int] = None
    cantidad_estudios: Optional[int] = None
    cantidad_reportes: Optional[int] = None
    color: Optional[str] = None
    mes: Optional[int] = None
    anio: Optional[int] = None
    pais_id: Optional[int] = None

class EstadisticaPaisOut(EstadisticaPaisBase):
    id: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ── Configuración ──────────────────────────────────────────────────────────

class ConfiguracionBase(BaseModel):
    clave: str
    valor: str
    descripcion: Optional[str] = None

class ConfiguracionCreate(ConfiguracionBase):
    pass

class ConfiguracionUpdate(BaseModel):
    valor: Optional[str] = None
    descripcion: Optional[str] = None

class ConfiguracionOut(ConfiguracionBase):
    id: int
    fecha_actualizacion: datetime
    model_config = {"from_attributes": True}
