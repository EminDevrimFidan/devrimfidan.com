/**
 * My Trips and Plans - script.js
 * Handles the dynamic rendering of destinations, map interactions, filtering, and dark mode.
 * Destinations are now sorted by default:
 * 1. Status (Planned, then Wishlist, then Visited)
 * 2. Year (Descending, newest first) within each status group
 * 3. Name (Alphabetically) as a final tie-breaker.
 * Thumbnail images in the sidebar are 8rem wide and 6rem tall.
 * Popup visibility on marker click is improved by adjusting the map's center view.
 * Popup image is hidden on mobile for better fit.
 */

// Global variables
let map; // Leaflet map instance
let markers = []; // Array to store map markers
let destinations = []; // Array to store all destination data, populated from data.json
let activeDestination = null; // Currently selected destination object

// Filter state variables
let statusFilter = "all"; // Default filter status
let yearFilter = "all";   // Default filter year
let countryFilter = "all"; // Default filter country

// Tailwind custom colors, matching the 'colors' object in tailwind.config in HTML
const statusColors = {
    visited: 'status-visited',
    planned: 'status-planned',
    wishlist: 'status-wishlist',
    active: 'status-active',
};

// Custom marker icons using Tailwind classes
const markerIcons = {
    visited: L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-3 h-3 rounded-full border-2 border-white shadow-md bg-${statusColors.visited}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    }),
    planned: L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-3 h-3 rounded-full border-2 border-white shadow-md bg-${statusColors.planned}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    }),
    wishlist: L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-3 h-3 rounded-full border-2 border-white shadow-md bg-${statusColors.wishlist}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    }),
    active: L.divIcon({
        className: 'custom-marker',
        html: `<div class="w-[18px] h-[18px] rounded-full border-[3px] border-white shadow-lg bg-${statusColors.active}"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    })
};

/**
 * Custom sort function to order destinations:
 * 1. By status: Planned, then Wishlist, then Visited.
 * 2. By year: Descending (newest first) within each status group.
 * 3. By name: Alphabetically, as a final tie-breaker.
 * @param {Array<Object>} destinationsArray The array of destination objects to sort.
 */
function sortDestinationsByDefault(destinationsArray) {
    const statusOrder = {
        'planned': 1,
        'wishlist': 2,
        'visited': 3
    };

    destinationsArray.sort((a, b) => {
        const orderA = statusOrder[a.status] || 4; 
        const orderB = statusOrder[b.status] || 4;
        if (orderA !== orderB) return orderA - orderB;

        const yearA = a.year == null ? -Infinity : a.year; 
        const yearB = b.year == null ? -Infinity : b.year;
        if (yearA !== yearB) return yearB - yearA; 

        if (a.name && b.name) return a.name.localeCompare(b.name);
        return 0; 
    });
}

function initializeApp() {
    const loadingElement = document.getElementById('loading-destinations');
    const listElement = document.getElementById('destination-list');

    if (typeof destinationsData === 'undefined' || !Array.isArray(destinationsData)) {
        console.error("ERROR: destinationsData is not defined or not an array. Make sure data.json is loaded correctly.");
        if (loadingElement) {
            loadingElement.innerHTML = `<div class="text-center p-6"><i class="fas fa-exclamation-triangle text-3xl mb-4 text-red-500"></i><p>Error: Could not load trip data.</p></div>`;
        } else if (listElement) {
            listElement.innerHTML = `<li class="p-4 text-center text-red-500 dark:text-red-400">Error: Could not load trip data.</li>`;
        }
        return;
    }
    destinations = [...destinationsData]; 
    sortDestinationsByDefault(destinations);
    if (loadingElement) loadingElement.style.display = 'none';

    map = L.map('map', { 
        preferCanvas: true,
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" class="text-blue-600 hover:underline">OpenStreetMap</a> contributors',
        maxZoom: 18, minZoom: 2
    }).addTo(map);
    
    populateYearFilter();
    populateCountryFilter();
    
    document.getElementById('status-filter').value = statusFilter;
    document.getElementById('year-filter').value = yearFilter;
    document.getElementById('country-filter').value = countryFilter;
    applyFilters(); 
    
    document.getElementById('zoom-in').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoom-out').addEventListener('click', () => map.zoomOut());
    document.getElementById('center-map').addEventListener('click', () => map.setView([20, 0], 2));
}

function createMarkers(destinationsToMark) {
    markers.forEach(marker => {
        if (map.hasLayer(marker.element)) map.removeLayer(marker.element);
    });
    markers = [];
    
    destinationsToMark.forEach(destination => {
        const icon = (activeDestination && activeDestination.id === destination.id) 
            ? markerIcons.active 
            : markerIcons[destination.status] || markerIcons.wishlist;
        
        const lat = parseFloat(destination.coordinates.lat);
        const lng = parseFloat(destination.coordinates.lng);

        if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Skipping marker for ${destination.name} (ID: ${destination.id}) due to invalid coordinates:`, destination.coordinates);
            return; 
        }
        const marker = L.marker([lat, lng], { icon: icon }).addTo(map);
        const statusColorClass = statusColors[destination.status] || statusColors.wishlist;
        const bgColorClass = `bg-${statusColorClass}`;

        // MODIFIED: Added 'hidden md:block' to the <img> tag for responsive visibility
        // Also adjusted the onerror placeholder slightly.
        const popupContent = `
            <div class="popup-content bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg overflow-hidden">
                <img src="${destination.image}" alt="${destination.name || 'Destination Image'}" class="w-full h-44 object-cover hidden md:block" onerror="this.style.display='none'; console.warn('Image failed to load for ${destination.name}: ${destination.image}'); const placeholder = this.nextSibling; if(placeholder && placeholder.classList.contains('popup-image-placeholder')) { placeholder.classList.remove('hidden'); }">
                <div class="popup-image-placeholder hidden w-full h-auto py-2 text-center text-xs text-gray-400 dark:text-gray-500 md:hidden">Image hidden on mobile</div>
                <div class="p-3">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-lg font-semibold truncate" title="${destination.name || 'N/A'}, ${destination.country || 'N/A'}">${destination.name || 'N/A'}, ${destination.country || 'N/A'}</h3>
                        ${destination.year ? `<span class="text-xs font-medium ${bgColorClass} text-white px-2 py-0.5 rounded-full ml-2 flex-shrink-0">${destination.year}</span>` : ''}
                    </div>
                    <div class="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span class="capitalize inline-block ${bgColorClass} text-white px-2 py-0.5 rounded-full text-xs mr-2">${destination.status}</span>
                        <i class="fas ${destination.transport === 'flight' ? 'fa-plane' : (destination.transport === 'train' ? 'fa-train' : 'fa-car')} mr-1 text-gray-500 dark:text-gray-400"></i> ${destination.duration}
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400 italic mb-2 line-clamp-2" title="${destination.notes || ''}">${destination.notes || ''}</p>
                    <p class="text-sm leading-relaxed mb-2 max-h-20 overflow-y-auto">${destination.detailedNotes || ''}</p>
                    ${destination.link ? `<div class="text-right mt-2">
                        <a href="${destination.link}" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-500 dark:text-blue-400 hover:underline hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center">
                            Official Website <i class="fas fa-external-link-alt ml-1 text-xs"></i>
                        </a>
                    </div>` : ''}
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent, {
            className: 'custom-popup',
            closeButton: true,
            minWidth: 280, // Adjusted minWidth for mobile when image is hidden
            maxWidth: 350,
            autoPan: false 
        });
        
        marker.on('click', () => selectDestination(destination.id));
        markers.push({ element: marker, destinationId: destination.id, status: destination.status });
    });
}

function renderDestinations(destinationsToRender) {
    const listElement = document.getElementById('destination-list');
    listElement.innerHTML = ''; 
    const loadingElement = document.getElementById('loading-destinations');
    if (loadingElement && loadingElement.style.display !== 'none') loadingElement.style.display = 'none';

    if (destinationsToRender.length === 0) {
        listElement.innerHTML = `<li class="p-4 text-center text-gray-500 dark:text-gray-400">No destinations match your filter criteria.</li>`;
        return;
    }
    destinationsToRender.forEach(destination => {
        const item = document.createElement('li');
        const isActive = activeDestination && activeDestination.id === destination.id;
        const statusColorName = statusColors[destination.status] || statusColors.wishlist; 
        item.className = `destination-item p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 ${isActive ? `bg-blue-50 dark:bg-blue-900/50 border-l-4 border-l-${statusColors.active}` : `border-l-4 border-l-${statusColorName}`}`;
        item.dataset.id = destination.id;
        const destinationNameText = destination.name || 'Unnamed Destination';
        item.innerHTML = `
            <div class="flex items-start space-x-3">
                <img src="${destination.image}" alt="${destination.name || 'Destination'}" class="w-32 h-24 object-cover rounded-md flex-shrink-0" onerror="this.style.display='none'; console.warn('Image failed to load for list item ${destination.name}: ${destination.image}'); const placeholder = document.createElement('div'); placeholder.className='w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400 text-xs'; placeholder.innerText='No Img'; this.parentNode.insertBefore(placeholder, this);">
                <div class="flex-grow min-w-0">
                    <div class="flex justify-between items-start mb-1">
                        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100 truncate" title="${destinationNameText}">${destinationNameText}</h3>
                        <span class="text-xs font-medium bg-${statusColorName} text-white px-2 py-0.5 rounded-full capitalize flex-shrink-0">${destination.status}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span class="truncate" title="${destination.country || 'N/A'}">${destination.country || 'N/A'}</span>
                        ${destination.year ? `<span class="ml-2 flex-shrink-0 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-medium">${destination.year}</span>` : ''}
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-300 mt-1"> <i class="fas ${destination.transport === 'flight' ? 'fa-plane' : (destination.transport === 'train' ? 'fa-train' : 'fa-car')} mr-1 text-gray-500 dark:text-gray-400"></i> ${destination.duration || 'N/A'} </p>
                    <p class="hidden text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2" title="${destination.notes || ''}">${destination.notes || ''}</p>
                </div>
            </div>`;
        item.addEventListener('click', () => selectDestination(destination.id));
        listElement.appendChild(item);
    });
}

function populateYearFilter() {
    const yearFilterEl = document.getElementById('year-filter');
    while (yearFilterEl.options.length > 1) yearFilterEl.remove(1);
    const years = [...new Set(destinations.map(d => d.year).filter(year => year != null))].sort((a, b) => b - a);
    years.forEach(year => { const option = document.createElement('option'); option.value = year; option.textContent = year; yearFilterEl.appendChild(option); });
}

function populateCountryFilter() {
    const countryFilterEl = document.getElementById('country-filter');
    while (countryFilterEl.options.length > 1) countryFilterEl.remove(1);
    const countries = [...new Set(destinations.map(d => d.country).filter(country => country && country.trim() !== ''))].sort();
    countries.forEach(country => { const option = document.createElement('option'); option.value = country; option.textContent = country; countryFilterEl.appendChild(option); });
}

function applyFilters() {
    let filteredDestinations = [...destinations]; 
    if (statusFilter !== 'all') filteredDestinations = filteredDestinations.filter(d => d.status === statusFilter);
    if (yearFilter !== 'all') filteredDestinations = filteredDestinations.filter(d => d.year && d.year.toString() === yearFilter);
    if (countryFilter !== 'all') filteredDestinations = filteredDestinations.filter(d => d.country === countryFilter);
    if (statusFilter !== 'all' || yearFilter !== 'all' || countryFilter !== 'all') {
        if (statusFilter !== 'all') {
            filteredDestinations.sort((a, b) => {
                const yearA = a.year == null ? -Infinity : a.year;
                const yearB = b.year == null ? -Infinity : b.year;
                if (yearA !== yearB) return yearB - yearA;
                if (a.name && b.name) return a.name.localeCompare(b.name);
                return 0;
            });
        } else { sortDestinationsByDefault(filteredDestinations); }
    }
    renderDestinations(filteredDestinations);
    createMarkers(filteredDestinations); 
    if (activeDestination && !filteredDestinations.some(d => d.id === activeDestination.id)) {
        const activeItemInDOM = document.querySelector(`.destination-item[data-id="${activeDestination.id}"]`);
        if (activeItemInDOM) {
            const destData = destinations.find(d => d.id === activeDestination.id);
            if(destData) {
                 activeItemInDOM.classList.remove(`bg-blue-50`, `dark:bg-blue-900/50`, `border-l-${statusColors.active}`);
                 activeItemInDOM.classList.add(`border-l-${statusColors[destData.status] || statusColors.wishlist}`);
            }
        }
    } else if (activeDestination) {
        const itemToActivate = document.querySelector(`.destination-item[data-id="${activeDestination.id}"]`);
        if(itemToActivate && !itemToActivate.classList.contains(`bg-blue-50`)) { 
            itemToActivate.classList.add(`bg-blue-50`, `dark:bg-blue-900/50`, `border-l-4`, `border-l-${statusColors.active}`);
            const destData = destinations.find(d => d.id === activeDestination.id);
            if (destData) itemToActivate.classList.remove(`border-l-${statusColors[destData.status] || statusColors.wishlist}`);
        }
    }
}

function selectDestination(id) {
    const newActiveDestination = destinations.find(d => d.id === id);
    if (!newActiveDestination) return;
    activeDestination = newActiveDestination;

    document.querySelectorAll('.destination-item').forEach(item => {
        const itemId = item.dataset.id;
        const itemDest = destinations.find(d => d.id === itemId);
        if (!itemDest) return;
        item.classList.remove(`bg-blue-50`, `dark:bg-blue-900/50`, `border-l-${statusColors.active}`);
        item.classList.add(`border-l-4`, `border-l-${statusColors[itemDest.status] || statusColors.wishlist}`);
        if (itemId === id) {
            item.classList.add(`bg-blue-50`, `dark:bg-blue-900/50`);
            item.classList.remove(`border-l-${statusColors[itemDest.status] || statusColors.wishlist}`);
            item.classList.add(`border-l-4`, `border-l-${statusColors.active}`);
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    markers.forEach(markerRef => {
        const dest = destinations.find(d => d.id === markerRef.destinationId);
        if (!dest) return;

        if (markerRef.destinationId === id) {
            markerRef.element.setIcon(markerIcons.active);
            
            const targetLatLng = L.latLng(dest.coordinates.lat, dest.coordinates.lng);
            const currentZoom = Math.max(map.getZoom(), 7);

            const markerPoint = map.project(targetLatLng, currentZoom); 
            const pixelOffset = 100; 
            const newCenterPoint = L.point(markerPoint.x, markerPoint.y - pixelOffset); 
            const newCenterLatLng = map.unproject(newCenterPoint, currentZoom);

            map.setView(newCenterLatLng, currentZoom, { animate: true });
            
            if (markerRef.element.getPopup()) {
                markerRef.element.openPopup();
            }
        } else {
            markerRef.element.setIcon(markerIcons[dest.status] || markerIcons.wishlist);
        }
    });
}

// Event Listeners
document.getElementById('status-filter').addEventListener('change', (e) => { statusFilter = e.target.value; applyFilters(); });
document.getElementById('year-filter').addEventListener('change', (e) => { yearFilter = e.target.value; applyFilters(); });
document.getElementById('country-filter').addEventListener('change', (e) => { countryFilter = e.target.value; applyFilters(); });

const resetFiltersButton = document.getElementById('reset-filters');
if (resetFiltersButton) {
    resetFiltersButton.addEventListener('click', () => {
        document.getElementById('status-filter').value = 'all';
        document.getElementById('year-filter').value = 'all';
        document.getElementById('country-filter').value = 'all';
        statusFilter = 'all'; yearFilter = 'all'; countryFilter = 'all';
        activeDestination = null;
        sortDestinationsByDefault(destinations); 
        applyFilters(); 
        document.querySelectorAll('.destination-item').forEach(item => {
             const itemDest = destinations.find(d => d.id === item.dataset.id);
             if(itemDest) {
                item.classList.remove(`bg-blue-50`, `dark:bg-blue-900/50`, `border-l-${statusColors.active}`);
                item.classList.add(`border-l-4`, `border-l-${statusColors[itemDest.status] || statusColors.wishlist}`);
             }
        });
        map.setView([20, 0], 2);
    });
}

const darkModeToggle = document.getElementById('dark-mode-toggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => document.documentElement.classList.toggle('dark'));
}

// Initialize
document.addEventListener('DOMContentLoaded', initializeApp);
