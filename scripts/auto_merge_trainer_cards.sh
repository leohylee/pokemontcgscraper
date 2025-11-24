#!/bin/bash

echo "=== Auto Merge Trainer Cards ==="
echo

# Find the files
ORIGINAL=$(ls -t results/trainer_cards_full_*_details.json | head -1)
RETRY=$(ls -t results/trainer_cards_retry_*_details.json 2>/dev/null | head -1)

if [ -z "$ORIGINAL" ]; then
    echo "✗ Error: Original file not found"
    exit 1
fi

if [ -z "$RETRY" ]; then
    echo "✗ Error: Retry file not found"
    echo "Make sure the retry scraper has completed"
    exit 1
fi

echo "Original file: $ORIGINAL"
echo "Retry file:    $RETRY"
echo

# Run merge (script is in scripts/ folder)
node scripts/merge_results.js "$ORIGINAL" "$RETRY" results/trainer_cards_complete.json

echo
echo "Done! Check results/trainer_cards_complete.json"
