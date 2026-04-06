// Esperar a que cargue la página
document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("flightSearchForm");
    const resultsContainer = document.getElementById("resultsContainer");
    const resultsInfo = document.getElementById("resultsInfo");

    // Evento al enviar el formulario
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const origin = document.getElementById("origin").value;
        const destination = document.getElementById("destination").value;

        if (origin === "" || destination === "") {
            alert("Por favor, completa origen y destino");
            return;
        }

        // Simulación de datos (luego lo conectamos al backend)
        const vuelos = generarVuelos(origin, destination);

        mostrarResultados(vuelos);
    });

});

// Función que genera vuelos de prueba
function generarVuelos(origen, destino) {
    return [
        {
            origen: origen,
            destino: destino,
            salida: "08:30",
            llegada: "09:45",
            duracion: "1h 15m",
            precio: 79
        },
        {
            origen: origen,
            destino: destino,
            salida: "12:00",
            llegada: "13:20",
            duracion: "1h 20m",
            precio: 95
        },
        {
            origen: origen,
            destino: destino,
            salida: "18:10",
            llegada: "19:30",
            duracion: "1h 20m",
            precio: 120
        }
    ];
}

// Mostrar resultados en pantalla
function mostrarResultados(vuelos) {

    const container = document.getElementById("resultsContainer");
    const info = document.getElementById("resultsInfo");

    container.innerHTML = "";

    info.textContent = vuelos.length + " vuelos encontrados";

    vuelos.forEach(vuelo => {

        const card = document.createElement("div");
        card.classList.add("flight-card");

        card.innerHTML = `
            <div class="flight-route">
                <div>
                    <span class="airport-code">${vuelo.origen}</span>
                    <p>${vuelo.origen}</p>
                </div>

                <div class="flight-line">
                    Directo
                </div>

                <div>
                    <span class="airport-code">${vuelo.destino}</span>
                    <p>${vuelo.destino}</p>
                </div>
            </div>

            <div class="flight-details">
                <div>
                    <strong>${vuelo.salida}</strong>
                    <p>Salida</p>
                </div>

                <div>
                    <strong>${vuelo.llegada}</strong>
                    <p>Llegada</p>
                </div>

                <div>
                    <strong>${vuelo.duracion}</strong>
                    <p>Duración</p>
                </div>

                <div class="price-box">
                    <span>Precio</span>
                    <strong>${vuelo.precio} €</strong>
                </div>
            </div>

            <button class="reserve-button">Reservar</button>
        `;

        container.appendChild(card);
    });

}