const SUPABASE_URL = "https://gamqplkqofqetktbkhzt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbXFwbGtxb2ZxZXRrdGJraHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzU1OTgsImV4cCI6MjA4ODU1MTU5OH0.mSiwnItChaZZKyvDacpRJ6r4H4beadzn-rSvTDfABWo";

function scrapeProfile() {
  const getText = (sel) => {
    const el = document.querySelector(sel);
    return el ? el.textContent.trim() : "";
  };

  const fullName = getText("h1.text-heading-xlarge") || getText("h1");
  const nameParts = fullName.split(" ");
  const first_name = nameParts[0] || "";
  const last_name = nameParts.slice(1).join(" ") || "";

  const job_title = getText(".text-body-medium.break-words") || getText("div.text-body-medium");

  const location = getText(".text-body-small.inline.t-black--light.break-words");

  const photoEl = document.querySelector("img.pv-top-card-profile-picture__image--show, img.profile-photo-edit__preview");
  const photo_url = photoEl ? photoEl.src : null;

  const linkedin_url = window.location.href.split("?")[0];

  // About section
  const aboutSection = document.querySelector("#about ~ div .inline-show-more-text, .pv-about-section .inline-show-more-text, section.pv-about-section div span[aria-hidden='true']");
  const intro_text = aboutSection ? aboutSection.textContent.trim().slice(0, 500) : "";

  // Skills
  const skillEls = document.querySelectorAll("[data-field='skill_card_skill_topic'] span.visually-hidden, .pv-skill-categories-section li span");
  const skills = [...new Set([...skillEls].map((el) => el.textContent.trim()).filter(Boolean))].slice(0, 20);

  // Experience companies
  const expEls = document.querySelectorAll("#experience ~ div .t-14.t-normal span[aria-hidden='true'], .pv-entity__secondary-title");
  const clients = [...new Set([...expEls].map((el) => el.textContent.trim()).filter(Boolean))].slice(0, 10);

  // Languages
  const langEls = document.querySelectorAll("#languages ~ div .t-16.t-bold span[aria-hidden='true']");
  const languages = [...langEls].map((el) => ({ language: el.textContent.trim(), level: "Courant" })).slice(0, 5);

  return {
    first_name,
    last_name,
    job_title,
    linkedin_url,
    photo_url,
    intro_text,
    skills,
    clients,
    mobility: location ? [location] : [],
    languages,
  };
}

function createButton() {
  if (document.getElementById("connect2-import-btn")) return;

  const btn = document.createElement("button");
  btn.id = "connect2-import-btn";
  btn.innerHTML = "🚀 Importer dans Connect2";

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "⏳ Import en cours...";

    try {
      const data = await chrome.storage.local.get(["access_token"]);
      if (!data.access_token) {
        btn.textContent = "❌ Non connecté — ouvrez la popup";
        btn.style.background = "#dc2626";
        setTimeout(() => resetButton(btn), 3000);
        return;
      }

      const profile = scrapeProfile();

      const res = await fetch(`${SUPABASE_URL}/functions/v1/import-linkedin-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.access_token}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(profile),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        btn.textContent = result.action === "updated" ? "✅ Profil mis à jour !" : "✅ Profil importé !";
        btn.style.background = "#059669";
      } else {
        btn.textContent = "❌ " + (result.error || "Erreur");
        btn.style.background = "#dc2626";
      }
    } catch (err) {
      btn.textContent = "❌ " + err.message;
      btn.style.background = "#dc2626";
    }

    setTimeout(() => resetButton(btn), 4000);
  });

  // Insert button near the profile header
  const target = document.querySelector(".pv-top-card-v2-ctas, .pvs-profile-actions, .pv-top-card__actions");
  if (target) {
    target.prepend(btn);
  } else {
    // Fallback: fixed position
    btn.classList.add("connect2-fixed");
    document.body.appendChild(btn);
  }
}

function resetButton(btn) {
  btn.disabled = false;
  btn.innerHTML = "🚀 Importer dans Connect2";
  btn.style.background = "#6366f1";
}

// Wait for LinkedIn to load
setTimeout(createButton, 2000);

// Re-inject on SPA navigation
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (location.href.includes("/in/")) {
      setTimeout(createButton, 2000);
    }
  }
}).observe(document.body, { childList: true, subtree: true });
