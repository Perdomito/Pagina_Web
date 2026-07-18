"""Endpoints de /usuarios ejercitados de extremo a extremo contra SQLite."""
import pytest
from sqlalchemy import select

from app.models import Usuario, UsuarioPermiso


async def test_crea_usuario_sin_id_generando_consecutivo(cliente, usuario_payload):
    r = await cliente.post("/usuarios", json=usuario_payload)
    assert r.status_code == 201, r.text
    assert r.json()["id"] == "U001"

    usuario_payload["email"] = "otra@example.com"
    r2 = await cliente.post("/usuarios", json=usuario_payload)
    assert r2.json()["id"] == "U002"


async def test_el_consecutivo_continua_desde_el_id_mas_alto(cliente, datos_base, usuario_payload):
    datos_base.add_all([
        Usuario(id="U009", nombre="A", email="a@x.com", password_hash="h", rol=2),
        # Ids que no siguen el patron no deben romper la generacion.
        Usuario(id="ADMIN", nombre="B", email="b@x.com", password_hash="h", rol=1),
    ])
    await datos_base.commit()

    r = await cliente.post("/usuarios", json=usuario_payload)
    assert r.status_code == 201, r.text
    assert r.json()["id"] == "U010"


async def test_respeta_el_id_explicito(cliente, usuario_payload):
    usuario_payload["id"] = "U042"
    r = await cliente.post("/usuarios", json=usuario_payload)
    assert r.json()["id"] == "U042"


async def test_el_payload_del_formulario_no_da_422(cliente, usuario_payload):
    """rol_id en vez de rol, sin id y con pais_id vacio: el dialecto de la UI."""
    r = await cliente.post("/usuarios", json=usuario_payload)
    assert r.status_code == 201, r.text
    cuerpo = r.json()
    assert cuerpo["rol"] == 2 and cuerpo["rol_id"] == 2
    assert cuerpo["pais_id"] is None


async def test_sin_rol_ni_rol_id_responde_422(cliente, usuario_payload):
    usuario_payload.pop("rol_id")
    r = await cliente.post("/usuarios", json=usuario_payload)
    assert r.status_code == 422


@pytest.mark.parametrize("campo,valor,esperado", [
    ("id", "U001", "id"),
    ("email", "base@example.com", "email"),
])
async def test_duplicados_responden_400_con_mensaje(
    cliente, usuario, usuario_payload, campo, valor, esperado,
):
    usuario_payload[campo] = valor
    r = await cliente.post("/usuarios", json=usuario_payload)
    assert r.status_code == 400
    assert esperado in r.json()["detail"]


async def test_listar_devuelve_rol_id_real(cliente, usuario):
    r = await cliente.get("/usuarios")
    assert r.status_code == 200
    assert [u["rol_id"] for u in r.json()] == [2]


async def test_patch_con_rol_id_cambia_el_rol(cliente, usuario):
    r = await cliente.patch("/usuarios/U001", json={"rol_id": 1})
    assert r.status_code == 200, r.text
    assert r.json()["rol"] == 1 and r.json()["rol_id"] == 1


async def test_patch_con_password_vacia_no_borra_la_password(cliente, usuario, datos_base):
    """El formulario de edicion manda password:"" cuando no se cambia."""
    r = await cliente.patch(
        "/usuarios/U001",
        json={"nombre": "Base Editado", "password": "", "rol_id": 2, "pais_id": ""},
    )
    assert r.status_code == 200, r.text
    await datos_base.refresh(usuario)
    assert usuario.password_hash == "hash-original"
    assert usuario.nombre == "Base Editado"


async def test_patch_con_password_nueva_si_la_cambia(cliente, usuario, datos_base):
    r = await cliente.patch("/usuarios/U001", json={"password": "nueva-clave"})
    assert r.status_code == 200
    await datos_base.refresh(usuario)
    assert usuario.password_hash != "hash-original"


async def test_patch_a_usuario_inexistente_da_404(cliente):
    r = await cliente.patch("/usuarios/NOPE", json={"nombre": "x"})
    assert r.status_code == 404


# ── Permisos por usuario ───────────────────────────────────────────────────

async def test_agregar_permiso_usa_el_id_del_path(cliente, usuario, datos_base):
    r = await cliente.post(
        "/usuarios/U001/permisos",
        json={"usuario_id": "OTRO", "permiso_id": 5, "tiene_acceso": True},
    )
    assert r.status_code == 201, r.text
    assert r.json()["usuario_id"] == "U001"

    filas = (await datos_base.execute(select(UsuarioPermiso))).scalars().all()
    assert [f.usuario_id for f in filas] == ["U001"]


async def test_permiso_duplicado_responde_400_no_500(cliente, usuario):
    cuerpo = {"usuario_id": "U001", "permiso_id": 5, "tiene_acceso": True}
    assert (await cliente.post("/usuarios/U001/permisos", json=cuerpo)).status_code == 201
    r = await cliente.post("/usuarios/U001/permisos", json=cuerpo)
    assert r.status_code == 400


async def test_patch_crea_el_permiso_si_no_existe(cliente, usuario):
    r = await cliente.patch("/usuarios/U001/permisos/5", json={"tiene_acceso": True})
    assert r.status_code == 200, r.text
    assert r.json()["tiene_acceso"] is True


async def test_patch_desactiva_un_permiso_existente(cliente, usuario, datos_base):
    await cliente.patch("/usuarios/U001/permisos/5", json={"tiene_acceso": True})
    r = await cliente.patch("/usuarios/U001/permisos/5", json={"tiene_acceso": False})
    assert r.status_code == 200
    assert r.json()["tiene_acceso"] is False

    fila = (await datos_base.execute(select(UsuarioPermiso))).scalar_one()
    await datos_base.refresh(fila)
    assert fila.tiene_acceso is False


async def test_patch_de_permiso_sobre_usuario_inexistente_da_404(cliente):
    r = await cliente.patch("/usuarios/NOPE/permisos/5", json={"tiene_acceso": True})
    assert r.status_code == 404


async def test_eliminar_permiso_inexistente_da_404(cliente, usuario):
    r = await cliente.delete("/usuarios/U001/permisos/5")
    assert r.status_code == 404
