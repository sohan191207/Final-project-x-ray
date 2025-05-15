import { auth, db, storage } from "../../authentication/config.js";
import { doc, addDoc, getDoc, query, where, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

let facilityName = null; // global to use in submit handler

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("User not logged in. Redirecting to login...");
        window.location.href = "../../../Index/login.html";
        return;
    }

    const uid = user.uid;

    try {
        const userDocRef = doc(db, "radiologist_database", uid);
        const userDocSnap = await getDoc(userDocRef);
        console.log(userDocSnap);
        if (!userDocSnap.exists()) {
            alert("User data not found.");
            return;
        }

        const userData = userDocSnap.data();
        facilityName = userData.facilityName.trim().replace(/\s+/g, "");

        console.log("Facility Collection:", facilityName);

        // Optional: Ensure the collection exists
        const facilityCollectionRef = collection(db, facilityName);
        const facilityDocsSnap = await getDocs(facilityCollectionRef);

        if (facilityDocsSnap.empty) {
            await addDoc(facilityCollectionRef, {
                name: "Dummy Facility",
                createdAt: serverTimestamp(),
                status: "active"
            });
        }

    } catch (error) {
        console.error("Error:", error);
    }
});


// ✅ Handle form submission
document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = e.submitter || document.querySelector("button[type='submit']");
    submitBtn.classList.add("loading");

    if (!facilityName) {
        alert("Facility not initialized.");
        submitBtn.classList.remove("loading");
        return;
    }

    const reportId = document.getElementById("report_id").value.trim();
    const age = parseInt(document.getElementById("age").value.trim());
    const xrayType = document.getElementById("xray_type").value.trim();
    const patientName = document.getElementById("patient_name").value.trim();
    const gender = document.getElementById("gender").value;
    const referringDoctor = document.getElementById("ref_doctor").value;
    const emergency = document.getElementById("emergency_checkbox").checked;
    const imageFiles = document.getElementById("xray_images").files;

    if (!reportId || !age || !xrayType || !patientName || !gender || !referringDoctor) {
        alert("Please fill out all required fields.");
        submitBtn.classList.remove("loading");
        return;
    }


    // &&&&&&&&&&&&&&&&&&&&&&&&&&&& Check Report Id Dublicate. or not
    const q = query(collection(db, facilityName), where("report_track_id", "==", reportId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        alert("This Report ID already exists. Please use a unique Report ID.");
        submitBtn.classList.remove("loading");
        return;
    }





    if (imageFiles.length === 0 || imageFiles.length > 2) {
        alert("Please upload 1 or 2 X-ray images.");
        submitBtn.classList.remove("loading");
        return;
    }

    try {
        // Upload images and get URLs
        const imageUrls = [];

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const storageRef = ref(storage, `${facilityName}/${reportId}_${i + 1}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            imageUrls.push(url);
        }

        // Store form + image data in Firestore
        const formData = {
            report_track_id: reportId,
            hospital_register_id: auth.currentUser.uid,
            patient_name: patientName,
            Patient_age: age,
            Patient_sex: gender,
            bodyparts_position: xrayType,
            xray_image_url: imageUrls,
            image_upload_date: serverTimestamp(),
            report_delivery_date: "", // default blank
            status: "add to queue",
            Patient_condition: "", // optional, empty by default
            reference_doctor: referringDoctor || "", // optional
            emergency: emergency || false,
            findings: "" // default blank
        };


        const docRef = await addDoc(collection(db, facilityName), formData);
        console.log("Data saved with ID:", docRef.id);
        document.querySelector("form").reset();
        alert("Form and images submitted successfully!");
    } catch (err) {
        console.error("Error uploading or saving data:", err);
        alert("Submission failed. Check console for details.");
    }
    finally {
        submitBtn.classList.remove("loading");
    }
});