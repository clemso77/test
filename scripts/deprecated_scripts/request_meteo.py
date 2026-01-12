# https://www.infoclimat.fr/opendata/?version=2&method=get&format=json&stations[]=ME099&start=2025-10-03&end=2025-10-05&token=auR9w0cYHsATD6WtazQ4ZHMqK0m9HvghPGxvdQ60KMkODb4d1e8bg

import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json

# Load API_KEYS
load_dotenv()

INFOCLIMAT_API_KEY = os.getenv("INFOCLIMAT_API_KEY")
if not INFOCLIMAT_API_KEY:
    raise ValueError("INFOCLIMAT_API_KEY not found in environment variables")

BASE_URL = "https://www.infoclimat.fr/opendata/"
STATION_ID = "ME099"  # Station [MAE] LATMOS - PARIS (13e), Ok for commercial and non-commercial use

# Dates in format YYYY-MM-DD
def fetch_weather_data(start_date, end_date):
    params = {
        "version": 2,
        "method": "get",
        "format": "json",
        "stations[]": STATION_ID,
        "start": start_date,
        "end": end_date,
        "token": INFOCLIMAT_API_KEY
    }
    
    response = requests.get(BASE_URL, params=params)
    
    if response.status_code != 200:
        raise Exception(f"Error fetching data: {response.status_code} - {response.text}")
    
    return response.json()

# For testing & debugging
if __name__ == "__main__":
    today = datetime.now()
    end_date = today.strftime("%Y-%m-%d")
    start_date = (today - timedelta(days=2)).strftime("%Y-%m-%d")
    
    try:
        weather_data = fetch_weather_data(start_date, end_date)
        print(json.dumps(weather_data, indent=4))
    except Exception as e:
        print(f"An error occurred: {e}")