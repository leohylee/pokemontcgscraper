#!/usr/bin/env node
const scraper = require('./index.js');

console.log('=== Testing Trainer Cards Query ===\n');

async function runTest() {
    try {
        // Query parameters from the user's URL
        // https://www.pokemon.com/uk/pokemon-tcg/pokemon-cards?cardName=&cardText=&evolvesFrom=&Trainer=on&Trainer+%5BPok%C3%A9mon+Tool%5D=on&Stadium=on&Supporter=on&Trainer+%5BTechnical+Machine%5D=on&Trainer+%5BRocket%27s+Secret+Machine%5D=on&rsv10pt5=on&zsv10pt5=on&sv10=on&sv09=on&sv8pt5=on&sv08=on&sv07=on&sv6pt5=on&sv06=on&sv05=on&sv4pt5=on&sv04=on&sv3pt5=on&sv03=on&sv02=on&sv01=on&svp=on&hitPointsMin=0&hitPointsMax=340&retreatCostMin=0&retreatCostMax=5&totalAttackCostMin=0&totalAttackCostMax=5&particularArtist=&advancedSubmit=&sort=number&sort=number

        // Start with a simpler test - just search for trainers from one set
        console.log('Testing with a simpler query first: Trainer cards from sv10 set...\n');

        const query = {
            'Trainer': 'on',
            'sv10': 'on',
            'sort': 'number'
        };

        console.log('Query:', query);
        console.log('\nStarting search (this will take a few minutes)...\n');

        // Get cards without details first to see how many there are
        const cards = await scraper.scrapeAll(query, false);

        console.log(`\n✓ Found ${cards.length} trainer cards from sv10!`);
        console.log('\nFirst 10 cards:');
        cards.slice(0, 10).forEach((card, idx) => {
            console.log(`  ${idx + 1}. ID: ${card.id}, URL: ${card.url}`);
        });

        // Now scrape details for just the first 3 as an example
        console.log('\n\nScr aping details for first 3 cards as example...\n');
        for (let i = 0; i < Math.min(3, cards.length); i++) {
            const details = await scraper.scrapeCard(cards[i].url);
            console.log(`\nCard ${i + 1}:`);
            console.log(JSON.stringify(details, null, 2));
        }

    } catch (err) {
        console.error('✗ Error:', err.message);
        console.error(err.stack);
    } finally {
        await scraper.closeBrowser();
        console.log('\n\nBrowser closed');
    }
}

runTest().catch(console.error);
