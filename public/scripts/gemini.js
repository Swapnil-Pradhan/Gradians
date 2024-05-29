import { HarmBlockThreshold, HarmCategory, GoogleGenerativeAI } from "@google/generative-ai";
import { history } from "./firebase.js";

var MAXTOKENS, result, finalResult, header, userInput;

async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}

async function run(title) {
    const model = new GoogleGenerativeAI("AIzaSyD4BG4OPe3r49HfUP7qllKFooysigwJjD0").getGenerativeModel({
        model: MODEL, generationConfig: {
            maxOutputTokens: MAXTOKENS,
            temperature: 0.9,
            topP: 1,
            topK: 3
        }, safetySettings: [{
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }, {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }, {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }, {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }]
    });

    if (MODEL === "gemini-1.0-pro-vision-latest") {
        result = await model.generateContent([PROMPT, ...await Promise.all([...fileElm.files].map(fileToGenerativePart))]);
    } else {
        result = await model.generateContent(PROMPT);
        console.log(result);
    }

    if (!title) {
        finalResult = await result.response.text();
        reply.innerHTML = finalResult;
        ttsBtn.classList.add("scale0");
        reply.classList.add("scale0");
        load.classList.remove("scale0");
        ansSubmit.innerHTML = "&#x1F501;";
        ansSubmit.setAttribute("tip", "Re-send");
        ttsBtn.classList.remove("scale0");
        reply.classList.remove("scale0");
        load.classList.add("scale0");
    } else {
        header = await result.response.text();
    }
}

ansSubmit.addEventListener("click", () => {
    userInput = textarea.value;

    PROMPT = promptGen(userInput, localStorage.marks);
    MAXTOKENS = 4096;
    recActive ? stt() : null;
    load.classList.remove("scale0");
    fileList.length > 0 ? MODEL = "gemini-1.0-pro-vision-latest" : MODEL = "gemini-1.0-pro";
    run().then(() => {
        MODEL = "gemini-1.0-pro";
        MAXTOKENS = 16;
        PROMPT = finalResult + "What topic is this? Use 1st letter as an emoji related to the topic.";
        run(true).then(() => history(header, userInput, finalResult)).catch(err => alert(err));
    }).catch(err => alert(err));
});