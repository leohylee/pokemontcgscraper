#!/usr/bin/env node
const scraper = require('./index.js');
const fs = require('fs');
const path = require('path');

// Configuration
const RESULTS_DIR = './results';
const DEFAULT_SAMPLE_SIZE = 10;

// Parse command line arguments
const args = process.argv.slice(2);
const configFile = args[0];

if (!configFile) {
    console.error('Usage: node scrape_cards.js <config.json>');
    console.error('\nExample config.json:');
    console.error(JSON.stringify({
        "name": "sv_trainers",
        "description": "All SV Trainer Cards",
        "query": {
            "Trainer": "on",
            "sv10": "on",
            "sv09": "on"
        },
        "scrapeDetails": false,
        "sampleSize": 10
    }, null, 2));
    process.exit(1);
}

async function scrapeCards() {
    try {
        // Load configuration
        console.log(`Loading configuration from ${configFile}...`);
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

        // Validate config
        if (!config.name || !config.query) {
            throw new Error('Config must have "name" and "query" fields');
        }

        const {
            name,
            description = '',
            query,
            scrapeDetails = false,
            sampleSize = DEFAULT_SAMPLE_SIZE,
            scrapeAll = false
        } = config;

        // Create results directory
        if (!fs.existsSync(RESULTS_DIR)) {
            fs.mkdirSync(RESULTS_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const baseFilename = `${name}_${timestamp}`;

        console.log('\n=== Pokemon TCG Scraper ===');
        console.log(`Name: ${name}`);
        if (description) console.log(`Description: ${description}`);
        console.log(`Query:`, JSON.stringify(query, null, 2));
        console.log('\nStarting scrape...\n');

        // Scrape card URLs
        const cards = await scraper.scrapeAll(query, false);

        console.log(`\n✓ Found ${cards.length} cards!`);

        // Save URLs
        const urlsFile = path.join(RESULTS_DIR, `${baseFilename}_urls.json`);
        fs.writeFileSync(urlsFile, JSON.stringify(cards, null, 2));
        console.log(`✓ Saved card URLs to ${urlsFile}`);

        // Determine how many cards to scrape details for
        let cardsToScrape = [];
        if (scrapeAll) {
            cardsToScrape = cards;
            console.log(`\nScraping details for ALL ${cards.length} cards...`);
            console.log(`Estimated time: ${Math.round(cards.length * 7 / 60)} minutes`);
        } else if (scrapeDetails || sampleSize > 0) {
            cardsToScrape = cards.slice(0, sampleSize);
            console.log(`\nScraping details for first ${cardsToScrape.length} cards as sample...`);
        }

        // Scrape details if requested
        if (cardsToScrape.length > 0) {
            const detailedCards = [];
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < cardsToScrape.length; i++) {
                const progress = `[${i + 1}/${cardsToScrape.length}]`;
                console.log(`${progress} Scraping ${cardsToScrape[i].id}...`);

                try {
                    const details = await scraper.scrapeCard(cardsToScrape[i].url);
                    detailedCards.push(details);
                    successCount++;
                } catch (err) {
                    console.error(`${progress} ✗ Failed: ${err.message}`);
                    failCount++;
                    // Add placeholder with error
                    detailedCards.push({
                        ...cardsToScrape[i],
                        error: err.message
                    });
                }

                // Save progress every 10 cards
                if ((i + 1) % 10 === 0 || i === cardsToScrape.length - 1) {
                    const detailsFile = path.join(RESULTS_DIR, `${baseFilename}_details.json`);
                    fs.writeFileSync(detailsFile, JSON.stringify(detailedCards, null, 2));
                    console.log(`${progress} Progress saved to ${detailsFile}`);
                }
            }

            const detailsFile = path.join(RESULTS_DIR, `${baseFilename}_details.json`);
            console.log(`\n✓ Saved ${successCount} detailed cards to ${detailsFile}`);
            if (failCount > 0) {
                console.log(`⚠ ${failCount} cards failed to scrape`);
            }
        }

        // Generate summary
        const summary = {
            name,
            description,
            query,
            timestamp: new Date().toISOString(),
            totalCards: cards.length,
            detailedCards: cardsToScrape.length,
            files: {
                urls: `${baseFilename}_urls.json`,
                details: cardsToScrape.length > 0 ? `${baseFilename}_details.json` : null
            }
        };

        const summaryFile = path.join(RESULTS_DIR, `${baseFilename}_summary.json`);
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
        console.log(`✓ Saved summary to ${summaryFile}`);

        console.log('\n=== Results ===');
        console.log(`Total cards found: ${cards.length}`);
        console.log(`Details scraped: ${cardsToScrape.length}`);
        console.log(`Results directory: ${RESULTS_DIR}`);

    } catch (err) {
        console.error('\n✗ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        await scraper.closeBrowser();
        console.log('\nBrowser closed');
    }
}

scrapeCards();
