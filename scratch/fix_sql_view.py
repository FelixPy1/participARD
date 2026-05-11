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

def fix_view():
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        sql = """
        ALTER VIEW vw_ActividadesActivas
        AS
        SELECT 
            A.ActividadID,
            A.Titulo,
            A.Tipo,
            I.Nombre AS Institucion,
            A.FechaCierre
        FROM tblActividades A
        INNER JOIN tblInstituciones I ON A.InstitucionID = I.InstitucionID
        WHERE (A.FechaCierre >= GETDATE() OR A.FechaCierre IS NULL);
        """
        cursor.execute(sql)
        conn.commit()
        print("Vista vw_ActividadesActivas actualizada correctamente.")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_view()
