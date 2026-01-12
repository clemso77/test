import os
import pandas as pd


# List of years to process
YEARS = [2023]

# Path to files
PATH = "./data/climate/"

# List of files to merge
FILES_TO_MERGE = ["climate-hourly-p1.csv", "climate-hourly-p2.csv"]

def retreive_relevant_year_data_in_file(filename, year):
    """Retrieve data for a specific year from a CSV file."""
    file_path = os.path.join(PATH, filename)
    if os.path.exists(file_path):
        print(f"Processing file: {file_path} for year: {year}")
        df = pd.read_csv(file_path)
        # Filter rows for the specified year
        df_filtered = df[df['LOCAL_YEAR'] == year]
        return df_filtered
    else:
        print(f"File {file_path} does not exist.")
        return pd.DataFrame()

def combine_files_by_year(year):
    df_year = pd.DataFrame()
    for file in FILES_TO_MERGE:
        df_filtered = retreive_relevant_year_data_in_file(file, year)
        df_year = pd.concat([df_year, df_filtered], ignore_index=True)
    return df_year

def combine_and_save():
    df_combined = pd.DataFrame()
    for year in YEARS:
        df_year = combine_files_by_year(year)
        df_combined = pd.concat([df_combined, df_year], ignore_index=True)

    output_file = os.path.join(PATH, f"climate-hourly-{'-'.join(map(str, YEARS))}.csv")
    df_combined.to_csv(output_file, index=False)
    print(f"Combined data for years {'-'.join(map(str, YEARS))} saved to {output_file}")

if __name__ == "__main__":
    print(f"Current path: {os.getcwd()}")
    combine_and_save()