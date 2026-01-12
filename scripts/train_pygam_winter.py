import pandas as pd
from sklearn.model_selection import train_test_split
from train_utils_pygam import *
from pygam import s, f

id=5 # id used to describe the model training scenario we are executing (see ./reports/training_results.md)

df = pd.read_csv('./data/4_preprocessed_dataset_pygam_winter.csv')


# Split between train set, and the combined test and val sets
X_train, X_test_val, y_train, y_test_val = train_test_split(df.drop(columns=["DELAY_LOG1P"]), df["DELAY_LOG1P"], test_size=0.2)
# Split the test and val sets in their respective sets
X_val, X_test, y_val, y_test = train_test_split(X_test_val, y_test_val, test_size=0.5)

setValues(X_train, y_train, X_val, y_val, X_test, y_test)

#################
# Execute tests #
#################

generic_cols_transf = (
    f(0) +  # ROUTE - nominal
    f(1) +  # INCIDENT - nominal
    s(2) +  # VISIBILITY - ordinal
    f(3) +  # Clear - binary
    f(4) +  # Fog - binary
    f(5) +  # Rain - binary
    f(6) +  # Snow - binary
    f(7) +  # Thunderstorms - binary
    s(8, basis="cp", edge_knots=[0, 24]) +  # LOCAL_TIME_HOUR - cyclical
    s(9, basis="cp", edge_knots=[0, 60]) +  # LOCAL_TIME_MINUTE - cyclical
    s(10, basis="cp", edge_knots=[0, 7]) +  # WEEK_DAY - cyclical
    s(11, basis="cp", edge_knots=[1, 12]) +  # LOCAL_MONTH - cyclical
    s(12, basis="cp", edge_knots=[1, 31]) +  # LOCAL_DAY - cyclical
    s(13, basis="cp", edge_knots=[0, 360]) +  # WIND_DIRECTION - cyclical
    f(14) +  # PRECIP_AMOUNT_BINARY - binary
    s(15) +  # TEMP - continuous
    s(16) +  # DEW_POINT_TEMP - continuous
    s(17) +  # HUMIDEX - continuous
    s(18) +  # RELATIVE_HUMIDITY - continuous
    s(19) +  # STATION_PRESSURE - continuous
    s(20)    # WIND_SPEED - continuous
)

# LinearGAM testing
test_model(id, "LinearGAM", generic_cols_transf, tune_params_linear_gam, create_linear_gam)
# GammaGAM testing
# test_model(id, "GammaGAM", generic_cols_transf, tune_params_gamma_gam, create_gamma_gam)
# PoissonGAM testing
# test_model(id, "PoissonGAM", generic_cols_transf, tune_params_poisson_gam, create_poisson_gam, n_trials=25)