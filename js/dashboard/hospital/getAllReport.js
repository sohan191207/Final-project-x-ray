import { auth, db } from "../../authentication/config.js";
import {
    doc,
    getDoc,
    collection,
    onSnapshot,
    query
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- Main execution starts after the DOM is fully loaded ---
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Get references to all necessary elements ---
    const tableBody = document.getElementById("report-table-body");
    const modal = document.getElementById('print-modal');
    const modalBody = document.getElementById('modal-body');
    const closeModalButton = document.getElementById('modal-close-button');
    const cancelModalButton = document.getElementById('modal-cancel-button');
    const confirmPrintButton = document.getElementById('modal-confirm-print-button');

    // --- Function to toggle the mobile sidebar ---
    window.toggleSidebar = function () {
        document.querySelector('.sidebar').classList.toggle('show');
    }

    // --- Functions to control the modal's visibility ---
    function openModal() {
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // --- Function to trigger the browser's print dialog ---
    function triggerPrint() {
        window.print();
    }

    // --- Add event listeners for all modal buttons ---
    closeModalButton.addEventListener('click', closeModal);
    cancelModalButton.addEventListener('click', closeModal);
    confirmPrintButton.addEventListener('click', triggerPrint);

    // --- Main authentication and data fetching logic ---
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.error("User not logged in.");
            tableBody.innerHTML = "<p style='padding: 16px;'>Access Denied. Please log in.</p>";
            return;
        }

        try {
            const userDocRef = doc(db, "radiologist_database", user.uid);
            const userSnap = await getDoc(userDocRef);
            
            if (!userSnap.exists()) {
                tableBody.innerHTML = "<p style='padding: 16px;'>Error: User profile not found.</p>";
                return;
            }

            const facilityName = userSnap.data().facilityName?.trim().replace(/\s+/g, "");
            if (!facilityName) {
                tableBody.innerHTML = "<p style='padding: 16px;'>Error: Facility name not configured.</p>";
                return;
            }

            const reportsRef = collection(db, facilityName);
            const reportsQuery = query(reportsRef);

            // Listen for real-time updates to reports
            onSnapshot(reportsQuery, (snapshot) => {
                tableBody.innerHTML = ''; // Clear previous content
                
                if (snapshot.empty) {
                    tableBody.innerHTML = '<p style="padding: 16px;">No reports found.</p>';
                    return;
                }

                const reports = [];
                snapshot.forEach((docSnap) => {
                    reports.push({ id: docSnap.id, ...docSnap.data() });
                });

                // Sort reports by date, newest first
                reports.sort((a, b) => (b.image_upload_date?.toDate()?.getTime() || 0) - (a.image_upload_date?.toDate()?.getTime() || 0));

                // Generate and display each report row
                reports.forEach((report, index) => {
                    const uploadDate = report.image_upload_date?.toDate();
                    const formattedDate = uploadDate ? uploadDate.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "No Date";
                    const status = report.status || "pending";
                    const statusClass = status.toLowerCase().replace(/\s+/g, '-');
                    const buttonDisabledAttribute = status === "Success" ? "" : "disabled";

                    const rowHtml = `
                        <div class="report-row">
                            <div class="report-number">${index + 1}</div>
                            <div class="patient-details">
                                <div class="patient-name">${report.patient_name || "N/A"}</div>
                                <div class="patient-id">ID: ${report.report_track_id || report.id}</div>
                            </div>
                            <div class="report-info">
                                <div class="info-item">
                                    <span class="info-label">Date</span>
                                    <span class="info-value">${formattedDate}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Body Part</span>
                                    <span class="info-value">${report.bodyparts_position || "N/A"}</span>
                                </div>
                            </div>
                            <div class="report-status">
                                <span class="status-badge status-${statusClass}">${status}</span>
                            </div>
                            <div class="report-action">
                                <button class="cta-button btn-print" data-id="${report.id}" ${buttonDisabledAttribute}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/><path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/></svg>
                                    Print
                                </button>
                            </div>
                        </div>
                    `;
                    tableBody.insertAdjacentHTML("beforeend", rowHtml);
                });
            });

        } catch (error) {
            console.error("Error during data fetching process:", error);
            tableBody.innerHTML = "<p style='padding: 16px;'>Something went wrong while loading data.</p>";
        }
    });

    // --- Single, powerful event listener for the entire table body ---
// Replace the existing tableBody event listener with this one
tableBody.addEventListener('click', async (event) => {
    const printButton = event.target.closest('.btn-print');

    if (printButton && !printButton.disabled) {
        const reportId = printButton.dataset.id;
        
        openModal();
        modalBody.innerHTML = `<p>Loading report...</p>`;

        try {
            // Get user and facility info to construct the correct database path
            const user = auth.currentUser;
            const userDocRef = doc(db, "radiologist_database", user.uid);
            const userSnap = await getDoc(userDocRef);
            const facilityName = userSnap.data().facilityName?.trim().replace(/\s+/g, "");

            // Fetch the specific report
            const reportRef = doc(db, facilityName, reportId);
            const reportSnap = await getDoc(reportRef);

            if (reportSnap.exists()) {
                const report = reportSnap.data();
                const uploadDate = report.image_upload_date?.toDate();
                const formattedDate = uploadDate ? uploadDate.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "Not Available";

                // --- New, professional report template ---
                modalBody.innerHTML = `
                    <div class="report-printable-container">
                        <header class="report-letterhead">
                            <h1>${userSnap.data().facilityName || 'Medical Facility'}</h1>
                            <p>Department of Radiology</p>
                        </header>

                        <section class="report-patient-info">
                            <div class="info-column">
                                <p><strong>Patient Name:</strong> ${report.patient_name || 'N/A'}</p>
                                <p><strong>Patient ID:</strong> ${report.report_track_id || reportId}</p>
                            </div>
                            <div class="info-column">
                                <p><strong>Date of Report:</strong> ${formattedDate}</p>
                                <p><strong>Examination:</strong> ${report.bodyparts_position || 'N/A'}</p>
                            </div>
                        </section>

                        <hr class="report-separator">

                        <section class="report-section">
                            <h2>FINDINGS</h2>
                            <p>${report.findings || 'No findings have been recorded.'}</p>
                        </section>

                        <footer class="report-signature">
                            <div class="signature-line"></div>
                            <p>
                                <strong>${userSnap.data().name || 'Radiologist'}</strong><br>
                                Consultant Radiologist
                            </p>
                        </footer>
                    </div>
                `;
            } else {
                modalBody.innerHTML = `<p>Error: Report with ID ${reportId} not found.</p>`;
            }
        } catch (error) {
            console.error("Error fetching report details:", error);
            modalBody.innerHTML = `<p>Error loading report details. Please try again.</p>`;
        }
    }
});

});