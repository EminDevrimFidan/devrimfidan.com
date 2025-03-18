// Initialize variables
let map;
let markers = [];
let destinations = [...destinationsData];
let activeDestination = null;
let statusFilter = "planned"; // Start with planned trips by default
let yearFilter = "all";
let countryFilter = "all";

// Define custom marker icons based on status
const markerIcons = {
    visited: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #34A853; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    }),
    planned: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #FBBC05; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    }),
    wishlist: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #EA4335; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    }),
    active: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #4285F4; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.5);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    })
};

// Initialize map
function initMap() {
    // Create map centered at the world view
    map = L.map('map').setView([20, 0], 2);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Populate the filters
    populateYearFilter();
    populateCountryFilter();
    
    // Apply initial filters - starting with planned trips
    applyFilters();
    
    // Set up map control event listeners
    document.getElementById('zoom-in').addEventListener('click', () => {
        map.setZoom(map.getZoom() + 1);
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
        map.setZoom(map.getZoom() - 1);
    });
    
    document.getElementById('center-map').addEventListener('click', () => {
        map.setView([20, 0], 2);
    });

    // Set initial filter to "planned" in the dropdown
    document.getElementById('status-filter').value = statusFilter;
}

function createMarkers(destinationsToMark) {
    // Clear existing markers
    markers.forEach(marker => {
        if (map.hasLayer(marker.element)) {
            map.removeLayer(marker.element);
        }
    });
    markers = [];
    
    // Create new markers
    destinationsToMark.forEach(destination => {
        const markerIcon = markerIcons[destination.status];
        
        const marker = L.marker(
            [destination.coordinates.lat, destination.coordinates.lng], 
            { icon: markerIcon }
        ).addTo(map);
        
        // Create enhanced popup content with image and detailed notes
        const popupContent = `
            <div class="popup-content">
                <img src="${destination.image}" alt="${destination.name}" class="popup-image" onerror="this.src='https://placehold.co/400x300'">
                <div class="popup-header">
                    <div class="popup-name">${destination.name}, ${destination.country}</div>
                    <div class="popup-year">${destination.year}</div>
                </div>
                <div class="popup-details">
                    <span class="status-${destination.status}">${destination.status.charAt(0).toUpperCase() + destination.status.slice(1)}</span>
                    <span><i class="fas ${destination.transport === 'flight' ? 'fa-plane' : 'fa-train'}"></i> ${destination.duration}</span>
                </div>
                <div class="popup-notes">${destination.notes || ''}</div>
                <div class="popup-detailed-notes">${destination.detailedNotes || ''}</div>
                ${destination.link ? `<div class="popup-link"><a href="${destination.link}" target="_blank">Official Website <i class="fas fa-external-link-alt"></i></a></div>` : ''}
            </div>
        `;
        
        // Bind popup to marker with increased width
        marker.bindPopup(popupContent, {
            className: 'custom-popup',
            closeButton: true,
            maxWidth: 350
        });
        
        // Add click event to marker
        marker.on('click', () => {
            selectDestination(destination.id);
        });
        
        // Store marker reference
        markers.push({
            element: marker,
            destinationId: destination.id
        });
    });
}

function renderDestinations(destinationsToRender) {
    const list = document.getElementById('destination-list');
    list.innerHTML = '';
    
    destinationsToRender.forEach(destination => {
        const item = document.createElement('li');
        item.className = 'destination-item';
        if (activeDestination && activeDestination.id === destination.id) {
            item.classList.add('active');
        }
        item.dataset.id = destination.id;
        
        let statusClass = '';
        switch(destination.status) {
            case 'visited':
                statusClass = 'status-visited';
                break;
            case 'planned':
                statusClass = 'status-planned';
                break;
            case 'wishlist':
                statusClass = 'status-wishlist';
                break;
        }

        // Create destination name with or without link
        let destinationNameHtml = destination.link 
            ? `<div class="destination-name"><a href="${destination.link}" target="_blank">${destination.name}</a></div>`
            : `<div class="destination-name">${destination.name}</div>`;
        
        // Combine both versions: include image and notes
        item.innerHTML = `
            <img src="${destination.image}" alt="${destination.name}" class="destination-image" onerror="this.src='https://placehold.co/400x300'">
            <div class="destination-header">
                ${destinationNameHtml}
                <div class="destination-transport">
                    <i class="fas ${destination.transport === 'flight' ? 'fa-plane' : 'fa-train'}"></i>
                </div>
            </div>
            <div class="destination-details">
                <span class="${statusClass}">${destination.status.charAt(0).toUpperCase() + destination.status.slice(1)}</span>
                <span>${destination.year}</span>
                <span>${destination.country}</span>
                <span>${destination.duration}</span>
            </div>
            <div class="destination-notes-preview">${destination.notes || ''}</div>
        `;
        
        item.addEventListener('click', () => {
            selectDestination(destination.id);
        });
        
        list.appendChild(item);
    });
}

function populateYearFilter() {
    const yearFilter = document.getElementById('year-filter');
    
    // Get unique years from destinations
    const years = [...new Set(destinations.map(d => d.year))].sort();
    
    // Add options for each year
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

function populateCountryFilter() {
    const countryFilter = document.getElementById('country-filter');
    
    // Get unique countries from destinations
    const countries = [...new Set(destinations.map(d => d.country))].sort();
    
    // Clear existing options except the "All countries" option
    while (countryFilter.options.length > 1) {
        countryFilter.remove(1);
    }
    
    // Add options for each country
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
}

function applyFilters() {
    // Apply all filters
    let filteredDestinations = destinations;
    
    if (statusFilter !== 'all') {
        filteredDestinations = filteredDestinations.filter(d => d.status === statusFilter);
    }
    
    if (yearFilter !== 'all') {
        filteredDestinations = filteredDestinations.filter(d => d.year.toString() === yearFilter);
    }
    
    if (countryFilter !== 'all') {
        filteredDestinations = filteredDestinations.filter(d => d.country === countryFilter);
    }
    
    // Update the UI
    renderDestinations(filteredDestinations);
    createMarkers(filteredDestinations);
    
    // Reset active destination if it's filtered out
    if (activeDestination && !filteredDestinations.some(d => d.id === activeDestination.id)) {
        activeDestination = null;
    }
}

function selectDestination(id) {
    const destination = destinations.find(d => d.id === id);
    if (!destination) return;
    
    activeDestination = destination;
    
    // Update sidebar selection
    document.querySelectorAll('.destination-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === id) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    // Update marker appearance
    markers.forEach(marker => {
        const dest = destinations.find(d => d.id === marker.destinationId);
        if (marker.destinationId === id) {
            marker.element.setIcon(markerIcons.active);
            marker.element.openPopup();
            map.setView([dest.coordinates.lat, dest.coordinates.lng], 6);
        } else {
            marker.element.setIcon(markerIcons[dest.status]);
        }
    });
}

// Set up event listeners for filters
document.getElementById('status-filter').addEventListener('change', (e) => {
    statusFilter = e.target.value;
    applyFilters();
});

document.getElementById('year-filter').addEventListener('change', (e) => {
    yearFilter = e.target.value;
    applyFilters();
});

document.getElementById('country-filter').addEventListener('change', (e) => {
    countryFilter = e.target.value;
    applyFilters();
});

document.getElementById('reset-filters').addEventListener('click', () => {
    document.getElementById('status-filter').value = 'all';
    document.getElementById('year-filter').value = 'all';
    document.getElementById('country-filter').value = 'all';
    statusFilter = 'all';
    yearFilter = 'all';
    countryFilter = 'all';
    applyFilters();
    map.setView([20, 0], 2);
});

// Toggle dark mode
document.querySelector('.dark-mode-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.dark-mode-toggle i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
});

// Initialize the application
window.onload = initMap;