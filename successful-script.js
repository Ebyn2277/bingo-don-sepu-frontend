window.onload = () => {
  document.getElementById("btn-back-to-home").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  const raw = localStorage.getItem("successData");
  if (!raw) {
    window.location.href = "index.html";
    return;
  }

  const successData = JSON.parse(raw);

  // La respuesta del backend ahora tiene forma { order: {...}, warning?: "...", requested_sheet_count?: number, sheetComboNumberMap?: [[id, num], ...] }
  // Se mantiene compatibilidad si viniera directamente el objeto order.
  const order = successData.order ?? successData;
  const warning = successData.warning ?? null;
  const requestedCount = successData.requested_sheet_count ?? order.sheet_count;
  const purchasedCount = order.sheets?.length ?? 0;
  
  // Reconstruir el mapa de IDs a números de combos desde el array de pares
  const sheetComboNumberMap = successData.sheetComboNumberMap 
    ? new Map(successData.sheetComboNumberMap)
    : new Map();

  const orderSummary = document.getElementById("order-summary");
  if (orderSummary) {
    if (purchasedCount === requestedCount) {
      orderSummary.textContent = `Se reservaron correctamente los ${purchasedCount} cartón(es) que seleccionaste.`;
    } else {
      orderSummary.textContent = `Se reservaron ${purchasedCount} de ${requestedCount} cartón(es).`; 
    }
  }

  // Mostrar advertencia si algunos cartones no estuvieron disponibles
  if (warning) {
    const warningEl = document.getElementById("warning-message");
    if (warningEl) {
      warningEl.textContent = warning;
      warningEl.classList.remove("hidden");
    }

    if (Array.isArray(successData.unavailable_ids) && successData.unavailable_ids.length) {
      const unavailableContainer = document.getElementById("unavailable-sheets-container");
      const unavailableList = document.getElementById("unavailable-sheets-list");
      if (unavailableContainer && unavailableList) {
        unavailableList.innerHTML = "";
        successData.unavailable_ids.forEach((sheetId) => {
          const comboNumber = sheetComboNumberMap.get(sheetId) ?? sheetId;
          const li = document.createElement("li");
          li.textContent = `Combo #${comboNumber}`;
          unavailableList.appendChild(li);
        });
        unavailableContainer.classList.remove("hidden");
      }
    }
  }

  // Generar botones de descarga para cada cartón reservado
  const downloadContainer = document.getElementById("download-sheets-container");
  const fragment = document.createDocumentFragment();

  order.sheets?.forEach((sheet) => {
    const ticketNumbers = sheet.tickets?.map((t) => t.id).join(", ") || "";
    const comboNumber = sheetComboNumberMap.get(sheet.id) ?? sheet.id;

    const wrapper = document.createElement("div");
    wrapper.className = "sheet-download-wrapper";

    const comboLabel = document.createElement("h3");
    comboLabel.className = "combo-download-label";
    comboLabel.innerHTML = `<strong>Combo #${comboNumber}</strong>`;
    wrapper.appendChild(comboLabel);

    if (ticketNumbers) {
      const label = document.createElement("p");
      label.className = "sheet-ticket-label";
      label.textContent = `Números: ${ticketNumbers}`;
      wrapper.appendChild(label);
    }

    const button = document.createElement("button");
    button.className = "btn-download";
    button.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i> Descargar`;
    button.onclick = () => downloadPDF(sheet.source_url, `combo_${comboNumber}.pdf`);
    wrapper.appendChild(button);

    fragment.appendChild(wrapper);
  });

  downloadContainer.appendChild(fragment);
  localStorage.removeItem("successData");
};

function downloadPDF(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}