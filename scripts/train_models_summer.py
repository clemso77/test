import pandas as pd
from sklearn.model_selection import train_test_split
from train_utils import *


id=3 # id used to describe the model training scenario we are executing (see ./reports/training_results.md)

df = pd.read_csv('./data/4_preprocessed_dataset_summer.csv')

# Split between train set, and the combined test and val sets
X_train, X_test_val, y_train, y_test_val = train_test_split(df.drop(columns=["DELAY_LOG1P"]), df["DELAY_LOG1P"], test_size=0.4)
# Split the test and val sets in their respective sets
X_val, X_test, y_val, y_test = train_test_split(X_test_val, y_test_val, test_size=0.5)

setValues(X_train, y_train, X_val, y_val, X_test, y_test)

#################
# Execute tests #
#################

# Decision Tree testing
# test_model(id, "Decision Tree", tune_params_decision_tree, create_decision_tree)
# Linear Regression testing
# test_model(id, "Linear Regression (classical)", tune_params_linear_regression, create_linear_regression, n_trials=4)
# Linear Regression Elasticnet testing
# test_model(id, "Linear Regression (Elasticnet)", tune_params_linear_regression_elasticnet, create_linear_regression_elasticnet)
# Random Forest testing (very slow)
# test_model(id, "Random Forest", tune_params_random_forest, create_random_forest, n_trials=5)
# Gradient Boosting testing
# test_model(id, "Gradient Boosting", tune_params_gradient_boosting, create_gradient_boosting)
# XGBoost testing
# test_model(id, "XGBoost", tune_params_xgboost, create_xgboost)
# SVR testing (very slow)
test_model(id, "SVR", tune_params_svr, create_svr, n_trials=5)