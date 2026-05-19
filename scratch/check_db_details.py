import os
from dotenv import load_dotenv
import pyodbc

load_dotenv()

def check_details():
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
    
    print("--- COLUMNS IN tblUsuarios ---")
    cursor.execute("SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblUsuarios'")
    for row in cursor.fetchall():
        print(f"Column: {row[0]}, Type: {row[1]}, Nullable: {row[2]}")
        
    print("\n--- CHECK CONSTRAINTS IN tblUsuarios ---")
    cursor.execute("""
        SELECT OBJECT_NAME(parent_object_id) AS TableName, name AS ConstraintName, definition
        FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID('tblUsuarios')
    """)
    for row in cursor.fetchall():
        print(f"Constraint: {row[1]}, Def: {row[2]}")
        
    print("\n--- STORED PROCEDURES ---")
    cursor.execute("SELECT name FROM sys.procedures WHERE name = 'sp_RegistrarIntentoLogin'")
    proc = cursor.fetchone()
    if proc:
        print(f"Procedure: {proc[0]} exists.")
    else:
        print("Procedure sp_RegistrarIntentoLogin does NOT exist!")
        
    conn.close()

if __name__ == "__main__":
    check_details()
