// API Base URL
const API_BASE = '';

// Global state
let currentFilters = {
    model: '',
    color: '',
    ram: '',
    storage: ''
};

let priceChart = null;
let distributionChart = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await initializeFilters();
    updateViewState(); // Show empty state initially

    // Add event listeners
    document.getElementById('model-select').addEventListener('change', handleFilterChange);
    document.getElementById('color-select').addEventListener('change', handleFilterChange);
    document.getElementById('ram-select').addEventListener('change', handleFilterChange);
    document.getElementById('storage-select').addEventListener('change', handleFilterChange);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
});

// Toggle between empty state and data view
function updateViewState() {
    const emptyState = document.getElementById('empty-state');
    const dataView = document.getElementById('data-view');

    if (!currentFilters.model) {
        // Show empty state when no model is selected
        emptyState.style.display = 'flex';
        dataView.style.display = 'none';
    } else {
        // Show data view when model is selected
        emptyState.style.display = 'none';
        dataView.style.display = 'flex';
    }
}

// Initialize filter dropdowns
async function initializeFilters() {
    try {
        // Load models
        const modelsResponse = await fetch(`${API_BASE}/api/models`);
        const modelsData = await modelsResponse.json();

        const modelSelect = document.getElementById('model-select');
        modelsData.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model.replace(/_/g, ' ');
            modelSelect.appendChild(option);
        });

        // Load initial filter options
        await updateFilterOptions();
    } catch (error) {
        console.error('Error initializing filters:', error);
    }
}

// Update filter options based on selected model
async function updateFilterOptions() {
    try {
        const model = currentFilters.model;
        const url = model ? `${API_BASE}/api/filters?model=${model}` : `${API_BASE}/api/filters`;

        const response = await fetch(url);
        const data = await response.json();

        // Update color options
        const colorSelect = document.getElementById('color-select');
        const currentColor = colorSelect.value;
        colorSelect.innerHTML = '<option value="">All Colors</option>';
        data.colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            if (color === currentColor) option.selected = true;
            colorSelect.appendChild(option);
        });

        // Update RAM options
        const ramSelect = document.getElementById('ram-select');
        const currentRam = ramSelect.value;
        ramSelect.innerHTML = '<option value="">All RAM</option>';
        data.ram.forEach(ram => {
            const option = document.createElement('option');
            option.value = ram;
            option.textContent = ram;
            if (ram === currentRam) option.selected = true;
            ramSelect.appendChild(option);
        });

        // Update storage options
        const storageSelect = document.getElementById('storage-select');
        const currentStorage = storageSelect.value;
        storageSelect.innerHTML = '<option value="">All Storage</option>';
        data.storage.forEach(storage => {
            const option = document.createElement('option');
            option.value = storage;
            option.textContent = storage;
            if (storage === currentStorage) option.selected = true;
            storageSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error updating filter options:', error);
    }
}

// Handle filter changes
async function handleFilterChange(event) {
    const filterId = event.target.id;
    const value = event.target.value;

    if (filterId === 'model-select') {
        currentFilters.model = value;
        await updateFilterOptions();
    } else if (filterId === 'color-select') {
        currentFilters.color = value;
    } else if (filterId === 'ram-select') {
        currentFilters.ram = value;
    } else if (filterId === 'storage-select') {
        currentFilters.storage = value;
    }

    updateViewState();

    if (currentFilters.model) {
        await loadData();
    }
}

// Reset all filters
async function resetFilters() {
    currentFilters = {
        model: '',
        color: '',
        ram: '',
        storage: ''
    };

    document.getElementById('model-select').value = '';
    document.getElementById('color-select').value = '';
    document.getElementById('ram-select').value = '';
    document.getElementById('storage-select').value = '';

    await updateFilterOptions();
    updateViewState();
    await loadData();
}

// Load and display data
async function loadData() {
    try {
        // Build query parameters
        const params = new URLSearchParams();
        if (currentFilters.model) params.append('model', currentFilters.model);
        if (currentFilters.color) params.append('color', currentFilters.color);
        if (currentFilters.ram) params.append('ram', currentFilters.ram);
        if (currentFilters.storage) params.append('storage', currentFilters.storage);

        // Fetch data and stats
        const [dataResponse, statsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/data?${params}`),
            fetch(`${API_BASE}/api/stats?${params}`)
        ]);

        const data = await dataResponse.json();
        const stats = await statsResponse.json();

        // Update stats cards
        updateStats(stats);

        // Update charts
        updateCharts(data);

        // Update table
        updateTable(data);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Update stats cards
function updateStats(stats) {
    document.getElementById('current-price').textContent = `₹${stats.current_price.toLocaleString()}`;
    document.getElementById('min-price').textContent = `₹${stats.min_price.toLocaleString()}`;
    document.getElementById('max-price').textContent = `₹${stats.max_price.toLocaleString()}`;
    document.getElementById('avg-price').textContent = `₹${Math.round(stats.avg_price).toLocaleString()}`;
}

// Update charts
function updateCharts(data) {
    // Process data for price trend chart - group by variant and date
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Group data by variant (color + RAM + storage)
    const variantData = {};
    sortedData.forEach(item => {
        const variant = `${item.color} - ${item.ram}/${item.storage}`;
        if (!variantData[variant]) {
            variantData[variant] = {};
        }

        const date = new Date(item.timestamp).toLocaleDateString();
        if (!variantData[variant][date]) {
            variantData[variant][date] = { total: 0, count: 0 };
        }
        variantData[variant][date].total += item.price;
        variantData[variant][date].count += 1;
    });

    // Get all unique dates
    const allDates = [...new Set(sortedData.map(item => new Date(item.timestamp).toLocaleDateString()))];
    allDates.sort((a, b) => new Date(a) - new Date(b));

    // Prepare datasets for each variant
    const datasets = [];
    const variantNames = Object.keys(variantData);

    console.log('📊 Number of variants found:', variantNames.length);
    console.log('📊 Variant names:', variantNames);

    variantNames.forEach((variant, index) => {
        const prices = allDates.map(date => {
            if (variantData[variant][date]) {
                return variantData[variant][date].total / variantData[variant][date].count;
            }
            return null;
        });

        // Generate a unique color for each variant
        const hue = (index * 360 / variantNames.length) % 360;
        const color = `hsl(${hue}, 70%, 60%)`;

        datasets.push({
            label: variant,
            data: prices,
            borderColor: color,
            backgroundColor: `hsla(${hue}, 70%, 60%, 0.1)`,
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            spanGaps: true // Connect lines even if there are null values
        });
    });

    console.log('📊 Number of datasets created:', datasets.length);

    // Update price trend chart with multiple lines
    updatePriceTrendChart(allDates, datasets);

    // Process data for distribution chart (unchanged)
    const variantPrices = {};
    data.forEach(item => {
        const variant = `${item.color} - ${item.ram}/${item.storage}`;
        if (!variantPrices[variant]) {
            variantPrices[variant] = [];
        }
        variantPrices[variant].push(item.price);
    });

    const variants = Object.keys(variantPrices);
    const avgVariantPrices = variants.map(variant => {
        const prices = variantPrices[variant];
        return prices.reduce((a, b) => a + b, 0) / prices.length;
    });

    updateDistributionChart(variants, avgVariantPrices);
}

// Update price trend chart
function updatePriceTrendChart(labels, datasets) {
    const ctx = document.getElementById('price-trend-chart').getContext('2d');

    if (priceChart) {
        priceChart.destroy();
    }

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#a0aec0',
                        padding: 15,
                        font: {
                            size: 12
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    },
                    onClick: function (e, legendItem, legend) {
                        // Default Chart.js behavior - toggle dataset visibility
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;

                        if (ci.isDatasetVisible(index)) {
                            ci.hide(index);
                            legendItem.hidden = true;
                        } else {
                            ci.show(index);
                            legendItem.hidden = false;
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#a0aec0',
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a0aec0',
                        callback: function (value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a0aec0',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Update distribution chart
function updateDistributionChart(labels, data) {
    const ctx = document.getElementById('price-distribution-chart').getContext('2d');

    if (distributionChart) {
        distributionChart.destroy();
    }

    // Generate gradient colors
    const colors = labels.map((_, i) => {
        const hue = (i * 360 / labels.length) % 360;
        return `hsla(${hue}, 70%, 60%, 0.8)`;
    });

    distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Price',
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#a0aec0',
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return `₹${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#a0aec0',
                        callback: function (value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#a0aec0',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Update data table
function updateTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    // Sort by timestamp descending and take first 20
    const recentData = [...data]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);

    recentData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.model.replace(/_/g, ' ')}</td>
            <td>${item.color}</td>
            <td>${item.ram}</td>
            <td>${item.storage}</td>
            <td>₹${item.price.toLocaleString()}</td>
            <td>${new Date(item.timestamp).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });
}
