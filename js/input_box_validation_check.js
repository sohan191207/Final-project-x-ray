document.addEventListener("DOMContentLoaded", function () {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    const select = document.querySelector('select');
  
    // For input fields
    inputs.forEach(input => {
      input.addEventListener("input", function () {
        if (input.value.trim() !== "") {
          input.classList.add("inputFilled");
        } else {
          input.classList.remove("inputFilled");
        }
      });
    });
  
    // For select dropdown
    if (select) {
      select.addEventListener("change", function () {
        if (select.value !== "") {
          select.classList.add("inputFilled");
        } else {
          select.classList.remove("inputFilled");
        }
      });
    }
  });
  