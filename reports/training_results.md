# Training results

## Scenario 1 model testing

* Train (60%)/Validation (20%)/Test (20%) split with Train for training models, Validation for hyperparameters optimisation and Test for final testing
* Season variable created (Summer/Winter)
* ALL NAN VALUES REMOVED
* Target is transformed by LOG1P
* Following transformations

```py
('yeo_johnson', PowerTransformer(method='yeo-johnson'), yeo_johnson_columns),
('numerical', StandardScaler(), numerical_columns),
('nominal', OneHotEncoder(), nominal_columns),
('ordinal', OrdinalEncoder(categories=ordinal_categories), ordinal_columns),
('multi_label', MultiLabelBinarizerWrapper(), multi_label_columns),
('passthrough', 'passthrough', passthrough_columns)
```

With : 
* `yeo_johnson_columns`: None
* `numerical_columns`: TEMP, DEW_POINT_TEMP, HUMIDEX, RELATIVE_HUMIDITY, STATION_PRESSURE, WIND_SPEED
* `nominal_columns`: ROUTE, INCIDENT, SEASON
* `ordinal_columns`: VISIBILITY
* `multi_label_columns`: WEATHER_ENG_DESC_LIST
* `passthrough_columns`: LOCAL_TIME_HOUR_COS, LOCAL_TIME_HOUR_SIN, LOCAL_TIME_MINUTE_COS, LOCAL_TIME_MINUTE_SIN, WEEK_DAY_COS, WEEK_DAY_SIN, LOCAL_MONTH_COS, LOCAL_MONTH_SIN, LOCAL_DAY_COS, LOCAL_DAY_SIN, WIND_DIRECTION_COS, WIND_DIRECTION_SIN, PRECIP_AMOUNT_BINARY

We are trying to minimise the **RMSE** with optuna on **100 trials** except for `Random Forest` and `SVR` (too slow to hyperoptimise on 100 trials).

### Decision Tree

**Parameters :**

```py
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
```
**Results :** 

```py
params = {
    "criterion": "friedman_mse",
    "splitter": "random",
    "max_depth": 31,
    "min_samples_split": 6,
    "min_samples_leaf": 11,
    "min_weight_fraction_leaf": 0.00014557343303502968,
    "max_features": None,
    "max_leaf_nodes": 861,
    "min_impurity_decrease": 0.004493554362112649
}
```

* **R2 :** 0.2289
* **MAE :** 0.5594
* **RMSE :** 0.7146

### Linear Regression (classical)

> Since only 4 cases are needed, only 4 trials are ran

```py
params = {
    "copy_X": True, 
    "fit_intercept": trial.suggest_categorical("fit_intercept", [True, False]),
    "positive": trial.suggest_categorical("positive", [True, False]),
}
```
**Results :** 

```py
params = {
    "fit_intercept": False,
    "positive": True
}
```

* **R2 :** 0.2921 
* **MAE :** 0.4898 maximize
* **RMSE :** 0.6560 

### Linear Regression (Elasticnet)

```py
params = {
    "alpha": trial.suggest_float("alpha", 1e-6, 10.0, log=True),
    "l1_ratio": trial.suggest_float("l1_ratio", 0.0, 1.0),
    "fit_intercept": trial.suggest_categorical("fit_intercept", [True, False]),
    "max_iter": trial.suggest_int("max_iter", 500, 5000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-2, log=True),
    "selection": trial.suggest_categorical("selection", ["cyclic", "random"])
}
```
**Results :** 

```py
params = {
    "alpha": 5.68224695093307e-05,
    "l1_ratio": 0.5124624176875617,
    "fit_intercept": False,
    "max_iter": 1891,
    "tol": 0.0027704838849413305,
    "selection": "cyclic"
}
```

* **R2 :** 0.2948 
* **MAE :** 0.4902 
* **RMSE :** 0.6535 

### Random Forest

> Did not execute 100 trials due to extremely long execution times. We executed only 10 tests with the following parameters.

**Parameters :**

```py
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
    "oob_score": trial.suggest_categorical("oob_score", [False, True]),
    "ccp_alpha": trial.suggest_float("ccp_alpha", 0.0, 0.1)
}
```

**Results :** 

```py
params = {
    "n_estimators": 149,
    "criterion": "friedman_mse",
    "max_depth": 23,
    "min_samples_split": 8,
    "min_samples_leaf": 20,
    "min_weight_fraction_leaf": 0.007770028157936426,
    "max_features": "sqrt",
    "max_leaf_nodes": 798,
    "min_impurity_decrease": 0.7201417309527923,
    "bootstrap": True,
    "oob_score": True,
    "ccp_alpha": 0.06497372551826268
}
```

* **R2 : 0.0140**
* **MAE : 0.6220** 
* **RMSE : 0.9137** 

### Gradient Boosting

**Parameters :**

```py
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
```

**Results :** 

```py
params = {
    "loss": "huber",
    "learning_rate": 0.03471075642674359,
    "n_estimators": 540,
    "subsample": 0.8855618217015933,
    "criterion": "friedman_mse",
    "min_samples_split": 15,
    "min_samples_leaf": 10,
    "min_weight_fraction_leaf": 0.00011386163288458159,
    "max_depth": 9,
    "max_features": None,
    "min_impurity_decrease": 0.6129026132279136,
    "alpha": 0.8665875204701363
}
```

* **R2 :** 0.3002 
* **MAE :** 0.4465 
* **RMSE :** 0.6485

### Extreme Gradient Boosting

**Parameters :**

> We chose not to use dart booster since it created more issues in the long run

```py
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
    "reg_beta": trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),
    # Subsampling
    "subsample": trial.suggest_float("subsample", 0.5, 1.0),
    "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
    "colsample_bylevel": trial.suggest_float("colsample_bylevel", 0.5, 1.0),
    "colsample_bynode": trial.suggest_float("colsample_bynode", 0.5, 1.0),
    # Booster & misc.
    "booster": trial.suggest_categorical("booster", ["gbtree"]),
    "tree_method": "auto",
    "random_state": 99,
    "n_jobs": -1,
}
```

**Results :** 

```py
params = {
    "n_estimators": 1176,
    "learning_rate": 0.018310088659669047,
    "max_depth": 10,
    "min_child_weight": 0.2433298670322095,
    "gamma": 1.081134221399496,
    "max_delta_step": 3,
    "reg_alpha": 7.084876626164422e-05,
    "reg_lambda": 9.599288655044234,
    "subsample": 0.6606285902180087,
    "colsample_bytree": 0.604577745827854,
    "colsample_bylevel": 0.9379922099663431,
    "colsample_bynode": 0.540463702894869,
    "booster": "gbtree"
}
```

* **R2 :** 0.3296
* **MAE :** 0.4746
* **RMSE :** 0.6212

> Test with r² maximisation
>```py
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
```
> * **R2 :** 0.3365
> * **MAE :** 0.4695
> * **RMSE :** 0.5995

### Support Vector Regression (SVR)

> Did not execute 100 trials due to extremely long execution times. We executed only 5 tests with the following parameters.

**Parameters :**

```py
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
```

**Results :** 

```py
params = {
    "kernel": "rbf",
    "C": 0.9172634807099763,
    "epsilon": 0.022277307122931626,
    "shrinking": False,
    "gamma": "scale"
}
```

* **R2 : 0.2601** 
* **MAE : 0.4451** 
* **RMSE : 0.6857** 

## Scenario 2 model testing - Winter data only

* Train (40%)/Validation (30%)/Test (30%) split with Train for training models, Validation for hyperparameters optimisation and Test for final testing
* Only winter data
* Target is transformed by LOG1P
* Following transformations

```py
('yeo_johnson', PowerTransformer(method='yeo-johnson'), yeo_johnson_columns),
('numerical', StandardScaler(), numerical_columns),
('nominal', OneHotEncoder(), nominal_columns),
('ordinal', OrdinalEncoder(categories=ordinal_categories), ordinal_columns),
('multi_label', MultiLabelBinarizerWrapper(), multi_label_columns),
('passthrough', 'passthrough', passthrough_columns)
```

With : 
* `yeo_johnson_columns`: None
* `numerical_columns`: TEMP, DEW_POINT_TEMP, HUMIDEX, RELATIVE_HUMIDITY, STATION_PRESSURE, WIND_SPEED
* `nominal_columns`: ROUTE, INCIDENT
* `ordinal_columns`: VISIBILITY
* `multi_label_columns`: WEATHER_ENG_DESC_LIST
* `passthrough_columns`: LOCAL_TIME_HOUR_COS, LOCAL_TIME_HOUR_SIN, LOCAL_TIME_MINUTE_COS, LOCAL_TIME_MINUTE_SIN, WEEK_DAY_COS, WEEK_DAY_SIN, LOCAL_MONTH_COS, LOCAL_MONTH_SIN, LOCAL_DAY_COS, LOCAL_DAY_SIN, WIND_DIRECTION_COS, WIND_DIRECTION_SIN, PRECIP_AMOUNT_BINARY

We are trying to minimise the **RMSE** with optuna on **100 trials** except for `Random Forest` and `SVR` (too slow to hyperoptimise on 100 trials).

### Decision Tree

**Parameters :**

```py
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
```
**Results :** 

```py
params = {
    "criterion": "friedman_mse",
    "splitter": "random",
    "max_depth": 40,
    "min_samples_split": 5,
    "min_samples_leaf": 15,
    "min_weight_fraction_leaf": 0.0003194808485743293,
    "max_features": None,
    "max_leaf_nodes": 886,
    "min_impurity_decrease": 0.4983751874061905,
    "ccp_alpha": 0.0062804080152011445
}
```

* **R2 :** 0.1957
* **MAE :** 0.5746
* **RMSE :** 0.7482

### Linear Regression (classical)

> Since only 4 cases are needed, only 4 trials are ran

```py
params = {
    "copy_X": True, 
    "fit_intercept": trial.suggest_categorical("fit_intercept", [True, False]),
    "positive": trial.suggest_categorical("positive", [True, False]),
}
```
**Results :** 

```py
params = {
    "fit_intercept": False,
    "positive": True
}
```

* **R2 :** 0.2853 
* **MAE :** 0.5017
* **RMSE :** 0.6648 

### Linear Regression (Elasticnet)

```py
params = {
    "alpha": trial.suggest_float("alpha", 1e-6, 10.0, log=True),
    "l1_ratio": trial.suggest_float("l1_ratio", 0.0, 1.0),
    "fit_intercept": trial.suggest_categorical("fit_intercept", [True, False]),
    "max_iter": trial.suggest_int("max_iter", 500, 5000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-2, log=True),
    "selection": trial.suggest_categorical("selection", ["cyclic", "random"])
}
```
**Results :** 

```py
params = {
    "alpha": 0.00038542540083133113,
    "l1_ratio": 0.11733064861417629,
    "fit_intercept": True,
    "max_iter": 1227,
    "tol": 3.074079260630123e-05,
    "selection": "random"
}
```

* **R2 :** 0.2877 
* **MAE :** 0.5043 
* **RMSE :** 0.6626 

### Random Forest

> Did not execute 100 trials due to extremely long execution times. We executed only 1 test with the following parameters.

**Parameters :**

```py
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
    "oob_score": trial.suggest_categorical("oob_score", [False, True]),
    "ccp_alpha": trial.suggest_float("ccp_alpha", 0.0, 0.1)
}
```

**Results :** 

```py
params = {
    "n_estimators": 95,
    "criterion": "absolute_error",
    "max_depth": 25,
    "min_samples_split": 12,
    "min_samples_leaf": 2,
    "min_weight_fraction_leaf": 0.45092598137957596,
    "max_features": None,
    "max_leaf_nodes": 1589,
    "min_impurity_decrease": 0.16578563594061557,
    "bootstrap": False,
    "oob_score": False,
    "ccp_alpha": 0.02901108238619291
}
```

* **R2 : -0.0009**
* **MAE : 0.6217** 
* **RMSE : 0.9310** 

### Gradient Boosting

**Parameters :**

```py
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
```

**Results :** 

```py
params = {
    "loss": "absolute_error"
    "learning_rate": 0.02280176533792217
    "n_estimators": 719
    "subsample": 0.7972495351158401
    "criterion": "friedman_mse"
    "min_samples_split": 20
    "min_samples_leaf": 3
    "min_weight_fraction_leaf": 0.0002052743467058696
    "max_depth": 9
    "max_features": "sqrt"
    "min_impurity_decrease": 0.20369418638457593
}
```

* **R2 :** 0.2625 
* **MAE :** 0.4650 
* **RMSE :** 0.6860

### Extreme Gradient Boosting

**Parameters :**

> We chose not to use dart booster since it created more issues in the long run

```py
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
    "reg_beta": trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),
    # Subsampling
    "subsample": trial.suggest_float("subsample", 0.5, 1.0),
    "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
    "colsample_bylevel": trial.suggest_float("colsample_bylevel", 0.5, 1.0),
    "colsample_bynode": trial.suggest_float("colsample_bynode", 0.5, 1.0),
    # Booster & misc.
    "booster": trial.suggest_categorical("booster", ["gbtree"]),
    "tree_method": "auto",
    "random_state": 99,
    "n_jobs": -1,
}
```

**Results :** 

```py
params = {
    "n_estimators": 806
    "learning_rate": 0.03029302502803171
    "max_depth": 8
    "min_child_weight": 0.0038121797269087977
    "gamma": 0.965193111361264
    "max_delta_step": 7
    "reg_alpha": 0.0034736346194687985
    "reg_lambda": 6.023943153925873
    "subsample": 0.7307550264958214
    "colsample_bytree": 0.5900537660484718
    "colsample_bylevel": 0.5196737746952808
    "colsample_bynode": 0.6219074422247004
    "booster": "gbtree"
}
```

* **R2 :** 0.3182
* **MAE :** 0.4916
* **RMSE :** 0.6342

### Support Vector Regression (SVR)

> Did not execute 100 trials due to extremely long execution times. We executed only 5 tests with the following parameters.

**Parameters :**

```py
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
```

**Results :** 

```py
params = {
    "kernel": "poly"
    "C": 4.944955595207548
    "epsilon": 0.02175537301173423
    "shrinking": True
    "gamma": "scale"
    "degree": 2
    "coef0": 0.4962961764689876
}
```

* **R2 : 0.2570** 
* **MAE : 0.4472** 
* **RMSE : 0.6911** 

## Scenario 3 model testing - Summer data only

* Train (60%)/Validation (20%)/Test (20%) split with Train for training models, Validation for hyperparameters optimisation and Test for final testing
* Only summer data
* Target is transformed by LOG1P
* Following transformations

```py
('yeo_johnson', PowerTransformer(method='yeo-johnson'), yeo_johnson_columns),
('numerical', StandardScaler(), numerical_columns),
('nominal', OneHotEncoder(), nominal_columns),
('ordinal', OrdinalEncoder(categories=ordinal_categories), ordinal_columns),
('multi_label', MultiLabelBinarizerWrapper(), multi_label_columns),
('passthrough', 'passthrough', passthrough_columns)
```

With : 
* `yeo_johnson_columns`: None
* `numerical_columns`: TEMP, DEW_POINT_TEMP, HUMIDEX, RELATIVE_HUMIDITY, STATION_PRESSURE, WIND_SPEED
* `nominal_columns`: ROUTE, INCIDENT
* `ordinal_columns`: VISIBILITY
* `multi_label_columns`: WEATHER_ENG_DESC_LIST
* `passthrough_columns`: LOCAL_TIME_HOUR_COS, LOCAL_TIME_HOUR_SIN, LOCAL_TIME_MINUTE_COS, LOCAL_TIME_MINUTE_SIN, WEEK_DAY_COS, WEEK_DAY_SIN, LOCAL_MONTH_COS, LOCAL_MONTH_SIN, LOCAL_DAY_COS, LOCAL_DAY_SIN, WIND_DIRECTION_COS, WIND_DIRECTION_SIN, PRECIP_AMOUNT_BINARY

We are trying to minimise the **RMSE** with optuna on **100 trials** except for `Random Forest` and `SVR` (too slow to hyperoptimise on 100 trials).

### Decision Tree

**Parameters :**

```py
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
```
**Results :** 

```py
params = {
    "criterion": "friedman_mse"
    "splitter": "best"
    "max_depth": 4
    "min_samples_split": 4
    "min_samples_leaf": 5
    "min_weight_fraction_leaf": 0.06298245386908075
    "max_features": None
    "max_leaf_nodes": 870
    "min_impurity_decrease": 0.3937352951676524
}
```

* **R2 :** 0.1615
* **MAE :** 0.5799
* **RMSE :** 0.7578

### Linear Regression (classical)

> Since only 4 cases are needed, only 4 trials are ran

```py
params = {
    "copy_X": True, 
    "fit_intercept": trial.suggest_categorical("fit_intercept", [True, False]),
    "positive": trial.suggest_categorical("positive", [True, False]),
}
```
**Results :** 

```py
params = {
    "fit_intercept": False,
    "positive": True
}
```

* **R2 :** 0.2826
* **MAE :** 0.4824
* **RMSE :** 0.6484 

### Linear Regression (Elasticnet)

```py
params = {
    "alpha": trial.suggest_float("alpha", 1e-6, 10.0, log=True),
    "l1_ratio": trial.suggest_float("l1_ratio", 0.0, 1.0),
    "fit_intercept": trial.suggest_categorical("fit_intercept", [True, False]),
    "max_iter": trial.suggest_int("max_iter", 500, 5000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-2, log=True),
    "selection": trial.suggest_categorical("selection", ["cyclic", "random"])
}
```
**Results :** 

```py
params = {
    "alpha": 0.0005415904606672672,
    "l1_ratio": 0.06711143766800608,
    "fit_intercept": True,
    "max_iter": 1031,
    "tol": 0.0025125336203729955,
    "selection": "cyclic"
}
```

* **R2 :** 0.2865 
* **MAE :** 0.4874
* **RMSE :** 0.6449 

### Random Forest

> Did not execute 100 trials due to extremely long execution times. We executed only 5 tests with the following parameters.

**Parameters :**

```py
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
    "oob_score": trial.suggest_categorical("oob_score", [False, True]),
    "ccp_alpha": trial.suggest_float("ccp_alpha", 0.0, 0.1)
}
```

**Results :** 

```py
params = {
    "n_estimators": 339,
    "criterion": "friedman_mse",
    "max_depth": 7,
    "min_samples_split": 9,
    "min_samples_leaf": 17,
    "min_weight_fraction_leaf": 0.4678768997063537,
    "max_features": "sqrt",
    "max_leaf_nodes": 952,
    "min_impurity_decrease": 0.3854587350914097,
    "bootstrap": False,
    "oob_score": False,
    "ccp_alpha": 0.0862227243102725
}
```

* **R2 : -0.0002**
* **MAE : 0.6112** 
* **RMSE : 0.9040** 

### Gradient Boosting

**Parameters :**

```py
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
```

**Results :** 

```py
params = {
    "loss": "squared_error",
    "learning_rate": 0.08493400397168298,
    "n_estimators": 355,
    "subsample": 0.5097553445692088,
    "criterion": "friedman_mse",
    "min_samples_split": 4,
    "min_samples_leaf": 18,
    "min_weight_fraction_leaf": 0.0014236179282328368,
    "max_depth": 4,
    "max_features": "sqrt",
    "min_impurity_decrease": 0.8791889749525543,
    "alpha": 0.5602793761231738

}
```

* **R2 :** 0.2969 
* **MAE :** 0.4882 
* **RMSE :** 0.6354

### Extreme Gradient Boosting

**Parameters :**

> We chose not to use dart booster since it created more issues in the long run

```py
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
    "reg_beta": trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),
    # Subsampling
    "subsample": trial.suggest_float("subsample", 0.5, 1.0),
    "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
    "colsample_bylevel": trial.suggest_float("colsample_bylevel", 0.5, 1.0),
    "colsample_bynode": trial.suggest_float("colsample_bynode", 0.5, 1.0),
    # Booster & misc.
    "booster": trial.suggest_categorical("booster", ["gbtree"]),
    "tree_method": "auto",
    "random_state": 99,
    "n_jobs": -1,
}
```

**Results :** 

```py
params = {
    "n_estimators": 1494,
    "learning_rate": 0.0170096189751765,
    "max_depth": 9,
    "min_child_weight": 5.340376980313727,
    "gamma": 0.5052289826389069,
    "max_delta_step": 5,
    "reg_alpha": 0.007644430950964261,
    "reg_lambda": 9.919662875022942,
    "subsample": 0.8398912127397786,
    "colsample_bytree": 0.5588507034087213,
    "colsample_bylevel": 0.8167534931699498,
    "colsample_bynode": 0.704605503225567,
    "booster": "gbtree"

}
```

* **R2 :** 0.3245
* **MAE :** 0.4712
* **RMSE :** 0.6106

### Support Vector Regression (SVR)

> Did not execute 100 trials due to extremely long execution times. We executed only 5 tests with the following parameters.

**Parameters :**

```py
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
```

**Results :** 

```py
params = {
    "kernel": "rbf",
    "C": 1.0202504419935043,
    "epsilon": 0.17989837469900855,
    "shrinking": True,
    "gamma": "auto"
}
```

* **R2 : 0.2053** 
* **MAE : 0.4885** 
* **RMSE : 0.7183** 

## Scenario 4 - GAMs

* Train (60%)/Validation (20%)/Test (20%) split with Train for training models, Validation for hyperparameters optimisation and Test for final testing
* Season variable created (Summer/Winter)
* ALL NAN VALUES REMOVED
* No numerical scaling
* Target is transformed by LOG1P
* Following transformations

```py
("nominal", OrdinalEncoder(), nominal_columns),
("ordinal", OrdinalEncoder(categories=ordinal_categories), ordinal_columns),
("multi_label", MultiLabelBinarizerWrapper(), multi_label_columns),
("passthrough", "passthrough", passthrough_columns)    
```

With : 
* `yeo_johnson_columns`: None
* `nominal_columns`: ROUTE, INCIDENT, SEASON
* `ordinal_columns`: VISIBILITY
* `multi_label_columns`: WEATHER_ENG_DESC_LIST
* `passthrough_columns`: LOCAL_TIME_HOUR, LOCAL_TIME_MINUTE, WEEK_DAY, LOCAL_MONTH, LOCAL_DAY, WIND_DIRECTION, PRECIP_AMOUNT_BINARY, TEMP, DEW_POINT_TEMP, HUMIDEX, RELATIVE_HUMIDITY, STATION_PRESSURE, WIND_SPEED

And
```py
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
```

We are trying to minimise the **RMSE** with optuna.

### LinearGAM

**Parameters :**

```py
params = {
    "n_splines": n_splines,
    "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
    "max_iter": trial.suggest_int("max_iter", 100, 1000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
}
```

**Results :** 

```py
params = {
    "n_splines": 5,
    "lam": 0.3879848363855412,
    "max_iter": 949,
    "tol": 1.040858968295515e-06
}
```

* **R2 : 0.2958** 
* **MAE : 0.4896** 
* **RMSE : 0.6526** 

### GammaGAM

**Parameters :**

```py
params = {
    "n_splines": trial.suggest_int("n_splines", 5, 30),
    "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
    "max_iter": trial.suggest_int("max_iter", 100, 1000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
}
```

**Results :** 

```py
params = {
    "n_splines": 7,
    "lam": 6.996430731372631,
    "max_iter": 451,
    "tol": 2.2074610650990642e-05
}
```

* **R2 : 0.2838** 
* **MAE : 0.4975** 
* **RMSE : 0.6637** 

### PoissonGAM

> Did not execute 100 trials due to long execution times. We executed only 25 tests with the following parameters.

**Parameters :**

```py
params = {
    "n_splines": trial.suggest_int("n_splines", 5, 30),
    "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
    "max_iter": trial.suggest_int("max_iter", 100, 1000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
}
```

**Results :** 

```py
params = {
    "n_splines": 26,
    "lam": 1.9491937350065412e-05,
    "max_iter": 844,
    "tol": 4.3436155909000126e-06
}
```

* **R2 : 0.2179** 
* **MAE : 0.5648** 
* **RMSE : 0.7248** 

## Scenario 5 - GAMs only winter

* Train (80%)/Validation (10%)/Test (10%) split with Train for training models, Validation for hyperparameters optimisation and Test for final testing
* ALL NAN VALUES REMOVED
* No numerical scaling
* Only winter data
* Target is transformed by LOG1P
* Following transformations

```py
("nominal", OrdinalEncoder(), nominal_columns),
("ordinal", OrdinalEncoder(categories=ordinal_categories), ordinal_columns),
("multi_label", MultiLabelBinarizerWrapper(), multi_label_columns),
("passthrough", "passthrough", passthrough_columns)    
```

With : 
* `yeo_johnson_columns`: None
* `nominal_columns`: ROUTE, INCIDENT, SEASON
* `ordinal_columns`: VISIBILITY
* `multi_label_columns`: WEATHER_ENG_DESC_LIST
* `passthrough_columns`: LOCAL_TIME_HOUR, LOCAL_TIME_MINUTE, WEEK_DAY, LOCAL_MONTH, LOCAL_DAY, WIND_DIRECTION, PRECIP_AMOUNT_BINARY, TEMP, DEW_POINT_TEMP, HUMIDEX, RELATIVE_HUMIDITY, STATION_PRESSURE, WIND_SPEED

And
```py
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
```

We are trying to minimise the **RMSE** with optuna.

### LinearGAM

**Parameters :**

```py
params = {
    "n_splines": n_splines,
    "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
    "max_iter": trial.suggest_int("max_iter", 100, 1000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
}
```

**Results :** 

```py
params = {
    "n_splines": 5,
    "lam": 6.400741604996376,
    "max_iter": 500,
    "tol": 0.00028849210409862127
}
```

* **R2 : 0.3142** 
* **MAE : 0.4947** 
* **RMSE : 0.6515** 

### GammaGAM

**Parameters :**

```py
params = {
    "n_splines": trial.suggest_int("n_splines", 5, 30),
    "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
    "max_iter": trial.suggest_int("max_iter", 100, 1000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
}
```

**Results :** 

```py
params = {
    "n_splines": 8,
    "lam": 4.137967988157594,
    "max_iter": 291,
    "tol": 9.0734547318602e-05
}
```

* **R2 :** 0.2781 
* **MAE :** 0.4929 
* **RMSE :** 0.6372

### PoissonGAM

> Did not execute 100 trials due to long execution times. We executed only 25 tests with the following parameters.

**Parameters :**

```py
params = {
    "n_splines": trial.suggest_int("n_splines", 5, 30),
    "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
    "max_iter": trial.suggest_int("max_iter", 100, 1000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
}
```

**Results :** 

```py
params = {
    "n_splines": 22,
    "lam": 1.4981548572944945,
    "max_iter": 495,
    "tol": 3.8603138507428227e-05
}
```

* **R2 :** 0.1899
* **MAE :** 0.5833
* **RMSE :** 0.7444

## Scenario 6 - GAMs only summer

* Train (80%)/Validation (10%)/Test (10%) split with Train for training models, Validation for hyperparameters optimisation and Test for final testing
* ALL NAN VALUES REMOVED
* No numerical scaling
* Only summer data
* Target is transformed by LOG1P
* Following transformations

```py
("nominal", OrdinalEncoder(), nominal_columns),
("ordinal", OrdinalEncoder(categories=ordinal_categories), ordinal_columns),
("multi_label", MultiLabelBinarizerWrapper(), multi_label_columns),
("passthrough", "passthrough", passthrough_columns)    
```

With : 
* `yeo_johnson_columns`: None
* `nominal_columns`: ROUTE, INCIDENT, SEASON
* `ordinal_columns`: VISIBILITY
* `multi_label_columns`: WEATHER_ENG_DESC_LIST
* `passthrough_columns`: LOCAL_TIME_HOUR, LOCAL_TIME_MINUTE, WEEK_DAY, LOCAL_MONTH, LOCAL_DAY, WIND_DIRECTION, PRECIP_AMOUNT_BINARY, TEMP, DEW_POINT_TEMP, HUMIDEX, RELATIVE_HUMIDITY, STATION_PRESSURE, WIND_SPEED

And
```py
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
```

We are trying to minimise the **RMSE** with optuna.

### LinearGAM

**Parameters :**

```py
params = {
    "n_splines": n_splines,
    "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
    "max_iter": trial.suggest_int("max_iter", 100, 1000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
}
```

**Results :** 

```py
params = {
    "n_splines": 7,
    "lam": 0.17608365605896287,
    "max_iter": 362,
    "tol": 3.204106745231952e-06
}
```

* **R2 :** 0.2742 
* **MAE :** 0.4608
* **RMSE :** 0.6160

### GammaGAM

**Parameters :**

```py
params = {
    "n_splines": trial.suggest_int("n_splines", 5, 30),
    "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
    "max_iter": trial.suggest_int("max_iter", 100, 1000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
}
```

**Results :** 

```py
params = {
}
```

* **R2 :**
* **MAE :** 
* **RMSE :** 

### PoissonGAM

> Did not execute 100 trials due to long execution times. We executed only 25 tests with the following parameters.

**Parameters :**

```py
params = {
    "n_splines": trial.suggest_int("n_splines", 5, 30),
    "lam": trial.suggest_float("lam", 1e-6, 1e3, log=True),
    "max_iter": trial.suggest_int("max_iter", 100, 1000),
    "tol": trial.suggest_float("tol", 1e-6, 1e-3, log=True),
}
```

**Results :** 

```py
params = {
    "n_splines": 21,
    "lam": 0.27892287949265293,
    "max_iter": 765,
    "tol": 9.912575933470949e-06
}
```

* **R2 :** 0.1784
* **MAE :** 0.5582
* **RMSE :** 0.7279