const API_BASE_URL = window.location.origin.includes(":8000") 
    ? window.location.origin 
    : "http://127.0.0.1:8000";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");

// Redirect if already logged in
if (sessionStorage.getItem("access_token")) {
    window.location.href = "dashboard.html";
}

// Show / Hide Password
if (togglePassword) {
    togglePassword.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        togglePassword.textContent = isPassword ? "Hide" : "Show";
    });
}

// Display Message
function showMessage(message, type = "error") {
    loginMessage.textContent = message;
    loginMessage.className = `login-message ${type}`;
}

// Handle Login
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        showMessage("Please enter your username/email and password.");
        return;
    }

    loginButton.disabled = true;
    loginButtonText.textContent = "Logging in...";
    loginMessage.className = "login-message";

    try {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Authentication failed. Please check your credentials.");
        }

        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem("admin_user", JSON.stringify(data.user));

        showMessage("Login successful! Redirecting...", "success");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 500);

    } catch (error) {
        console.error("Login error:", error);
        showMessage(error.message || "Unable to connect to the backend server. Make sure FastAPI is running on port 8000.");
    } finally {
        loginButton.disabled = false;
        loginButtonText.textContent = "Login to Dashboard";
    }
});