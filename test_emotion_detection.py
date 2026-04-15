import unittest
from EmotionDetection.emotion_detection import emotion_detector

class TestEmotionDetector(unittest.TestCase):
    """
    Класс для тестирования функции emotion_detector.
    """
    def test_emotion_detector(self):
        # Тест на радость
        res_1 = emotion_detector("I am glad this happened")
        self.assertEqual(res_1['dominant_emotion'], 'joy')
        
        # Тест на злость
        res_2 = emotion_detector("I am really mad about this")
        self.assertEqual(res_2['dominant_emotion'], 'anger')
        
        # Тест на грусть
        res_3 = emotion_detector("I feel sad about this")
        self.assertEqual(res_3['dominant_emotion'], 'sadness')

if __name__ == "__main__":
    unittest.main()