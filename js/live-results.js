/**
 * Script pour charger les résultats en live depuis Google Sheets
 * 
 * CONFIGURATION REQUISE:
 * 1. Créez un Google Sheet avec les colonnes: Rang, Nom, Prénom, Genre, Boucles, Distance
 * 2. Partagez le sheet en "Accessible à tous avec le lien"
 * 3. Copiez l'ID du sheet (dans l'URL)
 * 4. Remplacez SHEET_ID ci-dessous
 */

// ⚙️ CONFIGURATION - REMPLACEZ CES VALEURS
const SHEET_ID = '1BkRs3OAGL1TZFS9Tnff1PeBTomVtM-aVSupHkckVK6M'; // Ex: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
const SHEET_NAME = 'Infinity'; // Nom de l'onglet principal (Format INFINITY)
const SHEET_NAME_EXPLORER = 'Explorer'; // Nom du 2e onglet (Format Explorer)
const API_KEY = 'VOTRE_API_KEY_ICI'; // Optionnel mais recommandé pour éviter les limites de quota

// Constructeur d'URL pour l'API Google Sheets (GViz)
function getSheetUrl(sheetName) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
}

// Fonction pour charger les résultats depuis Google Sheets
async function loadLiveResults(sheetName = SHEET_NAME) {
  try {
    const response = await fetch(getSheetUrl(sheetName));
    const text = await response.text();
    
    // Google Sheets renvoie du JSONP, on doit extraire le JSON
    const json = JSON.parse(text.substr(47).slice(0, -2));
    
    const rows = json.table.rows;
    const results = [];
    
    // Parser les données (en sautant l'en-tête si nécessaire)
    rows.forEach((row, index) => {
      // Si la première ligne est l'en-tête, on la saute
      if (index === 0 && row.c[0]?.v === 'Rang') return;
      
      // Ignorer les lignes vides (où toutes les colonnes importantes sont null)
      if (!row.c || !row.c[0] || !row.c[1] || !row.c[2]) return;
      
      results.push({
        rang: row.c[0]?.v || '',
        nom: row.c[1]?.v || '',
        prenom: row.c[2]?.v || '',
        genre: row.c[3]?.v || '',
        boucles: row.c[4]?.v || 0,
        distance: row.c[5]?.v || 0
      });
    });
    
    return results;
  } catch (error) {
    console.error('Erreur lors du chargement des résultats:', error);
    return [];
  }
}

// Fonction pour afficher les résultats dans un tableau ciblé
function displayResults(results, tbodySelector = '.results-table tbody') {
  const tbody = document.querySelector(tbodySelector);
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  results.forEach((result, index) => {
    const tr = document.createElement('tr');
    
    // Ajouter les classes pour le podium
    if (result.rang === 1) tr.classList.add('rank-1');
    else if (result.rang === 2) tr.classList.add('rank-2');
    else if (result.rang === 3) tr.classList.add('rank-3');
    
    // Animation d'entrée progressive
    tr.style.animationDelay = `${index * 0.05}s`;
    
    tr.innerHTML = `
      <td class="rank">${result.rang}</td>
      <td>${result.nom}</td>
      <td>${result.prenom}</td>
      <td><span class="gender-badge gender-${result.genre.toLowerCase()}">${result.genre}</span></td>
      <td>${result.boucles === 'DNS' ? 'DNS' : result.boucles}</td>
      <td>${result.distance === 'DNS' ? '-' : result.distance}</td>
    `;
    
    tbody.appendChild(tr);
  });
  
  // Mettre à jour les stats et le graphique UNIQUEMENT pour la table principale
  if (tbodySelector === '.results-table tbody') {
    updateStats(results);
  }
}

// Fonction pour mettre à jour les statistiques
function updateStats(results) {
  const maxDistance = Math.max(...results.map(r => typeof r.distance === 'number' ? r.distance : 0));
  const maxLaps = Math.max(...results.map(r => typeof r.boucles === 'number' ? r.boucles : 0));
  
  // Mettre à jour le graphique si présent
  if (typeof updateChart === 'function') {
    updateChart(results);
  }
  
  // Afficher les stats
  const statsElements = {
    distance: document.querySelector('.facility-text p'),
    laps: document.querySelector('.facility-item:last-child .facility-text p')
  };
  
  if (statsElements.distance) {
    statsElements.distance.textContent = `${maxDistance} km`;
  }
}

// Fonction pour mettre à jour le graphique
function updateChart(results) {
  // Compter le nombre de personnes par boucle
  const lapsCount = {};
  
  results.forEach(result => {
    const laps = result.boucles === 'DNS' ? '0' : String(result.boucles);
    lapsCount[laps] = (lapsCount[laps] || 0) + 1;
  });
  
  // Mettre à jour le graphique Chart.js si disponible
  if (window.lapsChart) {
    window.lapsChart.data.labels = Object.keys(lapsCount);
    window.lapsChart.data.datasets[0].data = Object.values(lapsCount);
    window.lapsChart.update();
  }
}

// Fonction pour rafraîchir automatiquement les résultats
function startAutoRefresh(intervalSeconds = 30) {
  // Charger immédiatement
  loadAndDisplay();
  
  // Puis rafraîchir toutes les X secondes
  setInterval(loadAndDisplay, intervalSeconds * 1000);
  
  console.log(`🔄 Rafraîchissement automatique activé (toutes les ${intervalSeconds}s)`);
}

// Fonction principale
async function loadAndDisplay() {
  try {
    const [infinityResults, explorerResults] = await Promise.all([
      loadLiveResults(SHEET_NAME),
      loadLiveResults(SHEET_NAME_EXPLORER)
    ]);

  // Afficher INFINITY (principal)
  if (infinityResults.length > 0) {
    displayResults(infinityResults, '.results-table tbody');
    const loading = document.getElementById('loading');
    const table = document.querySelector('.results-table');
    if (loading && table) {
      loading.style.display = 'none';
      table.style.display = 'block';
    }
    console.log(`✅ ${infinityResults.length} résultats (INFINITY)`);
  }

  // Afficher EXPLORER (second sheet)
  if (explorerResults.length > 0) {
    displayResults(explorerResults, '.results-table-explorer');
    const loadingEx = document.getElementById('loading-explorer');
    const tableEx = document.getElementById('explorer-table');
    if (loadingEx && tableEx) {
      loadingEx.style.display = 'none';
      tableEx.style.display = 'block';
    }
    console.log(`✅ ${explorerResults.length} résultats (EXPLORER)`);
  }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des résultats:', error);
  }
}

// Indicateur de dernière mise à jour
function showLastUpdate() {
  const updateTime = document.getElementById('last-update');
  if (updateTime) {
    const now = new Date();
    updateTime.textContent = `Dernière mise à jour: ${now.toLocaleTimeString('fr-FR')}`;
  }
}

// Export pour utilisation
window.LiveResults = {
  load: loadAndDisplay,
  startAutoRefresh: startAutoRefresh,
  showLastUpdate: showLastUpdate
};
