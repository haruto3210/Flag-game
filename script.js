// ===============================
// 設定
// ===============================
const TOTAL_QUESTIONS = 10;
const TIME_LIMIT = 15;

const COUNTRIES_JSON_PATH = "data/countries.json";
const FLAGS_DIR_PATH = "data/flags/";

// ===============================
// 変数
// ===============================
let countries = [];
let currentAnswer = null;
let score = 0;
let qnum = 1;
let timerId = null;
let timeLeft = TIME_LIMIT;
let answered = false;

// ===============================
// DOM
// ===============================
const flagImg = document.getElementById("flag-img");
const choicesEl = document.getElementById("choices");
const scoreEl = document.getElementById("score");
const qnumEl = document.getElementById("qnum");
const totalEl = document.getElementById("total");
const timerEl = document.getElementById("timer");
const resultEl = document.getElementById("result");
const nextBtn = document.getElementById("next");
const diffSelect = document.getElementById("difficulty");
const langSelect = document.getElementById("language");
const infoName = document.getElementById("info-name");
const infoCapital = document.getElementById("info-capital");
const infoPop = document.getElementById("info-pop");
const infoLang = document.getElementById("info-lang");

// ===============================
// 初期表示
// ===============================
totalEl.textContent = TOTAL_QUESTIONS;

// ===============================
// ユーティリティ
// ===============================
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function difficultyOf(country) {
    const pop = country.population || 0;
    if (pop > 50000000) return "easy";
    if (pop > 10000000) return "normal";
    return "hard";
}

function nameInLang(country, lang) {
    if (country.translations?.[lang]?.common) {
        return country.translations[lang].common;
    }
    return country.name.common;
}

function languagesText(country) {
    if (!country.languages) return "不明";
    return Object.values(country.languages).join(", ");
}

function capitalText(country) {
    return country.capital?.[0] || "不明";
}

function populationText(country) {
    if (!country.population) return "不明";
    return (country.population / 1_000_000).toFixed(1) + " 百万人";
}

function filteredCountries() {
    const diff = diffSelect.value;
    if (diff === "all") return countries;
    return countries.filter(c => c.difficulty === diff);
}

function getCountryByCode(code) {
    return countries.find(c => c.cca2 === code);
}

// ===============================
// タイマー
// ===============================
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

// ===============================
// 問題生成
// ===============================
function nextQuestion() {
    answered = false;
    resultEl.textContent = "";
    nextBtn.disabled = true;
    choicesEl.innerHTML = "";
    infoName.textContent = "???";
    infoCapital.textContent = "???";
    infoPop.textContent = "???";
    infoLang.textContent = "???";

    const pool = filteredCountries();
    const correct = pool[Math.floor(Math.random() * pool.length)];
    currentAnswer = correct.cca2;

    // 国旗
    flagImg.src = FLAGS_DIR_PATH + correct.cca2.toLowerCase() + ".png";

    // 選択肢
    let options = shuffle(pool).slice(0, 4);
    if (!options.includes(correct)) options[0] = correct;
    options = shuffle(options);

    const lang = langSelect.value;
    options.forEach(c => {
        const btn = document.createElement("div");
        btn.className = "choice";
        btn.textContent = nameInLang(c, lang);
        btn.dataset.code = c.cca2;
        btn.addEventListener("click", () => selectAnswer(btn, c.cca2));
        choicesEl.appendChild(btn);
    });

    startTimer(() => autoWrong());
}

function autoWrong() {
    answered = true;
    document.querySelectorAll(".choice").forEach(btn => btn.style.pointerEvents = "none");
    resultEl.textContent = "時間切れ！";
    nextBtn.disabled = false;
}

// ===============================
// 回答処理
// ===============================
function selectAnswer(btn, code) {
    if (answered) return;
    answered = true;
    stopTimer();

    const correct = getCountryByCode(currentAnswer);
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

function showInfo(country) {
    const lang = langSelect.value;
    infoName.textContent = nameInLang(country, lang);
    infoCapital.textContent = capitalText(country);
    infoPop.textContent = populationText(country);
    infoLang.textContent = languagesText(country);
}

// ===============================
// ゲーム終了
// ===============================
function finishGame() {
    const rate = score / TOTAL_QUESTIONS;
    const pct = (rate * 100).toFixed(1);

    resultEl.textContent = `終了！ スコア: ${score} / ${TOTAL_QUESTIONS}（正答率: ${pct}%）`;

    nextBtn.textContent = "もう一度遊ぶ";
    nextBtn.disabled = false;

    nextBtn.replaceWith(nextBtn.cloneNode(true));
    const newBtn = document.getElementById("next");
    newBtn.addEventListener("click", resetGame, { once: true });
}

// ===============================
// リセット
// ===============================
function resetGame() {
    stopTimer();
    score = 0;
    qnum = 1;
    scoreEl.textContent = "0";
    qnumEl.textContent = "1";
    nextBtn.textContent = "次の問題へ";
    nextBtn.disabled = true;
    nextQuestion();
}

// ===============================
// 次の問題へ（安定版）
// ===============================
nextBtn.addEventListener("click", () => {
    if (!answered) return;

    qnum++;
    if (qnum > TOTAL_QUESTIONS) {
        finishGame();
        return;
    }

    qnumEl.textContent = qnum;
    nextQuestion();
});

// ===============================
// 言語変更
// ===============================
langSelect.addEventListener("change", () => {
    const lang = langSelect.value;

    document.querySelectorAll(".choice").forEach(btn => {
        const code = btn.dataset.code;
        const c = getCountryByCode(code);
        btn.textContent = nameInLang(c, lang);
    });

    if (answered) {
        const c = getCountryByCode(currentAnswer);
        showInfo(c);
    }
});

// ===============================
// 国データ読み込み
// ===============================
function loadCountries() {
    fetch(COUNTRIES_JSON_PATH)
        .then(res => res.json())
        .then(data => {
            countries = data.map(c => ({
                ...c,
                cca2: c.cca2.toUpperCase(),
                difficulty: difficultyOf(c)
            }));
            nextQuestion();
        })
        .catch(err => {
            console.error(err);
            resultEl.textContent = "国データの読み込みに失敗しました。";
        });
}

window.onload = loadCountries;
