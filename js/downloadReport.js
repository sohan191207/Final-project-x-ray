import { auth, db } from "../js/authentication/config.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Select all necessary elements from the DOM ---
const reportForm = document.querySelector('.report-form');
const trackingInput = document.querySelector('#tracking-number');
const submitButton = document.querySelector('.report-form button');
const reportContainer = document.getElementById('reportContainer');

// --- Helper function for showing user-friendly messages ---
function showMessage(message, isError = false) {
  // This removes any previous message
  const existingMessage = document.querySelector('.form-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create a new message element
  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.className = 'form-message';
  messageEl.style.color = isError ? '#d9534f' : '#22c55e'; // Red for error, green for success
  messageEl.style.marginTop = '10px';
  messageEl.style.textAlign = 'center';

  // Add it after the form's input wrapper
  reportForm.querySelector('.input-wrapper').insertAdjacentElement('afterend', messageEl);
}

// --- Main Logic ---
if (reportForm && trackingInput && submitButton && reportContainer) {
  submitButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const trackingNumber = trackingInput.value.trim();

    if (!trackingNumber) {
      showMessage("Please enter a tracking number.", true);
      return;
    }

    showMessage("Searching for your report...", false);
    submitButton.disabled = true; // Disable button during search

    try {
      const docRef = doc(db, "AllCompleteData", trackingNumber);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const report = docSnap.data();
        const reportId = docSnap.id;

        // --- START: Dynamic Data Fetching ---
        
        let doctorName = 'Consultant Radiologist'; // A default name
        
        // 1. Get the Doctor's ID from the report data.
        const doctorId = report.ProcessDoctorID;

        if (doctorId) {
            try {
                // 2. Create a reference to the doctor's document in the 'users' collection.
                //    IMPORTANT: Change 'users' if your doctors are stored in a different collection.
                const doctorRef = doc(db, 'users', doctorId);
                const doctorSnap = await getDoc(doctorRef);
                
                if (doctorSnap.exists()) {
                    // 3. Get the full name from the doctor's document.
                    doctorName = doctorSnap.data().name || doctorName;
                }
            } catch (userError) {
                console.error("Could not fetch doctor's details:", userError);
                // The process will continue with the default doctor name.
            }
        }
        
        // --- END: Dynamic Data Fetching ---

        const formattedDate = new Date(report.completed_at?.toDate() || Date.now()).toLocaleDateString('en-GB');

        showMessage("Report found! Preparing download...", false);

        // Populate the container with the report's HTML
        reportContainer.innerHTML = `
          <div class="report-printable-container" id="report-to-print" style="color: black;">
            <div class="report-watermark">CONFIDENTIAL</div>
            <header class="report-header">
              <div class="logo-container">
                <img src="/image/logo/logo.png" alt="Facility Logo" class="facility-logo">
              </div>
              <div class="facility-details">
                <h1>${report.collectionName || 'Medical Facility'}</h1>
                <p>Department of Radiology</p>
              </div>
            </header>
            <section class="patient-details-grid">
              <div class="detail-item"><strong>Patient Name:</strong><span>${report.patient_name || 'N/A'}</span></div>
              <div class="detail-item"><strong>Patient ID:</strong><span>${report.report_track_id || reportId}</span></div>
              <div class="detail-item"><strong>Age:</strong><span>${report.Patient_age || 'N/A'}</span></div>
              <div class="detail-item"><strong>Sex:</strong><span>${report.Patient_sex || 'N/A'}</span></div>
              <div class="detail-item"><strong>Report Date:</strong><span>${formattedDate}</span></div>
              <div class="detail-item"><strong>Examination:</strong><span>${report.bodyparts_position || 'N/A'}</span></div>
            </section>
            <hr class="report-divider">
            <main class="report-body">
              <section class="report-section">
                <h2>FINDINGS</h2>
                <p>${report.findings || 'No findings have been recorded.'}</p>
              </section>
              <section class="report-section">
                <h2>IMPRESSION</h2>
                <p>${report.impression || 'No impression provided.'}</p>
              </section>
            </main>
            <footer class="report-signature-block">
              <div class="signature-line"></div>
              <p>
                <strong>${doctorName}</strong><br>
                Consultant Radiologist, M.D.
              </p>
            </footer>
            <div class="report-footer">
              <p>This report is confidential and intended for the recipient only. Page 1 of 1.</p>
            </div>
          </div>
        `;

        // Use setTimeout to ensure the content renders before printing
        setTimeout(() => {
          const elementToPrint = reportContainer.querySelector('#report-to-print');
          const pdfOptions = {
            margin: 0.5,
            filename: `Report-${reportId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
          };
          html2pdf().from(elementToPrint).set(pdfOptions).save();
        }, 100);

      } else {
        showMessage("No report found with that tracking number.", true);
      }
    } catch (error) {
      showMessage("An error occurred. Please try again later.", true);
      console.error("Firebase Error:", error);
    } finally {
      submitButton.disabled = false; // Re-enable the button
    }
  });
} else {
  console.error("Critical Error: A required HTML element is missing. Ensure the form, input, button, and #reportContainer exist.");
}