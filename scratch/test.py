import sys; sys.path.append('.'); import app; conn = app.get_db_connection(); cursor = conn.cursor();
try:
    cursor.execute('''
        INSERT INTO tblActividades (Titulo, Descripcion, Tipo, FechaInicio, FechaCierre, InstitucionID, Localidad, Provincia, ImagenURL, SitioOficialURL, Estado)
        OUTPUT inserted.ActividadID
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('Test Activity', 'Desc', 'Tipo', None, None, 1, 'Localidad', None, None, None, 'Activa'))
    new_activity_id = cursor.fetchone()[0]
    cursor.execute('''
        INSERT INTO tblAuditoria_Actividades (ActividadID, Accion, UsuarioModificador)
        VALUES (?, 'CREADA', ?)
    ''', (new_activity_id, 'Sistema'))
    print('Success:', new_activity_id)
    conn.rollback()
except Exception as e:
    print('Exception:', e)

