# https://www.infoclimat.fr/opendata/?version=2&method=get&format=json&stations[]=ME099&start=2025-10-03&end=2025-10-05&token=auR9w0cYHsATD6WtazQ4ZHMqK0m9HvghPGxvdQ60KMkODb4d1e8bg

import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json

# Load API_KEYS
load_dotenv()

PRIM_API_KEY = os.getenv("PRIM_API_KEY")
if not PRIM_API_KEY:
    raise ValueError("PRIM_API_KEY not found in environment variables")

BASE_URL = "https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia/line_reports"

# Dates in format YYYY-MM-DD
def fetch_incident_data(start_date, end_date):
    headers = {
        "apiKey": PRIM_API_KEY
    }
    params = {
        "dept": 3, # highest depth
        "count": 100,
        "start_page": 0,
        "forbidden_uris": [],
        "disable_geojson": True, # we do not need geojson
        "since": start_date,
        "until": end_date,
        "tags": [], # we want all tags
        "language": "fr-FR"
    }

    metro_type = "/physical_modes/physical_mode:Metro"
    rer_type = "/physical_modes/physical_mode:RapidTransit"

    response = requests.get(f"{BASE_URL}/{rer_type}/line_reports", headers=headers, params=params)

    if response.status_code != 200:
        raise Exception(f"Error fetching data: {response.status_code} - {response.text}")
    
    return response.json()

# For testing & debugging
if __name__ == "__main__":
    today = datetime.now()
    end_date = today.strftime("%Y-%m-%d")
    start_date = (today - timedelta(days=365)).strftime("%Y-%m-%d")
    
    try:
        incident_data = fetch_incident_data(start_date, end_date)
        print(json.dumps(incident_data, indent=4))
    except Exception as e:
        print(f"An error occurred: {e}")