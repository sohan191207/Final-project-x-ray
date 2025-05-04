import { db, storage } from '../authentication/config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

const uid = sessionStorage.getItem("uid");
console.log(uid);

if (!uid) {
  console.warn("No UID found in sessionStorage.");
} else {
  const docRef = doc(db, "doctor_database", uid);

  getDoc(docRef).then((docSnap) => {
    if (docSnap.exists()) {
      const userData = docSnap.data();
      document.getElementById("full_name").value = userData.fullName || '';
    } else {
      console.log("New doctor registration.");
    }
  }).catch((error) => {
    console.error("Error fetching doctor data:", error);
  });
}





document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitButton = e.submitter || document.querySelector("button[type='submit']");
  submitButton.classList.add("loading");

  const fullName = document.getElementById("full_name").value;
  const gender = document.getElementById("gender").value;
  const phone = document.getElementById("phone").value;
  const medicalDegree = document.getElementById("medical_degree").value;
  const graduationYear = document.getElementById("graduation_year").value;
  const specialization = document.getElementById("specialization").value;
  const licenseNo = document.getElementById("medical_license_no").value;
  const experience = document.getElementById("experience_years").value;
  const workplace = document.getElementById("workplace_name").value;
  const designation = document.getElementById("designation").value;
  const profileImage = document.getElementById("profile_image").files[0];
  const certificationFile = document.getElementById("certifications").files[0];

  // ************** form Validation****************/

  const phonePattern = /^(?:\+8801|01)[0-9]{9}$/;
  const allowedImageTypes = ["image/jpeg", "image/png"];
  const allowedCertType = "application/pdf";
  const maxCertSize = 1048576; // 1MB

  if (!fullName || !phone || !profileImage || !certificationFile) {
    alert("Please fill all required fields and upload documents.");
    submitButton.classList.remove("loading");
    return;
  }

  if (!phonePattern.test(phone)) {
    alert("Please enter a valid Bangladeshi phone number.");
    submitButton.classList.remove("loading");
    return;
  }

  if (!allowedImageTypes.includes(profileImage.type)) {
    alert("Profile image must be a JPG or PNG file.");
    submitButton.classList.remove("loading");
    return;
  }

  if (certificationFile.type !== allowedCertType) {
    alert("Certification file must be a PDF.");
    submitButton.classList.remove("loading");
    return;
  }

  if (certificationFile.size > maxCertSize) {
    alert("Certification file must be less than 1MB.");
    submitButton.classList.remove("loading");
    return;
  }

  try {
    const docRef = doc(db, "doctor_database", uid);
    const imageRef = ref(storage, `doctorProfileImages/${uid}`);
    const certRef = ref(storage, `doctorCertifications/${uid}`);

    await uploadBytes(imageRef, profileImage);
    await uploadBytes(certRef, certificationFile);

    const imageURL = await getDownloadURL(imageRef);
    const certURL = await getDownloadURL(certRef);

    await setDoc(docRef, {
      fullName,
      gender,
      phone,
      medicalDegree,
      graduationYear,
      specialization,
      licenseNo,
      experience,
      workplace,
      designation,
      profileImageURL: imageURL,
      certificationURL: certURL,
      adminApprove: false
    });

    alert("Registration submitted. You'll be notified by email upon approval.");
    sessionStorage.clear();
    window.location.href = "../../Index/login.html";

  } catch (error) {
    console.error("Error uploading doctor data:", error);
    alert("Failed to submit doctor info.");
  }
  finally {
    submitButton.classList.remove("loading");
  }
});
