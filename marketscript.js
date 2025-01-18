const config = {
    refreshInterval: 60000,
    frankfurterEndpoint: 'https://api.frankfurter.app/latest'
};

function formatCurrency(number, decimals = 2) {
    return Number(number).toFixed(decimals);
}

function updateTimestamp() {
    document.getElementById('lastUpdate').textContent = 
        `Last updated: ${new Date().toLocaleTimeString()}`;
}

async function fetchForexRates() {
    try {
        const eurResponse = await fetch(`${config.frankfurterEndpoint}?from=EUR&to=TRY`);
        const usdResponse = await fetch(`${config.frankfurterEndpoint}?from=USD&to=TRY`);
        
        if (!eurResponse.ok || !usdResponse.ok) {
            throw new Error('Forex API response error');
        }

        const eurData = await eurResponse.json();
        const usdData = await usdResponse.json();

        document.getElementById('usdtry').textContent = formatCurrency(usdData.rates.TRY, 4);
        document.getElementById('eurtry').textContent = formatCurrency(eurData.rates.TRY, 4);

        updateTimestamp();
    } catch (error) {
        console.error('Error fetching forex rates:', error);
        document.getElementById('usdtry').textContent = 'Error loading';
        document.getElementById('eurtry').textContent = 'Error loading';
    }
}

// Initial fetch
fetchForexRates();

// Set up periodic updates
setInterval(fetchForexRates, config.refreshInterval);
