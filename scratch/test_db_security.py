import os
from dotenv import load_dotenv
import pyodbc

load_dotenv()

def run_tests():
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
    
    print("Conectando a SQL Server para realizar pruebas de seguridad...")
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Obtener un Rol válido para las pruebas
    cursor.execute("SELECT TOP 1 RolID FROM tblRoles")
    rol_row = cursor.fetchone()
    if not rol_row:
        print("[ERROR] No se encontraron roles en la base de datos.")
        conn.close()
        return
    rol_id = rol_row[0]

    test_gmail = "seguridad_test@gmail.com"
    test_invalid_email = "seguridad_test@outlook.com"
    
    print("\n--- PRUEBA 1: Restriccion CHECK de Correo (solo @gmail.com) ---")
    try:
        # Intentamos insertar un correo que NO termina en @gmail.com
        cursor.execute("""
            INSERT INTO tblUsuarios (Email, FullName, PasswordHash, RolID)
            VALUES (?, 'Test Outlook', 'some_dummy_hash_value_here', ?)
        """, (test_invalid_email, rol_id))
        conn.commit()
        print("[-] FALLO: El correo invalido @outlook.com fue aceptado por la base de datos.")
    except pyodbc.Error as e:
        error_msg = str(e)
        if "CK_Usuarios_Email_Gmail" in error_msg or "CHECK constraint" in error_msg:
            print("[+] EXITO: La base de datos rechazo correctamente el correo @outlook.com.")
            print(f"    Mensaje del motor: {error_msg.split(']')[ -1 ] if ']' in error_msg else error_msg[:100]}")
        else:
            print(f"[-] OCURRIO UN ERROR INESPERADO: {error_msg}")
    
    # Limpiamos si se inserto por algun motivo
    try:
        cursor.execute("DELETE FROM tblUsuarios WHERE Email = ?", (test_invalid_email,))
        conn.commit()
    except:
        pass

    print("\n--- PRUEBA 2: Procedimiento sp_RegistrarIntentoLogin y Lockout ---")
    
    # Creamos un usuario de prueba valido
    try:
        cursor.execute("DELETE FROM tblUsuarios WHERE Email = ?", (test_gmail,))
        conn.commit()
        
        cursor.execute("""
            INSERT INTO tblUsuarios (Email, FullName, PasswordHash, RolID, IntentosFallidos, BloqueadoHasta)
            VALUES (?, 'Test Security User', 'dummy_hash', ?, 0, NULL)
        """, (test_gmail, rol_id))
        conn.commit()
        print("[+] Usuario de prueba creado exitosamente.")
    except Exception as e:
        print(f"[-] Error creando usuario de prueba: {e}")
        conn.close()
        return

    try:
        # Intento fallido 1
        print("Ejecutando Intento Fallido #1...")
        cursor.execute("{CALL sp_RegistrarIntentoLogin (?, ?)}", (test_gmail, False))
        row = cursor.fetchone()
        conn.commit()
        intentos, bloqueado = row if row else (0, None)
        print(f"    Resultado -> Intentos Fallidos: {intentos}, Bloqueado Hasta: {bloqueado}")

        # Intento fallido 2
        print("Ejecutando Intento Fallido #2...")
        cursor.execute("{CALL sp_RegistrarIntentoLogin (?, ?)}", (test_gmail, False))
        row = cursor.fetchone()
        conn.commit()
        intentos, bloqueado = row if row else (0, None)
        print(f"    Resultado -> Intentos Fallidos: {intentos}, Bloqueado Hasta: {bloqueado}")

        # Intento fallido 3 (Debe disparar el bloqueo)
        print("Ejecutando Intento Fallido #3 (debe bloquear la cuenta)...")
        cursor.execute("{CALL sp_RegistrarIntentoLogin (?, ?)}", (test_gmail, False))
        row = cursor.fetchone()
        conn.commit()
        intentos, bloqueado = row if row else (0, None)
        print(f"    Resultado -> Intentos Fallidos: {intentos}, Bloqueado Hasta: {bloqueado}")
        
        if intentos >= 3 and bloqueado is not None:
            print("[+] EXITO: La cuenta fue bloqueada correctamente en la Base de Datos tras 3 intentos.")
        else:
            print("[-] FALLO: La cuenta no registra el estado de bloqueo esperado.")

        # Intento Exitoso (Debe reiniciar el estado)
        print("Ejecutando Intento de Inicios de Sesion Exitoso (debe limpiar el estado)...")
        cursor.execute("{CALL sp_RegistrarIntentoLogin (?, ?)}", (test_gmail, True))
        row = cursor.fetchone()
        conn.commit()
        intentos, bloqueado = row if row else (0, None)
        print(f"    Resultado -> Intentos Fallidos: {intentos}, Bloqueado Hasta: {bloqueado}")
        
        if intentos == 0 and bloqueado is None:
            print("[+] EXITO: El procedimiento limpio el estado de la cuenta correctamente en el login exitoso.")
        else:
            print("[-] FALLO: El contador de intentos o bloqueo no fue reseteado.")

    except Exception as e:
        print(f"[-] Ocurrio un error ejecutando el procedimiento: {e}")
        
    finally:
        # Limpieza final del usuario de prueba
        print("\nLimpiando base de datos...")
        cursor.execute("DELETE FROM tblUsuarios WHERE Email = ?", (test_gmail,))
        conn.commit()
        conn.close()
        print("Pruebas completadas.")

if __name__ == "__main__":
    run_tests()
