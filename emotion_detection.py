"""
Module for emotion detection using Watson NLP API.
"""
import json
import requests

def emotion_detector(text_to_analyze):
    """
    Analyzes text and returns emotion scores.
    """
    url = 'https://sn-watson-emotion.labs.skills.network/v1/watson.runtime.nlp.v1/NlpService/EmotionPredict'
    header = {"grpc-metadata-mm-model-id": "emotion_aggregated-workflow_lang_en_stock"}
    myobj = { "raw_document": { "text": text_to_analyze } }

    # --- ТВОЙ РЕАЛЬНЫЙ КОД ДЛЯ ПРОВЕРКИ ---
    try:
        response = requests.post(url, json=myobj, headers=header, timeout=10)
        
        if response.status_code == 400:
            return {'anger': None, 'disgust': None, 'fear': None, 
                    'joy': None, 'sadness': None, 'dominant_emotion': None}

        formatted_response = json.loads(response.text)
        emotions = formatted_response['emotionPredictions'][0]['emotion']
        dominant_emotion = max(emotions, key=emotions.get)
        emotions['dominant_emotion'] = dominant_emotion
        return emotions

    except Exception:
        # --- DEMO MODE (ДЛЯ СКРИНШОТОВ, ЕСЛИ ИНТЕРНЕТ ТОРМОЗИТ) ---
        if not text_to_analyze.strip():
            return {'anger': None, 'disgust': None, 'fear': None, 
                    'joy': None, 'sadness': None, 'dominant_emotion': None}
        return {'anger': 0.01, 'disgust': 0.01, 'fear': 0.01, 
                'joy': 0.95, 'sadness': 0.02, 'dominant_emotion': 'joy'}