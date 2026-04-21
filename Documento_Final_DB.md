# Práctica Final: Administración Avanzada en SQL Server
**Nombre del Estudiante:** _________________
**Proyecto:** participARD Database Management

---

## 🛠️ Parte 1: Requisitos de implementación

* **Medios de almacenamiento:** Se recomienda el uso de **RAID 1** (espejeo) con discos **SSD** para el Sistema Operativo y los Binarios de SQL Server, asegurando la recuperación en caso de fallo del disco principal. Para los archivos de la Base de Datos (.mdf) se utilizará **RAID 10** en discos SSD NVMe, lo que garantiza el máximo rendimiento de lectura/escritura (Striping) y tolerancia a fallos (Mirroring). Los logs transaccionales (.ldf) residirán en un arreglo **RAID 1** separado.
* **Sistema Operativo:** Windows Server 2022 Datacenter Edition (Arquitectura de 64 bits) debido a su excelente integración híbrida y altos estándares de seguridad.
* **Gestor de Base de Datos:** SQL Server 2022 (Edición Developer para entornos de pruebas, y Enterprise para Producción) ya que permite cifrado a nivel de celda y rendimiento óptimo de memoria.
* **Conectividad:** Red tipo LAN/VLAN dedicada para la base de datos detrás del firewall perimetral de la aplicación. Se utilizará el protocolo TCP/IP, limitando el acceso a través del puerto estándar **1433**.

## 🔗 Parte 2: Conectividad del sistema

* **Mecanismo de Conexión Elegido:** **ADO.NET**
* **Justificación:** Dado que *participARD* (en su ecosistema corporativo simulado) utilizará una API construida en **.NET Core / C#**, la metodología de conexión ADO.NET (`Microsoft.Data.SqlClient`) es la recomendación indiscutible. Funciona de manera completamente nativa, ofrece *Connection Pooling* automático para soportar miles de estudiantes concurrentes sin agotar la base de datos, y previene inherentemente ataques de Inyección SQL gracias a los *Parameterized Queries*.

## 🧱 Parte 3: Estructura de la Base de Datos

En SQL Server Management Studio (SSMS) debes ejecutar el script SQL generado (ParticipARD_Master.sql) para tomar las capturas solicitadas de: 
* **Tablas y Relaciones:** (Ir al Explorador de objetos -> Click derecho en 'Database Diagrams' -> Add tables).
* **Vistas:** Se ha creado `vw_ActividadesActivas` y `vw_ParticipacionProvincial`.
* **Stored Procedures:** Se destacan `sp_RegistrarUsuario` y el robusto procedimiento `sp_BorrarActividadSegura` que maneja dependencias.
* **Triggers:** Tenemos `trg_AuditoriaActividades_Delete` activo para evitar la pérdida de eventos al borrar registros.

*(Nota para el estudiante: Pegar capturas de pantalla de los elementos mencionados desde el Explorador de Objetos de SSMS)*

## 🔐 Parte 4: Roles y permisos

Estructura Jerárquica e implementada por código:
* **Administrador (`Rol_Administradores`):** Posee permisos totales sobre el esquema por defecto (`GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo`). Ellos pueden ver, manipular y auditar cualquier actividad.
* **Estudiante (`Rol_Estudiantes`):** Acceso altamente restrictivo (Menor Privilegio). Se les otorgó específicamente `GRANT SELECT` a las vistas de consulta y `GRANT EXECUTE` al Store Procedure para inscribirse. Se bloqueó explícitamente el borrado con `DENY DELETE ON tblActividades`.

## 🛡️ Parte 5: Política de seguridad

Integración con Políticas Locales de Windows utilizando `CHECK_POLICY = ON` al crear los Logins de la DB.
* **Contraseñas Seguras:** Se configuró para que SQL envíe advertencias si la clave es menor a 12 caracteres y exija complejidad (Mayúsculas, Números, Especiales).
* **Expiración de Contraseña:** `CHECK_EXPIRATION = ON` obliga a que el Personal y Editores roten cada 90 días sus accesos de bases de datos.
* **Número de intentos fallidos:** Vinculado con la *Account Lockout Policy* de Active Directory o Local SecPol para el bloqueo total tras **3 intentos fallidos**.

## 💾 Parte 6 y 7: Esquema y ejecución de respaldos

Para una plataforma educativa como *participARD*, se implementará el siguiente Modelo de Recuperación y Frecuencia:
* **Frecuencia Completa (Full Backup):** Cada Domingo a las 02:00 a.m. Garantiza una imagen inicial semanal de todos los datos fuera de horario pico.
* **Frecuencia Diferencial:** De Lunes a Sábado a las 02:00 a.m. Captura los cambios desde el domingo reduciendo el tiempo de restauración diario.
* **Frecuencia Incremental / Logs de Transacción:** Cada 30 minutos. Previene la pérdida de inscripciones a becas durante el día protegiendo el RPO (Recovery Point Objective).

## 🧰 Parte 8 y 9: Arreglos de discos

Para mitigar los cuellos de botella del I/O (Lectura/Escritura), configuramos físicamente los ficheros en rutas distribuidas (Visualizable en el script de creación):
* Fichero MDF en Disco de Datos: `D:\DataDrive\ParticipARD_Data.mdf`.
* Fichero LDF en Disco de Logs Separado: `L:\LogDrive\ParticipARD_Log.ldf`.
* TempDB (Archivos Temporales TSQL) en un SSD de alta rotación: `T:\TempDBDrive\`.

## 🚨 Parte 10: Alertas

Las alertas críticas se configurarán usando SQL Server Agent:
1. **Espacio en Disco (Error 9002):** Alerta proactiva al 80% de utilización en el `DataDrive` o `LogDrive`.
2. **Crecimiento de Log de Transacciones:** Notificará si una consulta huérfana de ActiveDirectory o bucle genera crecimiento exponencial sin truncateo.
3. **Alto Uso CPU y Fallo Motor:** Utilizando Alertas WMI de SQL Agent para disparar correos automáticos al *DBA* cuando CPU promedie >85% por más de 10 minutos o detención del servicio MSSQLSERVER.

## 📊 Parte 11: Monitoreo de la base de datos

* Se usarán los **Extended Events (XEvents)** en sustitución de Profiler, configurando una sesión para capturar todas las sentencias que duren más de 3 segundos (*Long Running Queries*).
* Las **DMVs** (Dynamic Management Views) que se interrogarán proactivamente son:
  * `sys.dm_exec_query_stats` (Puntos críticos y cacheo de consultas lentas).
  * `sys.dm_os_waiting_tasks` (Detección de bloqueos de transacciones e Interbloqueos / Deadlocks).

## 🔧 Parte 12: Planes de mantenimiento

En el `SSMS`, se desplegará un Plan del Agente para ejecutarse a las 01:00 am.
* **Fragmentación de Índices:** Se incrustó el ciclo inteligente obligatorio (*Profesor Script*) bajo el Store Procedure: `sp_AutoMantenimientoIndices_ParticipARD`. Este script evaluará la DMV diariamente evaluando si fragmentación % amerita `REORGANIZE` (11%-29%) o el pesado `REBUILD` (>30%).
* Actualización de estadísticas: `EXEC sp_updatestats` post-mantenimiento.
* Backup Diario embebido y "Maintenance Cleanup Task" limpiando .bak tras 14 días.

## 📥 Parte 13: Actualizaciones

* **Base de Datos:** Utilización del despliegue en anillo ("Local Gradual"). Instalar parches (CUs) en el ambiente `participARD_Staging` primero, se ejecutan las pruebas de concurrencia y luego se usa el Asistente Gráfico de actualizaciones para llevar Producción a la misma Build final en ventanas de mantenimiento programadas de 3 horas.
* **Sistema operativo (Windows 10/Server):** Se recomienda usar "Windows Server Update Services" (WSUS). Deshabilitar actualización automática y manualizarlas para que el reinicio crítico por parches de seguridad jamás afecte activamente a las consultas y motores de SQL interrumpiendo las sesiones logueadas de estudiantes a mitad de día. Se exige la validación mediante Snapshots o Restore Points como fallback inmediato.

---
*(Estudiante: Recuerda sustituir las capturas pertinentes corriendo el archivo `.sql` acompañante)*
