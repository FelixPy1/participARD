from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pyodbc
import bcrypt
import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
import re
import random
from datetime import datetime, timedelta

load_dotenv()

PENDING_REGISTRATIONS = {}

app = Flask(__name__)
CORS(app)

# Deshabilitar caché en desarrollo para evitar el problema de "cosas diferentes" entre laptops
@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response


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


# SMTP Configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_EMAIL = os.getenv('SMTP_EMAIL', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')

def send_activity_notification_email(activity_data, recipient_emails):
    if not SMTP_EMAIL or not SMTP_PASSWORD or not recipient_emails:
        print("[EMAIL] SMTP credentials not set or no recipients found. Skipping emails.")
        return

    subject = f"🚀 Nueva Oportunidad: {activity_data['Titulo']}"
    
    html_content = f"""
    <html>
      <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080d1a; margin: 0; padding: 40px; color: #ffffff;">
        <div style="max-w: 600px; margin: 0 auto; background-color: #111827; padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
                Participa<span style="color: #10b981;">RD</span>
            </h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); height: 4px; border-radius: 2px; margin-bottom: 32px;"></div>
          
          <h2 style="color: #ffffff; font-size: 22px; margin-bottom: 16px; font-weight: 700;">¡Hola! Tenemos algo nuevo para ti.</h2>
          <p style="color: #9ca3af; line-height: 1.6; font-size: 16px;">Se ha publicado una nueva actividad en nuestra plataforma que encaja con tu perfil:</p>
          
          <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(16,185,129,0.2); padding: 24px; border-radius: 16px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; color: #10b981; font-size: 18px;">{activity_data['Titulo']}</h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #9ca3af;"><strong style="color: #ffffff;">Tipo:</strong> {activity_data['Tipo']}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #9ca3af;"><strong style="color: #ffffff;">Ubicación:</strong> {activity_data['Localidad']}, {activity_data['Provincia']}</p>
            <p style="margin: 0; font-size: 14px; color: #9ca3af;"><strong style="color: #ffffff;">Fecha de Cierre:</strong> {activity_data['FechaCierre']}</p>
          </div>
          
          <p style="color: #9ca3af; line-height: 1.6; font-size: 15px; margin-bottom: 32px;">
            {activity_data['Descripcion'][:200]}{"..." if len(activity_data['Descripcion']) > 200 else ""}
          </p>
          
          <div style="text-align: center;">
            <a href="https://participard.com" style="background-color: #10b981; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(16,185,129,0.3);">
                Ver Detalles Completos
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
            <p style="color: #4b5563; font-size: 12px; margin: 0;">
                Has recibido este correo porque estás registrado en ParticipaRD.<br>
                © 2026 ParticipaRD. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)

        for email in recipient_emails:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"ParticipARD <{SMTP_EMAIL}>"
                msg["To"] = email
                
                part = MIMEText(html_content, "html")
                msg.attach(part)
                
                server.send_message(msg)
            except Exception as e:
                print(f"[EMAIL ERROR] No se pudo enviar el correo a {email}: {e}")
                continue
            
        server.quit()
        print(f"[EMAIL] Notificaciones enviadas exitosamente a {len(recipient_emails)} usuarios.")
    except Exception as e:
        print(f"[EMAIL ERROR] Error enviando notificaciones: {e}")

def get_db_connection():
    return pyodbc.connect(conn_str)

def is_password_secure(password):
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres."
    if not re.search(r"[A-Z]", password):
        return False, "La contraseña debe incluir al menos una mayúscula."
    if not re.search(r"[a-z]", password):
        return False, "La contraseña debe incluir al menos una minúscula."
    if not re.search(r"\d", password):
        return False, "La contraseña debe incluir al menos un número."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "La contraseña debe incluir al menos un carácter especial."
    return True, ""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/sw.js')
def serve_sw():
    # Return empty JS to satisfy browser PWA checks without actual PWA
    return app.response_class("self.addEventListener('fetch', function(event) { });", mimetype='application/javascript')

@app.route('/favicon.ico')
def favicon():
    # Return 204 No Content for favicon to stop 404s
    return '', 204

@app.route('/api/auth/request_register', methods=['POST'])
def request_register():
    data = request.json
    email = data.get('email')
    
    if not email or not email.strip().lower().endswith('@gmail.com'):
        return jsonify({"error": "Solo se permiten cuentas de correo de @gmail.com."}), 400
        
    email = email.strip().lower()
    password = data.get('password')
    full_name = data.get('fullName')
    
    is_secure, message = is_password_secure(password)
    if not is_secure:
        return jsonify({"error": message}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM tblUsuarios WHERE Email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Este correo electrónico ya está registrado."}), 400
        conn.close()
        
        code = str(random.randint(100000, 999999))
        
        PENDING_REGISTRATIONS[email] = {
            "code": code,
            "fullName": full_name,
            "password": password,
            "role": data.get('role', 'Rol_Estudiantes')
        }
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Código de Verificación - ParticipaRD"
        msg["From"] = f"ParticipaRD <{SMTP_EMAIL}>"
        msg["To"] = email
        
        html_content = f"""
        <html>
            <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080d1a; padding: 40px; text-align: center; color: white;">
                <div style="max-w: 500px; margin: 0 auto; background-color: #111827; padding: 40px; border-radius: 24px; border: 1px solid rgba(16,185,129,0.2);">
                    <h2 style="color: #10b981; margin-top: 0;">¡Hola {full_name}!</h2>
                    <p style="color: #9ca3af; font-size: 16px;">Para verificar que este correo es válido y te pertenece, ingresa el siguiente código de 6 dígitos en la página de registro:</p>
                    <div style="background-color: rgba(16,185,129,0.1); border: 1px dashed #10b981; padding: 20px; border-radius: 12px; margin: 30px 0;">
                        <h1 style="font-size: 42px; letter-spacing: 12px; color: #10b981; margin: 0;">{code}</h1>
                    </div>
                    <p style="color: #9ca3af; font-size: 14px;">Si no solicitaste este código, puedes ignorar este mensaje de forma segura.</p>
                </div>
            </body>
        </html>
        """
        part = MIMEText(html_content, "html")
        msg.attach(part)
        server.send_message(msg)
        server.quit()
        
        return jsonify({"message": "Código de verificación enviado"}), 200
    except Exception as e:
        print(f"[ERROR Request Register]: {e}")
        return jsonify({"error": "No se pudo enviar el correo de verificación. Asegúrate de que el correo existe y puede recibir mensajes."}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Correo es requerido."}), 400
        
    email = email.strip().lower()
    code = data.get('code')
    
    if email not in PENDING_REGISTRATIONS:
        return jsonify({"error": "No hay un registro pendiente para este correo. Intenta registrarte de nuevo."}), 400
        
    pending = PENDING_REGISTRATIONS[email]
    if pending['code'] != code:
        return jsonify({"error": "Código de verificación incorrecto."}), 400
        
    full_name = pending['fullName']
    password = pending['password']
    role = pending['role']

    try:
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("{CALL sp_RegistrarUsuario (?, ?, ?, ?)}", (email, full_name, password_hash, role))
        # sp_RegistrarUsuario doesn't set FechaUltimoCambioPassword by default in old script, 
        # but our migration added the default. Let's ensure it's set if we want to be explicit.
        cursor.execute("UPDATE tblUsuarios SET FechaUltimoCambioPassword = GETDATE() WHERE Email = ?", (email,))
        
        conn.commit()
        conn.close()
        del PENDING_REGISTRATIONS[email]
        return jsonify({"message": "Usuario registrado con éxito en SQL Server."}), 201
    except pyodbc.IntegrityError:
        return jsonify({"error": "Este correo electrónico ya está registrado."}), 400
    except Exception as e:
        print(f"[ERROR Registro]: {e}")
        return jsonify({"error": "Error interno conectando a Base de Datos."}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT UsuarioID, FullName, Email, PasswordHash, RolID, 
                   IntentosFallidos, BloqueadoHasta, FechaUltimoCambioPassword 
            FROM tblUsuarios WHERE Email = ?
        """, (email,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({"error": "Credenciales inválidas (Usuario no encontrado)."}), 401
            
        user_id, full_name, user_email, password_hash, rol_id, intentos, bloqueado_hasta, fecha_pass = row
        
        # Check if blocked
        if bloqueado_hasta and bloqueado_hasta > datetime.now():
            segundos_restantes = int((bloqueado_hasta - datetime.now()).total_seconds())
            return jsonify({
                "error": "Cuenta bloqueada temporalmente.",
                "lockout": True,
                "seconds_remaining": segundos_restantes
            }), 403

        if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            # Increment failed attempts
            intentos += 1
            if intentos >= 3:
                nuevo_bloqueo = datetime.now() + timedelta(minutes=3)
                cursor.execute("UPDATE tblUsuarios SET IntentosFallidos = ?, BloqueadoHasta = ? WHERE UsuarioID = ?", 
                             (intentos, nuevo_bloqueo, user_id))
                conn.commit()
                return jsonify({
                    "error": "Cuenta bloqueada por 3 minutos tras 3 intentos fallidos.",
                    "lockout": True,
                    "seconds_remaining": 180
                }), 403
            else:
                cursor.execute("UPDATE tblUsuarios SET IntentosFallidos = ? WHERE UsuarioID = ?", (intentos, user_id))
                conn.commit()
                return jsonify({"error": f"Contraseña incorrecta. Intento {intentos} de 3."}), 401
            
        # Success - Reset lockout and attempts
        cursor.execute("UPDATE tblUsuarios SET IntentosFallidos = 0, BloqueadoHasta = NULL WHERE UsuarioID = ?", (user_id,))
        
        # Check password expiration (90 days)
        if fecha_pass and (datetime.now() - fecha_pass).days >= 90:
            conn.commit()
            return jsonify({
                "error": "Tu contraseña ha expirado (más de 90 días). Por favor, cámbiala.",
                "expired": True,
                "user_id": str(user_id)
            }), 403

        cursor.execute("SELECT NombreRol FROM tblRoles WHERE RolID = ?", (rol_id,))
        role_row = cursor.fetchone()
        role_name = role_row[0] if role_row else 'Rol_Estudiantes'
        
        conn.commit()
        conn.close()
        return jsonify({
            "user": {
                "id": str(user_id),
                "fullName": full_name,
                "email": user_email,
                "role": role_name
            }
        }), 200
    except Exception as e:
        print(f"[ERROR Login]: {e}")
        return jsonify({"error": "Error consultando SQL Server."}), 500

@app.route('/api/activities', methods=['GET'])
def get_activities():
    try:
        province = request.args.get('province')
        type_id = request.args.get('type')
        
        fetch_all = request.args.get('all')
        
        query = """
            SELECT a.ActividadID as id, a.Titulo as title, a.Descripcion as description, 
                   a.Tipo as type_id, a.FechaCierre as end_date, 
                   i.Nombre as institution_name, i.InstitucionID as institution_id,
                   ISNULL(a.Estado, 'Activa') as status,
                   ISNULL(a.Localidad, 'No especificada') as location,
                   ISNULL(a.Provincia, 'N/A') as province,
                   a.ImagenURL as image_url,
                   a.SitioOficialURL as official_url,
                   a.FechaInicio as start_date,
                   aud.UsuarioModificador as created_by,
                   aud.FechaModificacion as created_at
            FROM tblActividades a
            JOIN tblInstituciones i ON a.InstitucionID = i.InstitucionID
            OUTER APPLY (
                SELECT TOP 1 UsuarioModificador, FechaModificacion
                FROM tblAuditoria_Actividades
                WHERE ActividadID = a.ActividadID AND Accion = 'CREADA'
                ORDER BY FechaModificacion ASC
            ) aud
            WHERE 1=1
        """
        params = []
        if not fetch_all:
            query += " AND (a.FechaCierre >= GETDATE() OR a.FechaCierre IS NULL) AND ISNULL(a.Estado, 'Activa') = 'Activa'"
        if province:
            query += " AND a.Provincia = ?"
            params.append(province)
        if type_id:
            query += " AND a.Tipo = ?"
            params.append(type_id)
            
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        
        columns = [column[0] for column in cursor.description]
        results = []
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
            
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        print(f"[ERROR Get Activities]: {e}")
        return jsonify({"error": "Error obteniendo actividades."}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.UsuarioID as id, u.FullName as full_name, u.Email as email, 
                   r.NombreRol as role, u.FechaCreacion as created_at
            FROM tblUsuarios u
            JOIN tblRoles r ON u.RolID = r.RolID
        """)
        columns = [column[0] for column in cursor.description]
        results = []
        for row in cursor.fetchall():
            row_dict = dict(zip(columns, row))
            row_dict['id'] = str(row_dict['id'])
            results.append(row_dict)
            
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        print(f"[ERROR Get Users]: {e}")
        return jsonify({"error": "Error obteniendo usuarios."}), 500

@app.route('/api/institutions', methods=['GET'])
def get_institutions():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT InstitucionID as id, Nombre as name FROM tblInstituciones")
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        print(f"[ERROR Get Institutions]: {e}")
        return jsonify({"error": "Error obteniendo instituciones."}), 500

@app.route('/api/enrollments', methods=['POST'])
def enroll():
    data = request.json
    user_id = data.get('user_id')
    activity_id = data.get('activity_id')
    
    if not user_id or not activity_id:
        return jsonify({"error": "Faltan datos de inscripción."}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if already enrolled
        cursor.execute("SELECT 1 FROM tblInscripciones WHERE UsuarioID = ? AND ActividadID = ?", (user_id, activity_id))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "UNIQUE"}), 400
            
        cursor.execute(
            "INSERT INTO tblInscripciones (UsuarioID, ActividadID, FechaInscripcion, EstadoInscripcion) VALUES (?, ?, GETDATE(), 'Activa')",
            (user_id, activity_id)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Inscripción exitosa"}), 201
    except pyodbc.IntegrityError:
        return jsonify({"error": "PRIMARY KEY"}), 400
    except Exception as e:
        print(f"[ERROR Enrollment]: {e}")
        return jsonify({"error": "Error interno al procesar inscripción."}), 500

@app.route('/api/activities', methods=['POST'])
def create_activity():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        institution_name = data.get('InstitucionNombre')
        if institution_name:
            cursor.execute("SELECT InstitucionID FROM tblInstituciones WHERE Nombre = ?", (institution_name,))
            row = cursor.fetchone()
            if row:
                inst_id = row[0]
            else:
                cursor.execute("INSERT INTO tblInstituciones (Nombre, Tipo) OUTPUT inserted.InstitucionID VALUES (?, ?)", (institution_name, 'Otra'))
                inst_id = cursor.fetchone()[0]
        else:
            inst_id = 1
            
        fecha_inicio = data.get('FechaInicio')
        fecha_inicio = fecha_inicio if fecha_inicio else None
        fecha_cierre = data.get('FechaCierre')
        fecha_cierre = fecha_cierre if fecha_cierre else None
        
        cursor.execute("""
            SET NOCOUNT ON;
            DECLARE @OutputTbl TABLE (ActividadID INT);
            INSERT INTO tblActividades (Titulo, Descripcion, Tipo, FechaInicio, FechaCierre, InstitucionID, Localidad, Provincia, ImagenURL, SitioOficialURL, Estado)
            OUTPUT inserted.ActividadID INTO @OutputTbl(ActividadID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            SELECT ActividadID FROM @OutputTbl;
        """, (data.get('Titulo'), data.get('Descripcion'), data.get('Tipo'), fecha_inicio, fecha_cierre, inst_id, data.get('Localidad'), None, data.get('ImagenURL'), data.get('SitioOficialURL'), data.get('Estado', 'Activa')))
        
        new_activity_id = cursor.fetchone()[0]
        
        cursor.execute("""
            INSERT INTO tblAuditoria_Actividades (ActividadID, Accion, UsuarioModificador)
            VALUES (?, 'CREADA', ?)
        """, (new_activity_id, data.get('modifier', 'Sistema')))
        
        conn.commit()

        # Obtener correos de TODOS los usuarios registrados para notificar
        cursor.execute("SELECT Email FROM tblUsuarios WHERE Email IS NOT NULL")
        recipient_emails = [row[0] for row in cursor.fetchall()]
        
        conn.close()

        # Iniciar hilo secundario para enviar correos si hay destinatarios
        if recipient_emails:
            activity_data = {
                'Titulo': data.get('Titulo', 'Nueva Actividad'),
                'Descripcion': data.get('Descripcion', ''),
                'Tipo': data.get('Tipo', 'Oportunidad'),
                'FechaCierre': data.get('FechaCierre', ''),
                'Localidad': data.get('Localidad', ''),
                'Provincia': data.get('Provincia', 'República Dominicana')
            }
            print(f"[DEBUG] Iniciando envío de correos a {len(recipient_emails)} usuarios...")
            threading.Thread(target=send_activity_notification_email, args=(activity_data, recipient_emails)).start()

        return jsonify({"message": "Actividad creada exitosamente", "id": new_activity_id}), 201
    except Exception as e:
        print(e)
        return jsonify({"error": "Error creando actividad"}), 500

@app.route('/api/activities/<int:id>', methods=['PUT'])
def update_activity(id):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        institution_name = data.get('InstitucionNombre')
        if institution_name:
            cursor.execute("SELECT InstitucionID FROM tblInstituciones WHERE Nombre = ?", (institution_name,))
            row = cursor.fetchone()
            if row:
                inst_id = row[0]
            else:
                cursor.execute("INSERT INTO tblInstituciones (Nombre, Tipo) OUTPUT inserted.InstitucionID VALUES (?, ?)", (institution_name, 'Otra'))
                inst_id = cursor.fetchone()[0]
        else:
            inst_id = 1

        fecha_inicio = data.get('FechaInicio')
        fecha_inicio = fecha_inicio if fecha_inicio else None
        fecha_cierre = data.get('FechaCierre')
        fecha_cierre = fecha_cierre if fecha_cierre else None
        
        cursor.execute("""
            UPDATE tblActividades 
            SET Titulo=?, Descripcion=?, Tipo=?, FechaInicio=?, FechaCierre=?, Localidad=?, Provincia=?, InstitucionID=?, ImagenURL=?, SitioOficialURL=?, Estado=?
            WHERE ActividadID=?
        """, (data.get('Titulo'), data.get('Descripcion'), data.get('Tipo'), fecha_inicio, fecha_cierre, 
              data.get('Localidad'), None, inst_id, data.get('ImagenURL'), data.get('SitioOficialURL'), data.get('Estado', 'Activa'), id))
              
        cursor.execute("""
            INSERT INTO tblAuditoria_Actividades (ActividadID, Accion, UsuarioModificador)
            VALUES (?, 'EDITADA', ?)
        """, (id, data.get('modifier', 'Sistema')))
        
        conn.commit()
        conn.close()
        return jsonify({"message": "Actividad actualizada"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Error actualizando actividad"}), 500

@app.route('/api/activities/<int:id>', methods=['DELETE'])
def delete_activity(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("{CALL sp_BorrarActividadSegura (?)}", (id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Actividad eliminada"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Error eliminando actividad"}), 500

@app.route('/api/users/<string:id>', methods=['PUT'])
def update_user(id):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT RolID FROM tblRoles WHERE NombreRol = ?", (data.get('RolID', 'Rol_Estudiantes'),))
        role_row = cursor.fetchone()
        rol_id = role_row[0] if role_row else 2
        
        cursor.execute("""
            UPDATE tblUsuarios 
            SET FullName=?, Email=?, RolID=?
            WHERE UsuarioID=?
        """, (data.get('FullName'), data.get('Email'), rol_id, id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Usuario actualizado"}), 200
    except Exception as e:
        print(f"[ERROR Update User]: {e}")
        return jsonify({"error": "Error actualizando usuario"}), 500

@app.route('/api/users/<string:id>', methods=['DELETE'])
def delete_user(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user's name before deleting
        cursor.execute("SELECT FullName FROM tblUsuarios WHERE UsuarioID=?", (id,))
        row = cursor.fetchone()
        deleted_name = row[0] if row else 'Usuario Desconocido'
        
        cursor.execute('DELETE FROM tblInscripciones WHERE UsuarioID=?; DELETE FROM tblUsuarios WHERE UsuarioID=?;', (id, id))
        
        # Log the deletion
        modifier = request.args.get('modifier', 'Sistema')
        cursor.execute("""
            INSERT INTO tblAuditoria_Actividades (ActividadID, Accion, UsuarioModificador)
            VALUES (NULL, 'USUARIO ELIMINADO', ?)
        """, (f"{deleted_name} (por {modifier})",))
        
        conn.commit()
        conn.close()
        return jsonify({"message": "Usuario eliminado"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Error eliminando usuario"}), 500


@app.route('/api/news', methods=['GET'])
def get_news():
    try:
        search = request.args.get('search')
        query = """
            SELECT n.NoticiaID as id, n.Titulo as title, n.Resumen as summary, 
                   n.Contenido as content, n.ImagenURL as image_url, 
                   n.FechaPublicacion as date, n.Vistas as views,
                   u.FullName as author_name, u.UsuarioID as author_id
            FROM tblNoticias n
            LEFT JOIN tblUsuarios u ON n.AutorID = u.UsuarioID
            WHERE 1=1
        """
        params = []
        if search:
            query += " AND (n.Titulo LIKE ? OR n.Resumen LIKE ?)"
            params.extend([f'%{search}%', f'%{search}%'])
        
        query += " ORDER BY n.FechaPublicacion DESC"
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)
        
        columns = [column[0] for column in cursor.description]
        results = []
        for row in cursor.fetchall():
            row_dict = dict(zip(columns, row))
            if row_dict['author_id']:
                row_dict['author_id'] = str(row_dict['author_id'])
            results.append(row_dict)
            
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        print(f"[ERROR Get News]: {e}")
        return jsonify({"error": "Error obteniendo noticias."}), 500

@app.route('/api/news/<int:news_id>', methods=['GET'])
def get_news_detail(news_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT n.NoticiaID, n.Titulo, n.Contenido, n.Resumen, n.ImagenURL, 
                   n.FechaPublicacion, n.Vistas, u.FullName as AutorNombre
            FROM tblNoticias n
            LEFT JOIN tblUsuarios u ON n.AutorID = u.UsuarioID
            WHERE n.NoticiaID = ?
        """, (news_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Noticia no encontrada'}), 404
            
        news = {
            'id': row[0],
            'title': row[1],
            'content': row[2],
            'summary': row[3],
            'image_url': row[4],
            'date': row[5].isoformat() if row[5] else None,
            'views': row[6],
            'author_name': row[7]
        }
        
        conn.close()
        return jsonify(news), 200
    except Exception as e:
        print(f"[ERROR Get News Detail]: {e}")
        return jsonify({"error": "Error obteniendo detalle de noticia."}), 500

@app.route('/api/news/<int:news_id>/view', methods=['POST'])
def increment_news_view(news_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE tblNoticias SET Vistas = Vistas + 1 WHERE NoticiaID = ?", (news_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/news', methods=['POST'])
def create_news():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO tblNoticias (Titulo, Contenido, Resumen, ImagenURL, AutorID)
            OUTPUT inserted.NoticiaID
            VALUES (?, ?, ?, ?, ?)
        """, (data.get('title'), data.get('content'), data.get('summary'), 
              data.get('image_url'), data.get('author_id')))
        
        new_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        return jsonify({"message": "Noticia creada exitosamente", "id": new_id}), 201
    except Exception as e:
        print(f"[ERROR Create News]: {e}")
        return jsonify({"error": "Error creando noticia"}), 500

@app.route('/api/news/<int:id>', methods=['PUT'])
def update_news(id):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE tblNoticias 
            SET Titulo=?, Contenido=?, Resumen=?, ImagenURL=?
            WHERE NoticiaID=?
        """, (data.get('title'), data.get('content'), data.get('summary'), 
              data.get('image_url'), id))
        
        conn.commit()
        conn.close()
        return jsonify({"message": "Noticia actualizada"}), 200
    except Exception as e:
        print(f"[ERROR Update News]: {e}")
        return jsonify({"error": "Error actualizando noticia"}), 500

@app.route('/api/news/<int:id>', methods=['DELETE'])
def delete_news(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tblNoticias WHERE NoticiaID = ?", (id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Noticia eliminada"}), 200
    except Exception as e:
        print(f"[ERROR Delete News]: {e}")
        return jsonify({"error": "Error eliminando noticia"}), 500

@app.route('/api/recent_activity', methods=['GET'])
def get_recent_activity():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT TOP 10 u.FullName, r.NombreRol, u.FechaCreacion as Fecha
            FROM tblUsuarios u
            JOIN tblRoles r ON u.RolID = r.RolID
            ORDER BY u.FechaCreacion DESC
        """)
        users = cursor.fetchall()
        
        cursor.execute("""
            SELECT TOP 10 a.Accion, a.UsuarioModificador, a.FechaModificacion as Fecha, act.Titulo
            FROM tblAuditoria_Actividades a
            LEFT JOIN tblActividades act ON a.ActividadID = act.ActividadID
            ORDER BY a.FechaModificacion DESC
        """)
        audits = cursor.fetchall()
        
        conn.close()
        
        feed = []
        for row in users:
            feed.append({
                'type': 'user',
                'name': row[0],
                'role': row[1],
                'date': row[2].isoformat() if row[2] else None
            })
            
        for row in audits:
            feed.append({
                'type': 'activity',
                'action': row[0], 
                'user': row[1],
                'date': row[2].isoformat() if row[2] else None,
                'title': row[3] or 'Actividad Eliminada'
            })
            
        feed.sort(key=lambda x: x['date'] if x['date'] else '', reverse=True)
        return jsonify(feed[:5]), 200
    except Exception as e:
        print(f"[ERROR Recent Activity]: {e}")
        return jsonify({"error": "Error obteniendo actividad reciente."}), 500

# ================= CONTRIBUTORS API =================

@app.route('/api/contributors', methods=['GET'])
def get_contributors():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ContribuidorID as id, Nombre as name, Rol as role, Categoria as category, ImagenURL as image_url, Orden as [order] FROM tblContribuidores ORDER BY Orden ASC, Nombre ASC")
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        print(f"[ERROR Get Contributors]: {e}")
        return jsonify({"error": "Error obteniendo contribuidores."}), 500

@app.route('/api/contributors', methods=['POST'])
def create_contributor():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tblContribuidores (Nombre, Rol, Categoria, ImagenURL, Orden)
            OUTPUT inserted.ContribuidorID
            VALUES (?, ?, ?, ?, ?)
        """, (data.get('name'), data.get('role'), data.get('category'), 
              data.get('image_url'), data.get('order', 0)))
        new_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        return jsonify({"message": "Contribuidor creado exitosamente", "id": new_id}), 201
    except Exception as e:
        print(f"[ERROR Create Contributor]: {e}")
        return jsonify({"error": "Error creando contribuidor"}), 500

@app.route('/api/contributors/<int:id>', methods=['PUT'])
def update_contributor(id):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE tblContribuidores 
            SET Nombre=?, Rol=?, Categoria=?, ImagenURL=?, Orden=?
            WHERE ContribuidorID=?
        """, (data.get('name'), data.get('role'), data.get('category'), 
              data.get('image_url'), data.get('order', 0), id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Contribuidor actualizado"}), 200
    except Exception as e:
        print(f"[ERROR Update Contributor]: {e}")
        return jsonify({"error": "Error actualizando contribuidor"}), 500

@app.route('/api/contributors/<int:id>', methods=['DELETE'])
def delete_contributor(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tblContribuidores WHERE ContribuidorID = ?", (id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Contribuidor eliminado"}), 200
    except Exception as e:
        print(f"[ERROR Delete Contributor]: {e}")
        return jsonify({"error": "Error eliminando contribuidor"}), 500

if __name__ == '__main__':
    print("========================================")
    print(">>> SERVIDOR FLASK (PYTHON) INICIADO EN PUERTO 5000")
    print("========================================")
    app.run(debug=True, port=5000)
