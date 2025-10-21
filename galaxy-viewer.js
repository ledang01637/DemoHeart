// --- URL Params ---
const urlParams = new URLSearchParams(window.location.search);
const galaxyId = 1;
const isDemo = 1;

// --- Demo Data ---
const demoGalaxyDataDefault = {
    messages: [
        "Anh Đăng đẹp trai 💖", "Anh Đăng víp pro 💖", "Anh Đăng víp siêu ngầu 💕", "Anh Đăng đẳng cấp 💖",
        "Anh Đăng tuyệt vời 💖", "Anh Đăng siêu cấp 💖", "Anh Đăng số 1 💖", "Anh Đăng phong độ 💕",
        "Anh Đăng Supper", "Anh Đăng là tất cả 💖", "Anh Lê Đăng dễ thương 💖" , "Anh Lê Đăng cute",
        "Anh Đăng Siêu Cấp Víp Pro 💖", "Anh Siêu Đẹp Trai 💖", "Mãi yêu Anh Đăng 💖", "Anh Đăng là nhất 💕",
    ],
    icons: ["♥", "💖", "❤️", "❤️", "💕", "💕"],
    colors: '#ff6b9d',
    images: ["a1.jpg", "a2.jpg"],
    song: "audio.mp3",
    isHeart: true,
    textHeart: "Lê Đăng",
    isSave: true,
    createdAt: Date.now(),
};

// --- DOM refs ---
const loadingScreen = document.getElementById('loadingScreen');
const errorScreen = document.getElementById('errorScreen');
const galaxy = document.getElementById('galaxy');
const heartContainer = document.getElementById('heartContainer');

// --- State ---
let galaxyData = null;
let rotationX = 0, rotationY = 0, scale = 1;
let isDragging = false, lastMouseX = 0, lastMouseY = 0;
const activeParticles = new Set();
let galaxyAnimationId, heartAnimationStarted = false;
// Thêm biến theo dõi thời gian zoom cuối cùng
let lastZoomTime = 0;
let intervals = [];  // Cleanup helper

// --- Responsive (dynamic) ---
let isMobile = window.innerWidth <= 768;
let isSmallMobile = window.innerWidth <= 480;
function updateResponsive() {
    isMobile = window.innerWidth <= 768;
    isSmallMobile = window.innerWidth <= 480;
}
window.addEventListener('resize', updateResponsive);
const maxParticles = isSmallMobile ? 80 : isMobile ? 120 : 300;
// Tăng interval để tạo particle thưa hơn
const particleInterval = isMobile ? 200 : 120;
const starCount = isSmallMobile ? 250 : isMobile ? 350 : 500;
let particleSpeedMultiplier = 1.3;

// --- Particle speed on drag/touch ---
document.addEventListener('mousedown', () => { particleSpeedMultiplier = 1.7; });
document.addEventListener('mouseup', () => { particleSpeedMultiplier = 1; });
document.addEventListener('touchstart', (e) => { if (e.touches.length === 1) particleSpeedMultiplier = 1.7; });
document.addEventListener('touchend', () => { particleSpeedMultiplier = 1; });

// --- Prevent scroll/zoom ---
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('wheel', e => e.preventDefault(), { passive: false });

// --- Load galaxy data (fixed: await + missing calls) ---
async function loadGalaxyData() {
    if (isDemo) {
        // Ưu tiên lấy dữ liệu custom demo từ localStorage nếu có
        let customDemo = null;
        try {
            customDemo = localStorage.getItem('deargift_demo_data');
            if (customDemo) customDemo = JSON.parse(customDemo);
        } catch(e) { 
            customDemo = null; 
            localStorage.removeItem('deargift_demo_data');  // Clear corrupt
        }
        galaxyData = customDemo && customDemo.messages && customDemo.icons ? customDemo : demoGalaxyDataDefault;
        showStartButton();  // Add missing
        loadingScreen.style.display = 'none';
        return;
    }
    if (!galaxyId) { showError(); return; }
    try {
        console.log('Fetching galaxy data from:', `https://dearlove-backend.onrender.com/api/galaxies/${galaxyId}`);
        const response = await fetch(`https://dearlove-backend.onrender.com/api/galaxies/${galaxyId}`);
        
        if (!response.ok) { showError(); return; }
        const data = await response.json();
        
        if (!data || !data.data) { showError(); return; }
        galaxyData = data.data;
        showStartButton();  // Add missing
        console.log('Galaxy loaded:', galaxyData);  // Debug
    } catch (error) {
        console.error('Error loading galaxy:', error);
        showError();
    } finally {
        loadingScreen.style.display = 'none';  // Always hide
    }
}

function showError(msg = 'Lỗi tải dữ liệu') {
    loadingScreen.style.display = 'none';
    errorScreen.style.display = 'flex';
    // Optional: Update error text if DOM allows
    const errorP = errorScreen.querySelector('p');
    if (errorP) errorP.textContent = msg;
}

// Add missing showStartButton (assume it plays audio/shows help – customize if needed)
function showStartButton() {
    // e.g., document.getElementById('startButton').style.display = 'block'; or play audio
    initializeAudio();  // Tie to audio init
    // Show help dialog if exists
    const helpDialog = document.getElementById('helpDialog');
    if (helpDialog) helpDialog.classList.add('active');
}

// Thêm global flag (sau phần State)
let audioPlayed = false;

// Fix initializeAudio()
function initializeAudio() {
    if (!galaxyData.song || audioPlayed) return;  // Skip nếu đã play
    const audio = document.getElementById('galaxyAudio');
    let audioSrc;
    if (galaxyData.song.startsWith('http')) {
        audioSrc = galaxyData.song;
    } else if (galaxyData.song.startsWith('songs/')) {
        audioSrc = galaxyData.song;
    } else {
        audioSrc = `${galaxyData.song}`;
    }
    audio.src = audioSrc;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.7;
    audioPlayed = true;  // Mark as setup
}

// Thêm hàm play on gesture (gọi sau user click/tap)
function playAudioOnGesture() {
    if (!audioPlayed) return;  // Skip nếu chưa setup
    const audio = document.getElementById('galaxyAudio');
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('Audio started successfully');
        }).catch(error => {
            console.warn('Audio play failed even after gesture:', error);
            // Fallback: Mute or retry on next gesture
        });
    }
}

// Event listener cho user gesture (thêm vào cuối JS, sau initApp())
document.addEventListener('click', playAudioOnGesture, { once: true });  // Play on first click
document.addEventListener('touchstart', playAudioOnGesture, { once: true });  // Mobile tap

// Nếu có nút start (#startButton), tie vào đó
const startButton = document.getElementById('startButton');
if (startButton) {
    startButton.addEventListener('click', playAudioOnGesture);
}

// --- Particle helpers ---
function getRandomMessage() {
    return galaxyData.messages[Math.floor(Math.random() * galaxyData.messages.length)];
}
function getRandomIcon() {
    return galaxyData.icons[Math.floor(Math.random() * galaxyData.icons.length)];
}

// --- Create text particle (minor: add font load check) ---
function createTextParticle() {
    if (activeParticles.size >= maxParticles || heartAnimationStarted) return;
    const isIcon = Math.random() > 0.85;
    const element = document.createElement('div');
    element.className = 'text-particle';
    if (isIcon) {
        element.textContent = getRandomIcon();
    } else {
        element.textContent = getRandomMessage();
    }
    element.style.color = galaxyData.colors || '#ff6b9d';
    element.style.textShadow = `0 0 15px ${galaxyData.colors || '#ff6b9d'}, 0 0 25px ${galaxyData.colors || '#ff6b9d'}, 2px 2px 6px rgba(0,0,0,0.9)`;

    // Temp measure width (add font-family if needed for accuracy)
    document.fonts.ready.then(() => {  // Wait font load
        galaxy.appendChild(element);
        const displayWidth = element.offsetWidth || 100;
        galaxy.removeChild(element);
        // Tăng vùng tạo trên mobile
        const margin = isMobile ? 0.35 : 0.15;
        const minX = -window.innerWidth * margin;
        const maxX = window.innerWidth * (1 + margin) - displayWidth;
        const xPos = minX + Math.random() * (maxX - minX);
        element.style.left = xPos + 'px';

        const zPos = (Math.random() - 0.5) * (isMobile ? 300 : 500);
        const animationDuration = (Math.random() * 2 + (isMobile ? 3 : 3)) * 2;
        // Tăng font chữ trên desktop
        const baseFontSize = isSmallMobile ? 18 : isMobile ? 18 : 24;
        const fontSizeVariation = isSmallMobile ? 8 : isMobile ? 8 : 10;
        element.style.fontSize = (Math.random() * fontSizeVariation + baseFontSize) + 'px';
        const depthOpacity = Math.max(0.4, 1 - Math.abs(zPos) / (isMobile ? 250 : 400));
        element.style.opacity = depthOpacity;
        // Tăng khoảng rơi theo chiều cao trên mobile
        let startTime = null;
        const startY = isMobile ? -300 : -150;
        const endY = isMobile ? window.innerHeight + 300 : window.innerHeight + 150;
        const thisParticleSpeed = particleSpeedMultiplier;
        function animateParticle(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / (animationDuration * 1000 * thisParticleSpeed);
            if (progress < 1 && !heartAnimationStarted && activeParticles.has(element)) {  // Guard has
                const currentY = startY + (endY - startY) * progress;
                const opacity = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : depthOpacity;
                element.style.transform = `translate3d(0, ${currentY}px, ${zPos}px)`;
                element.style.opacity = opacity;
                requestAnimationFrame(animateParticle);
            } else {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                activeParticles.delete(element);
            }
        }
        galaxy.appendChild(element);
        activeParticles.add(element);
        requestAnimationFrame(animateParticle);
    }).catch(() => { /* Fallback if fonts fail */ });
}

// --- Create image particle (similar guard) ---
function createImageParticle() {
    if (!galaxyData.images || galaxyData.images.length === 0 || activeParticles.size >= maxParticles || heartAnimationStarted) return;
    // Tạo div bọc ngoài
    const wrapper = document.createElement('div');
    wrapper.className = 'text-particle image-particle';
    wrapper.style.position = 'absolute';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.borderRadius = '15px';
    wrapper.style.overflow = 'visible';
    wrapper.style.border = 'none';
    // Tạo img bên trong
    const img = document.createElement('img');
    img.src = galaxyData.images[Math.floor(Math.random() * galaxyData.images.length)];
    img.style.display = 'block';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '15px';
    img.style.margin = '0';
    img.style.padding = '0';
    img.style.border = 'none';
    wrapper.appendChild(img);
    // Khi ảnh load xong, set width/height cho wrapper và img, random vị trí left theo pixel
    img.onload = function() {
        // Giảm maxHeight trên mobile
        const maxHeight = isMobile ? 100 : 130;
        let ratio = 1;
        if (img.naturalHeight > maxHeight) {
            ratio = maxHeight / img.naturalHeight;
        }
        const displayWidth = Math.round(img.naturalWidth * ratio);
        const displayHeight = Math.round(img.naturalHeight * ratio);
        wrapper.style.width = displayWidth + 'px';
        wrapper.style.height = displayHeight + 'px';
        img.style.width = displayWidth + 'px';
        img.style.height = displayHeight + 'px';
        // Tăng vùng tạo trên mobile
        const margin = isMobile ? 0.35 : 0.2;
        const minX = -window.innerWidth * margin;
        const maxX = window.innerWidth * (1 + margin) - displayWidth;
        const xPos = minX + Math.random() * (maxX - minX);
        wrapper.style.left = xPos + 'px';

        const zPos = (Math.random() - 0.5) * (isMobile ? 300 : 500);
        const animationDuration = (Math.random() * 2 + (isMobile ? 3 : 3)) * 2;
        let startTime = null;
        const startY = isMobile ? -300 : -150;
        const endY = isMobile ? window.innerHeight + 300 : window.innerHeight + 150;
        const thisParticleSpeed = particleSpeedMultiplier;
        function animateParticle(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / (animationDuration * 1000 * thisParticleSpeed);
            if (progress < 1 && !heartAnimationStarted && activeParticles.has(wrapper)) {
                const currentY = startY + (endY - startY) * progress;
                const opacity = progress < 0.05 ? progress * 20 : progress > 0.95 ? (1 - progress) * 20 : 1;
                wrapper.style.transform = `translate3d(0, ${currentY}px, ${zPos}px)`;
                wrapper.style.opacity = opacity;
                requestAnimationFrame(animateParticle);
            } else {
                if (wrapper.parentNode) {
                    wrapper.parentNode.removeChild(wrapper);
                }
                activeParticles.delete(wrapper);
            }
        }
        galaxy.appendChild(wrapper);
        activeParticles.add(wrapper);
        requestAnimationFrame(animateParticle);
    };
    img.onerror = () => { /* Skip bad image */ wrapper.remove(); };  // Add error handle
}

// --- Create stars ---
function createStars() {
    // Clear old stars
    galaxy.innerHTML = '';
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const angle = Math.random() * Math.PI * 10;
        const radius = Math.random() * (isMobile ? 800 : 1500) + (isMobile ? 200 : 300);
        const spiralHeight = Math.sin(angle) * (isMobile ? 100 : 150);
        const x = Math.cos(angle) * radius;
        const y = spiralHeight + (Math.random() - 0.5) * (isMobile ? 1000 : 2000);
        const z = Math.sin(angle) * radius * 0.5;
        star.style.left = `calc(50% + ${x}px)`;
        star.style.top = `calc(50% + ${y}px)`;
        star.style.transform = `translateZ(${z}px)`;
        star.style.animationDelay = Math.random() * 3 + 's';
        const depthBrightness = Math.max(0.1, 1 - Math.abs(z) / (isMobile ? 800 : 1200));
        star.style.opacity = depthBrightness;
        galaxy.appendChild(star);
    }
}

// --- Galaxy transform ---
function updateGalaxyTransform() {
    requestAnimationFrame(() => {
        galaxy.style.transform = `translate(-50%, -50%) rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${scale})`;
    });
}

// --- Particle animation (fixed: pause when full) ---
function startParticleAnimation() {
    const mainInterval = setInterval(() => {
        if (heartAnimationStarted) return;
        // Pause tạo mới nếu full
        if (activeParticles.size < maxParticles) {
            if (galaxyData.images && galaxyData.images.length > 0 && Math.random() < 0.1) {
                createImageParticle();
            } else {
                createTextParticle();
            }
        }
    }, particleInterval);
    intervals.push(mainInterval);  // Cleanup later

    const initialParticles = isMobile ? 10 : 15;
    for (let i = 0; i < initialParticles; i++) {
        setTimeout(() => {
            if (activeParticles.size < maxParticles && !heartAnimationStarted) {
                if (galaxyData.images && galaxyData.images.length > 0 && Math.random() < 0.08) {
                    createImageParticle();
                } else {
                    createTextParticle();
                }
            }
        }, i * (particleInterval * 0.6));
    }

    galaxyAnimationId = setInterval(() => {
        if (!heartAnimationStarted && activeParticles.size < maxParticles) createTextParticle();
    }, particleInterval);
    intervals.push(galaxyAnimationId);
}

// Cleanup helper
function cleanupIntervals() {
    intervals.forEach(id => clearInterval(id));
    intervals = [];
}

// --- Mouse events (desktop) ---
document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('.help-dialog')) return;
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        // Giảm sensitivity để xoay mượt hơn
        const sensitivity = isMobile ? 0.12 : 0.10;
        rotationY += deltaX * sensitivity;
        rotationX -= deltaY * sensitivity;
        updateGalaxyTransform();
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
});
document.addEventListener('mouseup', () => { isDragging = false; });

// Thêm các biến này vào phần khai báo biến global
let initialDistance = 0;
let initialScale = 1;

// --- Touch events (mobile, fixed: throttle double-tap conflict) ---
let touchThrottle = false;  // Throttle helper
document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('.help-dialog')) {
        return;
    }
    e.preventDefault();
    
    if (e.touches.length === 1) {
        // Single touch - for dragging
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        // Two fingers - for zooming
        isDragging = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Calculate initial distance between two fingers
        initialDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        initialScale = scale;
        touchThrottle = true;  // Throttle to prevent double-tap
        setTimeout(() => { touchThrottle = false; }, 1000);  // 1s cooldown
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('.help-dialog')) {
        return;
    }
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
        // Single finger drag - rotate galaxy
        const deltaX = e.touches[0].clientX - lastMouseX;
        const deltaY = e.touches[0].clientY - lastMouseY;
        // Giảm sensitivity để xoay mượt hơn
        const sensitivity = 0.12;
        rotationY += deltaX * sensitivity;
        rotationX -= deltaY * sensitivity;
        updateGalaxyTransform();
        
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2 && !touchThrottle) {
        // Two fingers - zoom (throttle prevent conflict)
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // Calculate current distance
        const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        // Calculate scale change
        if (initialDistance > 0) {
            const scaleChange = currentDistance / initialDistance;
            scale = Math.max(0.3, Math.min(3, initialScale * scaleChange));
            updateGalaxyTransform();
            // Cập nhật thời gian zoom cuối cùng
            lastZoomTime = Date.now();
        }
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('.help-dialog')) {
        return;
    }
    e.preventDefault();
    
    // Reset dragging state
    isDragging = false;
    
    // Reset zoom variables if no touches remain
    if (e.touches.length === 0) {
        initialDistance = 0;
        initialScale = scale;
    }
}, { passive: false });

// --- Orientation change ---
window.addEventListener('orientationchange', () => {
    setTimeout(() => { 
        updateResponsive();  // Update responsive
        createStars();  // Recreate stars
        location.reload();  // Hard reload if needed
    }, 100);
});

// --- Heart transition ---
function transitionToHeart() {
    heartAnimationStarted = true;
    cleanupIntervals();  // Cleanup particles

    const fallingImages = document.querySelectorAll('.falling-image');
    fallingImages.forEach(img => {
        img.style.transition = 'opacity 1.5s';
        img.style.opacity = '0';
    });
    const particles = document.querySelectorAll('.text-particle');
    particles.forEach(el => {
        el.style.transition = 'opacity 1.5s';
        el.style.opacity = '0';
    });
    activeParticles.clear();  // Clear set

    setTimeout(() => {
        heartContainer.classList.add('active');
        initializeHeartAnimation();
    }, 1500);
}

// --- Heart animation (unchanged, but responsive size) ---
function initializeHeartAnimation() {
    const canvas = document.getElementById('pinkboard');
    const settings = {
        particles: {
            length: isMobile ? 5000 : 10000,
            duration: 4,
            velocity: isMobile ? 50 : 80,
            effect: -1.3,
            size: isMobile ? 6 : 8,
        },
    };
    // ... (giữ nguyên full heart particle code của bạn – hardcoded OK, nhưng scale canvas responsive)
    canvas.width = heartContainer.clientWidth;
    canvas.height = heartContainer.clientHeight;
    // Rest of the code unchanged...
    (function () { var b = 0; var c = ["ms", "moz", "webkit", "o"]; for (var a = 0; a < c.length && !window.requestAnimationFrame; ++a) { window.requestAnimationFrame = window[c[a] + "RequestAnimationFrame"]; window.cancelAnimationFrame = window[c[a] + "CancelAnimationFrame"] || window[c[a] + "CancelRequestAnimationFrame"] } if (!window.requestAnimationFrame) { window.requestAnimationFrame = function (h, e) { var d = new Date().getTime(); var f = Math.max(0, 16 - (d - b)); var g = window.setTimeout(function () { h(d + f) }, f); b = d + f; return g } } if (!window.cancelAnimationFrame) { window.cancelAnimationFrame = function (d) { clearTimeout(d) } } }());
    // ... (Point, Particle, ParticlePool classes unchanged)
    // Render function unchanged, but call onResize()
    function onResize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    window.addEventListener('resize', onResize);
    setTimeout(() => {
        onResize();
        // Call render() from your original code
    }, 10);
}

// --- Initialize galaxy ---
function initializeGalaxy() {
    const heartTextDiv = document.getElementById('heartText');
    if (heartTextDiv) {
        heartTextDiv.textContent = galaxyData.textHeart || '';
    }

    createStars();
    startParticleAnimation();

    if (galaxyData.isHeart === true) {
        setTimeout(() => {
            if (document.getElementById('doubleClickTip')) return;
            const tip = document.createElement('div');
            tip.id = 'doubleClickTip';
            tip.className = 'double-click-tip';
            tip.textContent = 'click 2 lần vào màn hình nha💖';
            document.body.appendChild(tip);

            setTimeout(() => {
                if (document.body.contains(tip)) tip.remove();
            }, 3000);

            function handleDblClick(event) {
                if (event.target.tagName === 'BUTTON' || event.target.tagName === 'A' || event.target.closest('.help-dialog')) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                if (!heartAnimationStarted) {
                    tip.remove();
                    transitionToHeart();
                    window.removeEventListener('dblclick', handleDblClick);
                    window.removeEventListener('touchend', handleTouchDblTap);
                }
            }

            let lastTap = 0;
            function handleTouchDblTap(e) {
                // Kiểm tra nếu là thao tác nhiều ngón
                if (e.touches && e.touches.length > 1) {
                    lastTap = 0; // Reset lastTap nếu là thao tác nhiều ngón
                    return;
                }
                
                // Kiểm tra nếu vừa mới zoom xong (trong vòng 1 giây) – tăng threshold
                const now = Date.now();
                if (now - lastZoomTime < 1200) {  // Up from 1000ms
                    lastTap = 0;
                    return;
                }
                
                // Xử lý double tap bình thường
                if (now - lastTap < 800) {
                    handleDblClick(e);
                    lastTap = 0; // Reset để không bị trigger liên tục
                } else {
                    lastTap = now;
                }
            }

            window.addEventListener('dblclick', handleDblClick);
            window.addEventListener('touchend', handleTouchDblTap);
        }, 8000);
    }
}

// --- Auto-hide or skip help dialog ---
function hideHelpDialog() {
    const helpDialog = document.getElementById('helpDialog');
    const startButton = document.getElementById('startButton');
    if (helpDialog) {
        helpDialog.classList.add('hide');  // Use your CSS .hide { display: none !important; }
        helpDialog.style.display = 'none';  // Force hide
    }
    if (startButton) {
        startButton.style.display = 'none';  // Ẩn nút đóng luôn
    }
}

// Event listener cho nút đóng (nếu click, vẫn hide)
if (document.getElementById('startButton')) {
    document.getElementById('startButton').addEventListener('click', hideHelpDialog);
}

// Auto-hide sau 5s (hoặc ngay nếu demo/đã xem trước)
setTimeout(hideHelpDialog, 5000);  // 5 giây show rồi tắt
// Hoặc tắt ngay: hideHelpDialog();  // Uncomment nếu muốn tắt luôn

// Skip nếu localStorage flag (user đã xem)
if (localStorage.getItem('deargift_help_seen')) {
    hideHelpDialog();
} else {
    localStorage.setItem('deargift_help_seen', 'true');
}

// --- Init (fixed: await load) ---
async function initApp() {
    updateResponsive();  // Initial
    await loadGalaxyData();
    if (galaxyData) {
        initializeGalaxy();
        updateGalaxyTransform();  // Initial transform
    }
}
initApp();  // Call async init

// Cleanup on unload
window.addEventListener('beforeunload', cleanupIntervals);