import { auth, db } from '../../js/authentication/config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getDoc, doc  } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


onAuthStateChanged(auth, (user) => {
    const loggedInUserId = localStorage.getItem('loggedInuserId');
  
    if (loggedInUserId) {
      const docRef = doc(db, "authenticationData", loggedInUserId);
      getDoc(docRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            document.getElementById('name').innerText =userData.fullName;
            document.getElementById('role').innerText =userData.category;
          } else {
            console.log("No document found for user");
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    } else {
      console.log("No user logged in.");
    }
  });
  
  // Logout function
  const logoutButton = document.getElementById('logout');
  
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('loggedInuserId');
      signOut(auth)
        .then(() => {
          window.location.href = 'login.html';
        })
        .catch((error) => {
          console.error('Error signing out:', error);
        });
    });
  }