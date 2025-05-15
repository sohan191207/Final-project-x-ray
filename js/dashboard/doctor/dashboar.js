import { auth, db } from "../../authentication/config.js";
import {
  collection,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Replace with your actual known collection names
// Fetch dynamic facilities
async function getFacilityCollections() {
  const facilityRef = collection(db, "radiologist_database");
  const snapshot = await getDocs(facilityRef);
  const facilities = new Set();

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.facilityName) {
      const cleanName = data.facilityName.replace(/\s+/g, '');
      facilities.add(cleanName);
    }
  });

  return Array.from(facilities);
}


function formatDate(timestamp) {
  const date = timestamp.toDate();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

let intervalId;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Not logged in.");
    window.location.href = "/login.html";
    return;
  }

  const container = document.querySelector("section");

  const loader = document.createElement("div");
  loader.id = "loader";
  loader.style.textAlign = "center";
  loader.style.margin = "30px 0";
  loader.style.fontSize = "18px";
  loader.style.color = "#4b5563";
  loader.textContent = "Loading ";

  let dotCount = 0;

  intervalId = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    loader.textContent = "Loading " + ".".repeat(dotCount);
  }, 500);

  container.appendChild(loader);
  let totalReports = 0;

  try {
    const facilityCollections = await getFacilityCollections(); // <-- dynamic now

    for (const facility of facilityCollections) {
      const colRef = collection(db, facility);
      const snapshot = await getDocs(colRef);

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.status === "add to queue") {
          const escapedData = JSON.stringify(data).replace(/'/g, "&apos;");
          const reportHtml = `
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); padding: 14px 12px; align-items: center; border-bottom: 1px solid #e5e7eb;">
              <div>${data.patient_name || "-"}</div>
              <div>${data.bodyparts_position || "-"}</div>
              <div>${data.image_upload_date ? formatDate(data.image_upload_date) : "-"}</div>
              <div><span style="color: #f59e0b; font-weight: 500;">Pending</span></div>
              <div style="text-align: right;">
                <button 
                  onclick='openReportModal(JSON.parse(this.dataset.report))'
                  data-report='${escapedData}'
                  style="background-color: #2563eb; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer;">
                  Create Report
                </button>
              </div>
            </div>
          `;
          container.insertAdjacentHTML("beforeend", reportHtml);
        }
      });
    }

    clearInterval(intervalId);
    loader.remove();

  } catch (err) {
    console.error("Error loading queued reports:", err);
    alert("Failed to load reports.");
    clearInterval(intervalId);
    loader.remove();
  }
});













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
  console.log(data.xray_image_url);


  document.getElementById('reportModal').style.display = 'flex';


  enableImageZoom();
}

function closeReportModal() {
  document.getElementById('reportModal').style.display = 'none';
}
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