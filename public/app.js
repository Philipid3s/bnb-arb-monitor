const rowsEl = document.getElementById("priceRows");
const tokenCountEl = document.getElementById("tokenCount");
const opportunityCountEl = document.getElementById("opportunityCount");
const lastUpdatedEl = document.getElementById("lastUpdated");
const refreshBtn = document.getElementById("refreshBtn");
const opportunityOnlyCheckbox = document.getElementById("opportunityOnly");

let latestData = [];

const fmt = (value, digits = 4) =>
  value == null || Number.isNaN(value) ? "--" : Number(value).toFixed(digits);

const renderRows = () => {
  const showOnlyOpportunities = opportunityOnlyCheckbox.checked;
  const filtered = showOnlyOpportunities
    ? latestData.filter((item) => item.dexes?.[0]?.isOpportunity)
    : latestData;

  tokenCountEl.textContent = latestData.length;
  opportunityCountEl.textContent = latestData.filter(
    (item) => item.dexes?.[0]?.isOpportunity
  ).length;
  lastUpdatedEl.textContent = new Date().toLocaleTimeString();

  if (!filtered.length) {
    rowsEl.innerHTML =
      '<tr><td colspan="6" class="muted">No rows match this filter.</td></tr>';
    return;
  }

  rowsEl.innerHTML = filtered
    .map((item) => {
      const dex = item.dexes?.[0];
      const isOpportunity = Boolean(dex?.isOpportunity);
      const statusClass = isOpportunity ? "status-opportunity" : "status-neutral";
      const statusText = isOpportunity ? "Opportunity" : "Neutral";

      return `
        <tr>
          <td>${item.token}</td>
          <td>$${fmt(item.cexPrice, 6)}</td>
          <td>${dex ? `$${fmt(dex.price, 6)}` : "--"}</td>
          <td>${dex ? `${fmt(dex.spread, 4)}%` : "--"}</td>
          <td>${dex ? `${fmt(dex.netSpread, 4)}%` : "--"}</td>
          <td><span class="status-pill ${statusClass}">${statusText}</span></td>
        </tr>
      `;
    })
    .join("");
};

const loadPrices = async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "Loading...";

  try {
    const response = await fetch("/prices");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    latestData = await response.json();
    renderRows();
  } catch (error) {
    rowsEl.innerHTML = `<tr><td colspan="6" class="muted">Failed to load /prices: ${error.message}</td></tr>`;
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = "Refresh";
  }
};

refreshBtn.addEventListener("click", () => {
  loadPrices();
});

opportunityOnlyCheckbox.addEventListener("change", () => {
  renderRows();
});

loadPrices();
setInterval(loadPrices, 15000);

