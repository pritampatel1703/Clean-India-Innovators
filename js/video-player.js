document.addEventListener('DOMContentLoaded', () => {
    const videoContainers = document.querySelectorAll('.video-container');

    videoContainers.forEach(container => {
        const video = container.querySelector('video');
        const playBtn = container.querySelector('.play-btn');
        const playIcon = playBtn.querySelector('i');
        const progressBar = container.querySelector('.progress-bar');
        const progressContainer = container.querySelector('.progress-container');
        const timeDisplay = container.querySelector('.video-time');
        const fullscreenBtn = container.querySelector('.fullscreen-btn');
        const playOverlay = container.querySelector('.play-overlay');

        // Toggle Play/Pause
        function togglePlay() {
            if (video.paused) {
                video.play();
                container.classList.add('playing');
                container.classList.remove('paused');
                playIcon.classList.remove('fa-play');
                playIcon.classList.add('fa-pause');
            } else {
                video.pause();
                container.classList.remove('playing');
                container.classList.add('paused');
                playIcon.classList.remove('fa-pause');
                playIcon.classList.add('fa-play');
            }
        }

        // Event Listeners for Play/Pause
        video.addEventListener('click', togglePlay);
        playBtn.addEventListener('click', togglePlay);
        if (playOverlay) {
            // Technically overlay has pointer-events: none, but if clicked near, video click handles it.
            // If we remove pointer-events: none, we'd add listener here.
        }

        // Update Progress Bar & Time
        video.addEventListener('timeupdate', () => {
            const percent = (video.currentTime / video.duration) * 100;
            progressBar.style.width = `${percent}%`;

            const current = formatTime(video.currentTime);
            const total = formatTime(video.duration);
            timeDisplay.innerText = `${current} / ${total}`;
        });

        // Seek
        progressContainer.addEventListener('click', (e) => {
            const width = progressContainer.clientWidth;
            const clickX = e.offsetX;
            const duration = video.duration;
            video.currentTime = (clickX / width) * duration;
        });

        // Toggle Fullscreen
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });

        // Handle Video End
        video.addEventListener('ended', () => {
            container.classList.remove('playing');
            container.classList.add('paused');
            playIcon.classList.remove('fa-pause');
            playIcon.classList.add('fa-play');
            progressBar.style.width = '0%';
        });
    });

    function formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
});
