import { auth, db } from './config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const signinBtn = document.getElementById("signin");
signinBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  // Show loading state
  signinBtn.classList.add("loading");
  signinBtn.disabled = true;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const uid = user.uid;
    sessionStorage.setItem("uid", uid);

    const categories = ["admin", "doctor", "radiologist"];
    let foundCategory = null;
    let userData = null;

    for (const category of categories) {
      const ref = doc(db, `${category}_database`, uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        userData = snap.data();
        foundCategory = category;
        break;
      }
    }

    if (!foundCategory) {
      alert("Your account has no associated category profile. Please complete registration.");
      window.location.href = "../Index/infoCollectForm/adminInfo.html";
      return;
    }

    if (!("adminApprove" in userData)) {
      redirectToInfoCollection(foundCategory);
      return;
    }

    if (userData.adminApprove === false) {
      alert("Your account is under review. You’ll be notified once approved.");
      return;
    }

    redirectToDashboard(foundCategory);

  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. " + error.message);
  } finally {
    // Always remove loading state
    signinBtn.classList.remove("loading");
    signinBtn.disabled = false;
  }
});

function redirectToInfoCollection(category) {
  if (category === "admin") {
    window.location.href = "../Index/infoCollectForm/adminInfo.html";
  } else if (category === "doctor") {
    window.location.href = "../Index/infoCollectForm/doctorInfo.html";
  } else if (category === "radiologist") {
    window.location.href = "../Index/infoCollectForm/hospitalInfo.html";
  } else {
    alert("Unrecognized category. Contact support.");
  }
}

function redirectToDashboard(category) {
  if (category === "admin") {
    window.location.href = "../../dashboard/admin/dashboard.html";
  } else if (category === "doctor") {
    window.location.href = "../../dashboard/doctor/dashboard.html";
  } else if (category === "radiologist") {
    window.location.href = "../../dashboard/hospital/dashboard.html";
  } else {
    alert("Unrecognized category. Contact support.");
  }
}
