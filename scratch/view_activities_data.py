import os
from dotenv import load_dotenv
import pyodbc

load_dotenv()

def view_data():
    DB_DRIVER = os.getenv('DB_DRIVER', '{ODBC Driver 18 for SQL Server}')
    DB_SERVER = os.getenv('DB_SERVER', '100.117.127.91,1433')
    DB_NAME = os.getenv('DB_NAME', 'ParticipARD_DB')
    DB_USER = os.getenv('DB_USER', 'amigo')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '123456')

    conn_str = (
        f"DRIVER={DB_DRIVER};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
    )
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    print("--- PROVINCIAS ---")
    cursor.execute("SELECT ProvinciaID, Nombre FROM tblProvincias")
    for r in cursor.fetchall():
        print(f"ID: {r[0]} | Nombre: {r[1]}")
        
    print("\n--- TIPOS ACTIVIDAD ---")
    cursor.execute("SELECT TipoID, NombreTipo FROM tblTiposActividad")
    for r in cursor.fetchall():
        print(f"ID: {r[0]} | Nombre: {r[1]}")

    print("\n--- ACTIVIDADES ---")
    cursor.execute("""
        SELECT a.ActividadID, a.Titulo, a.Localidad, a.ProvinciaID, p.Nombre AS ProvinceName, a.TipoID
        FROM tblActividades a
        LEFT JOIN tblProvincias p ON a.ProvinciaID = p.ProvinciaID
    """)
    for r in cursor.fetchall():
        print(f"ID: {r[0]} | Title: {r[1]} | Localidad: {r[2]} | ProvID: {r[3]} | ProvName: {r[4]} | TipoID: {r[5]}")
        
    conn.close()

if __name__ == "__main__":
    view_data()
