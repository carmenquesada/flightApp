const API_ROOT_CANDIDATES = [
    `${globalThis.location.origin}/api`,
    "http://localhost:8081/api",
    "http://localhost:8080/api"
];

document.addEventListener("DOMContentLoaded", () => {
    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const authMessage = document.getElementById("authMessage");

    loginTab.addEventListener("click", () => activateTab("login"));
    registerTab.addEventListener("click", () => activateTab("register"));

    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        if (!email || !password) {
            showMessage("Introduce email y password.", true);
            return;
        }

        try {
            const user = await callApi("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            persistUser(user);
            globalThis.location.href = "/busquedaVuelos.html";
        } catch (error) {
            showMessage(getErrorMessage(error, "No se pudo iniciar sesion."), true);
        }
    });

    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value.trim();
        const phone = document.getElementById("registerPhone").value.trim();

        if (!name || !email || !password) {
            showMessage("Nombre, email y password son obligatorios.", true);
            return;
        }

        try {
            const user = await callApi("/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, phone })
            });

            persistUser(user);
            globalThis.location.href = "/busquedaVuelos.html";
        } catch (error) {
            showMessage(getErrorMessage(error, "No se pudo registrar el usuario."), true);
        }
    });

    function activateTab(tab) {
        const loginActive = tab === "login";
        loginTab.classList.toggle("active", loginActive);
        registerTab.classList.toggle("active", !loginActive);
        loginForm.classList.toggle("hidden", !loginActive);
        registerForm.classList.toggle("hidden", loginActive);
        authMessage.textContent = "";
    }

    function showMessage(message, isError) {
        authMessage.textContent = message;
        authMessage.classList.toggle("error", isError);
    }
});

function persistUser(user) {
    globalThis.localStorage.setItem("flynowUser", JSON.stringify(user));
}

function getErrorMessage(error, fallback) {
    if (error && typeof error === "object" && "message" in error && error.message) {
        return error.message;
    }

    return fallback;
}

async function callApi(path, options = {}) {
    let lastError;

    for (const apiRoot of API_ROOT_CANDIDATES) {
        const url = `${apiRoot}${path}`;

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
}
