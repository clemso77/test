from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add models directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import all necessary classes and functions from predictor
# This ensures the custom classes are available for unpickling
from predictor import (
    predict,
    MultiLabelBinarizerWrapper,
    cyclical_encoding,
    preprocessing,
    get_preprocessor
)

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

@app.route('/predict', methods=['POST'])
def predict_delay():
    """
    Endpoint to predict bus delay
    
    Expected input format:
    {
        "ROUTE": 91,
        "LOCAL_TIME": "02:30:00",
        "WEEK_DAY": "Sunday",
        "INCIDENT": "External",
        "LOCAL_MONTH": 1.0,
        "LOCAL_DAY": 1.0,
        "TEMP": 3.7,
        "DEW_POINT_TEMP": 1.7,
        "HUMIDEX": 1.982109270289648,
        "PRECIP_AMOUNT": 0.0,
        "RELATIVE_HUMIDITY": 87.0,
        "STATION_PRESSURE": 100.27,
        "VISIBILITY": 16.1,
        "WEATHER_ENG_DESC": "Clear",
        "WIND_DIRECTION": 28.0,
        "WIND_SPEED": 17.0
    }
    
    Returns:
    {
        "prediction": <predicted_delay_in_minutes>,
        "success": true
    }
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = [
            'LOCAL_TIME', 'WEEK_DAY', 'INCIDENT', 'LOCAL_MONTH', 'LOCAL_DAY',
            'TEMP', 'DEW_POINT_TEMP', 'HUMIDEX', 'PRECIP_AMOUNT',
            'RELATIVE_HUMIDITY', 'STATION_PRESSURE', 'VISIBILITY',
            'WEATHER_ENG_DESC', 'WIND_DIRECTION', 'WIND_SPEED'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        # Make prediction
        prediction = predict(data)
        
        return jsonify({
            "success": True,
            "prediction": float(prediction)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PREDICTION_API_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
