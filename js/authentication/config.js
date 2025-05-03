
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js"; 


// const firebaseConfig = {
//   apiKey: "apiKey",
//   authDomain: "xrayo-58.firebaseapp.com",
//   projectId: "xrayo-58",
//   storageBucket: "xrayo-58.firebasestorage.app",
//   messagingSenderId: "000000000",
//   appId: "1:000000000:web:xyz"
// };

/*const firebaseConfig = {
  apiKey: "AIzaSyDe2JIfqDp8WVoX-1SJzsDgJ5C9E4IbtA4",
  authDomain: "xrayo-58.firebaseapp.com",
  projectId: "xrayo-58",
  storageBucket: "xrayo-58.firebasestorage.app",
  messagingSenderId: "445644522138",
  appId: "1:445644522138:web:bbe92c024c6d101cfb5523"
};*/
const firebaseConfig = {
  apiKey: "AIzaSyBWjBz4e0QCaVHicKlQRl63fFewxZt4XaQ",
  authDomain: "mcq-expert-49c71.firebaseapp.com",
  projectId: "mcq-expert-49c71",
  storageBucket: "mcq-expert-49c71.appspot.com",
  messagingSenderId: "352282802106",
  appId: "1:352282802106:web:ca6b32c67e4350043fcf83",
  measurementId: "G-3GWP5HDCKQ"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 

