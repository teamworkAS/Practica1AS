from config.database import get_connection

def get_all(limit=10, offset=0):
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    cursor.execute("""
        SELECT idMascota, nombre, sexo, raza, peso, condiciones
        FROM mascotas
        ORDER BY idMascota DESC
        LIMIT %s OFFSET %s
    """, (limit, offset))
    result = cursor.fetchall()
    cursor.close()
    con.close()
    return result

def search(busqueda, limit=10, offset=0):
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    query = """
        SELECT idMascota, nombre, sexo, raza, peso, condiciones
        FROM mascotas
        WHERE nombre LIKE %s OR sexo LIKE %s OR raza LIKE %s 
              OR peso LIKE %s OR condiciones LIKE %s
        ORDER BY idMascota DESC
        LIMIT %s OFFSET %s
    """
    like = f"%{busqueda}%"
    cursor.execute(query, (like, like, like, like, like, limit, offset))
    result = cursor.fetchall()
    cursor.close()
    con.close()
    return result

def save(mascota):
    con = get_connection()
    cursor = con.cursor()
    if mascota.get("idMascota"):
        cursor.execute("""
            UPDATE mascotas SET nombre=%s, sexo=%s, raza=%s, peso=%s, condiciones=%s
            WHERE idMascota=%s
        """, (mascota["nombre"], mascota["sexo"], mascota["raza"], mascota["peso"], mascota["condiciones"], mascota["idMascota"]))
    else:
        cursor.execute("""
            INSERT INTO mascotas (nombre, sexo, raza, peso, condiciones)
            VALUES (%s, %s, %s, %s, %s)
        """, (mascota["nombre"], mascota["sexo"], mascota["raza"], mascota["peso"], mascota["condiciones"]))
    con.commit()
    cursor.close()
    con.close()

def eliminar_por_id(id_mascota):
    con = get_connection()
    cursor = con.cursor()
    query = "DELETE FROM mascotas WHERE idMascota = %s"
    cursor.execute(query, (id_mascota,))
    con.commit()
    cursor.close()
    con.close()
    return True
