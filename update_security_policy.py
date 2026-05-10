import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

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

def run_update():
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        print("Añadiendo columnas de seguridad a tblUsuarios...")
        
        # SQL para añadir columnas si no existen
        sql = """
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblUsuarios') AND name = 'IntentosFallidos')
        ALTER TABLE tblUsuarios ADD IntentosFallidos INT DEFAULT 0;

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblUsuarios') AND name = 'BloqueadoHasta')
        ALTER TABLE tblUsuarios ADD BloqueadoHasta DATETIME NULL;

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblUsuarios') AND name = 'FechaUltimoCambioPassword')
        ALTER TABLE tblUsuarios ADD FechaUltimoCambioPassword DATETIME DEFAULT GETDATE();
        """
        
        cursor.execute(sql)
        conn.commit()
        
        # Actualizar registros existentes para que no tengan NULL en la fecha de cambio
        cursor.execute("UPDATE tblUsuarios SET FechaUltimoCambioPassword = GETDATE() WHERE FechaUltimoCambioPassword IS NULL")
        cursor.execute("UPDATE tblUsuarios SET IntentosFallidos = 0 WHERE IntentosFallidos IS NULL")
        conn.commit()
        
        print("Base de datos actualizada exitosamente.")
        conn.close()
    except Exception as e:
        print(f"Error actualizando la base de datos: {e}")

if __name__ == "__main__":
    run_update()
