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


conn_str = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=100.117.127.91,1433;"
    "DATABASE=ParticipARD_DB;"
    "UID=amigo;"
    "PWD=123456;"
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
        
        query = """
            SELECT a.ActividadID as id, a.Titulo as title, a.Descripcion as description, 
                   a.Tipo as type_id, a.FechaCierre as end_date, 
                   i.Nombre as institution_name, i.InstitucionID as institution_id,
                   'Activa' as status,
                   ISNULL(a.Localidad, 'No especificada') as location,
                   ISNULL(a.Provincia, 'N/A') as province
            FROM tblActividades a
            JOIN tblInstituciones i ON a.InstitucionID = i.InstitucionID
            WHERE a.FechaCierre >= GETDATE()
        """
        params = []
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
        cursor.execute('SELECT InstitucionID as id, Nombre as name FROM tblInstituciones')
        columns = [column[0] for column in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        conn.close()
        return jsonify(results), 200
    except Exception as e:
        print(f"[ERROR Get Institutions]: {e}")
        return jsonify({"error": "Error obteniendo instituciones."}), 500

@app.route('/api/activities', methods=['POST'])
def create_activity():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tblActividades (Titulo, Descripcion, Tipo, FechaCierre, InstitucionID, Localidad, Provincia)
            OUTPUT inserted.ActividadID
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (data.get('Titulo'), data.get('Descripcion'), data.get('Tipo'), data.get('FechaCierre'), data.get('InstitucionID', 1), data.get('Localidad'), data.get('Provincia')))
        
        new_activity_id = cursor.fetchone()[0]
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
        cursor.execute("""
            UPDATE tblActividades 
            SET Titulo=?, Descripcion=?, Tipo=?, FechaCierre=?, Localidad=?, Provincia=?, InstitucionID=?
            WHERE ActividadID=?
        """, (data.get('Titulo'), data.get('Descripcion'), data.get('Tipo'), data.get('FechaCierre'), 
              data.get('Localidad'), data.get('Provincia'), data.get('InstitucionID', 1), id))
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
        cursor.execute('DELETE FROM tblInscripciones WHERE UsuarioID=?; DELETE FROM tblUsuarios WHERE UsuarioID=?;', (id, id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Usuario eliminado"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Error eliminando usuario"}), 500

@app.route('/api/enrollments', methods=['POST'])
def enroll():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO tblInscripciones (ActividadID, UsuarioID) VALUES (?, ?)', 
                      (data.get('activity_id'), data.get('user_id')))
        conn.commit()
        conn.close()
        return jsonify({"message": "Inscripción exitosa"}), 201
    except Exception as e:
        print(f"[ERROR Enrollment]: {e}")
        return jsonify({"error": "Error al inscribirse."}), 500

if __name__ == '__main__':
    print("========================================")
    print(">>> SERVIDOR FLASK (PYTHON) INICIADO EN PUERTO 5000")
    print("========================================")
    app.run(debug=True, port=5000)
