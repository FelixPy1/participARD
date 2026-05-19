-- =================================================================================
-- PROYECTO FINAL - ADMINISTRACIÓN AVANZADA EN SQL SERVER
-- PLATAFORMA: ParticipARD (Migración Teórica a SQL Server)
-- =================================================================================

USE master;
GO

-- =================================================================================
-- PARTE 8 Y 9: ARREGLOS DE DISCOS (CREACIÓN FÍSICA SEPARADA DE MDF, LDF)
-- Simularemos las unidades de disco D:\ (Data) y L:\ (Logs). 
-- (Asegúrate de que estas rutas existan en tu PC al crear, o reemplázalas por C:\)
-- =================================================================================
IF DB_ID('ParticipARD_DB') IS NOT NULL
BEGIN
    ALTER DATABASE ParticipARD_DB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ParticipARD_DB;
END
GO

CREATE DATABASE ParticipARD_DB;
-- (Nota: Se eliminó la asignación física estricta a C:\ para evitar el Error Operativo 5 de Acceso Denegado. 
--  SQL Server ahora lo guardará automáticamente en su bóveda segura).
GO

USE ParticipARD_DB;
GO

-- =================================================================================
-- PARTE 3: ESTRUCTURA DE LA BASE DE DATOS (TABLAS RELACIONALES)
-- =================================================================================

-- 1. Tabla Roles
CREATE TABLE tblRoles (
    RolID INT IDENTITY(1,1) PRIMARY KEY,
    NombreRol VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Tabla Provincias
CREATE TABLE tblProvincias (
    ProvinciaID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL
);

-- 2.5 Tabla TiposActividad (Normalizado en 3NF)
CREATE TABLE tblTiposActividad (
    TipoID INT IDENTITY(1,1) PRIMARY KEY,
    NombreTipo VARCHAR(50) NOT NULL UNIQUE
);

-- 3. Tabla Instituciones
CREATE TABLE tblInstituciones (
    InstitucionID INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(200) NOT NULL,
    Tipo VARCHAR(50) NOT NULL -- Universidad, Ministerio, ONG
);

-- 4. Tabla Usuarios
CREATE TABLE tblUsuarios (
    UsuarioID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email VARCHAR(150) NOT NULL UNIQUE,
    FullName VARCHAR(150) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    RolID INT NOT NULL FOREIGN KEY REFERENCES tblRoles(RolID),
    InstitucionID INT NULL FOREIGN KEY REFERENCES tblInstituciones(InstitucionID),
    ProvinciaID INT NULL FOREIGN KEY REFERENCES tblProvincias(ProvinciaID),
    IntentosFallidos INT DEFAULT 0,
    BloqueadoHasta DATETIME NULL,
    FechaUltimoCambioPassword DATETIME DEFAULT GETDATE(),
    FechaCreacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT CK_Usuarios_Email_Gmail CHECK (Email LIKE '%@gmail.com'),
    CONSTRAINT CK_Usuarios_IntentosFallidos CHECK (IntentosFallidos >= 0)
);

-- 5. Tabla Actividades (Normalizado en 3NF)
CREATE TABLE tblActividades (
    ActividadID INT IDENTITY(1,1) PRIMARY KEY,
    Titulo VARCHAR(200) NOT NULL,
    Descripcion TEXT NOT NULL,
    TipoID INT NOT NULL FOREIGN KEY REFERENCES tblTiposActividad(TipoID),
    FechaCierre DATE NULL,
    InstitucionID INT NOT NULL FOREIGN KEY REFERENCES tblInstituciones(InstitucionID),
    Localidad VARCHAR(100) NULL,
    ProvinciaID INT NULL FOREIGN KEY REFERENCES tblProvincias(ProvinciaID),
    Estado NVARCHAR(20) DEFAULT 'Activa',
    FechaInicio DATE NULL,
    ImagenURL NVARCHAR(MAX) NULL,
    SitioOficialURL NVARCHAR(MAX) NULL
);

-- 6. Tabla Inscripciones
CREATE TABLE tblInscripciones (
    InscripcionID INT IDENTITY(1,1) PRIMARY KEY,
    ActividadID INT NOT NULL FOREIGN KEY REFERENCES tblActividades(ActividadID),
    UsuarioID UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES tblUsuarios(UsuarioID),
    FechaInscripcion DATETIME DEFAULT GETDATE()
);

-- 7. Tabla Auditoría (Para requerimientos de Triggers)
CREATE TABLE tblAuditoria_Actividades (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    ActividadID INT,
    Accion VARCHAR(50),
    UsuarioModificador VARCHAR(100),
    FechaModificacion DATETIME DEFAULT GETDATE()
);
GO

-- =================================================================================
-- INSERTAR DATOS DE PRUEBA (Instituciones, Roles y Actividades reales/internacionales)
-- =================================================================================
INSERT INTO tblRoles (NombreRol) VALUES 
('Rol_Estudiantes'),
('Rol_Administradores'),
('Rol_Editores');

INSERT INTO tblProvincias (Nombre) VALUES
('Santo Domingo'),
('Santiago'),
('Internacional');

INSERT INTO tblTiposActividad (NombreTipo) VALUES
('becas'),
('olimpiadas'),
('torneos');

INSERT INTO tblInstituciones (Nombre, Tipo) VALUES 
('Ministerio de Educación (MINERD)', 'Ministerio'),
('Instituto Tecnológico de las Américas (ITLA)', 'Instituto'),
('Olimpiadas Internacionales de Matemáticas', 'Internacional'),
('Fundación Carolina', 'Internacional');

INSERT INTO tblActividades (Titulo, Descripcion, TipoID, FechaCierre, InstitucionID, Localidad, ProvinciaID, Estado, FechaInicio, ImagenURL, SitioOficialURL) VALUES 
('Olimpiada Nacional de Matemáticas', 'Competencia para estudiantes de secundaria de toda la República Dominicana.', 2, '2026-12-31', 1, 'Múltiples Sedes', 1, 'Activa', '2026-01-01', NULL, NULL),
('Beca de Software Engineering', 'Beca completa para estudiar ingeniería de software.', 1, '2026-10-15', 2, 'Boca Chica', 1, 'Activa', '2026-01-01', NULL, NULL),
('Torneo Escolar de Ajedrez', 'Torneo regional de ajedrez escolar.', 3, '2026-08-20', 1, 'Santiago de los Caballeros', 2, 'Activa', '2026-01-01', NULL, NULL),
('Olimpiada Internacional IMO', 'Competencia internacional de matemáticas para jóvenes talentos de todos los países.', 2, '2026-11-01', 3, 'Internacional', 3, 'Activa', '2026-01-01', NULL, NULL),
('Beca Internacional Fundación Carolina', 'Becas para estudios de postgrado y maestría para estudiantes Iberoamericanos.', 1, '2026-09-30', 4, 'Online/España', 3, 'Activa', '2026-01-01', NULL, NULL);
GO

-- =================================================================================
-- PARTE 3: VISTAS (Consultas analíticas)
-- =================================================================================
CREATE VIEW vw_ActividadesActivas
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
GO

CREATE VIEW vw_ParticipacionProvincial
AS
SELECT 
    P.Nombre AS Provincia,
    COUNT(I.InscripcionID) AS TotalInscritos
FROM tblInscripciones I
INNER JOIN tblUsuarios U ON I.UsuarioID = U.UsuarioID
INNER JOIN tblProvincias P ON U.ProvinciaID = P.ProvinciaID
GROUP BY P.Nombre;
GO

-- =================================================================================
-- PARTE 3: PROCEDIMIENTOS ALMACENADOS (Stored Procedures)
-- =================================================================================
CREATE PROCEDURE sp_RegistrarUsuario
    @Email VARCHAR(150),
    @FullName VARCHAR(150),
    @PasswordHash VARCHAR(255),
    @RolNombre VARCHAR(50)
AS
BEGIN
    DECLARE @RolID INT;
    SELECT @RolID = RolID FROM tblRoles WHERE NombreRol = @RolNombre;
    
    INSERT INTO tblUsuarios (Email, FullName, PasswordHash, RolID)
    VALUES (@Email, @FullName, @PasswordHash, @RolID);
END
GO

CREATE PROCEDURE sp_BorrarActividadSegura
    @ActividadID INT
AS
BEGIN
    DELETE FROM tblInscripciones WHERE ActividadID = @ActividadID;
    DELETE FROM tblActividades WHERE ActividadID = @ActividadID;
END
GO

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
GO


-- =================================================================================
-- PARTE 3: TRIGGERS
-- =================================================================================
CREATE TRIGGER trg_AuditoriaActividades_Delete
ON tblActividades
AFTER DELETE
AS
BEGIN
    INSERT INTO tblAuditoria_Actividades (ActividadID, Accion, UsuarioModificador)
    SELECT d.ActividadID, 'ELIMINADA', SYSTEM_USER
    FROM deleted d;
END
GO

-- =================================================================================
-- PARTE 4 Y 5: ROLES, PERMISOS Y APLICACIÓN DE LA POLÍTICA DE SEGURIDAD
-- =================================================================================

IF SUSER_ID('AdminApp') IS NOT NULL DROP LOGIN AdminApp;
IF SUSER_ID('StudentApp') IS NOT NULL DROP LOGIN StudentApp;
GO

CREATE LOGIN AdminApp WITH PASSWORD = 'Strong_Password123!', CHECK_POLICY = ON;
CREATE LOGIN StudentApp WITH PASSWORD = 'User_Password123!', CHECK_POLICY = ON;
GO

-- 2. Crear Usuarios en Base de datos enlazados a los Logins
CREATE USER U_AdminApp FOR LOGIN AdminApp;
CREATE USER U_StudentApp FOR LOGIN StudentApp;
GO

-- 3. Crear Estructura Jerárquica de Roles (Parte 4)
CREATE ROLE Rol_Administradores;
CREATE ROLE Rol_Estudiantes;
GO

-- 4. Asignación de Usuarios a Roles
ALTER ROLE Rol_Administradores ADD MEMBER U_AdminApp;
ALTER ROLE Rol_Estudiantes ADD MEMBER U_StudentApp;
GO

-- 5. Privilegios Granulares (Permisos por Tipo de Usuario)
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO Rol_Administradores;

GRANT SELECT ON vw_ActividadesActivas TO Rol_Estudiantes;
GRANT INSERT ON tblInscripciones TO Rol_Estudiantes;
DENY DELETE ON tblActividades TO Rol_Estudiantes; -- No pueden borrar.
GO

-- =================================================================================
-- PARTE 12: PLAN DE MANTENIMIENTO AUTOMATIZADO (ÍNDICES SEGÚN FRAGMENTACIÓN)
-- El profesor solicitó usar la lógica de % de fragmentación (11-29% Reorganize, >30% Rebuild).
-- =================================================================================

CREATE PROCEDURE sp_AutoMantenimientoIndices_ParticipARD
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @IndexName NVARCHAR(255)
    DECLARE @TableName NVARCHAR(255)
    DECLARE @Fragmentation FLOAT
    DECLARE @SQLCommand NVARCHAR(MAX)

    -- Extraemos el bloque de validación provisto por el profesor para automatizarlo en un cursor
    DECLARE CursorIndices CURSOR FOR
    SELECT 
        b.name as IndexName, 
        Obj.name as ObjectName,
        a.avg_fragmentation_in_percent as '%Frag'
    FROM  sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'limited') as a
    INNER JOIN sys.indexes as b ON a.object_id = b.object_id AND a.index_id = b.index_id
    INNER JOIN sys.objects as Obj ON a.object_id = Obj.object_id
    WHERE a.avg_fragmentation_in_percent >= 11 AND b.name IS NOT NULL

    OPEN CursorIndices
    FETCH NEXT FROM CursorIndices INTO @IndexName, @TableName, @Fragmentation

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @Fragmentation BETWEEN 11 AND 29
        BEGIN
            -- Si está fragmentado entre un 11% y un 29% es mejor reoganizar el índice
            SET @SQLCommand = 'ALTER INDEX ' + @IndexName + ' ON ' + @TableName + ' REORGANIZE;'
            PRINT 'Optimizando (REORGANIZE) el Indice: ' + @IndexName + ' en la Tabla: ' + @TableName
        END
        ELSE IF @Fragmentation >= 30
        BEGIN
            -- Si está fragmentado más de un 30% es mejor reconstruir el índice
            SET @SQLCommand = 'ALTER INDEX ' + @IndexName + ' ON ' + @TableName + ' REBUILD;'
            PRINT 'Reconstruyendo (REBUILD) el Indice: ' + @IndexName + ' en la Tabla: ' + @TableName
        END

        EXEC sp_executesql @SQLCommand

        FETCH NEXT FROM CursorIndices INTO @IndexName, @TableName, @Fragmentation
    END

    CLOSE CursorIndices
    DEALLOCATE CursorIndices

    -- Actualización de estadísticas tras el mantenimiento
    EXEC sp_updatestats;
END
GO

PRINT '=======================================================';
PRINT 'BASE DE DATOS Y OBJETOS CREADOS EXITOSAMENTE';
PRINT 'Ejecutar Refresh en Management Studio (F5) para visualizar';
PRINT '=======================================================';
