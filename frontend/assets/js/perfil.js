const API_ROOT_CANDIDATES = [
    `${globalThis.location.origin}/api`,
    "http://localhost:8081/api",
    "http://localhost:8080/api"
];

let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
    currentUser = requireAuthenticatedUser();
    setupLogout();
    await loadProfile(currentUser.id);
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

async function loadProfile(userId) {
    try {
        const profile = await callApi(`/users/${encodeURIComponent(userId)}/profile`);
        renderProfile(profile);
    } catch (error) {
        console.error(error);
    }
}

function renderProfile(profile) {
    document.getElementById("profileName").textContent = profile.name || "-";
    document.getElementById("profileEmail").textContent = profile.email || "-";
    document.getElementById("profilePhone").textContent = profile.phone || "No informado";
    document.getElementById("profileCreatedAt").textContent = formatDateTime(profile.createdAt);
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