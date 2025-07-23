window.onload = () => {
  // Get server information
  let errorMessage = null;
  let errorDataString = localStorage.getItem("errorData"); // Use a distinct variable for the string
  let requestDataString = localStorage.getItem("requestData"); // Use a distinct variable for the string

  let errorData = null;
  let requestData = null;

  try {
    requestData = JSON.parse(requestDataString);
    errorData = JSON.parse(errorDataString);
  } catch (error) {
    // This catch block handles errors during JSON.parse (e.g., malformed JSON)
    console.error("Error parsing localStorage data:", error);

    errorData = errorDataString;
  }

  // Process error message
  try {
    // Determine the type of error and set errorMessage accordingly
    if (errorData !== null) {
      if (
        typeof errorData === "object" &&
        "error" in errorData &&
        typeof errorData.error === "string" && // Ensure errorData.error is a string before includes
        errorData.error.includes("The total sheet_count exceeds the sell limit")
      ) {
        errorMessage = {
          error: "Ya ha alcanzado el límite de compra del próximo juego.",
        };
      } else if (
        errorData.includes("NetworkError when attempting to fetch resource.")
      ) {
        errorMessage = {
          error:
            "Error en la red de internet al intentar conectarse con la base de datos.",
        };
      } else {
        errorMessage = errorData;
      }
    } else {
      errorMessage = {
        error:
          "No se encontró un mensaje de error específico del servidor o el formato es inválido.",
        originalData: errorData, // Include original data for debugging
      };
    }
  } catch (error) {
    console.error("Error during error message processing:", error);
    errorMessage = {
      error: "Error interno al procesar el mensaje de error del servidor.",
      detail: error.message || JSON.stringify(error),
    };
  }

  // Display the determined error message and request data
  document.getElementById("message-error").textContent = JSON.stringify(
    errorMessage,
    null,
    2
  ); // Use 2 for pretty print
  document.getElementById("request-data").textContent = JSON.stringify(
    requestData,
    null,
    2
  ); // Use 2 for pretty print

  function toggleElementVisibility(id, shouldBeHidden) {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle("hidden", shouldBeHidden);
    }
  }
};
