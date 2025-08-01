window.onload = async () => {
  const successData = JSON.parse(localStorage.getItem("successData"));

  // Add buttons to download PDFs
  const downloadContainer = document.getElementById(
    "download-sheets-container"
  );
  const buttonsContainerFragment = document.createDocumentFragment();
  for (const [i, pdf] of successData.sheets.entries()) {
    const button = document.createElement("button");
    button.className = "download-button";
    button.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i>Descargar Cartón ${
      i + 1
    }`;
    button.onclick = () => downloadPDF(pdf.source_url, `combo_${i + 1}.pdf`);
    buttonsContainerFragment.appendChild(button);
  }
  downloadContainer.appendChild(buttonsContainerFragment);

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
