#!/usr/bin/env node
const scraper = require('./index.js');
const fs = require('fs');
const path = require('path');

// Configuration
const RESULTS_DIR = './results';

// Parse command line arguments
const args = process.argv.slice(2);
const urlsFile = args[0];
const outputName = args[1] || 'scraped_details';

if (!urlsFile) {
    console.error('Usage: node scrape_from_urls.js <urls_file.json> [output_name]');
    console.error('\nExample:');
    console.error('  node scrape_from_urls.js results/trainer_cards_urls.json trainer_cards_full');
    process.exit(1);
}

async function scrapeFromUrlsFile() {
    try {
        // Load URLs file
        console.log(`Loading URLs from ${urlsFile}...`);
        if (!fs.existsSync(urlsFile)) {
            throw new Error(`File not found: ${urlsFile}`);
        }

        const cards = JSON.parse(fs.readFileSync(urlsFile, 'utf8'));
        console.log(`Found ${cards.length} cards to scrape\n`);

        // Create results directory
        if (!fs.existsSync(RESULTS_DIR)) {
            fs.mkdirSync(RESULTS_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const baseFilename = `${outputName}_${timestamp}`;

        console.log('=== Pokemon TCG Scraper - From URLs ===');
        console.log(`Input file: ${urlsFile}`);
        console.log(`Total cards: ${cards.length}`);
        console.log(`Estimated time: ${Math.round(cards.length * 7 / 60)} minutes`);
        console.log(`Output: ${baseFilename}_details.json\n`);
        console.log('Starting scrape...\n');

        const detailedCards = [];
        let successCount = 0;
        let failCount = 0;
        const startTime = Date.now();

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const progress = `[${i + 1}/${cards.length}]`;
            const percentage = Math.round(((i + 1) / cards.length) * 100);

            console.log(`${progress} (${percentage}%) Scraping ${card.id || 'unknown'}...`);

            try {
                const details = await scraper.scrapeCard(card.url);
                detailedCards.push(details);
                successCount++;
            } catch (err) {
                console.error(`${progress} ✗ Failed: ${err.message}`);
                failCount++;
                // Add placeholder with error
                detailedCards.push({
                    ...card,
                    error: err.message,
                    scrapeFailed: true
                });
            }

            // Save progress every 10 cards
            if ((i + 1) % 10 === 0 || i === cards.length - 1) {
                const detailsFile = path.join(RESULTS_DIR, `${baseFilename}_details.json`);
                fs.writeFileSync(detailsFile, JSON.stringify(detailedCards, null, 2));

                const elapsed = Math.round((Date.now() - startTime) / 1000);
                const avgTime = elapsed / (i + 1);
                const remaining = Math.round(avgTime * (cards.length - i - 1));

                console.log(`${progress} Progress saved | Success: ${successCount}, Failed: ${failCount} | ETA: ${Math.round(remaining / 60)}m ${remaining % 60}s\n`);
            }
        }

        const totalTime = Math.round((Date.now() - startTime) / 1000);

        // Save final results
        const detailsFile = path.join(RESULTS_DIR, `${baseFilename}_details.json`);
        fs.writeFileSync(detailsFile, JSON.stringify(detailedCards, null, 2));
        console.log(`\n✓ Saved ${successCount} detailed cards to ${detailsFile}`);

        if (failCount > 0) {
            console.log(`⚠ ${failCount} cards failed to scrape`);
        }

        // Generate summary
        const summary = {
            sourceFile: urlsFile,
            totalCards: cards.length,
            successCount: successCount,
            failCount: failCount,
            timestamp: new Date().toISOString(),
            duration: `${Math.round(totalTime / 60)}m ${totalTime % 60}s`,
            outputFile: `${baseFilename}_details.json`
        };

        const summaryFile = path.join(RESULTS_DIR, `${baseFilename}_summary.json`);
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
        console.log(`✓ Saved summary to ${summaryFile}`);

        console.log('\n=== Final Results ===');
        console.log(`Total cards: ${cards.length}`);
        console.log(`Successfully scraped: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        console.log(`Total time: ${Math.round(totalTime / 60)}m ${totalTime % 60}s`);
        console.log(`Average time per card: ${avgTime.toFixed(1)}s`);
        console.log(`Results: ${detailsFile}`);

    } catch (err) {
        console.error('\n✗ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        await scraper.closeBrowser();
        console.log('\nBrowser closed');
    }
}

scrapeFromUrlsFile();
