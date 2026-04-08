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

    container.innerHTML = bookings.map(booking => {
        const isCancelled = booking.status === "CANCELLED";

        return `
            <article class="booking-card">
                <div class="booking-header">
                    <strong>${booking.bookingCode}</strong>
                    <span>${booking.status}</span>
                </div>

                <p>${booking.originIata} → ${booking.destinationIata}</p>
                <p>${booking.totalPrice} ${booking.currency}</p>

                ${
                    isCancelled
                        ? `<button disabled>Reserva cancelada</button>`
                        : `<button class="cancel-booking-btn"
                            data-booking-id="${booking.bookingId}"
                            data-booking-code="${booking.bookingCode}"
                            data-origin="${booking.originIata}"
                            data-destination="${booking.destinationIata}">
                            Cancelar reserva
                           </button>`
                }
            </article>
        `;
    }).join("");

    bindCancelButtons();
}

function bindCancelButtons() {
    const buttons = document.querySelectorAll(".cancel-booking-btn");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
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

        await callApi(`/bookings/${encodeURIComponent(bookingToCancel.id)}/cancel`, {
            method: "PATCH"
        });

        closeCancelModal();
        await loadBookings();
        alert("La reserva ha sido cancelada correctamente.");
    } catch (error) {
        console.error("Error al cancelar reserva:", error);
        alert("No se pudo cancelar la reserva.");
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