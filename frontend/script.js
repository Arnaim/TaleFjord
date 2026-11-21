// TaleFjord frontend
// Expected backend: POST /api/transcribe (multipart fields: file, language, model)
// Optional progress: backend may return JSON { text, language, duration }.
// For long-running jobs, replace this fetch flow with your backend's job/SSE contract.

const API_URL = "http://127.0.0.1:8000/api/transcribe";

const fileInput = document.querySelector("#file-input");
const dropzone = document.querySelector("#dropzone");
const browseButton = document.querySelector("#browse-button");
const fileCard = document.querySelector("#file-card");
const fileName = document.querySelector("#file-name");
const fileSize = document.querySelector("#file-size");
const fileType = document.querySelector("#file-type");
const removeFileButton = document.querySelector("#remove-file");
const transcribeButton = document.querySelector("#transcribe-button");
const languageSelect = document.querySelector("#language");
const modelSelect = document.querySelector("#model");
const progressArea = document.querySelector("#progress-area");
const progressLabel = document.querySelector("#progress-label");
const progressPercent = document.querySelector("#progress-percent");
const progressFill = document.querySelector("#progress-fill");
const progressDetail = document.querySelector("#progress-detail");
const cancelButton = document.querySelector("#cancel-button");
const resultSection = document.querySelector("#result-section");
const resultMeta = document.querySelector("#result-meta");
const transcriptText = document.querySelector("#transcript-text");
const wordCount = document.querySelector("#word-count");
const copyButton = document.querySelector("#copy-button");
const downloadButton = document.querySelector("#download-button");
const errorMessage = document.querySelector("#error-message");

let selectedFile = null;
let activeController = null;
let transcriptFilename = "talefjord-transcript.txt";

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.hidden = true;
  errorMessage.textContent = "";
}

function setFile(file) {
  clearError();
  if (!file) return;

  const allowed = /^(audio|video)\//.test(file.type) ||
    /\.(mp3|wav|m4a|ogg|flac|aac|wma|mp4|webm|mov|mkv|avi)$/i.test(file.name);

  if (!allowed) {
    showError("That file type doesn't look like a supported audio or video file.");
    return;
  }

  selectedFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";
  fileType.textContent = extension.length > 5 ? "MEDIA" : extension;
  dropzone.hidden = true;
  fileCard.hidden = false;
  transcribeButton.disabled = false;
  resultSection.hidden = true;
}

function clearFile() {
  selectedFile = null;
  fileInput.value = "";
  dropzone.hidden = false;
  fileCard.hidden = true;
  transcribeButton.disabled = true;
}

function updateProgress(percent, label, detail) {
  const safePercent = Math.max(0, Math.min(100, percent));
  progressFill.style.width = `${safePercent}%`;
  progressPercent.textContent = `${Math.round(safePercent)}%`;
  if (label) progressLabel.textContent = label;
  if (detail) progressDetail.textContent = detail;
}

function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function displayTranscript(text, language, duration) {
  transcriptText.textContent = text || "No speech was detected in this file.";
  const words = countWords(text || "");
  wordCount.textContent = `${words.toLocaleString()} ${words === 1 ? "word" : "words"}`;
  const parts = [];
  if (language) parts.push(`Language: ${language}`);
  if (duration) parts.push(`Audio length: ${duration}`);
  resultMeta.textContent = parts.join(" · ") || "Transcription completed";
  resultSection.hidden = false;
  transcriptFilename = `${(selectedFile?.name || "transcript").replace(/\.[^.]+$/, "")}-transcript.txt`;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}


async function transcribe() {
  if (!selectedFile || activeController) return;

  clearError();
  resultSection.hidden = true;
  activeController = new AbortController();
  transcribeButton.disabled = true;
  progressArea.hidden = false;

  updateProgress(
    0,
    "Uploading your file…",
    "Sending media to the transcription backend."
  );

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("language", languageSelect.value);
  formData.append("model", modelSelect.value);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
      signal: activeController.signal
    });

    if (!response.ok) {
      let message = `Backend error (${response.status}).`;

      try {
        const body = await response.json();
        if (body.detail) {
          message = typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail);
        }
      } catch (_) {}

      throw new Error(message);
    }

    if (!response.body) {
      throw new Error("Your browser does not support response streaming.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let completedResult = null;

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      if (done) buffer += decoder.decode();
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || "";

      for (const event of events) {
        const dataLine = event
          .split(/\r?\n/)
          .find(line => line.startsWith("data:"));

        if (!dataLine) continue;

        const payload = JSON.parse(dataLine.slice(5).trim());

        if (typeof payload.progress === "number") {
          updateProgress(
            payload.progress,
            "Transcribing…",
            `Processed approximately ${payload.progress}% of the audio.`
          );
        }

        if (payload.complete) {
          completedResult = payload.complete;
        }

        if (payload.error) {
          throw new Error(payload.error);
        }
      }
    }

    if (!completedResult) {
      throw new Error("The backend finished without returning a transcript.");
    }

    updateProgress(
      100,
      "Transcription complete",
      "Your transcript is ready below."
    );

    displayTranscript(
      completedResult.text || "",
      completedResult.language || "",
      completedResult.duration
        ? `${Math.floor(completedResult.duration / 60)}:${String(
            Math.floor(completedResult.duration % 60)
          ).padStart(2, "0")}`
        : ""
    );

  } catch (error) {
    if (error.name === "AbortError") {
      updateProgress(0, "Cancelled", "The request was cancelled.");
    } else {
      showError(
        `${error.message} Make sure the FastAPI backend is running at ${API_URL}.`
      );
      progressArea.hidden = true;
    }
  } finally {
    activeController = null;
    transcribeButton.disabled = !selectedFile;
  }
}


dropzone.addEventListener("click", (event) => {
  if (event.target.closest("button")) return;
  fileInput.click();
});
dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});
browseButton.addEventListener("click", (event) => {
  event.stopPropagation();
  fileInput.click();
});
fileInput.addEventListener("change", () => setFile(fileInput.files[0]));
removeFileButton.addEventListener("click", clearFile);

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("dragover");
  });
});
["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragover");
  });
});
dropzone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  setFile(file);
});

transcribeButton.addEventListener("click", transcribe);
cancelButton.addEventListener("click", () => {
  if (activeController) activeController.abort();
});

copyButton.addEventListener("click", async () => {
  const text = transcriptText.innerText;
  try {
    await navigator.clipboard.writeText(text);
    copyButton.lastChild.textContent = " Copied";
    window.setTimeout(() => { copyButton.lastChild.textContent = " Copy"; }, 1400);
  } catch (_) {
    showError("Clipboard access was blocked by the browser. Select the transcript and copy it manually.");
  }
});

downloadButton.addEventListener("click", () => {
  const blob = new Blob([transcriptText.innerText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = transcriptFilename;
  link.click();
  URL.revokeObjectURL(url);
});
