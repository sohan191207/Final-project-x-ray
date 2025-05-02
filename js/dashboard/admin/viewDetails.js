function openModal() {
  document.getElementById('detailsModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('detailsModal').style.display = 'none';
}

function openHospitalModal() {
  document.getElementById('hospitalDetailsModal').style.display = 'flex';
}

function closeHospitalModal() {
  document.getElementById('hospitalDetailsModal').style.display = 'none';
}

function openUserModal() {
  document.getElementById('userDetailsModal').style.display = 'flex';
}

function closeUserModal() {
  document.getElementById('userDetailsModal').style.display = 'none';
}

// Close modals when clicking outside
window.addEventListener('click', function (e) {
  if (e.target === document.getElementById('detailsModal')) closeModal();
  if (e.target === document.getElementById('hospitalDetailsModal')) closeHospitalModal();
  if (e.target === document.getElementById('userDetailsModal')) closeUserModal();
});
