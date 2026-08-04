"""Contratos entre frontend y backend, sin base de datos.

Estos tests cubren la clase de bug mas cara de la sesion anterior: el frontend
manda una clave, Pydantic la descarta en silencio (extra="ignore" por defecto)
y el endpoint devuelve 200 sin haber hecho nada. Aqui no hay 200 que enganie:
si la clave no existe en el schema, el test falla.
"""
import re
from pathlib import Path

import pytest
from sqlalchemy.orm import configure_mappers

from app import models, schemas
from tests.conftest import MODULOS

RAIZ = Path(__file__).resolve().parents[1]

# (schema de request, payload literal que manda el frontend, origen)
# Los payloads salen de frontend/src/services/ConfiguracionService.js y
# frontend/src/pages/Configuracion.jsx.
PAYLOADS_FRONTEND = [
    (schemas.UsuarioCreate,
     {"nombre": "Ana", "email": "ana@example.com", "password": "x",
      "rol_id": 2, "pais_id": ""},
     "Configuracion.jsx -> crearUsuario"),
    (schemas.UsuarioUpdate,
     {"nombre": "Ana", "email": "ana@example.com", "password": "",
      "rol_id": 3, "pais_id": ""},
     "Configuracion.jsx -> actualizarUsuario"),
    (schemas.RolPermisoUpdate,
     {"tiene_acceso": False},
     "ConfiguracionService.js -> actualizarPermisoRol"),
    (schemas.UsuarioPermisoUpdate,
     {"tiene_acceso": False},
     "ConfiguracionService.js -> actualizarPermisoUsuario"),
    (schemas.EstudioDiarioCreate,
     {"miembro_id": "M001", "pais_id": 1, "mes": 7, "anio": 2026, "dia": 15,
      "dijeron_si": 2, "nuevos_contactos": 3, "potenciales": 4},
     "EstudiosBiblicos.jsx -> guardarNuevosEstudiantes"),
]


@pytest.mark.parametrize("schema,payload,origen", PAYLOADS_FRONTEND)
def test_ninguna_clave_del_frontend_se_descarta(schema, payload, origen):
    """Cada clave enviada por la UI debe existir en el schema y sobrevivir."""
    desconocidas = set(payload) - set(schema.model_fields)
    assert not desconocidas, (
        f"{schema.__name__} descartaria en silencio {sorted(desconocidas)} "
        f"que la UI si manda ({origen})"
    )
    recibido = schema.model_validate(payload).model_dump(exclude_unset=True)
    assert set(recibido) == set(payload)


def test_tiene_acceso_conserva_el_valor_falso():
    """False no puede confundirse con 'no enviado' al resolver el permiso."""
    datos = schemas.RolPermisoUpdate.model_validate({"tiene_acceso": False})
    assert datos.model_dump(exclude_unset=True) == {"tiene_acceso": False}
    assert datos.tiene_acceso is False


def test_campos_numericos_vacios_se_vuelven_null():
    """Los <select> vacios mandan "" donde la BD espera un entero o NULL."""
    datos = schemas.UsuarioCreate.model_validate({
        "nombre": "Ana", "email": "ana@example.com", "password": "x",
        "rol_id": 2, "pais_id": "", "ciudad_id": "",
    })
    assert datos.pais_id is None and datos.ciudad_id is None


def test_usuario_out_expone_el_rol_real_como_rol_id():
    """La UI lee usuario.rol_id; si sale 0 rompe /roles/0/permisos."""
    salida = schemas.UsuarioOut.model_validate({
        "id": "U001", "nombre": "Ana", "email": "ana@example.com",
        "rol": 3, "activo": True, "fecha_registro": "2026-01-01T00:00:00",
    })
    assert salida.rol_id == 3


def test_rol_permiso_out_expone_activo_como_tiene_acceso():
    salida = schemas.RolPermisoOut.model_validate({
        "rol_id": 1, "permiso_id": 5, "activo": False,
    })
    assert salida.tiene_acceso is False


def test_los_modelos_configuran_sin_errores():
    """Una FK mal escrita ('public.usuarios.id') solo estalla al mapear."""
    configure_mappers()
    for tabla in models.Base.metadata.tables.values():
        for fk in tabla.foreign_keys:
            assert fk.column is not None


def test_el_catalogo_de_permisos_tiene_los_7_modulos():
    """El startup siembra public.permisos; la UI depende de esos 7 nombres."""
    fuente = (RAIZ / "app" / "main.py").read_text(encoding="utf-8")
    bloque = re.search(
        r"INSERT INTO permisos \(id, nombre\) VALUES(.*?)ON CONFLICT",
        fuente, re.S,
    )
    assert bloque, "desaparecio el seed del catalogo de permisos en main.py"
    sembrados = re.findall(r"\((\d+),\s*'([^']+)'\)", bloque.group(1))
    assert [(int(i), n) for i, n in sembrados] == MODULOS
