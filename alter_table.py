from app import get_db_connection

try:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE tblActividades ADD Estado NVARCHAR(20) DEFAULT 'Activa';")
    cursor.execute("ALTER TABLE tblActividades ADD FechaInicio DATE;")
    # Set default values for existing records
    cursor.execute("UPDATE tblActividades SET Estado = 'Activa' WHERE Estado IS NULL;")
    cursor.execute("UPDATE tblActividades SET FechaInicio = GETDATE() WHERE FechaInicio IS NULL;")
    conn.commit()
    print('Table altered successfully.')
except Exception as e:
    print(e)
