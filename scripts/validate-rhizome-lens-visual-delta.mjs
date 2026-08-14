import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const qaDir = process.env.BOGOBOT_LENS_QA_DIR || "qa/rhizome-category-lens-visible-2026-08-01";
const problems = [];
const results = [];

function assert(condition, message) {
  if (!condition) problems.push(message);
}

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : value;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(qaDir, file), "utf8"));
}

function byLabel(items) {
  return Object.fromEntries(items.map(item => [item.label, item]));
}

function pointMap(item) {
  return Object.fromEntries(item.projected.map(node => [node.id, node]));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pairwise(points) {
  const distances = [];
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) distances.push(distance(points[i], points[j]));
  }
  return distances.sort((a, b) => a - b);
}

function median(values) {
  if (!values.length) return 0;
  return values[Math.floor(values.length / 2)];
}

function diagonal(item) {
  return Math.hypot(item.frame.bounds.width, item.frame.bounds.height);
}

function centroidOffset(item) {
  const bounds = item.frame.bounds;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return {
    x: Math.abs(centerX - item.viewport.width / 2) / item.viewport.width,
    y: Math.abs(centerY - item.viewport.height / 2) / item.viewport.height
  };
}

function parsePng(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.toString("ascii", 1, 4) !== "PNG") throw new Error(`Not a PNG: ${file}`);
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const chunks = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
      if (data[8] !== 8) throw new Error(`Unsupported PNG bit depth in ${file}`);
    }
    if (type === "IDAT") chunks.push(data);
    if (type === "IEND") break;
    offset += length + 12;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : null;
  if (!channels) throw new Error(`Unsupported PNG color type ${colorType} in ${file}`);
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * channels);
  let rawOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawOffset++];
    const rowStart = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? pixels[rowStart + x - channels] : 0;
      const up = y > 0 ? pixels[rowStart + x - stride] : 0;
      const upLeft = y > 0 && x >= channels ? pixels[rowStart + x - stride - channels] : 0;
      let value = raw[rawOffset++];
      if (filter === 1) value = (value + left) & 255;
      else if (filter === 2) value = (value + up) & 255;
      else if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value = (value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
      } else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter} in ${file}`);
      pixels[rowStart + x] = value;
    }
  }
  return { width, height, channels, pixels };
}

function pixelDifference(beforeFile, afterFile, beforeItem, afterItem) {
  const before = parsePng(path.join(qaDir, beforeFile));
  const after = parsePng(path.join(qaDir, afterFile));
  assert(before.width === after.width && before.height === after.height, `${beforeFile}: viewport mismatch`);
  const width = Math.min(before.width, after.width);
  const height = Math.min(before.height, after.height);
  const union = beforeItem?.frame?.bounds && afterItem?.frame?.bounds ? {
    minX: Math.max(0, Math.floor(Math.min(beforeItem.frame.bounds.minX, afterItem.frame.bounds.minX) - 120)),
    maxX: Math.min(width, Math.ceil(Math.max(beforeItem.frame.bounds.maxX, afterItem.frame.bounds.maxX) + 120)),
    minY: Math.max(Math.floor(height * 0.14), Math.floor(Math.min(beforeItem.frame.bounds.minY, afterItem.frame.bounds.minY) - 120)),
    maxY: Math.min(Math.floor(height * 0.93), Math.ceil(Math.max(beforeItem.frame.bounds.maxY, afterItem.frame.bounds.maxY) + 120))
  } : { minX: 0, maxX: width, minY: Math.floor(height * 0.14), maxY: Math.floor(height * 0.93) };
  let changed = 0;
  let total = 0;
  let foregroundChanged = 0;
  let foregroundTotal = 0;
  for (let y = union.minY; y < union.maxY; y += 1) {
    for (let x = union.minX; x < union.maxX; x += 1) {
      const bi = (y * before.width + x) * before.channels;
      const ai = (y * after.width + x) * after.channels;
      const delta = Math.abs(before.pixels[bi] - after.pixels[ai]) + Math.abs(before.pixels[bi + 1] - after.pixels[ai + 1]) + Math.abs(before.pixels[bi + 2] - after.pixels[ai + 2]);
      const beforeForeground = Math.abs(before.pixels[bi] - 5) + Math.abs(before.pixels[bi + 1] - 6) + Math.abs(before.pixels[bi + 2] - 7) > 18;
      const afterForeground = Math.abs(after.pixels[ai] - 5) + Math.abs(after.pixels[ai + 1] - 6) + Math.abs(after.pixels[ai + 2] - 7) > 18;
      if (delta > 18) changed += 1;
      total += 1;
      if (beforeForeground || afterForeground) {
        foregroundTotal += 1;
        if (delta > 18) foregroundChanged += 1;
      }
    }
  }
  return {
    allPixels: total ? changed / total : 0,
    foreground: foregroundTotal ? foregroundChanged / foregroundTotal : 0
  };
}

function validateCase(label, options) {
  const before = beforeMetrics[label];
  const after = afterMetrics[label];
  assert(before && after, `${label}: missing metrics`);
  if (!before || !after) return;
  const beforePoints = pointMap(before);
  const afterPoints = pointMap(after);
  const ids = Object.keys(afterPoints);
  const displacements = ids.map(id => distance(beforePoints[id], afterPoints[id])).filter(Number.isFinite);
  const moved20 = displacements.filter(value => value >= 20).length;
  const diagBefore = diagonal(before);
  const diagAfter = diagonal(after);
  const diagonalReduction = 1 - diagAfter / diagBefore;
  const beforeOffset = centroidOffset(before);
  const afterOffset = centroidOffset(after);
  const pixelRatio = options.pixel ? pixelDifference(`before-${label}.png`, `after-${label}.png`, before, after) : null;
  const item = {
    label,
    diagonalReduction: round(diagonalReduction),
    moved20,
    minDisplacement: round(Math.min(...displacements)),
    maxDisplacement: round(Math.max(...displacements)),
    beforeOffset: { x: round(beforeOffset.x), y: round(beforeOffset.y) },
    afterOffset: { x: round(afterOffset.x), y: round(afterOffset.y) },
    zoomBefore: round(before.camera.zoom),
    zoomAfter: round(after.camera.zoom),
    zoomCompensationRatio: round(after.lens?.zoomCompensationRatio),
    pixelDifference: pixelRatio === null ? null : { allPixels: round(pixelRatio.allPixels), foreground: round(pixelRatio.foreground) }
  };
  if (options.world) {
    const core = ["NETWORK_MATTER", "CULTURE", "RITUALS"];
    const coreChange = median(pairwise(core.map(id => afterPoints[id]))) / median(pairwise(core.map(id => beforePoints[id]))) - 1;
    const outlierBefore = Math.min(...["NETWORK_MATTER", "CULTURE", "RITUALS", "EXIT_FROM_CODE"].map(id => distance(beforePoints.TOPOGRAPHY, beforePoints[id])));
    const outlierAfter = Math.min(...["NETWORK_MATTER", "CULTURE", "RITUALS", "EXIT_FROM_CODE"].map(id => distance(afterPoints.TOPOGRAPHY, afterPoints[id])));
    item.coreMedianChange = round(coreChange);
    item.outlierGapReduction = round(1 - outlierAfter / outlierBefore);
    assert(item.outlierGapReduction >= 0.3, `${label}: WORLD outlier gap reduction ${item.outlierGapReduction}`);
    assert(Math.abs(coreChange) <= 0.12, `${label}: WORLD core median change ${coreChange}`);
  }
  if (options.minDiagonalReduction) assert(diagonalReduction >= options.minDiagonalReduction, `${label}: diagonal reduction ${diagonalReduction}`);
  assert(moved20 >= options.minMoved20, `${label}: moved node centers ${moved20}`);
  assert(after.projected.every(node => node.x >= 0 && node.x <= after.viewport.width && node.y >= 0 && node.y <= after.viewport.height), `${label}: node outside viewport`);
  assert(after.overflowX === 0, `${label}: horizontal overflow ${after.overflowX}`);
  assert(after.lens?.framingBoundsSource === "canonical/source", `${label}: framing source ${after.lens?.framingBoundsSource}`);
  assert(after.lens?.fitTriggeredAfterLens === false, `${label}: fit triggered after lens`);
  assert(Math.abs((after.camera.zoom || 0) - (before.camera.zoom || 0)) <= 0.0001, `${label}: camera zoom changed`);
  assert(Math.abs((after.lens?.zoomCompensationRatio ?? 0) - 1) <= 0.0001, `${label}: zoom compensation ratio ${after.lens?.zoomCompensationRatio}`);
  if (pixelRatio !== null) {
    assert(pixelRatio.allPixels >= 0.004, `${label}: all-pixel difference ${pixelRatio.allPixels}`);
    assert(pixelRatio.foreground >= 0.35, `${label}: foreground pixel difference ${pixelRatio.foreground}`);
  }
  results.push(item);
}

const beforeMetrics = byLabel(readJson("before-metrics.json"));
const afterMetrics = byLabel(readJson("after-metrics.json"));

validateCase("world-1440", { world: true, minMoved20: 3, pixel: true });
validateCase("topography-1440", { minDiagonalReduction: 0.2, minMoved20: 3, pixel: true });
validateCase("relics-1440", { minDiagonalReduction: 0.25, minMoved20: 3, pixel: true });
validateCase("world-mobile-390", { world: true, minMoved20: 2 });
validateCase("topography-mobile-390", { minDiagonalReduction: 0.2, minMoved20: 3 });
validateCase("relics-mobile-390", { minDiagonalReduction: 0.25, minMoved20: 3 });

for (const label of ["map-1440", "map-mobile-390"]) {
  const before = beforeMetrics[label];
  const after = afterMetrics[label];
  assert(before && after, `${label}: missing MAP metrics`);
  if (before && after) {
    assert(after.lens?.active === false, `${label}: MAP lens active`);
    assert(after.lens?.strength === 0, `${label}: MAP lens strength ${after.lens?.strength}`);
    assert(after.lens?.targetStrength === 0, `${label}: MAP lens target ${after.lens?.targetStrength}`);
    assert(after.overflowX === 0, `${label}: horizontal overflow ${after.overflowX}`);
  }
}

if (problems.length) {
  console.error(JSON.stringify({ status: "FAIL", problems, results }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "PASS", results }, null, 2));
