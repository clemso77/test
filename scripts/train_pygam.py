import pandas as pd
from sklearn.model_selection import train_test_split
from train_utils_pygam import *
from pygam import s, f

id=4 # id used to describe the model training scenario we are executing (see ./reports/training_results.md)

df = pd.read_csv('./data/4_preprocessed_dataset_pygam.csv')


# Split between train set, and the combined test and val sets
X_train, X_test_val, y_train, y_test_val = train_test_split(df.drop(columns=["DELAY_LOG1P"]), df["DELAY_LOG1P"], test_size=0.4)
# Split the test and val sets in their respective sets
X_val, X_test, y_val, y_test = train_test_split(X_test_val, y_test_val, test_size=0.5)

setValues(X_train, y_train, X_val, y_val, X_test, y_test)

#################
# Execute tests #
#################

generic_cols_transf = (
    f(0) +  # ROUTE - nominal
    f(1) +  # INCIDENT - nominal
    f(2) +  # SEASON - nominal
    s(3) +  # VISIBILITY - ordinal
    f(4) +  # Clear - binary
    f(5) +  # Fog - binary
    f(6) +  # Rain - binary
    f(7) +  # Snow - binary
    f(8) +  # Thunderstorms - binary
    s(9, basis="cp", edge_knots=[0, 24]) +  # LOCAL_TIME_HOUR - cyclical
    s(10, basis="cp", edge_knots=[0, 60]) +  # LOCAL_TIME_MINUTE - cyclical
    s(11, basis="cp", edge_knots=[0, 7]) +  # WEEK_DAY - cyclical
    s(12, basis="cp", edge_knots=[1, 12]) +  # LOCAL_MONTH - cyclical
    s(13, basis="cp", edge_knots=[1, 31]) +  # LOCAL_DAY - cyclical
    s(14, basis="cp", edge_knots=[0, 360]) +  # WIND_DIRECTION - cyclical
    f(15) +  # PRECIP_AMOUNT_BINARY - binary
    s(16) +  # TEMP - continuous
    s(17) +  # DEW_POINT_TEMP - continuous
    s(18) +  # HUMIDEX - continuous
    s(19) +  # RELATIVE_HUMIDITY - continuous
    s(20) +  # STATION_PRESSURE - continuous
    s(21)    # WIND_SPEED - continuous
)

# LinearGAM testing
test_model(id, "LinearGAM", generic_cols_transf, tune_params_linear_gam, create_linear_gam)
# GammaGAM testing
# test_model(id, "GammaGAM", generic_cols_transf, tune_params_gamma_gam, create_gamma_gam)
# PoissonGAM testing
# test_model(id, "PoissonGAM", generic_cols_transf, tune_params_poisson_gam, create_poisson_gam, n_trials=25)