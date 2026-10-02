const DATA_PATH = "data/aismr_annual_1951_2026.csv";
const DEFAULT_START = 1971;
const DEFAULT_END = 2020;
const COLS = 10;

const EL_NINO = new Set([1951,1953,1957,1958,1963,1965,1969,1972,1982,1987,1991,1997,2002,2004,2009,2015,2023,2026]);
const LA_NINA = new Set([1954,1955,1956,1964,1970,1971,1973,1974,1975,1985,1988,1995,1998,1999,2000,2007,2010,2011,2016,2020,2021,2022]);
const POSITIVE_IOD = new Set([1961,1963,1972,1982,1983,1994,1997,2006,2012,2015,2019]);
const NEGATIVE_IOD = new Set([1960,1964,1974,1981,1989,1992,1996,1998,2010,2014,2016,2021]);

const COLOURS = [
  { max: -15, colour: "#d73027" }, { max: -10, colour: "#f46d43" },
  { max: -5, colour: "#fdae61" }, { max: 0, colour: "#fddbc7" },
  { max: 5, colour: "#d0e6f2" }, { max: 10, colour: "#92c5de" },
  { max: 15, colour: "#4393c3" }, { max: Infinity, colour: "#053061" },
];

const state = { data: [], lpa: NaN, svg: "" };
const startSelect = document.querySelector("#start-year");
const endSelect = document.querySelector("#end-year");
const error = document.querySelector("#period-error");

function parseCSV(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const columns = header.split(",");
  return lines.map(line => {
    const values = line.split(",");
    const row = Object.fromEntries(columns.map((column, i) => [column, values[i]]));
    return { year: Number(row.year), aismr_mm: Number(row.aismr_mm), source: row.source };
  });
}

function colourFor(value) { return COLOURS.find(item => value < item.max).colour; }
function svgText(x, y, text, attrs = "") { return `<text x="${x}" y="${y}" ${attrs}>${text}</text>`; }

function markersFor(year) {
  const markers = [];
  if (EL_NINO.has(year)) markers.push(["▲", "#800080"]);
  if (LA_NINA.has(year)) markers.push(["▼", "#008000"]);
  if (POSITIVE_IOD.has(year)) markers.push(["+", "#008000"]);
  if (NEGATIVE_IOD.has(year)) markers.push(["−", "#800080"]);
  return markers;
}

function calculate() {
  const start = Number(startSelect.value);
  const end = Number(endSelect.value);
  if (start > end) {
    error.textContent = "The LPA start year must be earlier than or equal to the end year.";
    error.hidden = false;
    return;
  }
  const reference = state.data.filter(d => d.year >= start && d.year <= end);
  if (!reference.length) return;
  error.hidden = true;
  state.lpa = reference.reduce((sum, d) => sum + d.aismr_mm, 0) / reference.length;
  document.querySelector("#lpa-value").textContent = `${state.lpa.toFixed(1)} mm`;
  renderChart(start, end);
}

function renderChart(start, end) {
  const tileW = 92, tileH = 72, left = 6, top = 8;
  const rows = Math.ceil(state.data.length / COLS);
  const gridW = COLS * tileW, gridH = rows * tileH;
  const barX = gridW + 90, barW = 52;
  const width = barX + barW + 78, height = gridH + 18;
  const newestFirst = [...state.data].sort((a, b) => b.year - a.year);
  let body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc">`;
  body += `<title id="chart-title">AISMR departures using ${start}–${end} LPA</title>`;
  body += `<desc id="chart-desc">A tile for each year from 1951 to 2026, coloured by percentage rainfall departure.</desc>`;

  newestFirst.forEach((d, i) => {
    const row = Math.floor(i / COLS), col = i % COLS;
    const x = left + col * tileW, y = top + row * tileH;
    const anomaly = ((d.aismr_mm - state.lpa) / state.lpa) * 100;
    body += `<g><rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" fill="${colourFor(anomaly)}"/>`;
    body += `<title>${d.year}: ${d.aismr_mm.toFixed(1)} mm (${anomaly.toFixed(1)}%)</title>`;
    body += svgText(x + tileW/2, y + 31, d.year, 'text-anchor="middle" font-size="15" font-weight="700" fill="#111"');
    body += svgText(x + tileW/2, y + 54, `${anomaly.toFixed(1)}%`, 'text-anchor="middle" font-size="13" fill="#111"');
    markersFor(d.year).forEach(([marker, colour], k) => {
      body += svgText(x + 9 + k*17, y + 13, marker, `font-size="14" font-weight="700" fill="${colour}"`);
    });
    body += `</g>`;
  });

  const stops = ["#053061","#4393c3","#92c5de","#d0e6f2","#fddbc7","#fdae61","#f46d43","#d73027"];
  const segmentH = gridH / stops.length;
  stops.forEach((colour, i) => body += `<rect x="${barX}" y="${top + i*segmentH}" width="${barW}" height="${segmentH+.5}" fill="${colour}"/>`);
  [20,15,10,5,0,-5,-10,-15,-20].forEach((tick, i) => {
    const y = top + i*(gridH/8);
    body += `<line x1="${barX+barW}" y1="${y}" x2="${barX+barW+6}" y2="${y}" stroke="#222"/>`;
    body += svgText(barX+barW+10, y+4, tick, 'font-size="12" fill="#222"');
  });
  body += svgText(barX+barW+56, top+gridH/2, "Percentage Difference in Rainfall (%)", `text-anchor="middle" font-size="12" transform="rotate(90 ${barX+barW+56} ${top+gridH/2})"`);
  body += `</svg>`;
  state.svg = body;
  document.querySelector("#chart").innerHTML = body;
}

function download(name, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

document.querySelector("#reset-period").addEventListener("click", () => {
  startSelect.value = DEFAULT_START; endSelect.value = DEFAULT_END; calculate();
});
startSelect.addEventListener("change", calculate);
endSelect.addEventListener("change", calculate);
document.querySelector("#download-svg").addEventListener("click", () => download("aismr-lpa-chart.svg", state.svg, "image/svg+xml"));
document.querySelector("#download-csv").addEventListener("click", () => {
  const rows = ["year,aismr_mm,lpa_mm,departure_percent,source"];
  state.data.forEach(d => rows.push(`${d.year},${d.aismr_mm.toFixed(3)},${state.lpa.toFixed(3)},${(((d.aismr_mm-state.lpa)/state.lpa)*100).toFixed(3)},${d.source}`));
  download("aismr-lpa-data.csv", rows.join("\n"), "text/csv");
});

fetch(DATA_PATH).then(response => {
  if (!response.ok) throw new Error(`Could not load ${DATA_PATH}`);
  return response.text();
}).then(text => {
  state.data = parseCSV(text);
  const years = state.data.map(d => d.year);
  years.forEach(year => {
    startSelect.add(new Option(year, year));
    endSelect.add(new Option(year, year));
  });
  startSelect.value = DEFAULT_START;
  endSelect.value = DEFAULT_END;
  calculate();
}).catch(err => {
  error.textContent = `${err.message}. Serve this folder through a web server rather than opening index.html directly.`;
  error.hidden = false;
});
