"""Detalle estructurado del Seguimiento de Leyes: examen y entrevista.

El estado del flujo vive en seguimiento_leyes (una fila por persona) y las
etapas en seguimiento_leyes_historial. Estas dos tablas solo anaden los campos
que el historial no puede guardar (nota del examen, veredicto de la entrevista)
y van 1:1 contra el seguimiento para no duplicar el estado.
"""
import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.models import (
    Contacto, Entrevista, ExamenRomanos, Miembro, Pais, SeguimientoLey,
)


async def _cargar(sesion) -> SeguimientoLey:
    """En async las relaciones no se cargan solas: hay que pedirlas explicitamente."""
    sesion.expire_all()
    return (await sesion.execute(
        select(SeguimientoLey)
        .options(
            selectinload(SeguimientoLey.examen).selectinload(ExamenRomanos.evaluador_rel),
            selectinload(SeguimientoLey.entrevista).selectinload(Entrevista.entrevistador_rel),
        )
        .where(SeguimientoLey.id == 7)
    )).scalar_one()


@pytest_asyncio.fixture
async def seguimiento(datos_base):
    datos_base.add(Pais(id=1, iso="HN", nombre="Honduras"))
    datos_base.add_all([
        # Quien contacto y quien dio los estudios son personas distintas.
        Miembro(id="M1", nombre="Ana", tipo_miembro="Comprometido", pais_id=1),
        Miembro(id="M2", nombre="Beto", tipo_miembro="Comprometido", pais_id=1),
        Miembro(id="M3", nombre="Pastor Caleb", tipo_miembro="Comprometido", pais_id=1),
    ])
    datos_base.add(Contacto(id=100, miembro_responsable="Ana", nombre="Dina", pais_id=1))
    await datos_base.flush()

    obj = SeguimientoLey(
        id=7, contacto_id=100, pais_id=1,
        miembro_contacto_id="M1", miembro_estudios_id="M2",
        estado_actual="Examen de Romanos", etapa_actual_orden=3,
    )
    datos_base.add(obj)
    await datos_base.commit()
    return datos_base


@pytest.mark.asyncio
async def test_el_seguimiento_separa_quien_contacto_de_quien_dio_estudios(seguimiento):
    obj = await seguimiento.get(SeguimientoLey, 7)
    assert obj.miembro_contacto_id == "M1"
    assert obj.miembro_estudios_id == "M2"


@pytest.mark.asyncio
async def test_guarda_la_nota_del_examen_contra_el_seguimiento(seguimiento):
    seguimiento.add(ExamenRomanos(
        seguimiento_id=7, nota=85, aprobado=True, evaluador_id="M3",
        observaciones="Buen manejo de Romanos 1-8",
    ))
    await seguimiento.commit()

    obj = await _cargar(seguimiento)
    assert float(obj.examen.nota) == 85.0
    assert float(obj.examen.nota_maxima) == 100.0
    assert obj.examen.aprobado is True
    assert obj.examen.evaluador_rel.nombre == "Pastor Caleb"


@pytest.mark.asyncio
async def test_guarda_el_veredicto_de_la_entrevista(seguimiento):
    seguimiento.add(Entrevista(
        seguimiento_id=7, entrevistador_id="M3",
        resultado="Aprobado", tipo_miembro_resultante="Comprometido",
    ))
    await seguimiento.commit()

    obj = await _cargar(seguimiento)
    assert obj.entrevista.resultado == "Aprobado"
    assert obj.entrevista.tipo_miembro_resultante == "Comprometido"
    assert obj.entrevista.entrevistador_rel.nombre == "Pastor Caleb"


@pytest.mark.asyncio
async def test_el_entrevistador_puede_no_ser_un_miembro_registrado(seguimiento):
    seguimiento.add(Entrevista(
        seguimiento_id=7, entrevistador_nombre="Visitante externo", resultado="Pendiente",
    ))
    await seguimiento.commit()

    obj = await _cargar(seguimiento)
    assert obj.entrevista.entrevistador_id is None
    assert obj.entrevista.entrevistador_nombre == "Visitante externo"


@pytest.mark.asyncio
async def test_la_entrevista_empieza_pendiente(seguimiento):
    seguimiento.add(Entrevista(seguimiento_id=7))
    await seguimiento.commit()

    obj = await _cargar(seguimiento)
    assert obj.entrevista.resultado == "Pendiente"


@pytest.mark.asyncio
@pytest.mark.parametrize("modelo", [ExamenRomanos, Entrevista])
async def test_no_se_puede_registrar_dos_veces_para_el_mismo_seguimiento(seguimiento, modelo):
    """El UNIQUE sobre seguimiento_id es lo que hace real el 1:1."""
    seguimiento.add(modelo(seguimiento_id=7))
    await seguimiento.commit()

    seguimiento.add(modelo(seguimiento_id=7))
    with pytest.raises(IntegrityError):
        await seguimiento.commit()
    await seguimiento.rollback()


@pytest.mark.asyncio
@pytest.mark.parametrize("modelo", [ExamenRomanos, Entrevista])
async def test_borrar_el_seguimiento_se_lleva_su_detalle(seguimiento, modelo):
    seguimiento.add(modelo(seguimiento_id=7))
    await seguimiento.commit()

    obj = await _cargar(seguimiento)
    await seguimiento.delete(obj)
    await seguimiento.commit()

    assert (await seguimiento.execute(select(modelo))).scalars().all() == []


@pytest.mark.asyncio
async def test_un_seguimiento_sin_examen_ni_entrevista_no_falla(seguimiento):
    """Las etapas previas (Potencial, Ley 1-4) no crean estas filas."""
    obj = await _cargar(seguimiento)
    assert obj.examen is None
    assert obj.entrevista is None
