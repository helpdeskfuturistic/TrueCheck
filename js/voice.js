(() => {
  const button = document.getElementById("recordButton");
  const status = document.getElementById("voiceStatus");
  const transcript = document.getElementById("voiceTranscript");
  if (!button || !status || !transcript) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let recording = false;

  if (!SpeechRecognition) {
    button.disabled = true;
    button.title = "Speech recognition is not supported by this browser.";
    status.textContent = "Speech recognition is not available in this browser. You can type or paste a transcription below.";
    button.style.opacity = ".45";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en";
  recognition.interimResults = true;
  recognition.continuous = false;

  button.addEventListener("click", () => {
    if (recording) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
      recording = true;
      button.classList.add("recording");
      button.textContent = "■";
      status.textContent = "Listening… speak clearly, then stop.";
    } catch {
      status.textContent = "Could not start the microphone. Check browser permissions and try again.";
    }
  });
  recognition.onresult = event => {
    let text = "";
    for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
    transcript.value = text;
    status.textContent = "Transcription ready. Edit it before verification.";
  };
  recognition.onerror = event => {
    status.textContent = event.error === "not-allowed"
      ? "Microphone permission was denied. Allow microphone access in your browser settings."
      : "Speech recognition failed. Try again or type your claim.";
  };
  recognition.onend = () => {
    recording = false;
    button.classList.remove("recording");
    button.textContent = "●";
  };
})();
