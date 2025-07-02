window.onload = () => {
  const successData = JSON.parse(localStorage.getItem("successData"));
  successData.tickets.forEach((pdf) => {
    downloadPDF(pdf.source_url);
  });

  localStorage.clear();
};

function downloadPDF(url) {
  const a = document.createElement("a");
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
