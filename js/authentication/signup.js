import { auth, db } from '../../js/authentication/config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { setDoc, doc  } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


const signup=document.getElementById('signup');

signup.addEventListener('click',(event)=>{
    event.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const category = document.getElementById('category').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userData = {
        fullName: fullName,
        email: email,
        category: category,
        password: password
      };

      alert("Account Created Successfully");

      const docRef = doc(db, "authenticationData", user.uid);
      setDoc(docRef, userData)
        .then(() => {
        window.location.href="login.html";
        })
        .catch((error) => {
          console.error("Error writing document:", error);
          alert("Account not Created Successfully");
        });

    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode == 'auth/email-already-in-use') {
        alert("Email Address Already Used");
      } else {
        alert("Error: " + error.message);
      }
    });


})