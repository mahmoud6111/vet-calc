import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync, cpSync, readdirSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  publicDir: false,
  plugins: [
    {
      name: 'copy-static-and-fix-links',
      closeBundle() {
        const outDir = resolve(__dirname, 'dist');
        if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

        const files = ['sw.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];
        for (const f of files) {
          const src = resolve(__dirname, f);
          if (existsSync(src)) copyFileSync(src, resolve(outDir, f));
        }

        const dirs = ['vendor', 'fonts'];
        for (const d of dirs) {
          const srcDir = resolve(__dirname, d);
          const destDir = resolve(outDir, d);
          if (existsSync(srcDir)) {
            cpSync(srcDir, destDir, { recursive: true });
          }
        }

        const assetsDir = resolve(outDir, 'assets');
        const assetFontMap = {};
        let fontCssContent = '';
        if (existsSync(assetsDir)) {
          const assetFiles = readdirSync(assetsDir);
          for (const file of assetFiles) {
            const match = file.match(/^Inter-(\d+)-[A-Za-z0-9_-]+\.ttf$/);
            if (match) {
              assetFontMap[`/assets/${file}`] = `/fonts/Inter-${match[1]}.ttf`;
            }
            if (file.endsWith('.css')) {
              fontCssContent = readFileSync(resolve(assetsDir, file), 'utf-8');
              for (const [hashed, local] of Object.entries(assetFontMap)) {
                fontCssContent = fontCssContent.replaceAll(hashed, local);
              }
            }
          }
        }

        const htmlPath = resolve(outDir, 'index.html');
        if (existsSync(htmlPath)) {
          let html = readFileSync(htmlPath, 'utf-8');

          for (const [hashed, local] of Object.entries(assetFontMap)) {
            html = html.replaceAll(hashed, local);
          }

          if (fontCssContent) {
            const cssLinkRegex = /<link[^>]*href="\/assets\/[^"]+\.css"[^>]*>/g;
            html = html.replace(cssLinkRegex, `<style>\n${fontCssContent}\n</style>`);
          }

          html = html
            .replace(/href="\/assets\/manifest-[^"]+\.json"/g, 'href="/manifest.json"')
            .replace(/sizes="192x192"[^>]*href="[^"]*"/g, 'sizes="192x192" href="/icon-192.png"')
            .replace(/sizes="512x512"[^>]*href="[^"]*"/g, 'sizes="512x512" href="/icon-512.png"')
            .replace(/rel="apple-touch-icon"[^>]*href="[^"]*"/g, 'rel="apple-touch-icon" href="/icon-192.png"')
            .replace(/<link[^>]*rel="preconnect"[^>]*>/g, '');

          writeFileSync(htmlPath, html);
        }

        if (existsSync(assetsDir)) {
          rmSync(assetsDir, { recursive: true, force: true });
        }
      }
    }
  ]
});