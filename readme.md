# PR - Predictive system for the delay in public transports

## Datasources

| Name | Data | Type | Source | Date | Additionnal info |
|------|------|------|--------|------|------------------|
| TTC Delays and Routes 2023 | Toronto's bus delays in 2023 | Dataset | [Kaggle 2023] | 2025-10-15 | |
| Toronto Bus Delay 2022 | Toronto's bus delays in  2022 | Dataset | [Kaggle 2022] | 2025-10-15 | Different name but same data as 2023 |
| Hourly climate data | Canadian weather reports | Dataset | [Government of Canada] | 2025-10-15 | Used station of id : 6158359 , records 110,001 (july 2022) through 130,000 (october 2024) |
| TTC Routes & Shedules | Name and ID of the bus routes | Dataset | [TTC] | 2025-10-15 | The website doesn't provide any info but by surveilling the network activity we found the API for our data : [TTC API] |

<!-- Links to cleanup the md code -->
[Kaggle 2023]: https://www.kaggle.com/datasets/karmansinghbains/ttc-delays-and-routes-2023
[Kaggle 2022]: https://www.kaggle.com/datasets/reihanenamdari/toronto-bus-delay-2022
[Government of Canada]: https://climate-change.canada.ca/climate-data/#/hourly-climate-data
[TTC]: https://www.ttc.ca/routes-and-schedules/listroutes/bus
[TTC API]: https://www.ttc.ca/ttcapi/routedetail/listroutes

## Explored datasources

| Name | Data | Type | Source | Date |
|------|------|------|--------|------|
| PRIM - Traffic Info Messages (v2) | Current, upcoming and past disruption info | API | [PRIM API] | 2025-10-05 |
| INFOCLIMAT - Weather data | Current and past weather data | API | [INFOCLIMAT API] | 2025-10-05 |

<!-- Links to cleanup the md code -->
[PRIM API]: https://prim.iledefrance-mobilites.fr/en/apis/idfm-navitia-line_reports-v2
[INFOCLIMAT API]: https://www.infoclimat.fr/opendata/

> PRIM - Traffic Info Messages (v2) seems to be still in development, we only have elevator incidents for metro and RER

## Current problems - to adress to M. Alaya

* No entries for december
* Unsure of how to handle windchill
* Handling bimodality : `TEMP`, `DEW_POINT_TEMP`
