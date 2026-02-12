const generateWanderArea = (pos, radius = 3.5, sides = 8) => {
  const points = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const jitter = 0.7 + Math.abs(Math.sin(angle * 3 + pos.x)) * 0.6;
    const r = radius * jitter;
    points.push({
      x: pos.x + Math.cos(angle) * r,
      y: pos.y + Math.sin(angle) * r,
    });
  }
  return points;
};

export const generateAllWanderAreas = (locationPositions, cityPositions) => {
  const areas = {};
  const locationRadii = {
    verdant_plains: 4, dark_forest: 3.5, mystic_grove: 3, whispering_caverns: 4,
    haunted_marsh: 3.5, cursed_ruins: 3, crystal_caves: 3, thornwood_pass: 3,
    sunken_temple: 3.5, iron_peaks: 3, blood_canyon: 3.5, frozen_tundra: 4,
    dragon_peaks: 3.5, ashen_battlefield: 4, windswept_ridge: 3.5, molten_core: 3,
    shadow_forest: 3.5, obsidian_wastes: 3.5, ruins_of_ashenmoor: 3, blight_hollow: 3.5,
    shadow_citadel: 3, stormspire_peak: 3, demon_gate: 3, abyssal_depths: 3.5,
    infernal_forge: 3, dreadmaw_canyon: 3, void_threshold: 3, corrupted_spire: 3,
    void_throne: 4, hall_of_odin: 3, maw_of_madra: 3, sanctum_of_omni: 3,
  };

  Object.entries(locationPositions).forEach(([id, pos]) => {
    const radius = locationRadii[id] || 3.5;
    areas[id] = generateWanderArea(pos, radius);
  });

  Object.entries(cityPositions).forEach(([id, pos]) => {
    areas[id] = generateWanderArea(pos, 4);
  });

  return areas;
};

const lerp = (a, b, t) => a + (b - a) * t;

const generateCurvedPath = (from, to, seed = 0) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.01) return [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
  const segments = Math.max(4, Math.round(dist / 3));
  const perpX = -dy / dist;
  const perpY = dx / dist;

  const rng = ((seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const curvature = (rng - 0.5) * dist * 0.2;

  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const baseX = lerp(from.x, to.x, t);
    const baseY = lerp(from.y, to.y, t);
    const curve = Math.sin(t * Math.PI) * curvature;
    const jitter = (Math.sin(t * 17 + seed) * 0.3);
    points.push({
      x: baseX + perpX * (curve + jitter),
      y: baseY + perpY * (curve + jitter),
    });
  }
  return points;
};

export const generateAllRoadPaths = (locationPositions, cityPositions, pathConnections, cityConnections) => {
  const allPositions = { ...locationPositions, ...cityPositions };
  const roads = [];

  const allConnections = [...pathConnections, ...cityConnections];

  allConnections.forEach(([a, b], idx) => {
    const posA = allPositions[a];
    const posB = allPositions[b];
    if (!posA || !posB) return;

    const seed = a.charCodeAt(0) * 31 + b.charCodeAt(0) * 17 + idx;
    const points = generateCurvedPath(posA, posB, seed);
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const width = dist > 20 ? 2.0 : dist > 10 ? 2.5 : 3.0;

    roads.push({ points, width, from: a, to: b });
  });

  return roads;
};

export const aStarPathfind = (start, end, adjacencyMap, positionMap) => {
  if (start === end) return [];

  const getPos = (id) => positionMap[id];
  const heuristic = (a, b) => {
    const pa = getPos(a);
    const pb = getPos(b);
    if (!pa || !pb) return 0;
    return Math.sqrt((pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2);
  };

  const openSet = new Set([start]);
  const cameFrom = {};
  const gScore = { [start]: 0 };
  const fScore = { [start]: heuristic(start, end) };

  while (openSet.size > 0) {
    let current = null;
    let currentF = Infinity;
    for (const node of openSet) {
      const f = fScore[node] ?? Infinity;
      if (f < currentF) {
        currentF = f;
        current = node;
      }
    }

    if (current === end) {
      const path = [current];
      let node = current;
      while (cameFrom[node]) {
        node = cameFrom[node];
        path.unshift(node);
      }
      return path;
    }

    openSet.delete(current);
    const neighbors = adjacencyMap[current] || [];

    for (const neighbor of neighbors) {
      const edgeCost = heuristic(current, neighbor);
      const tentativeG = (gScore[current] ?? Infinity) + edgeCost;

      if (tentativeG < (gScore[neighbor] ?? Infinity)) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = tentativeG + heuristic(neighbor, end);
        openSet.add(neighbor);
      }
    }
  }

  return null;
};

export const buildAStarAdjacency = (pathConnections, cityConnections) => {
  const adj = {};
  const addEdge = (a, b) => {
    if (!adj[a]) adj[a] = [];
    if (!adj[b]) adj[b] = [];
    if (!adj[a].includes(b)) adj[a].push(b);
    if (!adj[b].includes(a)) adj[b].push(a);
  };
  pathConnections.forEach(([a, b]) => addEdge(a, b));
  cityConnections.forEach(([a, b]) => addEdge(a, b));
  return adj;
};
