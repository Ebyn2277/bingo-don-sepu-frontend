window.APP_CONFIG = {
  API_BASE_URL: "http://192.168.20.27:8000/api",
  // API_BASE_URL: "https://protestant-vinni-bingo-don-sepu-66e57ef7.koyeb.app/api",
};

// ─── Estado global ────────────────────────────────────────────────────────────

let paymentGateway = null;    // datos del gateway: precio, límite, etc.
let allSheets = [];           // todos los cartones cargados desde la API
let cart = [];                // cartones seleccionados por el usuario [{id, tickets, source_url}]
let previewingSheet = null;   // cartón actualmente en el modal de vista previa
let copyToastTimeout = null;

// ─── Inicialización ───────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  loadPage();
});

function initEventListeners() {
  document.getElementById("btn-open-buying-section").addEventListener("click", handleClickOpenBuyingSection);
  document.getElementById("btn-open-search-section").addEventListener("click", handleClickOpenSearchSection);
  document.getElementById("btn-search").addEventListener("click", handleClickSearchSheet);
  document.getElementById("btn-clear-cart").addEventListener("click", handleClickClearCart);
  document.getElementById("btn-confirm-buying").addEventListener("click", handleClickConfirmBuying);
  document.getElementById("btn-close-sheet-preview").addEventListener("click", closeSheetPreviewModal);
  document.getElementById("sheet-preview-overlay").addEventListener("click", closeSheetPreviewModal);
  document.getElementById("btn-add-to-cart").addEventListener("click", handleClickAddToCart);
  document.getElementById("btn-remove-from-cart").addEventListener("click", handleClickRemoveFromCart);
  document.getElementById("btn-close-confirmation-modal").addEventListener("click", closeConfirmationModal);
  document.getElementById("btn-finish-buying").addEventListener("click", handleClickFinishBuying);
  document.getElementById("request-form").addEventListener("submit", (e) => e.preventDefault());

  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", () => handleClickCopy(btn));
  });
}

// ─── Carga inicial ────────────────────────────────────────────────────────────

async function loadPage() {
  const ellipsis = setLoadingAnimation("loading-ellipsis");
  try {
    await Promise.all([loadGatewayStatus(), loadSheets()]);
    toggleHidden("main-content", false);
  } catch (err) {
    console.error(err);
    toggleHidden("error-message", false);
  } finally {
    stopLoadingAnimation("loading-ellipsis", "loading-message", ellipsis);
  }
}

async function loadGatewayStatus() {
  const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/payment-gateway-status`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(JSON.stringify(data));
  }
  const data = await res.json();
  paymentGateway = data.payment_gateway;

  // Mostrar precio y límite en cabecera
  document.getElementById("display-price").textContent = formatCOP(paymentGateway.sheet_price);
  document.getElementById("display-limit").textContent = paymentGateway.sell_limit;
  document.getElementById("cart-limit").textContent = paymentGateway.sell_limit;
  toggleHidden("game-info", false);
}

async function loadSheets() {
  const ellipsis = setLoadingAnimation("sheets-loading-ellipsis");
  try {
    const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/sheets`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Error al cargar cartones.");
    allSheets = await res.json();
    renderSheetsGrid();
    toggleHidden("sheets-grid", false);
  } finally {
    stopLoadingAnimation("sheets-loading-ellipsis", "sheets-loading-message", ellipsis);
  }
}

// ─── Grid de cartones ─────────────────────────────────────────────────────────

function renderSheetsGrid() {
  const grid = document.getElementById("sheets-grid");
  grid.innerHTML = "";

  if (!allSheets.length) {
    grid.innerHTML = "<p class='no-sheets-message'>No hay cartones disponibles en este momento.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();
  allSheets.forEach((sheet) => {
    const card = buildSheetCard(sheet);
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
}

function buildSheetCard(sheet) {
  const isAvailable = sheet.status === "available";
  const isInCart = cart.some((s) => s.id === sheet.id);

  const card = document.createElement("div");
  card.className = `sheet-card ${isAvailable ? "available" : "sold"} ${isInCart ? "in-cart" : ""}`;
  card.dataset.sheetId = sheet.id;

  const ticketNumbers = sheet.tickets?.map((t) => t.id).join(", ") || "—";

  card.innerHTML = `
    <span class="sheet-status-badge">${isInCart ? "En carrito" : isAvailable ? "Disponible" : "Vendido"}</span>
    <p class="sheet-ticket-numbers">${ticketNumbers}</p>
  `;

  if (isAvailable || isInCart) {
    card.addEventListener("click", () => openSheetPreviewModal(sheet));
  }

  return card;
}

function refreshSheetsGrid() {
  // Re-render each card in place to preserve scroll position
  document.querySelectorAll(".sheet-card").forEach((card) => {
    const sheetId = parseInt(card.dataset.sheetId);
    const sheet = allSheets.find((s) => s.id === sheetId);
    if (!sheet) return;

    const isAvailable = sheet.status === "available";
    const isInCart = cart.some((s) => s.id === sheet.id);

    card.className = `sheet-card ${isAvailable ? "available" : "sold"} ${isInCart ? "in-cart" : ""}`;
    card.querySelector(".sheet-status-badge").textContent =
      isInCart ? "En carrito" : isAvailable ? "Disponible" : "Vendido";
  });
}

// ─── Modal vista previa de cartón ─────────────────────────────────────────────

function openSheetPreviewModal(sheet) {
  previewingSheet = sheet;

  const ticketNumbers = sheet.tickets?.map((t) => t.id).join(", ") || "—";
  document.getElementById("sheet-preview-title").textContent = `Cartón — números: ${ticketNumbers}`;
  document.getElementById("sheet-preview-numbers").textContent = ticketNumbers;

  // Carga el PDF en el iframe
  const iframe = document.getElementById("sheet-preview-iframe");
  iframe.src = "";
  toggleHidden("sheet-preview-loading", false);
  iframe.onload = () => toggleHidden("sheet-preview-loading", true);
  iframe.src = sheet.source_url;

  // Botones según estado del carrito
  const inCart = cart.some((s) => s.id === sheet.id);
  toggleHidden("btn-add-to-cart", inCart);
  toggleHidden("btn-remove-from-cart", !inCart);

  toggleHidden("sheet-preview-modal-container", false);
  toggleHidden("overlay", false);
}

function closeSheetPreviewModal() {
  document.getElementById("sheet-preview-iframe").src = "";
  previewingSheet = null;
  toggleHidden("sheet-preview-modal-container", true);
  toggleHidden("overlay", true);
}

function handleClickAddToCart() {
  if (!previewingSheet) return;

  const limit = paymentGateway?.sell_limit ?? 1;
  if (cart.length >= limit) {
    alert(`Solo puedes seleccionar hasta ${limit} cartón(es).`);
    return;
  }

  cart.push(previewingSheet);
  updateCartUI();
  refreshSheetsGrid();

  // Actualizar botones del modal
  toggleHidden("btn-add-to-cart", true);
  toggleHidden("btn-remove-from-cart", false);
}

function handleClickRemoveFromCart() {
  if (!previewingSheet) return;
  cart = cart.filter((s) => s.id !== previewingSheet.id);
  updateCartUI();
  refreshSheetsGrid();

  toggleHidden("btn-add-to-cart", false);
  toggleHidden("btn-remove-from-cart", true);
}

function handleClickClearCart() {
  cart = [];
  updateCartUI();
  refreshSheetsGrid();
}

// ─── Carrito ──────────────────────────────────────────────────────────────────

function updateCartUI() {
  const count = cart.length;
  document.getElementById("cart-count").textContent = count;

  const confirmBtn = document.getElementById("btn-confirm-buying");
  confirmBtn.disabled = count === 0;

  if (count === 0) {
    toggleHidden("cart-summary", true);
    toggleHidden("sub-total", true);
    return;
  }

  toggleHidden("cart-summary", false);

  // Lista de cartones en carrito
  const cartList = document.getElementById("cart-list");
  cartList.innerHTML = "";
  cart.forEach((sheet) => {
    const li = document.createElement("li");
    const numbers = sheet.tickets?.map((t) => t.id).join(", ") || "—";
    li.textContent = numbers;

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn-remove-from-cart-inline";
    removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    removeBtn.addEventListener("click", () => {
      cart = cart.filter((s) => s.id !== sheet.id);
      updateCartUI();
      refreshSheetsGrid();
    });

    li.appendChild(removeBtn);
    cartList.appendChild(li);
  });

  // Precio
  const price = paymentGateway?.sheet_price ?? 0;
  const subtotal = count * price;
  const total = count > 1 ? Math.round(subtotal * (5 / 6)) : subtotal;

  const subTotalEl = document.getElementById("sub-total");
  const totalEl = document.getElementById("total-price");
  totalEl.dataset.price = price;

  if (count > 1) {
    subTotalEl.textContent = formatCOP(subtotal);
    toggleHidden("sub-total", false);
  } else {
    toggleHidden("sub-total", true);
  }
  totalEl.textContent = formatCOP(total);
}

// ─── Confirmación de compra ───────────────────────────────────────────────────

function handleClickConfirmBuying(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!name) { alert("Por favor ingresa tu nombre."); return; }
  if (!/^\d{10}$/.test(phone)) { alert("Por favor ingresa un número de WhatsApp de 10 dígitos."); return; }
  if (cart.length === 0) { alert("No has seleccionado ningún cartón."); return; }

  const price = paymentGateway?.sheet_price ?? 0;
  const count = cart.length;
  const total = count > 1 ? Math.round(count * price * (5 / 6)) : count * price;
  const sheetNumbers = cart.map((s) => s.tickets?.map((t) => t.id).join(", ")).join(" | ");

  document.getElementById("confirmation-name").textContent = name;
  document.getElementById("confirmation-phone").textContent = phone;
  document.getElementById("confirmation-sheets").textContent = sheetNumbers;
  document.getElementById("confirmation-total-price").textContent = formatCOP(total);

  toggleHidden("confirmation-modal-container", false);
  toggleHidden("overlay", false);
}

function closeConfirmationModal() {
  toggleHidden("confirmation-modal-container", true);
  toggleHidden("overlay", true);
}

async function handleClickFinishBuying() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const sheetIds = cart.map((s) => s.id);

  toggleHidden("confirmation-modal-buttons", true);
  toggleHidden("confirmation-modal-loading-message", false);
  const ellipsis = setLoadingAnimation("confirmation-modal-loading-ellipsis");

  try {
    const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        user_name: name,
        user_whatsapp: phone,
        sheet_ids: sheetIds,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // 409: ninguno disponible — informar y refrescar grid
      if (res.status === 409) {
        await refreshSheetsFromServer();
        cart = [];
        updateCartUI();
        refreshSheetsGrid();
        closeConfirmationModal();
        alert(data.error || "Los cartones seleccionados ya no están disponibles. Por favor elige otros.");
        return;
      }
      throw new Error(JSON.stringify(data));
    }

    // Éxito — puede venir con advertencia si algunos cartones no estaban disponibles
    localStorage.setItem("successData", JSON.stringify(data));
    window.location.href = "successful.html";

  } catch (err) {
    console.error(err);
    localStorage.setItem("errorData", err.message);
    window.location.href = "error.html";
  } finally {
    stopLoadingAnimation("confirmation-modal-loading-ellipsis", "confirmation-modal-loading-message", ellipsis);
    toggleHidden("confirmation-modal-buttons", false);
  }
}

// Refresca el estado de los cartones desde el servidor (para detectar cambios concurrentes)
async function refreshSheetsFromServer() {
  try {
    const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/sheets`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      allSheets = await res.json();
    }
  } catch (err) {
    console.warn("No se pudo refrescar cartones:", err);
  }
}

// ─── Sección de búsqueda ──────────────────────────────────────────────────────

async function handleClickSearchSheet() {
  toggleHidden("search-results", true);
  toggleHidden("table-orders-results", true);
  toggleHidden("search-error-message", true);
  toggleHidden("no-results-message", true);

  const searchParam = document.getElementById("search-input").value.trim();
  if (!searchParam) return;

  toggleHidden("search-loading-message", false);
  const ellipsis = setLoadingAnimation("search-loading-ellipsis");

  try {
    const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/orders/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ user_whatsapp: searchParam }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(JSON.stringify(err));
    }

    const data = await res.json();
    toggleHidden("search-results", false);

    if (!data.length) {
      toggleHidden("no-results-message", false);
      return;
    }

    const tbody = document.getElementById("table-orders-body");
    tbody.innerHTML = "";
    const fragment = document.createDocumentFragment();

    data.forEach((order) => {
      const row = document.createElement("tr");

      const dateCell = document.createElement("td");
      dateCell.textContent = new Date(order.created_at).toLocaleDateString();
      row.appendChild(dateCell);

      const sheetsCell = document.createElement("td");
      order.sheets?.forEach((sheet, i) => {
        const link = document.createElement("a");
        link.href = sheet.source_url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = `combo_${i + 1}.pdf`;
        link.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i> <span>Combo ${i + 1}</span>`;
        sheetsCell.appendChild(link);
      });
      row.appendChild(sheetsCell);

      fragment.appendChild(row);
    });

    tbody.appendChild(fragment);
    toggleHidden("table-orders-results", false);

  } catch (err) {
    console.error(err);
    toggleHidden("search-results", false);
    toggleHidden("search-error-message", false);
  } finally {
    stopLoadingAnimation("search-loading-ellipsis", "search-loading-message", ellipsis);
    toggleHidden("search-loading-message", true);
  }
}

// ─── Navegación entre pestañas ────────────────────────────────────────────────

function handleClickOpenBuyingSection() {
  if (!document.getElementById("buying-process-section").classList.contains("hidden")) return;
  toggleHidden("buying-process-section", false);
  toggleHidden("search-sheets-section", true);
  document.getElementById("btn-open-buying-section").classList.add("active");
  document.getElementById("btn-open-search-section").classList.remove("active");
}

function handleClickOpenSearchSection() {
  if (!document.getElementById("search-sheets-section").classList.contains("hidden")) return;
  toggleHidden("search-sheets-section", false);
  toggleHidden("buying-process-section", true);
  document.getElementById("btn-open-search-section").classList.add("active");
  document.getElementById("btn-open-buying-section").classList.remove("active");
}

// ─── Copy to clipboard ────────────────────────────────────────────────────────

function handleClickCopy(btn) {
  const targetId = btn.getAttribute("data-target");
  const text = document.getElementById(targetId)?.textContent || "";
  navigator.clipboard.writeText(text).catch(console.error);

  const toast = document.getElementById("copy-toast-message");
  clearTimeout(copyToastTimeout);
  toast.classList.remove("disappering-animation");
  void toast.offsetWidth;
  toast.classList.add("disappering-animation");
  toggleHidden("copy-toast-message", false);
  copyToastTimeout = setTimeout(() => {
    toggleHidden("copy-toast-message", true);
    toast.classList.remove("disappering-animation");
  }, 2500);
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function toggleHidden(id, shouldBeHidden) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("hidden", shouldBeHidden);
}

function setLoadingAnimation(ellipsisId) {
  let dots = "";
  return setInterval(() => {
    dots = dots.length < 3 ? dots + "." : "";
    const el = document.getElementById(ellipsisId);
    if (el) el.textContent = dots;
  }, 500);
}

function stopLoadingAnimation(ellipsisId, containerId, interval) {
  clearInterval(interval);
  const el = document.getElementById(ellipsisId);
  if (el) el.textContent = "";
  toggleHidden(containerId, true);
}

function formatCOP(amount) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(amount);
}