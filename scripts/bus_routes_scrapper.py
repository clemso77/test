import os
import pandas as pd

COLORS_LOOKUP = {
    "bus": { "color": "#da251d", "text_color": "#ffffff" },
    "limited-bus": { "color": "#ffffff", "text_color": "#da251d" },
    "express-bus": { "color": "#eb6fbd", "text_color": "#ffffff" },
    "night-bus": { "color": "#fffffff", "text_color": "#024182" },
    "community-bus": { "color": "#ffffff", "text_color": "#8f8f8f" },
}

# Found by analyzing network requests on https://www.ttc.ca/routes-and-schedules/listroutes/bus
BUS_ROUTES_JSON = "./data/bus-routes/ttc-bus-routes-and-schedules.json"

OUTPUT_FILE = "./data/bus-routes/bus-routes-2023.csv"

def request_bus_routes():
    with open(BUS_ROUTES_JSON, 'r') as f:
        routes_json = pd.read_json(f)
    return routes_json

def save_routes_to_csv(routes_json):
    df = pd.DataFrame(columns=['Route', 'RouteName', 'Color', 'Text Color'])
    for _, route in routes_json.iterrows():
        if route['type'] != 700:
            print(f"Skipping non-bus route: {route['shortName']} ({route['type']})")
            continue  # Skip non-bus routes
        # We don't have data for routes with a letter in their name (ex: 191S and 984A)
        if not route['shortName'].isdigit():
            print(f"Skipping bus route variant: {route['shortName']} ({route['type']})")
            continue
        # Register the route
        styleKey = route['serviceLevel']['cssClassConnectingBus'] 
        if styleKey not in COLORS_LOOKUP:
            styleKey = "bus"  # Default to bus if unknown
        
        df = pd.concat([df, pd.DataFrame({
            'Route': [route['shortName']],
            'RouteName': [route['longName']],
            'Color': [COLORS_LOOKUP.get(styleKey, {}).get('color', '#000000')],
            'TextColor': [COLORS_LOOKUP.get(styleKey, {}).get('text_color', '#ffffff')],
        })], ignore_index=True)

    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Bus routes saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    routes = request_bus_routes()
    save_routes_to_csv(routes)