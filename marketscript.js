const config = {
    refreshInterval: 60000,
    frankfurterEndpoint: 'https://api.frankfurter.app/latest',
    retryAttempts: 3,
    retryDelay: 5000
};

function formatCurrency(number, decimals = 2) {
    return `₺${Number(number).toFixed(decimals)}`;
}

function updateTimestamp() {
    const options = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    };
    document.getElementById('lastUpdate').textContent = 
        `Last updated: ${new Date().toLocaleTimeString('tr-TR', options)}`;
}

function setLoadingState(isLoading) {
    const elements = ['usdtry', 'eurtry'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (isLoading) {
            element.textContent = 'Loading...';
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    });
}

async function fetchWithRetry(url, attempts = config.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            if (i === attempts - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        }
    }
}

async function fetchForexRates() {
    setLoadingState(true);
    try {
        const [eurData, usdData] = await Promise.all([
            fetchWithRetry(`${config.frankfurterEndpoint}?from=EUR&to=TRY`),
            fetchWithRetry(`${config.frankfurterEndpoint}?from=USD&to=TRY`)
        ]);

        const usdElement = document.getElementById('usdtry');
        const eurElement = document.getElementById('eurtry');

        usdElement.textContent = formatCurrency(usdData.rates.TRY, 4);
        eurElement.textContent = formatCurrency(eurData.rates.TRY, 4);

        // Add color indication for rate changes
        if (usdElement.dataset.previousValue) {
            const previousUsd = parseFloat(usdElement.dataset.previousValue);
            const currentUsd = usdData.rates.TRY;
            usdElement.classList.toggle('rate-up', currentUsd > previousUsd);
            usdElement.classList.toggle('rate-down', currentUsd < previousUsd);
        }
        usdElement.dataset.previousValue = usdData.rates.TRY;

        updateTimestamp();
    } catch (error) {
        console.error('Error fetching forex rates:', error);
        const errorMessage = error.message.includes('HTTP error') 
            ? 'Service unavailable' 
            : 'Network error';
        
        document.getElementById('usdtry').textContent = errorMessage;
        document.getElementById('eurtry').textContent = errorMessage;
    } finally {
        setLoadingState(false);
    }
}

// Network status handling
function handleNetworkStatus() {
    const updateNetworkStatus = () => {
        if (navigator.onLine) {
            fetchForexRates();
        } else {
            document.getElementById('usdtry').textContent = 'Offline';
            document.getElementById('eurtry').textContent = 'Offline';
            document.getElementById('lastUpdate').textContent = 'Waiting for connection...';
        }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
}

// Initialize
handleNetworkStatus();
fetchForexRates();

// Set up periodic updates
let updateInterval = setInterval(fetchForexRates, config.refreshInterval);

// Refresh interval management for tab visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(updateInterval);
    } else {
        fetchForexRates(); // Immediate update when tab becomes visible
        updateInterval = setInterval(fetchForexRates, config.refreshInterval);
    }
});

// Initial fetch
fetchForexRates();

// Set up periodic updates
setInterval(fetchForexRates, config.refreshInterval);
