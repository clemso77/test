## Introduction

Ce projet vise à concevoir une application permettant de visualiser l’état actuel du réseau de transport urbain, de consulter les conditions météorologiques en temps réel, ainsi que d’analyser des statistiques globales et spécifiques à chaque ligne. L’interface principale repose sur une carte interactive affichant les lignes, les arrêts et des informations dynamiques liées au trafic et aux perturbations.

L’objectif est d’offrir une vision claire, synthétique et contextualisée du réseau afin d’aider les usagers à anticiper leurs déplacements.

### Objectifs Fonctionnels

L’application doit permettre à l’utilisateur de :

- Consulter la météo actuelle sur la zone géographique concernée, incluant les conditions, la température et un indicateur visuel représentatif.

- Visualiser les lignes de bus sur une carte interactive, accompagnées de l’ensemble des arrêts et d’un indicateur d’état (trafic fluide, perturbé ou interrompu).

- Accéder aux informations détaillées d’une ligne, telles que les incidents en cours, les incidents historiques, ainsi que des prévisions de perturbations quand elles sont disponibles.

- Analyser des statistiques globales du réseau, mettant en évidence les lignes les plus impactées, le niveau global de perturbation et les tendances temporelles.

## Diagramme de Cas d'Utilisation

Pour représenter les interactions entre les utilisateurs et le système, un diagramme de cas d'utilisation a été élaboré. Ce diagramme illustre les principales fonctionnalités accessibles aux utilisateurs, telles que la consultation de la météo, la visualisation des lignes de bus, l'accès aux détails des lignes et l'analyse des statistiques.

![DCU](./images/DCU.png)

## Diagramme de Classes

Le diagramme de classes ci-dessous présenta la structure de notre back-end, mettant en évidence les principales entités, leurs attributs et les relations entre elles. Ce diagramme est essentiel pour comprendre comment les données sont organisées et gérées au sein de l'application.
Elle constituera la base pour nos appels API et la gestion des données.
Cette partie est cruciale pour assurer une architecture solide et évolutive de notre application.
Elle a été discutée et validée avec Alexandre Bidaux avant de commencer le développement afin de se mettre d'accord sur la communication entre nos deux TX.

![DC](./images/DC.png)

On peut ainsi générer à partir de ce schema notre API RESTful avec les routes suivantes :

https://editor.swagger.io/?url=https://gitlab.utc.fr/clmartin/pr_subway_martins_bidaux/-/blob/app/app/report/APIREST.yaml?ref_type=heads

## Proof of Concept
Avant de s’engager dans la mise en œuvre complète du système, un Proof of Concept (PoC) a été réalisé afin de vérifier la cohérence des choix techniques et la faisabilité des fonctionnalités clés. L’objectif n’était pas de proposer une version exhaustive de l’application, mais de valider étape par étape les principaux éléments qui constituent son cœur fonctionnel.

Le PoC a tout d'abord permis de tester l’intégration d’une carte interactive basée sur __Mapbox GL JS__, affichée au sein d’une application front-end développée avec __React__. Nous avons vérifié la possibilité de représenter dynamiquement des lignes de bus sous forme de tracés géographiques, ainsi que d’ajouter des points d’intérêt tels que les arrêts. Ce premier jalon a servi à confirmer la compatibilité entre les données de coordonnées, la logique de rendu en temps réel et les contraintes de performance liées au navigateur.

De plus Mapbox GL offre une grande flexibilité en termes de personnalisation visuelle, ce qui a permis d’adapter l’apparence de la carte aux besoins spécifiques du projet, notamment en termes de styles et de couches d’information supplémentaires.
Il est aussi possible d’intégrer __des effets visuels avancés__ (pluie et neige) sur la carte et d'y inclure __Three.js__ pour peut-être à terme inclure une visualisation en temps réel des bus en 3D.

La carte personnalisée est accessible ici : https://api.mapbox.com/styles/v1/clementmartins/cmh0o7rch000e01s7g2psbnz8.html?title=view&access_token=pk.eyJ1IjoiY2xlbWVudG1hcnRpbnMiLCJhIjoiY21oMGx4cHAxMDI4bDJuczhnb2N0NHd2ZSJ9.vzFXf89w1P83cru30twuAA&zoomwheel=true&fresh=true#0/0/0
Elle à été faite de façon à faire ressortir les routes et donc mettre en avant les lignes de bus.

Parallèlement, une première couche de back-end a été mise en place à l’aide de Node.js et Express, structurée de manière à évoluer vers une architecture en microservices. Une attention particulière a été portée à l’isolation des clés d’API et des paramètres sensibles via un fichier __.env__, afin de garantir une configuration modulaire et sécurisée.

![POC](./images/POC.png)

## Sources de Données

La qualité et la pertinence des prédictions reposent sur l'utilisation de données fiables et diversifiées. Le projet s'appuie sur plusieurs sources de données complémentaires, permettant de croiser des informations liées aux retards des bus, aux conditions météorologiques et à la structure du réseau de transport.

### Jeux de données principaux

| Nom | Contenu | Type | Source | Date | Informations additionnelles |
|-----|---------|------|--------|------|---------------------------|
| TTC Delays and Routes 2023 | Retards des bus de Toronto en 2023 | Dataset | [Kaggle 2023](https://www.kaggle.com/datasets/karmansinghbains/ttc-delays-and-routes-2023) | 2025-10-15 | |
| Toronto Bus Delay 2022 | Retards des bus de Toronto en 2022 | Dataset | [Kaggle 2022](https://www.kaggle.com/datasets/reihanenamdari/toronto-bus-delay-2022) | 2025-10-15 | Noms différents mais même structure de données qu'en 2023 |
| Hourly climate data | Relevés météorologiques canadiens | Dataset | [Government of Canada](https://climate-change.canada.ca/climate-data/#/hourly-climate-data) | 2025-10-15 | Station utilisée : ID 6158359, enregistrements 110,001 (juillet 2022) à 130,000 (octobre 2024) |
| TTC Routes & Schedules | Noms et identifiants des lignes de bus | Dataset | [TTC](https://www.ttc.ca/routes-and-schedules/listroutes/bus) | 2025-10-15 | Le site ne fournit pas d'informations directes, mais l'analyse du trafic réseau a permis de découvrir l'API : [TTC API](https://www.ttc.ca/ttcapi/routedetail/listroutes) |

### Sources de données explorées

Au cours du développement, d'autres sources de données ont été explorées mais n'ont pas été retenues pour des raisons de compatibilité ou de complétude :

| Nom | Contenu | Type | Source | Date |
|-----|---------|------|--------|------|
| PRIM - Traffic Info Messages (v2) | Informations de perturbation actuelles, à venir et passées | API | [PRIM API](https://prim.iledefrance-mobilites.fr/en/apis/idfm-navitia-line_reports-v2) | 2025-10-05 |
| INFOCLIMAT - Weather data | Données météorologiques actuelles et passées | API | [INFOCLIMAT API](https://www.infoclimat.fr/opendata/) | 2025-10-05 |

> **Note** : L'API PRIM semble encore en développement. Seuls les incidents liés aux ascenseurs des métros et RER sont actuellement disponibles.

## Création des routes avec les données GTFS

L'une des étapes fondamentales du projet a consisté à extraire, structurer et normaliser les données du réseau de transport à partir du format **GTFS** (General Transit Feed Specification). Ce format standardisé, largement utilisé dans le domaine des transports publics, permet de décrire l'ensemble des lignes, arrêts, horaires et tracés géographiques d'un réseau.

### Format GTFS et architecture des données

Le format GTFS repose sur un ensemble de fichiers texte (CSV) interdépendants :

- **routes.txt** : contient les informations sur les lignes de bus (identifiant, nom court, nom long, couleur)
- **trips.txt** : décrit les trajets individuels effectués par chaque ligne
- **stop_times.txt** : liste les arrêts desservis lors de chaque trajet, avec leur séquence
- **stops.txt** : référence les arrêts avec leur position géographique (latitude, longitude)
- **shapes.txt** : (optionnel) contient les tracés géographiques précis des lignes sous forme de séquences de points GPS

Cette structure impose une gestion rigoureuse des relations entre fichiers pour reconstruire une vision cohérente du réseau.

### Script d'extraction et de normalisation : BusStops.py

Le script **`BusStops.py`** centralise la logique d'extraction et de structuration des données GTFS. Il assure plusieurs fonctions critiques :

#### 1. Filtrage des lignes autorisées

Le script charge une liste de lignes autorisées depuis un fichier JSON externe (`lignes_bus.json`). Cette étape garantit que seules les lignes pertinentes pour le projet sont extraites, évitant ainsi une surcharge de données inutiles.

```python
def load_allowed_route_ids(path: str | Path) -> set[str]:
    p = Path(path)
    data = json.loads(p.read_text(encoding="utf-8"))
    ids = {str(x).strip() for x in data["lignes"] if str(x).strip().isdigit()}
    return ids
```

#### 2. Canonicalisation des arrêts

Un problème récurrent dans les données GTFS est la duplication des arrêts partageant les mêmes coordonnées GPS. Le script détecte ces doublons et les canonicalise, c'est-à-dire qu'il ne conserve qu'un seul identifiant par position géographique unique. Cela permet d'éviter des incohérences lors de l'affichage sur la carte.

```python
coord_to_canon: dict[tuple[float, float], str] = {
    coord: sorted(ids, key=_stop_sort_key)[0] 
    for coord, ids in coord_to_ids.items()
}
```

L'algorithme trie les identifiants et privilégie les identifiants numériques les plus bas, garantissant une cohérence reproductible.

#### 3. Sélection du trajet le plus représentatif

Chaque ligne peut avoir plusieurs trajets (`trips`) correspondant à différentes heures de la journée, directions ou variantes. Le script identifie le trajet le plus complet (celui desservant le plus d'arrêts uniques) pour représenter la ligne dans son ensemble.

```python
for tid in trips:
    pairs_sorted = sorted(trip_to_seq.get(tid, []), key=lambda x: x[0])
    ordered = [stop_canon for _, stop_canon in pairs_sorted if stop_canon != last]
    if len(ordered) > best_len:
        best_len = len(ordered)
        best_trip_id = tid
        best_ordered = ordered
```

Cette approche garantit que la représentation cartographique reflète fidèlement l'itinéraire complet de chaque ligne.

#### 4. Intégration des tracés géographiques (shapes)

Lorsque le fichier `shapes.txt` est disponible, le script extrait les tracés précis des lignes sous forme de séquences de coordonnées GPS. Ces tracés sont ensuite stockés au format **GeoJSON** pour un affichage fluide sur la carte Mapbox.

```python
if has_shapes and best_trip_id is not None:
    shape_id = trip_to_shape.get(best_trip_id, "")
    pts = shape_points.get(shape_id, [])
    if pts and len(pts) >= 2:
        geometrie = [[lon, lat] for (_seq, lon, lat) in pts]
```

Les tracés permettent d'afficher des lignes continues et réalistes, suivant les routes empruntées par les bus, plutôt que de simples segments reliant les arrêts.

### Script de normalisation : busLine.py

Une fois les données extraites, le script **`busLine.py`** effectue une normalisation supplémentaire en séparant les données de lignes et d'arrêts dans deux fichiers JSON distincts :

- **lines_normalized.json** : contient les lignes avec leurs propriétés (nom, couleur, identifiant) et une liste ordonnée de références aux arrêts
- **stops_normalized.json** : regroupe tous les arrêts uniques du réseau avec leur position GPS

Cette séparation améliore les performances de chargement côté frontend et évite la duplication d'informations d'arrêts communes à plusieurs lignes.

```python
def normalize_lines_and_stops(
    input_lignes_json: str | Path,
    output_lines_json: str | Path,
    output_stops_json: str | Path,
) -> None:
    # Lecture des lignes
    lignes_in = data.get("lignes", [])
    stops_by_id: dict[int, dict] = {}
    
    for line in lignes_in:
        arrets = line.get("arrets", []) or []
        stop_ids = []
        
        for a in arrets:
            sid = int(a["id"])
            stop_ids.append(sid)
            
            # Conservation d'un seul arrêt par ID
            if sid not in stops_by_id:
                stops_by_id[sid] = {
                    "id": sid,
                    "nom": a.get("nom", ""),
                    "position": {
                        "lat": float(pos.get("lat")),
                        "long": float(pos.get("long")),
                    },
                }
```

### Format de sortie JSON

Le résultat final de ce processus est un fichier JSON structuré et optimisé pour l'affichage cartographique :

```json
{
  "lignes": [
    {
      "id": 7,
      "nom": "7",
      "couleur": "EE3124",
      "long_nom": "Bathurst",
      "stopIds": [110, 3016, 3017, ...],
      "geometries": [
        [-79.41139, 43.64203],
        [-79.41141, 43.64215],
        ...
      ]
    }
  ]
}
```

Cette architecture garantit une compatibilité directe avec Mapbox GL et facilite la gestion dynamique des données côté React.

### Visualisation du réseau complet

L'image ci-dessous illustre le résultat final de l'extraction et de la normalisation des données GTFS : l'ensemble des lignes de bus du réseau TTC affichées sur la carte interactive avec leurs tracés géographiques complets.

![Toutes les lignes de bus](./images/tous_les_bus.png)

Cette représentation démontre la capacité du système à gérer simultanément un grand nombre de lignes avec leurs géométries complexes, tout en maintenant des performances de rendu fluides grâce aux optimisations détaillées dans les sections suivantes.

## Pipeline de Traitement des Données

La préparation des données constitue une étape essentielle pour garantir la qualité et la pertinence des prédictions. Un ensemble de scripts Python a été développé pour automatiser le processus complet, de la fusion des sources de données brutes jusqu'à la création des jeux de données prêts pour l'entraînement des modèles.

### Fusion des retards de bus avec les données météorologiques

Le script **`combine_bus_delays_with_climate.py`** réalise la jonction entre les données de retards de bus (issues du TTC) et les relevés météorologiques horaires. Cette étape est cruciale car elle permet d'associer à chaque incident de retard les conditions météorologiques précises au moment de sa survenue.

#### Algorithme de correspondance temporelle

Les données de bus utilisent un format de date et d'heure spécifique (`dd-MMM-yy HH:mm`), tandis que les données météorologiques sont horodatées de manière standardisée. Le script effectue un arrondi temporel à l'heure la plus proche pour faciliter la correspondance :

```python
def convert_bus_datetime_to_climate_date(date, time):
    datetime_str = f"{date} {time}"
    datetime_obj = pd.to_datetime(datetime_str, format="%d-%b-%y %H:%M")
    # Arrondi à l'heure la plus proche
    rounded_datetime = datetime_obj.round('h')
    return rounded_datetime.strftime("%Y-%m-%d %H:%M:00")
```

Cette approche permet de relier efficacement les deux sources de données tout en conservant une précision temporelle suffisante pour l'analyse.

#### Résultat de la fusion

Le fichier résultant (`raw_dataset.csv`) contient l'ensemble des retards avec leurs caractéristiques temporelles, géographiques et météorologiques associées. Ce jeu de données constitue la base pour toutes les étapes de preprocessing ultérieures.

### Preprocessing et Feature Engineering

Le script **`data_preprocessing.py`** transforme les données brutes en features exploitables par les modèles de machine learning. Cette étape inclut plusieurs transformations avancées.

#### 1. Transformation de la variable cible

La variable de retard (`DELAY`) présente une distribution asymétrique avec de nombreuses valeurs extrêmes. Pour améliorer la convergence des modèles, une transformation logarithmique est appliquée :

```python
df['DELAY_LOG1P'] = np.log1p(df['DELAY'])
df = df.drop(columns=['DELAY'])
```

La fonction `log1p` (logarithme de 1 + x) permet de gérer les retards nuls sans introduire de valeurs indéfinies.

#### 2. Encodage cyclique des variables temporelles

Les variables temporelles (heure, jour de la semaine, mois) présentent une nature cyclique : 23h est proche de 0h, dimanche précède lundi, décembre précède janvier. Un encodage numérique simple (0, 1, 2...) ne reflète pas cette continuité.

L'**encodage cyclique** utilise des transformations trigonométriques pour préserver la périodicité :

```python
def cyclical_encoding(df, column, max_value):
    num_col = pd.to_numeric(df[column])
    cos = np.cos(2 * np.pi * num_col / max_value)
    sin = np.sin(2 * np.pi * num_col / max_value)
    return cos, sin
```

Cette approche crée deux features (cosinus et sinus) pour chaque variable cyclique. Par exemple, pour les heures de la journée :

- 0h → cos(0) = 1, sin(0) = 0
- 6h → cos(π/2) = 0, sin(π/2) = 1
- 12h → cos(π) = -1, sin(π) = 0
- 18h → cos(3π/2) = 0, sin(3π/2) = -1

Les variables encodées cycliquement incluent :
- Heure et minute du retard
- Jour de la semaine
- Mois et jour du mois
- Direction du vent (0-360°)

#### 3. Transformation des variables météorologiques

Les conditions météorologiques nécessitent un traitement spécifique :

**Regroupement des conditions météo similaires** :

Les descriptions météorologiques brutes sont souvent très détaillées et redondantes. Elles sont regroupées en grandes catégories (`Clear`, `Rain`, `Snow`, `Fog`, `Thunderstorms`) via un **MultiLabelBinarizer**, permettant de capturer les conditions composées (ex : "Rain,Fog").

**Binarisation des précipitations** :

Plutôt que d'utiliser directement la quantité de précipitations (qui contient beaucoup de zéros), une variable binaire indique simplement la présence ou l'absence de précipitations :

```python
df['PRECIP_AMOUNT_BINARY'] = (df['PRECIP_AMOUNT'] > 0).astype(int)
```

**Catégorisation de la visibilité** :

La visibilité est transformée en variable ordinale avec des seuils prédéfinis reflétant la dégradation des conditions de conduite.

#### 4. Pipeline de prétraitement standardisé

L'ensemble des transformations est encapsulé dans un **pipeline scikit-learn** permettant d'appliquer de manière cohérente et reproductible toutes les étapes :

```python
preprocessor = ColumnTransformer([
    ('numerical', StandardScaler(), numerical_columns),
    ('nominal', OneHotEncoder(), nominal_columns),
    ('ordinal', OrdinalEncoder(categories=ordinal_categories), ordinal_columns),
    ('multi_label', MultiLabelBinarizerWrapper(), multi_label_columns),
    ('passthrough', 'passthrough', passthrough_columns)
])
```

Ce pipeline est sauvegardé (`preprocessor.pkl`) et réutilisé lors de l'inférence pour garantir que les données en production subissent exactement les mêmes transformations que les données d'entraînement.

### Entraînement des modèles

Les scripts **`train_models.py`**, **`train_models_winter.py`** et **`train_models_summer.py`** orchestrent l'entraînement de plusieurs modèles de machine learning avec optimisation automatique des hyperparamètres via **Optuna**.

#### Stratégie d'optimisation

Optuna effectue une recherche bayésienne dans l'espace des hyperparamètres pour minimiser le **RMSE** (Root Mean Squared Error) sur un ensemble de validation. Pour chaque modèle, entre 4 et 100 essais sont effectués selon la complexité et le temps d'entraînement :

- **Decision Tree** : 100 essais
- **Linear Regression** : 4 essais (espace de recherche limité)
- **ElasticNet** : 100 essais
- **Random Forest** : 10 essais (coût computationnel élevé)
- **Gradient Boosting** : 100 essais
- **XGBoost** : 100 essais
- **SVR** : 5 essais (temps d'entraînement prohibitif)

#### Modèles entraînés

Plusieurs familles de modèles ont été testées :

- **Modèles linéaires** : Régression linéaire classique et avec régularisation ElasticNet
- **Arbres de décision** : Modèles simples et interprétables
- **Ensembles d'arbres** : Random Forest, Gradient Boosting, XGBoost
- **SVR** : Support Vector Regression avec noyaux RBF, polynomial et sigmoïde
- **GAMs** : Generalized Additive Models (LinearGAM, GammaGAM, PoissonGAM)

Les modèles GAMs méritent une attention particulière car ils permettent de modéliser des relations non-linéaires tout en conservant une certaine interprétabilité. Ils utilisent des splines pour ajuster des courbes flexibles sur chaque feature.

#### Stratégie par saison

Des modèles spécifiques ont été entraînés séparément pour l'hiver et l'été, permettant de capturer les dynamiques saisonnières distinctes des retards de bus. Les mois de mai à septembre sont considérés comme l'été, et octobre à avril comme l'hiver.

### Génération automatique de rapports

Le script **`automatic_eda.py`** utilise la bibliothèque **ydata-profiling** pour générer automatiquement un rapport d'exploration des données exhaustif. Ce rapport inclut :

- Distribution de chaque variable
- Corrélations entre variables
- Détection de valeurs manquantes
- Identification de doublons
- Statistiques descriptives complètes

Ce rapport facilite la compréhension initiale des données et guide les choix de preprocessing.

## Amélioration du rendu et des performances
L’amélioration des performances de l’application cartographique a constitué un axe de travail majeur du projet. L’objectif n’était pas uniquement de rendre l’interface plus fluide, mais surtout de mettre en place une architecture plus cohérente et plus adaptée aux contraintes du rendu cartographique WebGL, tout en conservant les avantages offerts par React pour la gestion de l’interface et de l’état applicatif.

### Analyse de la problématique initiale

Dans la version initiale de l’application, chaque ligne de bus ainsi que chaque arrêt étaient gérés de manière indépendante. Concrètement, cela se traduisait par la création d’une source et d’un layer Mapbox pour chaque ligne, et souvent d’un autre couple source/layer pour les arrêts associés. À cette structure s’ajoutait un composant React dédié par ligne, chargé d’instancier ces éléments graphiques.

Cette approche, bien que conceptuellement simple et proche du paradigme déclaratif de React, s’est révélée inadaptée aux contraintes de Mapbox GL. Le moteur de rendu de Mapbox repose sur WebGL et sur une gestion interne optimisée des couches graphiques. La multiplication des sources et des layers entraînait une surcharge importante du GPU et du CPU, provoquant des ralentissements notables lors du zoom, du déplacement de la carte ou encore lors de la sélection simultanée de plusieurs lignes.

De plus, la synchronisation fine entre le cycle de rendu de React et les opérations impératives de Mapbox (ajout et suppression de layers) augmentait la complexité du code et rendait l’application plus difficile à maintenir et à faire évoluer.


### Principe de refonte retenu

Afin de corriger ces problèmes, une séparation plus nette des responsabilités entre React et Mapbox GL a été mise en place. Le principe fondamental retenu est le suivant :

- React est utilisé pour la gestion de l’état applicatif, la logique métier et l’interface utilisateur (panneau de sélection des lignes, recherche, interactions utilisateur).
- Mapbox GL est responsable exclusivement du rendu graphique et de l’affichage des données géographiques.

Cette séparation permet de conserver une approche déclarative au niveau des données, tout en respectant le fonctionnement impératif et optimisé de Mapbox GL.

### Mutualisation des sources et des layers

L’amélioration la plus significative concerne la gestion des sources et des layers Mapbox. Au lieu de créer un layer par ligne et par arrêt, l’architecture a été repensée autour de la mutualisation :

- Une unique source GeoJSON regroupe l’ensemble des lignes de bus.
- Un seul layer de type `line` est utilisé pour afficher toutes les lignes.
- Une seconde source GeoJSON regroupe l’ensemble des arrêts.
- Un unique layer de type `circle` est dédié à l’affichage des arrêts.

Les lignes et les arrêts sont désormais représentés sous forme de `FeatureCollection` GeoJSON. Chaque entité contient des propriétés descriptives (identifiant de ligne, couleur, nom, etc.) permettant de différencier les éléments et de personnaliser leur apparence sans multiplier les layers.

Cette approche réduit drastiquement le nombre de layers actifs sur la carte, ce qui améliore immédiatement les performances du rendu.

### Mise à jour des données via les sources existantes

Plutôt que de créer et détruire dynamiquement des layers à chaque interaction utilisateur, les mises à jour s’effectuent désormais par le biais de la méthode `setData` des sources GeoJSON existantes.

Lorsqu’un utilisateur sélectionne ou désélectionne une ligne :
- les données GeoJSON correspondantes sont reconstruites côté React,
- les sources Mapbox existantes sont mises à jour avec ces nouvelles données,
- Mapbox se charge automatiquement d’actualiser le rendu graphique.

Ce mécanisme évite les opérations coûteuses liées à la manipulation répétée des layers et s’inscrit dans les bonnes pratiques recommandées par Mapbox GL pour des applications interactives à grande échelle.


### Gestion fiable et performante des sélections

La gestion des lignes sélectionnées repose désormais sur l’utilisation d’identifiants uniques stockés dans une structure de type `Set<string>`. Ce choix permet d’éviter les problèmes liés aux comparaisons par référence d’objets JavaScript, tout en garantissant des opérations de sélection et de désélection rapides et fiables.

Cette représentation s’intègre naturellement aux propriétés des entités GeoJSON et facilite la reconstruction des jeux de données à afficher en fonction de l’état applicatif.


### Allègement du cycle de rendu React

Un autre bénéfice important de cette refonte réside dans la réduction du travail effectué par React lors des mises à jour graphiques. Les éléments visuels lourds (lignes et arrêts) ne sont plus liés directement au cycle de rendu des composants React.

React se limite à :
- mettre à jour l’état global,
- déclencher les reconstructions de données lorsque cela est nécessaire.

Le rendu graphique est entièrement pris en charge par Mapbox GL, ce qui limite les rerenders inutiles et améliore la réactivité globale de l’application.


### Résultats et bénéfices observés

La nouvelle architecture permet d’obtenir plusieurs améliorations notables :
- une fluidité accrue lors de la navigation sur la carte,
- une réduction significative de la charge GPU et CPU,
- une meilleure lisibilité et maintenabilité du code,
- une base technique plus solide pour des optimisations futures telles que le chargement à la demande des lignes, la simplification géométrique ou l’adaptation du niveau de détail en fonction du zoom.

---

![POC](./images/amelioration.png)


## Intégration du service de prédiction des retards

L'un des objectifs majeurs du projet était de permettre aux usagers d'anticiper les perturbations sur le réseau de transport. Pour répondre à cette problématique, un système de prédiction des retards a été développé et intégré à l'application.

### Architecture du système de prédiction

Le système repose sur une architecture en trois couches distinctes :

1. **Modèle de Machine Learning** : Un modèle XGBoost entraîné sur des données historiques combinant informations météorologiques, temporelles et incidents passés.

2. **API de prédiction Python (Flask)** : Un service REST qui expose le modèle via des endpoints HTTP, permettant d'obtenir des prédictions en temps réel.

3. **Intégration Front-end et Back-end** : Une couche TypeScript qui orchestre les appels au service de prédiction et présente les résultats de manière claire aux utilisateurs.

### Modèle de prédiction simplifié

Le modèle a été optimisé pour garantir à la fois performance et simplicité. Il utilise :

- **Encodage cyclique** pour les variables temporelles (heure, jour de la semaine, mois, direction du vent), préservant leur nature périodique.
- **Transformation des variables météorologiques** : regroupement des conditions météo similaires, binarisation des précipitations, catégorisation de la visibilité.
- **Prétraitement standardisé** via un pipeline scikit-learn sauvegardé (preprocessor.pkl).

### API de prédiction

L'API Flask (`app.py`) expose un endpoint :

**Prédiction de retard**
```
POST /predict
```
Accepte des données météorologiques et temporelles, retourne une estimation du retard en minutes.

L'API utilise CORS pour permettre les appels depuis le front-end et inclut une validation complète des données d'entrée pour garantir la fiabilité des prédictions.

### Intégration Backend (TypeScript/Node.js)

Le backend TypeScript fait office d'intermédiaire entre le front-end et le service Python :

- **Service de prédiction** (`predictionService.ts`) : Gère la communication avec l'API Flask, incluant la gestion d'erreurs et la vérification de santé.

- **Routes REST** (`busRoutes.ts`) : Expose un endpoint `POST /lines/:id/prediction/:incident` permettant d'obtenir des prédictions pour une ligne et un incident spécifique.

- **Service de lignes** (`busService.ts`) : Intègre les appels de prédiction dans la logique métier existante.

L'URL de l'API de prédiction est configurable via la variable d'environnement `PREDICTION_API_URL`.

### Intégration Frontend (React)

Côté interface utilisateur, les prédictions sont intégrées dans le panneau de statistiques :

- **Service de prédiction** (`PredictionService.tsx`) : Encapsule les appels API vers le backend.

- **Panneau de statistiques** (`StatsPanel.tsx`) : 
  - Charge automatiquement les prédictions lorsqu'une ligne est sélectionnée
  - Affiche le retard prédit en minutes pour chaque ligne

- **Styles** (`StatsPanel.module.css`) : Une section dédiée présente les retards prédits avec un design cohérent (badge coloré, bordures arrondies).

### Flux de données

1. L'utilisateur sélectionne une ou plusieurs lignes de bus sur la carte
2. Le frontend récupère les données météorologiques actuelles
3. Pour chaque ligne sélectionnée, un appel API est effectué vers le backend
4. Le backend transmet la requête au service Python de prédiction
5. Le modèle XGBoost génère une prédiction de retard
6. Le résultat remonte jusqu'au frontend
7. Les prédictions sont affichées dans le panneau de statistiques avec un design adapté

### Avantages de cette architecture

- **Séparation des préoccupations** : Le modèle ML reste en Python (écosystème optimal), tandis que la logique applicative est en TypeScript.
- **Scalabilité** : Le service de prédiction peut être déployé indépendamment et répliqué selon les besoins.
- **Maintenabilité** : Chaque couche peut être modifiée sans impacter les autres.
- **Extensibilité** : D'autres modèles ou sources de données peuvent être ajoutés facilement.

## Guide d'utilisation

### Démarrage de l'application complète

Pour bénéficier des prédictions de retard, l'application nécessite le démarrage de trois services :

**1. Service de prédiction Python**
```bash
cd models
pip install -r requirements.txt
python prediction_api.py
```
Le service démarre par défaut sur `http://localhost:5000`.

**2. Backend Node.js**
```bash
cd app/backend
npm install
npm start
```
Le backend démarre sur le port 3000 et communique avec le service de prédiction.

**3. Frontend React**
```bash
cd app/frontend
npm install
npm run dev
```
L'interface utilisateur est accessible sur `http://localhost:5173`.
(A condition de spécifié les token nécessaire pour les API dans les __.en__ de chaque module):
- FrontEnd: VITE_MAPBOX_ACCESS_TOKEN et VITE_API_BASE_URL
- Backend: MAPBOX_ACCESS_TOKEN, PORT, PREDICTION_API_URL, BASELINE_LINE_FOR_PREDICTIONS, WEATHER_API_URL, WEATHER_API_KEY

### Utilisation de la fonctionnalité de prédiction

1. Ouvrez l'application dans votre navigateur
2. Sur la carte interactive, sélectionnez une ou plusieurs lignes de bus en utilisant le panneau latéral gauche
3. Le panneau de statistiques à droite affiche automatiquement :
   - Les statistiques globales du réseau
   - Les prédictions par type d'incident
   - **Les retards prédits en minutes pour chaque ligne sélectionnée**

Les prédictions sont calculées en temps réel en tenant compte des conditions météorologiques actuelles et de l'heure de la journée.

## Intégration du service de données météorologiques

Pour améliorer la précision et la fiabilité du système de prédiction, un services majeurs a été développés :
1. **Service de données météorologiques** : Fournit des données météorologiques réelles au système prédictif.

### Architecture du Service Météorologique

Le service météorologique repose sur l'api :https://www.meteosource.com/

**Backend (`weatherService.ts`)** :
- Récupère les données actuel à Toronto via l'API.
- Implémente un système de cache pour optimiser les performances (1 heure)
- Expose le format de données spécifié par le système prédictif:

**API REST** :
- `GET /weather/current` : Récupère les conditions météorologiques actuelles

**Frontend (`WeatherService.tsx`)** : Encapsule les appels API et fournit des méthodes pour récupérer les données météorologiques.

```typescript
export type WeatherData = {
    TEMP: number;
    DEW_POINT_TEMP: number;
    HUMIDEX: number | null;
    PRECIP_AMOUNT: number;
    RELATIVE_HUMIDITY: number;
    STATION_PRESSURE: number;
    VISIBILITY: number;
    WEATHER_ENG_DESC: string;
    WIND_DIRECTION: number | null;
    WIND_SPEED: number | null;
    LOCAL_DATE: string;
    LOCAL_TIME: string;
    WEEK_DAY: string;
    LOCAL_MONTH: number;
    LOCAL_DAY: number;
}
```

## Résultats d'Entraînement des Modèles

L'évaluation des différents modèles de machine learning a permis d'identifier les approches les plus performantes pour la prédiction des retards. Plusieurs scénarios ont été testés, incluant l'ensemble des données, ainsi que des modèles spécialisés par saison.

### Scénario 1 : Modèle global toutes saisons

Le premier scénario utilise l'ensemble des données avec une séparation Train (60%) / Validation (20%) / Test (20%). Une variable `SEASON` (Summer/Winter) a été créée pour capturer les différences saisonnières.

#### Performances des modèles

Les performances sont mesurées via trois métriques principales sur l'ensemble de test :
- **R²** (coefficient de détermination) : mesure la proportion de variance expliquée
- **MAE** (Mean Absolute Error) : erreur moyenne absolue en minutes (après transformation inverse)
- **RMSE** (Root Mean Squared Error) : erreur quadratique moyenne, pénalisant davantage les grosses erreurs

| Modèle | R² | MAE | RMSE | Observations |
|--------|-----|-----|------|--------------|
| **XGBoost** | **0.3296** | 0.4746 | **0.6212** | Meilleur compromis performance/généralisation |
| Gradient Boosting | 0.3002 | **0.4465** | 0.6485 | Excellente MAE |
| Linear Regression (Elasticnet) | 0.2948 | 0.4902 | 0.6535 | Simple et rapide |
| Linear Regression | 0.2921 | 0.4898 | 0.6560 | Baseline solide |
| SVR | 0.2601 | 0.4451 | 0.6857 | Coût computationnel élevé |
| Decision Tree | 0.2289 | 0.5594 | 0.7146 | Surapprentissage visible |
| Random Forest | 0.0140 | 0.6220 | 0.9137 | Hyperparamètres sous-optimaux |

**XGBoost** émerge comme le modèle le plus performant avec un R² de 0.3296 et un RMSE de 0.6212. Ce résultat justifie son utilisation dans le système de prédiction en production.

![XGBoost Scenario 1](../../reports/1/XGBoost-scatterplot.png)

Le graphique de dispersion montre une corrélation raisonnable entre les prédictions et les valeurs réelles, avec une concentration autour de la diagonale idéale.

### Scénario 2 : Modèle spécialisé hiver

Ce scénario se concentre exclusivement sur les données hivernales (octobre à avril), période où les conditions météorologiques ont un impact plus marqué sur les retards.

#### Résultats clés

| Modèle | R² | MAE | RMSE |
|--------|-----|-----|------|
| **XGBoost** | **0.3182** | 0.4916 | **0.6342** |
| Linear Regression (Elasticnet) | 0.2877 | 0.5043 | 0.6626 |
| Linear Regression | 0.2853 | 0.5017 | 0.6648 |
| Gradient Boosting | 0.2625 | 0.4650 | 0.6860 |
| SVR | 0.2570 | 0.4472 | 0.6911 |
| Decision Tree | 0.1957 | 0.5746 | 0.7482 |

Les performances hivernales sont légèrement inférieures au modèle global, suggérant que la variabilité accrue des conditions météorologiques rend la prédiction plus difficile.

![XGBoost Winter](../../reports/2/XGBoost-scatterplot.png)

### Scénario 3 : Modèle spécialisé été

Le modèle estival (mai à septembre) bénéficie de conditions météorologiques plus stables et prévisibles.

#### Résultats clés

| Modèle | R² | MAE | RMSE |
|--------|-----|-----|------|
| **XGBoost** | **0.3245** | **0.4712** | **0.6106** |
| Gradient Boosting | 0.2969 | 0.4882 | 0.6354 |
| Linear Regression (Elasticnet) | 0.2865 | 0.4874 | 0.6449 |
| Linear Regression | 0.2826 | 0.4824 | 0.6484 |
| SVR | 0.2053 | 0.4885 | 0.7183 |
| Decision Tree | 0.1615 | 0.5799 | 0.7578 |

Le modèle estival affiche de meilleures performances globales, avec un RMSE de 0.6106, confirmant l'hypothèse de conditions plus favorables à la prédiction.

![XGBoost Summer](../../reports/3/XGBoost-scatterplot.png)

### Scénarios 4, 5, 6 : Generalized Additive Models (GAMs)

Les GAMs ont été testés comme alternative aux modèles tree-based, offrant une meilleure interprétabilité grâce à leurs courbes de réponse partielles visualisables.

#### Scénario 4 : GAM global

| Modèle | R² | MAE | RMSE |
|--------|-----|-----|------|
| **LinearGAM** | **0.2958** | **0.4896** | **0.6526** |
| GammaGAM | 0.2838 | 0.4975 | 0.6637 |
| PoissonGAM | 0.2179 | 0.5648 | 0.7248 |

Le LinearGAM affiche des performances comparables à la régression linéaire classique tout en capturant des relations non-linéaires grâce aux splines.

![LinearGAM Global](../../reports/4/LinearGAM-scatterplot.png)

#### Scénario 5 : GAM hiver

| Modèle | R² | MAE | RMSE |
|--------|-----|-----|------|
| **LinearGAM** | **0.3142** | **0.4947** | **0.6515** |
| GammaGAM | 0.2781 | 0.4929 | 0.6372 |
| PoissonGAM | 0.1899 | 0.5833 | 0.7444 |

![LinearGAM Winter](../../reports/5/LinearGAM-scatterplot.png)

#### Scénario 6 : GAM été

| Modèle | R² | MAE | RMSE |
|--------|-----|-----|------|
| **LinearGAM** | **0.2742** | **0.4608** | **0.6160** |
| PoissonGAM | 0.1784 | 0.5582 | 0.7279 |

![LinearGAM Summer](../../reports/6/LinearGAM-scatterplot.png)

### Analyse comparative

L'analyse des résultats permet de tirer plusieurs conclusions :

1. **Supériorité des modèles d'ensemble** : XGBoost et Gradient Boosting dominent systématiquement les classements, confirmant leur capacité à capturer des interactions complexes entre features.

2. **Spécialisation saisonnière limitée** : Les modèles spécialisés par saison n'apportent qu'un gain marginal de performance, suggérant que le modèle global avec variable `SEASON` capture déjà efficacement les différences saisonnières.

3. **GAMs comme alternative interprétable** : Les LinearGAMs offrent un compromis intéressant entre performance et interprétabilité, utile pour l'analyse exploratoire.

4. **Limites de prédictibilité** : Un R² plafonné autour de 0.33 indique que les retards de bus sont influencés par de nombreux facteurs non capturés dans les données (trafic routier, événements ponctuels, défaillances techniques imprévisibles).

### Modèle retenu pour la production

Le **modèle XGBoost global (Scénario 1)** a été sélectionné pour le déploiement en production, combinant :
- Les meilleures performances globales (R² = 0.3296)
- Une bonne généralisation sur toutes les saisons
- Un temps d'inférence rapide (< 100ms par prédiction)
- Une capacité à gérer des features hétérogènes (numériques, catégorielles, cycliques)

## Déploiement sur Raspberry Pi

Afin de valider la faisabilité d’un déploiement sur une plateforme embarquée à faible consommation, l’ensemble de l’application a été installé et configuré sur un **Raspberry Pi**. Cette étape permet de démontrer que l’architecture retenue est suffisamment légère, robuste et modulaire pour fonctionner sur un matériel contraint, tout en restant accessible depuis le réseau local et Internet.

### Choix de la plateforme

Le Raspberry Pi a été retenu pour plusieurs raisons :

- faible consommation énergétique, adaptée à un fonctionnement continu,
- large compatibilité avec les technologies Web modernes (Node.js, Python, Nginx),
- disponibilité d’interfaces réseau et de stockage avancées (NVMe),
- pertinence pédagogique pour illustrer un déploiement proche des conditions réelles.

Et surtout disponible chez moi.

Le système d’exploitation utilisé est **Ubuntu Server 24.04 LTS (ARM64)**, offrant un compromis entre stabilité, mises à jour de sécurité et compatibilité logicielle.

### Organisation du stockage

Le système repose sur une organisation hybride :

- **Carte SD** : utilisée uniquement pour le démarrage du système et les fichiers critiques de l’OS.
- **SSD NVMe** : utilisé pour stocker l’intégralité du projet applicatif.

Cette séparation permet :
- de limiter l’usure de la carte SD,
- d’améliorer les performances d’accès disque,
- de sécuriser le stockage applicatif.

Le NVMe est monté dans le répertoire : /mnt/nvme

L’application est installée dans : /mnt/nvme/pr_subway_martins_bidaux/


### Déploiement des services applicatifs

L’application est composée de trois services principaux :

1. **Frontend React (build statique)**  
   - Généré via Vite (`npm run build`)
   - Servi par Nginx
   - Aucun serveur de développement exposé

2. **Backend Node.js**  
   - Fournit les routes REST liées aux données de transport
   - Écoute uniquement sur `127.0.0.1:3000`

3. **API de prédiction Python (Flask)**  
   - Héberge le modèle de machine learning
   - Utilise un environnement virtuel Python (`venv`) afin de respecter les contraintes PEP 668
   - Écoute uniquement sur `127.0.0.1:5000`

Ces services sont isolés et communiquent uniquement via des interfaces locales, renforçant la sécurité globale du système.

### Utilisation de Nginx comme point d’entrée unique

Nginx est utilisé comme **reverse proxy central**, jouant un rôle clé dans l’architecture :

- exposition de l’application via le port HTTP standard (80),
- redirection des requêtes vers les services internes,
- suppression de l’exposition directe des ports applicatifs.

Les routes sont organisées de la manière suivante :

| Route | Service associé |
|------|----------------|
| `/` | Frontend React |
| `/api` | Backend Node.js |
| `/predict` | API Python de prédiction |

Grâce à cette approche, le frontend communique avec les backends via des chemins relatifs, garantissant un fonctionnement identique en réseau local et via Internet.

### Démarrage automatique et stabilité

Pour assurer un fonctionnement continu, chaque composant est géré par un **service systemd** :

- démarrage automatique au boot,
- redémarrage en cas de défaillance,
- contrôle centralisé via `systemctl`.

L’API Python utilise explicitement l’interpréteur de l’environnement virtuel afin de garantir la cohérence des dépendances.

### Accès à l’application

Depuis le réseau local, l’application est accessible via :http://IP_DU_RASPBERRY


Pour un accès depuis Internet, une redirection NAT est configurée sur la box :

- port externe : 8080
- port interne : 80 (Raspberry Pi)

Les ports internes (3000, 5000, 5173) ne sont jamais exposés, conformément aux bonnes pratiques de sécurité.
