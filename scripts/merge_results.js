#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node merge_results.js <original_file> <retry_file> [output_file]');
    console.error('\nExample:');
    console.error('  node merge_results.js results/trainer_cards_full_*_details.json results/trainer_cards_retry_*_details.json results/trainer_cards_complete.json');
    process.exit(1);
}

const originalFile = args[0];
const retryFile = args[1];
const outputFile = args[2] || 'results/merged_cards.json';

console.log('=== Pokemon TCG Results Merger ===\n');

try {
    // Load both files
    console.log(`Loading original file: ${originalFile}`);
    const original = JSON.parse(fs.readFileSync(originalFile, 'utf8'));

    console.log(`Loading retry file: ${retryFile}`);
    const retry = JSON.parse(fs.readFileSync(retryFile, 'utf8'));

    console.log(`\nOriginal file: ${original.length} cards`);
    console.log(`Retry file: ${retry.length} cards`);

    // Create a map of retry results by ID for quick lookup
    const retryMap = new Map();
    retry.forEach(card => {
        if (card.id && card.name) {
            retryMap.set(card.id, card);
        }
    });

    console.log(`\nRetry successful cards: ${retryMap.size}`);

    // Merge: Replace failed cards (no name) with retry results
    let merged = original.map(card => {
        if (!card.name && retryMap.has(card.id)) {
            // Replace failed card with successful retry
            return retryMap.get(card.id);
        }
        return card;
    });

    // Count results
    const successful = merged.filter(c => c.name).length;
    const failed = merged.filter(c => !c.name).length;

    console.log('\n=== Merge Results ===');
    console.log(`Total cards: ${merged.length}`);
    console.log(`Successful (with data): ${successful}`);
    console.log(`Still failed (no data): ${failed}`);

    // Save merged results
    fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2));
    console.log(`\n✓ Saved merged results to: ${outputFile}`);

    // If there are still failures, save them
    if (failed > 0) {
        const stillFailed = merged.filter(c => !c.name);
        const failedFile = outputFile.replace('.json', '_still_failed.json');
        fs.writeFileSync(failedFile, JSON.stringify(stillFailed, null, 2));
        console.log(`⚠ Saved ${failed} still-failed cards to: ${failedFile}`);
    }

    console.log('\n=== Summary ===');
    console.log(`Success rate: ${((successful / merged.length) * 100).toFixed(1)}%`);

} catch (err) {
    console.error('\n✗ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
}
