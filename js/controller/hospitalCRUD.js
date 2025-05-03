import { db, storage } from '../authentication/config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

const uid = sessionStorage.getItem("uid");

if (!uid) {
  console.warn("No UID found in sessionStorage.");
} else {
  const docRef = doc(db, "radiologist_database", uid);
  getDoc(docRef).then((docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("facility_name").value = data.facilityName || '';
      document.getElementById("owner_name").value = data.ownerName || '';
    } else {
      console.log("New facility registration.");
    }
  }).catch((error) => {
    console.error("Error fetching hospital data:", error);
  });
}

document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const facilityName = document.getElementById("facility_name").value;
  const facilityType = document.getElementById("facility_type").value;
  const licenseNo = document.getElementById("license_no").value;
  const establishedYear = document.getElementById("established_year").value;
  const address = document.getElementById("address").value;
  const ownerName = document.getElementById("owner_name").value;
  const ownerDesignation = document.getElementById("owner_designation").value;
  const email = document.getElementById("email").value;
  const mobile = document.getElementById("mobile").value;
  const radiologistCount = document.getElementById("radiologist_count").value;
  const operatingHours = document.getElementById("operating_hours").value;
  const licenseFile = document.getElementById("license_file").files[0];

  if (!facilityName || !facilityType || !licenseNo || !address || !ownerName || !email || !mobile || !licenseFile) {
    alert("Please fill all required fields and upload the license file.");
    return;
  }

  try {
    const docRef = doc(db, "radiologist_database", uid);
    const fileRef = ref(storage, `facilityLicenses/${uid}`);
    await uploadBytes(fileRef, licenseFile);
    const licenseURL = await getDownloadURL(fileRef);

    await setDoc(docRef, {
      facilityName,
      facilityType,
      licenseNo,
      establishedYear,
      address,
      ownerName,
      ownerDesignation,
      email,
      mobile,
      radiologistCount,
      operatingHours,
      licenseFileURL: licenseURL,
      adminApprove: false
    });

    alert("Facility registration submitted. Wait for admin approval.");
    sessionStorage.clear();
    window.location.href = "../../Index/login.html";

  } catch (error) {
    console.error("Error submitting hospital data:", error);
    alert("Failed to submit facility information.");
  }
});
