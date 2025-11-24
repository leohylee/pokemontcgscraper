#!/bin/bash

echo "=== Pokemon TCG Scraper Status ==="
echo

# Check metadata scraper
METADATA_PROCESS=$(ps aux | grep "scrape_from_urls" | grep -v grep)
if [ -n "$METADATA_PROCESS" ]; then
    echo "✓ Metadata scraper is running"
    echo "  $(echo "$METADATA_PROCESS" | awk '{print "PID: " $2 ", CPU: " $3 "%, MEM: " $4 "%"}')"
    echo

    # Show latest progress
    if [ -f "scraper.log" ]; then
        LATEST=$(tail -5 scraper.log | grep -E "Progress saved|Scraping" | tail -1)
        if [ -n "$LATEST" ]; then
            echo "  Latest: $LATEST"
        fi
    fi
else
    echo "✗ Metadata scraper not running"
fi

echo
echo "=== Image Downloader Status ==="
echo

# Check image downloader
IMAGE_PROCESS=$(ps aux | grep "download_images" | grep -v grep)
if [ -n "$IMAGE_PROCESS" ]; then
    echo "✓ Image downloader is running"
    echo "  $(echo "$IMAGE_PROCESS" | awk '{print "PID: " $2 ", CPU: " $3 "%, MEM: " $4 "%"}')"
    echo

    # Show latest progress
    if [ -f "image_download.log" ]; then
        LATEST=$(tail -10 image_download.log | grep "Progress:" | tail -1)
        if [ -n "$LATEST" ]; then
            echo "  $LATEST"
        fi
    fi

    # Count downloaded images
    if [ -d "images/trainers" ]; then
        IMAGE_COUNT=$(ls images/trainers/*.png 2>/dev/null | wc -l | tr -d ' ')
        echo "  Downloaded: $IMAGE_COUNT images"
    fi
else
    echo "✗ Image downloader not running"

    # Still show count if directory exists
    if [ -d "images/trainers" ]; then
        IMAGE_COUNT=$(ls images/trainers/*.png 2>/dev/null | wc -l | tr -d ' ')
        echo "  Images downloaded: $IMAGE_COUNT"
    fi
fi

echo
echo "=== Quick Commands ==="
echo "  tail -f scraper.log           - Watch metadata scraper"
echo "  tail -f image_download.log     - Watch image downloader"
echo "  ls -lh images/trainers | head  - Check downloaded images"
echo "  ./check_both.sh                - Run this status check again"
