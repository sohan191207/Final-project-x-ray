import { auth, db, storage } from "../../authentication/config.js";
import { doc, addDoc, getDoc, setDoc, query, where, collection, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

let facilityName = null;

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
            window.location.href = "../../../Index/login.html";
            return;
        }

        const userData = userDocSnap.data();
        facilityName = userData.facilityName.trim().replace(/\s+/g, "");

        console.log("Facility Collection:", facilityName);

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



document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = e.submitter || document.querySelector("button[type='submit']");
    submitBtn.classList.add("loading");

    if (!facilityName) {
        alert("Facility not initialized.");
        submitBtn.classList.remove("loading");
        return;
    }

    const docId = document.getElementById("doc_id").value; // Hidden input for update mode
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

    try {
        // 🔍 Check only if it's a new report
        if (!docId) {
            const q = query(collection(db, facilityName), where("report_track_id", "==", reportId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                alert("This Report ID already exists. Please use a unique Report ID.");
                submitBtn.classList.remove("loading");
                return;
            }

            // For new submission, image is required (1–2 files)
            if (imageFiles.length === 0 || imageFiles.length > 2) {
                alert("Please upload 1 or 2 X-ray images.");
                submitBtn.classList.remove("loading");
                return;
            }
        }

        const imageUrls = [];

        if (imageFiles.length > 0) {
            if (imageFiles.length > 2) {
                alert("You can only upload 1 or 2 images.");
                submitBtn.classList.remove("loading");
                return;
            }

            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const storageRef = ref(storage, `${facilityName}/${reportId}_${i + 1}_${file.name}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                imageUrls.push(url);
            }
        }

        const formData = {
            collectionName: facilityName,
            report_track_id: reportId,
            hospital_register_id: auth.currentUser.uid,
            patient_name: patientName,
            Patient_age: age,
            Patient_sex: gender,
            bodyparts_position: xrayType,
            image_upload_date: serverTimestamp(),
            report_delivery_date: "",
            status: "add to queue",
            Patient_condition: "",
            reference_doctor: referringDoctor || "",
            emergency: emergency || false,
            findings: ""
        };

        if (imageUrls.length > 0) {
            formData.xray_image_url = imageUrls;
        }

        if (docId) {
            // 📝 Edit mode
            const reportRef1 = doc(db, facilityName, docId);
            const reportRef2 = doc(db, "AllPendingReport", docId);
            await setDoc(reportRef1, formData, { merge: true });
            await setDoc(reportRef2, formData, { merge: true });
            alert("Report updated successfully!");
        } else {
            // Generate a new document ID manually
            const newDocRef = doc(collection(db, facilityName));
            const docId = newDocRef.id;

            // Add to both collections using the same ID
            const reportRef1 = doc(db, facilityName, docId);
            const reportRef2 = doc(db, "AllPendingReport", docId);

            await setDoc(reportRef1, { ...formData, xray_image_url: imageUrls, id: docId });
            await setDoc(reportRef2, { ...formData, xray_image_url: imageUrls, id: docId });

            alert("New report submitted successfully!");

        }

        document.querySelector("form").reset();
        document.getElementById("doc_id").value = ""; // Clear hidden field
    } catch (err) {
        console.error("Error submitting form:", err);
        alert("Submission failed. Check console for details.");
    } finally {
        submitBtn.classList.remove("loading");
    }
});





// Toggle View Logic
const dashboardView = document.getElementById('dashboardView');
const uploadView = document.getElementById('uploadView');
const openUploadBtn = document.getElementById('openUploadForm');
const backToDashboard = document.getElementById('backToDashboard');

openUploadBtn.addEventListener('click', () => {
    dashboardView.style.display = 'none';
    uploadView.style.display = 'block';
});

backToDashboard.addEventListener('click', () => {
    uploadView.style.display = 'none';
    dashboardView.style.display = 'block';
});