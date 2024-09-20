pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

let speech;
let isPaused = false;
let voices = [];
let words = [];
let currentWordIndex = 0;

// Load available voices
function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    const voiceSelect = document.getElementById('voiceSelect');
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

// Extract text from PDF
async function extractTextFromPdf(file) {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let extractedText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        extractedText += pageText + " ";
    }
    return extractedText;
}

// Split the text into individual words and update the text display
function displayTextWithHighlights(text) {
    words = text.split(" ");
    const highlightedText = words.map((word, index) => `<span id="word-${index}">${word}</span>`).join(" ");
    document.getElementById('textArea').innerHTML = highlightedText;
}

// Highlight the current word
function highlightCurrentWord(index) {
    if (index > 0) {
        document.getElementById(`word-${index - 1}`).style.backgroundColor = ""; // Remove highlight from the previous word
    }
    const currentWordElement = document.getElementById(`word-${index}`);
    if (currentWordElement) {
        currentWordElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        currentWordElement.style.backgroundColor = "yellow"; // Highlight the current word
    }
}

// Function to create speech object
function prepareTextToSpeech(text) {
    speech = new SpeechSynthesisUtterance(text);
    speech.rate = parseFloat(document.getElementById('speedControl').value); // Set initial speed
    speech.pitch = 1;

    const selectedVoiceIndex = document.getElementById('voiceSelect').value;
    speech.voice = voices[selectedVoiceIndex];

    // Listen for the 'boundary' event to highlight words
    speech.onboundary = (event) => {
        if (event.name === 'word') {
            highlightCurrentWord(currentWordIndex);
            currentWordIndex++;
        }
    };

    speech.onend = () => {
        document.getElementById('playButton').disabled = false; // Re-enable play button when finished
        currentWordIndex = 0; // Reset word index after speech ends
    };
}

// Function to play or resume speech
function playSpeech() {
    if (isPaused) {
        window.speechSynthesis.resume();
        isPaused = false;
    } else {
        currentWordIndex = 0; // Reset to start from the beginning
        window.speechSynthesis.speak(speech);
    }
    document.getElementById('playButton').disabled = true;
}

// Function to pause speech
function pauseSpeech() {
    window.speechSynthesis.pause();
    isPaused = true;
    document.getElementById('playButton').disabled = false;
}

// Event listener for the convert button
document.getElementById('convertButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('pdfFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a PDF file!');
        return;
    }

    // Extract text from the PDF
    const extractedText = await extractTextFromPdf(file);

    // Display extracted text in the text area for reading along with audio
    displayTextWithHighlights(extractedText);

    // Prepare the speech object but don't play immediately
    prepareTextToSpeech(extractedText);

    // Show the audio controls and text area
    document.getElementById('audioControls').style.display = 'block';
    document.getElementById('textContainer').style.display = 'block';
});

// Event listeners for play, pause, and speed controls
document.getElementById('playButton').addEventListener('click', playSpeech);
document.getElementById('pauseButton').addEventListener('click', pauseSpeech);

// Event listener for speed control
document.getElementById('speedControl').addEventListener('input', (event) => {
    if (speech && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); // Stop current speech to change speed
        speech.rate = parseFloat(event.target.value);
        window.speechSynthesis.speak(speech); // Resume with new speed
        currentWordIndex = 0; // Reset index for proper sync
    }
});

// Load voices when available
window.speechSynthesis.onvoiceschanged = loadVoices;
