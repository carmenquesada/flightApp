const API_BASE_CANDIDATES = [
    `${globalThis.location.origin}/api/flights`,
    "http://localhost:8081/api/flights",
    "http://localhost:8080/api/flights"
];

document.addEventListener("DOMContentLoaded", async function () {
    const form = document.getElementById("flightSearchForm");
    const originInput = document.getElementById("origin");
    const destinationInput = document.getElementById("destination");

    await loadSearchOptions();

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

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
            showError("No se pudieron cargar los vuelos. Revisa que el backend esté arrancado.");
            console.error(error);
        }
    });
});

async function loadSearchOptions() {
    try {
        const options = await fetchFromApi("/options");
        const parsed = normalizeOptionsPayload(options);
        fillSelect("origin", parsed.origins, "Selecciona origen");
        fillSelect("destination", parsed.destinations, "Selecciona destino");
        applyQueryParamSelections();
    } catch (error) {
        console.warn("No se pudo cargar /options. Se intentara construir opciones desde /api/flights", error);

        try {
            const flights = await fetchFromApi("");
            const parsed = buildOptionsFromFlights(flights);

            if (parsed.origins.length === 0 && parsed.destinations.length === 0) {
                throw new Error("No hay vuelos para construir opciones");
            }

            fillSelect("origin", parsed.origins, "Selecciona origen");
            fillSelect("destination", parsed.destinations, "Selecciona destino");
            applyQueryParamSelections();
        } catch (fallbackError) {
            showError("No se pudieron cargar los orígenes y destinos.");
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

    return Array.from(
        new Set(
            values
                .map(value => String(value || "").trim().toUpperCase())
                .filter(Boolean)
        )
    );
}

function mergeUniqueOptions(origins, destinations) {
    return Array.from(new Set([...origins, ...destinations]))
        .sort((a, b) => String(a).localeCompare(String(b), "es"));
}

async function fetchFlights(origin, destination) {
    const query = `?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    return fetchFromApi(query);
}

async function fetchFromApi(pathOrQuery) {
    let lastError;

    for (const candidate of API_BASE_CANDIDATES) {
        const url = `${candidate}${pathOrQuery}`;

        try {
            const response = await fetch(url);

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
                    <p>Duración</p>
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

function formatDuration(minutes) {
    if (!Number.isFinite(minutes)) {
        return "-";
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h ${mins}m`;
}