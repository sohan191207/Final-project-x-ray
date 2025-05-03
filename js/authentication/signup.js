import { auth, db } from '../../js/authentication/config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";



const signup = document.getElementById('signup');

signup.addEventListener('click', (event) => {
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
  if (password.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }
  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      const signUpDate = new Date().toISOString();
      const userData = {
        fullName: fullName,
        email: email,
        category: category,
        uid: user.uid,                     
        signUpDate: signUpDate             
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
      setDoc(docRef, userData)
      .then(() => {
        alert("Account Created Successfully");
      
        const redirectBasePath = "../Index/infoCollectForm/";
        let redirectFile = "";
      
        sessionStorage.setItem("uid", user.uid); // Store UID securely
      
        if (category === "Doctor") {
          redirectFile = "doctorInfo.html";
        } else if (category === "Admin") {
          redirectFile = "adminInfo.html";
        } else if (category === "Radiologist") {
          redirectFile = "hospitalInfo.html";
        }
      
        const redirectUrl = `${redirectBasePath}${redirectFile}`;
        window.location.href = redirectUrl;
      })
      

        .catch((error) => {
          console.error("Error writing document:", error);
          alert("Account not Created Successfully");
        });

    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === 'auth/email-already-in-use') {
        alert("Email Address Already Used");
      } else {
        alert("Error: " + error.message);
      }
    });
});


