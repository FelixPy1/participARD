import requests
import json

data = {
    "Titulo": "Prueba Notificacion Email 2",
    "Descripcion": "Esto es una prueba para ver si funciona el email",
    "Tipo": "Voluntariado",
    "FechaCierre": "2026-12-31",
    "Localidad": "Santo Domingo",
    "Provincia": "Distrito Nacional",
    "InstitucionNombre": "Test Org",
    "ImagenURL": "",
    "SitioOficialURL": "",
    "modifier": "Admin"
}

try:
    response = requests.post("http://localhost:5000/api/activities", json=data)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
