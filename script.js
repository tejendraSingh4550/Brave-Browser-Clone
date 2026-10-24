
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const clock = document.getElementById("clock");
const dateElement = document.getElementById("date");

const shortcutsContainer = document.getElementById("shortcuts");
const addShortcutBtn = document.getElementById("addShortcutBtn");
const shortcutModal = document.getElementById("shortcutModal");
const shortcutForm = document.getElementById("shortcutForm");
const closeModal = document.getElementById("closeModal");
const siteNameInput = document.getElementById("siteName");
const siteUrlInput = document.getElementById("siteUrl");
const formError = document.getElementById("formError");
const toast = document.getElementById("toast");

let toastTimer;

// 1. Live clock and date
function updateClock() {
  const now = new Date();

  clock.textContent = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  dateElement.textContent = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

updateClock();
setInterval(updateClock, 1000);

// 2. Search using Google or open a URL
searchForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const query = searchInput.value.trim();

  if (!query) {
    searchInput.focus();
    return;
  }

  let destination;

  // If the input looks like a URL, open that website.
  if (/^https?:\/\//i.test(query)) {
    try {
      const url = new URL(query);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Invalid protocol");
      }

      destination = url.href;
    } catch {
      showToast("Please enter a valid website URL.");
      return;
    }
  } else if (
    /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/\S*)?$/i.test(query) &&
    !query.includes(" ")
  ) {
    try {
      const url = new URL("https://" + query);

      if (url.hostname.includes(".")) {
        destination = url.href;
      }
    } catch {
      // Fall back to Google search below.
    }
  }

  if (!destination) {
    destination =
      "https://www.google.com/search?q=" + encodeURIComponent(query);
  }

  window.location.href = destination;
});

// 3. Show notification
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// 4. Theme toggle
const themeBtn = document.getElementById("themeBtn");

function applyTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  themeBtn.textContent = theme === "light" ? "☾" : "☼";
  themeBtn.title = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
}

let savedTheme = "dark";

try {
  savedTheme = localStorage.getItem("brave-clone-theme") || "dark";
} catch {
  // The page still works if storage is unavailable.
}

applyTheme(savedTheme);

themeBtn.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("light")
    ? "dark"
    : "light";

  applyTheme(nextTheme);

  try {
    localStorage.setItem("brave-clone-theme", nextTheme);
  } catch {
    // Theme applies for this session even if it cannot be saved.
  }
});

// 5. Settings button
document.getElementById("settingsBtn").addEventListener("click", () => {
  showToast("Use Add shortcut to customize your home page.");
});

// 6. Load saved shortcuts
const defaultShortcuts = [
  { name: "Google", url: "https://www.google.com", icon: "G", style: "google" },
  { name: "YouTube", url: "https://www.youtube.com", icon: "▶", style: "youtube" },
  { name: "GitHub", url: "https://github.com", icon: "⌘", style: "github" },
  { name: "LinkedIn", url: "https://www.linkedin.com", icon: "in", style: "linkedin" },
  { name: "ChatGPT", url: "https://chatgpt.com", icon: "✳", style: "chatgpt" }
];

function loadShortcuts() {
  try {
    const saved = localStorage.getItem("brave-clone-shortcuts");

    if (saved) {
      const parsed = JSON.parse(saved);

      if (
        Array.isArray(parsed) &&
        parsed.every(item =>
          item &&
          typeof item.name === "string" &&
          typeof item.url === "string"
        )
      ) {
        return parsed;
      }
    }
  } catch {
    // Use defaults if stored data is invalid.
  }

  return defaultShortcuts.map(item => ({ ...item }));
}

let shortcuts = loadShortcuts();

function saveShortcuts() {
  try {
    localStorage.setItem("brave-clone-shortcuts", JSON.stringify(shortcuts));
  } catch {
    showToast("Could not save shortcuts in this browser.");
  }
}

// 7. Render shortcuts
function renderShortcuts() {
  shortcutsContainer.replaceChildren();

  shortcuts.forEach((item, index) => {
    const link = document.createElement("a");
    link.className = "shortcut";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const icon = document.createElement("div");
    icon.className = "shortcut-icon";

    const validStyles = [
      "google", "youtube", "github", "linkedin", "chatgpt", "custom"
    ];

    icon.classList.add(
      validStyles.includes(item.style) ? item.style : "custom"
    );

    icon.textContent = item.icon || item.name.charAt(0).toUpperCase();

    const label = document.createElement("span");
    label.textContent = item.name;

    const removeBtn = document.createElement("button");
    removeBtn.className = "shortcut-remove";
    removeBtn.type = "button";
    removeBtn.textContent = "×";
    removeBtn.title = `Remove ${item.name}`;
    removeBtn.setAttribute("aria-label", `Remove ${item.name}`);

    removeBtn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      shortcuts.splice(index, 1);
      saveShortcuts();
      renderShortcuts();
      showToast("Shortcut removed.");
    });

    link.append(icon, label, removeBtn);
    shortcutsContainer.appendChild(link);
  });
}

renderShortcuts();

// 8. Open and close Add Shortcut modal
function openModal() {
  shortcutModal.hidden = false;
  formError.textContent = "";
  siteNameInput.focus();
}

function hideModal() {
  shortcutModal.hidden = true;
  shortcutForm.reset();
  formError.textContent = "";
}

addShortcutBtn.addEventListener("click", openModal);
closeModal.addEventListener("click", hideModal);

shortcutModal.addEventListener("click", event => {
  if (event.target === shortcutModal) {
    hideModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !shortcutModal.hidden) {
    hideModal();
  }
});

// 9. Add a custom shortcut
shortcutForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = siteNameInput.value.trim();
  let enteredUrl = siteUrlInput.value.trim();

  if (!name || !enteredUrl) {
    formError.textContent = "Please fill in both fields.";
    return;
  }

  if (!/^https?:\/\//i.test(enteredUrl)) {
    enteredUrl = "https://" + enteredUrl;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(enteredUrl);
  } catch {
    formError.textContent = "Please enter a valid website URL.";
    return;
  }

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    !parsedUrl.hostname.includes(".") ||
    !parsedUrl.hostname.includes(".") 
  ) {
    formError.textContent = "Please enter a valid HTTP or HTTPS website.";
    return;
  }

  if (shortcuts.length >= 20) {
    formError.textContent = "You can add up to 20 shortcuts.";
    return;
  }

  shortcuts.push({
    name,
    url: parsedUrl.href,
    icon: name.charAt(0).toUpperCase(),
    style: "custom"
  });

  saveShortcuts();
  renderShortcuts();
  hideModal();
  showToast("Shortcut added successfully!");
});
