import os
from dotenv import load_dotenv
import pyodbc

load_dotenv()

def migrate():
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
    
    print("Connecting to database...")
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    try:
        # Step 1: Drop unused test/lock tables
        print("Dropping unused test and block tables...")
        for tbl in ['tblPrueba', 'tblPruebaBloqueo', 'tblBloqueoOK', 'Bloqueo']:
            try:
                cursor.execute(f"IF OBJECT_ID('{tbl}', 'U') IS NOT NULL DROP TABLE {tbl};")
                print(f"  Dropped {tbl} (or it did not exist)")
            except Exception as ex:
                print(f"  Error dropping {tbl}: {ex}")
        conn.commit()

        # Step 2: Seed tblProvincias with default entries if not present
        print("Ensuring tblProvincias has standard rows...")
        for prov in ['Santo Domingo', 'Santiago', 'Internacional']:
            cursor.execute("SELECT 1 FROM tblProvincias WHERE Nombre = ?", (prov,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO tblProvincias (Nombre) VALUES (?)", (prov,))
                print(f"  Seeded province: {prov}")
        conn.commit()

        # Step 3: Create tblTiposActividad if it doesn't exist
        print("Checking/Creating tblTiposActividad...")
        cursor.execute("""
            IF OBJECT_ID('tblTiposActividad', 'U') IS NULL
            BEGIN
                CREATE TABLE tblTiposActividad (
                    TipoID INT IDENTITY(1,1) PRIMARY KEY,
                    NombreTipo VARCHAR(50) NOT NULL UNIQUE
                );
            END
        """)
        conn.commit()
        print("  Table tblTiposActividad is ready.")

        # Step 4: Seed tblTiposActividad with current distinct activity types
        print("Seeding tblTiposActividad...")
        for t in ['becas', 'olimpiadas', 'torneos']:
            cursor.execute("SELECT 1 FROM tblTiposActividad WHERE NombreTipo = ?", (t,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO tblTiposActividad (NombreTipo) VALUES (?)", (t,))
                print(f"  Seeded type: {t}")
        conn.commit()

        # Step 5: Add temporary dynamic types from tblActividades if any exist that are not standard
        # (Check if the old 'Tipo' column still exists before doing this)
        cursor.execute("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblActividades' AND COLUMN_NAME = 'Tipo'")
        if cursor.fetchone():
            print("Mapping distinct custom types from tblActividades to tblTiposActividad...")
            cursor.execute("""
                INSERT INTO tblTiposActividad (NombreTipo)
                SELECT DISTINCT LTRIM(RTRIM(Tipo))
                FROM tblActividades
                WHERE Tipo IS NOT NULL 
                  AND LTRIM(RTRIM(Tipo)) NOT IN (SELECT NombreTipo FROM tblTiposActividad);
            """)
            conn.commit()
            
            print("Mapping distinct custom provinces from tblActividades to tblProvincias...")
            cursor.execute("""
                INSERT INTO tblProvincias (Nombre)
                SELECT DISTINCT LTRIM(RTRIM(Provincia))
                FROM tblActividades
                WHERE Provincia IS NOT NULL 
                  AND LTRIM(RTRIM(Provincia)) NOT IN (SELECT Nombre FROM tblProvincias);
            """)
            conn.commit()

        # Step 6: Alter tblActividades to add foreign key columns
        print("Adding foreign key columns to tblActividades...")
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblActividades') AND name = 'ProvinciaID')
                ALTER TABLE tblActividades ADD ProvinciaID INT NULL FOREIGN KEY REFERENCES tblProvincias(ProvinciaID);
        """)
        cursor.execute("""
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblActividades') AND name = 'TipoID')
                ALTER TABLE tblActividades ADD TipoID INT NULL FOREIGN KEY REFERENCES tblTiposActividad(TipoID);
        """)
        conn.commit()

        # Step 7: Map existing text data to the new FK columns
        cursor.execute("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblActividades' AND COLUMN_NAME = 'Tipo'")
        old_tipo_exists = cursor.fetchone()
        
        cursor.execute("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tblActividades' AND COLUMN_NAME = 'Provincia'")
        old_prov_exists = cursor.fetchone()

        if old_tipo_exists or old_prov_exists:
            print("Migrating text column values to Foreign Key IDs...")
            if old_prov_exists:
                cursor.execute("""
                    UPDATE a
                    SET a.ProvinciaID = p.ProvinciaID
                    FROM tblActividades a
                    INNER JOIN tblProvincias p ON LTRIM(RTRIM(a.Provincia)) = LTRIM(RTRIM(p.Nombre))
                    WHERE a.ProvinciaID IS NULL;
                """)
                print("  Migrated Provincia -> ProvinciaID")
                
            if old_tipo_exists:
                cursor.execute("""
                    UPDATE a
                    SET a.TipoID = t.TipoID
                    FROM tblActividades a
                    INNER JOIN tblTiposActividad t ON LTRIM(RTRIM(a.Tipo)) = LTRIM(RTRIM(t.NombreTipo))
                    WHERE a.TipoID IS NULL;
                """)
                print("  Migrated Tipo -> TipoID")
            conn.commit()

        # Step 8: Ensure all records have a TipoID (non-nullable requirement)
        cursor.execute("SELECT COUNT(*) FROM tblActividades WHERE TipoID IS NULL")
        null_count = cursor.fetchone()[0]
        if null_count > 0:
            print(f"Warning: Found {null_count} activities with NULL TipoID. Resolving with default type...")
            cursor.execute("SELECT TOP 1 TipoID FROM tblTiposActividad")
            default_type_id = cursor.fetchone()[0]
            cursor.execute("UPDATE tblActividades SET TipoID = ? WHERE TipoID IS NULL", (default_type_id,))
            conn.commit()

        # Make TipoID non-nullable
        print("Making TipoID non-nullable...")
        cursor.execute("ALTER TABLE tblActividades ALTER COLUMN TipoID INT NOT NULL;")
        conn.commit()

        # Step 9: Recreate/Alter the view vw_ActividadesActivas to use the normalized joins
        print("Updating vw_ActividadesActivas view...")
        cursor.execute("""
            ALTER VIEW vw_ActividadesActivas
            AS
            SELECT 
                A.ActividadID,
                A.Titulo,
                ta.NombreTipo AS Tipo,
                I.Nombre AS Institucion,
                A.FechaCierre
            FROM tblActividades A
            INNER JOIN tblInstituciones I ON A.InstitucionID = I.InstitucionID
            INNER JOIN tblTiposActividad ta ON A.TipoID = ta.TipoID
            WHERE A.FechaCierre >= GETDATE() OR A.FechaCierre IS NULL;
        """)
        conn.commit()
        print("  Updated view vw_ActividadesActivas successfully.")

        # Step 10: Safely drop the old text columns
        print("Dropping redundant text columns from tblActividades...")
        if old_prov_exists:
            cursor.execute("ALTER TABLE tblActividades DROP COLUMN Provincia;")
            print("  Dropped Provincia column.")
        if old_tipo_exists:
            cursor.execute("ALTER TABLE tblActividades DROP COLUMN Tipo;")
            print("  Dropped Tipo column.")
        conn.commit()

        print("\n🎉 SCHEMA MIGRATION COMPLETED SUCCESSFULLY!")
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
