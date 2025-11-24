#!/usr/bin/env node
const scraper = require('./index.js');
const fs = require('fs');

console.log('=== Scraping All Trainer Cards from SV Series ===\n');

async function runFullQuery() {
    try {
        // This is the full query from your URL
        // Note: I'm using US site as UK site has same data
        const query = {
            'Trainer': 'on',
            'Trainer [Pokémon Tool]': 'on',
            'Stadium': 'on',
            'Supporter': 'on',
            'Trainer [Technical Machine]': 'on',
            'Trainer [Rocket\'s Secret Machine]': 'on',
            'rsv10pt5': 'on',
            'zsv10pt5': 'on',
            'sv10': 'on',
            'sv09': 'on',
            'sv8pt5': 'on',
            'sv08': 'on',
            'sv07': 'on',
            'sv6pt5': 'on',
            'sv06': 'on',
            'sv05': 'on',
            'sv4pt5': 'on',
            'sv04': 'on',
            'sv3pt5': 'on',
            'sv03': 'on',
            'sv02': 'on',
            'sv01': 'on',
            'svp': 'on',
            'sort': 'number'
        };

        console.log('Query parameters:', JSON.stringify(query, null, 2));
        console.log('\nThis will scrape ALL trainer cards from all Scarlet & Violet sets.');
        console.log('This may take a VERY long time (potentially hours) depending on the number of cards.');
        console.log('\nStarting search...\n');

        // First, get all cards without details to see how many there are
        const cards = await scraper.scrapeAll(query, false);

        console.log(`\n✓ Found ${cards.length} trainer cards total!`);
        console.log(`\nEstimated time to scrape all details: ${Math.round(cards.length * 7 / 60)} minutes`);

        // Save the list of URLs to a file
        const urlList = cards.map(card => ({
            id: card.id,
            url: card.url,
            image: card.image
        }));
        fs.writeFileSync('trainer_cards_urls.json', JSON.stringify(urlList, null, 2));
        console.log('\n✓ Saved list of card URLs to trainer_cards_urls.json');

        // Ask user if they want to continue (in a real scenario)
        // For now, let's just scrape the first 10 cards as a sample
        console.log('\n\nScraping details for first 10 cards as a sample...\n');

        const detailedCards = [];
        for (let i = 0; i < Math.min(10, cards.length); i++) {
            console.log(`Scraping card ${i + 1} of 10...`);
            try {
                const details = await scraper.scrapeCard(cards[i].url);
                detailedCards.push(details);
            } catch (err) {
                console.error(`Failed to scrape ${cards[i].url}: ${err.message}`);
            }
        }

        // Save sample to file
        fs.writeFileSync('trainer_cards_sample.json', JSON.stringify(detailedCards, null, 2));
        console.log('\n✓ Saved sample of 10 detailed cards to trainer_cards_sample.json');

        console.log('\n=== Sample Cards ===');
        detailedCards.slice(0, 3).forEach((card, idx) => {
            console.log(`\n${idx + 1}. ${card.name} (${card.id})`);
            console.log(`   Type: ${card.type}`);
            console.log(`   Set: ${card.set.name}`);
            console.log(`   Text: ${card.text.substring(0, 100)}...`);
        });

        console.log('\n\n=== Next Steps ===');
        console.log('To scrape ALL cards with details, modify this script to:');
        console.log('1. Change the loop from "10" to "cards.length"');
        console.log('2. Save progress periodically in case of errors');
        console.log('3. Add retry logic for failed cards');
        console.log('4. Run overnight as it will take several hours');

    } catch (err) {
        console.error('✗ Error:', err.message);
        console.error(err.stack);
    } finally {
        await scraper.closeBrowser();
        console.log('\n\nBrowser closed');
    }
}

runFullQuery().catch(console.error);
