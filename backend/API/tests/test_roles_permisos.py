"""Endpoints de /roles/{id}/permisos: upsert, dialecto de la UI y catalogo."""
from sqlalchemy import select

from app.models import RolPermiso


async def test_patch_crea_la_fila_si_el_rol_no_tenia_ese_permiso(cliente, datos_base):
    """Antes devolvia 404: el rol existe pero la fila rol_permisos no."""
    r = await cliente.patch("/roles/2/permisos/5", json={"tiene_acceso": True})
    assert r.status_code == 200, r.text
    cuerpo = r.json()
    assert cuerpo["rol_id"] == 2 and cuerpo["permiso_id"] == 5
    assert cuerpo["activo"] is True and cuerpo["tiene_acceso"] is True

    fila = (await datos_base.execute(select(RolPermiso))).scalar_one()
    assert fila.activo is True


async def test_patch_con_tiene_acceso_false_desactiva_de_verdad(cliente, datos_base):
    """La UI manda tiene_acceso; si el schema solo mira 'activo' no pasa nada."""
    datos_base.add(RolPermiso(rol_id=2, permiso_id=5, activo=True))
    await datos_base.commit()

    r = await cliente.patch("/roles/2/permisos/5", json={"tiene_acceso": False})
    assert r.status_code == 200, r.text
    assert r.json()["tiene_acceso"] is False

    fila = (await datos_base.execute(select(RolPermiso))).scalar_one()
    await datos_base.refresh(fila)
    assert fila.activo is False


async def test_patch_acepta_tambien_el_nombre_activo(cliente, datos_base):
    datos_base.add(RolPermiso(rol_id=2, permiso_id=5, activo=True))
    await datos_base.commit()

    r = await cliente.patch("/roles/2/permisos/5", json={"activo": False})
    assert r.status_code == 200
    assert r.json()["activo"] is False


async def test_patch_sobre_rol_inexistente_da_404(cliente):
    r = await cliente.patch("/roles/999/permisos/5", json={"tiene_acceso": True})
    assert r.status_code == 404


async def test_listar_permisos_incluye_el_nombre_del_modulo(cliente, datos_base):
    datos_base.add_all([
        RolPermiso(rol_id=1, permiso_id=1, activo=True),
        RolPermiso(rol_id=1, permiso_id=5, activo=False),
    ])
    await datos_base.commit()

    r = await cliente.get("/roles/1/permisos")
    assert r.status_code == 200, r.text
    filas = r.json()
    assert [f["nombre"] for f in filas] == ["Bible Studies", "Administration"]
    assert [f["tiene_acceso"] for f in filas] == [True, False]


async def test_listar_permisos_de_un_rol_sin_filas_devuelve_lista_vacia(cliente):
    r = await cliente.get("/roles/2/permisos")
    assert r.status_code == 200 and r.json() == []


async def test_agregar_permiso_usa_el_rol_del_path(cliente, datos_base):
    r = await cliente.post(
        "/roles/2/permisos",
        json={"rol_id": 1, "permiso_id": 5, "activo": True},
    )
    assert r.status_code == 201, r.text
    assert r.json()["rol_id"] == 2

    fila = (await datos_base.execute(select(RolPermiso))).scalar_one()
    assert fila.rol_id == 2


async def test_agregar_permiso_duplicado_responde_400_no_500(cliente):
    cuerpo = {"rol_id": 2, "permiso_id": 5, "activo": True}
    assert (await cliente.post("/roles/2/permisos", json=cuerpo)).status_code == 201
    r = await cliente.post("/roles/2/permisos", json=cuerpo)
    assert r.status_code == 400


async def test_agregar_permiso_a_rol_inexistente_da_404(cliente):
    r = await cliente.post(
        "/roles/999/permisos", json={"rol_id": 999, "permiso_id": 5, "activo": True},
    )
    assert r.status_code == 404
