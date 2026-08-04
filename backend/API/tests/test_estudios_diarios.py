"""Registro diario de estudios biblicos.

La UI guarda dijeron_si, nuevos_contactos y potenciales dia a dia; si alguno de
esos contadores no vuelve del GET, los reportes del mes salen incompletos.
"""
import pytest


PAYLOAD = {
    "miembro_id": "M001",
    "pais_id": 1,
    "mes": 7,
    "anio": 2026,
    "dia": 15,
    "dijeron_si": 2,
    "nuevos_contactos": 3,
    "potenciales": 4,
}


@pytest.mark.asyncio
async def test_los_contadores_diarios_sobreviven_al_guardado(cliente):
    respuesta = await cliente.post("/estudios-diarios", json=PAYLOAD)
    assert respuesta.status_code == 201, respuesta.text
    creado = respuesta.json()
    assert creado["potenciales"] == 4
    assert creado["dijeron_si"] == 2
    assert creado["nuevos_contactos"] == 3

    listado = await cliente.get("/estudios-diarios", params={"anio": 2026, "mes": 7})
    assert listado.status_code == 200
    fila = next(r for r in listado.json() if r["id"] == creado["id"])
    assert fila["potenciales"] == 4


@pytest.mark.asyncio
async def test_potenciales_por_defecto_es_cero(cliente):
    """Los dias que solo registran evangelismo no mandan el campo."""
    payload = {k: v for k, v in PAYLOAD.items() if k != "potenciales"}
    respuesta = await cliente.post("/estudios-diarios", json=payload)
    assert respuesta.status_code == 201, respuesta.text
    assert respuesta.json()["potenciales"] == 0


@pytest.mark.asyncio
async def test_reenviar_el_mismo_dia_no_duplica_filas(cliente):
    """La UI reenvia el dia entero en cada tecla; debe quedar una sola fila."""
    primera = (await cliente.post("/estudios-diarios", json=PAYLOAD)).json()
    segunda = (
        await cliente.post("/estudios-diarios", json={**PAYLOAD, "potenciales": 12})
    ).json()

    assert segunda["id"] == primera["id"]
    assert segunda["potenciales"] == 12

    filas = (await cliente.get("/estudios-diarios", params={"anio": 2026, "mes": 7})).json()
    del_dia = [r for r in filas if r["dia"] == 15 and r["miembro_id"] == "M001"]
    assert len(del_dia) == 1
    assert del_dia[0]["potenciales"] == 12


@pytest.mark.asyncio
async def test_el_evangelismo_no_pisa_los_contadores_del_dia(cliente):
    """Las filas con tipo (evangelismo) siguen siendo registros independientes."""
    contadores = (await cliente.post("/estudios-diarios", json=PAYLOAD)).json()
    evangelismo = (
        await cliente.post(
            "/estudios-diarios",
            json={"miembro_id": "M001", "pais_id": 1, "mes": 7, "anio": 2026,
                  "dia": 15, "tipo": "Virtual", "donde": "Zoom", "horas": 2},
        )
    ).json()

    assert evangelismo["id"] != contadores["id"]
    assert evangelismo["tipo"] == "Virtual"


@pytest.mark.asyncio
async def test_patch_actualiza_solo_potenciales(cliente):
    creado = (await cliente.post("/estudios-diarios", json=PAYLOAD)).json()

    respuesta = await cliente.patch(
        f"/estudios-diarios/{creado['id']}", json={"potenciales": 9}
    )
    assert respuesta.status_code == 200, respuesta.text
    actualizado = respuesta.json()
    assert actualizado["potenciales"] == 9
    assert actualizado["dijeron_si"] == 2
