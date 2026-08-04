"""Relaciones (claves foraneas) declaradas en los modelos.

La BD de produccion se fue construyendo a mano y hubo columnas *_id sin FK
(rol_permisos.permiso_id, usuario_permisos.permiso_id). Este test fija el
inventario esperado: si alguien agrega una columna de relacion sin FK, o cambia
un ON DELETE, aqui se nota antes de que la BD quede inconsistente.
"""
from app.database import Base
from app import models  # noqa: F401  (registra los modelos en el metadata)

# (tabla.columna) -> (tabla_destino, ON DELETE esperado)
RELACIONES_ESPERADAS = {
    "ciudades.pais_iso2": ("paises", "SET NULL"),
    "ciudades_mision.ciudad_id": ("ciudades", "CASCADE"),
    "ciudades_mision.pastor_encargado_id": ("miembros", "SET NULL"),
    "contactos.pais_id": ("paises", "SET NULL"),
    "contactos.ciudad_id": ("ciudades", "SET NULL"),
    "contactos.miembro_responsable_id": ("miembros", "SET NULL"),
    "cotizaciones.pais_id": ("paises", "SET NULL"),
    "cotizaciones.ciudad_id": ("ciudades", "SET NULL"),
    "cotizaciones.miembro_id": ("miembros", "SET NULL"),
    "ejecuciones.pais_id": ("paises", "SET NULL"),
    "ejecuciones.presupuesto_id": ("presupuestos", "SET NULL"),
    "estadisticas_paises.pais_id": ("paises", "SET NULL"),
    "estudios_diarios.miembro_id": ("miembros", "CASCADE"),
    "estudios_diarios.pais_id": ("paises", "SET NULL"),
    "estudios_diarios.contacto_id": ("contactos", "RESTRICT"),
    "gastos_reales.ejecucion_id": ("ejecuciones", "CASCADE"),
    "iglesias.ciudad_id": ("ciudades", "RESTRICT"),
    "iglesias.pais_id": ("paises", "SET NULL"),
    "iglesias.pastor_encargado_id": ("miembros", "SET NULL"),
    "ingresos.pais_id": ("paises", "SET NULL"),
    "miembros.pais_id": ("paises", "SET NULL"),
    "miembros.ciudad_id": ("ciudades", "SET NULL"),
    "miembros_info_adicional.id": ("miembros", "CASCADE"),
    "paises.continente_id": ("continentes", "SET NULL"),
    "presupuestos.pais_id": ("paises", "SET NULL"),
    "reportes.pais_id": ("paises", "SET NULL"),
    "reportes.ciudad_id": ("ciudades", "SET NULL"),
    "reportes.miembro_id": ("miembros", "SET NULL"),
    "rol_permisos.rol_id": ("roles", None),
    "rol_permisos.permiso_id": ("permisos", "CASCADE"),
    "saldos_caja_banco.pais_id": ("paises", "SET NULL"),
    "traslados.pais_id": ("paises", "SET NULL"),
    "usuario_permisos.usuario_id": ("usuarios", "CASCADE"),
    "usuario_permisos.permiso_id": ("permisos", "CASCADE"),
    "usuarios.rol": ("roles", None),
    "usuarios.pais_id": ("paises", "SET NULL"),
    "usuarios.ciudad_id": ("ciudades", "SET NULL"),
    "usuarios.miembro_id": ("miembros", "SET NULL"),
}

# Columnas *_id que a proposito no son una relacion.
SIN_RELACION = {
    "archivos.referencia_id",  # apunta a ingresos o gastos segun archivos.tipo
    "ciudades.worldcity_id",   # id del dataset externo de ciudades
}


def _relaciones_declaradas():
    encontradas = {}
    for tabla in Base.metadata.tables.values():
        for columna in tabla.columns:
            for fk in columna.foreign_keys:
                encontradas[f"{tabla.name}.{columna.name}"] = (
                    fk.column.table.name, fk.ondelete
                )
    return encontradas


def test_las_relaciones_declaradas_son_las_esperadas():
    assert _relaciones_declaradas() == RELACIONES_ESPERADAS


def test_ninguna_columna_de_relacion_se_queda_sin_clave_foranea():
    con_fk = set(_relaciones_declaradas())
    sospechosas = {
        f"{t.name}.{c.name}"
        for t in Base.metadata.tables.values()
        for c in t.columns
        if c.name.endswith("_id")
    }
    huerfanas = sospechosas - con_fk - SIN_RELACION
    assert not huerfanas, f"columnas *_id sin FK declarada: {sorted(huerfanas)}"


def test_ninguna_relacion_pone_a_null_una_columna_obligatoria():
    """ON DELETE SET NULL sobre una columna NOT NULL revienta al borrar el padre."""
    invalidas = [
        f"{t.name}.{c.name}"
        for t in Base.metadata.tables.values()
        for c in t.columns
        for fk in c.foreign_keys
        if fk.ondelete == "SET NULL" and not c.nullable
    ]
    assert not invalidas, f"SET NULL sobre columnas NOT NULL: {invalidas}"
