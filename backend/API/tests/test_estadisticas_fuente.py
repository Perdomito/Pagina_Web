"""Fuente de verdad de /estadisticas.

El mismo dato vivia en dos sitios: la tabla reportes (preagregada, ya sin nadie
que la escriba) y estudios_diarios (granular, la que alimenta Reportes.jsx y
EstudiosBiblicos.jsx). /estadisticas leia de reportes y ademas devolvia como
"estudios" el numero de FILAS de reportes, asi que la misma cifra salia
distinta en cada pantalla. Estos tests fijan estudios_diarios como fuente.
"""
import pytest
import pytest_asyncio

from app.models import Contacto, EstudioDiario, Miembro, Pais, Reporte


@pytest_asyncio.fixture
async def datos(datos_base):
    datos_base.add(Pais(id=1, iso="HN", nombre="Honduras"))
    datos_base.add(Pais(id=2, iso="GT", nombre="Guatemala"))
    datos_base.add_all([
        Miembro(id="M1", nombre="Ana", tipo_miembro="Comprometido", pais_id=1),
        Miembro(id="M2", nombre="Beto", tipo_miembro="Comprometido", pais_id=1),
    ])
    datos_base.add_all([
        Contacto(id=c, miembro_responsable="Ana", nombre=f"Contacto {c}", pais_id=1)
        for c in (100, 101, 102)
    ])

    # 5 estudios reales en 2026: 3 de Ana (a 2 contactos distintos) y 2 de Beto.
    estudios = [
        ("M1", 100, 1), ("M1", 100, 2), ("M1", 101, 2),
        ("M2", 102, 3), ("M2", 102, 3),
    ]
    for i, (miembro, contacto, mes) in enumerate(estudios):
        datos_base.add(EstudioDiario(
            miembro_id=miembro, contacto_id=contacto, pais_id=1,
            anio=2026, mes=mes, dia=1, horas=1.5,
        ))
    # Evangelismo: contacto_id NULL + tipo -> horas, no estudios.
    datos_base.add(EstudioDiario(
        miembro_id="M1", pais_id=1, anio=2026, mes=1, dia=2,
        tipo="Virtual", horas=4,
    ))
    datos_base.add(EstudioDiario(
        miembro_id="M2", pais_id=1, anio=2026, mes=1, dia=2,
        tipo="Presencial", horas=6,
    ))
    # Contadores diarios: ambos NULL -> no son ni estudio ni evangelismo.
    datos_base.add(EstudioDiario(
        miembro_id="M1", pais_id=1, anio=2026, mes=1, dia=3,
        nuevos_contactos=9, dijeron_si=4, potenciales=2,
    ))
    # Estudio de otro pais y de otro anio: no deben contarse al filtrar.
    datos_base.add(EstudioDiario(
        miembro_id="M1", contacto_id=100, pais_id=2, anio=2026, mes=1, dia=1,
    ))
    datos_base.add(EstudioDiario(
        miembro_id="M1", contacto_id=100, pais_id=1, anio=2025, mes=1, dia=1,
    ))

    # Tabla reportes con numeros deliberadamente distintos: si /estadisticas
    # volviera a leer de aqui, los tests de abajo fallarian.
    from datetime import date
    for dia in range(1, 8):
        datos_base.add(Reporte(
            miembro_que_reporta="Ana", miembro_id="M1", pais_id=1,
            fecha=date(2026, 1, dia), numero_estudios_dados=99,
            total_estudiantes=77,
        ))
    await datos_base.commit()
    return datos_base


@pytest.mark.asyncio
async def test_total_estudios_cuenta_estudios_no_filas_de_reportes(cliente, datos):
    stats = (await cliente.get("/estadisticas", params={"anio": 2026, "pais_id": 1})).json()
    # 5 estudios reales. Antes devolvia 7 (las filas de reportes) y la suma de
    # numero_estudios_dados habria dado 693.
    assert stats["total_estudios"] == 5


@pytest.mark.asyncio
async def test_el_evangelismo_y_los_contadores_no_cuentan_como_estudios(cliente, datos):
    stats = (await cliente.get("/estadisticas", params={"anio": 2026, "pais_id": 1})).json()
    assert stats["total_estudios"] == 5  # las 2 filas de tipo y la de contadores quedan fuera


@pytest.mark.asyncio
async def test_filtra_por_pais_y_por_anio(cliente, datos):
    solo_gt = (await cliente.get("/estadisticas", params={"anio": 2026, "pais_id": 2})).json()
    assert solo_gt["total_estudios"] == 1

    anio_pasado = (await cliente.get("/estadisticas", params={"anio": 2025, "pais_id": 1})).json()
    assert anio_pasado["total_estudios"] == 1


@pytest.mark.asyncio
async def test_la_comparacion_mensual_deja_de_salir_en_cero(cliente, datos):
    """La query agrupaba por (anio, mes) pero solo seleccionaba mes, y el bucle
    que rellenaba la serie era un 'pass': las dos series salian planas."""
    stats = (await cliente.get("/estadisticas", params={"anio": 2026, "pais_id": 1})).json()
    serie = stats["comparacion_estudios"]["serie_actual"]["data"]
    assert serie[0] == 1   # enero: 1 estudio
    assert serie[1] == 2   # febrero: 2
    assert serie[2] == 2   # marzo: 2
    assert sum(serie) == stats["total_estudios"]

    anterior = stats["comparacion_estudios"]["serie_anterior"]
    assert anterior is not None and sum(anterior["data"]) == 1  # el estudio de 2025


@pytest.mark.asyncio
async def test_rendimiento_por_profesor_sale_de_los_estudios(cliente, datos):
    stats = (await cliente.get("/estadisticas", params={"anio": 2026, "pais_id": 1})).json()
    por_nombre = {p["nombre"]: p["total_estudios"] for p in stats["rendimiento_profesores"]["profesores"]}
    assert por_nombre == {"Ana": 3, "Beto": 2}


@pytest.mark.asyncio
async def test_las_horas_de_evangelismo_salen_de_las_filas_con_tipo(cliente, datos):
    stats = (await cliente.get("/estadisticas", params={"anio": 2026, "pais_id": 1})).json()
    por_nombre = {p["nombre"]: p["total_horas"] for p in stats["evangelismo_profesores"]["profesores"]}
    # Solo las filas de evangelismo (4h y 6h); las 1.5h de cada estudio no suman.
    assert por_nombre == {"Beto": 6.0, "Ana": 4.0}


@pytest.mark.asyncio
async def test_crecimiento_cuenta_estudiantes_distintos_por_mes(cliente, datos):
    stats = (await cliente.get("/estadisticas", params={"anio": 2026, "pais_id": 1})).json()
    serie = stats["crecimiento_estudiantes"]["serie"]
    assert serie[0] == 1  # enero: contacto 100
    assert serie[1] == 2  # febrero: contactos 100 y 101
    assert serie[2] == 1  # marzo: contacto 102 dos veces -> un estudiante


@pytest.mark.asyncio
async def test_los_anios_disponibles_salen_de_los_estudios(cliente, datos):
    stats = (await cliente.get("/estadisticas", params={"anio": 2026, "pais_id": 1})).json()
    assert stats["anios_disponibles"] == [2026, 2025]
