/* =========================================================
   PIXORA — LOGIN AUTHENTICATION
   Supabase Email + Password Login
   ========================================================= */

// Supabase client
const supabaseClient = window.supabase.createClient(
    "https://hlldyvzgvblxmnygldqd.supabase.co",
    "sb_publishable_mg6WiPQq2BTk_2YTdJkaJA_f4zQwPF-"
);

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("message");

    if (!loginForm) {
        console.error("PIXORA: Login form not found.");
        return;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Please enter your email and password.", true);
            return;
        }

        showMessage("Logging in...");

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            console.error("PIXORA Login Error:", error);
            showMessage(error.message, true);
            return;
        }

        console.log("PIXORA Login Successful:", data);

        showMessage("Login successful! Redirecting...");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 800);
    });

    function showMessage(text, isError = false) {
        if (!message) return;

        message.textContent = text;
        message.style.display = "block";

        if (isError) {
            message.style.color = "#ff1744";
        } else {
            message.style.color = "#22c55e";
        }
    }
});
