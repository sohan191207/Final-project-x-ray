import { auth, db } from '../../js/authentication/config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const signupButton = document.getElementById('signup');

signupButton.addEventListener('click', async (event) => {
  event.preventDefault();

  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const category = document.getElementById('category').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!fullName || !email || !password || !confirmPassword || !category) {
    alert('Please fill in all fields.');
    return;
  }
  
  if (!emailPattern.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  

  //------------------------------------------------------- password validation
  if (password.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }
  
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasNumber) {
    alert('Password must include at least one number.');
    return;
  }
  
  if (!hasUppercase) {
    alert('Password must include at least one uppercase letter.');
    return;
  }
  
  if (!hasSpecialChar) {
    alert('Password must include at least one special character.');
    return;
  }





  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  //----- Show loading -------//
  signupButton.classList.add('loading');
  signupButton.disabled = true;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const signUpDate = new Date().toISOString();

    const userData = {
      fullName,
      email,
      category,
      uid: user.uid,
      signUpDate
    };

    let collectionName = "";
    if (category === "Doctor") {
      collectionName = "doctor_database";
    } else if (category === "Admin") {
      collectionName = "admin_database";
    } else if (category === "Radiologist") {
      collectionName = "radiologist_database";
    } else {
      alert("Unknown category. Please contact admin.");
      throw new Error("Unknown user category");
    }
   // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Database Data Save %%%%%%%%%%%
    const docRef = doc(db, collectionName, user.uid);
    await setDoc(docRef, userData);

    alert("Account Created Successfully");

    sessionStorage.setItem("uid", user.uid);

    let redirectFile = "";
    if (category === "Doctor") {
      redirectFile = "doctorInfo.html";
    } else if (category === "Admin") {
      redirectFile = "adminInfo.html";
    } else if (category === "Radiologist") {
      redirectFile = "hospitalInfo.html";
    }

    window.location.href = `../Index/infoCollectForm/${redirectFile}`;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      alert("Email Address Already Used");
    } else {
      alert("Error: " + error.message);
    }
  } finally {
    // ---------Hide loading -----------//
    signupButton.classList.remove('loading');
    signupButton.disabled = false;
  }
});
