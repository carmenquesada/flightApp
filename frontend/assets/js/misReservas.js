const API_ROOT_CANDIDATES = [
    `${globalThis.location.origin}/api`,
    "http://localhost:8081/api",
    "http://localhost:8080/api"
];

let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
    currentUser = requireAuthenticatedUser();
    setupLogout();

    try {
        const bookings = await callApi(`/users/${currentUser.id}/bookings`);
        renderBookings(bookings);
    } catch (error) {
        document.getElementById("bookingsContainer").innerHTML =
            "<p>Error al cargar reservas.</p>";
        console.error(error);
    }
});

function requireAuthenticatedUser() {
    const rawUser = localStorage.getItem("flynowUser");

    if (!rawUser) {
        location.href = "/login.html";
        return;
    }

    return JSON.parse(rawUser);
}

function setupLogout() {
    const logoutLink = document.getElementById("logoutLink");

    logoutLink.addEventListener("click", e => {
        e.preventDefault();
        localStorage.removeItem("flynowUser");
        location.href = "/login.html";
    });
}

async function callApi(path, options = {}) {
    for (const base of API_ROOT_CANDIDATES) {
        try {
            const res = await fetch(base + path, options);
            if (res.ok) return await res.json();
        } catch {}
    }
    throw new Error("API error");
}

function renderBookings(bookings) {
    const container = document.getElementById("bookingsContainer");

    if (!bookings.length) {
        container.innerHTML = "<p>No tienes reservas.</p>";
        return;
    }

    container.innerHTML = bookings.map(b => `
        <div class="booking-item">
            <strong>${b.bookingCode}</strong> - ${b.status}<br>
            ${b.originIata} → ${b.destinationIata}<br>
            ${b.totalPrice} ${b.currency}
        </div>
    `).join("");
}