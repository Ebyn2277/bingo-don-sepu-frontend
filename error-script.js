window.onload = () => {
  const errorData = JSON.parse(localStorage.getItem("errorData"));
  const requestData = JSON.parse(localStorage.getItem("requestData"));

  console.log(JSON.stringify(requestData));
  let errorMessage = null;
  try {
    if (
      "error" in errorData &&
      errorData.error.includes("The total sheet_count exceeds the sell limit")
    ) {
      errorMessage = {
        error: "Ya ha alcanzado el límite de compra del próximo juego.",
      };
    } else {
      errorMessage = errorData;
    }
  } catch (error) {
    console.error(error);
    errorMessage = errorData;
  }

  document.getElementById("message-error").textContent =
    JSON.stringify(errorMessage);
  document.getElementById("request-data").textContent =
    JSON.stringify(requestData);
};
