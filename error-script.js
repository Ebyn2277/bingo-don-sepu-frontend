window.onload = () => {
  const errorRaw = localStorage.getItem("errorData");

  let errorDisplay = "Error desconocido.";

  if (errorRaw) {
    try {
      const parsed = JSON.parse(errorRaw);

      if (parsed?.error) {
        errorDisplay = parsed.error;
      } else if (parsed?.message) {
        errorDisplay = parsed.message;
      } else if (typeof parsed === "string") {
        errorDisplay = parsed;
      } else {
        errorDisplay = JSON.stringify(parsed, null, 2);
      }

      // Mensajes amigables para errores conocidos
      if (errorDisplay.includes("sell limit")) {
        errorDisplay = "Ya alcanzaste el límite de compra para este juego.";
      } else if (errorDisplay.includes("NetworkError") || errorDisplay.includes("Failed to fetch")) {
        errorDisplay = "Error de red al conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.";
      } else if (errorDisplay.includes("No available sheets") || errorDisplay.includes("no están disponibles")) {
        errorDisplay = "Los cartones seleccionados ya no están disponibles. Vuelve e intenta con otros.";
      }

    } catch {
      errorDisplay = errorRaw;
    }
  }

  document.getElementById("message-error").textContent = errorDisplay;
  localStorage.removeItem("errorData");
};