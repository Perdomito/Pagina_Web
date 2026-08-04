"""Iglesias por ciudad.

El contador "cantidad de iglesias" de Estadisticas sale de esta tabla, asi que
lo que importa es que cada iglesia quede atada a su ciudad y a su pais.
"""
import pytest
import pytest_asyncio

from app.models import Ciudad, Pais


@pytest_asyncio.fixture
async def geografia(datos_base):
    """Un pais con dos ciudades, como el selector del formulario."""
    datos_base.add(Pais(id=1, iso="HN", nombre="Honduras"))
    datos_base.add(Pais(id=2, iso="GT", nombre="Guatemala"))
    datos_base.add_all([
        Ciudad(id=10, nombre="Tegucigalpa", pais_iso2="HN"),
        Ciudad(id=11, nombre="San Pedro Sula", pais_iso2="HN"),
        Ciudad(id=20, nombre="Ciudad de Guatemala", pais_iso2="GT"),
    ])
    await datos_base.commit()
    return datos_base


@pytest.mark.asyncio
async def test_crear_iglesia_en_una_ciudad(cliente, geografia):
    respuesta = await cliente.post(
        "/iglesias",
        json={"ciudad_id": 10, "nombre": "Iglesia Central", "pastor_encargado_nombre": "Luis"},
    )
    assert respuesta.status_code == 201, respuesta.text
    creada = respuesta.json()
    assert creada["nombre"] == "Iglesia Central"
    assert creada["ciudad_nombre"] == "Tegucigalpa"
    # pais_id no se manda: se resuelve desde la ciudad
    assert creada["pais_id"] == 1
    assert creada["pais_nombre"] == "Honduras"
    assert creada["activa"] is True


@pytest.mark.asyncio
async def test_no_se_crea_en_una_ciudad_inexistente(cliente, geografia):
    respuesta = await cliente.post(
        "/iglesias", json={"ciudad_id": 999, "nombre": "Fantasma"}
    )
    assert respuesta.status_code == 404


@pytest.mark.asyncio
async def test_el_nombre_es_obligatorio(cliente, geografia):
    respuesta = await cliente.post("/iglesias", json={"ciudad_id": 10, "nombre": "   "})
    assert respuesta.status_code == 422


@pytest.mark.asyncio
async def test_los_campos_vacios_del_formulario_no_rompen(cliente, geografia):
    """Los <select> e <input> en blanco mandan "" donde la BD espera int/date."""
    respuesta = await cliente.post(
        "/iglesias",
        json={"ciudad_id": 10, "nombre": "Iglesia Norte", "pais_id": "",
              "pastor_encargado_id": "", "fecha_apertura": "",
              "cantidad_miembros": "", "direccion": ""},
    )
    assert respuesta.status_code == 201, respuesta.text
    creada = respuesta.json()
    assert creada["cantidad_miembros"] == 0
    assert creada["fecha_apertura"] is None
    assert creada["pais_id"] == 1  # resuelto desde la ciudad pese al "" recibido


@pytest.mark.asyncio
async def test_listar_filtra_por_pais_y_por_ciudad(cliente, geografia):
    for ciudad_id, nombre in [(10, "Central"), (11, "Sula"), (20, "Guate")]:
        await cliente.post("/iglesias", json={"ciudad_id": ciudad_id, "nombre": nombre})

    de_honduras = (await cliente.get("/iglesias", params={"pais_id": 1})).json()
    assert sorted(i["nombre"] for i in de_honduras) == ["Central", "Sula"]

    de_ciudad = (await cliente.get("/iglesias", params={"ciudad_id": 11})).json()
    assert [i["nombre"] for i in de_ciudad] == ["Sula"]


@pytest.mark.asyncio
async def test_conteo_por_pais_solo_cuenta_las_activas(cliente, geografia):
    await cliente.post("/iglesias", json={"ciudad_id": 10, "nombre": "Central"})
    cerrada = (await cliente.post("/iglesias", json={"ciudad_id": 11, "nombre": "Sula"})).json()
    await cliente.post("/iglesias", json={"ciudad_id": 20, "nombre": "Guate"})

    await cliente.patch(f"/iglesias/{cerrada['id']}", json={"activa": False})

    conteo = (await cliente.get("/iglesias/conteo-por-pais")).json()
    assert {c["pais_id"]: c["cantidad"] for c in conteo} == {1: 1, 2: 1}


@pytest.mark.asyncio
async def test_mover_la_iglesia_de_ciudad_recalcula_el_pais(cliente, geografia):
    creada = (await cliente.post("/iglesias", json={"ciudad_id": 10, "nombre": "Central"})).json()

    movida = (
        await cliente.patch(f"/iglesias/{creada['id']}", json={"ciudad_id": 20})
    ).json()

    assert movida["ciudad_nombre"] == "Ciudad de Guatemala"
    assert movida["pais_id"] == 2


@pytest.mark.asyncio
async def test_eliminar_iglesia(cliente, geografia):
    creada = (await cliente.post("/iglesias", json={"ciudad_id": 10, "nombre": "Central"})).json()

    assert (await cliente.delete(f"/iglesias/{creada['id']}")).status_code == 204
    assert (await cliente.get(f"/iglesias/{creada['id']}")).status_code == 404
    assert (await cliente.get("/iglesias")).json() == []


@pytest.mark.asyncio
async def test_estadisticas_cuenta_las_iglesias_del_pais(cliente, geografia):
    await cliente.post("/iglesias", json={"ciudad_id": 10, "nombre": "Central"})
    await cliente.post("/iglesias", json={"ciudad_id": 11, "nombre": "Sula"})
    await cliente.post("/iglesias", json={"ciudad_id": 20, "nombre": "Guate"})

    stats = (await cliente.get("/estadisticas", params={"pais_id": 1, "anio": 2026})).json()
    assert stats["resumen_pais"]["cantidad_iglesias"] == 2
    assert stats["resumen_pais"]["nombre_pais"] == "Honduras"
