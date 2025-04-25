function sendOTP() {
  const emailOrPhone = document.getElementById('emailOrPhone').value;
  if (!emailOrPhone) {
    // You can show a custom error message in the UI instead
    return;
  }
  // Show a message on the page if needed
  window.location.href = 'otp.html';
}

function verifyOTP() {
  const inputs = document.querySelectorAll('.otp-box input');
  let otp = '';
  inputs.forEach(input => otp += input.value);
  if (otp.length === 6 ) {
    
    // OTP verified - redirect to new password page
    window.location.href = 'new-password.html';
  } else {
    // Show custom message instead of alert
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const inputs = document.querySelectorAll(".otp-box input");

  inputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.value === "" && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
});



function resetPassword() {
  const password = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password.length < 8) {
    // Show error message in the UI
    return;
  }

  if (password !== confirmPassword) {
    // Show error message in the UI
    return;
  }

  // Password reset successful - maybe redirect
  // window.location.href = 'login.html';
}
