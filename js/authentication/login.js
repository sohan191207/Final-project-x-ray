import { auth, db } from '../../js/authentication/config.js';
import { signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


const signin =document.getElementById('signin');

signin.addEventListener('click',(event)=>{

    const email =document.getElementById('email').value;
    const password =document.getElementById('password').value;


    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      localStorage.setItem('loggedInuserId', user.uid);
      alert("Successfully logged in");
      window.location.href = "../dashboard/test.html";
    })
    .catch((error) => {
      console.error('Login Error:', error);
      if (error.code === 'auth/invalid-credential') {
        alert("Invalid email or password.");
      } else {
        alert("Login failed. Please try again.");
      }
    });

    


})
