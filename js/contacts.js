let searchTimer;

function initContactsPage() {
  readCookie();

  const searchEl = document.getElementById("searchText");
  if (searchEl) {
    searchEl.addEventListener("input", () => debounceSearch(searchEl.value));
  }

  debounceSearch(""); // load all contacts
}

function debounceSearch(q) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => searchContacts(q.trim()), 300);
}

async function searchContacts(query) {
  const msg = document.getElementById("contactSearchResult");
  if (msg) msg.textContent = "";

  try {
    // SearchContact.php expects { search, userId }
    const data = await apiRequest("SearchContact", { search: query, userId });
    const results = data.results || [];
    renderContacts(results);
    if (msg) msg.textContent = `${results.length} contact(s) found`;
  } catch (err) {
    if (msg) msg.textContent = err.message;
    renderContacts([]);
  }
}

// Handles both Add and Edit depending on whether editContactId is set
async function submitContactForm() {
  const editId = document.getElementById("editContactId")?.value;
  if (editId) {
    await saveEditContact();
  } else {
    await addContact();
  }
}

async function addContact() {
  const first = document.getElementById("contactFirstName")?.value.trim() || "";
  const last = document.getElementById("contactLastName")?.value.trim() || "";
  const phone = document.getElementById("contactPhone")?.value.trim() || "";
  const email = document.getElementById("contactEmail")?.value.trim() || "";
  const favorite = document.getElementById("contactFavorite")?.checked || false;

  const msg = document.getElementById("contactAddResult");
  if (msg) msg.textContent = "";

  try {
    // addContact.php expects firstName,lastName,email,phone,userId
    const res = await apiRequest("addContact", {
      firstName: first,
      lastName: last,
      email,
      phone,
      userId,
    });

    if (favorite && res?.contactId) {
      setFavorite(res.contactId, true);
    }

    if (msg) msg.textContent = "Contact added";
    clearContactForm();
    searchContacts(document.getElementById("searchText")?.value.trim() || "");
  } catch (err) {
    if (/already exists/i.test(err?.message || "")) {
      alert(err.message);
    }
    if (msg) msg.textContent = err.message;
  }
}

// Populate the form with contact data for editing (no prompt dialogs)
function editContact(contactId, name, phone, email) {
  const { first, last } = splitName(name);

  document.getElementById("editContactId").value = contactId;
  document.getElementById("contactFirstName").value = first;
  document.getElementById("contactLastName").value = last;
  document.getElementById("contactPhone").value = phone;
  document.getElementById("contactEmail").value = email;

  const favEl = document.getElementById("contactFavorite");
  if (favEl) favEl.checked = isFavorite(contactId);

  document.getElementById("formTitle").textContent = "Edit Contact";
  document.getElementById("submitBtn").textContent = "Update";
  document.getElementById("cancelEditBtn").style.display = "inline-block";

  const msg = document.getElementById("contactAddResult");
  if (msg) msg.textContent = "";

  // Scroll to form
  document.getElementById("contact-form").scrollIntoView({ behavior: "smooth" });
}

async function saveEditContact() {
  const contactId = parseInt(document.getElementById("editContactId")?.value, 10);
  const firstName = document.getElementById("contactFirstName")?.value.trim() || "";
  const lastName = document.getElementById("contactLastName")?.value.trim() || "";
  const phone = document.getElementById("contactPhone")?.value.trim() || "";
  const email = document.getElementById("contactEmail")?.value.trim() || "";
  const favorite = document.getElementById("contactFavorite")?.checked || false;

  const msg = document.getElementById("contactAddResult");
  if (msg) msg.textContent = "";

  try {
    // editContact.php expects contactId,firstName,lastName,email,phone,userId
    await apiRequest("editContact", {
      contactId,
      firstName,
      lastName,
      email: email,
      phone: phone,
      userId,
    });

    setFavorite(contactId, favorite);

    if (msg) msg.textContent = "Contact updated";
    cancelEdit();
    searchContacts(document.getElementById("searchText")?.value.trim() || "");
  } catch (err) {
    if (msg) msg.textContent = err.message;
  }
}

function cancelEdit() {
  document.getElementById("editContactId").value = "";
  document.getElementById("formTitle").textContent = "Add Contact";
  document.getElementById("submitBtn").textContent = "Add";
  document.getElementById("cancelEditBtn").style.display = "none";
  clearContactForm();
}

async function deleteContact(contactId) {
  if (!confirm("Delete this contact?")) return;

  const msg = document.getElementById("contactSearchResult");
  try {
    // deleteContact.php expects { contactId, userId }
    await apiRequest("deleteContact", { contactId, userId });
    setFavorite(contactId, false);
    searchContacts(document.getElementById("searchText")?.value.trim() || "");
  } catch (err) {
    if (msg) msg.textContent = err.message;
  }
}

function renderContacts(results) {
  const body = document.getElementById("contactsBody");
  if (!body) return;

  body.innerHTML = "";

  const sorted = [...results].sort((a, b) => {
    const aId = Number(a.ID);
    const bId = Number(b.ID);
    const aFav = isFavorite(aId);
    const bFav = isFavorite(bId);

    if (aFav !== bFav) return aFav ? -1 : 1;

    const aName = String(a.Name || "").toLowerCase();
    const bName = String(b.Name || "").toLowerCase();
    if (aName < bName) return -1;
    if (aName > bName) return 1;

    return aId - bId;
  });

  for (const c of sorted) {
    // SearchContact.php returns ID/Name/Phone/Email/DateCreated with this casing
    const id = Number(c.ID);
    const name = c.Name || "";
    const phone = c.Phone || "";
    const email = c.Email || "";
    const dateCreated = c.DateCreated ? formatDate(c.DateCreated) : "";
    const fav = isFavorite(id);
    const displayName = (fav ? "★ " : "") + name;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(displayName)}</td>
      <td>${escapeHtml(phone)}</td>
      <td>${escapeHtml(email)}</td>
      <td>${escapeHtml(dateCreated)}</td>
      <td>
        <button type="button" onclick="toggleFavorite(${id})">${fav ? "★" : "☆"}</button>
        <button type="button" onclick="editContact(${id}, '${escapeAttr(name)}', '${escapeAttr(phone)}', '${escapeAttr(email)}')">Edit</button>
        <button type="button" onclick="deleteContact(${id})">Delete</button>
      </td>
    `;
    body.appendChild(tr);
  }
}

function clearContactForm() {
  const firstEl = document.getElementById("contactFirstName");
  const lastEl = document.getElementById("contactLastName");
  const phoneEl = document.getElementById("contactPhone");
  const emailEl = document.getElementById("contactEmail");
  const favEl = document.getElementById("contactFavorite");
  if (firstEl) firstEl.value = "";
  if (lastEl) lastEl.value = "";
  if (phoneEl) phoneEl.value = "";
  if (emailEl) emailEl.value = "";
  if (favEl) favEl.checked = false;
}

function favoritesStorageKey() {
  return `contactual_favorites_${userId}`;
}

function getFavoritesMap() {
  try {
    const raw = localStorage.getItem(favoritesStorageKey());
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveFavoritesMap(map) {
  localStorage.setItem(favoritesStorageKey(), JSON.stringify(map));
}

function isFavorite(contactId) {
  const id = String(Number(contactId));
  if (id === "NaN") return false;
  const map = getFavoritesMap();
  return map[id] === true;
}

function setFavorite(contactId, favorite) {
  const id = String(Number(contactId));
  if (id === "NaN") return;
  const map = getFavoritesMap();

  if (favorite) map[id] = true;
  else delete map[id];

  saveFavoritesMap(map);
}

function toggleFavorite(contactId) {
  const next = !isFavorite(contactId);
  setFavorite(contactId, next);

  const editId = Number(document.getElementById("editContactId")?.value);
  if (!Number.isNaN(editId) && editId === Number(contactId)) {
    const favEl = document.getElementById("contactFavorite");
    if (favEl) favEl.checked = next;
  }

  searchContacts(document.getElementById("searchText")?.value.trim() || "");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}

function splitName(full) {
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(s) {
  return String(s)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"');
}