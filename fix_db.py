from app import get_db_connection
import pyodbc

def fix_database():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("Checking for EstadoInscripcion in tblInscripciones...")
        try:
            cursor.execute("ALTER TABLE tblInscripciones ADD EstadoInscripcion NVARCHAR(50) DEFAULT 'Activa';")
            conn.commit()
            print("Added EstadoInscripcion column successfully.")
        except Exception as e:
            if "already exists" in str(e) or "Column names in each table must be unique" in str(e):
                print("EstadoInscripcion column already exists.")
            else:
                print(f"Error adding column: {e}")

        # Ensure tblActividades has the necessary columns too (from alter_table.py logic)
        try:
            cursor.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblActividades') AND name = 'Estado') ALTER TABLE tblActividades ADD Estado NVARCHAR(20) DEFAULT 'Activa';")
            cursor.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblActividades') AND name = 'FechaInicio') ALTER TABLE tblActividades ADD FechaInicio DATE;")
            cursor.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblActividades') AND name = 'ImagenURL') ALTER TABLE tblActividades ADD ImagenURL NVARCHAR(MAX);")
            cursor.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblActividades') AND name = 'SitioOficialURL') ALTER TABLE tblActividades ADD SitioOficialURL NVARCHAR(MAX);")
            conn.commit()
            print("Checked/Added tblActividades columns.")
        except Exception as e:
            print(f"Error updating tblActividades: {e}")

        conn.close()
        print("Database fix completed.")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    fix_database()
