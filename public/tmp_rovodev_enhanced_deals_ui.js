
// tmp_rovodev_enhanced_deals_ui.js
// Renders deals on the page and connects UI interactions

function createDealTile(deal) {
  const logoPath = `/assets/logos/${deal.cruise_line.toLowerCase().replace(/\s+/g, '-')}.png`;
  const badgeColor = {
    'Ocean Cruise': 'blue',
    'River Cruise': 'green',
    'Expedition Cruise': 'orange'
  }[deal.cruise_type] || 'gray';

  return \`
    <div class="deal-tile">
      <img class="logo" src="\${logoPath}" alt="\${deal.cruise_line} logo" loading="lazy" />
      <span class="badge" style="background-color:\${badgeColor}">\${deal.cruise_type}</span>
      <h3>\${deal.ship}</h3>
      <p>\${deal.destination}</p>
      <p>\${deal.departure_date}</p>
      <p>\${deal.price || 'Price TBA'}</p>
      <button onclick="viewDealDetails('\${deal.id}')">View Details</button>
    </div>
  \`;
}

function renderDeals(deals) {
  const container = document.getElementById('deals-container');
  container.innerHTML = deals.map(createDealTile).join('');
}

function viewDealDetails(id) {
  window.location.href = \`deal-details.html?id=\${id}\`;
}

async function initializeDealsPage() {
  document.getElementById('search-button').addEventListener('click', async () => {
    const filters = {
      cruiseType: document.getElementById('filter-type').value,
      cruiseLine: document.getElementById('filter-line').value,
      destination: document.getElementById('filter-destination').value,
      ship: document.getElementById('filter-ship').value,
      duration: document.getElementById('filter-duration').value,
      startDate: document.getElementById('filter-start').value,
      endDate: document.getElementById('filter-end').value,
    };
    const deals = await fetchDealsFromSupabase(filters);
    renderDeals(deals);
  });

  const deals = await fetchDealsFromSupabase();
  renderDeals(deals);
}

document.addEventListener('DOMContentLoaded', initializeDealsPage);
