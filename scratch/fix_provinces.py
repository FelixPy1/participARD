import os
from dotenv import load_dotenv
import pyodbc

load_dotenv()

def fix_provinces():
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
    
    print("Migrating ProvinciaID on existing activities...")
    
    # Santo Domingo: 1
    # Santiago: 2
    # Internacional: 3
    
    cursor.execute("""
        UPDATE tblActividades
        SET ProvinciaID = 1
        WHERE LOWER(Localidad) LIKE '%santo domingo%'
    """)
    print(f"Updated Santo Domingo activities: {cursor.rowcount}")
    
    cursor.execute("""
        UPDATE tblActividades
        SET ProvinciaID = 2
        WHERE LOWER(Localidad) LIKE '%santiago%'
    """)
    print(f"Updated Santiago activities: {cursor.rowcount}")
    
    cursor.execute("""
        UPDATE tblActividades
        SET ProvinciaID = 3
        WHERE ProvinciaID IS NULL
    """)
    print(f"Updated remaining null province activities to Internacional: {cursor.rowcount}")
    
    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    fix_provinces()
