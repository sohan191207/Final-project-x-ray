import { auth, db } from "../../authentication/config.js";
import {
  collection,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Replace with your actual known collection names
const facilityCollections = ["GreenHospital", "MomotazHospital", "FacilityC"];

function formatDate(timestamp) {
  const date = timestamp.toDate();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Not logged in.");
    window.location.href = "/login.html";
    return;
  }

  const container = document.querySelector("section");

  // Loading message with animation
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.style.textAlign = "center";
  loader.style.margin = "30px 0";
  loader.style.fontSize = "18px";
  loader.style.color = "#4b5563";
  loader.textContent = "Loading ";

  // Dot animation
  let dotCount = 0;
  const intervalId = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    loader.textContent = "Loading " + ".".repeat(dotCount);
  }, 500);
  container.appendChild(loader);

  let totalReports = 0;


  try {
    const container = document.querySelector("section");

    for (const facility of facilityCollections) {
      const colRef = collection(db, facility);
      const snapshot = await getDocs(colRef);

      snapshot.forEach((doc) => {
        const data = doc.data();

        // ✅ Only render if status is "add to queue"
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
     // Done loading: stop animation
     clearInterval(intervalId);
     loader.remove();
 
     /* Optional: Show a message if no reports
     if (totalReports === 0) {
       const noReports = document.createElement("div");
       noReports.textContent = "No live X-ray reports found.";
       noReports.style.textAlign = "center";
       noReports.style.color = "#9ca3af";
       container.appendChild(noReports);
     }*/


    
  } catch (err) {
    console.error("Error loading queued reports:", err);
    alert("Failed to load reports.");
    clearInterval(loader.dataset.intervalId);
    loader.remove();
  }
});


