document.addEventListener('DOMContentLoaded', function () {
    const stockData = {
        'AI.PA': { name: 'Air Liquide', sector: 'Biens de base' },
        'AIR.PA': { name: 'Airbus', sector: 'Industrie' },
        'TTE.PA': { name: 'TotalEnergies', sector: 'Énergie' },
        'LVMH.PA': { name: 'LVMH', sector: 'Consommation' },
        'CAP.PA': { name: 'Capgemini', sector: 'Technologie' },
        'SAN.PA': { name: 'Sanofi', sector: 'Santé' },
    };

    let priceChart, rsiChart;
    let currentTicker = 'AI.PA';
    let sma20Visible = false;
    let sma50Visible = false;

    function generateFakeData(ticker) {
        const basePrice = 50 + Math.random() * 150;
        const volatility = 0.02 + (ticker.includes('TTE') ? 0.015 : (ticker.includes('CAP') ? 0.01 : 0));
        let currentDate = new Date();
        currentDate.setFullYear(currentDate.getFullYear() - 1);
        const data = [];
        let lastPrice = basePrice;
        let lastRsiGain = 0;
        let lastRsiLoss = 0;

        for (let i = 0; i < 365; i++) {
            const changePercent = 2 * volatility * Math.random() - volatility + 0.0005;
            lastPrice *= (1 + changePercent);
            lastPrice = Math.max(lastPrice, 10);
            
            const change = changePercent * lastPrice;
            const gain = Math.max(0, change);
            const loss = Math.max(0, -change);
            
            lastRsiGain = (lastRsiGain * 13 + gain) / 14;
            lastRsiLoss = (lastRsiLoss * 13 + loss) / 14;
            
            const rs = lastRsiGain / lastRsiLoss;
            const rsi = (lastRsiLoss === 0) ? 100 : 100 - (100 / (1 + rs));
            
            data.push({
                date: new Date(currentDate),
                price: parseFloat(lastPrice.toFixed(2)),
                rsi: parseFloat(rsi.toFixed(2))
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return data;
    }

    function calculateSMA(data, windowSize) {
        let sma = [];
        for (let i = 0; i < data.length; i++) {
            if (i < windowSize - 1) {
                sma.push(null);
            } else {
                let sum = 0;
                for (let j = 0; j < windowSize; j++) {
                    sum += data[i - j].price;
                }
                sma.push(parseFloat((sum / windowSize).toFixed(2)));
            }
        }
        return sma;
    }

    function createCharts() {
        const priceCtx = document.getElementById('priceChart').getContext('2d');
        priceChart = new Chart(priceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cours de Clôture',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false },
                    x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            }
        });

        const rsiCtx = document.getElementById('rsiChart').getContext('2d');
        rsiChart = new Chart(rsiCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'RSI (14)',
                    data: [],
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                 plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: { min: 0, max: 100 },
                    x: { display: false }
                },
                annotation: {
                    annotations: [
                        { type: 'line', mode: 'horizontal', scaleID: 'y', value: 70, borderColor: '#ef4444', borderWidth: 1, borderDash: [5, 5], label: { content: 'Surachat', enabled: true, position: 'end' }},
                        { type: 'line', mode: 'horizontal', scaleID: 'y', value: 30, borderColor: '#22c55e', borderWidth: 1, borderDash: [5, 5], label: { content: 'Survente', enabled: true, position: 'end' }}
                    ]
                }
            }
        });
    }

    function updateUI(ticker) {
        currentTicker = ticker;
        const data = generateFakeData(ticker);
        const labels = data.map(d => d.date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric'}));
        const prices = data.map(d => d.price);
        const rsiValues = data.map(d => d.rsi);
        const sma20 = calculateSMA(data, 20);
        const sma50 = calculateSMA(data, 50);

        document.getElementById('chartTitle').innerText = `Analyse de ${stockData[ticker].name} (${ticker})`;

        priceChart.data.labels = labels;
        priceChart.data.datasets = [{
            label: 'Cours de Clôture (€)',
            data: prices,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
            fill: true
        }];

        if (sma20Visible) addSmaToChart(sma20, 20);
        if (sma50Visible) addSmaToChart(sma50, 50);
        
        priceChart.update();

        rsiChart.data.labels = labels;
        rsiChart.data.datasets[0].data = rsiValues;
        rsiChart.update();

        updatePrediction(ticker);
        updateModelPerformance();
        updateRecommendation(ticker);
    }
    
    function addSmaToChart(smaData, period) {
        const colors = { 20: '#f59e0b', 50: '#84cc16' };
        const smaDataset = {
            label: `SMA ${period}`,
            data: smaData,
            borderColor: colors[period],
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.1,
            fill: false
        };
        priceChart.data.datasets.push(smaDataset);
    }

    function toggleSma(period) {
        if (period === 20) sma20Visible = !sma20Visible;
        if (period === 50) sma50Visible = !sma50Visible;
        updateUI(currentTicker);
        updateSmaButtons();
    }
    
    function updateSmaButtons() {
        document.getElementById('toggleSma20').classList.toggle('bg-blue-500', sma20Visible);
        document.getElementById('toggleSma20').classList.toggle('text-white', sma20Visible);
        document.getElementById('toggleSma50').classList.toggle('bg-blue-500', sma50Visible);
        document.getElementById('toggleSma50').classList.toggle('text-white', sma50Visible);
    }

    function updatePrediction(ticker) {
        const predictionCard = document.getElementById('predictionCard');
        const predictionSignal = document.getElementById('predictionSignal');
        const predictionProba = document.getElementById('predictionProba');
        
        predictionCard.className = 'bg-white p-6 rounded-lg shadow';
        
        const rand = Math.random();
        let signal, proba, className;
        
        if(stockData[ticker].sector === 'Énergie' && rand < 0.6) {
             signal = 'ACHAT'; proba = 60 + Math.floor(Math.random() * 10); className = 'prediction-buy';
        } else if (stockData[ticker].sector === 'Technologie' && rand < 0.55) {
             signal = 'VENTE'; proba = 55 + Math.floor(Math.random() * 10); className = 'prediction-sell';
        } else if (rand < 0.45) {
            signal = 'ACHAT'; proba = 50 + Math.floor(Math.random() * 15); className = 'prediction-buy';
        } else if (rand < 0.8) {
            signal = 'CONSERVER'; proba = 70 + Math.floor(Math.random() * 10); className = 'prediction-hold';
        } else {
            signal = 'VENTE'; proba = 50 + Math.floor(Math.random() * 15); className = 'prediction-sell';
        }

        predictionSignal.innerText = signal;
        predictionProba.innerText = `Probabilité estimée : ${proba}%`;
        predictionCard.classList.add(className);
    }
    
    function updateModelPerformance() {
        const tp = 620 + Math.floor(Math.random() * 20);
        const tn = 580 + Math.floor(Math.random() * 20);
        const fp = 110 + Math.floor(Math.random() * 10);
        const fn = 130 + Math.floor(Math.random() * 10);
        const total = tp + tn + fp + fn;

        document.getElementById('confMatTP').innerText = tp;
        document.getElementById('confMatTN').innerText = tn;
        document.getElementById('confMatFP').innerText = fp;
        document.getElementById('confMatFN').innerText = fn;

        const accuracy = ((tp + tn) / total * 100).toFixed(1) + '%';
        const precision = tp / (tp + fp);
        const recall = tp / (tp + fn);
        const f1 = (2 * (precision * recall) / (precision + recall)).toFixed(2);
        
        document.getElementById('metricAccuracy').innerText = accuracy;
        document.getElementById('metricF1').innerText = f1;
        document.getElementById('metricAuc').innerText = (0.75 + Math.random() * 0.05).toFixed(2);
    }
    
    function updateRecommendation(ticker) {
        const signal = document.getElementById('predictionSignal').innerText;
        const recoText = document.getElementById('recommendationText');
        const stock = stockData[ticker];
        
        let text = `Pour l'action **${stock.name} (${stock.sector})**, notre modèle génère un signal de **${signal}**. `;
        
        switch(signal) {
            case 'ACHAT':
                text += `Cette recommandation est soutenue par des indicateurs techniques favorables. Compte tenu du contexte de rotation sectorielle, les actions du secteur
                 **${stock.sector}** montrent un potentiel intéressant. Une approche d'achat prudent est conseillée.`;
                break;
            case 'VENTE':
                 text += `Ce signal suggère une potentielle pression à la baisse. Pour le secteur **${stock.sector}**, cela pourrait être lié à sa sensibilité aux taux 
                 d'intérêt ou à un ralentissement du momentum. Une surveillance accrue est recommandée.`;
                 break;
            case 'CONSERVER':
                 text += `Le signal neutre indique un équilibre entre les forces acheteuses et vendeuses. Il n'y a pas de conviction forte pour un mouvement directionnel 
                 à court terme. La position actuelle peut être maintenue en attendant une plus grande clarté.`;
                 break;
        }
        recoText.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-blue-600">$1</strong>');
    }

    function init() {
        const selector = document.getElementById('stockSelector');
        Object.keys(stockData).forEach(ticker => {
            const option = document.createElement('option');
            option.value = ticker;
            option.innerText = stockData[ticker].name;
            selector.appendChild(option);
        });

        selector.addEventListener('change', (e) => updateUI(e.target.value));
        
        document.getElementById('toggleSma20').addEventListener('click', () => toggleSma(20));
        document.getElementById('toggleSma50').addEventListener('click', () => toggleSma(50));

        createCharts();
        updateUI(currentTicker);
        updateSmaButtons();
    }

    init();
     const backToTopBtn = document.getElementById('backToTopBtn');

  // Cacher le bouton au chargement
  backToTopBtn.style.display = 'none';

  // Afficher / Cacher le bouton selon le scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
      backToTopBtn.style.display = 'flex';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  // Remonter en haut de la page au clic
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});