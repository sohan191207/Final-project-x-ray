import { auth, db } from "../../authentication/config.js";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  query
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

let reportDataMap = {}; // global to access in edit

document.addEventListener("DOMContentLoaded", () => {
  const viewModal = document.getElementById("viewModal");
  const closeModalBtn = document.querySelector(".close-modal");

  const openModal = () => viewModal.style.display = "flex";
  const closeModal = () => viewModal.style.display = "none";

  closeModalBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target.id === "viewModal") closeModal();
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("User not logged in. Redirecting...");
      window.location.href = "../../../Index/login.html";
      return;
    }

    const uid = user.uid;
    try {
      const userSnap = await getDoc(doc(db, "radiologist_database", uid));
      if (!userSnap.exists()) {
        alert("User data not found.");
        return;
      }

      const facilityName = userSnap.data().facilityName.trim().replace(/\s+/g, "");
      const reportsRef = collection(db, facilityName);
      const reportsQuery = query(reportsRef);
      const rowsContainer = document.getElementById("assignmentRowsContainer");

      onSnapshot(reportsQuery, (snapshot) => {
        rowsContainer.innerHTML = "";
        const reports = [];
        reportDataMap = {}; // clear and rebuild

        let totalXrays = 0, completedReports = 0, pendingDiagnoses = 0, monthlyActivity = 0;
        const now = new Date();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const uploadDate = data.image_upload_date?.toDate();
          const docId = docSnap.id;
          totalXrays++;

          if (data.status === "pending" || data.status === "add to queue") pendingDiagnoses++;

          if (uploadDate &&
              uploadDate.getMonth() === now.getMonth() &&
              uploadDate.getFullYear() === now.getFullYear()) {
            monthlyActivity++;
          }

          const isToday = uploadDate &&
            uploadDate.getDate() === now.getDate() &&
            uploadDate.getMonth() === now.getMonth() &&
            uploadDate.getFullYear() === now.getFullYear();

          if (data.status === "add to queue" || isToday) {
            const report = { id: docId, ...data };
            reports.push(report);
            reportDataMap[docId] = report;
          }
        });

        completedReports = totalXrays - pendingDiagnoses;

        document.getElementById("total-xrays").textContent = totalXrays;
        document.getElementById("completed-reports").textContent = completedReports;
        document.getElementById("pending-diagnoses").textContent = pendingDiagnoses;
        document.getElementById("monthly-activity").textContent = monthlyActivity;

        reports.sort((a, b) => {
          const t1 = a.image_upload_date?.toDate()?.getTime() || 0;
          const t2 = b.image_upload_date?.toDate()?.getTime() || 0;
          return t2 - t1;
        });

        reports.forEach((data) => {
          const formattedDate = data.image_upload_date?.toDate().toLocaleString("en-US") || "-";
          rowsContainer.insertAdjacentHTML("beforeend", `
            <div class="assignment-row">
              <div>#${data.report_track_id || data.id}</div>
              <div>${data.patient_name || "-"}</div>
              <div>${data.reference_doctor || "-"}</div>
              <div>${data.status || "-"}</div>
              <div>${formattedDate}</div>
              <div class="text-right">
                <button class="btn-view" data-id="${data.id}">View</button>
                <button class="btn-edit" data-id="${data.id}">Edit</button>
              </div>
            </div>
          `);
        });
      });
    } catch (error) {
      console.error("Error loading reports:", error);
      alert("Something went wrong while loading data.");
    }
  });

  // Global listener for buttons
  document.addEventListener("click", (e) => {
    const target = e.target;

    // View button logic
    if (target.classList.contains("btn-view")) {
      const reportId = target.dataset.id;
      const reportData = reportDataMap[reportId];
      if (!reportData) return;

      document.getElementById("modal_report_id").textContent = reportData.report_track_id || reportData.id;
      document.getElementById("modal_patient_name").textContent = reportData.patient_name || "-";
      document.getElementById("modal_reference_doctor").textContent = reportData.reference_doctor || "-";
      document.getElementById("modal_status").textContent = reportData.status || "-";
      document.getElementById("modal_status_badge").textContent = reportData.status || "-";
      document.getElementById("modal_age_gender").textContent = `${reportData.Patient_sex || "-"}`;
      document.getElementById("modal_xray_type").textContent = reportData.bodyparts_position || "-";
      document.getElementById("modal_uploaded_on").textContent = reportData.image_upload_date?.toDate().toLocaleString("en-US") || "-";

      const imageContainer = document.getElementById("modal_image_container");
      imageContainer.innerHTML = "";
      if (reportData.xray_image_url?.length > 0) {
        reportData.xray_image_url.forEach((imgUrl) => {
          imageContainer.insertAdjacentHTML("beforeend", `
            <div class="image-item">
              <img src="${imgUrl}" alt="X-ray image" onerror="this.src='fallback.jpg'">
              <button class="btn-zoom">🔍</button>
            </div>
          `);
        });
      }

      const badge = document.getElementById("modal_status_badge");
      badge.className = "status-badge " + (reportData.status?.toLowerCase() || "pending");

      openModal();
    }

    if (target.classList.contains("btn-zoom")) {
      const img = target.previousElementSibling;
      if (img && img.tagName === "IMG") {
        window.open(img.src, "_blank");
      }
    }

    // Edit button logic
    if (target.classList.contains("btn-edit")) {
      const reportId = target.dataset.id;
      const report = reportDataMap[reportId];
      if (!report) return;

      document.getElementById("dashboardView").style.display = "none";
      document.getElementById("uploadView").style.display = "block";

      document.getElementById("report_id").value = report.report_track_id || report.id || "";
      document.getElementById("age").value = report.Patient_age || "";
      document.getElementById("xray_type").value = report.bodyparts_position || "";
      document.getElementById("condition").value = report.condition || "";
      document.getElementById("patient_name").value = report.patient_name || "";
      document.getElementById("gender").value = report.Patient_sex?.toLowerCase() || "";
      document.getElementById("ref_doctor").value = report.reference_doctor || "";
      document.getElementById("emergency_checkbox").checked = !!report.emergency;

      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (target.id === "backToDashboard") {
      document.getElementById("uploadView").style.display = "none";
      document.getElementById("dashboardView").style.display = "block";
    }
  });
});





















/// response troggle 

const profilePic = document.querySelector('.profile-pic');
const dropdown = document.querySelector('.profile-dropdown');

profilePic.addEventListener('click', () => {
  dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.profile-wrapper')) {
    dropdown.style.display = 'none';
  }
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Side bar Toggle condition


function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('show');
}

// On resize, remove `.show` on large screens (and reset styles)
window.addEventListener('resize', () => {
  const sidebar = document.querySelector('.sidebar');
  if (window.innerWidth > 768) {
    sidebar.classList.remove('show');
  }
});



