const fs = require('fs');
const b64 = fs.readFileSync('public/logo-avatar-base64.txt', 'utf8').trim();

let html = fs.readFileSync('index.html', 'utf8');

const newSplashCss = `    #splash-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 35%, #065f46 0%, #044e3a 50%, #022c22 100%);
      transition: opacity 0.4s ease-out, visibility 0.4s ease-out;
      user-select: none;
      -webkit-user-select: none;
    }

    #splash-screen.fade-out {
      opacity: 0;
      visibility: hidden;
    }

    .splash-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: splashAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .splash-badge {
      position: relative;
      width: 112px;
      height: 112px;
      border-radius: 28px;
      background: #ffffff;
      padding: 10px;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.45), 0 0 45px rgba(52, 211, 153, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: splashFloat 2.8s ease-in-out infinite alternate;
    }

    .splash-badge img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .splash-glow {
      position: absolute;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(52, 211, 153, 0.35) 0%, rgba(52, 211, 153, 0) 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: -1;
      animation: splashGlowPulse 2.4s ease-in-out infinite alternate;
    }

    .splash-title-wrap {
      margin-top: 22px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .splash-title-text {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 2.25rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #ffffff;
      margin: 0;
      line-height: 1.1;
      text-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }

    .splash-pill-sub {
      margin-top: 8px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #6ee7b7;
      background: rgba(255, 255, 255, 0.09);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      padding: 5px 14px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.14);
    }

    .splash-loader-wrap {
      margin-top: 32px;
      width: 130px;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      overflow: hidden;
      position: relative;
    }

    .splash-loader-fill {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 45%;
      background: linear-gradient(90deg, #10b981, #34d399, #a7f3d0);
      border-radius: 9999px;
      box-shadow: 0 0 10px rgba(52, 211, 153, 0.8);
      animation: splashLoaderAnim 1.4s ease-in-out infinite;
    }

    .splash-footer-pill {
      position: absolute;
      bottom: 28px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 0.72rem;
      font-weight: 500;
      color: rgba(167, 243, 208, 0.75);
      letter-spacing: 0.02em;
    }

    @keyframes splashAppear {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes splashFloat {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-6px); }
    }

    @keyframes splashGlowPulse {
      0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.4; }
      100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.8; }
    }

    @keyframes splashLoaderAnim {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(300%); }
    }`;

const newSplashHtml = `  <div id="splash-screen">
    <div class="splash-content">
      <div class="splash-badge">
        <div class="splash-glow"></div>
        <img src="${b64}" alt="InVet" />
      </div>
      <div class="splash-title-wrap">
        <h1 class="splash-title-text">InVet</h1>
        <div class="splash-pill-sub">Dosage Calculator</div>
      </div>
      <div class="splash-loader-wrap">
        <div class="splash-loader-fill"></div>
      </div>
    </div>
    <div class="splash-footer-pill">⚡ Offline-First • 1000+ Medications</div>
  </div>`;

// Replace CSS in <style>
const styleRegex = /#splash-screen\s*\{[\s\S]*?@keyframes splashLoader\s*\{[\s\S]*?\}\s*\}/;
html = html.replace(styleRegex, newSplashCss);

// Replace Splash Screen HTML
const htmlRegex = /<div id="splash-screen">[\s\S]*?<\/div>\s*<\/div>/;
html = html.replace(htmlRegex, newSplashHtml);

// Also replace the header mascot img with base64 for instant crisp load
html = html.replace(
  '<img src="/icon-192.png" alt="InVet Dog Mascot" className="w-full h-full object-contain" />',
  `<img src="${b64}" alt="InVet Dog Mascot" className="w-full h-full object-contain" />`
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html splash screen updated successfully!');
