import { db } from '../../authentication/config.js';
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

function loadWaitingLists() {
  const types = [
    { collectionName: 'admin_database', containerId: 'admin-waiting-list', type: 'Admin' },
    { collectionName: 'doctor_database', containerId: 'doctor-waiting-list', type: 'Doctor' },
    { collectionName: 'radiologist_database', containerId: 'hospital-waiting-list', type: 'Hospital' },
  ];

  types.forEach(({ collectionName, containerId, type }) => {
    const container = document.getElementById(containerId);

    // Use onSnapshot to listen for real-time updates
    onSnapshot(collection(db, collectionName), (snapshot) => {
      container.innerHTML = ''; // clear old content on each update
      snapshot.docChanges().forEach((change) => {
        const docSnap = change.doc;
        const data = docSnap.data();
        const docId = docSnap.id;
        const itemElementId = `${type}-${docId}`;
        const existingItem = document.getElementById(itemElementId);

        if (data.adminApprove === false) {
          const name = data.fullName || data.facilityName || data.name || "Unknown";
          const role = data.role || data.education || data.category || data.facilityType || data.medicalDegree || "Pending";
          const date = data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "Recently";

          let imageURL = "../../image/user.png"; // default

          if ((type === "Doctor" || type === "Admin") && data.profileImageURL) {
            imageURL = data.profileImageURL;
          } else if (type === "Hospital") {
            imageURL = "../../../image/user.png"; // fixed hospital image
          }

          const html = `
            <div class="approval-item" id="${type}-${docId}">
              <div class="doctor-info">
                <span class="request-date">Requested: ${date}</span>
                <div class="doctor-details">
                  <img src="${imageURL}" alt="${type}" class="doctor-icon" />
                  <div class="doctor-meta">
                    <strong>${name}</strong><br />
                    <small>${role}</small>
                  </div>
                </div>
              </div>
              <div class="approval-actions">
                <button class="approve" onclick="handleApprove('${collectionName}', '${docId}', '${type}')">Approve</button>
                <button class="reject" onclick="handleReject('${collectionName}', '${docId}', '${type}')">Reject</button>
                <button class="view" onclick='open${type}Modal(${JSON.stringify(data)})'>View Details</button>
              </div>
            </div>
          `;

          if (change.type === "added") {
            container.innerHTML += html;
          } else if (change.type === "modified" && existingItem) {
            existingItem.outerHTML = html; // Replace the existing item
          } else if (change.type === "removed" && existingItem) {
            existingItem.remove();
          }
        } else if (data.adminApprove === true && existingItem) {
          existingItem.remove(); // Remove if approved
        }
      });
    });
  });
}

window.handleApprove = async function (collectionName, docId, type) {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { adminApprove: true });
};

window.handleReject = async function (collectionName, docId, type) {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};

loadWaitingLists();


// ------------------------------------------- Viwe Details Implement ____________

// === Modal open functions ===

window.openDoctorModal = function (data) {
  document.querySelector("#detailsModal .modal-content h2").textContent = "Doctor Profile";
  document.querySelector("#detailsModal .profile-photo img").src = data.profileImageURL || "../../image/user.png";
  document.querySelector("#detailsModal iframe").src = data.certificationURL || "../../image/demo.pdf";

  const fields = [
    ["Full Name*", data.fullName],
    ["Gender", data.gender],
    ["Contact Number", data.phone],
    ["Medical Degree", data.medicalDegree],
    ["Graduation Year", data.graduationYear],
    ["Specialization", data.specialization],
    ["License Number", data.licenseNo],
    ["Experience", data.experience],
    ["Workplace", data.workplace],
    ["Designation", data.designation]
  ];

  fillModalFields("#detailsModal", fields);
  document.getElementById("detailsModal").style.display = "block";
};

window.openHospitalModal = function (data) {
  document.querySelector("#hospitalDetailsModal .modal-content h2").textContent = "Hospital / Facility Profile";
  document.querySelector("#hospitalDetailsModal .profile-photo img").src = "../../image/user.png";
  document.querySelector("#hospitalDetailsModal iframe").src = data.licenseFileURL || "../../image/demo.pdf";

  const fields = [
    ["Facility Name *", data.facilityName],
    ["Facility Type *", data.facilityType],
    ["License Number *", data.licenseNo],
    ["Established Year", data.establishedYear],
    ["Facility Address *", data.address],
    ["Owner's Full Name *", data.ownerName],
    ["Owner Designation", data.ownerDesignation],
    ["Email Address *", data.email],
    ["Mobile Number *", data.mobile],
    ["Radiologist Count", data.radiologistCount],
    ["Operating Hours", data.operatingHours]
  ];

  fillModalFields("#hospitalDetailsModal", fields);
  document.getElementById("hospitalDetailsModal").style.display = "block";
};

window.openAdminModal = function (data) {
  document.querySelector("#openAdminModal .profile-photo img").src = data.profileImageURL || "../../image/user.png";

  const fields = [
    ["Full Name*", data.fullName],
    ["Gender", data.gender],
    ["Contact Number", data.phone]
  ];

  fillModalFields("#openAdminModal", fields);
  document.getElementById("openAdminModal").style.display = "block";
};


// === Helper to fill modal fields ===

function fillModalFields(modalSelector, fieldList) {
  const fieldSpans = document.querySelectorAll(`${modalSelector} .info-group span`);
  fieldSpans.forEach((span, index) => {
    if (fieldList[index]) {
      span.textContent = fieldList[index][1] || "N/A";
    }
  });
}


window.closeModal = () => document.getElementById("detailsModal").style.display = "none";
window.closeHospitalModal = () => document.getElementById("hospitalDetailsModal").style.display = "none";
window.closeUserModal = () => document.getElementById("openAdminModal").style.display = "none";