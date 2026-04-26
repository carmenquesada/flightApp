const API_ROOT_CANDIDATES = [
    `${globalThis.location.origin}/api`,
    "http://localhost:8081/api",
    "http://localhost:8080/api"
];

let currentUser = null;
let cityLabelByIata = new Map();
let currentTripType = "roundtrip";
let pendingRoundTripSelection = null;

document.addEventListener("DOMContentLoaded", async () => {
    currentUser = requireAuthenticatedUser();
    setupLogout();

    await loadSearchOptions();

    const form = document.getElementById("flightSearchForm");
    const originInput = document.getElementById("origin");
    const destinationInput = document.getElementById("destination");
    const departureDateInput = document.getElementById("departureDate");
    const returnDateInput = document.getElementById("returnDate");
    const passengersInput = document.getElementById("passengers");
    const travelClassInput = document.getElementById("travelClass");

    setupTripTypeToggle();

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const origin = originInput.value.trim().toUpperCase();
        const destination = destinationInput.value.trim().toUpperCase();
        const departureDate = departureDateInput?.value?.trim() || "";
        const returnDate = returnDateInput?.value?.trim() || "";
        const passengersValue = passengersInput?.value?.trim() || "";
        const travelClassValue = travelClassInput?.value?.trim() || "";

        if (origin === "" || destination === "") {
            alert("Por favor, completa origen y destino");
            return;
        }

        if (origin === destination) {
            alert("Origen y destino deben ser distintos.");
            return;
        }

        if (currentTripType === "roundtrip" && returnDate === "") {
            alert("Para ida y vuelta debes indicar fecha de vuelta.");
            return;
        }

        if (departureDate && returnDate && returnDate < departureDate) {
            alert("La fecha de vuelta no puede ser anterior a la fecha de ida.");
            return;
        }

        const searchCriteria = {
            origin,
            destination,
            departureDate,
            returnDate,
            passengers: passengersValue,
            travelClass: travelClassValue
        };

        resetRoundTripSelection();

        try {
            if (currentTripType === "oneway") {
                const flights = await fetchFlights({
                    origin,
                    destination,
                    departureDate,
                    passengers: passengersValue,
                    travelClass: travelClassValue
                });

                showResults(flights, origin, destination);
                return;
            }

            const outboundFlights = await fetchFlights({
                origin,
                destination,
                departureDate,
                passengers: passengersValue,
                travelClass: travelClassValue
            });

            showResults(outboundFlights, origin, destination, {
                actionLabel: "Seleccionar ida",
                onAction: flight => selectOutboundFlight(flight, searchCriteria),
                selectionMessage: "Paso 1 de 2: selecciona tu vuelo de ida."
            });
        } catch (error) {
            showError("No se pudieron cargar los vuelos. Revisa que el backend este arrancado.");
            console.error(error);
        }
    });

    setupBookingModal();
});

function setupTripTypeToggle() {
    const buttons = [...document.querySelectorAll(".trip-btn")];
    const returnDateGroup = document.getElementById("returnDateGroup");
    const returnDateInput = document.getElementById("returnDate");

    if (buttons.length === 0 || !returnDateGroup || !returnDateInput) {
        return;
    }

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            currentTripType = button.dataset.tripType === "oneway" ? "oneway" : "roundtrip";

            buttons.forEach(item => {
                item.classList.toggle("active", item === button);
            });

            const oneWayMode = currentTripType === "oneway";
            returnDateGroup.classList.toggle("hidden", oneWayMode);
            returnDateInput.required = !oneWayMode;

            if (oneWayMode) {
                returnDateInput.value = "";
            }

            resetRoundTripSelection();
        });
    });
}

function resetRoundTripSelection() {
    pendingRoundTripSelection = null;
    setSelectionInfo("");
}

async function selectOutboundFlight(outboundFlight, criteria) {
    pendingRoundTripSelection = {
        criteria,
        outboundFlight
    };

    try {
        const returnFlights = await fetchFlights({
            origin: criteria.destination,
            destination: criteria.origin,
            departureDate: criteria.returnDate,
            passengers: criteria.passengers,
            travelClass: criteria.travelClass
        });

        const outboundArrival = new Date(outboundFlight.arrivalTime).getTime();
        const validReturnFlights = returnFlights.filter(flight => {
            const departureTime = new Date(flight.departureTime).getTime();
            return Number.isFinite(outboundArrival) ? departureTime >= outboundArrival : true;
        });

        const selectedOutboundLabel = `${formatLocationLabel(outboundFlight.originIata)} → ${formatLocationLabel(outboundFlight.destinationIata)} · ${formatDateTime(outboundFlight.departureTime)}`;

        showResults(validReturnFlights, criteria.destination, criteria.origin, {
            actionLabel: "Reservar ida y vuelta",
            onAction: returnFlight => openBookingModal([outboundFlight, returnFlight]),
            selectionMessage: `Paso 2 de 2: selecciona tu vuelo de vuelta. Ida elegida: ${selectedOutboundLabel}`,
            emptyMessage: "No hay vuelos de vuelta que encajen con tu selección de ida."
        });
    } catch (error) {
        showError("No se pudieron cargar los vuelos de vuelta.");
        console.error(error);
    }
}

function requireAuthenticatedUser() {
    const rawUser = globalThis.localStorage.getItem("flynowUser");

    if (!rawUser) {
        globalThis.location.href = "/login.html";
        throw new Error("Usuario no autenticado");
    }

    try {
        const user = JSON.parse(rawUser);

        if (!user?.id) {
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
    await loadCityLabels();

    try {
        const options = await callApi("/flights/options");
        const parsed = normalizeOptionsPayload(options);
        fillSelect("origin", parsed.origins, "Selecciona origen", formatLocationLabel);
        fillSelect("destination", parsed.destinations, "Selecciona destino", formatLocationLabel);
        applyQueryParamSelections();
    } catch (error) {
        console.warn("No se pudo cargar /flights/options. Se intentara con /flights", error);

        try {
            const flights = await callApi("/flights");
            const parsed = buildOptionsFromFlights(flights);

            if (parsed.origins.length === 0 && parsed.destinations.length === 0) {
                throw new Error("No hay vuelos para construir opciones");
            }

            fillSelect("origin", parsed.origins, "Selecciona origen", formatLocationLabel);
            fillSelect("destination", parsed.destinations, "Selecciona destino", formatLocationLabel);
            applyQueryParamSelections();
        } catch (fallbackError) {
            showError("No se pudieron cargar los origenes y destinos.");
            console.error(fallbackError);
        }
    }
}

async function loadCityLabels() {
    try {
        const cities = await callApi("/cities");

        if (!Array.isArray(cities)) {
            return;
        }

        cityLabelByIata = new Map(
            cities
                .map(city => {
                    const iata = String(city?.iataCode || "").trim().toUpperCase();
                    const cityName = String(city?.cityName || "").trim();

                    if (!iata || !cityName) {
                        return null;
                    }

                    return [iata, cityName];
                })
                .filter(Boolean)
        );
    } catch (error) {
        console.warn("No se pudieron cargar etiquetas de ciudades; se mostrara IATA.", error);
    }
}

function formatLocationLabel(iata) {
    const code = String(iata || "").trim().toUpperCase();
    const cityName = cityLabelByIata.get(code);

    return cityName ? `${cityName} (${code})` : code;
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

async function fetchFlights(filters) {
    const params = new URLSearchParams();
    params.set("origin", filters.origin);
    params.set("destination", filters.destination);

    if (filters.departureDate) {
        params.set("departureDate", filters.departureDate);
    }

    if (filters.returnDate) {
        params.set("returnDate", filters.returnDate);
    }

    if (filters.passengers) {
        params.set("passengers", filters.passengers);
    }

    if (filters.travelClass) {
        params.set("travelClass", filters.travelClass);
    }

    return await callApi(`/flights?${params.toString()}`);
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

function fillSelect(selectId, values, placeholderText, labelResolver = value => value) {
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
        option.textContent = labelResolver(value);
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

function showResults(flights, origin, destination, options = {}) {
    const container = document.getElementById("resultsContainer");
    const info = document.getElementById("resultsInfo");
    const actionLabel = options.actionLabel || "Reservar";
    const onAction = typeof options.onAction === "function"
        ? options.onAction
        : flight => openBookingModal([flight]);
    const emptyMessage = options.emptyMessage || `No hay vuelos para ${origin} -> ${destination}`;

    if (!container || !info) {
        console.error("No existe resultsContainer o resultsInfo");
        return;
    }

    container.innerHTML = "";
    setSelectionInfo(options.selectionMessage || "");

    if (!Array.isArray(flights) || flights.length === 0) {
        info.textContent = emptyMessage;
        return;
    }

    info.textContent = `${flights.length} vuelos encontrados para ${formatLocationLabel(origin)} -> ${formatLocationLabel(destination)}`;

    flights.forEach(flight => {
        const card = document.createElement("article");
        card.className = "flight-card";

        card.innerHTML = `
            <div class="flight-route">
                <div>
                    <span class="airport-code">${flight.originIata}</span>
                    <p>${formatLocationLabel(flight.originIata)}</p>
                </div>

                <div class="flight-line">
                    <span>${flight.stops === 0 ? "Directo" : `${flight.stops} escalas`}</span>
                </div>

                <div>
                    <span class="airport-code">${flight.destinationIata}</span>
                    <p>${formatLocationLabel(flight.destinationIata)}</p>
                </div>
            </div>

            <div class="flight-details">
                <div>
                    <strong>${formatTime(flight.departureTime)}</strong>
                    <p>Salida · ${formatDate(flight.departureTime)}</p>
                </div>
                <div>
                    <strong>${formatTime(flight.arrivalTime)}</strong>
                    <p>Llegada · ${formatDate(flight.arrivalTime)}</p>
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

            <button type="button" class="reserve-button">${actionLabel}</button>
        `;

        const reserveButton = card.querySelector(".reserve-button");
        reserveButton.addEventListener("click", () => onAction(flight));

        container.appendChild(card);
    });
}

function showError(message) {
    const info = document.getElementById("resultsInfo");
    info.textContent = message;
    setSelectionInfo("");
}

function setSelectionInfo(message) {
    const info = document.getElementById("selectionInfo");

    if (!info) {
        return;
    }

    info.textContent = message || "";
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

function formatDate(isoDateTime) {
    const date = new Date(isoDateTime);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());

    return `${day}/${month}/${year}`;
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

// Booking Modal Functions
function setupBookingModal() {
    const closeBtn = document.querySelector(".modal-close");
    const cancelBtn = document.getElementById("bookingCancelBtn");
    const confirmBtn = document.getElementById("bookingConfirmBtn");
    const passengersInput = document.getElementById("passengersInput");

    closeBtn.addEventListener("click", closeBookingModal);
    cancelBtn.addEventListener("click", closeBookingModal);
    confirmBtn.addEventListener("click", submitBooking);

    passengersInput.addEventListener("input", updatePricePreview);

    // Close modal when clicking on overlay
    const overlay = document.querySelector(".modal-overlay");
    overlay.addEventListener("click", closeBookingModal);
}

let selectedFlightsForBooking = [];

function openBookingModal(flights) {
    selectedFlightsForBooking = Array.isArray(flights) ? flights : [flights];

    const modal = document.getElementById("bookingModal");
    const modalTitle = document.getElementById("bookingModalTitle");
    const flightInfo = document.getElementById("flightInfo");
    const passengersInput = document.getElementById("passengersInput");

    const lines = selectedFlightsForBooking.map((flight, index) => {
        let legTitle = "Vuelo";

        if (selectedFlightsForBooking.length > 1) {
            legTitle = index === 0 ? "Ida" : "Vuelta";
        }

        return `${legTitle}: ${formatLocationLabel(flight.originIata)} → ${formatLocationLabel(flight.destinationIata)} | ${flight.flightNumber} (${flight.airlineName})`;
    });

    modalTitle.textContent = selectedFlightsForBooking.length > 1 ? "Reservar ida y vuelta" : "Realizar Reserva";
    flightInfo.innerHTML = lines.join("<br>");
    passengersInput.value = 1;

    updatePricePreview();

    modal.classList.remove("hidden");
}

function closeBookingModal() {
    const modal = document.getElementById("bookingModal");
    modal.classList.add("hidden");
    selectedFlightsForBooking = [];
}

function updatePricePreview() {
    if (!Array.isArray(selectedFlightsForBooking) || selectedFlightsForBooking.length === 0) {
        return;
    }

    const passengersInput = document.getElementById("passengersInput");
    const pricePreview = document.getElementById("pricePreview");

    const passengers = Number.parseInt(passengersInput.value, 10) || 1;
    const totalBasePrice = selectedFlightsForBooking
        .map(flight => Number(flight.basePrice) || 0)
        .reduce((sum, value) => sum + value, 0);
    const totalPrice = totalBasePrice * passengers;
    const currency = selectedFlightsForBooking[0]?.currency || "";

    pricePreview.textContent = `Total: ${totalPrice.toFixed(2)} ${currency}`;
}

async function submitBooking() {
    if (!Array.isArray(selectedFlightsForBooking) || selectedFlightsForBooking.length === 0 || !currentUser) {
        return;
    }

    const passengersInput = document.getElementById("passengersInput");
    const passengers = Number.parseInt(passengersInput.value, 10) || 1;

    if (passengers < 1) {
        alert("Debes indicar al menos 1 pasajero.");
        return;
    }

    try {
        const confirmBtn = document.getElementById("bookingConfirmBtn");
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Procesando...";

        const bookingCodes = [];

        for (const flight of selectedFlightsForBooking) {
            const bookingRequest = {
                userId: currentUser.id,
                flightId: flight.id,
                passengersCount: passengers
            };

            const response = await callApi("/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bookingRequest)
            });

            bookingCodes.push(response.bookingCode);
        }

        alert(`Reserva confirmada: ${bookingCodes.join(", ")}`);
        closeBookingModal();

    } catch (error) {
        console.error("Error creating booking:", error);
        alert("Error al crear la reserva. Por favor, intenta de nuevo.");
    } finally {
        const confirmBtn = document.getElementById("bookingConfirmBtn");
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirmar Reserva";
    }
}
