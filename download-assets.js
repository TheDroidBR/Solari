const https = require('https');
const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, 'src', 'renderer', 'assets', 'deepfilternet');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Mirrors to try for DeepFilterNet assets
const mirrors = [
    {
        name: 'Unpkg (Stable)',
        baseUrl: 'https://unpkg.com/deepfilternet3-workers@1.0.4/pkg/'
    },
    {
        name: 'GitHub Raw (Fallback)',
        baseUrl: 'https://raw.githubusercontent.com/grazder/samejs/first_demo/deepfilternet3/pkg/' // Validated working raw link
    }
];

const files = [
    { name: 'df_bg.wasm', saveAs: 'deepfilternet.wasm' },
    { name: 'df.js', saveAs: 'deepfilternet.js' }
];

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(destPath);

        const request = https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Status ${response.statusCode}`));
                response.consume();
                return;
            }

            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
        });

        request.on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

async function downloadAsset(file) {
    console.log(`\nStarting download for: ${file.saveAs}`);
    const destPath = path.join(destDir, file.saveAs);

    for (const mirror of mirrors) {
        const url = mirror.baseUrl + file.name;
        console.log(`Trying ${mirror.name}: ${url}`);

        try {
            await downloadFile(url, destPath);
            console.log(`✅ Success! Saved to ${destPath}`);
            return;
        } catch (err) {
            console.error(`❌ Failed with ${mirror.name}: ${err.message}`);
        }
    }
    console.error(`🔥 All mirrors failed for ${file.saveAs}`);
}

async function main() {
    console.log('--- DeepFilterNet Downloader ---');
    for (const file of files) {
        await downloadAsset(file);
    }
    console.log('\nDone.');
}

main();
