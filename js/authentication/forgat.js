import { auth } from "../authentication/config.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const resetBtn = document.querySelector('.btnPrimary');
  
  resetBtn.addEventListener('click', () => {

    const email = document.getElementById('email').value.trim();

    if (!email) {
      alert('Please enter a valid email address.');
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert('Password reset email sent. Please check your inbox.');
        window.location.href = "../Index/login.html";
      })
      .catch((error) => {
        console.error(error);
        alert(`Error: ${error.message}`);
      });
  });
});
