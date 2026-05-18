import os
from dotenv import load_dotenv
import pyodbc

load_dotenv()

def inspect():
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
    
    print("--- TABLES ---")
    cursor.execute("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'")
    tables = [row[0] for row in cursor.fetchall()]
    for t in sorted(tables):
        print(f"Table: {t}")
        cursor.execute(f"SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{t}'")
        for col in cursor.fetchall():
            print(f"  {col[0]} ({col[1]}, nullable={col[2]})")
            
    print("\n--- FOREIGN KEYS ---")
    cursor.execute("""
        SELECT 
            parent_table.name AS ParentTable,
            parent_column.name AS ParentColumn,
            referenced_table.name AS ReferencedTable,
            referenced_column.name AS ReferencedColumn
        FROM sys.foreign_key_columns fkc
        INNER JOIN sys.tables parent_table ON fkc.parent_object_id = parent_table.object_id
        INNER JOIN sys.columns parent_column ON fkc.parent_object_id = parent_column.object_id AND fkc.parent_column_id = parent_column.column_id
        INNER JOIN sys.tables referenced_table ON fkc.referenced_object_id = referenced_table.object_id
        INNER JOIN sys.columns referenced_column ON fkc.referenced_object_id = referenced_column.object_id AND fkc.referenced_column_id = referenced_column.column_id
    """)
    for fk in cursor.fetchall():
        print(f"FK: {fk[0]}.{fk[1]} -> {fk[2]}.{fk[3]}")
        
    conn.close()

if __name__ == "__main__":
    inspect()
