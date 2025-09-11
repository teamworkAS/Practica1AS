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
        templateUrl: "/app",
        controller: "appCtrl"
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
$.get("/mascotas", function (data) {
    const $select = $("#mascota")
    $select.empty()
    $select.append('<option value="">Selecciona una mascota</option>')
    data.forEach(m => {
        $select.append(`<option value="${m.idMascota}">${m.nombre}</option>`)
    })
})
}

function cargarPadrinos() {
$.get("/padrinos", function (data) {
    const $select = $("#padrino")
    $select.empty()
    $select.append('<option value="">Selecciona un padrino</option>')
    data.forEach(p => {
        $select.append(`<option value="${p.idPadrino}">${p.nombrePadrino}</option>`)
    })
})
}

app.controller("appCtrl", function ($scope, $http) {
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
        // alert(JSON.stringify(data))
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

    $(document).on("click", ".btn-ingredientes", function (event) {
        const id = $(this).data("id")

        $.get(`/productos/ingredientes/${id}`, function (html) {
            modal(html, "Ingredientes", [
                {html: "Aceptar", class: "btn btn-secondary", fun: function (event) {
                    closeModal()
                }}
            ])
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
    
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true

    var pusher = new Pusher("c018d337fb7e8338dc3a", {
      cluster: "us2"
    })

    var channel = pusher.subscribe("rapid-bird-168")
    channel.bind("eventoMascotas", function(data) {
        // alert(JSON.stringify(data))
        buscarMascotas()
    })

    $(document).on("submit", "#frmMascota", function (event) {
        event.preventDefault()

        $.post("/mascota", {
            idMascota: "",
            nombre:      $("#txtNombre").val(),
            sexo:        $("#txtSexo").val(),
            raza:        $("#txtRaza").val(),
            peso:        $("#txtPeso").val(),
            condiciones: $("#txtCondiciones").val(),
        })
    })

    $(document).off("click", ".btn-eliminar").on("click", ".btn-eliminar", function () {
        const id = $(this).data("id");
    
        if (!id) {
            alert("ID de la mascota no encontrado (id undefined). Revisa el atributo data-id en el botón.");
            return;
        }
    
        if (!confirm("¿Seguro que deseas eliminar esta mascota?")) return;
    
        $.ajax({
            url: "/mascota/eliminar",
            method: "POST",
            data: { idMascota: id },
            success: function (res) {
                console.log("Eliminación OK:", res);
                buscarMascotas();
            },
            error: function (xhr, status, err) {
                console.error("Error al eliminar:", status, err, xhr.responseText);
                alert("Error al eliminar: " + (xhr.responseText || err || status));
            }
        })
    })
})

app.controller("decoracionesCtrl", function ($scope, $http) {
    function buscarDecoraciones() {
        $.get("/tbodyDecoraciones", function (trsHTML) {
            $("#tbodyDecoraciones").html(trsHTML)
        })
    }
    //hola
    buscarDecoraciones()
    
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true

    var pusher = new Pusher("e57a8ad0a9dc2e83d9a2", {
      cluster: "us2"
    })

    var channel = pusher.subscribe("canalDecoraciones")
    channel.bind("eventoDecoraciones", function(data) {
        // alert(JSON.stringify(data))
        buscarDecoraciones()
    })

    $(document).on("submit", "#frmDecoracion", function (event) {
        event.preventDefault()

        $.post("/decoracion", {
            id: "",
            nombre: $("#txtNombre").val(),
            precio: $("#txtPrecio").val(),
            existencias: $("#txtExistencias").val(),
        })
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
function buscarApoyos() {
    $.get("/tbodyApoyo", function (trsHTML) {
        $("#tbodyApoyo").html(trsHTML)
    })
}

// cargar datos iniciales
buscarApoyos()
cargarMascotas()
cargarPadrinos()

// Enable pusher logging - don't include this in production
Pusher.logToConsole = true;

var pusher = new Pusher('505a9219e50795c4885e', {
    cluster: 'us2'
});

var channel = pusher.subscribe('for-nature-533');
channel.bind('eventoApoyos', function(data) {
    buscarApoyos()
})

// guardar apoyo
$(document).on("submit", "#frmApoyo", function (event) {
    event.preventDefault()

    $.post("/apoyo", {
        idApoyo:   $("#idApoyo").val(),
        mascota:   $("#mascota").val(),
        padrino:   $("#padrino").val(),
        monto:     $("#monto").val(),
        causa:     $("#causa").val(),
    }, function () {
        buscarApoyos()
        $("#frmApoyo")[0].reset()
    }).fail(function(xhr) {
        alert("Error al guardar: " + xhr.responseText)
    })
})

// eliminar apoyo
$(document).off("click", ".btn-eliminar").on("click", ".btn-eliminar", function () {
    const idApoyo = $(this).data("id")

    if (!confirm("¿Seguro que deseas eliminar este apoyo?")) {
        return
    }

    $.post("/apoyo/eliminar", { idApoyo: idApoyo }, function () {
        buscarApoyos()
    }).fail(function(xhr) {
        alert("Error al eliminar: " + xhr.responseText)
    })
})
})

const DateTime = luxon.DateTime
let lxFechaHora

document.addEventListener("DOMContentLoaded", function (event) {
    const configFechaHora = {
        locale: "es",
        weekNumbers: true,
        // enableTime: true,
        minuteIncrement: 15,
        altInput: true,
        altFormat: "d/F/Y",
        dateFormat: "Y-m-d",
        // time_24hr: false
    }

    activeMenuOption(location.hash)
})
