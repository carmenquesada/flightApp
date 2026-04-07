const API_ROOT_CANDIDATES = [
    `${globalThis.location.origin}/api`,
    "http://localhost:8081/api",
    "http://localhost:8080/api"
];

let currentUser = null;
let selectedFlightForBooking = null;
let allFlights = [];

document.addEventListener("DOMContentLoaded", async () => {
    currentUser = requireAuthenticatedUser();
    setupLogout();
    setupBookingModal();
    setupOfferFilters();
    await loadOffers();
});

function requireAuthenticatedUser() {
    const rawUser = globalThis.localStorage.getItem("flynowUser");

    if (!rawUser) {
        globalThis.location.href = "/login.html";
        throw new Error("Usuario no autenticado");
    }

    try {
        const user = JSON.parse(rawUser);

        if (!user || !user.id) {
            globalThis.localStorage.removeItem("flynowUser");
            globalThis.location.href = "/login.html";
            throw new Error("Sesion invalida");
        }

        return user;
    } catch {
        globalThis.localStorage.removeItem("flynowUser");
        globalThis.location.href = "/login.html";
        throw new Error("Sesion corrupta");
    }
}

function setupLogout() {
    const logoutLink = document.getElementById("logoutLink");

    if (!logoutLink) {
        return;
    }

    logoutLink.addEventListener("click", event => {
        event.preventDefault();
        globalThis.localStorage.removeItem("flynowUser");
        globalThis.location.href = "/login.html";
    });
}

async function callApi(path, options = {}) {
    let lastError;

    for (const candidate of API_ROOT_CANDIDATES) {
        const url = `${candidate}${path}`;

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} (${url})`);
            }

            return await response.json();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}

async function loadOffers() {
    const container = document.getElementById("offersContainer");
    const summary = document.getElementById("offersSummary");

    try {
        const flights = await callApi("/flights");
        allFlights = Array.isArray(flights) ? flights : [];

        applyOfferFilters();
    } catch (error) {
        console.error(error);
        summary.textContent = "No se pudieron cargar las ofertas.";
        container.innerHTML = "<p>No se pudieron cargar las ofertas.</p>";
    }
}

function setupOfferFilters() {
    const maxPriceFilter = document.getElementById("maxPriceFilter");
    const routeTypeFilter = document.getElementById("routeTypeFilter");

    if (maxPriceFilter) {
        maxPriceFilter.addEventListener("change", applyOfferFilters);
    }

    if (routeTypeFilter) {
        routeTypeFilter.addEventListener("change", applyOfferFilters);
    }
}

function applyOfferFilters() {
    const maxPriceFilter = document.getElementById("maxPriceFilter");
    const routeTypeFilter = document.getElementById("routeTypeFilter");
    const summary = document.getElementById("offersSummary");

    const maxPrice = Number(maxPriceFilter?.value || 90);
    const routeType = routeTypeFilter?.value || "all";

    let filteredFlights = [...allFlights].filter(flight => Number(flight.basePrice) <= maxPrice);

    if (routeType === "direct") {
        filteredFlights = filteredFlights.filter(flight => Number(flight.stops) === 0);
    } else if (routeType === "withStops") {
        filteredFlights = filteredFlights.filter(flight => Number(flight.stops) > 0);
    }

    filteredFlights.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));

    renderOffers(filteredFlights);

    if (filteredFlights.length === 0) {
        summary.textContent = "No hay vuelos que coincidan con esos filtros.";
        return;
    }

    summary.textContent = `Se muestran ${filteredFlights.length} oferta(s) por debajo de ${maxPrice} EUR.`;
}

function renderOffers(flights) {
    const container = document.getElementById("offersContainer");

    if (!Array.isArray(flights) || flights.length === 0) {
        container.innerHTML = `
            <article class="empty-bookings">
                <h3>No hay ofertas disponibles</h3>
                <p>Prueba con un precio maximo mas alto o cambia el tipo de vuelo.</p>
            </article>
        `;
        return;
    }

    container.innerHTML = "";

    flights.forEach(flight => {
        const price = Number(flight.basePrice);
        const offerLabel = getOfferLabel(price);

        const card = document.createElement("article");
        card.className = "flight-card offer-card";

        card.innerHTML = `
            <div class="offer-badge">${offerLabel}</div>

            <div class="flight-route">
                <div>
                    <span class="airport-code">${flight.originIata}</span>
                    <p>${flight.originIata}</p>
                </div>

                <div class="flight-line">
                    <span>${Number(flight.stops) === 0 ? "Directo" : `${flight.stops} escalas`}</span>
                </div>

                <div>
                    <span class="airport-code">${flight.destinationIata}</span>
                    <p>${flight.destinationIata}</p>
                </div>
            </div>

            <div class="flight-details">
                <div>
                    <strong>${formatTime(flight.departureTime)}</strong>
                    <p>Salida</p>
                </div>
                <div>
                    <strong>${formatTime(flight.arrivalTime)}</strong>
                    <p>Llegada</p>
                </div>
                <div>
                    <strong>${formatDuration(flight.durationMinutes)}</strong>
                    <p>Duracion</p>
                </div>
                <div class="price-box">
                    <span>Desde</span>
                    <strong>${formatPrice(flight.basePrice, flight.currency)}</strong>
                </div>
            </div>

            <button type="button" class="reserve-button">Reservar oferta</button>
        `;

        const reserveButton = card.querySelector(".reserve-button");
        reserveButton.addEventListener("click", () => openBookingModal(flight));

        container.appendChild(card);
    });
}

function getOfferLabel(price) {
    if (price <= 60) {
        return "Super oferta";
    }

    if (price <= 80) {
        return "Precio top";
    }

    return "Oferta";
}

function formatTime(isoDateTime) {
    const date = new Date(isoDateTime);

    if (Number.isNaN(date.getTime())) {
        return "--:--";
    }

    return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

function formatDuration(minutes) {
    if (!Number.isFinite(minutes)) {
        return "-";
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h ${mins}m`;
}

function formatPrice(value, currency) {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return `- ${currency || ""}`.trim();
    }

    return `${amount.toFixed(2)} ${currency || ""}`.trim();
}

function setupBookingModal() {
    const closeBtn = document.querySelector(".modal-close");
    const cancelBtn = document.getElementById("bookingCancelBtn");
    const confirmBtn = document.getElementById("bookingConfirmBtn");
    const passengersInput = document.getElementById("passengersInput");
    const overlay = document.querySelector(".modal-overlay");

    if (!closeBtn || !cancelBtn || !confirmBtn || !passengersInput || !overlay) {
        return;
    }

    closeBtn.addEventListener("click", closeBookingModal);
    cancelBtn.addEventListener("click", closeBookingModal);
    confirmBtn.addEventListener("click", submitBooking);
    passengersInput.addEventListener("input", updatePricePreview);
    overlay.addEventListener("click", closeBookingModal);
}

function openBookingModal(flight) {
    selectedFlightForBooking = flight;

    const modal = document.getElementById("bookingModal");
    const flightInfo = document.getElementById("flightInfo");
    const passengersInput = document.getElementById("passengersInput");

    if (!modal || !flightInfo || !passengersInput) {
        return;
    }

    flightInfo.textContent = `${flight.originIata} → ${flight.destinationIata} | ${flight.flightNumber} (${flight.airlineName})`;
    passengersInput.value = 1;

    updatePricePreview();

    modal.classList.remove("hidden");
    modal.style.display = "flex";
}

function closeBookingModal() {
    const modal = document.getElementById("bookingModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
    modal.style.display = "";
    selectedFlightForBooking = null;
}

function updatePricePreview() {
    if (!selectedFlightForBooking) {
        return;
    }

    const passengersInput = document.getElementById("passengersInput");
    const pricePreview = document.getElementById("pricePreview");

    const passengers = parseInt(passengersInput.value) || 1;
    const totalPrice = Number(selectedFlightForBooking.basePrice) * passengers;

    pricePreview.textContent = `Total: ${totalPrice.toFixed(2)} ${selectedFlightForBooking.currency}`;
}

async function submitBooking() {
    if (!selectedFlightForBooking || !currentUser) {
        return;
    }

    const passengersInput = document.getElementById("passengersInput");
    const passengers = parseInt(passengersInput.value) || 1;

    if (passengers < 1) {
        alert("Debes indicar al menos 1 pasajero.");
        return;
    }

    const bookingRequest = {
        userId: currentUser.id,
        flightId: selectedFlightForBooking.id,
        passengersCount: passengers
    };

    const confirmBtn = document.getElementById("bookingConfirmBtn");

    try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Procesando...";

        const response = await callApi("/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bookingRequest)
        });

        alert(`Reserva confirmada: ${response.bookingCode}`);
        closeBookingModal();
    } catch (error) {
        console.error(error);
        alert("Error al crear la reserva. Por favor, intenta de nuevo.");
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirmar Reserva";
    }
}