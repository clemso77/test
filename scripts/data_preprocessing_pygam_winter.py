import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import FunctionTransformer
from sklearn.preprocessing import MultiLabelBinarizer, OrdinalEncoder, LabelEncoder

df = pd.read_csv('./data/3_eda_dataset.csv')


"""
TARGET VARIABLE
"""

# Log transformation for 'DELAY' since the variance is very high
df['DELAY_LOG1P'] = np.log1p(df['DELAY'])
df = df.drop(columns=['DELAY'])

"""
TEMPORAL VARIABLES
"""

# LOCAL_TIME decomposing and cyclical encoding
df['LOCAL_TIME'] = pd.to_datetime(df['LOCAL_TIME'], format='%H:%M:%S').dt.time
df['LOCAL_TIME_HOUR'] = pd.to_datetime(df['LOCAL_TIME'], format='%H:%M:%S').dt.hour
df['LOCAL_TIME_MINUTE'] = pd.to_datetime(df['LOCAL_TIME'], format='%H:%M:%S').dt.minute
df = df.drop(columns=['LOCAL_TIME'])

# WEEK_DAY cyclical encoding
day_mapping = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
}
df['WEEK_DAY'] = df['WEEK_DAY'].map(day_mapping)


"""
NOMINAL CATEGORICAL VARIABLES
"""

# Drop not strictly numerical ROUTE values
strictly_numerical_route_filter = df['ROUTE'].astype(str).str.isdigit()
not_numerical_route_filter = ~strictly_numerical_route_filter
df = df.drop(index=df[not_numerical_route_filter].index)

# Transform WEATHER_ENG_DESC to a list of conditions
df['WEATHER_ENG_DESC_LIST'] = df['WEATHER_ENG_DESC'].str.split(',')
# Regroup weather conditions into broader categories
weather_map = {
    'Moderate Rain': 'Rain',
    'Freezing Rain': 'Rain',
    'Heavy Rain': 'Rain',
    'Freezing Fog': 'Fog',
    'Haze': 'Fog',
    'Moderate Snow': 'Snow'
}
df['WEATHER_ENG_DESC_LIST'] = df['WEATHER_ENG_DESC_LIST'].apply(
    lambda lst: [weather_map.get(condition, condition) for condition in lst]
)
# Drop the original WEATHER_ENG_DESC column
df = df.drop(columns=['WEATHER_ENG_DESC'])

# Create the season variable
def month_to_season(month):
    if month in [5, 6, 7, 8, 9]:
        return 'Summer'
    else:
        return 'Winter'
df['SEASON'] = df['LOCAL_MONTH'].apply(month_to_season)

# REMOVING SUMMER 
df = df[df['SEASON'] == 'Winter']
df = df.drop(columns=['SEASON'])

# List of nominal columns with no special transformation needed (all except WEATHER_ENG_DESC_LIST)
nominal_columns = [
    "ROUTE",
    "INCIDENT",
]

multi_label_columns = ['WEATHER_ENG_DESC_LIST']


"""
NUMERICAL VARIABLES
"""
# Transformation of the PRECIP_AMOUNT variable to binary presence/absence
df['PRECIP_AMOUNT_BINARY'] = df['PRECIP_AMOUNT'].apply(lambda x: 1 if x > 0 else 0)
df = df.drop(columns=['PRECIP_AMOUNT'])

# Transformation of the VISIBILITY variable to a categorical variable
def visibility_transformation(visibility):
    if 16 <= visibility:
        return "Great visibility"
    elif 12 <= visibility:
        return "Correct visibility"
    elif 8 <= visibility:
        return "Poor visibility"
    elif 4 <= visibility:
        return "Very poor visibility"
    else:
        return "No visibility"
df['VISIBILITY'] = df['VISIBILITY'].apply(visibility_transformation)
ordinal_columns = ['VISIBILITY']
ordinal_categories = [[
    "No visibility",
    "Very poor visibility",
    "Poor visibility",
    "Correct visibility",
    "Great visibility"
]]

# List of numerical columns with no special transformation needed
numerical_columns = [
    "TEMP",
    "DEW_POINT_TEMP",
    "HUMIDEX",
    "RELATIVE_HUMIDITY",
    "STATION_PRESSURE",
    "WIND_SPEED",
]


"""
PREPROCESSOR
"""
df = df.reset_index(drop=True)

class MultiLabelBinarizerWrapper(BaseEstimator, TransformerMixin):
    """Wrapper for MultiLabelBinarizer to work with ColumnTransformer."""
    
    def __init__(self):
        self.mlb = MultiLabelBinarizer()
    
    def fit(self, X, y=None):
        # X is a DataFrame column, extract the series
        self.mlb.fit(X.iloc[:, 0])
        return self
    
    def transform(self, X):
        # Transform and return as array
        return self.mlb.transform(X.iloc[:, 0])
    
    def get_feature_names_out(self, input_features=None):
        # Return feature names as numpy array - one name per class
        # Do NOT add prefix here, ColumnTransformer will handle it
        return np.array([str(cls) for cls in self.mlb.classes_])

# List of passthrough columns (cyclical encoded and binary features)
passthrough_columns = [
    "LOCAL_TIME_HOUR", 
    "LOCAL_TIME_MINUTE",
    "WEEK_DAY", 
    "LOCAL_MONTH",
    "LOCAL_DAY", 
    "WIND_DIRECTION",
    "PRECIP_AMOUNT_BINARY",
    *numerical_columns
]

def label_encode_columns(df):
    return df.apply(lambda x: pd.factorize(x)[0])

preprocessor = ColumnTransformer(
    transformers=[
        ("nominal", OrdinalEncoder(), nominal_columns),
        ("ordinal", OrdinalEncoder(categories=ordinal_categories), ordinal_columns),
        ("multi_label", MultiLabelBinarizerWrapper(), multi_label_columns),
        ("passthrough", "passthrough", passthrough_columns)    
    ],
    remainder="drop",
    verbose_feature_names_out=False,
)

# Clip the outliers
for col in numerical_columns:
    lower_bound = df[col].quantile(0.01)
    upper_bound = df[col].quantile(0.99)
    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)

features_processed = preprocessor.fit_transform(df.drop('DELAY_LOG1P', axis=1))
# Convert sparse matrix to dense array
if hasattr(features_processed, 'toarray'):
    features_processed = features_processed.toarray()
# Get the names of the processed features
column_names = preprocessor.get_feature_names_out()

# Verify the shape of the processed features
print(f"Total number of features after preprocessing: {len(column_names)}")
print(f"Real shape of processed features: {features_processed.shape}")

# Debug: Check each transformer's output
for name, transformer, columns in preprocessor.transformers_:
    if name != 'remainder':
        print(f"\n{name} transformer:")
        print(f"  Input columns: {columns}")
        transformed = transformer.transform(df[columns])
        print(f"  Output shape: {transformed.shape}")
        feature_names = transformer.get_feature_names_out(columns)
        print(f"  Feature names count: {len(feature_names)}")
        print(f"  Feature names sample: {feature_names[:5]}")


print(pd.DataFrame(features_processed).head())


processed_df = pd.DataFrame(features_processed, columns=column_names)
processed_df['DELAY_LOG1P'] = df['DELAY_LOG1P'].values

# Remove NaN values
processed_df = processed_df.dropna()

# Save the processed dataset
processed_df.to_csv('./data/4_preprocessed_dataset_pygam_winter.csv', index=False)