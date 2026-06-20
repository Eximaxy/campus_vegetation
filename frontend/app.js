const VERSION = "plant-gis-v3";
const KEY = `cpg_${VERSION}`;
const CAMPUS = {
  minLng: 118.7760328,
  maxLng: 118.7859854,
  minLat: 31.9126276,
  maxLat: 31.919773,
  centerLng: 118.7810091,
  centerLat: 31.9162003,
  boundary: [
    [31.9160676, 118.7760328],
    [31.9168057, 118.7760404],
    [31.9171141, 118.7760835],
    [31.9173193, 118.7761313],
    [31.9174785, 118.7761835],
    [31.9176717, 118.7762813],
    [31.9177982, 118.7763555],
    [31.9179691, 118.7764764],
    [31.9181266, 118.7765979],
    [31.9182854, 118.7767548],
    [31.9184905, 118.7770245],
    [31.9189236, 118.7776509],
    [31.9194149, 118.7784171],
    [31.9196182, 118.7787413],
    [31.9196893, 118.7788669],
    [31.9197179, 118.7789403],
    [31.9197453, 118.7790345],
    [31.9197580, 118.7791288],
    [31.9197631, 118.7792498],
    [31.9197730, 118.7859296],
    [31.9193084, 118.7859364],
    [31.9159895, 118.7859854],
    [31.9159890, 118.7858215],
    [31.9159585, 118.7855374],
    [31.9158855, 118.7851035],
    [31.9157861, 118.7847451],
    [31.9156782, 118.7844411],
    [31.9155274, 118.7841476],
    [31.9154044, 118.7839298],
    [31.9153235, 118.7838076],
    [31.9152256, 118.7837290],
    [31.9151096, 118.7836575],
    [31.9149615, 118.7835935],
    [31.9148163, 118.7835613],
    [31.9138442, 118.7836246],
    [31.9137854, 118.7835959],
    [31.9134724, 118.7823258],
    [31.9132281, 118.7810243],
    [31.9132087, 118.7808555],
    [31.9131708, 118.7805303],
    [31.9128175, 118.7777136],
    [31.9126276, 118.7762184],
    [31.9127642, 118.7761218],
    [31.9128747, 118.7760915],
    [31.9160213, 118.7760333],
    [31.9160676, 118.7760328],
  ],
};

const LABELS = {
  types: { tree: "乔木", shrub: "灌木", flower: "花坛", lawn: "草坪", heritage: "古树名木", water: "水生植物" },
  health: { healthy: "健康", watch: "需关注", sick: "病虫害", dry: "缺水" },
  care: { watering: "浇水", pruning: "修剪", fertilizing: "施肥", inspection: "巡查", pest: "病虫害处理" },
  issue: { dry: "缺水", pest: "病虫害", withered: "枯萎", fallen: "倒伏", facility: "支撑/围栏损坏" },
  risk: { low: "低", medium: "中", high: "高" },
  status: { pending: "待审核", approved: "已通过", rejected: "已拒绝", processing: "处理中", resolved: "已处理" },
};

const SEED_COORDS = {
  p001: { lng: 118.78150, lat: 31.91620 },
  p002: { lng: 118.78300, lat: 31.91680 },
  p003: { lng: 118.77900, lat: 31.91880 },
  p004: { lng: 118.78050, lat: 31.91400 },
  p005: { lng: 118.77780, lat: 31.91740 },
  p006: { lng: 118.78480, lat: 31.91620 },
  p007: { lng: 118.78280, lat: 31.91890 },
  p008: { lng: 118.77850, lat: 31.91340 },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let state = loadState();
let currentUser = state.sessionUser ? state.users.find((u) => u.username === state.sessionUser) : null;
let currentPlantId = state.plants[0]?.id;
let mapSearchQuery = "";
let leafletMap = null;
let plantMarkerLayer = null;
let campusBoundary = null;
let currentTileLayer = null;
let currentTileLayerKey = null;

const TILE_LAYERS = {
  green: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 20,
      attribution: "Tiles &copy; Esri",
    },
  },
  plain: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    options: {
      maxZoom: 20,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
  },
};

function createSeedData() {
  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();
  return {
    users: [
      { id: "u_admin", username: "admin", password: "admin123", nickname: "绿化管理员", role: "admin", careCount: 8, favorites: ["p001", "p004"], discovered: ["p001", "p002", "p004"] },
      { id: "u_student", username: "student", password: "123456", nickname: "校园巡查员", role: "user", careCount: 3, favorites: ["p002"], discovered: ["p002", "p006"] },
    ],
    plants: [
      plant("p001", "图书馆香樟", "tree", "香樟", "图书馆东侧", SEED_COORDS.p001.lng, SEED_COORDS.p001.lat, "healthy", "一级", daysAgo(1), "树冠完整，位于主干道旁，夏季遮阴效果明显。", "🌳", 12),
      plant("p002", "教学区银杏", "tree", "银杏", "致高楼北侧", SEED_COORDS.p002.lng, SEED_COORDS.p002.lat, "watch", "二级", daysAgo(3), "秋季观赏性强，近期落叶较多，需要巡查树池。", "🍂", 8),
      plant("p003", "行政楼月季花坛", "flower", "月季", "行政楼入口", SEED_COORDS.p003.lng, SEED_COORDS.p003.lat, "healthy", "二级", daysAgo(2), "花期维护良好，需保持定期修剪和补水。", "🌹", 6),
      plant("p004", "南门草坪", "lawn", "混播草坪", "南门广场", SEED_COORDS.p004.lng, SEED_COORDS.p004.lat, "dry", "三级", daysAgo(5), "局部踩踏明显，晴热天气下存在缺水迹象。", "🌱", 15),
      plant("p005", "湖畔荷花区", "water", "荷花", "景观湖西岸", SEED_COORDS.p005.lng, SEED_COORDS.p005.lat, "healthy", "一级", daysAgo(1), "水生植物长势稳定，是校园景观节点。", "🪷", 9),
      plant("p006", "宿舍区桂花", "shrub", "桂花", "学生宿舍 C 区", SEED_COORDS.p006.lng, SEED_COORDS.p006.lat, "sick", "二级", daysAgo(6), "叶片出现虫斑，需要安排病虫害处理。", "🌿", 4),
      plant("p007", "体育场雪松", "tree", "雪松", "体育场西侧", SEED_COORDS.p007.lng, SEED_COORDS.p007.lat, "healthy", "一级", daysAgo(4), "树形挺拔，作为道路景观树重点养护。", "🌲", 5),
      plant("p008", "创新港竹林", "shrub", "竹类", "创新港南侧", SEED_COORDS.p008.lng, SEED_COORDS.p008.lat, "watch", "二级", daysAgo(7), "部分竹竿倾斜，雨季前需检查支撑。", "🎋", 7),
    ],
    careRecords: [
      care("c001", "p001", "u_admin", "inspection", "图书馆东侧", "树池整洁，无明显病虫害。", "approved", daysAgo(1)),
      care("c002", "p004", "u_student", "watering", "南门广场", "草坪局部偏干，已补水。", "approved", daysAgo(2)),
      care("c003", "p006", "u_student", "pest", "宿舍 C 区", "发现虫害，需要复核。", "pending", daysAgo(0)),
      care("c004", "p003", "u_admin", "pruning", "行政楼入口", "完成花后修剪。", "approved", daysAgo(4)),
      care("c005", "p005", "u_admin", "inspection", "景观湖西岸", "水位正常。", "approved", daysAgo(5)),
    ],
    issueReports: [
      issue("r001", "p004", "u_student", "dry", "medium", "草坪南侧出现发黄，需要补水与围挡恢复。", "processing", daysAgo(1)),
      issue("r002", "p006", "u_student", "pest", "high", "桂花叶背有虫斑，建议尽快处理。", "pending", daysAgo(0)),
    ],
    newPlantReports: [],
    sessionUser: null,
  };
}

function plant(id, name, plantType, species, zone, lng, lat, health, careLevel, lastCareAt, description, icon, careCount) {
  return { id, name, plantType, species, zone, lng, lat, health, careLevel, lastCareAt, description, icon, careCount };
}

function care(id, plantId, userId, careType, location, note, status, createdAt) {
  const p = SEED_COORDS[plantId];
  return { id, plantId, userId, careType, lng: p.lng, lat: p.lat, location, note, status, createdAt };
}

function issue(id, plantId, userId, issueType, risk, description, status, createdAt) {
  const p = SEED_COORDS[plantId];
  return { id, plantId, userId, issueType, risk, lng: p.lng, lat: p.lat, description, status, createdAt };
}

function loadState() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const seed = createSeedData();
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

function saveState() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function toast(message) {
  const box = $("#toast");
  box.textContent = message;
  box.classList.remove("hidden");
  setTimeout(() => box.classList.add("hidden"), 2200);
}

function fmtDate(value) {
  return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function statusClass(status) {
  return ["sick", "dry", "high", "rejected"].includes(status) ? "danger" : ["watch", "medium", "pending", "processing"].includes(status) ? "warn" : "";
}

function lngLatToXY(lng, lat) {
  return {
    x: ((lng - CAMPUS.minLng) / (CAMPUS.maxLng - CAMPUS.minLng)) * 100,
    y: (1 - (lat - CAMPUS.minLat) / (CAMPUS.maxLat - CAMPUS.minLat)) * 100,
  };
}

function xyToLngLat(x, y, rect) {
  const px = x / rect.width;
  const py = y / rect.height;
  return {
    lng: CAMPUS.minLng + px * (CAMPUS.maxLng - CAMPUS.minLng),
    lat: CAMPUS.maxLat - py * (CAMPUS.maxLat - CAMPUS.minLat),
  };
}

function init() {
  bindAuth();
  bindNavigation();
  bindForms();
  bindMap();
  bindAdminTabs();
  if (currentUser) showApp();
  else showLogin();
}

function bindAuth() {
  $$("[data-auth-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("[data-auth-tab]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      $("#loginForm").classList.toggle("hidden", btn.dataset.authTab !== "login");
      $("#registerForm").classList.toggle("hidden", btn.dataset.authTab !== "register");
    });
  });
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const user = state.users.find((u) => u.username === $("#loginUsername").value.trim() && u.password === $("#loginPassword").value);
    if (!user) return toast("用户名或密码错误");
    if ($("#loginCaptcha").value.trim() && $("#loginCaptcha").value.trim() !== "2468") return toast("验证码应为 2468");
    currentUser = user;
    state.sessionUser = user.username;
    saveState();
    showApp();
  });
  $("#registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = $("#regUsername").value.trim();
    if (!username || !$("#regPassword").value) return toast("请填写完整注册信息");
    if (state.users.some((u) => u.username === username)) return toast("用户名已存在");
    const user = { id: id("u"), username, password: $("#regPassword").value, nickname: $("#regNickname").value.trim() || username, role: "user", careCount: 0, favorites: [], discovered: [] };
    state.users.push(user);
    currentUser = user;
    state.sessionUser = username;
    saveState();
    showApp();
  });
  $("#logoutBtn").addEventListener("click", () => {
    state.sessionUser = null;
    currentUser = null;
    saveState();
    showLogin();
  });
  $("#resetDataBtn").addEventListener("click", () => {
    if (!confirm("确认恢复初始演示数据？")) return;
    localStorage.removeItem(KEY);
    state = loadState();
    currentUser = null;
    showLogin();
  });
}

function showLogin() {
  $("#loginView").classList.remove("hidden");
  $("#appView").classList.add("hidden");
}

function showApp() {
  $("#loginView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#currentUserName").textContent = `${currentUser.nickname}｜${currentUser.role === "admin" ? "管理员" : "普通用户"}`;
  $$(".admin-only").forEach((el) => el.classList.toggle("hidden", currentUser.role !== "admin"));
  populateSelects();
  ensureLeafletMap();
  renderAll();
}

function bindNavigation() {
  const titles = {
    map: ["绿植地图", "查看校园绿植点位、健康状态与养护热度"],
    plants: ["绿植档案", "按类型、区域和健康状态浏览绿植档案"],
    care: ["养护打卡", "提交浇水、修剪、施肥、巡查等养护记录"],
    reports: ["问题上报", "上报枯萎、缺水、虫害、倒伏等绿化问题"],
    dashboard: ["数据看板", "从空间和业务维度分析校园绿植养护情况"],
    profile: ["个人中心", "查看收藏、打卡记录与校园植物图鉴"],
    admin: ["管理后台", "维护档案、审核记录并管理用户权限"],
  };
  $$(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      $$(".view").forEach((v) => v.classList.remove("active"));
      $(`#${btn.dataset.view}View`).classList.add("active");
      $("#viewTitle").textContent = titles[btn.dataset.view][0];
      $("#viewSubtitle").textContent = titles[btn.dataset.view][1];
      renderAll();
    });
  });
}

function populateSelects() {
  const typeFilter = $("#typeFilter");
  typeFilter.innerHTML = '<option value="all">全部</option>' + Object.entries(LABELS.types).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
  const plantOptions = state.plants.map((p) => `<option value="${p.id}">${p.name}｜${p.zone}</option>`).join("");
  $("#carePlant").innerHTML = plantOptions;
  $("#issuePlant").innerHTML = plantOptions + '<option value="">新位置问题</option>';
}

function bindForms() {
  ["typeFilter", "healthFilter", "baseLayerSelect", "heatToggle"].forEach((sel) => $(`#${sel}`).addEventListener("change", renderMap));
  $("#plantSearch").addEventListener("input", renderPlants);
  $("#careUsePlantCoord").addEventListener("click", () => fillCoordFromPlant("care"));
  $("#issueUsePlantCoord").addEventListener("click", () => fillCoordFromPlant("issue"));
  $("#newPlantReportBtn").addEventListener("click", openNewPlantReport);
  $("#openPlantFormBtn").addEventListener("click", () => openPlantForm());
  $("#closeModal").addEventListener("click", closeModal);

  $("#careForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const plantId = $("#carePlant").value;
    const p = getPlant(plantId);
    const rec = {
      id: id("c"),
      plantId,
      userId: currentUser.id,
      careType: $("#careType").value,
      lng: Number($("#careLng").value || p.lng),
      lat: Number($("#careLat").value || p.lat),
      location: $("#careLocation").value.trim() || p.zone,
      note: $("#careNote").value.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    state.careRecords.unshift(rec);
    saveState();
    e.target.reset();
    toast("养护打卡已提交，等待管理员审核");
    renderAll();
  });

  $("#issueForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const plantId = $("#issuePlant").value;
    const p = plantId ? getPlant(plantId) : null;
    const rec = {
      id: id("r"),
      plantId: plantId || null,
      userId: currentUser.id,
      issueType: $("#issueType").value,
      risk: $("#issueRisk").value,
      lng: Number($("#issueLng").value || p?.lng || CAMPUS.centerLng),
      lat: Number($("#issueLat").value || p?.lat || CAMPUS.centerLat),
      description: $("#issueDesc").value.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    if (!rec.description) return toast("请填写问题描述");
    state.issueReports.unshift(rec);
    saveState();
    e.target.reset();
    toast("问题上报已提交，等待管理员审核");
    renderAll();
  });
}

function bindMap() {
  window.addEventListener("resize", () => {
    if (!leafletMap) return;
    leafletMap.invalidateSize();
    drawHeatmap();
  });
}

function bindAdminTabs() {
  $$("[data-admin-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("[data-admin-tab]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      $$(".admin-panel").forEach((p) => p.classList.remove("active"));
      $(`#${btn.dataset.adminTab}`).classList.add("active");
    });
  });
}

function renderAll() {
  renderMap();
  renderPlants();
  renderCareList();
  renderIssueList();
  renderDashboard();
  renderProfile();
  renderAdmin();
}

function renderMap() {
  const map = $("#campusMap");
  map.className = `campus-map real-map layer-${$("#baseLayerSelect").value}`;
  ensureLeafletMap();
  syncTileLayer();
  const type = $("#typeFilter").value;
  const health = $("#healthFilter").value;
  const plants = state.plants.filter((p) => (type === "all" || p.plantType === type) && (health === "all" || p.health === health));
  renderLeafletMarkers(plants);
  if (!plants.some((p) => p.id === currentPlantId)) currentPlantId = plants[0]?.id || state.plants[0]?.id;
  renderMapInfo();
  if (leafletMap) {
    leafletMap.invalidateSize();
  }
  drawHeatmap();
}

function ensureLeafletMap() {
  if (leafletMap || !$("#leafletMap")) return;
  if (!window.L) {
    $("#mapFallback").classList.remove("hidden");
    $("#mapFallback").textContent = "真实地图资源加载失败，请检查网络连接";
    return;
  }
  $("#mapFallback").classList.add("hidden");
  leafletMap = L.map("leafletMap", {
    center: [CAMPUS.centerLat, CAMPUS.centerLng],
    zoom: 16,
    minZoom: 14,
    maxZoom: 20,
    zoomControl: true,
    preferCanvas: true,
  });
  plantMarkerLayer = L.layerGroup().addTo(leafletMap);
  campusBoundary = L.polygon(CAMPUS.boundary, {
    color: "#6f9b5a",
    weight: 2,
    dashArray: "8 8",
    fillColor: "#cfe3c0",
    fillOpacity: 0.16,
  }).addTo(leafletMap);
  campusBoundary.bindTooltip("河海大学江宁校区", {
    permanent: false,
    direction: "top",
  });
  syncTileLayer();
  leafletMap.fitBounds(campusBoundary.getBounds(), { padding: [24, 24] });
  leafletMap.on("mousemove", (e) => {
    $("#coordBar").textContent = `经度: ${e.latlng.lng.toFixed(6)}　纬度: ${e.latlng.lat.toFixed(6)}`;
  });
  leafletMap.on("move zoom resize", () => {
    drawHeatmap();
    positionMapCallout();
  });
  leafletMap.on("click", () => hideMapCallout());
}

function syncTileLayer() {
  if (!leafletMap || !window.L) return;
  const key = $("#baseLayerSelect").value;
  if (currentTileLayer && currentTileLayerKey === key) return;
  const config = TILE_LAYERS[key] || TILE_LAYERS.green;
  if (currentTileLayer) {
    leafletMap.removeLayer(currentTileLayer);
  }
  currentTileLayer = L.tileLayer(config.url, config.options).addTo(leafletMap);
  currentTileLayerKey = key;
}

function renderLeafletMarkers(plants) {
  if (!leafletMap || !plantMarkerLayer || !window.L) return;
  plantMarkerLayer.clearLayers();
  plants.forEach((p) => {
    const marker = L.marker([p.lat, p.lng], {
      title: p.name,
      icon: L.divIcon({
        className: `plant-map-marker ${p.health}`,
        html: p.icon,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -20],
      }),
    });
    marker.on("click", (event) => {
      if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
      selectPlant(p.id);
    });
    marker.addTo(plantMarkerLayer);
  });
}

function mapPopupHtml(p) {
  return `
    <div class="callout-head">
      <span>${p.icon}</span>
      <strong>${p.name}</strong>
    </div>
    <div class="callout-meta">${LABELS.types[p.plantType]}｜${p.species}</div>
    <div class="callout-row">位置：${p.zone}</div>
    <div class="callout-row">状态：${LABELS.health[p.health]}</div>
    <div class="map-popup-actions">
      <button onclick="window.appActions.fillCare('${p.id}')">养护</button>
      <button onclick="window.appActions.fillIssue('${p.id}')">上报</button>
    </div>
  `;
}

function showMapCallout(p) {
  const callout = $("#mapCallout");
  if (!callout || !leafletMap || !p) return;
  callout.innerHTML = mapPopupHtml(p);
  callout.dataset.plantId = p.id;
  callout.classList.remove("hidden");
  positionMapCallout();
}

function hideMapCallout() {
  const callout = $("#mapCallout");
  if (!callout) return;
  callout.classList.add("hidden");
  delete callout.dataset.plantId;
}

function positionMapCallout() {
  const callout = $("#mapCallout");
  if (!callout || callout.classList.contains("hidden") || !leafletMap) return;
  const p = getPlant(callout.dataset.plantId);
  if (!p) return;
  const point = leafletMap.latLngToContainerPoint([p.lat, p.lng]);
  const mapRect = $("#campusMap").getBoundingClientRect();
  const calloutWidth = Math.min(260, Math.max(220, callout.offsetWidth || 240));
  const calloutHeight = callout.offsetHeight || 150;
  let left = point.x - calloutWidth / 2;
  let top = point.y - calloutHeight - 30;
  if (left < 12) left = 12;
  if (left + calloutWidth > mapRect.width - 12) left = mapRect.width - calloutWidth - 12;
  if (top < 12) top = 12;
  callout.style.left = `${Math.max(12, left)}px`;
  callout.style.top = `${top}px`;
  callout.style.setProperty("--anchor-x", `${point.x - left}px`);
}

function renderMapInfo() {
  const p = getPlant(currentPlantId) || state.plants[0];
  if (!p) return;
  const approvedCare = state.careRecords.filter((r) => r.plantId === p.id && r.status === "approved").length;
  const issues = state.issueReports.filter((r) => r.plantId === p.id && r.status !== "rejected");
  const q = mapSearchQuery.trim().toLowerCase();
  const results = state.plants
    .filter((item) => !q || `${item.name}${item.zone}${item.species}${LABELS.types[item.plantType]}${LABELS.health[item.health]}`.toLowerCase().includes(q))
    .slice(0, 6);
  $("#mapInfo").innerHTML = `
    <div class="map-search-panel">
      <label>绿植搜索
        <input id="mapSearchInput" value="${mapSearchQuery}" placeholder="搜索名称、区域、类型或状态" oninput="window.appActions.setMapSearch(this.value)" />
      </label>
      <div class="map-search-results">
        ${results.map((item) => `
          <button class="${item.id === p.id ? "active" : ""}" onclick="window.appActions.focusMap('${item.id}')">
            <span>${item.icon}</span>
            <strong>${item.name}</strong>
            <small>${item.zone}</small>
          </button>
        `).join("") || "<p>没有匹配的绿植点位。</p>"}
      </div>
    </div>
    <div class="plant-card-head">
      <div class="plant-photo">${p.icon}</div>
      <div><h3>${p.name}</h3><span class="status ${statusClass(p.health)}">${LABELS.health[p.health]}</span></div>
    </div>
    <p>${p.description}</p>
    <p><strong>类型：</strong>${LABELS.types[p.plantType]}｜${p.species}</p>
    <p><strong>区域：</strong>${p.zone}</p>
    <p><strong>坐标：</strong>${p.lng.toFixed(6)}, ${p.lat.toFixed(6)}</p>
    <p><strong>养护等级：</strong>${p.careLevel}｜<strong>打卡：</strong>${approvedCare} 次</p>
    <p><strong>未结问题：</strong>${issues.length} 条</p>
    <div class="card-actions">
      <button class="primary-btn" onclick="window.appActions.fillCare('${p.id}')">养护打卡</button>
      <button class="secondary-btn" onclick="window.appActions.fillIssue('${p.id}')">问题上报</button>
      <button class="ghost-btn" onclick="window.appActions.toggleFavorite('${p.id}')">${currentUser.favorites.includes(p.id) ? "取消收藏" : "收藏"}</button>
    </div>
  `;
}

function drawHeatmap() {
  const canvas = $("#heatCanvas");
  if (!canvas) return;
  const rect = $("#campusMap").getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!$("#heatToggle").checked || !leafletMap) return;
  const points = [];
  state.plants.forEach((p) => points.push({ lng: p.lng, lat: p.lat, w: p.careCount / 4 + 1 }));
  state.careRecords.filter((r) => r.status === "approved").forEach((r) => points.push({ lng: r.lng, lat: r.lat, w: 1.4 }));
  state.issueReports.filter((r) => r.status !== "rejected").forEach((r) => points.push({ lng: r.lng, lat: r.lat, w: 1.8 }));
  points.forEach((pt) => {
    const pos = leafletMap.latLngToContainerPoint([pt.lat, pt.lng]);
    const x = pos.x;
    const y = pos.y;
    const radius = Math.max(28, 34 * pt.w);
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, "rgba(111, 155, 90, 0.32)");
    g.addColorStop(0.45, "rgba(169, 199, 145, 0.22)");
    g.addColorStop(1, "rgba(207, 227, 192, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function selectPlant(idValue) {
  currentPlantId = idValue;
  const p = getPlant(idValue);
  if (p && leafletMap) {
    leafletMap.panTo([p.lat, p.lng], { animate: true, duration: 0.35 });
  }
  showMapCallout(p);
  renderMapInfo();
}

function renderPlants() {
  const q = ($("#plantSearch").value || "").trim().toLowerCase();
  const plants = state.plants.filter((p) => !q || `${p.name}${p.zone}${p.species}${LABELS.types[p.plantType]}`.toLowerCase().includes(q));
  $("#plantGrid").innerHTML = plants.map(plantCard).join("");
}

function plantCard(p) {
  return `
    <article class="plant-card">
      <div class="plant-card-head">
        <div class="plant-photo">${p.icon}</div>
        <div>
          <h3>${p.name}</h3>
          <span class="status ${statusClass(p.health)}">${LABELS.health[p.health]}</span>
        </div>
      </div>
      <p>${LABELS.types[p.plantType]}｜${p.species}｜${p.zone}</p>
      <p>${p.description}</p>
      <div class="card-actions">
        <button class="primary-btn" onclick="window.appActions.focusMap('${p.id}')">地图定位</button>
        <button class="ghost-btn" onclick="window.appActions.toggleFavorite('${p.id}')">${currentUser.favorites.includes(p.id) ? "已收藏" : "收藏"}</button>
        ${currentUser.role === "admin" ? `<button class="secondary-btn" onclick="window.appActions.editPlant('${p.id}')">编辑</button>` : ""}
      </div>
    </article>
  `;
}

function renderCareList() {
  const records = state.careRecords.slice(0, 8);
  $("#careList").innerHTML = records.map((r) => recordCard("care", r)).join("");
}

function renderIssueList() {
  $("#issueList").innerHTML = state.issueReports.slice(0, 8).map((r) => recordCard("issue", r)).join("");
}

function recordCard(kind, r) {
  const p = getPlant(r.plantId);
  const user = state.users.find((u) => u.id === r.userId);
  const title = kind === "care" ? LABELS.care[r.careType] : LABELS.issue[r.issueType];
  const extra = kind === "issue" ? `｜风险：${LABELS.risk[r.risk]}` : "";
  return `
    <article class="record-card">
      <strong>${p?.name || "新位置"}｜${title}${extra}</strong>
      <span class="status ${statusClass(r.status)}">${LABELS.status[r.status]}</span>
      <p>${kind === "care" ? r.note || "无备注" : r.description}</p>
      <p>上报人：${user?.nickname || "-"}｜位置：${r.location || p?.zone || `${r.lng.toFixed(6)}, ${r.lat.toFixed(6)}`}｜${fmtDate(r.createdAt)}</p>
    </article>
  `;
}

function renderDashboard() {
  const approvedCare = state.careRecords.filter((r) => r.status === "approved");
  const pendingIssues = state.issueReports.filter((r) => ["pending", "processing"].includes(r.status));
  $("#metricGrid").innerHTML = [
    ["绿植档案", state.plants.length],
    ["健康绿植", state.plants.filter((p) => p.health === "healthy").length],
    ["待处理问题", pendingIssues.length],
    ["已通过养护", approvedCare.length],
  ].map(([k, v]) => `<div class="metric-card"><span>${k}</span><strong>${v}</strong></div>`).join("");
  drawTrendChart($("#trendChart"), approvedCare);
  drawPieChart($("#typeChart"), countBy(state.plants, "plantType"), LABELS.types);
  drawPieChart($("#healthChart"), countBy(state.plants, "health"), LABELS.health);
  $("#rankList").innerHTML = state.plants
    .slice()
    .sort((a, b) => b.careCount - a.careCount)
    .slice(0, 5)
    .map((p, i) => `<p><strong>${i + 1}. ${p.name}</strong>　${p.careCount} 次养护记录</p>`)
    .join("");
}

function drawTrendChart(canvas, records) {
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const values = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return records.filter((r) => r.createdAt.slice(0, 10) === key).length;
  });
  const max = Math.max(1, ...values);
  ctx.strokeStyle = "#d8e6ce";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = 24 + i * 42;
    line(ctx, 34, y, canvas.width - 18, y);
  }
  ctx.strokeStyle = "#6f9b5a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = 40 + i * ((canvas.width - 70) / 6);
    const y = canvas.height - 34 - (v / max) * (canvas.height - 62);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = "#6f9b5a";
  values.forEach((v, i) => {
    const x = 40 + i * ((canvas.width - 70) / 6);
    const y = canvas.height - 34 - (v / max) * (canvas.height - 62);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(String(v), x - 3, y - 10);
  });
}

function drawPieChart(canvas, counts, labels) {
  if (!canvas) return;
  const ctx = setupCanvas(canvas);
  const entries = Object.entries(counts);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const colors = ["#6f9b5a", "#a9c791", "#244a32", "#9d7a3b", "#cfe3c0", "#7a6a55"];
  let start = -Math.PI / 2;
  entries.forEach(([k, v], i) => {
    const end = start + (v / total) * Math.PI * 2;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(90, 92);
    ctx.arc(90, 92, 66, start, end);
    ctx.closePath();
    ctx.fill();
    start = end;
  });
  ctx.font = "14px Microsoft YaHei";
  entries.forEach(([k, v], i) => {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(190, 36 + i * 26, 12, 12);
    ctx.fillStyle = "#244a32";
    ctx.fillText(`${labels[k]} ${v}`, 208, 47 + i * 26);
  });
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(320, rect.width);
  canvas.height = 210;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "13px Microsoft YaHei";
  ctx.fillStyle = "#7a6a55";
  return ctx;
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function renderProfile() {
  const mine = state.careRecords.filter((r) => r.userId === currentUser.id);
  $("#profileSummary").innerHTML = `
    <h3>${currentUser.nickname}</h3>
    <p>角色：${currentUser.role === "admin" ? "管理员" : "普通用户"}｜累计通过养护：${currentUser.careCount || 0} 次｜收藏：${currentUser.favorites.length} 个｜已点亮图鉴：${currentUser.discovered.length} 个</p>
    <p>我的打卡记录：${mine.length} 条，其中待审核 ${mine.filter((r) => r.status === "pending").length} 条。</p>
  `;
  $("#favoriteGrid").innerHTML = currentUser.favorites.map((idValue) => plantCard(getPlant(idValue))).join("") || "<p>暂无收藏绿植。</p>";
  $("#albumGrid").innerHTML = state.plants.map((p) => {
    const open = currentUser.discovered.includes(p.id);
    return `<div class="album-item ${open ? "" : "locked"}"><div class="plant-photo">${open ? p.icon : "?"}</div><strong>${open ? p.name : "未发现"}</strong></div>`;
  }).join("");
}

function renderAdmin() {
  if (currentUser.role !== "admin") return;
  $("#plantAdmin").innerHTML = table(["名称", "类型", "区域", "健康", "养护次数", "操作"], state.plants.map((p) => [
    p.name,
    LABELS.types[p.plantType],
    p.zone,
    LABELS.health[p.health],
    p.careCount,
    `<button onclick="window.appActions.editPlant('${p.id}')">编辑</button> <button onclick="window.appActions.deletePlant('${p.id}')">删除</button>`,
  ]));
  $("#careAdmin").innerHTML = table(["绿植", "用户", "类型", "时间", "状态", "操作"], state.careRecords.map((r) => [
    getPlant(r.plantId)?.name || "-",
    getUser(r.userId)?.nickname || "-",
    LABELS.care[r.careType],
    fmtDate(r.createdAt),
    LABELS.status[r.status],
    r.status === "pending" ? `<button onclick="window.appActions.reviewCare('${r.id}','approved')">通过</button> <button onclick="window.appActions.reviewCare('${r.id}','rejected')">拒绝</button>` : "-",
  ]));
  $("#issueAdmin").innerHTML = table(["对象", "用户", "问题", "风险", "状态", "操作"], state.issueReports.map((r) => [
    getPlant(r.plantId)?.name || "新位置",
    getUser(r.userId)?.nickname || "-",
    LABELS.issue[r.issueType],
    LABELS.risk[r.risk],
    LABELS.status[r.status],
    issueActions(r),
  ]));
  $("#userAdmin").innerHTML = table(["用户名", "昵称", "角色", "养护次数", "操作"], state.users.map((u) => [
    u.username,
    u.nickname,
    u.role === "admin" ? "管理员" : "普通用户",
    u.careCount || 0,
    u.role === "admin" ? "-" : `<button onclick="window.appActions.promoteUser('${u.id}')">设为管理员</button>`,
  ]));
}

function issueActions(r) {
  if (r.status === "pending") return `<button onclick="window.appActions.reviewIssue('${r.id}','processing')">受理</button> <button onclick="window.appActions.reviewIssue('${r.id}','rejected')">拒绝</button>`;
  if (r.status === "processing") return `<button onclick="window.appActions.reviewIssue('${r.id}','resolved')">标记处理</button>`;
  return "-";
}

function table(headers, rows) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function fillCoordFromPlant(kind) {
  const p = getPlant($(`#${kind}Plant`).value);
  if (!p) return;
  $(`#${kind}Lng`).value = p.lng.toFixed(6);
  $(`#${kind}Lat`).value = p.lat.toFixed(6);
}

function openPlantForm(plantId) {
  const p = plantId ? getPlant(plantId) : { name: "", plantType: "tree", species: "", zone: "", lng: CAMPUS.centerLng, lat: CAMPUS.centerLat, health: "healthy", careLevel: "二级", description: "", icon: "🌳", careCount: 0 };
  $("#modalContent").innerHTML = `
    <h3>${plantId ? "编辑绿植档案" : "新增绿植档案"}</h3>
    <form id="plantForm" class="form-grid">
      <label>名称<input name="name" value="${p.name}" required /></label>
      <label>类型<select name="plantType">${Object.entries(LABELS.types).map(([k, v]) => `<option value="${k}" ${p.plantType === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label>物种<input name="species" value="${p.species}" /></label>
      <label>区域<input name="zone" value="${p.zone}" required /></label>
      <label>经度<input name="lng" value="${p.lng}" required /></label>
      <label>纬度<input name="lat" value="${p.lat}" required /></label>
      <label>健康<select name="health">${Object.entries(LABELS.health).map(([k, v]) => `<option value="${k}" ${p.health === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label>养护等级<input name="careLevel" value="${p.careLevel}" /></label>
      <label>图标<input name="icon" value="${p.icon}" /></label>
      <label class="wide">简介<textarea name="description">${p.description}</textarea></label>
      <button class="primary-btn wide" type="submit">保存档案</button>
    </form>
  `;
  $("#modal").classList.remove("hidden");
  $("#plantForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const record = { ...p, ...data, lng: Number(data.lng), lat: Number(data.lat), lastCareAt: p.lastCareAt || new Date().toISOString(), careCount: Number(p.careCount || 0) };
    if (plantId) Object.assign(getPlant(plantId), record);
    else state.plants.unshift({ ...record, id: id("p") });
    saveState();
    closeModal();
    populateSelects();
    renderAll();
    toast("绿植档案已保存");
  });
}

function openNewPlantReport() {
  $("#modalContent").innerHTML = `
    <h3>上报新绿植点位</h3>
    <form id="newPlantReportForm" class="form-grid">
      <label>建议名称<input name="name" placeholder="例如：西门樱花树" /></label>
      <label>类型<select name="plantType">${Object.entries(LABELS.types).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
      <label>经度<input name="lng" value="${CAMPUS.centerLng}" /></label>
      <label>纬度<input name="lat" value="${CAMPUS.centerLat}" /></label>
      <label class="wide">特征描述<textarea name="description" required></textarea></label>
      <button class="primary-btn wide" type="submit">提交上报</button>
    </form>
  `;
  $("#modal").classList.remove("hidden");
  $("#newPlantReportForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    state.newPlantReports.unshift({ id: id("n"), userId: currentUser.id, ...data, lng: Number(data.lng), lat: Number(data.lat), status: "pending", createdAt: new Date().toISOString() });
    saveState();
    closeModal();
    toast("新绿植上报已提交");
  });
}

function closeModal() {
  $("#modal").classList.add("hidden");
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    acc[item[field]] = (acc[item[field]] || 0) + 1;
    return acc;
  }, {});
}

function getPlant(idValue) {
  return state.plants.find((p) => p.id === idValue);
}

function getUser(idValue) {
  return state.users.find((u) => u.id === idValue);
}

function id(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;
}

window.appActions = {
  setMapSearch(value) {
    mapSearchQuery = value;
    renderMapInfo();
    const input = $("#mapSearchInput");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  },
  focusMap(plantId) {
    currentPlantId = plantId;
    document.querySelector('[data-view="map"]').click();
    renderMapInfo();
    const p = getPlant(plantId);
    if (p && leafletMap) {
      leafletMap.setView([p.lat, p.lng], Math.max(leafletMap.getZoom(), 17), { animate: true });
    }
  },
  fillCare(plantId) {
    document.querySelector('[data-view="care"]').click();
    $("#carePlant").value = plantId;
    fillCoordFromPlant("care");
  },
  fillIssue(plantId) {
    document.querySelector('[data-view="reports"]').click();
    $("#issuePlant").value = plantId;
    fillCoordFromPlant("issue");
  },
  toggleFavorite(plantId) {
    const list = currentUser.favorites;
    if (list.includes(plantId)) currentUser.favorites = list.filter((idValue) => idValue !== plantId);
    else currentUser.favorites.push(plantId);
    saveState();
    renderAll();
  },
  editPlant: openPlantForm,
  deletePlant(plantId) {
    if (!confirm("确认删除该绿植档案？")) return;
    state.plants = state.plants.filter((p) => p.id !== plantId);
    state.careRecords = state.careRecords.filter((r) => r.plantId !== plantId);
    saveState();
    populateSelects();
    renderAll();
  },
  reviewCare(recordId, status) {
    const r = state.careRecords.find((item) => item.id === recordId);
    r.status = status;
    if (status === "approved") {
      const p = getPlant(r.plantId);
      const u = getUser(r.userId);
      p.lng = r.lng;
      p.lat = r.lat;
      p.lastCareAt = new Date().toISOString();
      p.careCount = (p.careCount || 0) + 1;
      u.careCount = (u.careCount || 0) + 1;
      if (!u.discovered.includes(p.id)) u.discovered.push(p.id);
    }
    saveState();
    renderAll();
  },
  reviewIssue(recordId, status) {
    const r = state.issueReports.find((item) => item.id === recordId);
    r.status = status;
    if (status === "resolved" && r.plantId) getPlant(r.plantId).health = "healthy";
    saveState();
    renderAll();
  },
  promoteUser(userId) {
    getUser(userId).role = "admin";
    saveState();
    renderAll();
  },
};

init();
