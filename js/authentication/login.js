// // ../js/authentication/login.js

// import { auth, db } from './config.js';
// import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// const signinBtn = document.getElementById("signin");

// signinBtn.addEventListener("click", async () => {
//   const email = document.getElementById("email").value.trim();
//   const password = document.getElementById("password").value.trim();
//   const category = document.getElementById("category").value;

//   // Basic validation
//   if (!email || !password || !category) {
//     alert("Please fill in all fields.");
//     return;
//   }

//   try {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;
//     const uid = user.uid;

//     const userDocRef = doc(db, `${category.toLowerCase()}_database`, uid);
//     const docSnap = await getDoc(userDocRef);

//     if (!docSnap.exists()) {
//       alert("No user data found for this account.");
//       return;
//     }

//     const userData = docSnap.data();
//     console.log(userData);
//     if (category === "Admin" && userData.adminApprove === false) {
//       alert("Your admin account has not been approved yet. Please wait for admin approval via email.");
//       return;
//     }

//     sessionStorage.setItem("uid", uid);
//     console.log(uid);
//     if (category === "Admin") {
//       window.location.href = "../../dashboard/admin/dashboard.html";
//     } else {
//       alert("Login successful (category: " + category + ")");



//       //YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY Other category type and pages

      
//     }

//   } catch (error) {
//     console.error("Login error:", error);
//     alert("Login failed. " + error.message);
//   }
// });





// import { auth, db } from './config.js';
// import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// const signinBtn = document.getElementById("signin");

// signinBtn.addEventListener("click", async () => {
//   const email = document.getElementById("email").value.trim();
//   const password = document.getElementById("password").value.trim();
//   const category = document.getElementById("category").value;

//   // Basic validation
//   if (!email || !password || !category) {
//     alert("Please fill in all fields.");
//     return;
//   }

//   try {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;
//     const uid = user.uid;

//     const userDocRef = doc(db, `${category.toLowerCase()}_database`, uid);
//     const docSnap = await getDoc(userDocRef);

//     sessionStorage.setItem("uid", uid); // Always store UID after login

//     if (!docSnap.exists()) {
//       // No user info document yet → send to info collection form
//       redirectToInfoCollection(category);
//       console.log(category);
//       return;
//     }

//     const userData = docSnap.data();

//     // Check if 'adminApprove' property exists
//     if (!("adminApprove" in userData)) {
//       redirectToInfoCollection(category);
//       return;
//     }

//     // If approval pending
//     if (userData.adminApprove === false) {
//       alert("Your account is under review. You'll be notified by email once approved.");
//       return;
//     }

//     // Approved → redirect to dashboard
//     redirectToDashboard(category);

//   } catch (error) {
//     console.error("Login error:", error);
//     alert("Login failed. " + error.message);
//   }
// });

// function redirectToInfoCollection(category) {
//   const target = category.toLowerCase();
//   if (target === "admin") {
//     window.location.href = "../Index/infoCollectForm/adminInfo.html";
//   } else if (target === "doctor") {
//     window.location.href = "../Index/infoCollectForm/doctorInfo.html";
//   } else if (target === "radiologist") {
//     window.location.href = "../Index/infoCollectForm/hospitalInfo.html";
//   } else {
//     alert("Unknown user category. Please contact support.");
//   }
// }

// function redirectToDashboard(category) {
//   const target = category.toLowerCase();
//   if (target === "admin") {
//     window.location.href = "../../dashboard/admin/dashboard.html";
//   } else if (target === "doctor") {
//     window.location.href = "../../dashboard/doctor/dashboard.html";
//   } else if (target === "radiologist") {
//     window.location.href = "../../dashboard/hospital/dashboard.html";
//   } else {
//     alert("Unknown user category. Please contact support.");
//   }
// }


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

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const uid = user.uid;
    sessionStorage.setItem("uid", uid);

    const categories = ["admin", "doctor", "radiologist"];
    let foundCategory = null;
    let userData = null;

    // Match UID in each collection
    for (const category of categories) {
      const ref = doc(db, `${category}_database`, uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        userData = snap.data();
        foundCategory = category;
        break;
      }
    }

    // No matching document found
    if (!foundCategory) {
      alert("Your account has no associated category profile. Please complete registration.");
      window.location.href = "../Index/infoCollectForm/adminInfo.html"; // or a general info page
      return;
    }

    // No info collected yet
    if (!("adminApprove" in userData)) {
      redirectToInfoCollection(foundCategory);
      return;
    }

    // Approval pending
    if (userData.adminApprove === false) {
      alert("Your account is under review. You’ll be notified once approved.");
      return;
    }

    // Approved → redirect to dashboard
    redirectToDashboard(foundCategory);

  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. " + error.message);
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
