export function buildElaHtml(dataUri) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { background: transparent; overflow: hidden; }
  #wrap { display:flex; align-items:center; justify-content:center; padding:8px; }
  canvas { max-width:100%; border-radius:10px; }
</style>
</head>
<body>
<div id="wrap"><canvas id="c"></canvas></div>
<img id="img" style="display:none" src="${dataUri}" />
<script>
  function post(data) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  }

  const img = document.getElementById('img');
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');

  img.onload = function() {
    // Keep original dimensions unless the longest side exceeds this safety limit.
    const MAX_ANALYSIS_SIDE = 1600;
    const MAX_DISPLAY_SIDE = 320;
    const analysisScale = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * analysisScale));
    const height = Math.max(1, Math.round(img.naturalHeight * analysisScale));
    const displayScale = Math.min(1, MAX_DISPLAY_SIDE / Math.max(width, height));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = Math.round(width * displayScale) + 'px';
    canvas.style.height = Math.round(height * displayScale) + 'px';

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const origData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const recompressed = new Image();
    recompressed.onload = function() {
      ctx.drawImage(recompressed, 0, 0, canvas.width, canvas.height);
      const compData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const outData = ctx.createImageData(canvas.width, canvas.height);
      let totalDiff = 0;
      let changedPixels = 0;
      const PIXEL_DIFF_THRESHOLD = 30; // Heuristic; calibrate from real test images.
      for (let i = 0; i < origData.data.length; i += 4) {
        const dR = Math.abs(origData.data[i] - compData.data[i]);
        const dG = Math.abs(origData.data[i+1] - compData.data[i+1]);
        const dB = Math.abs(origData.data[i+2] - compData.data[i+2]);
        const pixelDiff = (dR + dG + dB) / 3;
        const amp = Math.min(255, (dR + dG + dB) * 8);
        if (pixelDiff >= PIXEL_DIFF_THRESHOLD) changedPixels += 1;
        outData.data[i] = amp;
        outData.data[i+1] = amp;
        outData.data[i+2] = amp;
        outData.data[i+3] = 255;
        totalDiff += amp;
      }
      ctx.putImageData(outData, 0, 0);
      const avgDiff = totalDiff / (origData.data.length / 4);
      const changedPixelPercent = (changedPixels / (origData.data.length / 4)) * 100;

      const hashCanvas = document.createElement('canvas');
      hashCanvas.width = 9;
      hashCanvas.height = 8;
      const hashCtx = hashCanvas.getContext('2d');
      hashCtx.drawImage(img, 0, 0, 9, 8);
      const hashData = hashCtx.getImageData(0, 0, 9, 8).data;
      const grayscale = [];
      for (let i = 0; i < hashData.length; i += 4) {
        grayscale.push((hashData[i] * 299 + hashData[i + 1] * 587 + hashData[i + 2] * 114) / 1000);
      }
      let hash = '';
      for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
          hash += grayscale[row * 9 + col] < grayscale[row * 9 + col + 1] ? '1' : '0';
        }
      }
      post({ type: 'analysis_done', avgDiff, changedPixelPercent, hash });
    };
    recompressed.onerror = function() {
      post({ type: 'ela_error', message: 'recompress failed' });
    };
    recompressed.src = canvas.toDataURL('image/jpeg', 0.7);
  };

  img.onerror = function() {
    post({ type: 'ela_error', message: 'image load failed' });
  };
</script>
</body>
</html>
`;
}
