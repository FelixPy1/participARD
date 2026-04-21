import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sql = require('mssql/msnodesqlv8');
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// CONFIGURACIÓN DE CONEXIÓN A SQL SERVER
// ==========================================
const dbConfig = {
    // Autenticación Integrada de Windows (Sin cuenta explícita)
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'ParticipARD_DB',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true, // Esto enciende la Windows Authentication
        trustServerCertificate: true
    }
};

// ==========================================
// ENDPOINT: REGISTRO DE USUARIO
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, fullName, password, role } = req.body;

        // Si no se envía rol por la UI, es Estudiante por defecto.
        const rolUsuario = role || 'Rol_Estudiantes';

        console.log(`[API] Intentando registrar usuario: ${email}`);

        // Encriptar la contraseña (nunca guardes claves planas en DB)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Conectar a tu Base de Datos SQL
        let pool = await sql.connect(dbConfig);

        // Ojo: Asegurarse de que el procedimiento sp_RegistrarUsuario exige 4 parámetros ahora
        await pool.request()
            .input('Email', sql.VarChar(150), email)
            .input('FullName', sql.VarChar(150), fullName)
            .input('PasswordHash', sql.VarChar(255), passwordHash)
            .input('RolNombre', sql.VarChar(50), rolUsuario)
            .execute('sp_RegistrarUsuario');

        res.status(201).json({ message: "Usuario registrado con éxito en SQL Server." });
    } catch (err) {
        console.error("[ERROR Registro]:", err.message);
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: "Este correo electrónico ya está registrado." });
        }
        res.status(500).json({ error: "Error interno conectando a Base de Datos." });
    }
});

// ==========================================
// ENDPOINT: INICIO DE SESIÓN
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`[API] Intentando login: ${email}`);

        let pool = await sql.connect(dbConfig);

        // Buscar al usuario por correo
        const userQuery = await pool.request()
            .input('Email', sql.VarChar(150), email)
            .query('SELECT UsuarioID, FullName, Email, PasswordHash, RolID FROM tblUsuarios WHERE Email = @Email');

        if (userQuery.recordset.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas (Usuario no encontrado)." });
        }

        const user = userQuery.recordset[0];

        // Comparar contraseña plana provista en React contra el Hash en SQL Server
        const validPassword = await bcrypt.compare(password, user.PasswordHash);

        if (!validPassword) {
            return res.status(401).json({ error: "Credenciales inválidas (Contraseña incorrecta)." });
        }

        // Obtener nombre del rol
        const roleQuery = await pool.request()
            .input('RolID', sql.Int, user.RolID)
            .query('SELECT NombreRol FROM tblRoles WHERE RolID = @RolID');

        const roleName = roleQuery.recordset.length > 0 ? roleQuery.recordset[0].NombreRol : 'Rol_Estudiantes';

        // Acceso Exitoso
        res.status(200).json({
            user: {
                id: user.UsuarioID,
                fullName: user.FullName,
                email: user.Email,
                role: roleName
            }
        });
    } catch (err) {
        console.error("[ERROR Login]:", err.message);
        res.status(500).json({ error: "Error consultando SQL Server." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 SERVIDOR BACKEND INICIADO EN PUERTO ${PORT}`);
    console.log(`========================================`);
    console.log(`🔗 Verifica conexión editando .env o las credenciales físicas de SQL DB.`);
});
