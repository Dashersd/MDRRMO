/**
 * Add Incident Modal JavaScript
 * Handles the modal form for adding new incidents
 */

(function () {
  "use strict";

  // Determine API URL based on current page location
  const isSubdirectory = window.location.pathname.includes('/admin/') || 
                         window.location.pathname.includes('/client/') || 
                         window.location.pathname.includes('/bdrrmo/');
  const API_URL = isSubdirectory ? "../api/incidents.php" : "api/incidents.php";

  document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("addIncidentModal");
    const form = document.getElementById("addIncidentForm");
    const submitBtn = document.getElementById("modalSubmitIncident");
    const photoInput = document.getElementById("modalPhoto");
    const photoPreview = document.getElementById("modalPhotoPreview");
    const photoPreviewWrap = document.getElementById("modalPhotoPreviewWrap");
    const photoMeta = document.getElementById("modalPhotoMeta");
    const removePhotoBtn = document.getElementById("modalRemovePhoto");
    const incidentType = document.getElementById("modalIncidentType");
    const description = document.getElementById("modalDescription");

    if (!modal || !form) return;

    // Photo preview handler
    if (photoInput) {
      photoInput.addEventListener("change", function () {
        const file = this.files && this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            photoPreview.src = e.target.result;
            photoPreviewWrap.style.display = "block";
            photoMeta.innerHTML = `<i class="bi bi-check-circle text-success me-1"></i>Photo selected: ${file.name}`;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Remove photo handler
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener("click", function () {
        if (photoInput) photoInput.value = "";
        if (photoPreview) photoPreview.src = "";
        if (photoPreviewWrap) photoPreviewWrap.style.display = "none";
        if (photoMeta)
          photoMeta.innerHTML =
            '<i class="bi bi-clock me-1"></i>Awaiting image upload...';
      });
    }

    // Reset form states completely
    const resetModalState = () => {
      form.reset();
      form.classList.remove("was-validated");
      if (photoPreviewWrap) photoPreviewWrap.style.display = "none";
      if (photoMeta) {
        photoMeta.innerHTML = '<i class="bi bi-clock me-1"></i>Awaiting image upload...';
      }
      
      const editIdEl = document.getElementById("editIncidentId");
      if (editIdEl) editIdEl.value = "";
      
      const modalLabel = document.getElementById("addIncidentModalLabel");
      if (modalLabel) {
        modalLabel.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>Report New Incident';
      }
      
      const modalDesc = modal.querySelector(".modal-header p");
      if (modalDesc) {
        modalDesc.textContent = "Fill in the details below to create a new incident report";
      }
      
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="bi bi-upload me-1"></i> Upload Incident Report';
        submitBtn.disabled = false;
      }
      
      if (photoInput) {
        photoInput.setAttribute("required", "");
      }
    };

    // Form submission
    if (submitBtn) {
      submitBtn.addEventListener("click", async function () {
        const editIdEl = document.getElementById("editIncidentId");
        const isEdit = editIdEl && editIdEl.value;
        
        if (isEdit) {
          if (photoInput) photoInput.removeAttribute("required");
        } else {
          if (photoInput) photoInput.setAttribute("required", "");
        }

        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          return;
        }

        try {
          // Show loading state
          submitBtn.innerHTML = isEdit
            ? '<span class="spinner-border spinner-border-sm me-1"></span> Updating...'
            : '<span class="spinner-border spinner-border-sm me-1"></span> Uploading...';
          submitBtn.disabled = true;

          if (isEdit) {
            const id = editIdEl.value;
            const type = incidentType ? incidentType.value : "";
            const descVal = description ? description.value.trim() : "";
            const file = photoInput?.files && photoInput.files[0];
            
            const updateData = { id, type, description: descVal };
            if (file) {
              updateData.photoDataUrl = await resizeImageToDataURL(file, 1280, 1280);
            }
            
            const response = await fetch(API_URL, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updateData),
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
              throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            showSuccessNotification("Incident report updated successfully!");
          } else {
            const incident = await serializeIncidentForm();
            await saveIncident(incident);
            showSuccessNotification("Incident report submitted successfully!");
          }

          // Close modal after a brief delay
          setTimeout(function () {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();

            resetModalState();

            // Dispatch event to refresh dashboard/lists
            window.dispatchEvent(new CustomEvent("incidentAdded"));
          }, 500);
        } catch (error) {
          console.error("Error submitting incident:", error);
          alert("Failed to submit incident: " + error.message);
          submitBtn.innerHTML = isEdit
            ? '<i class="bi bi-check-circle me-1"></i> Update Incident Report'
            : '<i class="bi bi-upload me-1"></i> Upload Incident Report';
          submitBtn.disabled = false;
        }
      });
    }

    // Reset form when modal is closed
    modal.addEventListener("hidden.bs.modal", resetModalState);
  });

  /**
   * Serialize form data to incident object
   */
  async function serializeIncidentForm() {
    const type = document.getElementById("modalIncidentType")?.value;
    const description = document
      .getElementById("modalDescription")
      ?.value.trim();
    const photoInput = document.getElementById("modalPhoto");
    const file = photoInput?.files && photoInput.files[0];

    if (!type) throw new Error("Please select an incident type");
    if (!description) throw new Error("Please provide a description");
    if (!file) throw new Error("Please upload a photo");

    // Resize and convert image to data URL
    const photoDataUrl = await resizeImageToDataURL(file, 1280, 1280);

    // Get current user (try multiple methods)
    const currentUser =
      window.CURRENT_USER ||
      document.body.getAttribute("data-current-user") ||
      "";

    return {
      id: generateId(),
      type: type,
      description: description,
      status: "New",
      reportedBy: currentUser, // Add reportedBy field
      createdAt: Date.now(),
      photoDataUrl: photoDataUrl,

    };
  }

  /**
   * Resize image to data URL
   */
  function resizeImageToDataURL(file, maxW, maxH) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(1, maxW / width, maxH / height);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate unique ID
   */
  function generateId() {
    return (
      "inc_" +
      Math.random().toString(36).slice(2, 9) +
      Date.now().toString(36).slice(-4)
    );
  }

  /**
   * Save incident to database API and localStorage as backup
   */
  async function saveIncident(incident) {
    try {
      // Get current user (try multiple methods)
      const currentUser =
        window.CURRENT_USER ||
        document.body.getAttribute("data-current-user") ||
        "";

      // Add reportedBy field if not present
      if (!incident.reportedBy && currentUser) {
        incident.reportedBy = currentUser;
      }

      // Save to database via API
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incident),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      // Use the ID from API response if provided
      if (result.id) {
        incident.id = result.id;
      }

      return result;
    } catch (error) {
      console.error("Error saving incident:", error);
      throw new Error("Failed to save incident: " + error.message);
    }
  }

  /**
   * Show success notification
   */
  function showSuccessNotification(message) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className =
      "alert alert-success alert-dismissible fade show position-fixed";
    notification.style.cssText =
      "top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);";
    notification.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
})();
