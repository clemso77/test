# Prediction Model API

This directory contains the prediction model and API for predicting bus delays.

## Files

- `predictor.py`: Core prediction logic with preprocessing and model loading
- `prediction_api.py`: Flask API that exposes the prediction model via HTTP
- `preprocessor.pkl`: Trained preprocessor for feature engineering
- `xgb_model.pkl`: Trained XGBoost model for delay prediction
- `requirements.txt`: Python dependencies

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Running the Prediction API

Start the Flask API server:

```bash
cd models
python prediction_api.py
```

By default, the API runs on `http://127.0.0.1:5000` (localhost only). You can configure it using environment variables:

```bash
# Change port
PREDICTION_API_PORT=8000 python prediction_api.py

# Bind to all network interfaces (useful for containers or remote access)
PREDICTION_API_HOST=0.0.0.0 python prediction_api.py

# Enable debug mode (for development only)
FLASK_DEBUG=true python prediction_api.py
```

**Security Notes**: 
- Debug mode is disabled by default for security. Only enable it in development environments.
- The API binds to `127.0.0.1` by default (localhost only). Set `PREDICTION_API_HOST=0.0.0.0` to expose it on all interfaces, but only do this in trusted networks or with proper firewall rules.

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy"
}
```

### Predict Delay
```
POST /predict
```

Request body:
```json
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
```

Response:
```json
{
  "success": true,
  "prediction": 81.5
}
```

## Required Input Fields

The prediction model requires the following fields:

- `LOCAL_TIME`: Time in HH:MM:SS format (e.g., "02:30:00")
- `WEEK_DAY`: Day of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
- `INCIDENT`: Type of incident (e.g., "External", "Safety", "Mechanical", etc.)
- `LOCAL_MONTH`: Month number (1-12)
- `LOCAL_DAY`: Day of the month (1-31)
- `TEMP`: Temperature in Celsius
- `DEW_POINT_TEMP`: Dew point temperature in Celsius
- `HUMIDEX`: Humidex value
- `PRECIP_AMOUNT`: Precipitation amount in mm
- `RELATIVE_HUMIDITY`: Relative humidity percentage (0-100)
- `STATION_PRESSURE`: Atmospheric pressure in kPa
- `VISIBILITY`: Visibility in km
- `WEATHER_ENG_DESC`: Weather description (e.g., "Clear", "Rain", "Snow")
- `WIND_DIRECTION`: Wind direction in degrees (0-360)
- `WIND_SPEED`: Wind speed in km/h

For more details on the column descriptions, see `notebooks/1_dataset_engineering.ipynb`.

## Integration with Backend

The TypeScript backend can call this API using the `predictionService.ts` module:

```typescript
import { getPrediction } from './services/predictionService';

const prediction = await getPrediction({
  LOCAL_TIME: "14:30:00",
  WEEK_DAY: "Monday",
  INCIDENT: "External",
  LOCAL_MONTH: 1,
  LOCAL_DAY: 15,
  TEMP: 5.0,
  DEW_POINT_TEMP: 2.0,
  HUMIDEX: 3.5,
  PRECIP_AMOUNT: 0.0,
  RELATIVE_HUMIDITY: 75.0,
  STATION_PRESSURE: 101.3,
  VISIBILITY: 15.0,
  WEATHER_ENG_DESC: "Clear",
  WIND_DIRECTION: 180.0,
  WIND_SPEED: 10.0
});
```

The backend expects the `PREDICTION_API_URL` environment variable to be set in `.env`:
```
PREDICTION_API_URL='http://localhost:5000'
```
