window.APP_CONFIG = {
  API_BASE_URL: "http://192.168.20.27:8000/api",
};

let formData = null;

document.addEventListener("DOMContentLoaded", async () => {
  await checkPageAvailability();

  updateTotalPrice(1); // Initialize total price with 1 sheet
  handleChangeFile(); // Initialize file input state

  // EVENTS

  document
    .getElementById("btn-increment")
    .addEventListener("click", handleClickIncrement);

  document
    .getElementById("btn-decrement")
    .addEventListener("click", handleClickDecrement);

  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      handleClickCopy(btn);
    });
  });

  document
    .getElementById("payment-proof")
    .addEventListener("change", (event) => handleChangeFile());

  document
    .getElementById("request-form")
    .addEventListener("submit", (event) => {
      handleSubmitRequestForm(event);
    });

  document
    .getElementById("btn-close-confirmation-modal")
    .addEventListener("click", handleClickCloseConfirmationModal);

  document
    .getElementById("btn-finish-buying")
    .addEventListener("click", async () => {
      await handleClickFinishBuying();
    });

  document.getElementById("btn-search").addEventListener("click", async () => {
    await handleClickSearchTicket();
  });

  document
    .getElementById("btn-open-buying-section")
    .addEventListener("click", handleClickOpenBuyingSection);

  document
    .getElementById("btn-open-search-section")
    .addEventListener("click", handleClickOpenSearchSection);
});

function handleClickOpenBuyingSection() {
  if (
    !document
      .getElementById("buying-process-section")
      .classList.contains("hidden")
  )
    return;

  toggleElementVisibility("buying-process-section", false);
  toggleElementVisibility("search-sheets-section", true);

  document.getElementById("btn-open-buying-section").classList.toggle("active");
  document.getElementById("btn-open-search-section").classList.toggle("active");
}

function handleClickOpenSearchSection() {
  if (
    !document
      .getElementById("search-sheets-section")
      .classList.contains("hidden")
  )
    return;

  toggleElementVisibility("buying-process-section", true);
  toggleElementVisibility("search-sheets-section", false);

  document.getElementById("btn-open-buying-section").classList.toggle("active");
  document.getElementById("btn-open-search-section").classList.toggle("active");
}

function setLoadingAnimation(ellipsisContainerId) {
  // Loading animation
  let dots = "";
  let ellipsisInterval = setInterval(() => {
    dots = dots.length < 3 ? dots + "." : "";
    document.getElementById(ellipsisContainerId).textContent = dots;
  }, 500);

  return ellipsisInterval;
}

function stopLoadingAnimation(
  ellipsisContainerId,
  loadingContainerId,
  ellipsisInterval
) {
  clearInterval(ellipsisInterval);
  document.getElementById(ellipsisContainerId).textContent = "";
  toggleElementVisibility(loadingContainerId, true);
}

async function checkPageAvailability() {
  const ellipsisInterval = setLoadingAnimation("loading-ellipsis");
  // const loadingEllipsis = document.getElementById("loading-ellipsis");
  // // Loading animation
  // let dots = "";
  // let ellipsisInterval = setInterval(() => {
  //   dots = dots.length < 3 ? dots + "." : "";
  //   loadingEllipsis.textContent = dots;
  // }, 500);

  try {
    const response = await fetch(
      `${window.APP_CONFIG.API_BASE_URL}/payment-gateway-status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    console.info(data.message);

    // Setting page's values base on payment gateway's data
    let paymentGateway = data.payment_gateway;
    document.getElementById("total-price").dataset.price =
      paymentGateway.sheet_price;
    document.getElementById("input-quantity").max = paymentGateway.sell_limit;

    toggleElementVisibility("main-content", false);
  } catch (error) {
    console.error(error);
    toggleElementVisibility("error-message", false);
  } finally {
    stopLoadingAnimation(
      "loading-ellipsis",
      "loading-message",
      ellipsisInterval
    );
    // clearInterval(ellipsisInterval);
    // loadingEllipsis.textContent = "";
    // toggleElementVisibility("loading-message", true);
  }
}

function handleChangeFile() {
  const file = document.getElementById("payment-proof").files[0];
  const fileNameElement = document.getElementById("payment-proof-preview-text");

  if (file) {
    if (validateFile(file)) {
      fileNameElement.textContent = file.name;
      fileNameElement.classList.remove("hidden");
      toggleElementVisibility("payment-proof-preview-image");
      showImage(file, "payment-proof-preview-image");
    } else {
      fileNameElement.textContent =
        "Archivo no válido. Por favor, sube una imagen.";
      fileNameElement.classList.add("hidden");
      event.target.value = "";
    }
  } else {
    fileNameElement.textContent = "No se ha seleccionado ningún archivo.";
    fileNameElement.classList.add("hidden");
  }
}

function showImage(file, previewElementId) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById(previewElementId).src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateTotalPrice(updatedQuantity) {
  const totalPrice = document.getElementById("total-price");
  const pricePerSheet = parseFloat(totalPrice.dataset.price);

  totalPrice.textContent = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(updatedQuantity * pricePerSheet);
}

function validateFile(file) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return false;
}

function copyToClipboard(targetId) {
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    const textToCopy = targetElement.textContent || targetElement.innerText;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        console.log("Text copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  } else {
    console.error("Target element not found");
  }
}

function handleClickCloseConfirmationModal() {
  toggleElementVisibility("confirmation-modal", true);
  toggleElementVisibility("overlay", true);

  formData = null; // Reset formData

  setTimeout(() => {
    toggleElementVisibility("confirmation-modal-container", true);
  }, 300);
}

async function handleClickFinishBuying() {
  // Loading message
  toggleElementVisibility("confirmation-modal", true);
  toggleElementVisibility("confirmation-modal-loading-message", false);

  const ellipsisInterval = setLoadingAnimation(
    "confirmation-modal-loading-ellipsis"
  );

  try {
    const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        Accept: "application-json",
      },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }
    document.getElementById("request-form").reset(); // Clean contact form
    document.getElementById("input-quantity").value = 1; // Clean input quantity
    const data = await response.json();
    // Redirect user to successful page
    localStorage.setItem("successData", JSON.stringify(data));
    window.location.href = "successful.html";
  } catch (error) {
    document.getElementById("request-form").reset(); // Clean contact form
    document.getElementById("input-quantity").value = 1; // Clean input quantity

    const requestData = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) continue;

      requestData[key] = value;
    }

    // Redirect user to error page
    localStorage.setItem("errorData", error.message);
    localStorage.setItem("requestData", JSON.stringify(requestData));
    window.location.href = "error.html";
  } finally {
    stopLoadingAnimation(
      "confirmation-modal-loading-ellipsis",
      "confirmation-modal-loading-message",
      ellipsisInterval
    );
  }
}

function handleSubmitRequestForm(event) {
  event.preventDefault();

  // Get form values and put them in a form data object
  const file = document.getElementById("payment-proof").files[0];

  if (!validateFile(file)) return;

  formData = new FormData(event.target);

  const sheets_count = document.getElementById("input-quantity").value || "0";
  const user_name = formData.get("name") || "Nombre no proporcionado";
  const user_whatsapp = formData.get("phone") || "Teléfono no proporcionado";

  formData.append("payment_proof", file);
  formData.append("sheet_count", sheets_count);
  formData.append("user_name", user_name);
  formData.append("user_whatsapp", user_whatsapp);

  // Add de values to the confirmation modal
  document.getElementById("confirmation-name").textContent = user_name;
  document.getElementById("confirmation-phone").textContent = user_whatsapp;
  document.getElementById("confirmation-quantity").textContent = sheets_count;
  document.getElementById("confirmation-total-price").textContent =
    document.getElementById("total-price").textContent || "0 COP";
  showImage(file, "proof-image");

  // Set confirmation modal
  window.scrollTo({
    bottom: 0,
    behavior: "smooth",
  });

  toggleElementVisibility("confirmation-modal", false);
  toggleElementVisibility("overlay", false);
  toggleElementVisibility("confirmation-modal-container", false);
}

function handleClickCopy(btnElement) {
  const targetId = btnElement.getAttribute("data-target");
  copyToClipboard(targetId);
}

function handleClickIncrement() {
  const inputQuantity = document.getElementById("input-quantity");
  let currentValue =
    parseInt(inputQuantity.value) || inputQuantity.defaultValue;

  if (currentValue < inputQuantity.max) {
    inputQuantity.value = currentValue + 1;

    updateTotalPrice(currentValue + 1);
  }
}

function handleClickDecrement() {
  const inputQuantity = document.getElementById("input-quantity");
  let currentValue =
    parseInt(inputQuantity.value) || inputQuantity.defaultValue;

  if (currentValue > inputQuantity.min) {
    inputQuantity.value = currentValue - 1;

    updateTotalPrice(currentValue - 1);
  }
}

function toggleElementVisibility(id, shouldBeHidden) {
  const element = document.getElementById(id);
  if (element) {
    element.classList.toggle("hidden", shouldBeHidden);
  }
}

async function handleClickSearchTicket() {
  // Resets elements' visibility
  toggleElementVisibility("search-results", false);
  toggleElementVisibility("table-orders-results", true);
  toggleElementVisibility("search-error-message", true);
  toggleElementVisibility("no-results-message", true);

  const searchParam = document.getElementById("search-input").value;

  if (searchParam === "") {
    return;
  }

  try {
    const response = await fetch(
      `${window.APP_CONFIG.API_BASE_URL}/orders/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          user_whatsapp: searchParam,
        }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    // Adding results html
    const data = await response.json();
    console.info(data);

    if (data.length === 0) {
      toggleElementVisibility("no-results-message", false);
      return;
    }

    const tableOrdersBody = document.getElementById("table-orders-body");
    tableOrdersBody.textContent = ""; // Clear previos orders results

    const ordersFragment = document.createDocumentFragment();

    data.forEach((order) => {
      const row = document.createElement("tr");

      const dateCell = document.createElement("td");
      dateCell.textContent = new Date(order.created_at).toLocaleDateString();
      row.appendChild(dateCell);

      const sheetsCell = document.createElement("td");

      order.sheets.forEach((sheet, index) => {
        const sourceLink = document.createElement("a");
        sourceLink.innerHTML = `<i class="fa-solid fa-file-arrow-down"></i> Combo ${
          index + 1
        }`;
        sourceLink.href = sheet.source_url;
        sourceLink.download = `combo_${index + 1}.pdf`;
        sheetsCell.appendChild(sourceLink);
      });
      row.appendChild(sheetsCell);

      ordersFragment.appendChild(row);
    });

    tableOrdersBody.appendChild(ordersFragment);
    toggleElementVisibility("table-orders-results", false);
  } catch (error) {
    console.log(error);
    toggleElementVisibility("search-error-message", false);
  }
}
