let dynamicData = {};
let favoriteStations = JSON.parse(localStorage.getItem("mrt_favorites") || "[]");
let currentStationImageSlides = [];
let currentStationImageIndex = 0;

const zh = {
    routeRide: "\u6211\u8981\u642d\u8eca",
    transferLookup: "\u8f49\u4e58\u7ad9\u67e5\u8a62",
    station: "\u8eca\u7ad9",
    targetStation: "\u76ee\u7684\u7ad9",
    selectStation: "\u8acb\u9078\u64c7\u8eca\u7ad9",
    selectLineFirst: "\u8acb\u5148\u9078\u64c7\u8def\u7dda",
    selectTargetLineFirst: "\u8acb\u5148\u9078\u64c7\u76ee\u7684\u8def\u7dda",
    recommendedRoute: "\u5efa\u8b70\u8def\u7dda",
    alternateRoute: "\u66ff\u4ee3\u8def\u7dda",
    minutes: "\u5206\u9418",
    stops: "\u7ad9",
    transfer: "\u8f49\u4e58",
    noTransfer: "\u514d\u8f49\u4e58",
    sameLine: "\u540c\u7dda\u76f4\u9054",
    lineSegment: "\u8def\u7dda\u6bb5",
    transferDetail: "\u8f49\u4e58\u7d30\u7bc0",
    totalTime: "\u9810\u4f30\u7e3d\u6642\u9593",
    rideTime: "\u8eca\u7a0b",
    transferWalk: "\u8f49\u4e58\u6b65\u884c",
    car: "\u8eca\u5ec2",
    elevator: "\u96fb\u68af",
    escalator: "\u96fb\u6276\u68af",
    stairs: "\u6a13\u68af",
    exit: "\u51fa\u53e3",
    favoriteAdd: "\u52a0\u5165\u6536\u85cf",
    favoriteDone: "\u5df2\u52a0\u5165\u6536\u85cf",
    noData: "\u5c1a\u7121\u5c0d\u61c9\u8cc7\u6599",
    stationLayout: "\u8eca\u7ad9\u5e73\u9762\u5716",
    accessible: "\u7121\u969c\u7919",
    chooseComplete: "\u8acb\u5b8c\u6574\u9078\u64c7\u8d77\u9ede\u8def\u7dda\u3001\u8d77\u9ede\u7ad9\u3001\u76ee\u7684\u8def\u7dda\u8207\u76ee\u7684\u7ad9",
    noRoute: "\u627e\u4e0d\u5230\u53ef\u62b5\u9054\u76ee\u7684\u7ad9\u7684\u8def\u7dda"
};

const lineNameToId = {
    "\u677f\u5357\u7dda": "BL",
    "\u6de1\u6c34\u4fe1\u7fa9\u7dda": "R",
    "\u677e\u5c71\u65b0\u5e97\u7dda": "G",
    "\u4e2d\u548c\u65b0\u8606\u7dda": "O",
    "\u6587\u6e56\u7dda": "BR",
    "\u74b0\u72c0\u7dda": "Y"
};

const idToLineName = {
    BL: "\u677f\u5357\u7dda",
    R: "\u6de1\u6c34\u4fe1\u7fa9\u7dda",
    G: "\u677e\u5c71\u65b0\u5e97\u7dda",
    O: "\u4e2d\u548c\u65b0\u8606\u7dda",
    BR: "\u6587\u6e56\u7dda",
    Y: "\u74b0\u72c0\u7dda"
};

const lineColors = {
    BL: "var(--line-bl)",
    R: "var(--line-r)",
    G: "var(--line-g)",
    O: "var(--line-o)",
    BR: "var(--line-br)",
    Y: "var(--line-y)"
};

const selectableLineIds = new Set(["BL", "R", "G", "O"]);

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("data/dynamicStatus.json");
        if (response.ok) dynamicData = await response.json();
    } catch (error) {
        console.warn("Dynamic data is unavailable.", error);
    }

    normalizeStaticLabels();
    setupNavigation();
    setupThemeToggle();
    setupStationView();
    setupRideView();
    setupExitView();
    setupFavoritesView();
    setupGlobalSearch();
    setupModal();
    switchView("view-home", "nav-home");
});

function normalizeStaticLabels() {
    ensureHomeView();
    const navHome = document.getElementById("nav-home");
    if (navHome) navHome.innerHTML = '<i class="fa-solid fa-house"></i> \u9996\u9801';

    const navTransfer = document.getElementById("nav-transfer");
    if (navTransfer) navTransfer.innerHTML = '<i class="fa-solid fa-train-subway"></i> ' + zh.routeRide;

    const transferTitle = document.querySelector("#view-transfer .view-header h2");
    if (transferTitle) transferTitle.innerHTML = '<i class="fa-solid fa-train-subway"></i> ' + zh.routeRide;

    const targetStation = document.getElementById("transfer-target-station");
    const targetLabel = targetStation?.closest(".input-group")?.querySelector("label");
    if (targetLabel) targetLabel.textContent = zh.targetStation;
    if (targetStation) targetStation.innerHTML = `<option value="">${zh.selectTargetLineFirst}</option>`;

    const calcBtn = document.getElementById("calc-transfer-btn");
    if (calcBtn) calcBtn.innerHTML = '<i class="fa-solid fa-route"></i> \u898f\u5283\u642d\u8eca\u8def\u7dda';

    ensureTransferLookupPanel();
    ensureStationSearchButton();
}

function ensureHomeView() {
    if (document.getElementById("view-home")) return;
    const main = document.querySelector(".main-content");
    const topbar = document.querySelector(".topbar");
    const home = document.createElement("div");
    home.id = "view-home";
    home.className = "view-section home-view";
    home.style.display = "none";
    home.innerHTML = `
        <section class="home-hero">
            <div class="home-hero-copy">
                <h2>\u53f0\u5317\u6377\u904b\uff0c\u4fbf\u6377\u6bcf\u4e00\u7a0b</h2>
                <p>\u67e5\u8a62\u8eca\u7ad9\u8a2d\u65bd\u3001\u8f49\u4e58\u8def\u7dda\u3001\u51fa\u5165\u53e3\u8cc7\u8a0a\uff0c\u8b93\u60a8\u7684\u6377\u904b\u65c5\u7a0b\u66f4\u8f15\u9b06\u4fbf\u5229\uff01</p>
                <a class="btn-primary home-official-btn" href="https://www.metro.taipei/cp.aspx?n=73B51F32ED23C5E1" target="_blank" rel="noopener">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> \u524d\u5f80\u53f0\u5317\u6377\u904b\u5b98\u65b9\u7db2\u7ad9
                </a>
            </div>
            <div class="home-hero-art">
                <img src="picture/\u6377\u904b\u5716.jpg" alt="\u6377\u904b\u5716">
            </div>
        </section>
        <section class="home-section">
            <h3><i class="fa-solid fa-wand-magic-sparkles"></i> \u5feb\u901f\u67e5\u8a62</h3>
            <div class="home-action-grid">
                <button class="home-action" data-target="nav-station"><i class="fa-solid fa-magnifying-glass"></i><strong>\u8eca\u7ad9\u67e5\u8a62</strong><span>\u67e5\u8a62\u8a2d\u65bd\u8207\u51fa\u5165\u53e3</span></button>
                <button class="home-action" data-target="nav-transfer"><i class="fa-solid fa-train-subway"></i><strong>${zh.routeRide}</strong><span>\u898f\u5283\u7ad9\u5230\u7ad9\u8def\u7dda</span></button>
                <button class="home-action" data-target="nav-exit"><i class="fa-solid fa-door-open"></i><strong>\u6211\u8981\u51fa\u7ad9</strong><span>\u67e5\u8a62\u5efa\u8b70\u8eca\u5ec2</span></button>
                <button class="home-action" data-target="nav-route-map"><i class="fa-solid fa-map"></i><strong>\u8def\u7dda\u5716</strong><span>\u67e5\u770b\u6377\u904b\u8def\u7dda</span></button>
            </div>
        </section>
        <section class="home-section">
            <h3><i class="fa-solid fa-fire"></i> \u71b1\u9580\u641c\u5c0b</h3>
            <div class="popular-stations">
                ${[
                    ["\u53f0\u5317\u8eca\u7ad9", "BL12 / R10"],
                    ["\u5e02\u653f\u5e9c", "BL18"],
                    ["\u897f\u9580", "BL11 / G12"],
                    ["\u5fe0\u5b5d\u5fa9\u8208", "BL15 / BR10"],
                    ["\u5927\u5b89", "R05"],
                    ["\u6de1\u6c34", "R28"]
                ].map(([name, code]) => `<button class="popular-station" data-station="${name}"><i class="fa-solid fa-location-dot"></i><strong>${name}</strong><span>${code}</span></button>`).join("")}
            </div>
        </section>
    `;
    main.insertBefore(home, topbar.nextSibling);
    home.querySelectorAll(".home-action").forEach(button => {
        button.addEventListener("click", () => document.getElementById(button.dataset.target)?.click());
    });
    home.querySelectorAll(".popular-station").forEach(button => {
        button.addEventListener("click", () => {
            const station = button.dataset.station;
            const node = getStationNode(station);
            const lineName = node?.lines?.[0];
            if (!lineName) return;
            renderStationDashboard(lineName, station);
            switchView("view-dashboard", "nav-station");
        });
    });
}

function ensureStationSearchButton() {
    if (document.getElementById("station-search-submit")) return;
    const stationCard = document.querySelector("#view-station .search-step-card");
    if (!stationCard) return;
    const action = document.createElement("div");
    action.className = "action-row center-align station-search-action";
    action.innerHTML = `<button class="btn-primary large-btn" id="station-search-submit"><i class="fa-solid fa-magnifying-glass"></i> \u641c\u5c0b</button>`;
    stationCard.appendChild(action);
}

function ensureTransferLookupPanel() {
    if (document.getElementById("transfer-station-lookup")) return;
    const transferCard = document.querySelector("#view-transfer .transfer-step-card");
    if (!transferCard) return;

    const panel = document.createElement("div");
    panel.className = "step-group transfer-lookup-panel";
    panel.id = "transfer-station-lookup";
    panel.innerHTML = `
        <h3><i class="fa-solid fa-right-left"></i> ${zh.transferLookup}</h3>
        <div class="input-row">
            <div class="input-group">
                <label>${zh.station}</label>
                <div class="select-wrapper">
                    <select id="transfer-station-select" class="custom-select"></select>
                </div>
            </div>
            <div class="input-group">
                <label>\u5f9e\u54ea\u4e00\u7dda</label>
                <div class="select-wrapper">
                    <select id="transfer-from-line-select" class="custom-select" disabled></select>
                </div>
            </div>
            <div class="input-group">
                <label>\u8f49\u5230\u54ea\u4e00\u7dda</label>
                <div class="select-wrapper">
                    <select id="transfer-to-line-select" class="custom-select" disabled></select>
                </div>
            </div>
        </div>
        <div id="transfer-station-result" class="transfer-station-result"></div>
    `;
    transferCard.appendChild(panel);
}

function setupNavigation() {
    const navMap = {
        "nav-home": "view-home",
        "nav-station": "view-station",
        "nav-transfer": "view-transfer",
        "nav-exit": "view-exit",
        "nav-route-map": "view-route-map",
        "nav-favorite": "view-favorite"
    };

    Object.entries(navMap).forEach(([navId, viewId]) => {
        document.getElementById(navId)?.addEventListener("click", event => {
            event.preventDefault();
            switchView(viewId, navId);
        });
    });

    document.getElementById("brand-home-link")?.addEventListener("click", event => {
        event.preventDefault();
        switchView("view-home", "nav-home");
    });
}

function switchView(viewId, navId) {
    document.querySelectorAll(".view-section").forEach(section => {
        section.style.display = "none";
    });
    document.getElementById(viewId).style.display = "block";

    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    if (navId) document.getElementById(navId)?.classList.add("active");
    if (viewId === "view-favorite") renderFavorites();
}

function setupThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    btn?.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        btn.innerHTML = document.body.classList.contains("dark-mode")
            ? '<i class="fa-solid fa-sun"></i> \u6dfa\u8272\u6a21\u5f0f'
            : '<i class="fa-solid fa-moon"></i> \u6df1\u8272\u6a21\u5f0f';
    });
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}

function hasUsefulValue(value) {
    const text = String(value ?? "").trim();
    return Boolean(text) && !["??", "--", "\u7121", "\u65e0", "N/A", "n/a"].includes(text);
}

function firstUsefulValue(...values) {
    return values.find(hasUsefulValue);
}

function getLineIdFromLineName(lineName) {
    return lineNameToId[lineName] || "";
}

function updateLineSelectColor(selectElement) {
    if (!selectElement) return;
    selectElement.classList.remove("line-bl", "line-r", "line-g", "line-o", "line-br", "line-y", "no-line");
    const lineId = String(selectElement.value || "").toLowerCase();
    if (lineId) selectElement.classList.add(`line-${lineId}`);
    else selectElement.classList.add("no-line");
}

function isSelectableLine(lineId) {
    return selectableLineIds.has(lineId);
}

function getStationNode(stationName) {
    return Object.values(metroGraph || {}).find(node => node.station_name === stationName) || null;
}

function getStationNodeKey(stationName, lineId = "") {
    const lineName = idToLineName[lineId];
    return Object.keys(metroGraph || {}).find(key => {
        const node = metroGraph[key];
        return node.station_name === stationName && (!lineName || (node.lines || []).includes(lineName));
    });
}

function getStationCodes(stationName) {
    const codes = new Map();
    Object.entries(metroGraph || {}).forEach(([key, node]) => {
        if (node.station_name !== stationName) return;
        key.split("_").forEach(part => {
            const match = part.match(/^([A-Z]+)(\d+[A-Z]?)$/);
            if (!match) return;
            const lineId = match[1];
            if (idToLineName[lineId]) codes.set(lineId, `${lineId}${match[2]}`);
        });
    });
    getStationDataByName(stationName).forEach(station => {
        const match = String(station.id || "").match(/^([A-Z]+)(\d+[A-Z]?)$/);
        if (match && idToLineName[match[1]]) codes.set(match[1], station.id);
    });
    return [...codes.entries()].map(([lineId, code]) => ({
        lineId,
        code,
        lineName: idToLineName[lineId],
        color: lineColors[lineId] || "var(--primary-color)"
    }));
}

function getStationCode(stationName, lineId) {
    return getStationCodes(stationName).find(item => item.lineId === lineId)?.code || lineId;
}

function getStationCodeOrder(code, fallback = 9999) {
    const match = String(code || "").match(/^[A-Z]+(\d+)([A-Z]?)$/);
    if (!match) return fallback;
    const suffixOffset = match[2] ? (match[2].charCodeAt(0) - 64) / 10 : 0;
    return Number(match[1]) + suffixOffset;
}

function getMrtDataRecord(lineId, stationName) {
    return Object.values(mrtData || {}).find(station =>
        station.id?.includes(lineId) && station.name === stationName
    ) || null;
}

function getStationDataByName(stationName) {
    return Object.values(mrtData || {}).filter(station => station.name === stationName);
}

function populateStationSelect(selectElement, lineName) {
    const lineId = getLineIdFromLineName(lineName);
    selectElement.innerHTML = `<option value="">${zh.selectStation}</option>`;
    const stations = [...new Map(Object.values(metroGraph || {})
        .filter(node => node.lines?.includes(lineName))
        .map(node => [node.station_name, node])).values()]
        .map(node => {
            const code = getStationCode(node.station_name, lineId);
            return {
                node,
                code,
                hasData: Boolean(getMrtDataRecord(lineId, node.station_name)),
                order: getStationCodeOrder(code)
            };
        })
        .sort((a, b) => a.order - b.order || (a.node.station_name || "").localeCompare(b.node.station_name || "", "zh-Hant"));

    stations.forEach(({ node, code, hasData }) => {
        const option = document.createElement("option");
        option.value = node.station_name;
        option.textContent = `${code} ${node.station_name}`;
        option.disabled = !hasData;
        if (!hasData) option.className = "station-option-disabled";
        selectElement.appendChild(option);
    });
}

function extractExitIds(exitText) {
    const matches = String(exitText || "").match(/[A-Z]?\d+[A-Z]?/g) || [];
    return [...new Set(matches.map(id => id.toUpperCase()))];
}

function getFacilityIconsFromCar(car) {
    const icons = [];
    if (hasUsefulValue(car.elevator)) icons.push({ icon: "fa-elevator", label: zh.elevator, type: "elevator" });
    if (hasUsefulValue(car.escalator_both) || hasUsefulValue(car.escalator_up)) {
        icons.push({ icon: "fa-arrow-trend-up", label: zh.escalator, type: "escalator" });
    }
    if (hasUsefulValue(car.stairs)) icons.push({ icon: "fa-stairs", label: zh.stairs, type: "stairs" });
    if (hasUsefulValue(car.facilities)) icons.push({ icon: "fa-circle-info", label: car.facilities, type: "info" });
    return icons;
}

function getStationExitSummaries(stationData) {
    const exits = new Map();
    if (!stationData?.cars) return [];

    stationData.cars.forEach(car => {
        extractExitIds(car.exits).forEach(exitId => {
            if (!exits.has(exitId)) {
                exits.set(exitId, {
                    id: exitId,
                    label: `${zh.exit} ${exitId}`,
                    cars: new Set(),
                    directions: new Set(),
                    facilities: new Map()
                });
            }
            const exit = exits.get(exitId);
            if (hasUsefulValue(car.carNumber)) exit.cars.add(car.carNumber);
            if (hasUsefulValue(car.direction)) exit.directions.add(car.direction);
            getFacilityIconsFromCar(car).forEach(facility => {
                exit.facilities.set(`${facility.icon}-${facility.label}`, facility);
            });
        });
    });

    return [...exits.values()].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

function getExitNameInfo(stationName, exitId, lineId = "") {
    const normalizedExitId = String(exitId || "").replace(/^出口/, "").replace(/號出口$/, "").toUpperCase();
    const stationCode = lineId ? getStationCode(stationName, lineId) : "";
    const mExitId = /^\d+$/.test(normalizedExitId) ? `M${normalizedExitId}` : "";
    const keys = [
        stationCode && `${stationCode}|${normalizedExitId}`,
        `${stationName}|${normalizedExitId}`,
        mExitId && stationCode && `${stationCode}|${mExitId}`,
        mExitId && `${stationName}|${mExitId}`
    ].filter(Boolean);
    const matched = keys.map(key => window.exitNameData?.[key]).find(Boolean);
    if (matched) {
        return {
            zh: `${zh.exit} ${normalizedExitId} ${matched.nameZh}`,
            en: matched.nameEn,
            raw: matched.raw
        };
    }
    return {
        zh: `${stationName} ${zh.exit} ${normalizedExitId}`,
        en: `Exit ${normalizedExitId} - English name not found`,
        raw: ""
    };
}

function getBestCarRecord(stationData, preferElevator = false) {
    if (!stationData?.cars?.length) return null;
    return stationData.cars
        .filter(car => hasUsefulValue(car.carNumber))
        .map(car => {
            let score = 0;
            if (hasUsefulValue(car.transfer_info)) score += 5;
            if (hasUsefulValue(car.transfer_time)) score += 4;
            if (hasUsefulValue(car.escalator_both) || hasUsefulValue(car.escalator_up)) score += 3;
            if (hasUsefulValue(car.elevator)) score += preferElevator ? 8 : 2;
            if (hasUsefulValue(car.stairs)) score += 1;
            return { car, score };
        })
        .sort((a, b) => b.score - a.score)[0]?.car || stationData.cars[0];
}

function getTransferWalkPlan(stationData, preferElevator = false) {
    const record = getBestCarRecord(stationData, preferElevator);
    const transferMinutes = Number(String(record?.transfer_time || "").match(/\d+/)?.[0]) || (preferElevator ? 5 : 3);
    return {
        record,
        carNumber: record?.carNumber || "\u4f9d\u73fe\u5834\u6a19\u793a",
        elevator: hasUsefulValue(record?.elevator) ? record.elevator : (preferElevator ? "\u7ad9\u5167\u96fb\u68af\u52d5\u7dda" : "\u7121\u660e\u78ba\u96fb\u68af\u8cc7\u6599"),
        escalator: firstUsefulValue(record?.escalator_both, record?.escalator_up) || "\u7121\u660e\u78ba\u96fb\u6276\u68af\u8cc7\u6599",
        stairs: hasUsefulValue(record?.stairs) ? record.stairs : "\u7121\u660e\u78ba\u6a13\u68af\u8cc7\u6599",
        transferInfo: hasUsefulValue(record?.transfer_info) ? record.transfer_info : "\u4f9d\u7ad9\u5167\u8f49\u4e58\u6307\u6a19\u524d\u5f80",
        transferMinutes,
        walkDistance: transferMinutes * (preferElevator ? 55 : 70)
    };
}

function parseCarNumbers(records) {
    const nums = new Set();
    records.forEach(record => {
        const match = String(record?.carNumber || "").match(/\d+/);
        if (match) nums.add(Number(match[0]));
    });
    return [...nums].filter(num => num >= 1 && num <= 6).sort((a, b) => a - b);
}

function formatRecommendedCars(card) {
    if (card.cars?.length) return `\u7b2c ${card.cars.join("\u3001")} \u8eca\u5ec2`;
    if (hasUsefulValue(card.carNumber)) return escapeHtml(card.carNumber);
    return "\u4f9d\u73fe\u5834\u6a19\u793a";
}

function getCarRecommendationReason(record) {
    if (!record) return "";
    const reasons = [];
    if (hasUsefulValue(record.transfer_time)) reasons.push(`\u8f49\u4e58\u7d04 ${record.transfer_time}`);
    if (hasUsefulValue(record.escalator_both) || hasUsefulValue(record.escalator_up)) reasons.push("\u9760\u8fd1\u96fb\u6276\u68af");
    if (hasUsefulValue(record.elevator)) reasons.push("\u9760\u8fd1\u96fb\u68af");
    if (hasUsefulValue(record.transfer_info)) reasons.push(record.transfer_info);
    return reasons.slice(0, 2).join("\u3001") || "\u4f9d\u8f49\u4e58\u8a2d\u65bd\u8207\u6642\u9593\u7d9c\u5408\u63a8\u85a6";
}

function renderTrainCars(highlightCars) {
    const active = new Set(highlightCars);
    return `
        <div class="train-car-map" aria-label="recommended cars">
            ${[1, 2, 3, 4, 5, 6].map(num => `
                <div class="train-car ${active.has(num) ? "active" : ""}">
                    <span>${num}</span>
                    <small>${zh.car}</small>
                </div>
            `).join("")}
        </div>
    `;
}

function setupStationView() {
    const lineBtns = document.querySelectorAll("#line-buttons .line-btn");
    const stationSelect = document.getElementById("station-select");

    lineBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            lineBtns.forEach(other => other.classList.remove("active"));
            btn.classList.add("active");
            populateStationSelect(stationSelect, idToLineName[btn.dataset.line]);
            stationSelect.disabled = false;
        });
    });

    stationSelect.addEventListener("change", () => {
        stationSelect.dataset.pendingStation = stationSelect.value;
    });

    document.getElementById("station-search-submit")?.addEventListener("click", () => {
        const activeLine = document.querySelector("#line-buttons .line-btn.active")?.dataset.line;
        if (!activeLine || !stationSelect.value) return;
        renderStationDashboard(idToLineName[activeLine], stationSelect.value);
        switchView("view-dashboard", "nav-station");
    });

    document.getElementById("dash-favorite-btn")?.addEventListener("click", event => {
        const stationName = document.getElementById("dash-station-name").textContent;
        const lineName = document.getElementById("dash-line-tags").dataset.lineName;
        toggleFavorite(stationName, lineName, event.currentTarget);
    });
}

function renderStationDashboard(lineName, stationName) {
    const node = getStationNode(stationName);
    const lineId = getLineIdFromLineName(lineName);
    const lineColor = lineColors[lineId] || "var(--primary-color)";
    const stationCodes = getStationCodes(stationName);

    document.getElementById("dash-station-name").textContent = stationName;
    document.getElementById("dash-station-en").textContent = node?.en_name || stationName;
    const desc = document.getElementById("dash-station-desc");
    if (desc) desc.textContent = "";
    document.querySelector(".station-desc-container")?.classList.add("is-hidden");
    const mainBadge = document.getElementById("dash-main-badge");
    mainBadge.className = "station-code-stack";
    mainBadge.removeAttribute("style");
    mainBadge.innerHTML = (stationCodes.length ? stationCodes : [{ lineId, code: getStationCode(stationName, lineId), color: lineColor }]).map(item => `
        <div class="station-code-badge ${item.lineId.toLowerCase()}-badge" style="background:${item.color};">
            <span>${escapeHtml(item.lineId)}</span>
            <strong>${escapeHtml(item.code.replace(item.lineId, ""))}</strong>
        </div>
    `).join("");

    const headerCard = document.querySelector(".station-header-card");
    headerCard?.style.setProperty("--station-line-color", lineColor);

    const lineTag = document.getElementById("dash-line-tags");
    lineTag.textContent = `\u8def\u7dda\uFF1A${lineName}`;
    lineTag.dataset.lineName = lineName;
    lineTag.style.color = lineColor;

    const badgeContainer = document.getElementById("dash-transfer-badges");
    badgeContainer.innerHTML = "";

    const favBtn = document.getElementById("dash-favorite-btn");
    const isFav = favoriteStations.some(fav => fav.station === stationName && fav.line === lineName);
    favBtn.innerHTML = isFav
        ? '<i class="fa-solid fa-heart"></i> ' + zh.favoriteDone
        : '<i class="fa-regular fa-heart"></i> ' + zh.favoriteAdd;
    favBtn.classList.toggle("active", isFav);

    renderFacilitiesGrid(stationName);
    renderExitsList(stationName, lineName);
    renderStationInfo(lineId, stationName);
    renderStationImages(lineId, stationName, lineColor);
}

function getStationImageSlides(lineId, stationName) {
    const codes = getStationCodes(stationName);
    const preferredCode = getStationCode(stationName, lineId);
    const codeSet = new Set([preferredCode, ...codes.map(item => item.code)].filter(Boolean));
    const typeOrder = { "\u4f4d\u7f6e\u5716": 1, "\u5e73\u9762\u5716": 2, "\u5256\u9762\u5716": 3, "\u8cc7\u8a0a\u5716": 4 };
    const images = (window.stationImageData || []).filter(image =>
        codeSet.has(image.code) || image.station === stationName
    );
    const exact = images.filter(image => image.code === preferredCode);
    const source = exact.length ? exact : images;
    return source
        .filter(image => typeOrder[image.type])
        .sort((a, b) => (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99) || a.label.localeCompare(b.label, "zh-Hant"))
        .map((image, index) => ({
            ...image,
            title: image.type === "\u5256\u9762\u5716" ? "\u89e3\u5256\u5716" : image.type,
            index
        }));
}

function renderStationImages(lineId, stationName, lineColor) {
    const title = document.querySelector(".map-card .card-header h3");
    if (title) title.textContent = "\u8eca\u7ad9\u8cc7\u8a0a\u5716";
    currentStationImageSlides = getStationImageSlides(lineId, stationName);
    currentStationImageIndex = 0;
    const container = document.getElementById("dash-map-container");
    if (!currentStationImageSlides.length) {
        container.innerHTML = `
            <div class="station-image-empty" style="--station-line-color:${lineColor};">
                <i class="fa-solid fa-map-location-dot"></i>
                <p>\u5c1a\u7121\u6b64\u7ad9\u8eca\u7ad9\u8cc7\u8a0a\u5716</p>
            </div>
        `;
        return;
    }
    renderStationImageCarousel();
}

function renderStationImageCarousel() {
    const container = document.getElementById("dash-map-container");
    const slide = currentStationImageSlides[currentStationImageIndex];
    const total = currentStationImageSlides.length;
    container.innerHTML = `
        <div class="station-image-viewer">
            <button class="station-image-arrow" type="button" onclick="changeStationImage(-1)" aria-label="\u4e0a\u4e00\u5f35">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button class="station-image-main" type="button" onclick="openMapModal()" aria-label="\u653e\u5927\u6aa2\u8996${escapeHtml(slide.title)}">
                <img src="${escapeHtml(slide.path)}" alt="${escapeHtml(slide.code)} ${escapeHtml(slide.station)} ${escapeHtml(slide.label)}">
            </button>
            <button class="station-image-arrow" type="button" onclick="changeStationImage(1)" aria-label="\u4e0b\u4e00\u5f35">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
            <div class="station-image-caption">
                <strong>${escapeHtml(slide.title)}</strong>
                <span>${currentStationImageIndex + 1} / ${total}</span>
            </div>
        </div>
    `;
}

window.changeStationImage = function(delta) {
    if (!currentStationImageSlides.length) return;
    currentStationImageIndex = (currentStationImageIndex + delta + currentStationImageSlides.length) % currentStationImageSlides.length;
    renderStationImageCarousel();
};

function renderStationInfo(lineId, stationName) {
    const transferInfo = document.getElementById("dash-transfer-info");
    const infoCard = transferInfo.closest(".transfer-info-card");
    const codes = getStationCodes(stationName);
    if (codes.length < 2) {
        infoCard.style.display = "none";
        transferInfo.innerHTML = "";
        return;
    }
    infoCard.style.display = "";
    const pairs = [];
    codes.forEach(from => {
        codes.filter(to => to.lineId !== from.lineId).forEach(to => pairs.push({ from, to }));
    });
    transferInfo.innerHTML = `
        <div class="station-transfer-info-list">
            ${pairs.map(({ from, to }) => {
                const plan = getTransferWalkPlan(getMrtDataRecord(from.lineId, stationName), false);
                return `
                    <div class="station-transfer-info-card" style="--transfer-line:${to.color};">
                        <div class="station-transfer-head">
                            <span class="line-square ${from.lineId.toLowerCase()}-badge">${escapeHtml(from.lineId)}</span>
                            <i class="fa-solid fa-arrow-right"></i>
                            <span class="line-square ${to.lineId.toLowerCase()}-badge">${escapeHtml(to.lineId)}</span>
                            <strong>${escapeHtml(to.lineName)}</strong>
                        </div>
                        <div class="station-transfer-route">
                            <span>${escapeHtml(from.lineName)}</span>
                            <i class="fa-solid fa-arrow-right"></i>
                            <span>${escapeHtml(to.lineName)}</span>
                        </div>
                        <p><i class="fa-solid fa-clock"></i> \u6b65\u884c\u6642\u9593\uff1a\u7d04 ${plan.transferMinutes} \u5206\u9418</p>
                        <p><i class="fa-solid fa-train"></i> ${zh.car}\uff1a${escapeHtml(plan.carNumber)}</p>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function renderFacilitiesGrid(stationName) {
    const facilitiesContainer = document.getElementById("dash-facilities");
    facilitiesContainer.innerHTML = "";
    const facilityMap = new Map();

    getStationDataByName(stationName).forEach(station => {
        (station.cars || []).forEach(car => {
            getFacilityIconsFromCar(car).forEach(facility => {
                if (!facilityMap.has(facility.label)) {
                    facilityMap.set(facility.label, {
                        ...facility,
                        class: `fac-${facility.type || "info"}`,
                        cars: new Set(),
                        stationId: station.id
                    });
                }
                if (hasUsefulValue(car.carNumber)) facilityMap.get(facility.label).cars.add(car.carNumber);
            });
        });
    });

    if (facilityMap.size === 0) {
        facilitiesContainer.innerHTML = `<p style="grid-column:1/-1; color:var(--text-secondary);">${zh.noData}</p>`;
        return;
    }

    facilityMap.forEach(facility => {
        const maintenance = (dynamicData.facilityStatus || []).find(status =>
            status.stationId === facility.stationId && String(status.facility || "").includes(facility.label)
        );
        const carText = [...facility.cars].slice(0, 3).join(" / ");
        facilitiesContainer.innerHTML += `
            <div class="facility-item">
                <div class="facility-icon-circle ${facility.class}">
                    <i class="fa-solid ${facility.icon}"></i>
                </div>
                <span>${escapeHtml(facility.label)}
                    ${maintenance ? `<small style="color:red;">${escapeHtml(maintenance.status || "\u7dad\u4fee\u4e2d")}</small>` : ""}
                    <br><small>${escapeHtml(carText || "\u4f9d\u7ad9\u5167\u6a19\u793a")}</small>
                </span>
            </div>
        `;
    });
}

function renderExitsList(stationName, lineName) {
    const exitsContainer = document.getElementById("dash-exits");
    exitsContainer.innerHTML = "";
    const lineId = getLineIdFromLineName(lineName);
    const stationExits = getStationExitSummaries(getMrtDataRecord(lineId, stationName));

    if (stationExits.length === 0) {
        exitsContainer.innerHTML = `<p style="grid-column:1/-1; color:var(--text-secondary);">${zh.noData}</p>`;
        return;
    }

    stationExits.forEach(exit => {
        const exitName = getExitNameInfo(stationName, exit.id, lineId);
        const facHtml = [...exit.facilities.values()].slice(0, 4).map(fac =>
            `<i class="fa-solid ${fac.icon}" title="${escapeHtml(fac.label)}" style="color:var(--primary-color); margin-right:4px;"></i>`
        ).join("");
        exitsContainer.innerHTML += `
            <div class="exit-card-item">
                <div class="exit-name">${escapeHtml(exit.id)}</div>
                <div class="exit-details">
                    <div class="exit-title">${escapeHtml(exitName.zh)}</div>
                    <div class="exit-landmark">${escapeHtml(exitName.en)}</div>
                    <div class="exit-landmark">${zh.car}\uFF1A${escapeHtml([...exit.cars].slice(0, 4).join(" / ") || "\u4f9d\u73fe\u5834\u6a19\u793a")}</div>
                    <div class="exit-landmark">${escapeHtml([...exit.directions].slice(0, 2).join("\u3001"))}</div>
                    <div style="margin-top:4px;">${facHtml}</div>
                </div>
            </div>
        `;
    });
}

function toggleFavorite(stationName, lineName) {
    const index = favoriteStations.findIndex(fav => fav.station === stationName && fav.line === lineName);
    if (index >= 0) favoriteStations.splice(index, 1);
    else favoriteStations.push({ station: stationName, line: lineName });
    localStorage.setItem("mrt_favorites", JSON.stringify(favoriteStations));
    renderStationDashboard(lineName, stationName);
}

function setupRideView() {
    const originLine = document.getElementById("transfer-origin-line");
    const originStation = document.getElementById("transfer-origin-station");
    const targetLine = document.getElementById("transfer-target-line");
    const targetStation = document.getElementById("transfer-target-station");
    [originLine, targetLine].forEach(updateLineSelectColor);

    originLine.addEventListener("change", () => {
        if (originLine.value && !isSelectableLine(originLine.value)) originLine.value = "";
        updateLineSelectColor(originLine);
        if (originLine.value) {
            populateStationSelect(originStation, idToLineName[originLine.value]);
            originStation.disabled = false;
        } else {
            originStation.innerHTML = `<option value="">${zh.selectLineFirst}</option>`;
            originStation.disabled = true;
        }
    });

    targetLine.addEventListener("change", () => {
        if (targetLine.value && !isSelectableLine(targetLine.value)) targetLine.value = "";
        updateLineSelectColor(targetLine);
        if (targetLine.value) {
            populateStationSelect(targetStation, idToLineName[targetLine.value]);
            targetStation.disabled = false;
        } else {
            targetStation.innerHTML = `<option value="">${zh.selectTargetLineFirst}</option>`;
            targetStation.disabled = true;
        }
    });

    document.getElementById("transfer-clear-btn")?.addEventListener("click", () => {
        originLine.value = "";
        originStation.value = "";
        targetLine.value = "";
        targetStation.value = "";
        updateLineSelectColor(originLine);
        updateLineSelectColor(targetLine);
        originStation.innerHTML = `<option value="">${zh.selectLineFirst}</option>`;
        targetStation.innerHTML = `<option value="">${zh.selectTargetLineFirst}</option>`;
        originStation.disabled = true;
        targetStation.disabled = true;
    });

    document.getElementById("transfer-reselect-btn")?.addEventListener("click", () => {
        switchView("view-transfer", "nav-transfer");
    });

    document.getElementById("calc-transfer-btn")?.addEventListener("click", () => {
        if (!originLine.value || !originStation.value || !targetLine.value || !targetStation.value) {
            alert(zh.chooseComplete);
            return;
        }
        if (originLine.value === targetLine.value && originStation.value === targetStation.value) {
            alert("\u8d77\u9ede\u8207\u76ee\u7684\u5730\u76f8\u540c\uFF0C\u8acb\u91cd\u65b0\u9078\u64c7");
            return;
        }
        calculateRide(originLine.value, originStation.value, targetLine.value, targetStation.value);
    });

    setupTransferStationLookup();
}

function setupTransferStationLookup() {
    const select = document.getElementById("transfer-station-select");
    const fromSelect = document.getElementById("transfer-from-line-select");
    const toSelect = document.getElementById("transfer-to-line-select");
    if (!select) return;
    const transferStations = Object.values(metroGraph || {})
        .filter(node => (node.lines || []).length > 1)
        .map(node => {
            const codes = getStationCodes(node.station_name);
            const order = Math.min(...codes.map(item => getStationCodeOrder(item.code)));
            return { node, codes, order: Number.isFinite(order) ? order : 9999 };
        })
        .sort((a, b) => a.order - b.order || a.node.station_name.localeCompare(b.node.station_name, "zh-Hant"));

    select.innerHTML = `<option value="">${zh.selectStation}</option>`;
    transferStations.forEach(({ node, codes }) => {
        const option = document.createElement("option");
        option.value = node.station_name;
        option.textContent = `${codes.map(item => item.code).join(" / ")} ${node.station_name}`;
        option.disabled = !getStationDataByName(node.station_name).length;
        if (option.disabled) option.className = "station-option-disabled";
        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        populateTransferLinePair(select.value);
        renderTransferStationLookup(select.value, fromSelect.value, toSelect.value);
    });
    fromSelect?.addEventListener("change", () => {
        syncTransferToOptions();
        renderTransferStationLookup(select.value, fromSelect.value, toSelect.value);
    });
    toSelect?.addEventListener("change", () => renderTransferStationLookup(select.value, fromSelect.value, toSelect.value));
}

function populateTransferLinePair(stationName) {
    const fromSelect = document.getElementById("transfer-from-line-select");
    const toSelect = document.getElementById("transfer-to-line-select");
    const node = getStationNode(stationName);
    const lines = (node?.lines || []).map(name => ({ name, id: getLineIdFromLineName(name) })).filter(line => line.id);
    const options = lines.map(line => `<option value="${line.id}">${line.id} ${escapeHtml(line.name)}</option>`).join("");
    fromSelect.innerHTML = options || '<option value="">--</option>';
    toSelect.innerHTML = options || '<option value="">--</option>';
    fromSelect.disabled = lines.length < 2;
    toSelect.disabled = lines.length < 2;
    if (lines.length > 1) {
        fromSelect.value = lines[0].id;
        toSelect.value = lines[1].id;
    }
}

function syncTransferToOptions() {
    const fromSelect = document.getElementById("transfer-from-line-select");
    const toSelect = document.getElementById("transfer-to-line-select");
    if (!fromSelect || !toSelect || fromSelect.value !== toSelect.value) return;
    const next = [...toSelect.options].find(option => option.value !== fromSelect.value);
    if (next) toSelect.value = next.value;
}

function renderTransferStationLookup(stationName, fromLineId = "", toLineId = "") {
    const result = document.getElementById("transfer-station-result");
    if (!stationName) {
        result.innerHTML = "";
        return;
    }
    const node = getStationNode(stationName);
    const lines = (node?.lines || []).map(name => ({ name, id: getLineIdFromLineName(name) })).filter(line => line.id);
    const records = getStationDataByName(stationName);
    const selectedRecords = records.filter(station => !fromLineId || station.id?.startsWith(fromLineId));
    const directionCards = selectedRecords.flatMap(station => {
        const byDirection = new Map();
        (station.cars || []).forEach(car => {
            if (!hasUsefulValue(car.direction)) return;
            if (!byDirection.has(car.direction)) byDirection.set(car.direction, []);
            byDirection.get(car.direction).push(car);
        });
        return [...byDirection.entries()].map(([direction, cars]) => {
            const record = getBestCarRecord({ cars }, false) || cars[0];
            const recommendedCars = parseCarNumbers([record]);
            return {
                lineId: station.id?.match(/^[A-Z]+/)?.[0] || "",
                direction,
                minutes: Number(String(record?.transfer_time || "").match(/\d+/)?.[0]) || 3,
                carNumber: record?.carNumber || "",
                cars: recommendedCars,
                reason: getCarRecommendationReason(record)
            };
        });
    }).slice(0, 2);
    const fromLine = lines.find(line => line.id === fromLineId) || lines[0];
    const toLine = lines.find(line => line.id === toLineId) || lines.find(line => line.id !== fromLine?.id) || lines[1] || lines[0];

    result.innerHTML = `
        <div class="transfer-station-card">
            <div>
                <h4>${escapeHtml(stationName)}</h4>
                <div class="route-line-chips">
                    ${lines.map(line => `<span class="route-line-chip ${line.id.toLowerCase()}-chip">${line.id} ${escapeHtml(line.name)}</span>`).join("")}
                </div>
                ${fromLine && toLine ? `<p class="transfer-note">\u67e5\u8a62\uff1a${fromLine.id} ${escapeHtml(fromLine.name)} <i class="fa-solid fa-arrow-right"></i> ${toLine.id} ${escapeHtml(toLine.name)}</p>` : ""}
            </div>
            <div class="transfer-query-result-grid">
                ${(directionCards.length ? directionCards : lines.map(line => ({ lineId: line.id, direction: line.name, minutes: 3, cars: [] }))).map((card, index) => `
                    <div class="transfer-query-result-card ${index % 2 ? "green-tint" : "blue-tint"}">
                        <div class="transfer-query-direction">${escapeHtml(card.direction)}</div>
                        <div class="transfer-query-inner">
                            <div class="transfer-query-time">
                                <i class="fa-regular fa-clock"></i>
                                <span>\u8f49\u4e58\u6642\u9593\uff08\u9810\u4f30\uff09</span>
                                <strong>\u7d04 ${card.minutes} \u5206\u9418</strong>
                            </div>
                            <div class="transfer-query-car">
                                <i class="fa-solid fa-train-subway"></i>
                                <span>\u5efa\u8b70\u642d\u4e58\u8eca\u5ec2</span>
                                <strong>${formatRecommendedCars(card)}</strong>
                                <small>${escapeHtml(card.reason || "\u4f9d\u8f49\u4e58\u8a2d\u65bd\u8207\u6642\u9593\u7d9c\u5408\u63a8\u85a6")}</small>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
            <p class="transfer-note">${records.length ? "\u8cc7\u6599\u4f86\u81ea\u8eca\u5ec2\u5c0d\u61c9\u8207\u7ad9\u5167\u8a2d\u65bd\u6b04\u4f4d\u3002" : zh.noData}</p>
        </div>
    `;
}

function getSharedLineId(fromNode, toNode, preferredLineId = "") {
    const sharedLineNames = (fromNode.lines || []).filter(lineName => (toNode.lines || []).includes(lineName));
    if (preferredLineId && sharedLineNames.includes(idToLineName[preferredLineId])) return preferredLineId;
    return getLineIdFromLineName(sharedLineNames[0]) || preferredLineId;
}

function getRouteLineSegments(path, originLineId) {
    const segments = [];
    let currentLineId = originLineId;
    let segmentStart = path[0];
    for (let i = 1; i < path.length; i++) {
        const sharedLineId = getSharedLineId(path[i - 1], path[i], currentLineId);
        if (sharedLineId && currentLineId && sharedLineId !== currentLineId) {
            segments.push({ lineId: currentLineId, from: segmentStart, to: path[i - 1] });
            segmentStart = path[i - 1];
        }
        if (sharedLineId) currentLineId = sharedLineId;
    }
    segments.push({ lineId: currentLineId, from: segmentStart, to: path[path.length - 1] });
    return segments;
}

function getTransferStopsFromSegments(segments) {
    const transfers = [];
    for (let i = 1; i < segments.length; i++) {
        transfers.push({
            station: segments[i].from,
            fromLineId: segments[i - 1].lineId,
            toLineId: segments[i].lineId
        });
    }
    return transfers;
}

function findStationRoutes(originLineId, originStationName, targetLineId, targetStationName, maxRoutes = 2) {
    const startKey = getStationNodeKey(originStationName, originLineId);
    const targetKey = getStationNodeKey(targetStationName, targetLineId);
    if (!startKey || !targetKey) return [];
    const queue = [{ key: startKey, keys: [startKey], minutes: 0 }];
    const routes = [];
    const signatures = new Set();
    const maxDepth = 38;

    while (queue.length && routes.length < maxRoutes) {
        const current = queue.shift();
        if (current.key === targetKey) {
            const signature = current.keys.join(">");
            if (!signatures.has(signature)) {
                signatures.add(signature);
                const path = current.keys.map(key => metroGraph[key]);
                const segments = getRouteLineSegments(path, originLineId);
                const transfers = getTransferStopsFromSegments(segments).map(transfer => {
                    const stationData = getMrtDataRecord(transfer.fromLineId, transfer.station.station_name);
                    return {
                        ...transfer,
                        fastPlan: getTransferWalkPlan(stationData, false),
                        accessiblePlan: getTransferWalkPlan(stationData, true)
                    };
                });
                const transferMinutes = transfers.reduce((sum, transfer) => sum + transfer.fastPlan.transferMinutes, 0);
                routes.push({
                    path,
                    segments,
                    transfers,
                    stationCount: Math.max(0, path.length - 1),
                    rideMinutes: current.minutes,
                    totalMinutes: current.minutes + transferMinutes,
                    walkDistance: transfers.reduce((sum, transfer) => sum + transfer.fastPlan.walkDistance, 0)
                });
            }
            continue;
        }
        if (current.keys.length > maxDepth) continue;
        for (const neighborKey of metroGraph[current.key].connections || []) {
            if (!metroGraph[neighborKey] || current.keys.includes(neighborKey)) continue;
            queue.push({
                key: neighborKey,
                keys: current.keys.concat(neighborKey),
                minutes: current.minutes + 2
            });
        }
    }
    return routes.sort((a, b) => a.totalMinutes - b.totalMinutes || a.stationCount - b.stationCount).slice(0, maxRoutes);
}

function calculateRide(originLineId, originStationName, targetLineId, targetStationName) {
    const routes = findStationRoutes(originLineId, originStationName, targetLineId, targetStationName, 2);
    if (!routes.length) {
        alert(zh.noRoute);
        return;
    }
    renderRideResult(originLineId, originStationName, targetLineId, targetStationName, routes);
    switchView("view-transfer-result", "nav-transfer");
}

function renderRideResult(originLineId, originStationName, targetLineId, targetStationName, routes) {
    document.getElementById("transfer-result-subtitle").textContent =
        `${originLineId} ${originStationName} -> ${targetLineId} ${targetStationName}\uFF0C${routes.length} \u7a2e\u5efa\u8b70`;
    const container = document.getElementById("transfer-result-cards");
    container.innerHTML = "";

    routes.forEach((route, index) => {
        const lineId = route.segments[0]?.lineId || originLineId;
        const transferHtml = route.transfers.length
            ? route.transfers.map(transfer => renderTransferNode(transfer)).join("")
            : `<div class="route-transfer-node no-transfer"><i class="fa-solid fa-circle-check"></i><strong>${zh.noTransfer}</strong><span>${zh.sameLine}</span></div>`;
        const segmentHtml = route.segments.map((segment, segmentIndex) => `
            <div class="route-segment-node">
                <span class="route-line-dot ${segment.lineId.toLowerCase()}-dot">${segment.lineId}</span>
                <div>
                    <strong>${escapeHtml(segment.from.station_name)}</strong>
                    <i class="fa-solid fa-arrow-right"></i>
                    <strong>${escapeHtml(segment.to.station_name)}</strong>
                </div>
                ${segmentIndex < route.segments.length - 1 ? '<span class="segment-connector"></span>' : ""}
            </div>
        `).join("");

        const card = document.createElement("div");
        card.className = "transfer-direction-card";
        card.innerHTML = `
            <div class="td-header route-card-header" style="color:${lineColors[lineId]}; border-bottom:2px solid ${lineColors[lineId]};">
                <i class="fa-solid ${index === 0 ? "fa-route" : "fa-diamond-turn-right"}"></i>
                ${index === 0 ? zh.recommendedRoute : zh.alternateRoute} ${index + 1}
            </div>
            <div class="td-body">
                <div class="route-summary-strip">
                    <div><i class="fa-solid fa-clock"></i><strong>${route.totalMinutes}</strong><span>${zh.minutes}</span></div>
                    <div><i class="fa-solid fa-location-dot"></i><strong>${route.stationCount}</strong><span>${zh.stops}</span></div>
                    <div><i class="fa-solid fa-right-left"></i><strong>${route.transfers.length}</strong><span>${zh.transfer}</span></div>
                    <div><i class="fa-solid fa-person-walking"></i><strong>${route.walkDistance}</strong><span>m</span></div>
                </div>
                <div class="route-visual-block">
                    <p class="route-block-title">${zh.lineSegment}</p>
                    <div class="route-segment-flow">${segmentHtml}</div>
                </div>
                <div class="route-visual-block">
                    <p class="route-block-title">${zh.transferDetail}</p>
                    <div class="route-transfer-flow">${transferHtml}</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderTransferNode(transfer) {
    return `
        <div class="route-transfer-node">
            <div class="transfer-station-icon"><i class="fa-solid fa-right-left"></i></div>
            <div>
                <strong>${escapeHtml(transfer.station.station_name)}</strong>
                <div class="route-line-chips">
                    <span class="route-line-chip ${transfer.fromLineId.toLowerCase()}-chip">${transfer.fromLineId}</span>
                    <i class="fa-solid fa-arrow-right"></i>
                    <span class="route-line-chip ${transfer.toLineId.toLowerCase()}-chip">${transfer.toLineId}</span>
                </div>
            </div>
            <div class="transfer-icon-list">
                <span><i class="fa-solid fa-train"></i>${escapeHtml(transfer.fastPlan.carNumber)}</span>
                <span><i class="fa-solid fa-stairs"></i>${escapeHtml(transfer.fastPlan.escalator)}</span>
                <span><i class="fa-solid fa-elevator"></i>${escapeHtml(transfer.accessiblePlan.elevator)}</span>
            </div>
        </div>
    `;
}

function setupExitView() {
    const lineSel = document.getElementById("exit-line-select");
    const stationSel = document.getElementById("exit-station-select");
    const doorSel = document.getElementById("exit-door-select");
    const dirGroup = document.getElementById("exit-direction-group");
    updateLineSelectColor(lineSel);

    lineSel.addEventListener("change", () => {
        if (lineSel.value && !isSelectableLine(lineSel.value)) lineSel.value = "";
        updateLineSelectColor(lineSel);
        if (lineSel.value) {
            populateStationSelect(stationSel, idToLineName[lineSel.value]);
            stationSel.disabled = false;
        } else {
            stationSel.innerHTML = `<option value="">${zh.selectLineFirst}</option>`;
            stationSel.disabled = true;
            doorSel.innerHTML = `<option value="">${zh.selectStation}</option>`;
            doorSel.disabled = true;
            dirGroup.innerHTML = `<div class="radio-card empty-state">${zh.selectStation}</div>`;
        }
    });

    stationSel.addEventListener("change", () => {
        const stationData = getMrtDataRecord(lineSel.value, stationSel.value);
        const stationExits = getStationExitSummaries(stationData);
        doorSel.innerHTML = `<option value="">${zh.exit}</option>`;
        stationExits.forEach(exit => {
            const exitName = getExitNameInfo(stationSel.value, exit.id, lineSel.value);
            const option = document.createElement("option");
            option.value = exit.id;
            option.textContent = `${exitName.zh} / ${exitName.en}`;
            doorSel.appendChild(option);
        });
        doorSel.disabled = stationExits.length === 0;
        const directions = [...new Set((stationData?.cars || []).map(car => car.direction).filter(hasUsefulValue))];
        dirGroup.innerHTML = "";
        if (!directions.length) {
            dirGroup.innerHTML = `<div class="radio-card empty-state">${zh.noData}</div>`;
            return;
        }
        directions.forEach(dir => {
            const card = document.createElement("div");
            card.className = "radio-card";
            card.innerHTML = `<input type="radio" name="exit-dir" value="${escapeHtml(dir)}" style="display:none;">${escapeHtml(dir)}`;
            card.addEventListener("click", () => {
                document.querySelectorAll("#exit-direction-group .radio-card").forEach(item => item.classList.remove("active"));
                card.classList.add("active");
                card.querySelector("input").checked = true;
            });
            dirGroup.appendChild(card);
        });
    });

    document.getElementById("search-exit-btn")?.addEventListener("click", () => {
        const checkedDir = document.querySelector('input[name="exit-dir"]:checked');
        if (!lineSel.value || !stationSel.value || !doorSel.value || !checkedDir) {
            alert("\u8acb\u5148\u5b8c\u6574\u9078\u64c7\u8def\u7dda\u3001\u8eca\u7ad9\u3001\u51fa\u53e3\u8207\u65b9\u5411");
            return;
        }
        renderExitResult(lineSel.value, stationSel.value, doorSel.value, checkedDir.value);
        switchView("view-exit-result", "nav-exit");
    });

    document.getElementById("exit-reselect-btn")?.addEventListener("click", () => {
        switchView("view-exit", "nav-exit");
    });
}

function renderExitResult(lineId, stationName, door, dirValue) {
    const lineName = idToLineName[lineId];
    const stationData = getMrtDataRecord(lineId, stationName);
    const matchingRecords = (stationData?.cars || []).filter(car =>
        car.direction === dirValue && extractExitIds(car.exits).includes(door)
    );
    const fallbackRecords = (stationData?.cars || []).filter(car => extractExitIds(car.exits).includes(door));
    const records = matchingRecords.length ? matchingRecords : fallbackRecords;
    const firstRecord = records[0];
    const highlightCars = parseCarNumbers(records);
    const exitName = getExitNameInfo(stationName, door, lineId);

    document.getElementById("exit-result-conditions").innerHTML = `
        <div class="cond-item"><span class="cond-label">${zh.routeRide}</span><span class="cond-val"><span class="line-badge ${lineId.toLowerCase()}-badge">${lineId}</span> ${escapeHtml(lineName)}</span></div>
        <div class="cond-item"><span class="cond-label">${zh.station}</span><span class="cond-val">${escapeHtml(stationName)}</span></div>
        <div class="cond-item"><span class="cond-label">${zh.exit}</span><span class="cond-val">${zh.exit} ${escapeHtml(door)}</span></div>
        <div class="cond-item"><span class="cond-label">\u65b9\u5411</span><span class="cond-val">${escapeHtml(dirValue)}</span></div>
    `;
    document.getElementById("exit-res-badge").textContent = door;
    document.getElementById("exit-res-name").innerHTML = `${escapeHtml(exitName.zh)} <span class="landmark">(${zh.exit})</span>`;
    document.getElementById("exit-res-en").textContent = exitName.en;

    const facilityMap = new Map();
    records.forEach(record => getFacilityIconsFromCar(record).forEach(facility => facilityMap.set(`${facility.icon}-${facility.label}`, facility)));
    document.getElementById("exit-res-types").innerHTML = [...facilityMap.values()].map(facility =>
        `<div class="type-icon-box"><i class="fa-solid ${facility.icon}"></i>${escapeHtml(facility.label)}</div>`
    ).join("") || '<div class="type-icon-box"><i class="fa-solid fa-circle-info"></i>\u4f9d\u7ad9\u5167\u6a19\u793a</div>';

    const detailParts = [];
    if (hasUsefulValue(firstRecord?.elevator)) detailParts.push(`${zh.elevator}\uFF1A${firstRecord.elevator}`);
    const escalatorValue = firstUsefulValue(firstRecord?.escalator_both, firstRecord?.escalator_up);
    if (escalatorValue) detailParts.push(`${zh.escalator}\uFF1A${escalatorValue}`);
    if (hasUsefulValue(firstRecord?.stairs)) detailParts.push(`${zh.stairs}\uFF1A${firstRecord.stairs}`);
    document.getElementById("exit-res-cars").innerHTML = `
        ${renderTrainCars(highlightCars)}
        <div class="car-map-note">${detailParts.join("\u3001") || "\u4f9d\u7ad9\u5167\u6a19\u793a"}</div>
    `;
}

function setupFavoritesView() {
    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById("favorites-list");
    container.innerHTML = "";
    if (!favoriteStations.length) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--text-secondary);">\u5c1a\u672a\u6536\u85cf\u8eca\u7ad9</p>';
        return;
    }
    favoriteStations.forEach((fav, index) => {
        const lineId = getLineIdFromLineName(fav.line);
        container.innerHTML += `
            <div class="favorite-item">
                <div class="fav-line-badge ${lineId.toLowerCase()}-badge">${lineId}</div>
                <div class="fav-station-info">
                    <h4>${escapeHtml(fav.station)}</h4>
                    <span class="line-name">${escapeHtml(fav.line)}</span>
                </div>
                <div class="fav-actions">
                    <button onclick="viewFavoriteStation('${escapeHtml(fav.line)}', '${escapeHtml(fav.station)}')" title="\u67e5\u770b"><i class="fa-regular fa-eye"></i></button>
                    <button onclick="removeFavorite(${index})" title="\u522a\u9664"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </div>
        `;
    });
}

window.viewFavoriteStation = function(lineName, stationName) {
    renderStationDashboard(lineName, stationName);
    switchView("view-dashboard", "nav-station");
};

window.removeFavorite = function(index) {
    favoriteStations.splice(index, 1);
    localStorage.setItem("mrt_favorites", JSON.stringify(favoriteStations));
    renderFavorites();
};

function setupGlobalSearch() {
    const input = document.getElementById("global-search-input");
    const suggestions = document.getElementById("search-suggestions");
    input?.addEventListener("input", () => {
        const value = input.value.trim();
        suggestions.innerHTML = "";
        if (!value) {
            suggestions.style.display = "none";
            return;
        }
        const matches = Object.values(metroGraph || {}).filter(node =>
            node.station_name?.includes(value) || node.en_name?.toLowerCase().includes(value.toLowerCase())
        );
        suggestions.style.display = matches.length ? "block" : "none";
        matches.slice(0, 5).forEach(match => {
            const lineName = match.lines?.[0];
            const lineId = getLineIdFromLineName(lineName);
            const item = document.createElement("div");
            item.className = "suggestion-item";
            item.textContent = `${match.station_name} (${lineId})`;
            item.addEventListener("click", () => {
                input.value = "";
                suggestions.style.display = "none";
                renderStationDashboard(lineName, match.station_name);
                switchView("view-dashboard", "nav-station");
            });
            suggestions.appendChild(item);
        });
    });
    document.addEventListener("click", event => {
        if (!event.target.closest(".search-container")) suggestions.style.display = "none";
    });
}

function setupModal() {
    document.getElementById("map-modal-close")?.addEventListener("click", () => {
        document.getElementById("map-modal").style.display = "none";
    });
}

window.openMapModal = function() {
    const slide = currentStationImageSlides[currentStationImageIndex];
    document.getElementById("map-modal").style.display = "flex";
    document.getElementById("modal-map-container").innerHTML = slide ? `
        <div class="station-image-modal">
            <h3>${escapeHtml(slide.code)} ${escapeHtml(slide.station)} ${escapeHtml(slide.title)}</h3>
            <img src="${escapeHtml(slide.path)}" alt="${escapeHtml(slide.code)} ${escapeHtml(slide.station)} ${escapeHtml(slide.label)}">
        </div>
    ` : `<p style="text-align:center; padding:32px; color:var(--text-secondary);">\u5c1a\u7121\u8eca\u7ad9\u8cc7\u8a0a\u5716\u3002</p>`;
};
