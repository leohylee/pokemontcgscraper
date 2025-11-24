#!/bin/bash

# Check if scraper is running
echo "=== Pokemon TCG Scraper Status ==="
echo

PROCESS=$(ps aux | grep "node.*scrape_cards.js\|node.*example_full_trainer_query.js" | grep -v grep)

if [ -z "$PROCESS" ]; then
    echo "✗ No scraper process is currently running"
    echo
else
    echo "✓ Scraper is running:"
    echo "$PROCESS" | awk '{print "  PID: " $2 ", CPU: " $3 "%, MEM: " $4 "%"}'
    echo
fi

# Check results folder
echo "=== Recent Results ==="
echo
if [ -d "results" ]; then
    echo "Latest files in results folder:"
    ls -lht results/ | head -6
    echo

    # Count cards in latest URL file
    LATEST_URL_FILE=$(ls -t results/*_urls.json 2>/dev/null | head -1)
    if [ -n "$LATEST_URL_FILE" ]; then
        CARD_COUNT=$(grep -o '"id"' "$LATEST_URL_FILE" | wc -l | tr -d ' ')
        echo "Latest scrape found: $CARD_COUNT cards"
        echo "File: $(basename "$LATEST_URL_FILE")"
        echo
    fi

    # Check if details file exists
    LATEST_DETAILS_FILE=$(ls -t results/*_details.json 2>/dev/null | head -1)
    if [ -n "$LATEST_DETAILS_FILE" ]; then
        DETAILS_COUNT=$(grep -o '"id"' "$LATEST_DETAILS_FILE" | wc -l | tr -d ' ')
        echo "Detailed cards scraped: $DETAILS_COUNT"
        echo "File: $(basename "$LATEST_DETAILS_FILE")"
        echo
    fi
else
    echo "No results folder found"
    echo
fi

echo "=== Available Commands ==="
echo "  ./check_progress.sh          - Check scraper status"
echo "  tail -f scraper.log           - Watch live progress (if using log file)"
echo "  ps aux | grep node            - Check all node processes"
echo "  kill <PID>                    - Stop scraper by process ID"
