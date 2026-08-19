const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function genSplash() {
  const avatarSource = path.resolve('public/logo-avatar.png');
  const target = path.resolve('android/app/src/main/res/drawable/splash_logo.png');

  // Create rounded white badge with dog avatar
  const avatarResized = await sharp(avatarSource)
    .resize(360, 360, { fit: 'contain' })
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="420" height="420"><rect width="420" height="420" rx="96" ry="96" fill="#fff"/></svg>`
  );

  const badge = await sharp({
    create: {
      width: 420,
      height: 420,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    { input: avatarResized, gravity: 'center' }
  ])
  .png()
  .toBuffer();

  await sharp(badge)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toFile(target);

  // Also create a standalone full splash image fallback
  await sharp({
    create: {
      width: 1080,
      height: 1920,
      channels: 4,
      background: { r: 6, g: 78, b: 59, alpha: 1 } // #064e3b
    }
  })
  .composite([
    {
      input: target,
      gravity: 'center'
    }
  ])
  .png()
  .toFile(path.resolve('android/app/src/main/res/drawable/splash.png'));

  console.log('splash_logo.png and splash.png created successfully');
}

genSplash().catch(console.error);
