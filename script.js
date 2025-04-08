const pageContainer = document.getElementById("page-container");
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

// Загрузка главы из JSON
async function loadChapter(chapter) {
    pageContainer.innerHTML = "";
    try {
        const response = await fetch(`assets/chapters_data/${chapter}.json`);
        if (!response.ok) {
            throw new Error("JSON-файл не найден");
        }
        const pageUrls = await response.json(); // Массив ссылок из JSON
        totalPages = pageUrls.length;
        pages = pageUrls.map((url, index) => ({ url, index }));
        loadVerticalMode(pageUrls);
        updateChapterHighlight();
    } catch (error) {
        console.error(error);
        pageContainer.innerHTML = "<p>Ошибка загрузки главы. Проверьте JSON-файл!</p>";
    }
}

// Отображение страниц
function loadVerticalMode(pageUrls) {
    pageContainer.innerHTML = "";
    pageUrls.forEach((url, index) => {
        const img = document.createElement("img");
        img.src = url;
        img.alt = `Страница ${index + 1}`; // Нумерация для читаемости, не зависит от имени файла
        img.loading = "lazy"; // Ленивая загрузка
        img.onerror = () => {
            img.src = "assets/fallback-image.jpg"; // Запасное изображение при ошибке
            img.alt = "Изображение не загрузилось";
        };
        applyFrameSize(img);
        pageContainer.appendChild(img);
    });

    // Блок в конце главы
    const endMessage = document.createElement("div");
    endMessage.classList.add("end-message");
    endMessage.innerHTML = `
        <p>Спасибо за то, что прочитали эту главу</p>
        <div class="chapter-nav">
            <button id="prev-chapter">Прошлая глава</button>
            <button id="next-chapter">Следующая глава</button>
        </div>
    `;
    pageContainer.appendChild(endMessage);

    // Навигация между главами
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

// Применение размера фрейма
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

// Обновление прогресс-бара
function updateProgressVertical() {
    const scrollTop = pageContainer.scrollTop;
    const scrollHeight = pageContainer.scrollHeight - pageContainer.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Прокручено: ${Math.round(progress)}%`;
    toTopBtn.classList.toggle("visible", scrollTop > 300);
}

// Подсветка текущей главы
function updateChapterHighlight() {
    chapterLinks.forEach(link => {
        link.classList.remove("active");
        if (link.dataset.chapter === currentChapter) {
            link.classList.add("active");
        }
    });
}

// Плавная анимация скорости прокрутки
function animateScrollSpeed() {
    const diff = targetScrollSpeed - scrollSpeedValue;
    if (Math.abs(diff) > 0.1) {
        scrollSpeedValue += diff * 0.1;
        requestAnimationFrame(animateScrollSpeed);
    } else {
        scrollSpeedValue = targetScrollSpeed;
    }
}

// Навигация по главам через меню
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

// Изменение размера фрейма
frameSize.addEventListener("change", () => {
    loadChapter(currentChapter);
});

// Автопрокрутка
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

// Включение/выключение звуков
soundToggle.addEventListener("click", () => {
    soundsEnabled = !soundsEnabled;
    soundToggle.textContent = soundsEnabled ? "Включены" : "Выключены";
});

// К началу и к концу
toStartBtn.addEventListener("click", () => {
    pageContainer.scrollTo({ top: 0, behavior: "smooth" });
    if (soundsEnabled) clickSound.play();
});

toEndBtn.addEventListener("click", () => {
    pageContainer.scrollTo({ top: pageContainer.scrollHeight, behavior: "smooth" });
    if (soundsEnabled) clickSound.play();
});

// Полноэкранный режим
fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
    if (soundsEnabled) clickSound.play();
});

// Бургер-меню
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

// Прогресс-бар
progressBar.addEventListener("click", () => {
    progressBar.classList.toggle("hidden");
    if (soundsEnabled) clickSound.play();
});

// Кнопка "наверх"
toTopBtn.addEventListener("click", () => {
    pageContainer.scrollTo({ top: 0, behavior: "smooth" });
    if (soundsEnabled) clickSound.play();
});

// Загрузка при открытии страницы
window.addEventListener("load", () => {
    const hash = window.location.hash.slice(1) || "chapter1";
    currentChapter = hash;
    loadChapter(currentChapter);
});

// Обновление прогресса при прокрутке
pageContainer.addEventListener("scroll", () => {
    updateProgressVertical();
});