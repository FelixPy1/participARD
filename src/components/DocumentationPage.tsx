import { useState } from 'react';
import { ChevronDown, Database, Server, Lock, HardDrive, AlertCircle, BarChart3, Wrench } from 'lucide-react';
import { UserProfile } from '../supabaseClient';

interface DocumentationPageProps {
  user?: UserProfile | null;
  onLogout?: () => void;
}

export function DocumentationPage({ user, onLogout }: DocumentationPageProps) {
  const [openSection, setOpenSection] = useState<string>('requirements');

  const sections = [
    {
      id: 'requirements',
      title: 'Parte 1: Requisitos de Implementación',
      icon: Server,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Herramientas Necesarias</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex gap-2"><span>•</span> <span><strong>Gestor BD:</strong> Supabase (PostgreSQL) o SQL Server 2019+</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Sistema Operativo:</strong> Windows Server 2019/2022 (64-bit) o Linux Ubuntu 20.04+</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Almacenamiento:</strong> SSD NVMe (datos), RAID 1 (logs), HDD (backups)</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>RAM:</strong> Mínimo 16GB (recomendado 32GB)</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>CPU:</strong> Intel Xeon E5-2620+ o equivalente (8+ cores)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Ediciones SQL Server Recomendadas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/3 border border-white/10 rounded-lg p-4">
                <p className="font-medium text-white mb-2">Desarrollo/Pruebas</p>
                <p className="text-white/60 text-sm">SQL Server 2019 Developer (Gratuita)</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-lg p-4">
                <p className="font-medium text-white mb-2">Producción</p>
                <p className="text-white/60 text-sm">SQL Server 2022 Standard/Enterprise</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Conectividad de Red</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex gap-2"><span>•</span> <span><strong>Protocolo:</strong> TCP/IP (puerto 1433 por defecto)</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Red:</strong> Ethernet Gigabit mínimo</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Seguridad:</strong> VPN o firewall configurado</span></li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'connectivity',
      title: 'Parte 2: Conectividad del Sistema',
      icon: Database,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Métodos de Conexión Disponibles</h4>
            <div className="space-y-4">
              <div className="bg-white/3 border border-white/10 rounded-lg p-4">
                <p className="font-semibold text-white mb-2">ADO.NET (Recomendado)</p>
                <p className="text-white/60 text-sm mb-3">Para aplicaciones .NET/C#</p>
                <code className="text-emerald-400 text-xs block bg-black/30 p-2 rounded">
                  connectionString="Server=localhost;Database=ParticipARD;User Id=sa;Password=..."
                </code>
              </div>

              <div className="bg-white/3 border border-white/10 rounded-lg p-4">
                <p className="font-semibold text-white mb-2">JDBC (Java)</p>
                <p className="text-white/60 text-sm mb-3">Para aplicaciones Java/Spring</p>
                <code className="text-emerald-400 text-xs block bg-black/30 p-2 rounded">
                  jdbc:sqlserver://localhost:1433;databaseName=ParticipARD
                </code>
              </div>

              <div className="bg-white/3 border border-white/10 rounded-lg p-4">
                <p className="font-semibold text-white mb-2">ODBC</p>
                <p className="text-white/60 text-sm mb-3">Para aplicaciones legacy y web</p>
                <code className="text-emerald-400 text-xs block bg-black/30 p-2 rounded">
                  DSN=ParticipARD;UID=sa;PWD=...
                </code>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Justificación de Selección</h4>
            <p className="text-white/70 text-sm">
              ParticipARD utiliza <strong>Supabase (PostgreSQL)</strong> como base de datos principal con conectividad mediante:
              <ul className="mt-2 space-y-1 ml-4">
                <li>• JavaScript SDK (supabase-js) para frontend React</li>
                <li>• REST API para compatibilidad cross-platform</li>
                <li>• Row Level Security (RLS) nativo para seguridad</li>
              </ul>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Parte 3 & 4: Estructura de Datos y Seguridad',
      icon: Lock,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Tablas Principales</h4>
            <div className="space-y-3 text-white/70 text-sm">
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white">profiles</p>
                <p className="text-white/60 text-xs">Información de usuarios con roles (admin, institution, student)</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white">activities</p>
                <p className="text-white/60 text-xs">Actividades educativas (concursos, becas, ferias, eventos)</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white">activity_enrollments</p>
                <p className="text-white/60 text-xs">Inscripciones de estudiantes con estados</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white">activity_logs</p>
                <p className="text-white/60 text-xs">Auditoría y monitoreo de acciones del sistema</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Roles y Permisos</h4>
            <div className="space-y-3">
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white mb-2">Admin</p>
                <p className="text-white/60 text-sm">Acceso total: gestión de usuarios, alertas, reportes, configuración</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white mb-2">Institution</p>
                <p className="text-white/60 text-sm">Crear/editar actividades propias, ver inscripciones, reportes básicos</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white mb-2">Student</p>
                <p className="text-white/60 text-sm">Ver actividades, inscribirse, gestionar perfil propio</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Política de Seguridad de Contraseñas</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex gap-2"><span>•</span> <span><strong>Longitud mínima:</strong> 12 caracteres</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Complejidad:</strong> Mayúsculas, minúsculas, números, símbolos</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Expiración:</strong> Cada 90 días</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Intentos fallidos:</strong> 5 intentos = bloqueo por 30 minutos</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Historial:</strong> No reutilizar últimas 5 contraseñas</span></li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'backups',
      title: 'Parte 5 & 6: Esquema de Respaldos',
      icon: HardDrive,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Política de Respaldos Implementada</h4>
            <div className="space-y-3 text-white/70 text-sm">
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white mb-2">Respaldos Completos</p>
                <p>Diariamente a las 2:00 AM (UTC-4)</p>
                <p className="text-white/50 text-xs mt-1">Retención: 30 días</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white mb-2">Respaldos Diferenciales</p>
                <p>Cada 12 horas (2:00 AM y 2:00 PM)</p>
                <p className="text-white/50 text-xs mt-1">Retención: 7 días</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white mb-2">Respaldos de Logs</p>
                <p>Cada 4 horas (punto de recuperación cada 1 hora)</p>
                <p className="text-white/50 text-xs mt-1">Retención: 14 días</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Almacenamiento de Respaldos</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex gap-2"><span>•</span> <span><strong>Local:</strong> /var/backups/participard (NAS redundante)</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Cloud:</strong> AWS S3 (respaldos semanales encriptados)</span></li>
              <li className="flex gap-2"><span>•</span> <span><strong>Pruebas:</strong> Restauraciones mensuales en entorno de pruebas</span></li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'monitoring',
      title: 'Parte 7 & 8: Alertas y Monitoreo',
      icon: AlertCircle,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Alertas Configuradas</h4>
            <div className="space-y-2 text-white/70 text-sm">
              <div className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>Espacio en disco inferior al 20%</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>Crecimiento anómalo del archivo .ldf (logs)</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>Bloqueos de BD superiores a 30 segundos</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>Fallos en respaldos automáticos</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>CPU o Memoria superior al 85%</span>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>Errores de índices fragmentados (&gt;30%)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Herramientas de Monitoreo</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li className="flex gap-2"><span>•</span> <span>SQL Server Agent (automatización de tareas)</span></li>
              <li className="flex gap-2"><span>•</span> <span>DMVs (Dynamic Management Views) para consultas lentas</span></li>
              <li className="flex gap-2"><span>•</span> <span>Supabase Dashboard (monitoreo de conexiones)</span></li>
              <li className="flex gap-2"><span>•</span> <span>Prometheus + Grafana (métricas en tiempo real)</span></li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'maintenance',
      title: 'Parte 9 & 10: Mantenimiento y Planes',
      icon: Wrench,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Plan de Mantenimiento Automatizado</h4>
            <div className="space-y-3 text-white/70 text-sm">
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white">Domingo 3:00 AM</p>
                <ul className="mt-2 text-white/60 space-y-1">
                  <li>• REBUILD de índices (fragmentación &gt; 30%)</li>
                  <li>• REORGANIZE de índices (10-30%)</li>
                  <li>• UPDATE STATISTICS</li>
                </ul>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-lg p-3">
                <p className="font-medium text-white">Lunes 4:00 AM</p>
                <ul className="mt-2 text-white/60 space-y-1">
                  <li>• Verificación de integridad (DBCC CHECKDB)</li>
                  <li>• Limpieza de datos obsoletos</li>
                  <li>• Compactación de base de datos</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-emerald-400 font-semibold mb-3">Script de Fragmentación de Índices</h4>
            <code className="block bg-black/40 p-4 rounded text-emerald-400 text-xs overflow-x-auto">
{`SELECT
  DB_NAME() as 'DB',
  obj.name as 'Tabla',
  b.name as 'Índice',
  a.avg_fragmentation_in_percent as '%Frag'
FROM sys.dm_db_index_physical_stats(
  db_id(), NULL, NULL, NULL, 'LIMITED') a
INNER JOIN sys.indexes b
  ON a.object_id = b.object_id
  AND a.index_id = b.index_id
INNER JOIN sys.objects obj
  ON a.object_id = obj.object_id
WHERE a.avg_fragmentation_in_percent > 10`}
            </code>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-[#080d1a]">
      {/* Header */}
      <header className="bg-[#0a0f1e] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Documentación del Proyecto</h1>
            <p className="text-sm text-white/50 mt-1">Administración Avanzada de Bases de Datos SQL Server</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/12 text-white/70 hover:text-white transition-all"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSection === section.id;

            return (
              <div key={section.id} className="bg-[#0a0f1e] border border-white/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenSection(isOpen ? '' : section.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/3 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Icon size={20} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 border-t border-white/5">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className="mt-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-emerald-400 mb-4">Resumen de Implementación</h3>
          <p className="text-white/70 leading-relaxed">
            ParticipARD implementa un sistema completo de administración de bases de datos siguiendo estándares empresariales.
            El sistema incluye respaldos automatizados, monitoreo en tiempo real, seguridad robusta con RLS, y planes de
            mantenimiento preventivo. Toda la infraestructura está diseñada para alta disponibilidad (99.9% uptime) y
            cumple con normativas de protección de datos.
          </p>
        </div>
      </div>
    </div>
  );
}
