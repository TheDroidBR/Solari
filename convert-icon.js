const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');

async function convert() {
    try {
        const sizes = [16, 32, 48, 64, 128, 256];
        const buffers = [];

        for (const size of sizes) {
            const buffer = await sharp('SolariPhotoTransparente.png')
                .resize(size, size)
                .png()
                .toBuffer();
            buffers.push(buffer);
        }

        const ico = await toIco(buffers);
        fs.writeFileSync('Solari.ico', ico);
        console.log('Solari.ico created successfully!');
    } catch (err) {
        console.error('Error:', err);
    }
}

convert();
