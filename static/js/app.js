function activeMenuOption(href) {
    $(".app-menu .nav-link")
    .removeClass("active")
    .removeAttr('aria-current')

    $(`[href="${(href ? href : "#/")}"]`)
    .addClass("active")
    .attr("aria-current", "page")
}

const app = angular.module("angularjsApp", ["ngRoute"])
app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("")

    $routeProvider
    .when("/", {
        templateUrl: "/login",
        controller: "loginCtrl"
    })
    .when("/padrinos", {
        templateUrl: "/padrinos",
        controller: "padrinosCtrl"
    })
    .when("/mascotas", {
        templateUrl: "/mascotas",
        controller: "mascotasCtrl"
    })
    .when("/cargo", {
        templateUrl: "/cargo",
        controller: "cargoCtrl"
    })
    .when("/apoyos", {
        templateUrl: "/apoyos",
        controller: "apoyosCtrl"
    })
    .otherwise({
        redirectTo: "/"
    })
})
app.run(["$rootScope", "$location", "$timeout", function($rootScope, $location, $timeout) {
    function actualizarFechaHora() {
        lxFechaHora = DateTime
        .now()
        .setLocale("es")

        $rootScope.angularjsHora = lxFechaHora.toFormat("hh:mm:ss a")
        $timeout(actualizarFechaHora, 1000)
    }

    $rootScope.slide = ""

    actualizarFechaHora()

    $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        $("html").css("overflow-x", "hidden")
        
        const path = current.$$route.originalPath

        if (path.indexOf("splash") == -1) {
            const active = $(".app-menu .nav-link.active").parent().index()
            const click  = $(`[href^="#${path}"]`).parent().index()

            if (active != click) {
                $rootScope.slide  = "animate__animated animate__faster animate__slideIn"
                $rootScope.slide += ((active > click) ? "Left" : "Right")
            }

            $timeout(function () {
                $("html").css("overflow-x", "auto")

                $rootScope.slide = ""
            }, 1000)

            activeMenuOption(`#${path}`)
        }
    })
}])

// --- funciones auxiliares para llenar selects ---
function cargarMascotas() {
    $.get("/api/mascotas", function (data) {
        const $select = $("#mascota")
        $select.empty()
        $select.append('<option value="">Selecciona una mascota</option>')
        data.forEach(m => {
            $select.append(`<option value="${m.idMascota}">${m.nombre}</option>`)
        })
    })
}

function cargarPadrinos() {
    $.get("/api/padrinos", function (data) {
        const $select = $("#padrino")
        $select.empty()
        $select.append('<option value="">Selecciona un padrino</option>')
        data.forEach(p => {
            $select.append(`<option value="${p.idPadrino}">${p.nombrePadrino}</option>`)
        })
    })
}

app.controller("loginCtrl", function ($scope, $http) {
    $("#frmInicioSesion").submit(function (event) {
        event.preventDefault()
        $.post("iniciarSesion", $(this).serialize(), function (respuesta) {
            if (respuesta.length) {
                alert("Iniciaste Sesión")
                window.location = "/#/padrinos"

                return
            }

            alert("Usuario y/o Contraseña Incorrecto(s)")
        })
    })
})
app.controller("padrinosCtrl", function ($scope, $http) {
    function buscarPadrinos() {
        $.get("/tbodyPadrinos", function (trsHTML) {
            $("#tbodyPadrinos").html(trsHTML)
        })
    }

    buscarPadrinos()
    
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true

    var pusher = new Pusher("fd4071018e972df38f9a", {
      cluster: "us2"
    })

    var channel = pusher.subscribe("hardy-drylands-461")
    channel.bind("eventoPadrinos", function(data) {
        buscarPadrinos()
    })

    $(document).on("submit", "#frmPadrino", function (event) {
        event.preventDefault()

        $.post("/padrino", {
            idPadrino: "",
            nombrePadrino:     $("#txtNombrePadrino").val(),
            sexo:              $("#txtSexo").val(),
            telefono:          $("#txtTelefono").val(),
            correoElectronico: $("#txtEmail").val(),
        })
    })

    $(document).off("click", ".btn-eliminar").on("click", ".btn-eliminar", function () {
        const id = $(this).data("idpadrino")

        if (!confirm("¿Seguro que deseas eliminar este padrino?")) {
            return
        }

        $.post("/padrino/eliminar", { idPadrino: id }, function () {
            buscarPadrinos()
        }).fail(function(xhr) {
            alert("Error al eliminar: " + xhr.responseText)
        })
    })
})

app.controller("mascotasCtrl", function ($scope, $http) {
    function buscarMascotas() {
        $.get("/tbodyMascotas", function (trsHTML) {
            $("#tbodyMascotas").html(trsHTML)
        })
    }

    buscarMascotas()

    Pusher.logToConsole = true
    var pusher = new Pusher("c018d337fb7e8338dc3a", { cluster: "us2" })
    var channel = pusher.subscribe("rapid-bird-168")
    channel.bind("eventoMascotas", function(data) {
        buscarMascotas()
    })

    $(document).on("submit", "#frmMascota", function (event) {
        event.preventDefault()

        const idMascota = $("#txtIdMascota").val() || ""
        const datos = {
            idMascota: idMascota,
            nombre: $("#txtNombre").val(),
            sexo: $("#txtSexo").val(),
            raza: $("#txtRaza").val(),
            peso: $("#txtPeso").val(),
            condiciones: $("#txtCondiciones").val(),
        }

        $.post("/mascota", datos, function (resp) {
            if (resp.status === "ok") {
                alert(idMascota ? "Mascota actualizada" : "Mascota registrada")
                $("#frmMascota")[0].reset()
                $("#txtIdMascota").val("")
                buscarMascotas()
                $("#frmMascota button[type='submit']").text("Guardar")
            }
        })
    })
    
    $(document).off("click", ".btn-eliminar").on("click", ".btn-eliminar", function () {
        const id = $(this).data("id")
        if (!id) return alert("ID no encontrado")
        if (!confirm("¿Seguro que deseas eliminar esta mascota?")) return

        $.post("/mascota/eliminar", { idMascota: id }, function () {
            buscarMascotas()
        })
    })

    $(document).off("click", ".btn-editar").on("click", ".btn-editar", function () {
        const id = $(this).data("id")

        $.get(`/mascota/${id}`, function (data) {
            $("#txtIdMascota").val(data.idMascota)
            $("#txtNombre").val(data.nombre)
            $("#txtSexo").val(data.sexo)
            $("#txtRaza").val(data.raza)
            $("#txtPeso").val(data.peso)
            $("#txtCondiciones").val(data.condiciones)
            $("#frmMascota button[type='submit']").text("Actualizar")
        })
    })

    let timer = null
    $("#txtBuscarMascota").on("keyup", function () {
        clearTimeout(timer)
        const busqueda = $(this).val()
        timer = setTimeout(() => {
            $.get("/mascotas/buscar", { busqueda: busqueda }, function (data) {
                let html = ""
                data.forEach(m => {
                    html += `
                        <tr>
                            <td>${m.idMascota}</td>
                            <td>${m.nombre}</td>
                            <td>${m.sexo}</td>
                            <td>${m.raza}</td>
                            <td>${m.peso}</td>
                            <td>${m.condiciones}</td>
                            <td><button class="btn btn-info btn-eliminar" data-id="${m.idMascota}">Eliminar</button></td>
                            <td><button class="btn btn-info btn-editar" data-id="${m.idMascota}">Editar</button></td>
                        </tr>
                    `
                })
                $("#tbodyMascotas").html(html)
            })
        }, 300)
    })
})

app.controller("cargoCtrl", function ($scope, $http) {
    function buscarCargo() {
        $.get("/tbodyCargo", function (trsHTML) {
            $("#tbodyCargo").html(trsHTML)
        })
    }

    buscarCargo()
    
    Pusher.logToConsole = true

    var pusher = new Pusher("57413b779fac9cbb46c7", {
      cluster: "us2"
    })

    var channel = pusher.subscribe("canalCargo")
    channel.bind("eventoCargo", function(data) {
        buscarCargo()
    })

    $(document).on("submit", "#frmCargo", function (event) {
        event.preventDefault()

        $.post("/cargo", {
            idCargo: "",
            descripcion: $("#txtDescripcion").val(),
            monto:       $("#txtMonto").val(),
            fecha:       $("#txtFecha").val(),
            idMascotas:  $("#txtIdMascota").val(),
        })
    })

    $(document).off("click", ".btn-eliminar").on("click", ".btn-eliminar", function () {
        const id = $(this).data("idcargo")

        if (!confirm("¿Seguro que deseas eliminar este cargo?")) {
            return
        }

        $.post("/cargo/eliminar", { idCargo: id }, function () {
            buscarCargo()
        }).fail(function(xhr) {
            alert("Error al eliminar: " + xhr.responseText)
        })
    })
})

app.controller("apoyosCtrl", function ($scope, $http) {

    let autoActualizar = false;

    // función para cargar la tabla
    function buscarApoyos(texto = "") {
        if (texto.trim() === "") {
            $.get("/tbodyApoyo", function (trsHTML) {
                $("#tbodyApoyo").html(trsHTML);
            });
        } else {
            $.get("/apoyos/buscar", { busqueda: texto }, function (data) {
                let html = "";
                data.forEach(apoyo => {
                    html += `
                        <tr>
                            <td>${apoyo.idApoyo}</td>
                            <td>${apoyo.idMascota}</td>
                            <td>${apoyo.idPadrino}</td>
                            <td>${apoyo.monto}</td>
                            <td>${apoyo.causa}</td>
                            <td><button class="btn btn-info btn-editar" data-id="${ apoyo.idApoyo }">Editar</button></td>
                            <td><button class="btn btn-info btn-eliminar" data-id="${ apoyo.idApoyo }">Eliminar</button></td>  
                        </tr>
                    `;
                });
                $("#tbodyApoyo").html(html);
            });
        }
    }

    // cargar datos iniciales
    buscarApoyos();
    cargarMascotas();
    cargarPadrinos();

    // --- búsqueda ---
    $(document).on("click", "#btnBuscar", function () {
        const texto = $("#Contbuscar").val();
        buscarApoyos(texto);
    });

    // --- editar ---
    $(document).on("click", ".btn-editar", function () {
        const id = $(this).data("id");

        $.get("/apoyo/" + id, function (respuesta) {
            if (respuesta.length > 0) {
                const apoyo = respuesta[0];
                $("#idApoyo").val(apoyo.idApoyo);
                $("#mascota").val(apoyo.idMascota);
                $("#padrino").val(apoyo.idPadrino);
                $("#monto").val(apoyo.monto);
                $("#causa").val(apoyo.causa);
            }
        })
    })

    // --- guardar (insertar o actualizar) ---
    $(document).on("submit", "#frmApoyo", function (event) {
        event.preventDefault();

        $.post("/apoyo", {
            idApoyo: $("#idApoyo").val(),
            mascota: $("#mascota").val(),
            padrino: $("#padrino").val(),
            monto: $("#monto").val(),
            causa: $("#causa").val(),
        }, function () {
            buscarApoyos();
            $("#frmApoyo")[0].reset();
            $("#idApoyo").val(""); // limpiar idApoyo para el próximo insert
        }).fail(function(xhr) {
            alert("Error al guardar: " + xhr.responseText);
        });
    });

    // --- eliminar ---
    $(document).off("click", ".btn-eliminar").on("click", ".btn-eliminar", function () {
        const idApoyo = $(this).data("id");

        if (!confirm("¿Seguro que deseas eliminar este apoyo?")) {
            return;
        }

        $.post("/apoyo/eliminar", { idApoyo: idApoyo }, function () {
            buscarApoyos();
        }).fail(function(xhr) {
            alert("Error al eliminar: " + xhr.responseText);
        });
    });

    // --- Pusher para actualización automática ---
    Pusher.logToConsole = true;
    var pusher = new Pusher('505a9219e50795c4885e', { cluster: 'us2' });
    var channel = pusher.subscribe('for-nature-533');
    channel.bind('eventoApoyos', function(data) {
        if (autoActualizar) {
            buscarApoyos();
        }
    });
});

const DateTime = luxon.DateTime
let lxFechaHora

document.addEventListener("DOMContentLoaded", function (event) {
    const configFechaHora = {
        locale: "es",
        weekNumbers: true,
        minuteIncrement: 15,
        altInput: true,
        altFormat: "d/F/Y",
        dateFormat: "Y-m-d",
    }

    activeMenuOption(location.hash)
})







