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

  // La respuesta del backend ahora tiene forma { order: {...}, warning?: "..." }
  // Se mantiene compatibilidad si viniera directamente el objeto order.
  const order = successData.order ?? successData;
  const warning = successData.warning ?? null;

  // Mostrar advertencia si algunos cartones no estuvieron disponibles
  if (warning) {
    const warningEl = document.getElementById("warning-message");
    if (warningEl) {
      warningEl.textContent = warning;
      warningEl.classList.remove("hidden");
    }
  }

  // Generar botones de descarga para cada cartón reservado
  const downloadContainer = document.getElementById("download-sheets-container");
  const fragment = document.createDocumentFragment();

  order.sheets?.forEach((sheet, i) => {
    const ticketNumbers = sheet.tickets?.map((t) => t.id).join(", ") || "";

    const wrapper = document.createElement("div");
    wrapper.className = "sheet-download-wrapper";

    if (ticketNumbers) {
      const label = document.createElement("p");
      label.className = "sheet-ticket-label";
      label.textContent = `Números: ${ticketNumbers}`;
      wrapper.appendChild(label);
    }

    const button = document.createElement("button");
    button.className = "btn-download";
    button.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i> Descargar Combo ${i + 1}`;
    button.onclick = () => downloadPDF(sheet.source_url, `combo_${i + 1}.pdf`);
    wrapper.appendChild(button);

    fragment.appendChild(wrapper);
  });

  downloadContainer.appendChild(fragment);
  localStorage.clear();
};

function downloadPDF(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}