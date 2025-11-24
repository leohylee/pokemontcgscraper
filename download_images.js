#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const IMAGES_DIR = './images';
const MAX_CONCURRENT = 5; // Download 5 images at a time

// Parse command line arguments
const args = process.argv.slice(2);
const inputFile = args[0];
const outputDir = args[1] || IMAGES_DIR;

if (!inputFile) {
    console.error('Usage: node download_images.js <json_file> [output_dir]');
    console.error('\nExamples:');
    console.error('  node download_images.js results/trainer_cards_urls.json');
    console.error('  node download_images.js results/trainer_cards_urls.json ./trainer_images');
    console.error('\nNote: Images will be saved as {card-id}.png');
    process.exit(1);
}

// Helper function to download a single image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const file = fs.createWriteStream(filepath);

        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });

            file.on('error', (err) => {
                fs.unlink(filepath, () => {}); // Delete partial file
                reject(err);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete partial file
            reject(err);
        });
    });
}

// Helper to process downloads in batches
async function downloadInBatches(downloads, batchSize) {
    const results = {
        success: 0,
        failed: 0,
        skipped: 0,
        errors: []
    };

    for (let i = 0; i < downloads.length; i += batchSize) {
        const batch = downloads.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(downloads.length / batchSize);

        console.log(`\nBatch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, downloads.length)} of ${downloads.length})`);

        const promises = batch.map(async (item) => {
            const { card, url, filepath, cardNum } = item;

            // Check if file already exists
            if (fs.existsSync(filepath)) {
                console.log(`[${cardNum}] ⊘ Skipped: ${card.id} (already exists)`);
                results.skipped++;
                return;
            }

            try {
                await downloadImage(url, filepath);
                console.log(`[${cardNum}] ✓ Downloaded: ${card.id}`);
                results.success++;
            } catch (err) {
                console.error(`[${cardNum}] ✗ Failed: ${card.id} - ${err.message}`);
                results.failed++;
                results.errors.push({
                    card: card.id,
                    url: url,
                    error: err.message
                });
            }
        });

        await Promise.all(promises);

        // Show progress
        const processed = Math.min(i + batchSize, downloads.length);
        const percentage = Math.round((processed / downloads.length) * 100);
        console.log(`Progress: ${processed}/${downloads.length} (${percentage}%) | Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
    }

    return results;
}

async function downloadAllImages() {
    try {
        console.log('=== Pokemon TCG Image Downloader ===\n');

        // Load input file
        console.log(`Loading cards from ${inputFile}...`);
        if (!fs.existsSync(inputFile)) {
            throw new Error(`File not found: ${inputFile}`);
        }

        const cards = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        console.log(`Found ${cards.length} cards\n`);

        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`Created directory: ${outputDir}`);
        }

        // Prepare download list
        const downloads = [];
        const missingImages = [];

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];

            if (!card.image) {
                missingImages.push(card.id || `card ${i + 1}`);
                continue;
            }

            // Create safe filename from card ID
            const safeId = (card.id || `card_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
            const extension = card.image.match(/\.(png|jpg|jpeg|gif)$/i)?.[0] || '.png';
            const filename = `${safeId}${extension}`;
            const filepath = path.join(outputDir, filename);

            downloads.push({
                card,
                url: card.image,
                filepath,
                cardNum: i + 1
            });
        }

        console.log(`\nDownload Summary:`);
        console.log(`  Total cards: ${cards.length}`);
        console.log(`  With images: ${downloads.length}`);
        console.log(`  Missing images: ${missingImages.length}`);
        console.log(`  Output directory: ${outputDir}`);
        console.log(`  Concurrent downloads: ${MAX_CONCURRENT}`);

        if (missingImages.length > 0) {
            console.log(`\nCards without image URLs: ${missingImages.slice(0, 5).join(', ')}${missingImages.length > 5 ? '...' : ''}`);
        }

        console.log('\nStarting downloads...');
        const startTime = Date.now();

        // Download in batches
        const results = await downloadInBatches(downloads, MAX_CONCURRENT);

        const duration = Math.round((Date.now() - startTime) / 1000);

        // Save error log if there were failures
        if (results.errors.length > 0) {
            const errorLog = path.join(outputDir, 'download_errors.json');
            fs.writeFileSync(errorLog, JSON.stringify(results.errors, null, 2));
            console.log(`\n⚠ Error log saved to: ${errorLog}`);
        }

        // Final summary
        console.log('\n=== Download Complete ===');
        console.log(`Total: ${downloads.length} images`);
        console.log(`✓ Successfully downloaded: ${results.success}`);
        console.log(`⊘ Already existed (skipped): ${results.skipped}`);
        console.log(`✗ Failed: ${results.failed}`);
        console.log(`Time: ${Math.floor(duration / 60)}m ${duration % 60}s`);
        console.log(`Location: ${path.resolve(outputDir)}`);

        if (results.success > 0) {
            const avgTime = duration / results.success;
            console.log(`Average: ${avgTime.toFixed(2)}s per image`);
        }

    } catch (err) {
        console.error('\n✗ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

downloadAllImages();
