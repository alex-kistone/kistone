const SUPABASE_URL = "https://gamqplkqofqetktbkhzt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbXFwbGtxb2ZxZXRrdGJraHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzU1OTgsImV4cCI6MjA4ODU1MTU5OH0.mSiwnItChaZZKyvDacpRJ6r4H4beadzn-rSvTDfABWo";

async function login(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

function showStatus(msg, type) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status " + type;
}

async function checkSession() {
  const data = await chrome.storage.local.get(["access_token", "user_email"]);
  if (data.access_token) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("logged-section").style.display = "block";
  }
}

document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.getElementById("login-btn");

  if (!email || !password) {
    showStatus("Veuillez remplir tous les champs", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Connexion...";

  try {
    const result = await login(email, password);

    if (result.error) {
      showStatus(result.error_description || result.error, "error");
      return;
    }

    // Verify admin role
    const roleRes = await fetch(
      `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${result.user.id}&role=eq.admin&select=role`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${result.access_token}`,
        },
      }
    );
    const roles = await roleRes.json();

    if (!roles || roles.length === 0) {
      showStatus("Accès refusé : compte admin requis", "error");
      return;
    }

    await chrome.storage.local.set({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user_email: result.user.email,
    });

    showStatus("Connexion réussie !", "success");
    document.getElementById("login-section").style.display = "none";
    document.getElementById("logged-section").style.display = "block";
  } catch (err) {
    showStatus("Erreur de connexion : " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Se connecter";
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await chrome.storage.local.remove(["access_token", "refresh_token", "user_email"]);
  document.getElementById("login-section").style.display = "block";
  document.getElementById("logged-section").style.display = "none";
  showStatus("Déconnecté", "success");
});

checkSession();
