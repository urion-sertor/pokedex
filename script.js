// Global configuration and variables
let offset = 0;
const limit = 30;

let offsetHabitat = 0;
const limitHabitat = 20;
let currentHabitatSpecies = [];

let offsetObjects = 0;
const limitObjects = 30;

// Independent loading states to prevent UI locks
let loadingHome = false;
let loadingHabitat = false;
let loadingObjects = false;

// DOM references captured for use throughout the script
const linkHome = document.getElementById('link-home');
const linkHabitat = document.getElementById('link-habitat');
const linkObjects = document.getElementById('link-objects');

const sectionHome = document.getElementById('section-home');
const sectionHabitat = document.getElementById('section-habitat');
const sectionObjects = document.getElementById('section-objects');
const sectionSearch = document.getElementById('section-search');

const pokemonContainer = document.getElementById('pokemon-container');
const habitatButtonsContainer = document.getElementById('habitat-buttons-container');
const habitatPokemonContainer = document.getElementById('habitat-pokemon-container');
const objectsContainer = document.getElementById('objects-container');

const btnLoadMore = document.getElementById('btn-load-more');
const btnLoadMoreHabitat = document.getElementById('btn-load-more-habitat');
const btnLoadMoreObjects = document.getElementById('btn-load-more-objects');

const inputSearch = document.getElementById('input-search');
const btnSearch = document.getElementById('btn-search');
const searchPokemonContainer = document.getElementById('search-pokemon-container');
const btnNightMode = document.getElementById('btn-night-mode');

// Night mode management
// Allows switching between light and dark themes while saving preference.
function toggleNightMode() {
    const isNight = document.body.classList.toggle('night-mode');
    btnNightMode.textContent = isNight ? '☀️' : '🌙';
    localStorage.setItem('pokedex-night-mode', isNight ? 'enabled' : 'disabled');
}

// Load user preference on startup
const nightPreference = localStorage.getItem('pokedex-night-mode');
if (nightPreference !== 'disabled') {
    document.body.classList.add('night-mode');
    btnNightMode.textContent = '☀️';
    if (!nightPreference) localStorage.setItem('pokedex-night-mode', 'enabled');
}

btnNightMode.addEventListener('click', toggleNightMode);

// Translation dictionary
// Translates API terms to improve user experience.
const translations = {
    "cave": "Cave", 
    "forest": "Forest", 
    "grassland": "Grassland", 
    "mountain": "Mountain",
    "rare": "Rare", 
    "rough-terrain": "Rough Terrain", 
    "sea": "Sea", 
    "urban": "Urban",
    "waters-edge": "Waters Edge", 
    "red": "Red", "blue": "Blue", "yellow": "Yellow",
    "gold": "Gold", "silver": "Silver", "crystal": "Crystal", "ruby": "Ruby",
    "sapphire": "Sapphire", "emerald": "Emerald", "firered": "FireRed",
    "leafgreen": "LeafGreen", "diamond": "Diamond", "perl": "Pearl",
    "platinum": "Platinum", "heartgold": "HeartGold", "soulsilver": "SoulSilver",
    "black": "Black", "white": "White", "black-2": "Black 2", "white-2": "White 2",
    "x": "X", "y": "Y", "omega-ruby": "Omega Ruby", "alpha-sapphire": "Alpha Sapphire",
    "sun": "Sun", "moon": "Moon", "ultra-sun": "Ultra Sun", "ultra-moon": "Ultra Moon",
    "sword": "Sword", "shield": "Shield"
};

// Formats names and looks for translations
function formatName(name) {
    if (!name) return "Unknown";
    return translations[name.toLowerCase()] || 
           name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Shows loading message
function showLoading(container) {
    container.innerHTML = '<div class="loading-spinner">Loading...</div>';
}

// Navigation between sections
// Hides inactive sections and shows the selected one.
function changeSection(activeSection, activeLink) {
    [sectionHome, sectionHabitat, sectionObjects, sectionSearch].forEach(s => s.classList.add('hidden'));
    [linkHome, linkHabitat, linkObjects].forEach(l => l.classList.remove('active'));
    activeSection.classList.remove('hidden');
    if (activeLink) activeLink.classList.add('active');
    window.scrollTo(0, 0);
}

linkHome.addEventListener('click', (e) => { e.preventDefault(); changeSection(sectionHome, linkHome); });
linkHabitat.addEventListener('click', (e) => { e.preventDefault(); changeSection(sectionHabitat, linkHabitat); });
linkObjects.addEventListener('click', (e) => { e.preventDefault(); changeSection(sectionObjects, linkObjects); });

// Card creation
function createPokemonCard(pokemon, container) {
    const div = document.createElement('div');
    div.classList.add('card');
    const typesHtml = pokemon.types.map(t => `<span class="type-badge" style="background-color: var(--type-${t.type.name})">${t.type.name}</span>`).join('');
    let games = pokemon.game_indices.map(g => formatName(g.version.name));
    const showGames = games.length > 0 ? games.slice(0, 3).join(', ') + (games.length > 3 ? '...' : '') : 'Unknown';
    div.innerHTML = `
        <span class="pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</span>
        <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default || ''}" alt="${pokemon.name}">
        <h3>${pokemon.name}</h3>
        <div class="types-container">${typesHtml}</div>
        <p><strong>Games:</strong> ${showGames}</p>
        <p><strong>Stats:</strong> ${pokemon.height / 10} m | ${pokemon.weight / 10} kg</p>
        ${pokemon.cries && pokemon.cries.latest ? `<audio controls src="${pokemon.cries.latest}"></audio>` : ''}
    `;
    container.appendChild(div);
}

// Home - Initial load and "load more" button
async function fetchPokemons(isLoadMore = false) {
    if (loadingHome) return;
    loadingHome = true;
    if (!isLoadMore) { offset = 0; showLoading(pokemonContainer); }
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        const data = await res.json();
        if (!isLoadMore) pokemonContainer.innerHTML = '';
        const promises = data.results.map(i => fetch(i.url).then(r => r.json()));
        const pokemons = await Promise.all(promises);
        pokemons.forEach(p => createPokemonCard(p, pokemonContainer));
    } catch (e) { console.error(e); } finally { loadingHome = false; }
}

btnLoadMore.addEventListener('click', () => {
    offset += limit;
    fetchPokemons(true);
});

// Habitats - Filtering by habitat
async function fetchHabitats() {
    try {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon-habitat/');
        const data = await res.json();
        habitatButtonsContainer.innerHTML = '';
        data.results.forEach(h => {
            const btn = document.createElement('button');
            btn.textContent = formatName(h.name);
            btn.addEventListener('click', () => {
                habitatPokemonContainer.innerHTML = '';
                btnLoadMoreHabitat.classList.add('hidden');
                fetchPokemonsByHabitat(h.url);
            });
            habitatButtonsContainer.appendChild(btn);
        });
    } catch (e) { console.error(e); }
}

async function fetchPokemonsByHabitat(habitatUrl) {
    if (loadingHabitat && !habitatUrl) return;
    loadingHabitat = true;
    if (habitatUrl) { showLoading(habitatPokemonContainer); offsetHabitat = 0; }
    try {
        if (habitatUrl) {
            const res = await fetch(habitatUrl);
            const data = await res.json();
            currentHabitatSpecies = data.pokemon_species;
            habitatPokemonContainer.innerHTML = '';
        }
        const species = currentHabitatSpecies.slice(offsetHabitat, offsetHabitat + limitHabitat);
        if (species.length > 0) {
            const promises = species.map(esp => fetch(`https://pokeapi.co/api/v2/pokemon/${esp.name}`).then(r => r.ok ? r.json() : null).catch(() => null));
            const pokemons = await Promise.all(promises);
            pokemons.filter(p => p !== null).forEach(p => createPokemonCard(p, habitatPokemonContainer));
            offsetHabitat += limitHabitat;
        }
        if (offsetHabitat < currentHabitatSpecies.length) btnLoadMoreHabitat.classList.remove('hidden');
        else btnLoadMoreHabitat.classList.add('hidden');
    } catch (e) { console.error(e); } finally { loadingHabitat = false; }
}

btnLoadMoreHabitat.addEventListener('click', () => fetchPokemonsByHabitat());

// Items - Shows all items
async function fetchItems(isLoadMore = false) {
    if (loadingObjects) return;
    loadingObjects = true;
    if (!isLoadMore) { offsetObjects = 0; showLoading(objectsContainer); }
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/item?limit=${limitObjects}&offset=${offsetObjects}`);
        const data = await res.json();
        if (!isLoadMore) objectsContainer.innerHTML = '';
        const promises = data.results.map(i => fetch(i.url).then(r => r.json()));
        const items = await Promise.all(promises);
        items.forEach(obj => {
            const entry = obj.flavor_text_entries.find(e => e.language.name === 'en') || obj.flavor_text_entries.find(e => e.language.name === 'es');
            const desc = entry ? entry.text.replace(/\f/g, ' ') : 'No description available';
            
            const attributes = obj.attributes.map(a => a.name);
            const isConsumable = attributes.includes('consumable');
            const usableInBattle = attributes.includes('usable-in-battle');

            const div = document.createElement('div');
            div.classList.add('card', 'item-card');
            div.innerHTML = `
                <img src="${obj.sprites.default || ''}" alt="${obj.name}" style="width:80px; height:80px; margin-bottom:1rem">
                <h3>${obj.name.replace(/-/g, ' ')}</h3>
                <p style="font-size:0.9rem; font-style:italic; color:#777; margin-bottom:1rem">"${desc}"</p>
                <div style="margin-top:auto; padding-top:1rem; width:100%; border-top:1px solid rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:0.3rem; font-size:0.85rem">
                    <p><strong>Consumable:</strong> ${isConsumable ? '✅' : '❌'}</p>
                    <p><strong>Battle Use:</strong> ${usableInBattle ? '✅' : '❌'}</p>
                </div>
            `;
            objectsContainer.appendChild(div);
        });
        offsetObjects += limitObjects;
    } catch (e) { console.error(e); } finally { loadingObjects = false; }
}

btnLoadMoreObjects.addEventListener('click', () => {
    fetchItems(true);
});

// Search functionality
async function searchPokemon() {
    let q = inputSearch.value.trim().toLowerCase();
    if (!q) return;
    if (q.startsWith('#')) q = q.substring(1);
    if (!isNaN(q)) q = parseInt(q, 10).toString();
    changeSection(sectionSearch, null);
    showLoading(searchPokemonContainer);
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`);
        if (!res.ok) throw new Error();
        const p = await res.json();
        searchPokemonContainer.innerHTML = '';
        createPokemonCard(p, searchPokemonContainer);
    } catch { searchPokemonContainer.innerHTML = '<p>Not found.</p>'; }
}
btnSearch.addEventListener('click', searchPokemon);
inputSearch.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchPokemon(); });

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchPokemons();
    fetchHabitats();
    fetchItems();
});
