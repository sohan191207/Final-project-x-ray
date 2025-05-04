import { db, storage, auth } from '../authentication/config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const uid = sessionStorage.getItem("uid");

if (!uid) {
  console.warn("No UID found in sessionStorage.");
} else {
  const docRef = doc(db, "admin_database", uid);

  getDoc(docRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        document.getElementById("full_name").value = userData.fullName || '';
      } else {
        console.warn("No such user document.");
      }
    })
    .catch((error) => console.error("Error fetching document:", error));
}

document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitButton = e.target.querySelector("button[type='submit']");
  submitButton.classList.add("loading");
  submitButton.disabled = true;

  const fullNameField = document.getElementById("full_name");
  const genderField = document.getElementById("gender");
  const phoneField = document.getElementById("phone");
  const imageField = document.getElementById("profile_image");

  const fullName = fullNameField.value.trim();
  const gender = genderField.value.trim();
  const phone = phoneField.value.trim();
  const profileImageFile = imageField.files[0];

  fullNameField.classList.remove("error");
  genderField.classList.remove("error");
  phoneField.classList.remove("error");
  imageField.classList.remove("error");

  const phonePattern = /^(?:\+8801|01)[0-9]{9}$/;
  let hasError = false;

  if (!fullName) {
    fullNameField.classList.add("error");
    hasError = true;
  }
  if (!gender) {
    genderField.classList.add("error");
    hasError = true;
  }
  if (!phone || !phonePattern.test(phone)) {
    phoneField.classList.add("error");
    hasError = true;
    alert("Please enter a valid Bangladeshi phone number.");
  }
  if (!profileImageFile) {
    imageField.classList.add("error");
    hasError = true;
    alert("Please upload a profile photo.");
  }
  else {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(profileImageFile.type)) {
      imageField.classList.add("error");
      hasError = true;
      alert("Profile photo only JPG and PNG images are allowed.");
    }
  }


  if (hasError) {
    submitButton.classList.remove("loading");
    submitButton.disabled = false;
    return;
  }

  const docRef = doc(db, "admin_database", uid);

  try {
    const storageRef = ref(storage, `adminProfileImages/${uid}`);
    await uploadBytes(storageRef, profileImageFile);
    const profileImageURL = await getDownloadURL(storageRef);

    await updateDoc(docRef, {
      fullName,
      gender,
      phone,
      profileImageURL,
      adminApprove: false
    });

    alert("Your registration has been submitted.\n\nYou will be notified via email when an admin approves your request.");

    // Sign out user
    await signOut(auth);

    // Clear session
    sessionStorage.clear();

    // Redirect to login/home
    window.location.href = "../../Index/login.html"; // Change path if needed

  } catch (error) {
    console.error("Error updating admin data:", error);
    alert("Failed to update admin data.");
  }
  finally {
    submitButton.classList.remove("loading");
    submitButton.disabled = false;
  }
});
