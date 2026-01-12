import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import MultiLabelBinarizer, OrdinalEncoder, StandardScaler, OneHotEncoder, PowerTransformer
import joblib
from sklearn.metrics import r2_score
from sklearn.metrics import mean_absolute_error #  MAE
from sklearn.metrics import mean_squared_error  # RMSE

def cyclical_encoding(df, column, max_value):
    """Apply cyclical encoding to a single value."""
    num_col = pd.to_numeric(df[column])
    cos = np.cos(2 * np.pi * num_col / max_value).tolist()
    sin = np.sin(2 * np.pi * num_col / max_value).tolist()
    return cos, sin

class MultiLabelBinarizerWrapper(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.mlb = MultiLabelBinarizer()
    
    def fit(self, X, y=None):
        self.mlb.fit(X.iloc[:, 0])
        return self
    
    def transform(self, X):
        return self.mlb.transform(X.iloc[:, 0])
    
    def get_feature_names_out(self, input_features=None):
        return np.array([str(cls) for cls in self.mlb.classes_])

preprocessor = joblib.load('./models/preprocessor.pkl')

def preprocessing(data_row):
    df = pd.DataFrame([data_row])

    """
    TEMPORAL VARIABLES
    """

    # LOCAL_TIME decomposing and cyclical encoding
    df['LOCAL_TIME'] = pd.to_datetime(df['LOCAL_TIME'], format='%H:%M:%S').dt.time
    df['LOCAL_TIME_HOUR'] = pd.to_datetime(df['LOCAL_TIME'], format='%H:%M:%S').dt.hour
    df['LOCAL_TIME_MINUTE'] = pd.to_datetime(df['LOCAL_TIME'], format='%H:%M:%S').dt.minute
    df['LOCAL_TIME_HOUR_COS'], df['LOCAL_TIME_HOUR_SIN'] = cyclical_encoding(df, 'LOCAL_TIME_HOUR', 24)
    df['LOCAL_TIME_MINUTE_COS'], df['LOCAL_TIME_MINUTE_SIN'] = cyclical_encoding(df, 'LOCAL_TIME_MINUTE', 60)
    df = df.drop(columns=['LOCAL_TIME', 'LOCAL_TIME_HOUR', 'LOCAL_TIME_MINUTE'])

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
    df['WEEK_DAY_COS'], df['WEEK_DAY_SIN'] = cyclical_encoding(df, 'WEEK_DAY', 7)
    df = df.drop(columns=['WEEK_DAY'])

    # LOCAL_MONTH cyclical encoding, we drop thus variable later on because we still need it
    df['LOCAL_MONTH_COS'], df['LOCAL_MONTH_SIN'] = cyclical_encoding(df, 'LOCAL_MONTH', 12)

    # LOCAL_DAY cyclical encoding
    df['LOCAL_DAY_COS'], df['LOCAL_DAY_SIN'] = cyclical_encoding(df, 'LOCAL_DAY', 31)
    df = df.drop(columns=['LOCAL_DAY'])

    """
    NOMINAL CATEGORICAL VARIABLES
    """

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
    df = df.drop(columns=['LOCAL_MONTH'])

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
    
    # WIND_DIRECTION cyclical encoding
    df['WIND_DIRECTION_COS'], df['WIND_DIRECTION_SIN'] = cyclical_encoding(df, 'WIND_DIRECTION', 360)
    df = df.drop(columns=['WIND_DIRECTION'])

    features_processed = preprocessor.transform(df)
    return features_processed


def predict(data_row):
    model = joblib.load('./models/xgb_model.pkl')
    processed_row = preprocessing(data_row)
    print(processed_row)
    pred = model.predict(processed_row)
    return np.expm1(pred[0])

# Testing the predict function
if __name__ == "__main__":
    # Load CSV file
    csv_file = './data/3_eda_dataset.csv'
    df = pd.read_csv(csv_file).dropna()
    
    # Extract a random row
    random_row = df.sample(n=1).iloc[0].to_dict()
    
    # Test the predict function
    result = predict(random_row)
    print(f"Prediction: {result}, real : {random_row['DELAY_LOG1P']}")
    print(f"LOG1P prediction: {np.log1p(result)}, real : {np.log1p(random_row['DELAY_LOG1P'])}")

