const API_ROOT_CANDIDATES = [
    `${globalThis.location.origin}/api`,
    "http://localhost:8081/api",
    "http://localhost:8080/api"
];

let currentUser = null;
let bookingToCancel = null;

document.addEventListener("DOMContentLoaded", async () => {
    currentUser = requireAuthenticatedUser();
    setupLogout();
    setupCancelModal();
    await loadBookings();
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
    const candidates = [
        "http://localhost:8081/api",
        `${globalThis.location.origin}/api`,
        "http://localhost:8080/api"
    ];

    let lastError;

    for (const candidate of candidates) {
        const url = `${candidate}${path}`;

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status} en ${url} -> ${errorText}`);
            }

            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                return await response.json();
            }

            return null;
        } catch (error) {
            console.error("Fallo API:", error);
            lastError = error;
        }
    }

    throw lastError;
}

async function loadBookings() {
    try {
        const bookings = await callApi(`/users/${encodeURIComponent(currentUser.id)}/bookings`);

        const activeBookings = Array.isArray(bookings)
            ? bookings.filter(booking => booking.status !== "CANCELLED")
            : [];

        renderBookings(activeBookings);
    } catch (error) {
        document.getElementById("bookingsSummary").textContent = "No se pudieron cargar tus reservas.";
        document.getElementById("bookingsContainer").innerHTML = "<p>No se pudieron cargar tus reservas.</p>";
        console.error(error);
    }
}

function renderBookings(bookings) {
    const container = document.getElementById("bookingsContainer");
    const summary = document.getElementById("bookingsSummary");

    if (!Array.isArray(bookings) || bookings.length === 0) {
        summary.textContent = "No tienes reservas registradas.";
        container.innerHTML = `
            <article class="empty-bookings">
                <h3>Aun no tienes reservas</h3>
                <p>Cuando reserves un vuelo, aparecera aqui con toda la informacion.</p>
                <a href="/busquedaVuelos.html" class="btn-primary inline-action">Buscar vuelos</a>
            </article>
        `;
        return;
    }

    summary.textContent = `Tienes ${bookings.length} reserva(s) registradas.`;

    container.innerHTML = bookings.map(booking => {

        console.log("BOOKING:", booking);
        
        const isCancelled = booking.status === "CANCELLED";

        return `
            <article class="booking-card ${isCancelled ? "booking-cancelled" : ""}">
                <div class="booking-card-top">
                    <div>
                        <p class="booking-code-label">Codigo de reserva</p>
                        <h3>${booking.bookingCode}</h3>
                    </div>

                    <span class="booking-status ${isCancelled ? "status-cancelled" : "status-confirmed"}">
                        ${formatStatus(booking.status)}
                    </span>
                </div>

                <div class="booking-route">
                    <div class="route-point">
                        <span class="route-iata">${booking.originIata}</span>
                        <p>Origen</p>
                    </div>

                    <div class="route-line">✈</div>

                    <div class="route-point">
                        <span class="route-iata">${booking.destinationIata}</span>
                        <p>Destino</p>
                    </div>
                </div>

                <div class="booking-meta">
                    <div class="booking-meta-item">
                        <span>Vuelo</span>
                        <strong>${booking.flightNumber || "-"}</strong>
                    </div>

                    <div class="booking-meta-item">
                        <span>Aerolinea</span>
                        <strong>${booking.airlineName || "-"}</strong>
                    </div>

                    <div class="booking-meta-item">
                        <span>Salida</span>
                        <strong>${formatDateTime(booking.departureTime)}</strong>
                    </div>

                    <div class="booking-meta-item">
                        <span>Llegada</span>
                        <strong>${formatDateTime(booking.arrivalTime)}</strong>
                    </div>

                    <div class="booking-meta-item">
                        <span>Pasajeros</span>
                        <strong>${booking.passengersCount}</strong>
                    </div>

                    <div class="booking-meta-item">
                        <span>Total</span>
                        <strong>${formatPrice(booking.totalPrice, booking.currency)}</strong>
                    </div>
                </div>

                <div class="booking-card-footer">
                    <div class="booking-created">
                        Reservada el ${formatDateTime(booking.createdAt)}
                    </div>

                    ${
                        isCancelled
                            ? `<button type="button" class="btn-secondary" disabled>Reserva cancelada</button>`
                            : `<button type="button" class="btn-danger cancel-booking-btn"
                                 data-booking-id="${booking.bookingId}"
                                 data-booking-code="${booking.bookingCode}"
                                 data-origin="${booking.originIata}"
                                 data-destination="${booking.destinationIata}">
                                 Cancelar reserva
                               </button>`
                    }
                </div>
            </article>
        `;
    }).join("");

    bindCancelButtons();
}

function bindCancelButtons() {
    const buttons = document.querySelectorAll(".cancel-booking-btn");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            console.log("ID reserva a cancelar:", button.dataset.bookingId);

            bookingToCancel = {
                id: button.dataset.bookingId,
                bookingCode: button.dataset.bookingCode,
                originIata: button.dataset.origin,
                destinationIata: button.dataset.destination
            };

            openCancelModal();
        });
    });
}

function setupCancelModal() {
    const closeBtn = document.getElementById("cancelModalClose");
    const keepBtn = document.getElementById("cancelKeepBtn");
    const confirmBtn = document.getElementById("cancelConfirmBtn");
    const overlay = document.querySelector("#cancelModal .modal-overlay");

    if (closeBtn) {
        closeBtn.addEventListener("click", closeCancelModal);
    }

    if (keepBtn) {
        keepBtn.addEventListener("click", closeCancelModal);
    }

    if (confirmBtn) {
        confirmBtn.addEventListener("click", confirmCancelBooking);
    }

    if (overlay) {
        overlay.addEventListener("click", closeCancelModal);
    }
}

function openCancelModal() {
    const modal = document.getElementById("cancelModal");
    const info = document.getElementById("cancelModalInfo");

    if (!modal || !info || !bookingToCancel) {
        return;
    }

    info.textContent = `Vas a cancelar la reserva ${bookingToCancel.bookingCode} del trayecto ${bookingToCancel.originIata} → ${bookingToCancel.destinationIata}.`;

    modal.classList.remove("hidden");
    modal.style.display = "flex";
}

function closeCancelModal() {
    const modal = document.getElementById("cancelModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
    modal.style.display = "";
    bookingToCancel = null;
}

async function confirmCancelBooking() {
    if (!bookingToCancel) {
        return;
    }

    const confirmBtn = document.getElementById("cancelConfirmBtn");

    try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Cancelando...";

        console.log("Cancelando reserva con id:", bookingToCancel.id);

        await callApi(`/bookings/${encodeURIComponent(bookingToCancel.id)}/cancel`, {
            method: "PATCH"
        });

        closeCancelModal();
        await loadBookings();
        alert("La reserva ha sido cancelada correctamente.");
    } catch (error) {
        console.error("Error al cancelar reserva:", error);
        alert(`No se pudo cancelar la reserva.\n${error.message}`);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Si, cancelar reserva";
    }
}

function formatStatus(status) {
    if (status === "CONFIRMED") {
        return "Confirmada";
    }

    if (status === "CANCELLED") {
        return "Cancelada";
    }

    return status || "-";
}

function formatDateTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("es-ES") + " · " + date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatPrice(value, currency) {
    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return `- ${currency || ""}`.trim();
    }

    return `${amount.toFixed(2)} ${currency || ""}`.trim();
}