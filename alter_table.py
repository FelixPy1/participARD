from app import get_db_connection

try:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE tblActividades ADD SitioOficialURL NVARCHAR(500);')
    conn.commit()
    print('Table altered successfully.')
except Exception as e:
    print(e)
