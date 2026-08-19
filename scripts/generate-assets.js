const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAssets() {
  const avatarSource = path.resolve('public/logo-avatar.png');
  const bannerSource = path.resolve('public/logo-banner.png');

  console.log('Generating Web & PWA Icons...');
  // 192x192 & 512x512 with padding for nice rounded display
  const icon512Buffer = await sharp(avatarSource)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const icon192Buffer = await sharp(avatarSource)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const faviconBuffer = await sharp(avatarSource)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  fs.writeFileSync('public/icon-512.png', icon512Buffer);
  fs.writeFileSync('public/icon-192.png', icon192Buffer);
  fs.writeFileSync('public/favicon.png', faviconBuffer);
  fs.writeFileSync('icon-512.png', icon512Buffer);
  fs.writeFileSync('icon-192.png', icon192Buffer);

  // Google Play Store Assets
  const storeDir = path.resolve('store-assets');
  if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });

  // 1. Google Play Icon: 512x512 32-bit PNG (with clean white background to make avatar pop on Google Play)
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: await sharp(avatarSource).resize(440, 440, { fit: 'contain' }).toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile(path.join(storeDir, 'google-play-icon-512.png'));

  // 2. Google Play Feature Graphic: 1024x500 JPG/PNG
  // Clean white & emerald background displaying the full logo banner
  await sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: await sharp(bannerSource).resize(850, 425, { fit: 'contain' }).toBuffer(),
      gravity: 'center'
    }
  ])
  .png()
  .toFile(path.join(storeDir, 'feature-graphic-1024x500.png'));

  // Also copy feature graphic to public/og-image.png
  fs.copyFileSync(path.join(storeDir, 'feature-graphic-1024x500.png'), 'public/og-image.png');
  fs.copyFileSync(path.join(storeDir, 'feature-graphic-1024x500.png'), 'og-image.png');

  // Android mipmap launcher icons
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  const resDir = path.resolve('android/app/src/main/res');

  for (const m of mipmaps) {
    const targetDir = path.join(resDir, m.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // Square launcher icon
    await sharp({
      create: {
        width: m.size,
        height: m.size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      {
        input: await sharp(avatarSource).resize(Math.round(m.size * 0.88), Math.round(m.size * 0.88), { fit: 'contain' }).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(targetDir, 'ic_launcher.png'));

    // Round launcher icon
    const circleMask = Buffer.from(
      `<svg width="${m.size}" height="${m.size}"><circle cx="${m.size/2}" cy="${m.size/2}" r="${m.size/2}" fill="#fff"/></svg>`
    );

    const roundBase = await sharp({
      create: {
        width: m.size,
        height: m.size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      {
        input: await sharp(avatarSource).resize(Math.round(m.size * 0.85), Math.round(m.size * 0.85), { fit: 'contain' }).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toBuffer();

    await sharp(roundBase)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // Adaptive icon foreground
    await sharp(avatarSource)
      .resize(Math.round(m.fgSize * 0.65), Math.round(m.fgSize * 0.65), { fit: 'contain' })
      .extend({
        top: Math.round(m.fgSize * 0.175),
        bottom: Math.round(m.fgSize * 0.175),
        left: Math.round(m.fgSize * 0.175),
        right: Math.round(m.fgSize * 0.175),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .resize(m.fgSize, m.fgSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
  }

  // Android splash screen
  const splashDir = path.join(resDir, 'drawable');
  if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

  await sharp(avatarSource)
    .resize(300, 300, { fit: 'contain' })
    .png()
    .toFile(path.join(splashDir, 'splash.png'));

  console.log('All icons, mipmaps, and store assets successfully generated!');
}

generateAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
