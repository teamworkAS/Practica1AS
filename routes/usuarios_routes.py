from flask import Blueprint, request, jsonify, render_template
from services.usuarios_service import iniciar_sesion

usuarios_bp = Blueprint("usuarios", __name__)

@usuarios_bp.route("/login")
def login_page():
    return render_template("login.html")

@usuarios_bp.route("/iniciarSesion", methods=["POST"])
def login_action():
    usuario = request.form.get("txtUsuario")
    contrasena = request.form.get("txtContrasena")
    
    resultado = iniciar_sesion(usuario, contrasena)
    
    if resultado["status"] == "ok":
        return jsonify(resultado["user"])
    else:
        return jsonify([])
