#!/usr/bin/env node
const scraper = require('./index_puppeteer.js');

console.log('=== Testing Puppeteer-based Scraper ===\n');

async function runTests() {
    try {
        // Test 1: Try to scrape a single card
        console.log('Test 1: Scraping a single card...');
        try {
            const card = await scraper.scrapeCard("https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/bw-series/bw7/31/");
            console.log('✓ Single card scrape successful!');
            console.log('Card:', JSON.stringify(card, null, 2));
            console.log();
        } catch (err) {
            console.error('✗ Error:', err.message);
            console.log();
        }

        // Test 2: Try a simple search (just get URLs, no details)
        console.log('\nTest 2: Searching for "charizard" (URLs only, first page)...');
        try {
            const cards = await scraper.scrapeAll({ cardName: "charizard" }, false);
            console.log(`✓ Search successful! Found ${cards.length} cards`);
            if (cards.length > 0) {
                console.log('First 3 cards:');
                cards.slice(0, 3).forEach((card, idx) => {
                    console.log(`  ${idx + 1}. ${card.url}`);
                });
            }
            console.log();
        } catch (err) {
            console.error('✗ Error:', err.message);
            console.log();
        }

    } finally {
        // Close browser
        await scraper.closeBrowser();
        console.log('Browser closed');
    }
}

runTests().catch(console.error);
