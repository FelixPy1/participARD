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

load_dotenv()

app = Flask(__name__)
CORS(app)


DB_DRIVER = os.getenv('DB_DRIVER', '{ODBC Driver 17 for SQL Server}')
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

    subject = f"¡Nueva Oportunidad Disponible en ParticipARD: {activity_data['Titulo']}!"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px;">
        <div style="max-w: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0;">Particip<span style="color: #34d399;">ARD</span></h2>
          </div>
          <h3 style="color: #1f2937; font-size: 20px;">¡Hola! Hay una nueva oportunidad para ti.</h3>
          <p style="color: #4b5563; line-height: 1.6;">Se ha agregado una nueva actividad a la plataforma que podría interesarte:</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong style="color: #111827;">{activity_data['Titulo']}</strong></p>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #4b5563;"><strong>Tipo:</strong> {activity_data['Tipo']}</p>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #4b5563;"><strong>Ubicación:</strong> {activity_data['Localidad']}, {activity_data['Provincia']}</p>
            <p style="margin: 0 0 5px 0; font-size: 14px; color: #4b5563;"><strong>Cierra el:</strong> {activity_data['FechaCierre']}</p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">{activity_data['Descripcion']}</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:5000" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Actividad en ParticipARD</a>
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
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"ParticipARD <{SMTP_EMAIL}>"
            msg["To"] = email
            
            part = MIMEText(html_content, "html")
            msg.attach(part)
            
            server.send_message(msg)
            
        server.quit()
        print(f"[EMAIL] Notificaciones enviadas exitosamente a {len(recipient_emails)} estudiantes.")
    except Exception as e:
        print(f"[EMAIL ERROR] Error enviando notificaciones: {e}")

def get_db_connection():
    return pyodbc.connect(conn_str)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    full_name = data.get('fullName')
    password = data.get('password')
    role = data.get('role', 'Rol_Estudiantes')

    try:
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("{CALL sp_RegistrarUsuario (?, ?, ?, ?)}", (email, full_name, password_hash, role))
        conn.commit()
        conn.close()
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
        
        cursor.execute("SELECT UsuarioID, FullName, Email, PasswordHash, RolID FROM tblUsuarios WHERE Email = ?", (email,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({"error": "Credenciales inválidas (Usuario no encontrado)."}), 401
            
        user_id, full_name, user_email, password_hash, rol_id = row
        
        if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            return jsonify({"error": "Credenciales inválidas (Contraseña incorrecta)."}), 401
            
        cursor.execute("SELECT NombreRol FROM tblRoles WHERE RolID = ?", (rol_id,))
        role_row = cursor.fetchone()
        role_name = role_row[0] if role_row else 'Rol_Estudiantes'
        
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
                   'Activa' as status,
                   ISNULL(a.Localidad, 'No especificada') as location,
                   ISNULL(a.Provincia, 'N/A') as province,
                   a.ImagenURL as image_url,
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
            query += " AND a.FechaCierre >= GETDATE()"
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
            
        cursor.execute("""
            INSERT INTO tblActividades (Titulo, Descripcion, Tipo, FechaCierre, InstitucionID, Localidad, Provincia, ImagenURL)
            OUTPUT inserted.ActividadID
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (data.get('Titulo'), data.get('Descripcion'), data.get('Tipo'), data.get('FechaCierre'), inst_id, data.get('Localidad'), None, data.get('ImagenURL')))
        
        new_activity_id = cursor.fetchone()[0]
        
        cursor.execute("""
            INSERT INTO tblAuditoria_Actividades (ActividadID, Accion, UsuarioModificador)
            VALUES (?, 'CREADA', ?)
        """, (new_activity_id, data.get('modifier', 'Sistema')))
        
        conn.commit()

        # Obtener correos de estudiantes
        cursor.execute("""
            SELECT u.Email 
            FROM tblUsuarios u
            JOIN tblRoles r ON u.RolID = r.RolID
            WHERE r.NombreRol = 'Rol_Estudiantes' AND u.Email IS NOT NULL
        """)
        student_emails = [row[0] for row in cursor.fetchall()]
        
        conn.close()

        # Iniciar hilo secundario para enviar correos si hay estudiantes
        if student_emails:
            activity_data = {
                'Titulo': data.get('Titulo', 'Nueva Actividad'),
                'Descripcion': data.get('Descripcion', ''),
                'Tipo': data.get('Tipo', 'Oportunidad'),
                'FechaCierre': data.get('FechaCierre', ''),
                'Localidad': data.get('Localidad', ''),
                'Provincia': data.get('Provincia', '')
            }
            threading.Thread(target=send_activity_notification_email, args=(activity_data, student_emails)).start()

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

        cursor.execute("""
            UPDATE tblActividades 
            SET Titulo=?, Descripcion=?, Tipo=?, FechaCierre=?, Localidad=?, Provincia=?, InstitucionID=?, ImagenURL=?
            WHERE ActividadID=?
        """, (data.get('Titulo'), data.get('Descripcion'), data.get('Tipo'), data.get('FechaCierre'), 
              data.get('Localidad'), None, inst_id, data.get('ImagenURL'), id))
              
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

if __name__ == '__main__':
    print("========================================")
    print(">>> SERVIDOR FLASK (PYTHON) INICIADO EN PUERTO 5000")
    print("========================================")
    app.run(debug=True, port=5000)
