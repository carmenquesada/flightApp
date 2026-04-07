const API_ROOT_CANDIDATES = [
    `${globalThis.location.origin}/api`,
    "http://localhost:8081/api",
    "http://localhost:8080/api"
];

document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = requireAuthenticatedUser();
    setupLogout();

    await Promise.all([
        loadSearchOptions(),
        loadUserDashboard(currentUser.id)
    ]);

    const form = document.getElementById("flightSearchForm");
    const originInput = document.getElementById("origin");
    const destinationInput = document.getElementById("destination");

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const origin = originInput.value.trim().toUpperCase();
        const destination = destinationInput.value.trim().toUpperCase();

        if (origin === "" || destination === "") {
            alert("Por favor, completa origen y destino");
            return;
        }

        try {
            const flights = await fetchFlights(origin, destination);
            const filteredFlights = filterFlightsByRoute(flights, origin, destination);
            showResults(filteredFlights, origin, destination);
        } catch (error) {
            showError("No se pudieron cargar los vuelos. Revisa que el backend este arrancado.");
            console.error(error);
        }
    });
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

async function loadUserDashboard(userId) {
    try {
        const profile = await callApi(`/users/${encodeURIComponent(userId)}/profile`);
        const bookings = await callApi(`/users/${encodeURIComponent(userId)}/bookings`);

        renderProfile(profile);
        renderBookings(bookings);
    } catch (error) {
        const bookingsContainer = document.getElementById("bookingsContainer");
        bookingsContainer.innerHTML = "<p>No se pudieron cargar tus reservas.</p>";
        console.error(error);
    }
}

function renderProfile(profile) {
    document.getElementById("profileName").textContent = profile.name || "-";
    document.getElementById("profileEmail").textContent = profile.email || "-";
    document.getElementById("profilePhone").textContent = profile.phone || "No informado";
    document.getElementById("profileCreatedAt").textContent = formatDateTime(profile.createdAt);
}

function renderBookings(bookings) {
    const bookingsContainer = document.getElementById("bookingsContainer");

    if (!Array.isArray(bookings) || bookings.length === 0) {
        bookingsContainer.innerHTML = "<p>No tienes reservas todavia.</p>";
        return;
    }

    bookingsContainer.innerHTML = bookings.map(booking => `
        <article class="booking-item">
            <div class="booking-head">
                <strong>${booking.bookingCode}</strong>
                <span>${booking.status}</span>
            </div>
            <p>${booking.originIata} -> ${booking.destinationIata}</p>
            <p>${formatTime(booking.departureTime)} - ${formatTime(booking.arrivalTime)}</p>
            <p>${booking.totalPrice} ${booking.currency} · ${booking.passengersCount} pasajero(s)</p>
        </article>
    `).join("");
}

async function loadSearchOptions() {
    try {
        const options = await callApi("/flights/options");
        const parsed = normalizeOptionsPayload(options);
        fillSelect("origin", parsed.origins, "Selecciona origen");
        fillSelect("destination", parsed.destinations, "Selecciona destino");
        applyQueryParamSelections();
    } catch (error) {
        console.warn("No se pudo cargar /flights/options. Se intentara con /flights", error);

        try {
            const flights = await callApi("/flights");
            const parsed = buildOptionsFromFlights(flights);

            if (parsed.origins.length === 0 && parsed.destinations.length === 0) {
                throw new Error("No hay vuelos para construir opciones");
            }

            fillSelect("origin", parsed.origins, "Selecciona origen");
            fillSelect("destination", parsed.destinations, "Selecciona destino");
            applyQueryParamSelections();
        } catch (fallbackError) {
            showError("No se pudieron cargar los origenes y destinos.");
            console.error(fallbackError);
        }
    }
}

function normalizeOptionsPayload(options) {
    const locations = Array.isArray(options.locations)
        ? options.locations
        : mergeUniqueOptions(options.origins || [], options.destinations || []);

    const origins = Array.isArray(options.origins) && options.origins.length > 0
        ? options.origins
        : locations;

    const destinations = Array.isArray(options.destinations) && options.destinations.length > 0
        ? options.destinations
        : locations;

    return {
        origins: sanitizeIataList(origins),
        destinations: sanitizeIataList(destinations)
    };
}

function buildOptionsFromFlights(flights) {
    if (!Array.isArray(flights)) {
        return { origins: [], destinations: [] };
    }

    const originSet = new Set();
    const destinationSet = new Set();

    flights.forEach(flight => {
        const origin = String(flight.originIata || "").trim().toUpperCase();
        const destination = String(flight.destinationIata || "").trim().toUpperCase();

        if (origin) {
            originSet.add(origin);
        }

        if (destination) {
            destinationSet.add(destination);
        }
    });

    return {
        origins: Array.from(originSet),
        destinations: Array.from(destinationSet)
    };
}

function sanitizeIataList(values) {
    if (!Array.isArray(values)) {
        return [];
    }

    return Array.from(new Set(values
        .map(value => String(value || "").trim().toUpperCase())
        .filter(Boolean)));
}

function mergeUniqueOptions(origins, destinations) {
    return Array.from(new Set([...origins, ...destinations]))
        .sort((a, b) => String(a).localeCompare(String(b), "es"));
}

async function fetchFlights(origin, destination) {
    const query = `?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    return callApi(`/flights${query}`);
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

function fillSelect(selectId, values, placeholderText) {
    const select = document.getElementById(selectId);
    const sorted = [...values].sort((a, b) => String(a).localeCompare(String(b), "es"));

    select.innerHTML = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholderText;
    select.appendChild(placeholderOption);

    sorted.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

function applyQueryParamSelections() {
    const params = new URLSearchParams(globalThis.location.search);
    const origin = (params.get("origin") || "").trim().toUpperCase();
    const destination = (params.get("destination") || "").trim().toUpperCase();

    if (origin) {
        const originSelect = document.getElementById("origin");
        if ([...originSelect.options].some(option => option.value === origin)) {
            originSelect.value = origin;
        }
    }

    if (destination) {
        const destinationSelect = document.getElementById("destination");
        if ([...destinationSelect.options].some(option => option.value === destination)) {
            destinationSelect.value = destination;
        }
    }
}

function filterFlightsByRoute(flights, origin, destination) {
    if (!Array.isArray(flights)) {
        return [];
    }

    return flights.filter(flight => {
        const flightOrigin = String(flight.originIata || "").toUpperCase();
        const flightDestination = String(flight.destinationIata || "").toUpperCase();
        return flightOrigin === origin && flightDestination === destination;
    });
}

function showResults(flights, origin, destination) {
    const container = document.getElementById("resultsContainer");
    const info = document.getElementById("resultsInfo");

    container.innerHTML = "";

    if (!Array.isArray(flights) || flights.length === 0) {
        info.textContent = `No hay vuelos para ${origin} -> ${destination}`;
        return;
    }

    info.textContent = `${flights.length} vuelos encontrados para ${origin} -> ${destination}`;

    flights.forEach(flight => {
        const card = document.createElement("article");
        card.classList.add("flight-card");

        card.innerHTML = `
            <div class="flight-route">
                <div>
                    <span class="airport-code">${flight.originIata}</span>
                    <p>${flight.originIata}</p>
                </div>

                <div class="flight-line">
                    ${flight.stops === 0 ? "Directo" : `${flight.stops} escalas`}
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
                    <span>Precio</span>
                    <strong>${flight.basePrice} ${flight.currency}</strong>
                </div>
            </div>

            <button class="reserve-button">Reservar</button>
        `;

        container.appendChild(card);
    });
}

function showError(message) {
    const info = document.getElementById("resultsInfo");
    info.textContent = message;
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

function formatDateTime(isoDateTime) {
    const date = new Date(isoDateTime);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("es-ES") + " " + date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
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
