import os
import numpy as np
import pandas as pd
import joblib
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import MultiLabelBinarizer

def cyclical_encoding(df, column, max_value):
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

current_dir = os.path.dirname(os.path.abspath(__file__))
preprocessor = None
model = None

def get_preprocessor():
    global preprocessor
    if preprocessor is None:
        preprocessor = joblib.load(os.path.join(current_dir, 'preprocessor.pkl'))
    return preprocessor

def get_model():
    global model
    if model is None:
        model = joblib.load(os.path.join(current_dir, 'xgb_model.pkl'))
    return model

def preprocessing(data_row):
    df = pd.DataFrame([data_row])

    df['LOCAL_TIME'] = pd.to_datetime(df['LOCAL_TIME'], format='%H:%M:%S').dt.time
    df['LOCAL_TIME_HOUR'] = pd.to_datetime(df['LOCAL_TIME'], format='%H:%M:%S').dt.hour
    df['LOCAL_TIME_MINUTE'] = pd.to_datetime(df['LOCAL_TIME'], format='%H:%M:%S').dt.minute
    df['LOCAL_TIME_HOUR_COS'], df['LOCAL_TIME_HOUR_SIN'] = cyclical_encoding(df, 'LOCAL_TIME_HOUR', 24)
    df['LOCAL_TIME_MINUTE_COS'], df['LOCAL_TIME_MINUTE_SIN'] = cyclical_encoding(df, 'LOCAL_TIME_MINUTE', 60)
    df = df.drop(columns=['LOCAL_TIME', 'LOCAL_TIME_HOUR', 'LOCAL_TIME_MINUTE'])

    day_mapping = {
        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
        'Friday': 4, 'Saturday': 5, 'Sunday': 6
    }
    df['WEEK_DAY'] = df['WEEK_DAY'].map(day_mapping)
    df['WEEK_DAY_COS'], df['WEEK_DAY_SIN'] = cyclical_encoding(df, 'WEEK_DAY', 7)
    df = df.drop(columns=['WEEK_DAY'])

    df['LOCAL_MONTH_COS'], df['LOCAL_MONTH_SIN'] = cyclical_encoding(df, 'LOCAL_MONTH', 12)

    df['LOCAL_DAY_COS'], df['LOCAL_DAY_SIN'] = cyclical_encoding(df, 'LOCAL_DAY', 31)
    df = df.drop(columns=['LOCAL_DAY'])

    df['WEATHER_ENG_DESC_LIST'] = df['WEATHER_ENG_DESC'].str.split(',')
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
    df = df.drop(columns=['WEATHER_ENG_DESC'])

    def month_to_season(month):
        return 'Summer' if month in [5, 6, 7, 8, 9] else 'Winter'
    
    df['SEASON'] = df['LOCAL_MONTH'].apply(month_to_season)
    df = df.drop(columns=['LOCAL_MONTH'])

    df['PRECIP_AMOUNT_BINARY'] = df['PRECIP_AMOUNT'].apply(lambda x: 1 if x > 0 else 0)
    df = df.drop(columns=['PRECIP_AMOUNT'])

    def visibility_transformation(visibility):
        if visibility >= 16:
            return 'Great visibility'
        elif visibility >= 12:
            return 'Correct visibility'
        elif visibility >= 8:
            return 'Poor visibility'
        elif visibility >= 4:
            return 'Very poor visibility'
        else:
            return 'No visibility'
    
    df['VISIBILITY'] = df['VISIBILITY'].apply(visibility_transformation)
    
    df['WIND_DIRECTION_COS'], df['WIND_DIRECTION_SIN'] = cyclical_encoding(df, 'WIND_DIRECTION', 360)
    df = df.drop(columns=['WIND_DIRECTION'])

    features_processed = get_preprocessor().transform(df)
    return features_processed

def predict(data_row):
    processed_row = preprocessing(data_row)
    pred = get_model().predict(processed_row)
    return np.expm1(pred[0])
