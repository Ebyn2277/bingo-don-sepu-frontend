window.onload = async () => {
  await checkPageAvailability();

  let formData = null;
  updateTotalPrice(1); // Initialize total price with 1 sheet
  handleChangeFile(); // Initialize file input state

  // EVENTS

  document.getElementById("btn-increment").addEventListener("click", () => {
    const inputQuantity = document.getElementById("input-quantity");
    let currentValue =
      parseInt(inputQuantity.value) || inputQuantity.defaultValue;

    if (currentValue < inputQuantity.max) {
      inputQuantity.value = currentValue + 1;

      updateTotalPrice(currentValue + 1);
    }
  });

  document.getElementById("btn-decrement").addEventListener("click", () => {
    const inputQuantity = document.getElementById("input-quantity");
    let currentValue =
      parseInt(inputQuantity.value) || inputQuantity.defaultValue;

    if (currentValue > inputQuantity.min) {
      inputQuantity.value = currentValue - 1;

      updateTotalPrice(currentValue - 1);
    }
  });

  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      copyToClipboard(targetId);
    });
  });

  document
    .getElementById("payment-proof")
    .addEventListener("change", (event) => handleChangeFile());

  document
    .getElementById("request-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();

      // Get form values and put them in a form data object
      const file = document.getElementById("payment-proof").files[0];

      if (!validateFile(file)) return;

      formData = new FormData(event.target);

      const sheets_count =
        document.getElementById("input-quantity").value || "0";
      const user_name = formData.get("name") || "Nombre no proporcionado";
      const user_whatsapp =
        formData.get("phone") || "Teléfono no proporcionado";

      formData.append("payment_proof", file);
      formData.append("sheet_count", sheets_count);
      formData.append("user_name", user_name);
      formData.append("user_whatsapp", user_whatsapp);

      // Add de values to the confirmation modal
      document.getElementById("confirmation-name").textContent = user_name;
      document.getElementById("confirmation-phone").textContent = user_whatsapp;
      document.getElementById("confirmation-quantity").textContent =
        sheets_count;
      document.getElementById("confirmation-total-price").textContent =
        document.getElementById("total-price").textContent || "0 COP";
      showImage(file, "proof-image");

      // Set confirmation modal
      window.scrollTo({
        bottom: 0,
        behavior: "smooth",
      });

      document.getElementById("confirmation-modal").classList.remove("hidden");
      document.getElementById("overlay").classList.remove("hidden");
      document
        .getElementById("confirmation-modal-container")
        .classList.remove("hidden");
    });

  document
    .getElementById("btn-close-confirmation-modal")
    .addEventListener("click", () => {
      document.getElementById("confirmation-modal").classList.add("hidden");
      document.getElementById("overlay").classList.add("hidden");
      formData = null; // Reset formData

      setTimeout(() => {
        document
          .getElementById("confirmation-modal-container")
          .classList.add("hidden");
      }, 300);
    });

  document
    .getElementById("btn-finish-buying")
    .addEventListener("click", async () => {
      try {
        const response = await fetch("http://192.168.20.27:8000/api/orders", {
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
      }
    });
};

async function checkPageAvailability() {
  const loadingEllipsis = document.getElementById("loading-ellipsis");
  // Loading animation
  let dots = "";
  let ellipsisInterval = setInterval(() => {
    dots = dots.length < 3 ? dots + "." : "";
    loadingEllipsis.textContent = dots;
  }, 500);

  try {
    const response = await fetch(
      "http://192.168.20.27:8000/api/payment-gateway-status",
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

    document.getElementById("main-content").classList.remove("hidden");
  } catch (error) {
    console.error(error);
    document.getElementById("error-message").classList.remove("hidden");
  } finally {
    clearInterval(ellipsisInterval);
    loadingEllipsis.textContent = "";
    document.getElementById("loading-message").classList.add("hidden");
  }
}

function handleChangeFile() {
  const file = document.getElementById("payment-proof").files[0];
  const fileNameElement = document.getElementById("payment-proof-preview-text");

  if (file) {
    if (validateFile(file)) {
      fileNameElement.textContent = file.name;
      fileNameElement.classList.remove("hidden");
      document
        .getElementById("payment-proof-preview-image")
        .classList.remove("hidden");
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
