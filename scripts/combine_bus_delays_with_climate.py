import os
import pandas as pd

CLIMATE_FILE = "./data/climate/climate-hourly-2023.csv"
BUS_DELAYS_FILE = "./data/bus-delay/ttc-bus-delay-data-2023.csv"
OUTPUT_FILE = "./data/raw_dataset.csv"

def convert_bus_datetime_to_climate_date(date, time):
    # First we create a datetime object from the bus date and time
    datetime_str = f"{date} {time}"
    datetime_obj = pd.to_datetime(datetime_str, format="%d-%b-%y %H:%M")
    # Then we round the datetime object to the nearest hour
    rounded_datetime = datetime_obj.round('h')
    return rounded_datetime.strftime("%Y-%m-%d %H:%M:00")

def merged_bus_delays_with_climate():
    # Load the data
    climate_df = pd.read_csv(CLIMATE_FILE)
    bus_df = pd.read_csv(BUS_DELAYS_FILE)
    # Create output df based on bus df
    output_df = bus_df.copy()
    # Create a new column in the output dataframe with the rounded datetime
    output_df['Climate Date Merge'] = output_df.apply(lambda row: convert_bus_datetime_to_climate_date(row['Date'], row['Time']), axis=1)
    # Merge the two dataframes on the rounded datetime
    merged_df = pd.merge(output_df, climate_df, left_on='Climate Date Merge', right_on='LOCAL_DATE', how='left')
    # Remove the 'Climate Date Merge' column
    merged_df.drop(columns=['Climate Date Merge'], inplace=True)
    # Save the merged dataframe to a new CSV file
    merged_df.to_csv(OUTPUT_FILE, index=False)
    print(f"Merged dataset saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    merged_bus_delays_with_climate()