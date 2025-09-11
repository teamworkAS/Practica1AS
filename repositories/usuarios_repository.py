from config.database import get_connection

def autenticar_usuario(nombre_usuario, contrasena):
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    query = """
        SELECT id_usuario
        FROM usuarios

        WHERE nombre_usuario = %s
        AND contrasena = %s
        LIMIT 1
    """
    cursor.execute(query, (nombre_usuario, contrasena))
    result = cursor.fetchone()
    cursor.close()
    con.close()
    return result
