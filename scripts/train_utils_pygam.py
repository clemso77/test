import optuna
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.metrics import r2_score
from sklearn.metrics import mean_absolute_error #  MAE
from sklearn.metrics import mean_squared_error  # RMSE
from sklearn.metrics import median_absolute_error # Erreur de la médiane absolue
from sklearn.model_selection import train_test_split
from pygam import LinearGAM, GammaGAM, PoissonGAM, InvGaussGAM

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
def create_objective_func(cols_transf, param_tuning_func, create_model_func):
    """
    Function used to generalize the criteria we are trying to optimize
    """
    def objective_func(trial):
        # generalized model tuning
        params = param_tuning_func(trial)
        # create model
        model = create_model_func(cols_transf, params)
        # fit the model
        model.fit(X_train, y_train)
        # predict values
        y_pred = model.predict(X_val)
        r2, mae, rmse = eval_model(y_val, y_pred)
        return rmse  # Optimize for RMSE
    return objective_func

def test_model(id, name, cols_transf, param_tuning_func, create_model_func, n_trials=100):
    """
    This function is a generalization of the optimisation of a model
    """
    study = optuna.create_study(direction="minimize", study_name=f"Delay prediction - {name}")
    # generalized objective func creation
    objective_func = create_objective_func(cols_transf, param_tuning_func, create_model_func)
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
    best_model = create_model_func(cols_transf, trial.params)
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

####################
# Test LinearGAM #
####################
def create_linear_gam(cols_transf, params):
    return LinearGAM(cols_transf, **params)

def tune_params_linear_gam(trial):
    n_splines = trial.suggest_int("n_splines", 5, 30)
    params = {
        "n_splines": n_splines,
        "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
        "max_iter": trial.suggest_int("max_iter", 100, 1000),
        "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
    }
    return params

###################
# Test GammaGAM #
###################
def create_gamma_gam(cols_transf, params):
    return GammaGAM(cols_transf, **params)

def tune_params_gamma_gam(trial):
    params = {
        "n_splines": trial.suggest_int("n_splines", 5, 30),
        "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
        "max_iter": trial.suggest_int("max_iter", 100, 1000),
        "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
    }
    return params

####################
# Test PoissonGAM #
####################
def create_poisson_gam(cols_transf, params):
    return PoissonGAM(**params)

def tune_params_poisson_gam(trial):
    params = {
        "n_splines": trial.suggest_int("n_splines", 5, 30),
        "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
        "max_iter": trial.suggest_int("max_iter", 100, 1000),
        "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
    }
    return params
