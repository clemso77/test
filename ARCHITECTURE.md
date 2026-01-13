# Prediction System Architecture

## Overview

The prediction system consists of two main components that work together to provide bus delay predictions:

1. **Python Prediction API** (Flask) - Serves the machine learning model
2. **TypeScript Backend** (Express.js) - Integrates predictions with the bus service API

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    (React/TypeScript)                        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Request
                         │ POST /lines/{id}/prediction
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  TypeScript Backend                          │
│                    (Express.js)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  busRoutes.ts                                         │  │
│  │  - POST /lines/:id/prediction                         │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │  busService.ts                                        │  │
│  │  - getLinePrediction(id, data)                        │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │  predictionService.ts                                 │  │
│  │  - getPrediction(data)                                │  │
│  │  - checkPredictionApiHealth()                         │  │
│  └───────────────────┬──────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │ HTTP Request
                         │ POST /predict
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Python Prediction API (Flask)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  prediction_api.py                                    │  │
│  │  - POST /predict                                      │  │
│  │  - GET /health                                        │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │  predictor.py                                         │  │
│  │  - preprocessing(data)                                │  │
│  │  - predict(data)                                      │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│                      ▼                                       │
│        ┌──────────────────────────────┐                     │
│        │  ML Models (pickled)         │                     │
│        │  - preprocessor.pkl          │                     │
│        │  - xgb_model.pkl             │                     │
│        └──────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Python Prediction API (Port 5000)

**Purpose**: Serves the trained XGBoost model for predicting bus delays

**Key Files**:
- `models/prediction_api.py` - Flask application with REST API endpoints
- `models/predictor.py` - Core prediction logic with preprocessing
- `models/preprocessor.pkl` - Trained scikit-learn preprocessor
- `models/xgb_model.pkl` - Trained XGBoost model

**Endpoints**:
- `GET /health` - Health check endpoint
- `POST /predict` - Prediction endpoint (requires weather and temporal features)

**Dependencies**:
- Flask & Flask-CORS
- NumPy & Pandas
- scikit-learn (v1.5.1 for compatibility)
- XGBoost
- joblib

### TypeScript Backend (Port 3000)

**Purpose**: Main backend API that integrates predictions with bus service data

**Key Files**:
- `app/backend/src/server.ts` - Express server setup
- `app/backend/src/routes/busRoutes.ts` - Bus-related API routes
- `app/backend/src/services/busService.ts` - Bus service logic
- `app/backend/src/services/predictionService.ts` - Prediction API client

**Endpoints**:
- `POST /lines/:id/prediction` - Get delay prediction for a specific bus line

**Dependencies**:
- Express.js
- CORS
- TypeScript
- dotenv

## Data Flow

1. **Client Request**: Frontend sends POST request to `/lines/{id}/prediction` with weather and temporal data
2. **Backend Processing**: TypeScript backend receives request, adds route ID, and forwards to prediction service
3. **API Call**: Prediction service makes HTTP request to Python Flask API at `http://localhost:5000/predict`
4. **ML Prediction**: Flask API:
   - Validates input fields
   - Preprocesses data (cyclical encoding, feature engineering, scaling)
   - Runs prediction through XGBoost model
   - Returns predicted delay in minutes
5. **Response**: Backend returns formatted response with prediction, line ID, and units

## Input Data Requirements

The prediction model requires the following features:

### Temporal Features
- `LOCAL_TIME` - Time of day (HH:MM:SS format)
- `WEEK_DAY` - Day of week (Monday-Sunday)
- `LOCAL_MONTH` - Month (1-12)
- `LOCAL_DAY` - Day of month (1-31)

### Weather Features
- `TEMP` - Temperature (°C)
- `DEW_POINT_TEMP` - Dew point temperature (°C)
- `HUMIDEX` - Humidex value
- `PRECIP_AMOUNT` - Precipitation amount (mm)
- `RELATIVE_HUMIDITY` - Relative humidity (0-100%)
- `STATION_PRESSURE` - Atmospheric pressure (kPa)
- `VISIBILITY` - Visibility distance (km)
- `WEATHER_ENG_DESC` - Weather description (Clear, Rain, Snow, etc.)
- `WIND_DIRECTION` - Wind direction (0-360°)
- `WIND_SPEED` - Wind speed (km/h)

### Incident Features
- `INCIDENT` - Type of incident (External, Safety, Technical, Mechanical, Operational)

### Route Features
- `ROUTE` - Bus route number (added automatically by backend)

## Preprocessing Pipeline

The predictor performs several preprocessing steps:

1. **Temporal Encoding**:
   - Cyclical encoding of hour, minute, day of week, month, and day of month
   - Season extraction (Summer: May-September, Winter: October-April)

2. **Weather Processing**:
   - Weather condition grouping and multi-label binarization
   - Precipitation binary flag
   - Visibility categorization
   - Wind direction cyclical encoding

3. **Feature Scaling**:
   - Numerical features standardized using StandardScaler
   - Categorical features encoded using OneHotEncoder/OrdinalEncoder

4. **Feature Engineering**:
   - Creates 261 features from the 15 input fields
   - Returns sparse matrix for efficient model inference

## Configuration

### Environment Variables

**Backend** (app/backend/.env):
```env
PORT='3000'
PREDICTION_API_URL='http://localhost:5000'
```

**Python API**:
```env
PREDICTION_API_PORT=5000  # Optional, defaults to 5000
```

## Error Handling

The system includes comprehensive error handling:

1. **Input Validation**: Missing or invalid fields return 400 Bad Request
2. **API Availability**: Health check endpoint for monitoring
3. **Model Loading**: Lazy loading of preprocessor and model to handle pickling issues
4. **Network Errors**: Graceful handling of connection failures between services

## Performance Considerations

- **Model Loading**: Models are loaded once and cached in memory
- **Preprocessing**: Lightweight transformations complete in milliseconds
- **Prediction**: XGBoost inference is fast (< 100ms per prediction)
- **HTTP Overhead**: Local network latency negligible for development

## Future Improvements

1. **Production Deployment**:
   - Use Gunicorn/uWSGI for Flask instead of development server
   - Add API authentication/rate limiting
   - Implement request caching for repeated queries

2. **Model Updates**:
   - Version control for models
   - A/B testing framework
   - Online learning capabilities

3. **Monitoring**:
   - Prometheus metrics
   - Prediction quality tracking
   - Performance monitoring

4. **Data Pipeline**:
   - Automated weather data fetching
   - Real-time incident data integration
   - Feature store for consistent preprocessing
