import optuna
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.metrics import r2_score
from sklearn.metrics import mean_absolute_error #  MAE
from sklearn.metrics import mean_squared_error  # RMSE
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import ElasticNet, LinearRegression, MultiTaskLasso
from sklearn.svm import SVR
from xgboost import XGBRegressor

def eval_model(y, y_pred):
    r2 = r2_score(y, y_pred)
    mae = mean_absolute_error(y, y_pred)
    rmse = mean_squared_error(y, y_pred)
    print(f"R2 : {r2:.4f} (the higher the better)")
    print(f"MAE : {mae:.4f} (the lower the better)")
    print(f"RMSE : {rmse:.4f} (the lower the better)")
    return  r2, mae, rmse

X_train, y_train, X_val, y_val, X_test, y_test = pd.DataFrame(), pd.Series(), pd.DataFrame(), pd.Series(), pd.DataFrame(), pd.Series()

def setValues(X_tr, y_tr, X_v, y_v, X_te, y_te):
    """
    Function used to set the global variables for train, validation and test sets
    """
    global X_train, y_train, X_val, y_val, X_test, y_test
    X_train, y_train = X_tr, y_tr
    X_val, y_val = X_v, y_v
    X_test, y_test = X_te, y_te

########################
# Start testing models #
########################
def create_objective_func(param_tuning_func, create_model_func):
    """
    Function used to generalize the criteria we are trying to optimize
    """
    def objective_func(trial):
        # generalized model tuning
        params = param_tuning_func(trial)
        # create model
        model = create_model_func(params)
        # fit the model
        model.fit(X_train, y_train)
        # predict values
        y_pred = model.predict(X_val)
        r2, mae, rmse = eval_model(y_val, y_pred)
        return rmse  # Optimize for R2
    return objective_func

def test_model(id, name, param_tuning_func, create_model_func, n_trials=100):
    """
    This function is a generalization of the optimisation of a model
    """
    study = optuna.create_study(direction="minimize", study_name=f"Delay prediction - {name}")
    # generalized objective func creation
    objective_func = create_objective_func(param_tuning_func, create_model_func)
    # hyperoptimization
    study.optimize(objective_func, n_trials=n_trials)
    # show best hyperparameters & trial
    print(f"{name} - Best trial:")
    trial = study.best_trial
    print(f"  Value: {trial.value}")
    print("  Params: ")
    for key, value in trial.params.items():
        print(f"    {key}: {value}")
    # recreate best model
    best_model = create_model_func(trial.params)
    best_model.fit(X_train, y_train)
    # get best model predictions
    y_pred = best_model.predict(X_test)
    # get evaluation
    eval_model(y_test, y_pred)
    # plotting results
    plt.figure(figsize=(6,6))
    sns.scatterplot(x=y_test, y=y_pred, alpha=0.6)
    plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
    plt.xlabel('Actual values')
    plt.ylabel('Predicted values')
    plt.title(f'{name} - Predicted vs Actual Delay (R² = {r2_score(y_test, y_pred):.3f})')
    plt.savefig(f'./reports/{id}/{name}-scatterplot.png')

######################
# Test Decision Tree #
######################
def create_decision_tree(params):
    return DecisionTreeRegressor(**params)

def tune_params_decision_tree(trial):
    params = {
        "criterion": trial.suggest_categorical("criterion", ["squared_error", "friedman_mse", "absolute_error", "poisson"]),
        "splitter": trial.suggest_categorical("splitter", ["best", "random"]),
        "max_depth": trial.suggest_int("max_depth", 1, 50),
        "min_samples_split": trial.suggest_int("min_samples_split", 2, 20),
        "min_samples_leaf": trial.suggest_int("min_samples_leaf", 1, 20),
        "min_weight_fraction_leaf": trial.suggest_float("min_weight_fraction_leaf", 0.0, 0.5),
        "max_features": trial.suggest_categorical("max_features", [None, "sqrt", "log2"]),
        "max_leaf_nodes": trial.suggest_int("max_leaf_nodes", 2, 1000),
        "min_impurity_decrease": trial.suggest_float("min_impurity_decrease", 0.0, 1.0),
        "ccp_alpha": trial.suggest_float("ccp_alpha", 0.0, 0.1),
    }
    return params

######################################
# Test Linear Regression (classical) #
######################################
def create_linear_regression(params):
    return LinearRegression(**params)

def tune_params_linear_regression(trial):
    params = {
        "fit_intercept": trial.suggest_categorical("fit_intercept", [True, False]),
        "copy_X": True, 
        "positive": trial.suggest_categorical("positive", [True, False]),
    }
    return params

###########################################
# Test Linear Regression (Elasticnet) #
###########################################
def create_linear_regression_elasticnet(params):
    return ElasticNet(**params)

def tune_params_linear_regression_elasticnet(trial):
    params = {
        "alpha": trial.suggest_float("alpha", 1e-6, 10.0, log=True),
        "l1_ratio": trial.suggest_float("l1_ratio", 0.0, 1.0),
        "fit_intercept": trial.suggest_categorical("fit_intercept", [True, False]),
        "max_iter": trial.suggest_int("max_iter", 500, 5000),
        "tol": trial.suggest_float("tol", 1e-6, 1e-2, log=True),
        "selection": trial.suggest_categorical("selection", ["cyclic", "random"])
    }
    return params

######################
# Test Random Forest #
######################
def create_random_forest(params):
    return RandomForestRegressor(**params, n_jobs=1)

def tune_params_random_forest(trial):
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 50, 600),
        "criterion": trial.suggest_categorical(
            "criterion", ["squared_error", "absolute_error", "friedman_mse", "poisson"]
        ),
        "max_depth": trial.suggest_int("max_depth", 2, 40),
        "min_samples_split": trial.suggest_int("min_samples_split", 2, 20),
        "min_samples_leaf": trial.suggest_int("min_samples_leaf", 1, 20),
        "min_weight_fraction_leaf": trial.suggest_float("min_weight_fraction_leaf", 0.0, 0.5),
        "max_features": trial.suggest_categorical(
            "max_features", ["sqrt", "log2", None]
        ),
        "max_leaf_nodes": trial.suggest_int("max_leaf_nodes", 100, 5000),
        "min_impurity_decrease": trial.suggest_float("min_impurity_decrease", 0.0, 1.0),
        "bootstrap": trial.suggest_categorical("bootstrap", [True, False]),
        "oob_score":trial.suggest_categorical("oob_score", [True, False]),
        "ccp_alpha": trial.suggest_float("ccp_alpha", 0.0, 0.1)
    }
    if params["bootstrap"] is False:
        params["oob_score"] = False
    return params

##########################
# Test Gradient Boosting #
##########################
def create_gradient_boosting(params):
    return GradientBoostingRegressor(**params)

def tune_params_gradient_boosting(trial):
    params = {
        "loss": trial.suggest_categorical(
            "loss", ["squared_error", "absolute_error", "huber", "quantile"]
        ),
        "learning_rate": trial.suggest_float("learning_rate", 0.001, 0.3, log=True),
        "n_estimators": trial.suggest_int("n_estimators", 50, 800),
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "criterion": trial.suggest_categorical(
            "criterion", ["friedman_mse", "squared_error"]
        ),
        "min_samples_split": trial.suggest_int("min_samples_split", 2, 20),
        "min_samples_leaf": trial.suggest_int("min_samples_leaf", 1, 20),
        "min_weight_fraction_leaf": trial.suggest_float("min_weight_fraction_leaf", 0.0, 0.3),
        "max_depth": trial.suggest_int("max_depth", 2, 10),
        "max_features": trial.suggest_categorical(
            "max_features", ["sqrt", "log2", None]
        ),
        "min_impurity_decrease": trial.suggest_float("min_impurity_decrease", 0.0, 1.0),
        "alpha": trial.suggest_float("alpha", 0.01, 0.99),  # used for quantile/huber losses
    }
    return params


################
# Test XGBoost #
################
def create_xgboost(params):
    return XGBRegressor(**params)

def tune_params_xgboost(trial):
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 200, 1500),
        "learning_rate": trial.suggest_float("learning_rate", 1e-4, 0.3, log=True),
        # Tree parameters
        "max_depth": trial.suggest_int("max_depth", 2, 12),
        "min_child_weight": trial.suggest_float("min_child_weight", 1e-3, 10.0, log=True),
        "gamma": trial.suggest_float("gamma", 0.0, 10.0),
        "max_delta_step": trial.suggest_int("max_delta_step", 0, 10),
        # Regularization
        "reg_alpha": trial.suggest_float("reg_alpha", 1e-8, 10.0, log=True),
        "reg_lambda": trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),
        # Subsampling
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "colsample_bylevel": trial.suggest_float("colsample_bylevel", 0.5, 1.0),
        "colsample_bynode": trial.suggest_float("colsample_bynode", 0.5, 1.0),
        # Booster & misc.
        "booster": trial.suggest_categorical("booster", ["gbtree"]),#, "dart"]),
        "tree_method": "auto",
        "random_state": 99,
        "n_jobs": -1,
    }
    # DART-specific parameters
    if params["booster"] == "dart":
        params.update({
            "sample_type": trial.suggest_categorical("sample_type", ["uniform", "weighted"]),
            "normalize_type": trial.suggest_categorical("normalize_type", ["tree", "forest"]),
            "rate_drop": trial.suggest_float("rate_drop", 0.0, 0.3),
            "skip_drop": trial.suggest_float("skip_drop", 0.0, 0.7),
        })
    return params

########################################
# Test Support Vector Regression (SVR) #
########################################
def create_svr(params):
    # if too slow, switch to LinearSVR
    return SVR(**params)

def tune_params_svr(trial):
    # Choose kernel first
    kernel = trial.suggest_categorical("kernel", ["rbf", "poly", "sigmoid", "linear"])
    params = {
        "kernel": kernel,
        "C": trial.suggest_float("C", 1e-3, 1e3, log=True),
        "epsilon": trial.suggest_float("epsilon", 1e-4, 1.0, log=True),
        "shrinking": trial.suggest_categorical("shrinking", [True, False]),
        "gamma": trial.suggest_categorical("gamma", ["scale", "auto"]),
    }
    # Kernel-specific parameters
    if kernel == "poly":
        params["degree"] = trial.suggest_int("degree", 2, 5)
        params["coef0"] = trial.suggest_float("coef0", 0.0, 1.0)
    elif kernel == "sigmoid":
        params["coef0"] = trial.suggest_float("coef0", 0.0, 1.0)
    return params
