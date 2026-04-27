
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

function spawnConfetti() {
    for (var i = 0; i < 40; i++) {
        var e = document.createElement("div");
        e.className = "c";
        e.style.left = (Math.random() * 100) + "vw";
        var colors = ["#f97316","#22c55e","#3b82f6","#eab308","#ec4899"];
        e.style.background = colors[Math.floor(Math.random()*colors.length)];
        e.style.animationDelay = (Math.random()*0.3) + "s";
        confetti.appendChild(e);
        (function(el){
            setTimeout(function(){ el.remove(); }, 1500);
        })(e);
    }
}

function difficultyOf(country) {
    var pop = country.population || 0;
    if (pop > 50000000) return "easy";
    if (pop > 10000000) return "normal";
    return "hard";
}

function nameInLang(country, langCode) {
    if (country.translations && country.translations[langCode] && country.translations[langCode].common) {
        return country.translations[langCode].common;
    }
    if (country.name && country.name.common) return country.name.common;
    return country.cca2 || "?";
}

function languagesText(country) {
    if (!country.languages) return "不明";
    var keys = Object.keys(country.languages);
    var out = [];
    for (var i=0;i<keys.length;i++) out.push(country.languages[keys[i]]);
    return out.join(", ");
}

function capitalText(country) {
    if (country.capital && country.capital.length > 0) return country.capital[0];
    return "不明";
}

function populationText(country) {
    if (!country.population) return "不明";
    var m = country.population / 1000000;
    return m.toFixed(1) + " 百万人(目安)";
}

function filteredCountries() {
    var diff = diffSelect.value;
    if (diff === "all") return countries;
    var out = [];
    for (var i=0;i<countries.length;i++) {
        if (countries[i].difficulty === diff) out.push(countries[i]);
    }
    return out;
}

function startTimer(onTimeout) {
    if (timerId) clearInterval(timerId);
    timeLeft = TIME_LIMIT;
    timerEl.textContent = String(timeLeft);
    timerId = setInterval(function(){
        timeLeft--;
        timerEl.textContent = String(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            onTimeout();
        }
    }, 1000);
}

function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function showInfo(country) {
    var lang = langSelect.value;
    infoName.textContent = nameInLang(country, lang);
    infoCapital.textContent = capitalText(country);
    infoPop.textContent = populationText(country);
    infoLang.textContent = languagesText(country);
}

function getCountryByCode(code) {
    for (var i=0;i<countries.length;i++) {
        if (countries[i].cca2 === code) return countries[i];
    }
    return null;
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
    if (pool.length === 0) {
        resultEl.textContent = "この難易度では出題できる国がありません。";
        return;
    }

    var correct = pool[Math.floor(Math.random()*pool.length)];
    currentAnswer = correct.cca2;

    var codeLower = (correct.cca2 || "").toLowerCase();
    flagImg.src = "https://flagcdn.com/w320/" + codeLower + ".png";

    var options = [correct];
    var shuffledPool = shuffle(pool);
    for (var i=0;i<shuffledPool.length && options.length<4;i++) {
        if (shuffledPool[i].cca2 !== correct.cca2) options.push(shuffledPool[i]);
    }
    options = shuffle(options);

    var lang = langSelect.value;
    for (var j=0;j<options.length;j++) {
        var c = options[j];
        var btn = document.createElement("div");
        btn.className = "choice";
        btn.textContent = nameInLang(c, lang);
        btn.setAttribute("data-code", c.cca2);
        (function(button, code){
            button.onclick = function(){ selectAnswer(button, code); };
        })(btn, c.cca2);
        choicesEl.appendChild(btn);
    }

    startTimer(function(){
        if (!answered) autoWrong();
    });
}
function autoWrong() {
    answered = true;
    var buttons = document.querySelectorAll(".choice");
    for (var i=0;i<buttons.length;i++) buttons[i].style.pointerEvents = "none";
    var correct = getCountryByCode(currentAnswer);
    if (correct) {
        var lang = langSelect.value;
        var correctName = nameInLang(correct, lang);
        for (var j=0;j<buttons.length;j++) {
            if (buttons[j].textContent === correctName) buttons[j].classList.add("correct");
        }
    }
    resultEl.textContent = "時間切れ！";
    nextBtn.disabled = false;
}

function selectAnswer(btn, code) {
    if (answered) return;
    answered = true;
    stopTimer();

    var correct = getCountryByCode(currentAnswer);
    if (correct) showInfo(correct);

    var buttons = document.querySelectorAll(".choice");
    for (var i=0;i<buttons.length;i++) buttons[i].style.pointerEvents = "none";

    if (code === currentAnswer) {
        btn.classList.add("correct");
        score++;
        scoreEl.textContent = String(score);
        resultEl.textContent = "正解！";
        spawnConfetti();
    } else {
        btn.classList.add("wrong");
        if (correct) {
            var lang = langSelect.value;
            var correctName = nameInLang(correct, lang);
            for (var j=0;j<buttons.length;j++) {
                if (buttons[j].textContent === correctName) {
                    buttons[j].classList.add("correct");
                }
            }
            resultEl.textContent = "不正解… 正解は「" + correctName + "」";
        } else {
            resultEl.textContent = "不正解";
        }
    }

    nextBtn.disabled = false;
}

function updateBest(score, correctRate) {
    var key = "flagQuizBestAllWorld";
    var current = null;
    try {
        current = JSON.parse(localStorage.getItem(key) || "null");
    } catch(e) {
        current = null;
    }
    if (!current || score > current.score || (score === current.score && correctRate > current.correctRate)) {
        var data = { score: score, correctRate: correctRate };
        localStorage.setItem(key, JSON.stringify(data));
        renderBest();
    }
}

function renderBest() {
    var key = "flagQuizBestAllWorld";
    var current = null;
    try {
        current = JSON.parse(localStorage.getItem(key) || "null");
    } catch(e) {
        current = null;
    }
    if (!current) {
        bestText.textContent = "まだ記録がありません";
    } else {
        var pct = (current.correctRate * 100).toFixed(1);
        bestText.textContent = "スコア: " + current.score + " / " + TOTAL_QUESTIONS + "（正答率: " + pct + "%）";
    }
}

function finishGame() {
    var correctRate = score / TOTAL_QUESTIONS;
    var pct = (correctRate * 100).toFixed(1);
    resultEl.textContent = "終了！ スコア: " + score + " / " + TOTAL_QUESTIONS + "（正答率: " + pct + "%）";
    updateBest(score, correctRate);
    nextBtn.textContent = "もう一度遊ぶ";
    nextBtn.disabled = false;
    nextBtn.onclick = function() {
        resetGame();
        nextBtn.onclick = function() {
            qnum++;
            if (qnum > TOTAL_QUESTIONS) {
                finishGame();
            } else {
                qnumEl.textContent = String(qnum);
                nextQuestion();
            }
        };
    };
}

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

nextBtn.addEventListener("click", function() {
    qnum++;
    if (qnum > TOTAL_QUESTIONS) {
        finishGame();
    } else {
        qnumEl.textContent = String(qnum);
        nextQuestion();
    }
});

diffSelect.addEventListener("change", function() {
    resetGame();
});

langSelect.addEventListener("change", function() {
    var lang = langSelect.value;
    var buttons = document.querySelectorAll(".choice");
    for (var i=0;i<buttons.length;i++) {
        var code = buttons[i].getAttribute("data-code");
        var c = getCountryByCode(code);
        if (c) buttons[i].textContent = nameInLang(c, lang);
    }
    var current = getCountryByCode(currentAnswer);
    if (current && answered) showInfo(current);
});

function initCountries(data) {
    countries = [];
    for (var i=0;i<data.length;i++) {
        var c = data[i];
        if (!c.cca2) continue;
        c.cca2 = c.cca2.toUpperCase();
        c.difficulty = difficultyOf(c);
        countries.push(c);
    }
    renderBest();
    nextQuestion();
}

function loadCountries() {
    fetch("https://restcountries.com/v3.1/all")
        .then(function(res){ return res.json(); })
        .then(function(data){ initCountries(data); })
        .catch(function(err){
            console.error(err);
            resultEl.textContent = "国データの取得に失敗しました。ネットワークを確認してください。";
        });
}

window.addEventListener("load", function() {
    loadCountries();
});

