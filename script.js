const pageContainer = document.getElementById("page-container");
const reader = document.getElementById("reader");
const chapterLinks = document.querySelectorAll("#chapter-list a");
const frameSize = document.getElementById("frame-size");
const autoScrollBtn = document.getElementById("auto-scroll");
const scrollSpeed = document.getElementById("scroll-speed");
const soundToggle = document.getElementById("sound-toggle");
const toStartBtn = document.getElementById("to-start");
const toEndBtn = document.getElementById("to-end");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const pageFlipSound = document.getElementById("page-flip-sound");
const clickSound = document.getElementById("click-sound");
const burgerBtn = document.getElementById("burger-btn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const toTopBtn = document.getElementById("to-top-btn");

let currentChapter = "chapter1";
let totalPages = null;
let autoScrollActive = false;
let soundsEnabled = true;
let scrollSpeedValue = 1;
let targetScrollSpeed = 1;
let pages = [];

function loadChapter(chapter) {
    pageContainer.innerHTML = "";
    totalPages = null;
    pages = [];
    determineTotalPages(chapter, () => {
        if (pages.length === 0) {
            console.error(`No pages found for chapter: ${chapter}`);
            pageContainer.innerHTML = "<p>Страницы не найдены. Проверьте наличие файлов в папке assets/chapters.</p>";
            return;
        }
        loadVerticalMode(chapter);
        updateChapterHighlight();
    });
}

function determineTotalPages(chapter, callback) {
    let pageCount = 1;
    const formats = ['jpg', 'png'];

    const checkNextPage = () => {
        let found = false;
        const pageNames = [pageCount.toString(), pageCount.toString().padStart(2, '0')];

        const tryFormat = (formatIndex) => {
            if (formatIndex >= formats.length) {
                if (!found) {
                    totalPages = pages.length;
                    callback();
                }
                return;
            }

            const format = formats[formatIndex];
            let formatFound = false;

            const tryName = (nameIndex) => {
                if (nameIndex >= pageNames.length) {
                    if (!formatFound) {
                        tryFormat(formatIndex + 1);
                    }
                    return;
                }

                const pageName = pageNames[nameIndex];
                const img = new Image();
                img.src = `assets/chapters/${chapter}/${pageName}.${format}`;
                img.onload = () => {
                    formatFound = true;
                    found = true;
                    if (!pages.some(page => page.name === pageName)) {
                        pages.push({ name: pageName, format: format });
                    }
                    pageCount++;
                    checkNextPage();
                };
                img.onerror = () => {
                    tryName(nameIndex + 1);
                };
            };

            tryName(0);
        };

        tryFormat(0);
    };

    checkNextPage();
}

function loadVerticalMode(chapter) {
    pages.sort((a, b) => parseInt(a.name) - parseInt(b.name));

    pages.forEach(page => {
        const img = document.createElement("img");
        img.src = `assets/chapters/${chapter}/${page.name}.${page.format}`;
        img.alt = `Страница ${page.name}`;
        img.loading = "lazy";
        applyFrameSize(img);
        pageContainer.appendChild(img);
    });

    const endMessage = document.createElement("div");
    endMessage.classList.add("end-message");
    endMessage.innerHTML = `
        <p>Спасибо за то, что прочитали раннюю главу</p>
        <div class="chapter-nav">
            <button id="prev-chapter">Прошлая глава</button>
            <button id="next-chapter">Следующая глава</button>
        </div>
    `;
    pageContainer.appendChild(endMessage);

    const prevChapterBtn = document.getElementById("prev-chapter");
    const nextChapterBtn = document.getElementById("next-chapter");

    const chapters = Array.from(chapterLinks).map(link => link.dataset.chapter);
    const currentIndex = chapters.indexOf(currentChapter);

    prevChapterBtn.disabled = currentIndex === 0;
    nextChapterBtn.disabled = currentIndex === chapters.length - 1;

    prevChapterBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentChapter = chapters[currentIndex - 1];
            loadChapter(currentChapter);
            window.location.hash = currentChapter;
            if (soundsEnabled) clickSound.play();
        }
    });

    nextChapterBtn.addEventListener("click", () => {
        if (currentIndex < chapters.length - 1) {
            currentChapter = chapters[currentIndex + 1];
            loadChapter(currentChapter);
            window.location.hash = currentChapter;
            if (soundsEnabled) clickSound.play();
        }
    });

    updateProgressVertical();
}

function applyFrameSize(img) {
    const size = frameSize.value;
    if (size === "auto") {
        img.style.maxWidth = "90%";
        img.style.maxHeight = "auto";
    } else if (size === "full") {
        img.style.maxWidth = "100%";
        img.style.maxHeight = "none";
    } else if (size === "compact") {
        img.style.maxWidth = "60%";
        img.style.maxHeight = "auto";
    }
}

function updateProgressVertical() {
    const scrollTop = pageContainer.scrollTop;
    const scrollHeight = pageContainer.scrollHeight - pageContainer.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Прокручено: ${Math.round(progress)}%`;
    toTopBtn.classList.toggle("visible", scrollTop > 300);
}

function updateChapterHighlight() {
    chapterLinks.forEach(link => {
        link.classList.remove("active");
        if (link.dataset.chapter === currentChapter) {
            link.classList.add("active");
        }
    });
}

function animateScrollSpeed() {
    const diff = targetScrollSpeed - scrollSpeedValue;
    if (Math.abs(diff) > 0.1) {
        scrollSpeedValue += diff * 0.1;
        requestAnimationFrame(animateScrollSpeed);
    } else {
        scrollSpeedValue = targetScrollSpeed;
    }
}

chapterLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        currentChapter = link.dataset.chapter;
        loadChapter(currentChapter);
        window.location.hash = currentChapter;
        if (soundsEnabled) clickSound.play();
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    });
});

frameSize.addEventListener("change", () => {
    loadChapter(currentChapter);
});

autoScrollBtn.addEventListener("click", () => {
    if (autoScrollActive) {
        autoScrollActive = false;
        autoScrollBtn.textContent = "Вкл/Выкл";
    } else {
        autoScrollActive = true;
        autoScrollBtn.textContent = "Остановить";
        smoothScroll();
    }
});

scrollSpeed.addEventListener("input", () => {
    targetScrollSpeed = parseInt(scrollSpeed.value);
    animateScrollSpeed();
});

function smoothScroll() {
    if (!autoScrollActive) return;
    pageContainer.scrollTop += scrollSpeedValue;
    updateProgressVertical();
    if (pageContainer.scrollTop + pageContainer.clientHeight < pageContainer.scrollHeight) {
        requestAnimationFrame(smoothScroll);
    } else {
        autoScrollActive = false;
        autoScrollBtn.textContent = "Вкл/Выкл";
    }
}

soundToggle.addEventListener("click", () => {
    soundsEnabled = !soundsEnabled;
    soundToggle.textContent = soundsEnabled ? "Включены" : "Выключены";
});

toStartBtn.addEventListener("click", () => {
    pageContainer.scrollTo({ top: 0, behavior: "smooth" });
    if (soundsEnabled) clickSound.play();
});

toEndBtn.addEventListener("click", () => {
    pageContainer.scrollTo({ top: pageContainer.scrollHeight, behavior: "smooth" });
    if (soundsEnabled) clickSound.play();
});

fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
    if (soundsEnabled) clickSound.play();
});

burgerBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
    if (soundsEnabled) clickSound.play();
});

overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    if (soundsEnabled) clickSound.play();
});

progressBar.addEventListener("click", () => {
    progressBar.classList.toggle("hidden");
    if (soundsEnabled) clickSound.play();
});

toTopBtn.addEventListener("click", () => {
    pageContainer.scrollTo({ top: 0, behavior: "smooth" });
    if (soundsEnabled) clickSound.play();
});

const hammer = new Hammer(reader);
hammer.on("swipeleft", () => {
    const chapters = Array.from(chapterLinks).map(link => link.dataset.chapter);
    const currentIndex = chapters.indexOf(currentChapter);
    if (currentIndex < chapters.length - 1) {
        currentChapter = chapters[currentIndex + 1];
        loadChapter(currentChapter);
        window.location.hash = currentChapter;
        if (soundsEnabled) clickSound.play();
    }
});

hammer.on("swiperight", () => {
    const chapters = Array.from(chapterLinks).map(link => link.dataset.chapter);
    const currentIndex = chapters.indexOf(currentChapter);
    if (currentIndex > 0) {
        currentChapter = chapters[currentIndex - 1];
        loadChapter(currentChapter);
        window.location.hash = currentChapter;
        if (soundsEnabled) clickSound.play();
    }
});

window.addEventListener("load", () => {
    const hash = window.location.hash.slice(1) || "chapter1";
    currentChapter = hash;
    loadChapter(currentChapter);
});

pageContainer.addEventListener("scroll", () => {
    updateProgressVertical();
});
