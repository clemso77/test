from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from predictor import (
    predict,
    MultiLabelBinarizerWrapper,
    cyclical_encoding,
    preprocessing,
    get_preprocessor
)

app = Flask(__name__)
CORS(app)

REQUIRED_FIELDS = [
    'LOCAL_TIME', 'WEEK_DAY', 'INCIDENT', 'LOCAL_MONTH', 'LOCAL_DAY',
    'TEMP', 'DEW_POINT_TEMP', 'HUMIDEX', 'PRECIP_AMOUNT',
    'RELATIVE_HUMIDITY', 'STATION_PRESSURE', 'VISIBILITY',
    'WEATHER_ENG_DESC', 'WIND_DIRECTION', 'WIND_SPEED'
]

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

@app.route('/predict', methods=['POST'])
def predict_delay():
    try:
        data = request.json
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400
        
        missing = [f for f in REQUIRED_FIELDS if f not in data]
        if missing:
            return jsonify({
                'success': False,
                'error': f'Missing fields: {", ".join(missing)}'
            }), 400
        
        prediction = predict(data)
        
        return jsonify({
            'success': True,
            'prediction': float(prediction)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PREDICTION_API_PORT', 5000))
    host = os.environ.get('PREDICTION_API_HOST', '127.0.0.1')
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host=host, port=port, debug=debug)
