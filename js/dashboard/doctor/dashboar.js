import { auth, db } from "../../authentication/config.js";
import {
  collection,
  onSnapshot,
  doc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Utility: format Firebase Timestamp
function formatDate(timestamp) {
  const date = timestamp.toDate();
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

let intervalId;
let currentReportData = null; // ✅ Store currently opened report

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Not logged in.");
    window.location.href = "../../../Index/login.html";
    return;
  }

  const doctorRef = doc(db, "doctor_database", user.uid);
  const doctorSnap = await getDoc(doctorRef);

  if (!doctorSnap.exists()) {
    alert("User not authorized. Returning to login.");
    window.location.href = "../../../Index/login.html";
    return;
  }

  const container = document.querySelector("section");

  // Show loading spinner
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.style.textAlign = "center";
  loader.style.margin = "30px 0";
  loader.style.fontSize = "18px";
  loader.style.color = "#4b5563";
  loader.textContent = "Loading ";
  container.appendChild(loader);

  let dotCount = 0;
  intervalId = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    loader.textContent = "Loading " + ".".repeat(dotCount);
  }, 500);

  // 🔄 Real-time Firestore listener
  const colRef = collection(db, "AllPendingReport");

  onSnapshot(
    colRef,
    (snapshot) => {
      let reports = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        data.id = docSnap.id;
        reports.push(data);
      });

      // 1. Filter reports for the current doctor
      const filteredReports = reports.filter(report =>
        !report.reference_doctor || report.reference_doctor === user.uid
      );

      document.getElementById("TotalPendingCount").textContent = filteredReports.length;

      // 2. Sort reports by emergency status, then by date
      filteredReports.sort((a, b) => {
        if (a.emergency === b.emergency) {
          return a.image_upload_date.toDate() - b.image_upload_date.toDate(); // oldest first
        }
        return b.emergency ? 1 : -1;
      });

      container.innerHTML = "";

      const headerHtml = `
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); background: #f3f4f6; padding: 12px; font-weight: 600; border-radius: 8px; margin-bottom: 12px;">
          <div>Patient Name</div>
          <div>Report Type</div>
          <div>Upload Date</div>
          <div>Status</div>
          <div style="text-align: right;">Actions</div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", headerHtml);

      if (filteredReports.length === 0) {
        const noReportsHtml = `<div style="text-align: center; padding: 20px; color: #6b7280;">No pending reports assigned to you.</div>`;
        container.insertAdjacentHTML("beforeend", noReportsHtml);
      }

      // --- REVISED LOGIC START ---

      // 3. Check if the CURRENT USER is actively processing a report
      const currentUserIsProcessing = filteredReports.some((r) => {
        // A report is being processed by the current user if...
        if (r.status !== "Processing" || !r.ProcessStartDate || r.ProcessDoctorID !== user.uid) {
          return false;
        }
        // ...and the lock time (<10 mins) has not expired
        const diffInMinutes = (Date.now() - r.ProcessStartDate.toDate().getTime()) / (1000 * 60);
        return diffInMinutes < 10;
      });

      let enabledOne = false; // Flag to ensure only the first available report is enabled

      for (let i = 0; i < filteredReports.length; i++) {
        const data = filteredReports[i];
        const escapedData = JSON.stringify(data).replace(/'/g, "&apos;");

        let isDisabled = false; // Default to disabled

        // 4. Determine if THIS button should be enabled
        // A button is enabled if:
        if (
          data.status === 'Pending' &&      // The report is available
          !currentUserIsProcessing &&     // The current doctor is not busy
          !enabledOne                     // And we haven't already enabled another button
        ) {
          isDisabled = false;
          enabledOne = true; // Set the flag so no other buttons are enabled
        }

        // --- REVISED LOGIC END ---

        const reportHtml = `
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); padding: 14px 12px; align-items: center; border-bottom: 1px solid #e5e7eb;">
            <div class="ellipsis">${data.patient_name || "-"}</div>
            <div class="ellipsis">${data.bodyparts_position || "-"}</div>
            <div class="ellipsis">${formatDate(data.image_upload_date)}</div>
            <div class="ellipsis">
              <span style="color: #f59e0b; font-weight: 500;">
                ${data.status === "Processing"
            ? data.emergency
              ? "Processing 🚨"
              : "Processing"
            : data.emergency
              ? "Pending 🚨"
              : "Pending"
          }
              </span>
            </div>
            <div class="ellipsis" style="text-align: right;">
              <button 
                onclick='${isDisabled ? "" : `handleCreateReport(JSON.parse(this.dataset.report))`}'
                ${isDisabled ? "disabled" : ""}
                data-report='${escapedData}'
                style="
                  background-color: ${isDisabled ? "#9ca3af" : "#2563eb"};
                  color: #fff;
                  border: none;
                  padding: 6px 14px;
                  border-radius: 6px;
                  cursor: ${isDisabled ? "not-allowed" : "pointer"};
                  opacity: ${isDisabled ? "0.6" : "1"};
                ">
                Create Report
              </button>
            </div>
          </div>
        `;
        container.insertAdjacentHTML("beforeend", reportHtml);
      }

      clearInterval(intervalId);
      if (document.getElementById("loader")) {
        loader.remove();
      }
    },
    (err) => {
      console.error("onSnapshot error:", err);
      clearInterval(intervalId);
      if (document.getElementById("loader")) {
        loader.remove();
      }
      alert("Failed to load reports in real-time.");
    }
  );


});






// ===========================
// Handle "Create Report" click
// ===========================
window.handleCreateReport = async function (data) {
  try {
    // 1. Get the current logged-in user
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to create a report.");
      return;
    }

    if (!data.id) {
      console.error("Missing document ID.");
      return;
    }

    // The data to update
    const updateData = {
      status: "Processing",
      ProcessStartDate: serverTimestamp(),
      ProcessDoctorID: user.uid, // ✅ Add the doctor's ID
    };

    // 2. Update the original collection document
    const refCollection = data.collectionName;
    const docRef2 = doc(db, refCollection, data.id);
    await updateDoc(docRef2, updateData);

    // 3. Update the "AllPendingReport" document
    const docRef = doc(db, "AllPendingReport", data.id);
    await updateDoc(docRef, updateData);

    data.status = "Processing";
    data.ProcessDoctorID = user.uid; // Also update the local data object
    openReportModal(data);

  } catch (error) {
    console.error("Failed to update status to Processing:", error);
    alert("Failed to update report status.");
  }
};









// ===========================
// Open & Close Modal
// ===========================
function openReportModal(data) {
  currentReportData = data;

  // ✅ Clear fields before populating
  clearModalFields();

  document.getElementById("patientName").value = data.patient_name || "";
  document.getElementById("patientAge").value = data.Patient_age || "";
  document.getElementById("patientSex").value = data.Patient_sex || "Male";
  document.getElementById("bodypartPosition").value = data.bodyparts_position || "";
  document.getElementById("reportTextarea").value = data.findings || "";

  const xrayImg = document.getElementById("xrayImage");
  xrayImg.src = data.xray_image_url?.[0] || "";

  document.getElementById("reportModal").style.display = "flex";
  enableImageZoom();
}






async function closeReportModal(data) {
  try {
    if (!data?.id || !data?.collectionName) {
      console.error("Missing document ID or collection name.");
      alert("Missing required data. Cannot submit the report.");
      return;
    }

    const findingValue = document.getElementById("reportTextarea")?.value.trim() ?? "";

    // ✅ Handle null or empty findings value
    if (!findingValue) {
      alert("Please enter findings before submitting the report.");
      return;
    }

    const docRef1 = doc(db, data.collectionName, data.id);
    const docRef2 = doc(db, "AllPendingReport", data.id);

    await updateDoc(docRef1, {
      findings: findingValue,
      status: "Success",
      report_delivery_date: serverTimestamp(),
    });

    const pendingSnap = await getDoc(docRef2);

    if (pendingSnap.exists()) {
      const pendingData = pendingSnap.data();
      const trackId = pendingData.report_track_id;

      if (!trackId) {
        console.error("❌ Missing 'report_track_id' in pending data.");
        alert("Failed to save completed report. Missing tracking ID.");
        return;
      }

      const docRef3 = doc(db, "AllCompleteData", trackId);

      await setDoc(docRef3, {
        ...pendingData,
        findings: findingValue,
        status: "Success",
        report_delivery_date: serverTimestamp(),
        completed_at: serverTimestamp(),
      });
    }

    await deleteDoc(docRef2);

    document.getElementById("reportModal").style.display = "none";
    clearModalFields();

    alert("Report successfully submitted!");
  } catch (error) {
    console.error("❌ Failed to update report:", error);
    alert("Failed to update report. Please try again.");
  }
}




// ✅ Clears all modal inputs
function clearModalFields() {
  document.getElementById("patientName").value = "";
  document.getElementById("patientAge").value = "";
  document.getElementById("patientSex").value = "Male";
  document.getElementById("bodypartPosition").value = "";
  document.getElementById("reportTextarea").value = "";
  document.getElementById("xrayImage").src = "";
}

// 🔗 Modal submit button
document.getElementById("submitReportBtn").addEventListener("click", () => {
  if (!currentReportData) {
    alert("Something went wrong. Please reload.");
    return;
  }
  closeReportModal(currentReportData);
});

// ===========================
// Zoom functionality
// ===========================
function enableImageZoom() {
  const img = document.getElementById("xrayImage");
  const container = document.getElementById("imageContainer");

  let scale = 1;
  let originX = 0;
  let originY = 0;
  let isDragging = false;
  let startX, startY;

  container.addEventListener("wheel", function (e) {
    e.preventDefault();
    const scaleAmount = 0.1;
    scale += e.deltaY < 0 ? scaleAmount : -scaleAmount;
    scale = Math.min(Math.max(1, scale), 3);
    updateTransform();
  });

  container.addEventListener("mousedown", function (e) {
    if (scale <= 1) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    container.style.cursor = "grabbing";
  });

  window.addEventListener("mouseup", function () {
    isDragging = false;
    container.style.cursor = "grab";
  });

  window.addEventListener("mousemove", function (e) {
    if (!isDragging) return;
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    originX += dx;
    originY += dy;
    startX = e.clientX;
    startY = e.clientY;
    updateTransform();
  });

  function updateTransform() {
    img.style.transform = `translate(-50%, -50%) scale(${scale}) translate(${originX}px, ${originY}px)`;
  }
}
