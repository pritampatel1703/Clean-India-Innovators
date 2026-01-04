// JS for Report Page
document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const cameraInput = document.getElementById('camera-input');
    const previewContainer = document.getElementById('preview-container');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const imagePreview = document.getElementById('image-preview');
    const btnRemoveImg = document.getElementById('btn-remove-img');
    const btnGetLocation = document.getElementById('btn-get-location');
    const locationInput = document.getElementById('location-input');
    const locationStatus = document.getElementById('location-status');
    const reportForm = document.getElementById('report-form');
    const successModal = document.getElementById('success-modal');
    const btnModalClose = document.getElementById('btn-modal-close');

    // 1. File Upload Logic
    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                previewContainer.classList.remove('hidden');
                uploadPlaceholder.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    cameraInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Remove Image
    btnRemoveImg.addEventListener('click', () => {
        fileInput.value = '';
        cameraInput.value = '';
        previewContainer.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
    });

    // 2. Geolocation Logic
    btnGetLocation.addEventListener('click', () => {
        if (!navigator.geolocation) {
            locationStatus.innerText = "Geolocation is not supported by your browser.";
            return;
        }

        locationStatus.innerText = "Fetching location...";
        btnGetLocation.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);

                // In a real app, reverse geocoding (Coord -> Address) would happen here via API
                // For now, we simulate an address + coords
                locationInput.value = `Lat: ${lat}, Lng: ${lng} (Current Location)`;
                locationStatus.innerText = "";
                locationStatus.style.color = "green";
                btnGetLocation.disabled = false;
            },
            (error) => {
                locationStatus.innerText = "Unable to retrieve location. Please enter manually.";
                locationStatus.style.color = "red";
                btnGetLocation.disabled = false;
                console.error(error);
            }
        );
    });

    // 3. Form Submission
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = reportForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerText;

        // Validation
        if (!locationInput.value) {
            alert("Please provide a location.");
            return;
        }

        submitBtn.innerText = "Submitting...";
        submitBtn.disabled = true;

        // Prepare Data
        const formData = {
            description: reportForm.querySelector('textarea').value,
            location: locationInput.value,
            severity: reportForm.querySelectorAll('select')[0].value,
            agency: reportForm.querySelectorAll('select')[1].value,
            image: imagePreview.src.includes('base64') ? imagePreview.src : null,
            mimeType: "image/jpeg" // Default
        };

        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOeX7QFIj601OSMgjfR4IOTnUwRBwE842zTPvOdr9k-eUjGCTtUQI2L7Skz-IvM4Xw/exec";

        try {
            await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(formData)
            });

            // Success
            successModal.classList.remove('hidden');
            reportForm.reset();

            // Reset image
            fileInput.value = '';
            cameraInput.value = '';
            previewContainer.classList.add('hidden');
            uploadPlaceholder.classList.remove('hidden');

        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report. Please try again.");
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });

    // Close Modal
    btnModalClose.addEventListener('click', () => {
        successModal.classList.add('hidden');
        // Optional: Redirect to home
        window.location.href = 'index.html';
    });
});
