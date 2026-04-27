var TOTAL_QUESTIONS = 10;
var TIME_LIMIT = 15;

var countries = [];
var currentAnswer = null;
var score = 0;
var qnum = 1;
var timerId = null;
var timeLeft = TIME_LIMIT;
var answered = false;

var flagImg = document.getElementById("flag-img");
var choicesEl = document.getElementById("choices");
var scoreEl = document.getElementById("score");
var qnumEl = document.getElementById("qnum");
var totalEl = document.getElementById("total");
var timerEl = document.getElementById("timer");
var resultEl = document.getElementById("result");
var nextBtn = document.getElementById("next");
var diffSelect = document.getElementById("difficulty");
var langSelect = document.getElementById("language");
var infoName = document.getElementById("info-name");
var infoCapital = document.getElementById("info-capital");
var infoPop = document.getElementById("info-pop");
var infoLang = document.getElementById("info-lang");
var confetti = document.getElementById("confetti");
var bestText = document.getElementById("best-text");

// GitHub Pages 用の相対パス
var COUNTRIES_JSON_PATH = "data/countries.json";
var FLAGS_DIR_PATH = "data/flags/";

totalEl.textContent = String(TOTAL_QUESTIONS);

function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i];
        a[i] = a[j];
        a[j] = t;
    }
    return a;
}

function difficultyOf(country) {
    var pop = country.population || 0;
    if (pop > 50000000) return "easy";
    if (pop > 10000000) return "normal";
    return "hard";
}

function nameInLang(country, langCode) {
    if (country.translations &&
        country.translations[langCode] &&
        country.translations[langCode].common) {
        return country.translations[langCode].common;
    }
    return country.name.common;
}

function languagesText(country) {
    if (!country.languages) return "不明";
    return Object.values(country.languages).join(", ");
}

function capitalText(country) {
    if (country.capital && country.capital.length > 0) return country.capital[0];
    return "不明";
}

function populationText(country) {
    if (!country.population) return "不明";
    return (country.population / 1000000).toFixed(1) + " 百万人";
}

function filteredCountries() {
    var diff = diffSelect.value;
    if (diff === "all") return countries;
    return countries.filter(c => c.difficulty === diff);
}

function showInfo(country) {
    var lang = langSelect.value;
    infoName.textContent = nameInLang(country, lang);
    infoCapital.textContent = capitalText(country);
    infoPop.textContent = populationText(country);
    infoLang.textContent = languagesText(country);
}

function getCountryByCode(code) {
    return countries.find(c => c.cca2 === code);
}

function nextQuestion() {
    answered = false;
    resultEl.textContent = "";
    nextBtn.disabled = true;
    choicesEl.innerHTML = "";
    infoName.textContent = "???";
    infoCapital.textContent = "???";
    infoPop.textContent = "???";
    infoLang.textContent = "???";

    var pool = filteredCountries();
    var correct = pool[Math.floor(Math.random() * pool.length)];
    currentAnswer = correct.cca2;

    flagImg.src = FLAGS_DIR_PATH + correct.cca2.toLowerCase() + ".png";

    var options = shuffle(pool).slice(0, 4);
    if (!options.includes(correct)) {
        options[0] = correct;
    }
    options = shuffle(options);

    var lang = langSelect.value;
    options.forEach(c => {
        var btn = document.createElement("div");
        btn.className = "choice";
        btn.textContent = nameInLang(c, lang);
        btn.dataset.code = c.cca2;
        btn.onclick = () => selectAnswer(btn, c.cca2);
        choicesEl.appendChild(btn);
    });

    startTimer(() => autoWrong());
}

function startTimer(onTimeout) {
    if (timerId) clearInterval(timerId);
    timeLeft = TIME_LIMIT;
    timerEl.textContent = timeLeft;
    timerId = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerId);
            onTimeout();
        }
    }, 1000);
}

function stopTimer() {
    if (timerId) clearInterval(timerId);
}

function autoWrong() {
    answered = true;
    document.querySelectorAll(".choice").forEach(btn => btn.style.pointerEvents = "none");
    resultEl.textContent = "時間切れ！";
    nextBtn.disabled = false;
}

function selectAnswer(btn, code) {
    if (answered) return;
    answered = true;
    stopTimer();

    var correct = getCountryByCode(currentAnswer);
    showInfo(correct);

    document.querySelectorAll(".choice").forEach(b => b.style.pointerEvents = "none");

    if (code === currentAnswer) {
        btn.classList.add("correct");
        score++;
        scoreEl.textContent = score;
        resultEl.textContent = "正解！";
    } else {
        btn.classList.add("wrong");
        resultEl.textContent = "不正解…";
    }

    nextBtn.disabled = false;
}

function initCountries(data) {
    countries = data.map(c => ({
        ...c,
        cca2: c.cca2.toUpperCase(),
        difficulty: difficultyOf(c)
    }));
    nextQuestion();
}

function loadCountries() {
    fetch(COUNTRIES_JSON_PATH)
        .then(res => res.json())
        .then(data => initCountries(data))
        .catch(err => {
            console.error(err);
            resultEl.textContent = "国データの読み込みに失敗しました。";
        });
}

window.onload = loadCountries;

