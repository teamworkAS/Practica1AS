from flask import Flask, render_template, request, jsonify, make_response, session
from flask_cors import CORS
import mysql.connector
import datetime
import pytz
from functools import wraps
from routes.mascotas_routes import mascotas_bp

def get_connection():
    return mysql.connector.connect(
        host="185.232.14.52",
        database="u760464709_23005116_bd",
        user="u760464709_23005116_usr",
        password="z8[T&05u"
    )

app = Flask(__name__)
app.secret_key = "clave-super-secreta-2025"
CORS(app)

app.register_blueprint(mascotas_bp)

# ========================
# PUSHERS
# ========================
def pusherPadrinos():
    import pusher
    pusher_client = pusher.Pusher(
      app_id="2046006",
      key="fd4071018e972df38f9a",
      secret="f54509be4e62f829f280",
      cluster="us2",
      ssl=True
    )
    pusher_client.trigger("hardy-drylands-461", "eventoPadrinos", {"message": "Hola Mundo!"})
    return make_response(jsonify({}))

def pusherCargo():
    import pusher
    pusher_client = pusher.Pusher(
       app_id='2049018',
       key='57413b779fac9cbb46c7',
       secret='836dc20be56b5cabbfe9',
       cluster='us2',
       ssl=True
    )
    pusher_client.trigger("canalCargo", "eventoCargo", {"message": "Nuevo cargo"})
    return make_response(jsonify({}))

def pusherApoyos():
    import pusher

    pusher_client = pusher.Pusher(
      app_id='1891402',
      key='505a9219e50795c4885e',
      secret='fac4833b05652932a8bc',
      cluster='us2',
      ssl=True
    )
    
    pusher_client.trigger("for-nature-533", "eventoApoyos", {"message": "Hola Mundo!"})
    return make_response(jsonify({}))

def login(fun):
    @wraps(fun)
    def decorador(*args, **kwargs):
        if not session.get("login"):
            return jsonify({
                "estado": "error",
                "respuesta": "No has iniciado sesión"
            }), 401
        return fun(*args, **kwargs)
    return decorador

@app.route("/")
def landingPage():
    con = get_connection()
    con.close()
    return render_template("landing-page.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/login")
def appLogin():
    return render_template("login.html")

@app.route("/fechaHora")
def fechaHora():
    tz    = pytz.timezone("America/Matamoros")
    ahora = datetime.datetime.now(tz)
    return ahora.strftime("%Y-%m-%d %H:%M:%S")

@app.route("/iniciarSesion", methods=["POST"])
def iniciarSesion():
    usuario = request.form["usuario"]
    contrasena = request.form["contrasena"]

    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT Id_Usuario, Nombre_Usuario, Tipo_Usuario
    FROM usuarios
    WHERE Nombre_Usuario = %s
    AND Contrasena = %s
    """
    val = (usuario, contrasena)

    cursor.execute(sql, val)
    registros = cursor.fetchall()
    cursor.close()
    con.close()

    session["login"] = False
    session["login-usr"] = None
    session["login-tipo"] = 0

    if registros:
        usuario = registros[0]
        session["login"] = True
        session["login-usr"] = usuario["Nombre_Usuario"]
        session["login-tipo"] = usuario["Tipo_Usuario"]

    return make_response(jsonify(registros))

@app.route("/cerrarSesion", methods=["POST"])
@login
def cerrarSesion():
    session.clear()
    return make_response(jsonify({}))

@app.route("/preferencias")
@login
def preferencias():
    return make_response(jsonify({
        "usr": session.get("login-usr"),
        "tipo": session.get("login-tipo", 2)
    }))
    
# ========================
# RUTAS PADRINOS
# ========================
@app.route("/padrinos")
def padrinos():
    return render_template("padrinos.html")

@app.route("/tbodyPadrinos")
@login
def tbodyPadrinos():
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT idPadrino,
           nombrePadrino,
           sexo,
           telefono,
           correoElectronico
    FROM padrinos
    ORDER BY idPadrino DESC
    LIMIT 10 OFFSET 0
    """
    cursor.execute(sql)
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return render_template("tbodyPadrinos.html", padrinos=registros)

@app.route("/padrinos/buscar", methods=["GET"])
@login
def buscarPadrinos():
    con = get_connection()
    args     = request.args
    busqueda = args["busqueda"]
    busqueda = f"%{busqueda}%"
    
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT idPadrino,
           nombrePadrino,
           sexo,
           telefono,
           correoElectronico
    FROM padrinos
    WHERE nombrePadrino LIKE %s
    OR    telefono          LIKE %s
    OR    correoElectronico LIKE %s
    ORDER BY idPadrino DESC
    LIMIT 10 OFFSET 0
    """
    val    = (busqueda, busqueda, busqueda)

    try:
        cursor.execute(sql, val)
        registros = cursor.fetchall()
    except mysql.connector.errors.ProgrammingError as error:
        print(f"Ocurrió un error de programación en MySQL: {error}")
        registros = []
    finally:
        cursor.close()
        con.close()

    return make_response(jsonify(registros))

@app.route("/padrino", methods=["POST"])
@login
def guardarPadrinos():
    con = get_connection()
    idPadrino          = request.form["idPadrino"]
    nombrePadrino      = request.form["nombrePadrino"]
    sexo               = request.form["sexo"]
    telefono           = request.form["telefono"]
    correoElectronico  = request.form["correoElectronico"]
    
    cursor = con.cursor()

    if idPadrino:
        sql = """
        UPDATE padrinos
        SET nombrePadrino     = %s,
            sexo              = %s,
            telefono          = %s,
            correoElectronico = %s
        WHERE idPadrino = %s
        """
        val = (nombrePadrino, sexo, telefono, correoElectronico, idPadrino)
    else:
        sql = """
        INSERT INTO padrinos (nombrePadrino, sexo, telefono, correoElectronico)
        VALUES (%s, %s, %s, %s)
        """
        val = (nombrePadrino, sexo, telefono, correoElectronico)
    
    cursor.execute(sql, val)
    con.commit()
    cursor.close()
    con.close()
    pusherPadrinos()
    return make_response(jsonify({}))

@app.route("/padrino/<int:idPadrino>")
@login
def editarPadrino(idPadrino):
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT idPadrino, nombrePadrino, sexo, telefono, correoElectronico
    FROM padrinos
    WHERE idPadrino = %s
    """
    val    = (idPadrino,)
    cursor.execute(sql, val)
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return make_response(jsonify(registros))

@app.route("/padrino/eliminar", methods=["POST"])
def eliminarPadrino():
    con = get_connection()
    idPadrino = request.form["idPadrino"]
    cursor = con.cursor(dictionary=True)
    sql    = "DELETE FROM padrinos WHERE idPadrino = %s"
    val    = (idPadrino,)
    cursor.execute(sql, val)
    con.commit()
    cursor.close()
    con.close()
    pusherPadrinos()
    return make_response(jsonify({}))


# ========================
# RUTAS CARGOS
# ========================
@app.route("/cargo")
def cargo():
    return render_template("cargo.html")

@app.route("/tbodyCargo")
def tbodyCargo():
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT idCargo, descripcion, monto, fecha, idMascotas
    FROM cargo
    ORDER BY idCargo DESC
    LIMIT 10 OFFSET 0
    """
    cursor.execute(sql)
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return render_template("tbodyCargo.html", cargo=registros)

@app.route("/cargo", methods=["POST"])
def guardarCargo():
    con = get_connection()
    idCargo = request.form.get("idCargo")
    descripcion = request.form.get("descripcion")
    monto = request.form.get("monto")
    fecha = request.form.get("fecha") or None
    idMascotas = request.form.get("idMascotas") or None

    cursor = con.cursor()

    try:
        if not idCargo:
            sql = "INSERT INTO cargo (descripcion, monto, fecha, idMascotas) VALUES (%s, %s, %s, %s)"
            val = (descripcion, monto, fecha, idMascotas)
        else:
            sql = "UPDATE cargo SET descripcion=%s, monto=%s, fecha=%s, idMascotas=%s WHERE idCargo=%s"
            val = (descripcion, monto, fecha, idMascotas, idCargo)

        cursor.execute(sql, val)
        con.commit()
        cursor.close()
        con.close()
        return make_response(jsonify({"status": "ok"}))
    except Exception as e:
        con.rollback()
        print("Error al guardar cargo:", e)
        con.close()
        return make_response(jsonify({"status": "error", "message": str(e)}), 500)

@app.route("/cargo/eliminar", methods=["POST"])
def eliminarCargo():
    con = get_connection()
    idCargo = request.form["idCargo"]
    cursor = con.cursor()
    sql    = "DELETE FROM cargo WHERE idCargo = %s"
    val    = (idCargo,)
    cursor.execute(sql, val)
    con.commit()
    cursor.close()
    con.close()
    return make_response(jsonify({"succes": True}))

@app.route("/cargo/<int:idCargo>")
def obtenerCargo(idCargo):
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT idCargo, descripcion, monto, fecha, idMascotas
    FROM cargo
    WHERE idCargo = %s
    """
    cursor.execute(sql, (idCargo,))
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return make_response(jsonify(registros))


# ========================
# RUTAS APOYOS
# ========================
@app.route("/apoyos")
def apoyos():
    return render_template("apoyos.html")

@app.route("/tbodyApoyo")
@login
def tbodyApoyo():
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT idApoyo,
           idMascota,
           idPadrino,
           monto,
           causa
    FROM apoyos
    ORDER BY idApoyo DESC
    LIMIT 10 OFFSET 0
    """
    cursor.execute(sql)
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return render_template("tbodyApoyo.html", apoyos=registros)

@app.route("/productos/ingredientes/<int:idApoyo>")
@login
def productosIngredientes(id):
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT productos.Nombre_Producto, ingredientes.*, productos_ingredientes.Cantidad FROM productos_ingredientes
    INNER JOIN productos ON productos.Id_Producto = productos_ingredientes.Id_Producto
    INNER JOIN ingredientes ON ingredientes.Id_Ingrediente = productos_ingredientes.Id_Ingrediente
    WHERE productos_ingredientes.Id_Producto = %s
    ORDER BY productos.Nombre_Producto
    """
    cursor.execute(sql, (id, ))
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return render_template("modal.html", productosIngredientes=registros)

@app.route("/mascotas")
def mascotas():
    return render_template("mascotas.html")

@app.route("/api/mascotas")
def listarMascotas():
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql = "SELECT idMascota, nombre FROM mascotas ORDER BY nombre"
    cursor.execute(sql)
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return make_response(jsonify(registros))

@app.route("/api/padrinos")
def listarPadrinos():
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql = "SELECT idPadrino, nombrePadrino FROM padrinos ORDER BY nombrePadrino"
    cursor.execute(sql)
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return make_response(jsonify(registros))

@app.route("/apoyos/buscar", methods=["GET"])
@login
def buscarApoyos():
    con = get_connection()
    args     = request.args
    busqueda = args["busqueda"]
    busqueda = f"%{busqueda}%"
    
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT a.idApoyo,
       m.nombre AS mascota,
       p.nombrePadrino AS padrino,
       a.monto,
       a.causa
        FROM apoyos a
        JOIN mascotas m ON a.idMascota = m.idMascota
        JOIN padrinos p ON a.idPadrino = p.idPadrino
        WHERE m.nombre LIKE %s
           OR p.nombrePadrino LIKE %s
           OR a.monto  LIKE %s
           OR a.causa  LIKE %s
        ORDER BY a.idApoyo DESC
        LIMIT 10 OFFSET 0
    """
    val    = (busqueda, busqueda, busqueda, busqueda)

    try:
        cursor.execute(sql, val)
        registros = cursor.fetchall()
    except mysql.connector.errors.ProgrammingError as error:
        print(f"Ocurrió un error de programación en MySQL: {error}")
        registros = []
    finally:
        cursor.close()
        con.close()

    return make_response(jsonify(registros))

@app.route("/apoyo", methods=["POST"])
@login
def guardarApoyo():
    con = get_connection()
    idApoyo    = request.form["idApoyo"]
    idMascota  = request.form["mascota"]
    padrino    = request.form["padrino"]
    monto      = request.form["monto"]
    causa      = request.form["causa"]
    
    cursor = con.cursor()

    if idApoyo:
        sql = """
        UPDATE apoyos
        SET idMascota = %s,
            idPadrino = %s,
            monto     = %s,
            causa     = %s
        WHERE idApoyo = %s
        """
        val = (idMascota, padrino, monto, causa, idApoyo)
    else:
        sql = """
        INSERT INTO apoyos (idMascota, idPadrino, monto, causa)
        VALUES (%s, %s, %s, %s)
        """
        val = (idMascota, padrino, monto, causa)
    
    cursor.execute(sql, val)
    con.commit()
    cursor.close()
    con.close()
    pusherApoyos()
    return make_response(jsonify({}))
    
@app.route("/apoyo/<int:idApoyo>")
@login
def editarApoyos(idApoyo):
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT idApoyo, idMascota, idPadrino, monto, causa
    FROM apoyos
    WHERE idApoyo = %s
    """
    val    = (idApoyo,)
    cursor.execute(sql, val)
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return make_response(jsonify(registros))

@app.route("/apoyo/eliminar", methods=["POST"])
def eliminarApoyo():
    con = get_connection()
    idApoyo = request.form["idApoyo"]
    cursor = con.cursor(dictionary=True)
    sql    = """
    DELETE FROM apoyos
    WHERE idApoyo = %s
    """
    val    = (idApoyo,)
    cursor.execute(sql, val)
    con.commit()
    cursor.close()
    con.close()
    return make_response(jsonify({}))
