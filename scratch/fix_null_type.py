import os
from dotenv import load_dotenv
import pyodbc

load_dotenv()

def fix_null_type():
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
    
    print("Fixing null TipoID on activities...")
    cursor.execute("""
        UPDATE tblActividades
        SET TipoID = 3
        WHERE ActividadID = 41 AND TipoID IS NULL
    """)
    print(f"Updated null TipoID for Torneo de Programacion (ID 41): {cursor.rowcount}")
    
    conn.commit()
    conn.close()
    print("Fix complete!")

if __name__ == "__main__":
    fix_null_type()
