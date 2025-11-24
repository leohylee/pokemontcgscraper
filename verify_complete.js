#!/usr/bin/env node
const fs = require('fs');

const file = process.argv[2] || 'results/trainer_cards_complete.json';
console.log('=== Trainer Cards Complete - Verification ===\n');
console.log('File:', file);

try {
    const cards = JSON.parse(fs.readFileSync(file, 'utf8'));

    console.log('\n--- Basic Stats ---');
    console.log('Total cards:', cards.length);

    // Check for cards with/without data
    const withNames = cards.filter(c => c.name);
    const withoutNames = cards.filter(c => !c.name);
    const withImages = cards.filter(c => c.image);
    const withText = cards.filter(c => c.text);
    const withType = cards.filter(c => c.type);
    const withSet = cards.filter(c => c.set && c.set.name);

    console.log('\n--- Data Completeness ---');
    console.log('Cards with names:', withNames.length);
    console.log('Cards without names:', withoutNames.length);
    console.log('Cards with images:', withImages.length);
    console.log('Cards with text:', withText.length);
    console.log('Cards with type:', withType.length);
    console.log('Cards with set info:', withSet.length);

    // Check for duplicates
    const ids = cards.map(c => c.id);
    const uniqueIds = new Set(ids);
    console.log('\n--- Duplicate Check ---');
    console.log('Total IDs:', ids.length);
    console.log('Unique IDs:', uniqueIds.size);
    console.log('Duplicates:', ids.length - uniqueIds.size);

    // Sample cards
    console.log('\n--- Sample Cards ---');
    console.log('\nFirst card:');
    console.log(JSON.stringify(cards[0], null, 2));

    console.log('\nMiddle card:');
    console.log(JSON.stringify(cards[Math.floor(cards.length/2)], null, 2));

    console.log('\nLast card:');
    console.log(JSON.stringify(cards[cards.length-1], null, 2));

    // Card type breakdown
    const types = {};
    cards.forEach(c => {
        if (c.type) {
            types[c.type] = (types[c.type] || 0) + 1;
        }
    });

    console.log('\n--- Card Types Breakdown ---');
    Object.entries(types).sort((a,b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    // Set breakdown
    const sets = {};
    cards.forEach(c => {
        if (c.set && c.set.name) {
            sets[c.set.name] = (sets[c.set.name] || 0) + 1;
        }
    });

    console.log('\n--- Set Breakdown ---');
    Object.entries(sets).sort((a,b) => b[1] - a[1]).forEach(([setName, count]) => {
        console.log(`  ${setName}: ${count}`);
    });

    // Check for any missing critical fields
    const missingName = cards.filter(c => !c.name).map(c => c.id);
    const missingImage = cards.filter(c => !c.image).map(c => c.id);
    const missingType = cards.filter(c => !c.type).map(c => c.id);

    console.log('\n--- Missing Fields ---');
    if (missingName.length > 0) {
        console.log('Cards missing name:', missingName.slice(0, 10).join(', '));
    } else {
        console.log('✓ All cards have names');
    }

    if (missingImage.length > 0) {
        console.log('Cards missing image:', missingImage.slice(0, 10).join(', '));
    } else {
        console.log('✓ All cards have images');
    }

    if (missingType.length > 0) {
        console.log('Cards missing type:', missingType.slice(0, 10).join(', '));
    } else {
        console.log('✓ All cards have types');
    }

    console.log('\n=== Verification Complete ===');
    console.log(`Success rate: ${(withNames.length / cards.length * 100).toFixed(1)}%`);

} catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
}
