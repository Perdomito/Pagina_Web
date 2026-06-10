import enum
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Numeric,
    DateTime, Date, BigInteger, ForeignKey, Interval,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


# ── Enums ──────────────────────────────────────────────────────────────────

class TipoMiembroEnum(str, enum.Enum):
    comprometido = "Comprometido"
    registrado = "Registrado"
    voluntario = "Voluntario"


class CotizacionEstadoEnum(str, enum.Enum):
    pendiente = "pendiente"
    aprobado = "aprobado"
    rechazado = "rechazado"


class EstadoPresenciaMisionEnum(str, enum.Enum):
    con_iglesia = "Con iglesia"
    evangelizado = "Evangelizado"
    en_proceso = "En proceso"


class CuentaTipoEnum(str, enum.Enum):
    banco = "Banco"
    caja = "Caja"


class TipoSangreEnum(str, enum.Enum):
    a_positivo = "A+"
    a_negativo = "A-"
    b_positivo = "B+"
    b_negativo = "B-"
    ab_positivo = "AB+"
    ab_negativo = "AB-"
    o_positivo = "O+"
    o_negativo = "O-"


# ── Models ─────────────────────────────────────────────────────────────────

class Pais(Base):
    __tablename__ = "paises"

    id = Column(Integer, primary_key=True)
    iso = Column(String(2))
    nombre = Column(String(100), nullable=False)
    continente_id = Column(Integer, ForeignKey("continentes.id", ondelete="SET NULL"))

    miembros = relationship("Miembro", back_populates="pais_rel")
    contactos = relationship("Contacto", back_populates="pais_rel")
    reportes = relationship("Reporte", back_populates="pais_rel")
    presupuestos = relationship("Presupuesto", back_populates="pais_rel")
    ejecuciones = relationship("Ejecucion", back_populates="pais_rel")
    estadisticas = relationship("EstadisticaPais", back_populates="pais_rel")
    ciudades = relationship("Ciudad", back_populates="pais_rel")
    ingresos = relationship("Ingreso", back_populates="pais_rel")
    saldos = relationship("SaldoCajaBanco", back_populates="pais_rel")
    traslados = relationship("Traslado", back_populates="pais_rel")
    continente_rel = relationship("Continente", back_populates="paises")


class Ciudad(Base):
    __tablename__ = "ciudades"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    nombre_ascii = Column(String(100))
    lat = Column(Numeric(10, 7))
    lng = Column(Numeric(10, 7))
    pais_iso2 = Column(String(2), ForeignKey("paises.iso", ondelete="SET NULL"))
    admin_name = Column(String(100))
    capital = Column(String(20))
    population = Column(BigInteger)
    worldcity_id = Column(BigInteger)

    pais_rel = relationship("Pais", back_populates="ciudades")
    miembros = relationship("Miembro", back_populates="ciudad_rel")
    contactos = relationship("Contacto", back_populates="ciudad_rel")
    reportes = relationship("Reporte", back_populates="ciudad_rel")
    misiones = relationship("CiudadMision", back_populates="ciudad_rel")


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(30), nullable=False, default="")
    descripcion = Column(String(100))

    permisos = relationship("RolPermiso", back_populates="rol")
    usuarios = relationship("Usuario", back_populates="rol_rel")


class RolPermiso(Base):
    __tablename__ = "rol_permisos"

    rol_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    permiso_id = Column(Integer, primary_key=True)
    activo = Column(Boolean, default=True)

    rol = relationship("Rol", back_populates="permisos")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String(30), primary_key=True)
    nombre = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    rol = Column(Integer, ForeignKey("roles.id"), nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)
    activo = Column(Boolean, default=False, nullable=False)
    region = Column(String(20), nullable=True)

    rol_rel = relationship("Rol", back_populates="usuarios")


class Miembro(Base):
    __tablename__ = "miembros"

    id = Column(String(30), primary_key=True)
    nombre = Column(Text, nullable=False)
    identidad = Column(String(30))
    pais = Column(Text)
    ciudad = Column(Text)
    edad = Column(Integer)
    evangelizado_por = Column(Text)
    estado_civil = Column(Text)
    profesion = Column(Text)
    comentarios = Column(Text)
    tipo_miembro = Column(String(20), nullable=False)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))
    ciudad_id = Column(Integer, ForeignKey("ciudades.id", ondelete="SET NULL"))

    pais_rel = relationship("Pais", back_populates="miembros")
    ciudad_rel = relationship("Ciudad", back_populates="miembros")
    contactos = relationship("Contacto", back_populates="miembro_rel")
    reportes = relationship("Reporte", back_populates="miembro_rel")
    cotizaciones = relationship("Cotizacion", back_populates="miembro_rel")
    info_adicional = relationship("MiembroInfoAdicional", back_populates="miembro_rel", uselist=False)
    estudios_diarios = relationship("EstudioDiario", back_populates="miembro_rel")


class Contacto(Base):
    __tablename__ = "contactos"

    id = Column(Integer, primary_key=True)
    miembro_responsable = Column(Text, nullable=False)
    nombre = Column(Text, nullable=False)
    telefono = Column(Text)
    pais = Column(Text)
    notas = Column(Text)
    profesion = Column(Text)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))
    miembro_responsable_id = Column(String(30), ForeignKey("miembros.id", ondelete="SET NULL"))
    ciudad_id = Column(Integer, ForeignKey("ciudades.id", ondelete="SET NULL"))

    pais_rel = relationship("Pais", back_populates="contactos")
    ciudad_rel = relationship("Ciudad", back_populates="contactos")
    miembro_rel = relationship("Miembro", back_populates="contactos")


class Reporte(Base):
    __tablename__ = "reportes"

    id = Column(Integer, primary_key=True)
    miembro_que_reporta = Column(Text, nullable=False)
    fecha = Column(Date, nullable=False)
    tiempo_evangelizacion = Column(Interval)
    contactos_obtenidos = Column(Integer, default=0)
    contactos_estudian = Column(Integer, default=0)
    numero_estudios_dados = Column(Integer, default=0)
    total_estudiantes = Column(Integer, default=0)
    pais = Column(Text)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))
    miembro_id = Column(String(30), ForeignKey("miembros.id", ondelete="SET NULL"))
    ciudad_id = Column(Integer, ForeignKey("ciudades.id", ondelete="SET NULL"))

    pais_rel = relationship("Pais", back_populates="reportes")
    ciudad_rel = relationship("Ciudad", back_populates="reportes")
    miembro_rel = relationship("Miembro", back_populates="reportes")


class Cotizacion(Base):
    __tablename__ = "cotizaciones"

    id = Column(Integer, primary_key=True)
    fecha = Column(Date, nullable=False)
    solicitante = Column(Text, nullable=False)
    concepto = Column(Text, nullable=False)
    monto = Column(Numeric(15, 2), nullable=False)
    moneda = Column(String(10), default="USD", nullable=False)
    estado = Column(String(20), default="pendiente", nullable=False)
    agregado_a_gastos = Column(Boolean, default=False, nullable=False)
    mes_agregado = Column(Integer)
    anio_agregado = Column(Integer)
    notas = Column(Text)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    miembro_id = Column(String(30), ForeignKey("miembros.id", ondelete="SET NULL"))

    miembro_rel = relationship("Miembro", back_populates="cotizaciones")


class Presupuesto(Base):
    __tablename__ = "presupuestos"

    id = Column(Integer, primary_key=True)
    pais = Column(String(100), nullable=False)
    mes = Column(Integer)
    anio = Column(Integer, nullable=False)
    tipo_gasto = Column(String(100), nullable=False)
    concepto = Column(Text)
    monto = Column(Numeric(15, 2), nullable=False)
    moneda = Column(String(10), nullable=False)
    tasa_cambio = Column(Numeric(15, 6))
    notas = Column(Text)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))

    pais_rel = relationship("Pais", back_populates="presupuestos")
    ejecuciones = relationship("Ejecucion", back_populates="presupuesto_rel")


class Ejecucion(Base):
    __tablename__ = "ejecuciones"

    id = Column(Integer, primary_key=True)
    pais = Column(String(100), nullable=False)
    mes = Column(Integer, nullable=False)
    anio = Column(Integer, nullable=False)
    monto_recibido_usd = Column(Numeric(15, 2), nullable=False)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="SET NULL"))
    notas = Column(Text)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))

    pais_rel = relationship("Pais", back_populates="ejecuciones")
    presupuesto_rel = relationship("Presupuesto", back_populates="ejecuciones")
    gastos = relationship("GastoReal", back_populates="ejecucion_rel", cascade="all, delete")


class GastoReal(Base):
    __tablename__ = "gastos_reales"

    id = Column(Integer, primary_key=True)
    ejecucion_id = Column(Integer, ForeignKey("ejecuciones.id", ondelete="CASCADE"), nullable=False)
    concepto = Column(Text, nullable=False)
    monto = Column(Numeric(15, 2), nullable=False)
    tipo_gasto = Column(String(100), nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    ejecucion_rel = relationship("Ejecucion", back_populates="gastos")


class EstadisticaPais(Base):
    __tablename__ = "estadisticas_paises"

    id = Column(Integer, primary_key=True)
    nombre_pais = Column(String(100), nullable=False)
    cantidad_miembros = Column(Integer, default=0)
    cantidad_estudios = Column(Integer, default=0)
    cantidad_reportes = Column(Integer, default=0)
    color = Column(String(20))
    mes = Column(Integer)
    anio = Column(Integer, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))

    pais_rel = relationship("Pais", back_populates="estadisticas")


class Configuracion(Base):
    __tablename__ = "configuracion"

    id = Column(Integer, primary_key=True)
    clave = Column(String(100), nullable=False, unique=True)
    valor = Column(Text, nullable=False)
    descripcion = Column(Text)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, nullable=False)


class CiudadMision(Base):
    __tablename__ = "ciudades_mision"

    id = Column(Integer, primary_key=True)
    ciudad_id = Column(Integer, ForeignKey("ciudades.id", ondelete="SET NULL"), nullable=False)
    region = Column(String(150))
    estado_presencia = Column(String(30), nullable=False, default="En proceso")
    fecha_inicio_trabajo = Column(Date)
    pastor_encargado_id = Column(String(30))
    pastor_encargado_nombre = Column(Text)
    cantidad_miembros_activos = Column(Integer, default=0)
    notas = Column(Text)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    ciudad_rel = relationship("Ciudad", back_populates="misiones")


class Ingreso(Base):
    __tablename__ = "ingresos"

    id = Column(Integer, primary_key=True)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))
    mes = Column(Integer, nullable=False)
    anio = Column(Integer, nullable=False)
    tipo = Column(String(100), nullable=False)
    origen = Column(Text)
    donde_ingresa = Column(String(10), nullable=False)
    valor = Column(Numeric(15, 2), nullable=False)
    observaciones = Column(Text)
    fecha = Column(Date, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    pais_rel = relationship("Pais", back_populates="ingresos")


class MiembroInfoAdicional(Base):
    __tablename__ = "miembros_info_adicional"

    miembro_id = Column(String(30), ForeignKey("miembros.id", ondelete="CASCADE"), primary_key=True)
    nombre_padre = Column(Text)
    telefono_padre = Column(String(30))
    nombre_madre = Column(Text)
    telefono_madre = Column(String(30))
    tipo_sangre = Column(String(5))
    correo_electronico = Column(String(255))
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    miembro_rel = relationship("Miembro", back_populates="info_adicional")


class SaldoCajaBanco(Base):
    __tablename__ = "saldos_caja_banco"

    id = Column(Integer, primary_key=True)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))
    saldo_caja = Column(Numeric(15, 2), nullable=False, default=0)
    saldo_banco = Column(Numeric(15, 2), nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    pais_rel = relationship("Pais", back_populates="saldos")


class Traslado(Base):
    __tablename__ = "traslados"

    id = Column(Integer, primary_key=True)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))
    de = Column(String(10), nullable=False)
    a = Column(String(10), nullable=False)
    valor = Column(Numeric(15, 2), nullable=False)
    observaciones = Column(Text)
    fecha = Column(Date, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    pais_rel = relationship("Pais", back_populates="traslados")


class Continente(Base):
    __tablename__ = "continentes"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False, unique=True)

    paises = relationship("Pais", back_populates="continente_rel")


class EstudioDiario(Base):
    __tablename__ = "estudios_diarios"

    id = Column(Integer, primary_key=True)
    miembro_id = Column(String(30), ForeignKey("miembros.id", ondelete="CASCADE"), nullable=False)
    pais_id = Column(Integer, ForeignKey("paises.id", ondelete="SET NULL"))
    contacto_id = Column(Integer, ForeignKey("contactos.id", ondelete="SET NULL"))
    mes = Column(Integer, nullable=False)
    anio = Column(Integer, nullable=False)
    dia = Column(Integer, nullable=False)
    capitulo = Column(String(255))
    horas = Column(Numeric(5, 2))
    tipo = Column(String(50))
    donde = Column(String(255))
    dijeron_si = Column(Integer, default=0)
    nuevos_contactos = Column(Integer, default=0)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    miembro_rel = relationship("Miembro", back_populates="estudios_diarios")
    pais_rel = relationship("Pais")
    contacto_rel = relationship("Contacto")
