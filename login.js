document.addEventListener("DOMContentLoaded", () => {

    const supabase = window.pixoraSupabase;

    if (!supabase) {
        console.error("PIXORA Supabase client missing.");
        return;
    }

    const loginForm =
        document.getElementById("loginForm");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const message =
        document.getElementById("loginMessage");

    function setMessage(text, error = false) {

        if (!message) return;

        message.textContent = text;
        message.style.color =
            error ? "#ff5575" : "#7ee787";
    }

    function showAdminChoice() {

        const overlay =
            document.createElement("div");

        overlay.id = "pixoraAdminChoice";

        overlay.innerHTML = `
            <div class="pixora-admin-choice-card">

                <div class="pixora-choice-logo">
                    PIX<span>ORA</span>
                </div>

                <h2>Welcome back</h2>

                <p>
                    Where would you like to go?
                </p>

                <button id="personalAccountChoice">
                    👤 Personal Account
                </button>

                <button id="adminDashboardChoice">
                    🛠️ Admin Dashboard
                </button>

            </div>
        `;

        document.body.appendChild(overlay);

        document
            .getElementById("personalAccountChoice")
            .onclick = () => {
                window.location.href =
                    "account.html";
            };

        document
            .getElementById("adminDashboardChoice")
            .onclick = () => {
                window.location.href =
                    "admin.html";
            };
    }

    loginForm?.addEventListener("submit", async event => {

        event.preventDefault();

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email || !password) {
            setMessage(
                "Enter your email and password.",
                true
            );
            return;
        }

        setMessage("Signing in...");

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            console.error(error);

            setMessage(
                error.message ||
                "Login failed.",
                true
            );

            return;
        }

        const user =
            data.user;

        if (!user) {
            setMessage(
                "Login succeeded but no user was returned.",
                true
            );
            return;
        }

        const { data: adminRecord, error: adminError } =
            await supabase
                .from("pixora_admin_users")
                .select("user_id")
                .eq("user_id", user.id)
                .maybeSingle();

        if (adminError) {
            console.warn(
                "PIXORA admin check:",
                adminError
            );
        }

        if (adminRecord) {
            showAdminChoice();
        } else {
            window.location.href =
                "account.html";
        }
    });

});
