import pandas as pd
from sklearn.model_selection import train_test_split
from train_utils import *
from train_utils import create_xgboost
import joblib

df = pd.read_csv('./data/4_preprocessed_dataset.csv')


# Split between train set, and the combined test and val sets
X_train, X_test, y_train, y_test = train_test_split(df.drop(columns=["DELAY_LOG1P"]), df["DELAY_LOG1P"], test_size=0.2)

params = {
    "n_estimators": 1236,
    "learning_rate": 0.0313923876812973,
    "max_depth": 9,
    "min_child_weight": 6.014600609509807,
    "gamma": 2.6680304612895065,
    "max_delta_step": 3,
    "reg_alpha": 3.8071116085239384e-05,
    "reg_lambda": 0.0006293589732767163,
    "subsample": 0.8625686073282707,
    "colsample_bytree": 0.8422167488737703,
    "colsample_bylevel": 0.6524388161783657,
    "colsample_bynode": 0.7633436352327931,
    "booster": "gbtree"
}

print("Training XGBoost model with fixed parameters...")
xgb_model = create_xgboost(params)
xgb_model.fit(X_train, y_train)

print("Evaluating XGBoost model...")
y_pred = xgb_model.predict(X_test)

eval_model(y_test, y_pred)

# Save the model
joblib.dump(xgb_model, './models/xgb_model.pkl')

print("XGBoost model trained and exported to ./models/xgb_model.pkl")