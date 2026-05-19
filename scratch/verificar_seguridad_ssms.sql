-- =================================================================================
-- SCRIPT DE VERIFICACIÓN DE POLÍTICAS DE SEGURIDAD DIRECTO EN SSMS (SQL SERVER)
-- Ejecuta este script paso a paso en una nueva consulta de SSMS
-- =================================================================================

USE ParticipARD_DB;
GO

-- =================================================================================
-- PRUEBA 1: COMPROBACIÓN DE RESTRICCIONES CHECK DE CORREO (@GMAIL.COM)
-- =================================================================================
PRINT '--- PRUEBA 1: Intentando registrar correo no permitido (@outlook.com) ---';
BEGIN TRY
    -- Intentamos insertar un correo que NO termina en @gmail.com
    INSERT INTO tblUsuarios (Email, FullName, PasswordHash, RolID)
    VALUES ('usuario_inseguro@outlook.com', 'Test Outlook', 'dummy_hash', 1);
    
    PRINT '[-] FALLO: El motor de base de datos permitio registrar un correo de Outlook.';
END TRY
BEGIN CATCH
    PRINT '[+] EXITO: SQL Server rechazo la insercion correctamente debido a la politica.';
    PRINT '    Mensaje de Error del Motor: ' + ERROR_MESSAGE();
END CATCH;
GO


-- =================================================================================
-- PRUEBA 2: PROCESAMIENTO DE LOCKOUT CON EL STORED PROCEDURE
-- =================================================================================
PRINT '';
PRINT '--- PRUEBA 2: Registro de Intentos y Bloqueo de Cuenta ---';

-- 1. Creamos un usuario de prueba limpio
DELETE FROM tblUsuarios WHERE Email = 'prueba_ssms@gmail.com';
DECLARE @RolID INT;
SELECT TOP 1 @RolID = RolID FROM tblRoles;

INSERT INTO tblUsuarios (Email, FullName, PasswordHash, RolID, IntentosFallidos, BloqueadoHasta)
VALUES ('prueba_ssms@gmail.com', 'Usuario SSMS Test', 'dummy_hash', @RolID, 0, NULL);

PRINT '[+] Usuario de prueba "prueba_ssms@gmail.com" creado.';
GO

-- 2. Primer intento fallido
PRINT '-> Ejecutando Intento Fallido #1...';
EXEC sp_RegistrarIntentoLogin @Email = 'prueba_ssms@gmail.com', @LoginExitoso = 0;

SELECT Email, IntentosFallidos, BloqueadoHasta 
FROM tblUsuarios WHERE Email = 'prueba_ssms@gmail.com';
GO

-- 3. Segundo intento fallido
PRINT '-> Ejecutando Intento Fallido #2...';
EXEC sp_RegistrarIntentoLogin @Email = 'prueba_ssms@gmail.com', @LoginExitoso = 0;

SELECT Email, IntentosFallidos, BloqueadoHasta 
FROM tblUsuarios WHERE Email = 'prueba_ssms@gmail.com';
GO

-- 4. Tercer intento fallido (Debe bloquear por 3 minutos)
PRINT '-> Ejecutando Intento Fallido #3 (Debe activar bloqueo de 3 minutos)...';
EXEC sp_RegistrarIntentoLogin @Email = 'prueba_ssms@gmail.com', @LoginExitoso = 0;

SELECT Email, IntentosFallidos, BloqueadoHasta 
FROM tblUsuarios WHERE Email = 'prueba_ssms@gmail.com';
GO

-- 5. Intento Exitoso (Debe reiniciar contadores)
PRINT '-> Ejecutando Inicio de Sesion Exitoso (Debe limpiar contadores y desbloquear)...';
EXEC sp_RegistrarIntentoLogin @Email = 'prueba_ssms@gmail.com', @LoginExitoso = 1;

SELECT Email, IntentosFallidos, BloqueadoHasta 
FROM tblUsuarios WHERE Email = 'prueba_ssms@gmail.com';
GO


-- =================================================================================
-- LIMPIEZA FINAL
-- =================================================================================
DELETE FROM tblUsuarios WHERE Email = 'prueba_ssms@gmail.com';
PRINT '[+] Limpieza completada.';
GO
