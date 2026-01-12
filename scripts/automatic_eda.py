import pandas as pd
from ydata_profiling import ProfileReport

df = pd.read_csv("./data/3_eda_dataset.csv", low_memory=False)
profile = ProfileReport(df, title="Profiling Report")
profile.to_file("./reports/ydata_eda_report.html")
