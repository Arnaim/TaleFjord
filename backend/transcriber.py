
from faster_whisper import WhisperModel

loaded_models = {}


def get_model(model_size):
    if model_size not in loaded_models:
        print(f"Loading Whisper model: {model_size}")

        loaded_models[model_size] = WhisperModel(
            model_size,
            device="cpu",
            compute_type="int8"
        )

        print(f"Model {model_size} loaded successfully!")

    return loaded_models[model_size]


def transcribe_audio(file_path, model_size="base", language=None, progress_callback=None):
    model = get_model(model_size)

    segments, info = model.transcribe(
        file_path,
        language=language,
        beam_size=5
    )

    transcript = []

    for segment in segments:
        transcript.append(segment.text.strip())

        if progress_callback and info.duration:
            progress = int((segment.end / info.duration) * 100)
            progress_callback(min(progress, 99))

    if progress_callback:
        progress_callback(100)

    return {
        "text": " ".join(transcript),
        "language": info.language,
        "duration": info.duration
    }
