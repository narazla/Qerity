export function buildTensorHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tensor Network Compression</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  :root {
    --bg: #0a0c12;
    --bg-panel: #12151f;
    --line: #232838;
    --violet: #8b7cf6;
    --cyan: #5fe3d3;
    --text: #e8e9ee;
    --text-dim: #7b8095;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Space Grotesk', system-ui, sans-serif;
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 20px 60px;
    min-height: 100vh;
  }
  .eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    color: var(--cyan);
    text-transform: uppercase;
  }
  h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 6px 0 4px;
    line-height: 1.25;
  }
  p.desc {
    color: var(--text-dim);
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 28px;
  }

  .stage {
    background: var(--bg-panel);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 28px 20px;
    position: relative;
    min-height: 340px;
  }

  .stage-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
  }

  /* ==== Big matrix ==== */
  #matrixView {
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: opacity 0.5s ease;
  }
  .grid-big {
    display: grid;
    grid-template-columns: repeat(14, 1fr);
    gap: 2px;
    width: 100%;
    max-width: 300px;
  }
  .cell {
    aspect-ratio: 1;
    border-radius: 1px;
    background: var(--violet);
  }

  .param-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 28px;
    font-weight: 700;
    margin-top: 20px;
    color: var(--text);
  }
  .param-count .unit {
    font-size: 12px;
    color: var(--text-dim);
    font-weight: 400;
    display: block;
    margin-top: 2px;
  }

  /* ==== Tensor chain ==== */
  #chainView {
    display: none;
    flex-direction: column;
    align-items: center;
  }
  .chain-svg-wrap {
    width: 100%;
    max-width: 320px;
  }
  .core {
    fill: var(--bg);
    stroke: var(--cyan);
    stroke-width: 1.5;
  }
  .core-cell {
    fill: var(--cyan);
  }
  .link-line {
    stroke: var(--cyan);
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
    opacity: 0.6;
  }
  .core-label {
    fill: var(--text-dim);
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px;
  }

  /* ==== Controls ==== */
  .btn {
    width: 100%;
    background: linear-gradient(135deg, var(--violet), var(--cyan));
    color: #0a0c12;
    border: none;
    padding: 14px;
    border-radius: 10px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 14px;
    margin-top: 20px;
    cursor: pointer;
  }
  .btn:active { opacity: 0.85; }

  .explainer {
    margin-top: 20px;
    padding: 16px;
    background: var(--bg-panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-dim);
    display: none;
  }
  .explainer.show { display: block; }
  .explainer strong { color: var(--text); }

  .honest-note {
    margin-top: 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    border-left: 2px solid var(--violet);
    padding-left: 10px;
    line-height: 1.6;
  }
</style>
</head>
<body>

<div class="eyebrow">Roadmap — AI-Generated Detection Layer</div>
<h1>Compressing the model with Tensor Network principles</h1>
<p class="desc">How a detection model can become light enough to run directly on a phone, with no server needed.</p>

<div class="stage">
  <div class="stage-label">
    <span id="stageLabel">Before compression</span>
    <span id="stageStep">01 / 02</span>
  </div>

  <div id="matrixView">
    <div class="grid-big" id="gridBig"></div>
    <div class="param-count">
      1,000,000
      <span class="unit">parameters stored</span>
    </div>
  </div>

  <div id="chainView">
    <div class="chain-svg-wrap">
      <svg viewBox="0 0 320 140" width="100%">
        <line class="link-line" x1="60" y1="70" x2="140" y2="70"/>
        <line class="link-line" x1="180" y1="70" x2="260" y2="70"/>
        <g id="core1"></g>
        <g id="core2"></g>
        <g id="core3"></g>
      </svg>
    </div>
    <div class="param-count" id="afterCount">
      ~12,000
      <span class="unit">parameters stored</span>
    </div>
  </div>

  <button class="btn" id="runBtn">Run Compression →</button>
</div>

<div class="explainer" id="explainer">
  One large weight matrix is broken down into a chain of <strong>small, interconnected tensors</strong> (dashed lines). To be used, these tensors are recombined through ordinary matrix multiplication, producing results close to the original model's performance.
</div>

<div class="honest-note">
  Honest note: this is a mathematical technique inspired by quantum physics (tensor networks), running entirely on a classical processor. Not actual quantum computing.
</div>

<script>
  const gridBig = document.getElementById('gridBig');
  for (let i = 0; i < 14 * 10; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.opacity = (0.35 + Math.random() * 0.65).toFixed(2);
    gridBig.appendChild(cell);
  }

  function makeCore(x, label, seed) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const size = 60;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', 40);
    rect.setAttribute('width', size);
    rect.setAttribute('height', size);
    rect.setAttribute('rx', 8);
    rect.setAttribute('class', 'core');
    g.appendChild(rect);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        cell.setAttribute('x', x + 6 + c * 12);
        cell.setAttribute('y', 46 + r * 12);
        cell.setAttribute('width', 9);
        cell.setAttribute('height', 9);
        cell.setAttribute('rx', 1.5);
        cell.setAttribute('class', 'core-cell');
        cell.setAttribute('opacity', (0.3 + Math.sin(seed + r + c) * 0.35 + 0.35).toFixed(2));
        g.appendChild(cell);
      }
    }
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x + size / 2);
    text.setAttribute('y', 118);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'core-label');
    text.textContent = label;
    g.appendChild(text);
    return g;
  }

  document.getElementById('core1').appendChild(makeCore(20, 'core A', 1));
  document.getElementById('core2').appendChild(makeCore(130, 'core B', 2));
  document.getElementById('core3').appendChild(makeCore(240, 'core C', 3));

  const runBtn = document.getElementById('runBtn');
  const matrixView = document.getElementById('matrixView');
  const chainView = document.getElementById('chainView');
  const stageLabel = document.getElementById('stageLabel');
  const stageStep = document.getElementById('stageStep');
  const explainer = document.getElementById('explainer');
  let compressed = false;

  runBtn.addEventListener('click', () => {
    if (!compressed) {
      matrixView.style.opacity = '0';
      setTimeout(() => {
        matrixView.style.display = 'none';
        chainView.style.display = 'flex';
        requestAnimationFrame(() => chainView.style.opacity = '1');
      }, 400);
      stageLabel.textContent = 'After compression (tensor network)';
      stageStep.textContent = '02 / 02';
      runBtn.textContent = '↺ Replay Animation';
      explainer.classList.add('show');
      compressed = true;
    } else {
      chainView.style.display = 'none';
      matrixView.style.display = 'flex';
      matrixView.style.opacity = '1';
      stageLabel.textContent = 'Before compression';
      stageStep.textContent = '01 / 02';
      runBtn.textContent = 'Run Compression →';
      explainer.classList.remove('show');
      compressed = false;
    }
  });
</script>

</body>
</html>
`;
}