const rowsEl = document.getElementById("priceRows");
const tokenCountEl = document.getElementById("tokenCount");
const opportunityCountEl = document.getElementById("opportunityCount");
const lastUpdatedEl = document.getElementById("lastUpdated");
const refreshBtn = document.getElementById("refreshBtn");
const opportunityOnlyCheckbox = document.getElementById("opportunityOnly");
const howItWorksBtn = document.getElementById("howItWorksBtn");
const howItWorksModal = document.getElementById("howItWorksModal");
const closeHowItWorksBtn = document.getElementById("closeHowItWorksBtn");

let latestData = [];

const DIRECTION_LABELS = {
  BUY_DEX_SELL_CEX: "Buy DEX → sell CEX",
  BUY_CEX_SELL_DEX: "Buy CEX → sell DEX"
};

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
      '<tr><td colspan="8" class="muted">No rows match this filter.</td></tr>';
    return;
  }

  rowsEl.innerHTML = filtered
    .map((item) => {
      const dex = item.dexes?.[0];
      const [statusClass, statusText] = dex?.suspect
        ? ["status-suspect", "Check data"]
        : dex?.isOpportunity
          ? ["status-opportunity", "Opportunity"]
          : ["status-neutral", "Neutral"];
      const staleTag = item.cexStale ? ' <span class="stale-tag">stale</span>' : "";

      return `
        <tr>
          <td>${item.token}</td>
          <td>$${fmt(item.cexPrice, 6)}${staleTag}</td>
          <td>${dex ? `$${fmt(dex.bid, 6)}` : "--"}</td>
          <td>${dex ? `$${fmt(dex.ask, 6)}` : "--"}</td>
          <td>${DIRECTION_LABELS[dex?.direction] ?? "--"}</td>
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
    rowsEl.innerHTML = `<tr><td colspan="8" class="muted">Failed to load /prices: ${error.message}</td></tr>`;
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

const openHowItWorksModal = () => {
  howItWorksModal.classList.remove("hidden");
};

const closeHowItWorksModal = () => {
  howItWorksModal.classList.add("hidden");
};

howItWorksBtn.addEventListener("click", openHowItWorksModal);
closeHowItWorksBtn.addEventListener("click", closeHowItWorksModal);

howItWorksModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
    closeHowItWorksModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !howItWorksModal.classList.contains("hidden")) {
    closeHowItWorksModal();
  }
});

loadPrices();
