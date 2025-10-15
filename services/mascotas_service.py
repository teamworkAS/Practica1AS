from repositories.mascotas_repository import get_all, search, save, eliminar_por_id, get_by_id
import pusher

pusher_client = pusher.Pusher(
    app_id='2046026',
    key='c018d337fb7e8338dc3a',
    secret='ee47376ce42adae4531e',
    cluster='us2',
    ssl=True
)

def listar_mascotas():
    return get_all()

def buscar_mascotas(busqueda):
    return search(busqueda)

def guardar_mascota(mascota):
    save(mascota)
    # notificar a todos los clientes
    pusher_client.trigger("rapid-bird-168", "eventoMascotas", {"message": "Mascota actualizada!"})

def eliminar_mascota(id_mascota):
    return eliminar_por_id(id_mascota)

def obtener_mascota_por_id(id_mascota):
    return get_by_id(id_mascota)
