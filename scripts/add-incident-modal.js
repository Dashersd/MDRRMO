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

  let selectedImages = [];

  document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("addIncidentModal");
    const form = document.getElementById("addIncidentForm");
    const submitBtn = document.getElementById("modalSubmitIncident");
    const photoInput = document.getElementById("modalPhoto");
    const photoPreviewWrap = document.getElementById("modalPhotoPreviewWrap");
    const photoPreviewContainer = document.getElementById("modalPhotoPreviewContainer");
    const photoMeta = document.getElementById("modalPhotoMeta");
    const incidentType = document.getElementById("modalIncidentType");
    const description = document.getElementById("modalDescription");
    const otherIncidentTypeContainer = document.getElementById("otherIncidentTypeContainer");
    const modalOtherIncidentType = document.getElementById("modalOtherIncidentType");

    if (!modal || !form) return;

    if (incidentType && otherIncidentTypeContainer && modalOtherIncidentType) {
      incidentType.addEventListener('change', function() {
        if (this.value === 'Other') {
          otherIncidentTypeContainer.style.display = 'block';
          modalOtherIncidentType.setAttribute('required', 'required');
        } else {
          otherIncidentTypeContainer.style.display = 'none';
          modalOtherIncidentType.removeAttribute('required');
          modalOtherIncidentType.value = '';
        }
      });
    }

    // Auto-select and lock barangay for BDRRMO staff
    const modalBarangay = document.getElementById("modalBarangay");
    if (modalBarangay && window.USER_ORGANIZATION && window.USER_ORGANIZATION !== 'MDRRMO') {
      modalBarangay.value = window.USER_ORGANIZATION;
      modalBarangay.setAttribute('disabled', 'disabled');
      // Create a hidden input to submit the value since disabled inputs aren't submitted
      const hiddenBarangay = document.createElement('input');
      hiddenBarangay.type = 'hidden';
      hiddenBarangay.name = 'barangay';
      hiddenBarangay.id = 'hiddenModalBarangay';
      hiddenBarangay.value = window.USER_ORGANIZATION;
      form.appendChild(hiddenBarangay);
    }

    // Photo preview handler
    if (photoInput) {
      photoInput.addEventListener("change", function (e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (files.length > 10) {
          alert('Please select a maximum of 10 images at a time to avoid storage issues.');
          this.value = '';
          return;
        }

        // Clear previous
        selectedImages = [];
        if (photoPreviewContainer) photoPreviewContainer.innerHTML = '';
        if (photoMeta) photoMeta.innerHTML = `<i class="bi bi-clock me-1 text-muted"></i>Processing images...`;

        let loadedCount = 0;
        files.forEach((file, index) => {
          resizeImageToDataURL(file, 800, 800)
            .then(dataUrl => {
              selectedImages.push(dataUrl);
              addImagePreview(dataUrl, index);
              loadedCount++;
              if (loadedCount === files.length) {
                if (photoPreviewWrap) photoPreviewWrap.style.display = "block";
                if (photoMeta) photoMeta.innerHTML = `<i class="bi bi-check-circle text-success me-1"></i>${files.length} photo(s) selected`;
              }
            })
            .catch(err => {
              console.error(err);
              loadedCount++;
            });
        });
      });
    }

    function addImagePreview(dataUrl, index) {
      if (!photoPreviewContainer) return;
      
      const previewItem = document.createElement('div');
      previewItem.style.position = 'relative';
      previewItem.style.width = '100px';
      previewItem.style.height = '100px';
      previewItem.style.borderRadius = '8px';
      previewItem.style.overflow = 'hidden';
      previewItem.style.border = '2px solid #dee2e6';
      
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.innerHTML = '<i class="bi bi-x"></i>';
      removeBtn.style.position = 'absolute';
      removeBtn.style.top = '4px';
      removeBtn.style.right = '4px';
      removeBtn.style.width = '24px';
      removeBtn.style.height = '24px';
      removeBtn.style.borderRadius = '50%';
      removeBtn.style.background = 'rgba(220, 53, 69, 0.9)';
      removeBtn.style.color = 'white';
      removeBtn.style.border = 'none';
      removeBtn.style.display = 'flex';
      removeBtn.style.alignItems = 'center';
      removeBtn.style.justifyContent = 'center';
      removeBtn.style.fontSize = '0.75rem';
      
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedImages.splice(selectedImages.indexOf(dataUrl), 1);
        previewItem.remove();
        if (selectedImages.length === 0) {
          if (photoPreviewWrap) photoPreviewWrap.style.display = 'none';
          if (photoInput) photoInput.value = '';
          if (photoMeta) photoMeta.innerHTML = '<i class="bi bi-clock me-1"></i>You can select up to 10 images.';
        } else {
          if (photoMeta) photoMeta.innerHTML = `<i class="bi bi-check-circle text-success me-1"></i>${selectedImages.length} photo(s) selected`;
        }
      });
      
      previewItem.appendChild(img);
      previewItem.appendChild(removeBtn);
      photoPreviewContainer.appendChild(previewItem);
    }

    // Reset form states completely
    const resetModalState = () => {
      form.reset();
      form.classList.remove("was-validated");
      selectedImages = [];
      if (photoPreviewContainer) photoPreviewContainer.innerHTML = '';
      if (photoPreviewWrap) photoPreviewWrap.style.display = "none";
      if (photoMeta) {
        photoMeta.innerHTML = '<i class="bi bi-clock me-1"></i>You can select up to 10 images.';
      }
      
      const otherTypeContainer = document.getElementById("otherIncidentTypeContainer");
      const otherTypeInput = document.getElementById("modalOtherIncidentType");
      if (otherTypeContainer) {
        otherTypeContainer.style.display = 'none';
      }
      if (otherTypeInput) {
        otherTypeInput.removeAttribute('required');
        otherTypeInput.value = '';
      }
      
      const barangayInput = document.getElementById("modalBarangay");
      if (barangayInput && (!window.USER_ORGANIZATION || window.USER_ORGANIZATION === 'MDRRMO')) {
          barangayInput.value = "";
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
            let type = incidentType ? incidentType.value : "";
            
            if (type === 'Other') {
              const otherTypeInput = document.getElementById("modalOtherIncidentType");
              if (otherTypeInput && otherTypeInput.value.trim() !== '') {
                type = "Other: " + otherTypeInput.value.trim();
              }
            }
            
            const descVal = description ? description.value.trim() : "";
            
            const barangayVal = document.getElementById("modalBarangay")?.value || "";
            
            const updateData = { id, type, description: descVal, barangay: barangayVal };
            if (selectedImages.length > 0) {
              updateData.photoDataUrls = selectedImages;
              updateData.photoDataUrl = selectedImages[0]; // fallback
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
    let type = document.getElementById("modalIncidentType")?.value;
    
    if (type === 'Other') {
      const otherTypeInput = document.getElementById("modalOtherIncidentType");
      if (otherTypeInput && otherTypeInput.value.trim() !== '') {
        type = "Other: " + otherTypeInput.value.trim();
      } else {
        throw new Error("Please specify the other incident type");
      }
    }
    
    const description = document
      .getElementById("modalDescription")
      ?.value.trim();

    const barangay = document.getElementById("modalBarangay")?.value;

    if (!type) throw new Error("Please select an incident type");
    if (!barangay) throw new Error("Please select a barangay");
    if (!description) throw new Error("Please provide a description");
    if (selectedImages.length === 0) throw new Error("Please upload at least one photo");

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
      barangay: barangay,
      createdAt: Date.now(),
      photoDataUrl: selectedImages[0], // Keep for backward compatibility
      photoDataUrls: selectedImages,
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
          resolve(canvas.toDataURL("image/jpeg", 0.6)); // Lower quality to save space
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
