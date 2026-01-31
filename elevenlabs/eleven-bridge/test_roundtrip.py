#!/usr/bin/env python3
"""
Round-trip test script for Eleven Bridge API.

This script:
1. Sends text to /text_to_speech/ and receives audio (base64 MP3)
2. Sends that audio back to /speech_to_text/ and receives transcribed text
3. Compares original and transcribed text

Usage:
    python test_roundtrip.py [--base-url http://localhost:8000] [--text "Your text here"]
"""

import argparse
import json
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def text_to_speech(base_url: str, text: str, decision_id: str = "test_tts") -> dict:
    """Send text to TTS endpoint and return response."""
    url = f"{base_url}/text_to_speech/"
    payload = {
        "decisionId": decision_id,
        "text": text,
    }
    
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    
    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def speech_to_text(base_url: str, audio_base64: str, audio_format: str = "mp3", decision_id: str = "test_stt") -> dict:
    """Send audio to STT endpoint and return response."""
    url = f"{base_url}/speech_to_text/"
    payload = {
        "decisionId": decision_id,
        "audio": audio_base64,
        "audioFormat": audio_format,
    }
    
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    
    with urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    parser = argparse.ArgumentParser(description="Round-trip test for Eleven Bridge API")
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL of the Eleven Bridge service (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--text",
        default="Hello! This is a round-trip test of the Eleven Bridge service. Can you hear me clearly?",
        help="Text to convert to speech and back",
    )
    parser.add_argument(
        "--save-audio",
        type=str,
        default=None,
        help="Optional: Save the generated audio to this file path (e.g., output.mp3)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("Eleven Bridge Round-Trip Test")
    print("=" * 60)
    print(f"\nBase URL: {args.base_url}")
    print(f"Original text: \"{args.text}\"")
    print()

    # Step 1: Text to Speech
    print("[1/2] Sending text to /text_to_speech/...")
    try:
        tts_response = text_to_speech(args.base_url, args.text)
        audio_base64 = tts_response["audio"]
        audio_format = tts_response["audioFormat"]
        
        # Calculate audio size
        import base64
        audio_bytes = base64.b64decode(audio_base64)
        audio_size_kb = len(audio_bytes) / 1024
        
        print(f"      SUCCESS! Received {audio_format} audio ({audio_size_kb:.1f} KB)")
        
        # Optionally save audio
        if args.save_audio:
            with open(args.save_audio, "wb") as f:
                f.write(audio_bytes)
            print(f"      Audio saved to: {args.save_audio}")
        
    except HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else "No details"
        print(f"      FAILED! HTTP {e.code}: {error_body}")
        sys.exit(1)
    except URLError as e:
        print(f"      FAILED! Connection error: {e.reason}")
        print("      Is the Eleven Bridge service running?")
        sys.exit(1)
    except Exception as e:
        print(f"      FAILED! {type(e).__name__}: {e}")
        sys.exit(1)

    print()

    # Step 2: Speech to Text
    print("[2/2] Sending audio to /speech_to_text/...")
    try:
        stt_response = speech_to_text(args.base_url, audio_base64, audio_format)
        transcribed_text = stt_response["text"]
        
        print(f"      SUCCESS! Transcribed text received")
        
    except HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else "No details"
        print(f"      FAILED! HTTP {e.code}: {error_body}")
        sys.exit(1)
    except URLError as e:
        print(f"      FAILED! Connection error: {e.reason}")
        sys.exit(1)
    except Exception as e:
        print(f"      FAILED! {type(e).__name__}: {e}")
        sys.exit(1)

    # Results
    print()
    print("=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"\nOriginal text:    \"{args.text}\"")
    print(f"Transcribed text: \"{transcribed_text}\"")
    print()

    # Simple similarity check
    original_lower = args.text.lower().strip()
    transcribed_lower = transcribed_text.lower().strip()
    
    # Remove punctuation for comparison
    import re
    original_clean = re.sub(r'[^\w\s]', '', original_lower)
    transcribed_clean = re.sub(r'[^\w\s]', '', transcribed_lower)
    
    if original_clean == transcribed_clean:
        print("Match: EXACT (ignoring punctuation and case)")
    elif original_clean in transcribed_clean or transcribed_clean in original_clean:
        print("Match: PARTIAL (one contains the other)")
    else:
        # Word overlap check
        original_words = set(original_clean.split())
        transcribed_words = set(transcribed_clean.split())
        overlap = original_words & transcribed_words
        overlap_pct = len(overlap) / max(len(original_words), 1) * 100
        print(f"Match: {overlap_pct:.0f}% word overlap ({len(overlap)}/{len(original_words)} words)")

    print()
    print("Round-trip test completed!")
    print()


if __name__ == "__main__":
    main()
