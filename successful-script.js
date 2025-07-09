window.onload = async () => {
  const successData = JSON.parse(localStorage.getItem("successData"));
  console.log(successData);

  for (const [i, pdf] of successData.sheets.entries()) {
    downloadPDF(pdf.source_url, `combo_${i + 1}.pdf`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
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
