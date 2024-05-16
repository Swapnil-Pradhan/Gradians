const [fileElm, mainForm, mic, imgContainer, ansSubmit, ttsBtn, reply, load, marks, subject, grade, cSubject, sign, off] = ["qna", "mainForm", "mic", "img", "ansSubmit", "tts", "response", "loading", "marks", "subject", "grade", "cSubject", "sign", "offline"].map(id => document.getElementById(id)),
    synth = window.speechSynthesis, textarea = document.getElementsByTagName("textarea")[0],
    timeAgo = t => ((u = ['yr', 'mo', 'wk', 'dy', 'hr', 'min', 'sec'], d = [31536e6, 2592e6, 6048e5, 864e5, 36e5, 6e4, 1e3], i = u.findIndex((_, i) => (n = (Date.now() - t) / d[i]) >= 1), i >= 0) ? `${Math.floor(n)} ${u[i]}${Math.floor(n) !== 1 ? "s" : ""}` : 'Now');

window.ononline = () => off.style.display = "none";
window.onoffline = () => off.style.display = "flex";

var fileList = [], MODEL, PROMPT, recActive = false, tts = false, PROMPT, rec,
    generationConfig = {};

function imgFiles(e) {
    ansSubmit.innerHTML = "▶️";
    ansSubmit.setAttribute("tip", "Send");
    imgContainer.innerHTML = null;
    textarea.rows = 9;
    fileList = e.target.files; console.log(fileList.length);
    let size = 0;
    for (const file of fileList) {
        console.log(qna.value)
        size += file.size;
        const img = document.createElement("span");
        img.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
        img.innerText = file.name;
        img.classList.add("inputPic");
        document.getElementById("img").appendChild(img);
    }

    if (fileList.length > 2 || size > 4089446.69) {
        fileList.length > 2 ? alert("Don't select more than 2 files.") : alert("Select image file(s) with max size of 4MB.");
        fileElm.value = ""; imgContainer.innerHTML = null;
    } else {
        textarea.rows = 1;
        ansSubmit.classList.remove("scale0");
    }
}

function setting(x) {
    const dialog = document.getElementsByTagName("dialog")[0], blur = document.getElementById("blurscreen");
    if (x) {
        location.href.split("?")[1] === "settings" ? location.href = "handwriting.htm" : null;
        dialog.close();
        blur.classList.remove("open");
    } else {
        dialog.show();
        blur.classList.add("open");
    }
} location.href.split("?")[1] === "settings" ? setting(false) : null;

function stt() {
    if (recActive) {
        rec.abort();
        recActive = false;
        mic.classList.remove("glow");
        mic.style.animation = null;
        return;
    } else {
        rec = new webkitSpeechRecognition();
        rec.continuous = true;
        rec.lang = "en-IN";
        rec.onaudiostart = () => {
            textarea.placeholder = "Listening...";
            mic.style.animation = "on 1s infinite alternate";
            recActive = true;
            mic.classList.add("glow");
        }
        rec.start();
    }
    rec.onnomatch = () => alert("Your audio wasn't clear 🫤");
    rec.onend = () => textarea.placeholder = "Enter your report...";

    rec.onerror = e => {
        switch (e.error) {
            case "aborted": break;
            case "not-allowed": alert("Permission to use microphone was denied."); break
            case "no-speech": alert("Say something!"); break
            case "network": alert("No Internet"); break
            default: alert(`${e.error}: ${e.message}`);
        }
    }
    rec.onresult = e => {
        const transcript = e.results[e.results.length - 1][0].transcript;
        textarea.textContent += transcript + " ";
    }
}

let text, utterance;

function ttsEnd() {
    tts = false;
    ttsBtn.classList.remove("glow");
    ttsBtn.style.animation = null;
}

function txt2speech() {
    if (tts) {
        synth.cancel();
    } else {
        text = reply.innerText;
        synth.cancel();
        utterance = new SpeechSynthesisUtterance(reply.innerText);
        utterance.voice = window.speechSynthesis.getVoices().find(voice => voice.lang.startsWith("en-IN"));
        utterance.onstart = () => {
            ttsBtn.classList.add("glow");
            ttsBtn.style.animation = "on 1s infinite alternate";
            tts = true;
        }
        utterance.onend = () => ttsEnd();
        utterance.onerror = () => ttsEnd();
        synth.speak(utterance);
    }
}

function hideSubmit(i) {
    if (fileList.length < 1) {
        i.value.length > 18 ? ansSubmit.classList.remove('scale0') : ansSubmit.classList.add('scale0');
    }
}

function pastChoice(self, property) {
    let customProp;
    self.setAttribute(property, self.value)
    self.id == "marks" || self.id == "grade" ? customProp = (self.value - self.min) / (self.max - self.min) * 100 + "%" : null;
    document.documentElement.style.setProperty("--thumb", `calc(${customProp} - 1ch)`);
    localStorage.setItem(self.id, self.value);
    self.id == "cSubject" ? updateSubList() : null;
}

if (localStorage.marks) {
    grade.value = localStorage.grade;
    subject.value = localStorage.subject;
    marks.value = localStorage.marks;
    cSubject.value = localStorage.cSubject;

    if (localStorage.cSubject != "") {
        const optgroup = document.createElement("optgroup");
        optgroup.id = "custom";
        document.getElementsByTagName("select")[0].appendChild(optgroup);
        updateSubList();
    }
} else {
    marks.value = 3;
    pastChoice(marks, "innerHTML");
    pastChoice(subject, "value");
    pastChoice(cSubject, "value");
}

function updateSubList() {
    const custom = document.getElementById("custom");
    if (custom) { custom.innerHTML = null }
    else { return }
    for (const sub of localStorage.cSubject.split(",")) {
        const option = document.createElement("option");
        option.innerHTML = sub;
        option.value = sub;
        custom.appendChild(option);
    }
} updateSubList();

document.querySelectorAll("input[type='submit'], input[type='reset'], button, select").forEach(e => {
    const toggleClass = () => e.classList.toggle("hover");
    if (!navigator.userAgent.toLowerCase().match(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i)) {
        e.onmouseover = () => toggleClass();
        e.onmouseout = () => toggleClass();
    } else{
        e.ontouchstart = () => toggleClass();
        e.ontouchend = () => toggleClass(); 
    }
});

function promptGen(txtInput, mm) {
    const wordLimit = Math.round(mm * 24 / 10) * 10,
        handwriting = fileList.length > 0 ? "Extract text from this image. Is my handwriting bad?" : "";
    return `
    Your name is 'Gradians AI' - an AI examiner. Evaluate my answer and provide an analysis.

    Give marks out of ${mm}.
    ${handwriting}
    - How do i improve my answer?
    - IMPORTANT: - Ensure if answer is around ${wordLimit} words.
    - Provide a correct answer in points in minimum ${wordLimit} words according to information from NCERT Class ${localStorage.grade} ${localStorage.subject}.

    Your response will be in HTML format in this style:
    - Use an INFORMAL tone and EMOJIS.
    - Use tags like <b>, <i>, <ul>, <hr> to emphasize some points or generate a bulleted list.
    - Use <br> and <p> tags in different paragraphs and lines.
    - ALWAYS GENERATE RESPONSE IN different and lines separated by <br>, <p>.
    Evaluate this answer:
    ${txtInput}`
}