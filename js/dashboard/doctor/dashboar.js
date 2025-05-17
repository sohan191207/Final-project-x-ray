import { auth, db } from "../../authentication/config.js";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
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

  onSnapshot(colRef, (snapshot) => {
    let reports = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      data.id = docSnap.id;
      reports.push(data);
    });
    document.getElementById("TotalPendingCount").textContent = reports.length;
    reports.sort((a, b) => {
      if (a.emergency === b.emergency) {
        return b.image_upload_date.toDate() - a.image_upload_date.toDate();
      }
      return b.emergency ? 1 : -1;
    });

    // Clear previous content
    container.innerHTML = "";

    // Header row
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

    let allowNext = false;
    let hasInProgress = reports.some(r => r.status === "Processing");
    let enabledOne = false;

    for (let i = 0; i < reports.length; i++) {
      const data = reports[i];
      const escapedData = JSON.stringify(data).replace(/'/g, "&apos;");
      
      let isDisabled = true;

      if (data.status === "Processing") {
        allowNext = true;
      } else if (!enabledOne && (!hasInProgress || allowNext)) {
        isDisabled = false;
        enabledOne = true;
        allowNext = false;
      }

      const reportHtml = `
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); padding: 14px 12px; align-items: center; border-bottom: 1px solid #e5e7eb;">
          <div class="ellipsis">${data.patient_name || "-"}</div>
          <div class="ellipsis">${data.bodyparts_position || "-"}</div>
          <div class="ellipsis">${formatDate(data.image_upload_date)}</div>
          <div class="ellipsis">
            <span style="color: #f59e0b; font-weight: 500;">
              ${data.emergency ? ("🚨 " + (data.status === "add to queue" ? "Pending" : data.status)) : "Pending"}
            </span>
          </div>
          <div class="ellipsis" style="text-align: right;">
            <button 
              onclick='${isDisabled ? "" : `handleCreateReport(JSON.parse(this.dataset.report))`}'
              ${isDisabled ? "disabled" : ""}
              data-report='${escapedData}'
              style="
                background-color: ${isDisabled ? '#9ca3af' : '#2563eb'};
                color: #fff;
                border: none;
                padding: 6px 14px;
                border-radius: 6px;
                cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                opacity: ${isDisabled ? '0.6' : '1'};
              ">
              Create Report
            </button>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", reportHtml);
    }

    clearInterval(intervalId);
    loader.remove();
  }, (err) => {
    console.error("onSnapshot error:", err);
    clearInterval(intervalId);
    loader.remove();
    alert("Failed to load reports in real-time.");
  });
});

















// ===========================
// Handle "Create Report" click
// ===========================
window.handleCreateReport = async function (data) {
  try {
    if (!data.id) {
      console.error("Missing document ID.");
      return;
    }

    // Update Firestore
    const docRef = doc(db, "AllPendingReport", data.id);
    await updateDoc(docRef, { status: "Processing" });

    // Update local data + open modal
    data.status = "Processing";
    openReportModal(data);
  } catch (error) {
    console.error("Failed to update status to Processing:", error);
    alert("Failed to update report status.");
  }
};

// ===========================
// Open & Close Modal
// ===========================
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;

function openReportModal(data) {
  console.log(data);
  document.getElementById('patientName').value = data.patient_name || '';
  document.getElementById('patientAge').value = data.Patient_age || '';
  document.getElementById('patientSex').value = data.Patient_sex || 'Male';
  document.getElementById('bodypartPosition').value = data.bodyparts_position || '';
  const xrayImg = document.getElementById('xrayImage');
  xrayImg.src = data.xray_image_url?.[0] || '';
  document.getElementById('reportModal').style.display = 'flex';
  enableImageZoom();
}

function closeReportModal() {
  document.getElementById('reportModal').style.display = 'none';
}

// ===========================
// Zoom functionality
// ===========================
function enableImageZoom() {
  const img = document.getElementById('xrayImage');
  const container = document.getElementById('imageContainer');

  let scale = 1;
  let originX = 0;
  let originY = 0;
  let isDragging = false;
  let startX, startY;

  container.addEventListener('wheel', function (e) {
    e.preventDefault();
    const scaleAmount = 0.1;
    scale += e.deltaY < 0 ? scaleAmount : -scaleAmount;
    scale = Math.min(Math.max(1, scale), 3);
    updateTransform();
  });

  container.addEventListener('mousedown', function (e) {
    if (scale <= 1) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    container.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', function () {
    isDragging = false;
    container.style.cursor = 'grab';
  });

  window.addEventListener('mousemove', function (e) {
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
