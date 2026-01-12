require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const { get } = require('http');

const url = 'https://prim.iledefrance-mobilites.fr/marketplace/disruptions_bulk/disruptions/v2';

const urlPassage = 'https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring';
// Clé API depuis le .env
const apiKey = process.env.PRIM_API_KEY;

async function getMetroIncidents() {
  try {
    const response = await axios.get(url, {
      headers: {
        'apikey': apiKey,        
        'Accept': 'application/json'
      }
    });

    const messages = response.data;

    // Enregistrer tout dans un fichier JSON
    fs.writeFileSync('metro_incidents.json', JSON.stringify(messages, null, 2));
    console.log('Les données ont été enregistrées dans metro_incidents.json');
    if (messages.length === 0) {
      console.log('Aucun incident métro en cours.');
      return;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des incidents métro :', error.response?.data || error.message);
  }
}

async function getPassages(stationId) {
  try {
    const response = await axios.get(urlPassage, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
      },
      params: {
        MonitoringRef: 'STIF:StopPoint:Q:473921:',
      }
    });

    const data = response.data;
    fs.writeFileSync('prochain_passages.json', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erreur lors de la récupération des passages :', error.response?.data || error.message);
  }
}

getMetroIncidents();
getPassages();