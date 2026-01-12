# PR - Predictive system for the delay in public transports

## Running the Prediction System

The prediction system consists of two components:

1. **Python Prediction API**: Machine learning model served via Flask API
2. **TypeScript Backend**: Express.js backend that integrates with the prediction API

### Starting the Prediction API

```bash
# Navigate to models directory
cd models

# Install dependencies
pip install -r requirements.txt

# Start the Flask API (runs on port 5000 by default)
python prediction_api.py
```

### Starting the Backend

```bash
# Navigate to backend directory
cd app/backend

# Install dependencies (if not already installed)
npm install

# Start the backend (runs on port 3000 by default)
npm start
```

### Using the Prediction Endpoint

Once both services are running, you can make predictions:

```bash
curl -X POST http://localhost:3000/lines/91/prediction \
  -H "Content-Type: application/json" \
  -d '{
    "LOCAL_TIME": "14:30:00",
    "WEEK_DAY": "Monday",
    "INCIDENT": "External",
    "LOCAL_MONTH": 1,
    "LOCAL_DAY": 15,
    "TEMP": 5.0,
    "DEW_POINT_TEMP": 2.0,
    "HUMIDEX": 3.5,
    "PRECIP_AMOUNT": 0.0,
    "RELATIVE_HUMIDITY": 75.0,
    "STATION_PRESSURE": 101.3,
    "VISIBILITY": 15.0,
    "WEATHER_ENG_DESC": "Clear",
    "WIND_DIRECTION": 180.0,
    "WIND_SPEED": 10.0
  }'
```

For more details on the prediction API, see [models/README.md](models/README.md).

## Datasources

| Name | Data | Type | Source | Date | Additionnal info |
|------|------|------|--------|------|------------------|
| TTC Delays and Routes 2023 | Toronto's bus delays in 2023 | Dataset | [Kaggle 2023] | 2025-10-15 | |
| Toronto Bus Delay 2022 | Toronto's bus delays in  2022 | Dataset | [Kaggle 2022] | 2025-10-15 | Different name but same data as 2023 |
| Hourly climate data | Canadian weather reports | Dataset | [Government of Canada] | 2025-10-15 | Used station of id : 6158359 , records 110,001 (july 2022) through 130,000 (october 2024) |
| TTC Routes & Shedules | Name and ID of the bus routes | Dataset | [TTC] | 2025-10-15 | The website doesn't provide any info but by surveilling the network activity we found the API for our data : [TTC API] |

<!-- Links to cleanup the md code -->
[Kaggle 2023]: https://www.kaggle.com/datasets/karmansinghbains/ttc-delays-and-routes-2023
[Kaggle 2022]: https://www.kaggle.com/datasets/reihanenamdari/toronto-bus-delay-2022
[Government of Canada]: https://climate-change.canada.ca/climate-data/#/hourly-climate-data
[TTC]: https://www.ttc.ca/routes-and-schedules/listroutes/bus
[TTC API]: https://www.ttc.ca/ttcapi/routedetail/listroutes

## Explored datasources

| Name | Data | Type | Source | Date |
|------|------|------|--------|------|
| PRIM - Traffic Info Messages (v2) | Current, upcoming and past disruption info | API | [PRIM API] | 2025-10-05 |
| INFOCLIMAT - Weather data | Current and past weather data | API | [INFOCLIMAT API] | 2025-10-05 |

<!-- Links to cleanup the md code -->
[PRIM API]: https://prim.iledefrance-mobilites.fr/en/apis/idfm-navitia-line_reports-v2
[INFOCLIMAT API]: https://www.infoclimat.fr/opendata/

> PRIM - Traffic Info Messages (v2) seems to be still in development, we only have elevator incidents for metro and RER

## Current problems - to adress to M. Alaya

* No entries for december
* Unsure of how to handle windchill
* Handling bimodality : `TEMP`, `DEW_POINT_TEMP`
