# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Run Your First Scrape

```bash
# Use one of the pre-made configs
node scrape_cards.js configs/sv10_trainers_sample.json
```

## 3. Check Results

```bash
# View what was scraped
ls -lh results/

# Check progress (if scraper is running)
./check_progress.sh
```

## 4. View Results

All results are in the `results/` folder with timestamps:
- `*_urls.json` - List of card URLs and IDs
- `*_details.json` - Full card data
- `*_summary.json` - Summary of the scrape

## 5. Create Your Own Search

Create a config file in `configs/`:

```json
{
  "name": "my_search",
  "description": "What I'm looking for",
  "query": {
    "cardName": "pikachu",
    "sort": "number"
  },
  "scrapeDetails": false,
  "sampleSize": 10
}
```

Then run:
```bash
node scrape_cards.js configs/my_search.json
```

## Common Queries

### Search by name:
```json
{
  "name": "pikachu_cards",
  "query": { "cardName": "pikachu" },
  "scrapeDetails": false
}
```

### Get trainers from a specific set:
```json
{
  "name": "sv10_trainers",
  "query": {
    "Trainer": "on",
    "sv10": "on"
  }
}
```

### Get all details (slow!):
```json
{
  "name": "detailed_search",
  "query": { "cardName": "charizard" },
  "scrapeAll": true
}
```

## Progress Monitoring

While scraper is running:
```bash
./check_progress.sh
```

To run in background and watch logs:
```bash
node scrape_cards.js configs/my_config.json > scraper.log 2>&1 &
tail -f scraper.log
```

## Tips

- Start with `scrapeDetails: false` to get URLs quickly
- Use `sampleSize` to test before scraping all details
- Results auto-save every 10 cards
- Check `results/` folder for timestamped outputs
- Use `./check_progress.sh` to monitor running scrapers

## Example Workflow

1. Get all card URLs (fast):
   ```bash
   node scrape_cards.js configs/sv_trainers_full.json
   ```

2. Check how many cards found:
   ```bash
   ./check_progress.sh
   ```

3. If you want details, update config and run again:
   ```json
   {
     "scrapeAll": true
   }
   ```

## Need Help?

See [UPDATED_README.md](UPDATED_README.md) for complete documentation.
