import os
from dotenv import load_dotenv
import pyodbc

load_dotenv()

def apply_db_security():
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
    
    print("Conectando a la base de datos...")
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    try:
        # 1. Asegurar columnas de seguridad en tblUsuarios
        print("Asegurando columnas de seguridad en tblUsuarios...")
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblUsuarios') AND name = 'IntentosFallidos')
            ALTER TABLE tblUsuarios ADD IntentosFallidos INT DEFAULT 0;

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblUsuarios') AND name = 'BloqueadoHasta')
            ALTER TABLE tblUsuarios ADD BloqueadoHasta DATETIME NULL;

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('tblUsuarios') AND name = 'FechaUltimoCambioPassword')
            ALTER TABLE tblUsuarios ADD FechaUltimoCambioPassword DATETIME DEFAULT GETDATE();
        """)
        conn.commit()

        # 2. Agregar restricciones CHECK a tblUsuarios
        print("Aplicando restricciones CHECK a tblUsuarios...")
        
        # Correo Gmail obligatorio
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('CK_Usuarios_Email_Gmail') AND type = 'C')
        BEGIN
            ALTER TABLE tblUsuarios ADD CONSTRAINT CK_Usuarios_Email_Gmail CHECK (Email LIKE '%@gmail.com');
            PRINT '  Restricción CK_Usuarios_Email_Gmail agregada.';
        END
        ELSE
            PRINT '  Restricción CK_Usuarios_Email_Gmail ya existe.';
        """)
        
        # Intentos fallidos no negativos
        cursor.execute("""
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('CK_Usuarios_IntentosFallidos') AND type = 'C')
        BEGIN
            ALTER TABLE tblUsuarios ADD CONSTRAINT CK_Usuarios_IntentosFallidos CHECK (IntentosFallidos >= 0);
            PRINT '  Restricción CK_Usuarios_IntentosFallidos agregada.';
        END
        ELSE
            PRINT '  Restricción CK_Usuarios_IntentosFallidos ya existe.';
        """)
        conn.commit()

        # 3. Crear o Reemplazar Stored Procedure sp_RegistrarIntentoLogin
        print("Creando/Actualizando Procedimiento Almacenado sp_RegistrarIntentoLogin...")
        cursor.execute("""
        IF OBJECT_ID('sp_RegistrarIntentoLogin', 'P') IS NOT NULL
            DROP PROCEDURE sp_RegistrarIntentoLogin;
        """)
        conn.commit()

        cursor.execute("""
        CREATE PROCEDURE sp_RegistrarIntentoLogin
            @Email VARCHAR(150),
            @LoginExitoso BIT
        AS
        BEGIN
            SET NOCOUNT ON;
            DECLARE @UsuarioID UNIQUEIDENTIFIER;
            DECLARE @Intentos INT;
            DECLARE @BloqueadoHasta DATETIME;

            SELECT @UsuarioID = UsuarioID, @Intentos = IntentosFallidos, @BloqueadoHasta = BloqueadoHasta
            FROM tblUsuarios
            WHERE Email = @Email;

            IF @UsuarioID IS NULL
            BEGIN
                SELECT 0 AS IntentosFallidos, NULL AS BloqueadoHasta;
                RETURN;
            END

            IF @LoginExitoso = 1
            BEGIN
                UPDATE tblUsuarios
                SET IntentosFallidos = 0,
                    BloqueadoHasta = NULL
                WHERE UsuarioID = @UsuarioID;
                
                SELECT 0 AS IntentosFallidos, NULL AS BloqueadoHasta;
            END
            ELSE
            BEGIN
                SET @Intentos = ISNULL(@Intentos, 0) + 1;
                
                IF @Intentos >= 3
                BEGIN
                    SET @BloqueadoHasta = DATEADD(minute, 3, GETDATE());
                    UPDATE tblUsuarios
                    SET IntentosFallidos = @Intentos,
                        BloqueadoHasta = @BloqueadoHasta
                    WHERE UsuarioID = @UsuarioID;
                END
                ELSE
                BEGIN
                    SET @BloqueadoHasta = NULL;
                    UPDATE tblUsuarios
                    SET IntentosFallidos = @Intentos,
                        BloqueadoHasta = NULL
                    WHERE UsuarioID = @UsuarioID;
                END
                
                SELECT @Intentos AS IntentosFallidos, @BloqueadoHasta AS BloqueadoHasta;
            END
        END
        """)
        conn.commit()
        print("  Procedimiento sp_RegistrarIntentoLogin creado exitosamente.")

        print("\n🎉 ¡POLÍTICAS DE SEGURIDAD APLICADAS A LA BASE DE DATOS EXITOSAMENTE!")
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error aplicando seguridad a la DB: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    apply_db_security()
