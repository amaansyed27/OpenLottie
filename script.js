class LottiePreview {
    constructor() {
        // Add theme related properties
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.initializeElements();
        this.setupEventListeners();
        this.initializeTheme();
        this.animation = null;
        this.isPlaying = false;
        this.isLooping = true;
        this.initializeStyles();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.browseButton = document.getElementById('browseButton');
        this.previewSection = document.getElementById('previewSection');
        this.lottiePreview = document.getElementById('lottiePreview');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.progressSlider = document.getElementById('progressSlider');
        this.loopBtn = document.getElementById('loopBtn');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.embedCode = document.getElementById('embedCode');
        this.copyBtn = document.getElementById('copyBtn');
        this.themeToggleBtn = document.getElementById('themeToggle');
    }

    setupEventListeners() {
        // File upload events
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Animation control events
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.loopBtn.addEventListener('click', () => this.toggleLoop());
        this.progressSlider.addEventListener('input', (e) => this.seekAnimation(e));

        // Tab events
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchPlatform(btn));
        });

        // Copy button event
        this.copyBtn.addEventListener('click', () => this.copyEmbedCode());

        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }


    nitializeTheme() {
        // Set initial theme
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
        
        // Check system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
            if (!localStorage.getItem('theme')) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        
        // Save theme preference
        localStorage.setItem('theme', this.currentTheme);
        
        // Add animation to theme toggle button
        this.themeToggleBtn.classList.add('rotate');
        setTimeout(() => {
            this.themeToggleBtn.classList.remove('rotate');
        }, 300);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
        
        // Update code editor theme if needed
        if (this.animation) {
            this.updateEmbedCode(this.animation.animationData);
        }
    }

    updateThemeIcon() {
        const icon = this.themeToggleBtn.querySelector('i');
        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-sun';
            this.themeToggleBtn.setAttribute('data-tooltip', 'Switch to Light Mode');
        } else {
            icon.className = 'fas fa-moon';
            this.themeToggleBtn.setAttribute('data-tooltip', 'Switch to Dark Mode');
        }
    }

    // Add these CSS styles for the theme toggle animation
    initializeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .rotate {
                animation: rotate-icon 0.3s ease-in-out;
            }
            
            @keyframes rotate-icon {
                0% { transform: rotate(0); }
                100% { transform: rotate(360deg); }
            }
            
            .theme-toggle button {
                position: relative;
                overflow: hidden;
            }
            
            .theme-toggle button::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(99, 102, 241, 0.2);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
            }
            
            .theme-toggle button:active::after {
                width: 150%;
                height: 150%;
            }
        `;
        document.head.appendChild(style);
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/json') {
            this.loadLottieFile(file);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadLottieFile(file);
        }
    }

    // Update the loadLottieFile method to consider theme
    loadLottieFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const animationData = JSON.parse(e.target.result);
                this.initializeLottieAnimation(animationData);
                this.previewSection.style.display = 'block';
                this.updateEmbedCode(animationData);
                
                // Add smooth fade-in animation
                this.previewSection.style.opacity = '0';
                requestAnimationFrame(() => {
                    this.previewSection.style.transition = 'opacity 0.3s ease-in-out';
                    this.previewSection.style.opacity = '1';
                });
            } catch (error) {
                this.showError('Invalid Lottie JSON file');
            }
        };
        reader.readAsText(file);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Style for error message
        errorDiv.style.cssText = `
            background-color: ${this.currentTheme === 'dark' ? '#dc2626' : '#ef4444'};
            color: white;
            padding: 1rem;
            border-radius: var(--radius);
            margin-top: 1rem;
            text-align: center;
            animation: slideIn 0.3s ease-out;
        `;
        
        this.dropZone.parentNode.insertBefore(errorDiv, this.dropZone.nextSibling);
        
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }

    initializeLottieAnimation(animationData) {
        if (this.animation) {
            this.animation.destroy();
        }

        this.animation = lottie.loadAnimation({
            container: this.lottiePreview,
            renderer: 'svg',
            loop: this.isLooping,
            autoplay: true,
            animationData: animationData
        });

        this.animation.addEventListener('enterFrame', () => {
            const progress = (this.animation.currentFrame / this.animation.totalFrames) * 100;
            this.progressSlider.value = progress;
        });

        this.isPlaying = true;
        this.updatePlayPauseButton();
    }

    togglePlayPause() {
        if (this.animation) {
            if (this.isPlaying) {
                this.animation.pause();
            } else {
                this.animation.play();
            }
            this.isPlaying = !this.isPlaying;
            this.updatePlayPauseButton();
        }
    }

    toggleLoop() {
        if (this.animation) {
            this.isLooping = !this.isLooping;
            this.animation.loop = this.isLooping;
            this.loopBtn.classList.toggle('active');
        }
    }

    seekAnimation(e) {
        if (this.animation) {
            const frame = (e.target.value / 100) * this.animation.totalFrames;
            this.animation.goToAndStop(frame, true);
            this.isPlaying = false;
            this.updatePlayPauseButton();
        }
    }

    updatePlayPauseButton() {
        this.playPauseBtn.innerHTML = this.isPlaying ? 
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' :
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }

    switchPlatform(btn) {
        // Remove active class from all buttons
        this.tabButtons.forEach(button => button.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Update embed code
        if (this.animation) {
            this.updateEmbedCode(this.animation.animationData);
        }
    }

    getActiveFramework() {
        const activeTab = document.querySelector('.tab-btn.active');
        return activeTab ? activeTab.getAttribute('data-platform') : 'web';
    }

    updateEmbedCode(animationData) {
        const framework = this.getActiveFramework();
        const jsonString = JSON.stringify(animationData);
        const encodedData = btoa(jsonString);
        
        const embedCodes = {
            'web': `
<!-- Add Lottie player script -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>

<!-- Container for animation -->
<div id="lottie-container"></div>

<script>
    const animation = lottie.loadAnimation({
        container: document.getElementById('lottie-container'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: JSON.parse(atob('${encodedData}'))
    });
</script>`,

            'android-compose': `
// Add dependency in build.gradle
// implementation "com.airbnb.android:lottie-compose:6.1.0"

@Composable
fun LottieAnimation() {
    val composition by rememberLottieComposition(
        LottieCompositionSpec.JsonString("""${jsonString}""")
    )
    val progress by animateLottieCompositionAsState(
        composition = composition,
        iterations = LottieConstants.IterateForever
    )
    
    LottieAnimation(
        composition = composition,
        progress = { progress }
    )
}`,

            'android-xml': `
<!-- Add dependency in build.gradle -->
<!-- implementation 'com.airbnb.android:lottie:6.1.0' -->

<!-- Layout XML -->
<com.airbnb.lottie.LottieAnimationView
    android:id="@+id/animationView"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    app:lottie_rawRes="@raw/animation"
    app:lottie_autoPlay="true"
    app:lottie_loop="true"/>

// Kotlin/Java code
val animationView = findViewById<LottieAnimationView>(R.id.animationView)
animationView.setAnimationFromJson("""${jsonString}""", "animation")`,

            'ios': `
// Add pod 'lottie-ios' to Podfile

import Lottie

let animationView = LottieAnimationView()
animationView.animation = .from(json: """${jsonString}""")
animationView.loopMode = .loop
animationView.play()

// Add to view
view.addSubview(animationView)
animationView.frame = view.bounds`,

            'flutter': `
// Add dependency in pubspec.yaml
// lottie: ^2.6.0

import 'package:lottie/lottie.dart';

Lottie.memory(
    base64Decode('${encodedData}'),
    animate: true,
    repeat: true,
    fit: BoxFit.contain,
)`,

            'react-native': `
// Install lottie-react-native
// npm install lottie-react-native

import LottieView from 'lottie-react-native';

<LottieView
    source={{
        animationData: ${jsonString}
    }}
    autoPlay
    loop
    style={{ width: 200, height: 200 }}
/>`,

            'react': `
// Install lottie-react
// npm install lottie-react

import Lottie from 'lottie-react';

const animationData = ${jsonString};

function Animation() {
    return (
        <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
        />
    );
}`
        };

        this.embedCode.textContent = embedCodes[framework] || embedCodes['web'];
    }

    async copyEmbedCode() {
        try {
            await navigator.clipboard.writeText(this.embedCode.textContent);
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = 'Copy Code';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            this.copyBtn.textContent = 'Failed to copy';
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new LottiePreview();
});
