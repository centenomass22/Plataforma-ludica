"""Pruebas de la interfaz y servicios principales."""

from fastapi.testclient import TestClient

from app import proyecto
from app.main import app

cliente = TestClient(app)


def test_inicio_muestra_cursos_y_opciones_de_aprendizaje():
    respuesta = cliente.get("/")
    assert respuesta.status_code == 200
    assert "¡Hola, explorador!" in respuesta.text
    assert "Pequeños científicos" in respuesta.text
    assert "La isla de los números" in respuesta.text
    assert "Historias fantásticas" in respuesta.text
    assert "El taller de colores" in respuesta.text
    assert 'id="dialogo-leccion"' in respuesta.text
    assert 'id="dialogo-aula"' in respuesta.text


def test_salud_responde_ok():
    respuesta = cliente.get("/salud")
    assert respuesta.status_code == 200
    assert respuesta.json() == {"estado": "ok"}


def test_api_version_devuelve_version_correcta():
    respuesta = cliente.get("/api/version")
    assert respuesta.status_code == 200
    assert respuesta.json() == {"version": proyecto.VERSION}


def test_api_devuelve_los_datos_del_proyecto():
    respuesta = cliente.get("/api/proyecto")
    assert respuesta.status_code == 200
    assert respuesta.json()["aprendiz"] == proyecto.APRENDIZ


def test_documentacion_disponible():
    assert cliente.get("/docs").status_code == 200


def test_manifest_de_la_pwa_es_valido():
    manifest = cliente.get("/static/manifest.json").json()
    assert manifest["display"] == "standalone"
    tamanos = {icono["sizes"] for icono in manifest["icons"]}
    assert {"192x192", "512x512"} <= tamanos
    for icono in manifest["icons"]:
        assert cliente.get(icono["src"]).status_code == 200


def test_service_worker_se_sirve_desde_la_raiz():
    respuesta = cliente.get("/sw.js")
    assert respuesta.status_code == 200
    assert "javascript" in respuesta.headers["content-type"]
