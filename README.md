
# TaleFjord

**TaleFjord** is a lightweight, locally running audio and video transcription application powered by [FastAPI](https://fastapi.tiangolo.com/) and [faster-whisper](https://github.com/SYSTRAN/faster-whisper).

Upload an audio or video file, select a transcription language and Whisper model, and get your transcript directly in your browser.

No paid API keys or cloud transcription services are required.

## Features

- Upload audio and video files
- Drag-and-drop file support
- Automatic language detection
- Manual language selection
- Three Whisper model options: Tiny, Base, and Small
- Live transcription progress
- Editable transcript
- Copy transcript to clipboard
- Download transcript as a `.txt` file
- Local processing using your computer's CPU
- No paid API subscriptions required

## Project Structure

```text
talefjord/
├── backend/
│   ├── .venv/
│   ├── main.py
│   ├── transcriber.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

## Requirements

Before running TaleFjord, make sure you have:

- Python 3.11 or newer
- A modern web browser
- An internet connection for the initial dependency and model downloads
- Sufficient RAM and storage for the selected Whisper model

**Note:** TaleFjord currently uses CPU-based transcription. Performance depends on your processor, available RAM, and selected model.

No GPU is required.

---

# Installation and Setup

You need to start two separate services:

| Service | Address |
|---|---|
| Frontend | http://127.0.0.1:5500 |
| Backend | http://127.0.0.1:8000 |

Keep both terminal windows running while using TaleFjord.

## Step 1: Download the Project

### Option A: Clone using Git

If Git is installed, open a terminal and run:

```bash
git clone <repository-url>
```

Enter the project directory:

```bash
cd talefjord
```

Replace `<repository-url>` with the GitHub repository URL.

### Option B: Download ZIP

1. Open the TaleFjord GitHub repository.
2. Click the green **Code** button.
3. Select **Download ZIP**.
4. Extract the downloaded ZIP file.
5. Open the extracted `talefjord` folder in your terminal or code editor.

You should see the `backend` and `frontend` folders.

## Step 2: Install Python

If Python is not already installed, download it from:

https://www.python.org/downloads/

Recommended: Python 3.11 or newer.

Verify your installation:

**Windows:**

```powershell
python --version
```

**Linux / macOS:**

```bash
python3 --version
```

If the version number appears, Python is installed.

---

# Step 3: Set Up the Backend

The backend handles file uploads, audio processing, and transcription.

Open a terminal and navigate to the `backend` directory:

```text
cd path/to/talefjord/backend
```

Replace the example path with the actual location of your project.

### Windows — PowerShell

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then activate the environment again:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install -r requirements.txt
```

### Linux / macOS — Bash

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

### Linux — Fish Shell

Create a virtual environment:

```fish
python -m venv .venv
```

Activate it:

```fish
source .venv/bin/activate.fish
```

Install dependencies:

```fish
python -m pip install -r requirements.txt
```

## Step 4: Start the Backend

After installing the dependencies, make sure your terminal is still inside the `backend` directory and your virtual environment is activated.

Run:

```bash
python -m uvicorn main:app --reload
```

You should see output indicating that Uvicorn is running on:

```text
http://127.0.0.1:8000
```

### Check if the Backend Is Working

Open your browser and visit:

http://127.0.0.1:8000

You should see:

```json
{
  "message": "TaleFjord API is running!"
}
```

You can also check the health endpoint:

http://127.0.0.1:8000/health

Expected response:

```json
{
  "status": "healthy"
}
```

**Important:** Keep this terminal open. Do not stop the backend while using TaleFjord.

---

# Step 5: Start the Frontend

Now open a **second terminal window**.

Navigate to the `frontend` directory:

```text
cd path/to/talefjord/frontend
```

### Windows — PowerShell

Run:

```powershell
python -m http.server 5500
```

### Linux / macOS — Bash

Run:

```bash
python3 -m http.server 5500
```

### Linux — Fish Shell

Run:

```fish
python -m http.server 5500
```

You should see a message indicating that the server is running on port 5500.

## Step 6: Open TaleFjord

Open your browser and visit:

**http://127.0.0.1:5500**

TaleFjord should now be ready to use!

Remember:

- Keep the backend terminal running.
- Keep the frontend terminal running.
- Both services must remain active while using the application.

---

# Using TaleFjord

## 1. Upload a File

You can either:

- Drag and drop an audio or video file into the upload area.
- Click the upload area and select a file from your computer.

## 2. Select a Language

Choose between automatic language detection and manual language selection.

When automatic detection is selected, Whisper attempts to identify the spoken language.

## 3. Select a Whisper Model

TaleFjord currently offers three model options.

| Model | Relative Speed | Relative Accuracy |
|---|---|---|
| Tiny | Fastest | Lowest |
| Base | Moderate | Better |
| Small | Slowest | Better |

**Which model should you choose?**

- **Tiny:** Best for quick tests and computers with limited resources.
- **Base:** A reasonable balance between speed and transcription quality.
- **Small:** Better transcription quality in many cases, but requires more processing time and resources.

Actual results depend on the audio quality, language, and recording conditions.

## 4. Start Transcription

Click the **Transcribe** button.

TaleFjord will:

1. Upload your selected file to the backend.
2. Load the selected Whisper model if it has not already been loaded.
3. Process the audio.
4. Send progress updates to the frontend.
5. Display the completed transcript.

## 5. Manage Your Transcript

After transcription, you can:

- Edit the generated transcript.
- Copy the transcript to your clipboard.
- Download it as a `.txt` file.

---

# Supported Media Formats

TaleFjord currently accepts common audio and video formats:

### Audio

- MP3
- WAV
- M4A
- OGG
- FLAC
- AAC
- WMA

### Video

- MP4
- WebM
- MOV
- MKV
- AVI

Actual decoding support depends on the installed media-processing dependencies.

---

# How TaleFjord Works

TaleFjord uses a simple frontend/backend architecture.

```text
       USER
        |
        v
   WEB BROWSER
        |
        v
  HTML / CSS / JS
        |
        | POST /api/transcribe
        | Multipart file upload
        v
    FASTAPI SERVER
        |
        v
   FASTER-WHISPER
        |
        v
   AUDIO PROCESSING
        |
        v
 TRANSCRIPTION RESULTS
        |
        | Server-Sent Events (SSE)
        | Progress updates
        v
    WEB BROWSER
        |
        v
 DISPLAY TRANSCRIPT
```

### Frontend

Built with:

- HTML
- CSS
- JavaScript

### Backend

Built with:

- Python
- FastAPI
- Uvicorn
- faster-whisper
- PyAV

### Transcription

TaleFjord uses faster-whisper, an optimized implementation of OpenAI Whisper.

The current backend configuration uses:

```python
device="cpu"
compute_type="int8"
```

The backend also caches loaded models so they can be reused during the same running server session.

### Progress Updates

TaleFjord uses **Server-Sent Events (SSE)** to stream transcription progress from the backend to the frontend.

This allows the interface to update while transcription is running instead of waiting for one final response.

---

# Troubleshooting

## 1. The Frontend Cannot Connect to the Backend

If you see an error saying that the FastAPI backend is not running:

1. Check whether the backend terminal is still open.
2. Make sure Uvicorn is running.
3. Visit http://127.0.0.1:8000/health.
4. If necessary, restart the backend:

```bash
python -m uvicorn main:app --reload
```

## 2. The Frontend Does Not Load

Make sure you started the frontend server from inside the `frontend` directory.

Run:

```bash
python -m http.server 5500
```

Then visit:

http://127.0.0.1:5500

## 3. Python Is Not Recognized

On Windows, try:

```powershell
py --version
```

If Python is installed, you can use `py` instead of `python` when creating the virtual environment.

On Linux, make sure Python and its virtual environment support are installed.

For example, on Debian/Ubuntu:

```bash
sudo apt install python3 python3-venv python3-pip
```

## 4. Virtual Environment Activation Fails

Make sure you are running the activation command from the `backend` directory.

Use the command appropriate for your shell:

| Environment | Activation command |
|---|---|
| Windows PowerShell | `.\.venv\Scripts\Activate.ps1` |
| Windows CMD | `.venv\Scripts\activate.bat` |
| Linux/macOS Bash | `source .venv/bin/activate` |
| Linux Fish | `source .venv/bin/activate.fish` |

## 5. Whisper Model Download Takes a Long Time

The first time you use a model, faster-whisper downloads its model files.

Download time depends on your internet connection.

Once downloaded, the model can be reused from the local cache.

## 6. Transcription Is Slow

Transcription speed depends on your CPU and selected model.

If processing takes too long:

- Try the Tiny model.
- Close unnecessary applications.
- Use shorter media files for testing.

## 7. Port Already in Use

If port 5500 or 8000 is already occupied, stop the other application using that port or configure TaleFjord to use another port.

If you change the frontend port, remember to update the allowed origins in the backend CORS configuration.

---

# Development Notes

TaleFjord currently runs as two separate local services.

| Component | Development Address |
|---|---|
| Frontend | `127.0.0.1:5500` |
| Backend | `127.0.0.1:8000` |

The frontend communicates with the backend through the `/api/transcribe` endpoint.

The current project is intended for local development. A single-service production deployment may be added in a future version.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


