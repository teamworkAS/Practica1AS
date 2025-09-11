from repositories.usuarios_repository import autenticar_usuario

def iniciar_sesion(nombre_usuario, contrasena):
    user = autenticar_usuario(nombre_usuario, contrasena)
    print("DEBUG >> Resultado de query:", user)

    if user:
        return {"status": "ok", "user": user}
    else:
        return {"status": "error", "message": "Usuario y/o Contraseña incorrectos"}
