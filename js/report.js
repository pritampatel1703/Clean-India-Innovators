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

    // Helper to get translation
    function getTrans(key) {
        const lang = localStorage.getItem('clean_india_lang') || 'en';
        if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
            return translations[lang][key];
        }
        // Fallback to English if available, else key
        if (typeof translations !== 'undefined' && translations['en'] && translations['en'][key]) {
            return translations['en'][key];
        }
        return key;
    }

    // 2. Geolocation Logic
    btnGetLocation.addEventListener('click', () => {
        if (!navigator.geolocation) {
            locationStatus.innerText = getTrans('status_geo_unsupported');
            return;
        }

        locationStatus.innerText = getTrans('status_fetching');
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
                locationStatus.innerText = getTrans('status_location_failed');
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
        const name = document.getElementById('reporter-name').value;
        const phone = document.getElementById('reporter-phone').value;
        const hasImage = !previewContainer.classList.contains('hidden');

        if (!name || !phone || !locationInput.value || !hasImage) {
            alert(getTrans('alert_fill_required').replace(/\\n/g, '\n'));
            return;
        }

        submitBtn.innerText = getTrans('btn_submitting');
        submitBtn.disabled = true;

        // Prepare Data
        const formData = {
            name: document.getElementById('reporter-name').value,
            phone: document.getElementById('reporter-phone').value,
            description: reportForm.querySelector('textarea').value,
            location: locationInput.value,
            severity: reportForm.querySelectorAll('select')[0].value,
            agency: reportForm.querySelectorAll('select')[1].value,
            image: imagePreview.src.includes('base64') ? imagePreview.src : null,
            mimeType: "image/jpeg" // Default
        };

        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzb-APkOcPuBQAp7PBzp5NqE2vawTXTj5Xqf0TX4oDR7GNZ6JT6jIDOEFDZRV6yqdGEEg/exec";

        try {
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(formData),
                mode: "no-cors" // Google Apps Script needs this for cross-origin POSTs
            });

            // no-cors returns an opaque response (type "opaque", status 0) — that's expected and means success
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
            alert(getTrans('alert_submit_error'));
        } finally {
            submitBtn.innerText = originalText; // This might revert to English "Submit Report" if originalText was captured before translation update?
            // Actually, originalText captures what's on the button NOW.
            // But if language changed, we should re-fetch from translation?
            // Better:
            const lang = localStorage.getItem('clean_india_lang') || 'en';
            if (typeof translations !== 'undefined' && translations[lang] && translations[lang]['btn_submit_report']) {
                submitBtn.innerText = translations[lang]['btn_submit_report'];
            } else {
                submitBtn.innerText = originalText;
            }
            submitBtn.disabled = false;
        }
    });

    // Close Modal
    btnModalClose.addEventListener('click', () => {
        successModal.classList.add('hidden');
        // Optional: Redirect to home
        window.location.href = 'index.html';
    });

    // --- TESTIMONIAL LOGIC ---
    const testimonialFormContainer = document.getElementById('testimonial-form-container');
    const testimonialLoginPrompt = document.getElementById('testimonial-login-prompt');
    const testimonialText = document.getElementById('testimonial-text');
    const btnPostTestimonial = document.getElementById('btn-post-testimonial');
    const testimonialsList = document.getElementById('testimonials-list');

    // 1. Check Auth & Toggle UI
    const currentUser = getCurrentUser(); // From auth.js
    if (currentUser) {
        testimonialFormContainer.classList.remove('hidden');
        testimonialLoginPrompt.classList.add('hidden');
    } else {
        testimonialFormContainer.classList.add('hidden');
        testimonialLoginPrompt.classList.remove('hidden');
    }

    // 2. Load Testimonials
    function loadTestimonials() {
        const stored = localStorage.getItem('clean_india_testimonials');
        const testimonials = stored ? JSON.parse(stored) : [];

        testimonialsList.innerHTML = '';
        testimonials.forEach(t => {
            const el = document.createElement('div');
            el.className = 'testimonial-item';
            el.style.cssText = "background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #077f5b; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";

            el.innerHTML = `
                <p style="font-size: 15px; color: #333; margin-bottom: 8px; font-style: italic;">"${t.text}"</p>
                <div style="font-size: 13px; color: #666; font-weight: 500;">
                    - ${t.name} <span style="font-weight: 400; font-size: 12px; color: #999;">(${new Date(t.date).toLocaleDateString()})</span>
                </div>
            `;
            testimonialsList.appendChild(el);
        });

        if (testimonials.length === 0) {
            testimonialsList.innerHTML = '<p style="text-align:center; color:#999; font-style:italic;">No stories yet. Be the first to share!</p>';
        }
    }

    // 3. Post Testimonial
    btnPostTestimonial.addEventListener('click', () => {
        const txt = testimonialText.value.trim();
        if (!txt) {
            alert("Please write something to post.");
            return;
        }

        const newTestimonial = {
            name: currentUser.name,
            text: txt,
            date: new Date().toISOString()
        };

        const stored = localStorage.getItem('clean_india_testimonials');
        const testimonials = stored ? JSON.parse(stored) : [];
        testimonials.unshift(newTestimonial); // Add to top

        localStorage.setItem('clean_india_testimonials', JSON.stringify(testimonials));

        testimonialText.value = '';
        loadTestimonials();
        alert("Thanks for sharing your story!");
    });

    // Initial Load
    loadTestimonials();
});
