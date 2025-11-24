# Pokemon TCG Scraper - Fixed & Updated (2025)

## What Was Fixed

The original Pokemon TCG scraper (from 2016) no longer works because:
1. Pokemon.com implemented aggressive bot detection (Imperva/Incapsula)
2. The website structure changed since 2016
3. The old `request-promise` library is deprecated

## Solution

The scraper has been completely rewritten using **Puppeteer with stealth plugins** to bypass bot detection by using a real headless Chrome browser instead of simple HTTP requests.

## Installation

```bash
npm install
```

This will install all required dependencies including:
- `puppeteer` - Headless Chrome browser
- `puppeteer-extra` & `puppeteer-extra-plugin-stealth` - Bot detection bypass
- `cheerio` - HTML parsing
- `axios` - HTTP client (for non-browser requests)
- Original dependencies (lodash, trim, capitalize, etc.)

## Step-by-Step Usage Guide

### Workflow 1: Quick Search (Get Card URLs Only)

**Use Case**: You want to find all cards matching criteria and get their URLs quickly.

```bash
# Step 1: Use or create a config file
# Example: configs/sv_trainers_full.json

# Step 2: Run the scraper (fast, URLs only)
node scrape_cards.js configs/sv_trainers_full.json

# Step 3: Check results
ls -lh results/
# You'll find: {name}_{timestamp}_urls.json
```

**Time**: 3-5 minutes for most searches

---

### Workflow 2: Get Full Card Details from URLs

**Use Case**: You have a URL list and want complete metadata and images for all cards.

```bash
# Step 1: You have a URLs file (e.g., from Workflow 1)
# Example: results/trainer_cards_urls.json

# Step 2: Scrape all card details
node scrape_from_urls.js results/trainer_cards_urls.json output_name

# Step 3: Monitor progress (in another terminal)
tail -f scraper.log

# Step 4: Check completion
ls -lh results/
# You'll find: output_name_{timestamp}_details.json
```

**Time**: ~7 seconds per card (e.g., 483 cards = ~56 minutes)

**What you get**: Complete card data with image URLs

---

### Workflow 3: All-in-One (Search + Details)

**Use Case**: Search and get full details in one go (slower).

```bash
# Step 1: Create config with scrapeAll: true
cat > configs/my_detailed_search.json << 'EOF'
{
  "name": "pikachu_detailed",
  "query": { "cardName": "pikachu" },
  "scrapeAll": true
}
EOF

# Step 2: Run scraper
node scrape_cards.js configs/my_detailed_search.json

# Step 3: Check results
ls -lh results/
```

**Time**: Depends on number of cards found

---

### Workflow 4: Download Card Images

**Use Case**: Download actual image files (PNG) from a URLs list.

```bash
# Step 1: You have a URLs file with image URLs
# Example: results/trainer_cards_urls.json

# Step 2: Download all images (parallel, 5 at a time)
node download_images.js results/trainer_cards_urls.json images/trainers

# Step 3: Monitor progress (in another terminal)
tail -f image_download.log

# Step 4: Check downloaded images
ls -lh images/trainers/
```

**Time**: Very fast! ~55 seconds for 483 images (5 concurrent downloads)

**What you get**: PNG files named by card ID (e.g., `sv10_161.png`)

---

### Workflow 5: Test with Small Sample

**Use Case**: Test your search before committing to a long scrape.

```bash
# Step 1: Create config with small sampleSize
cat > configs/test_search.json << 'EOF'
{
  "name": "test_run",
  "query": { "cardName": "charizard" },
  "scrapeDetails": true,
  "sampleSize": 5
}
EOF

# Step 2: Run quick test
node scrape_cards.js configs/test_search.json

# Step 3: Review results
cat results/test_run_*_details.json
```

**Time**: 1-2 minutes

---

## Config File Reference

Create a JSON file in `configs/` directory:

```json
{
  "name": "search_name",
  "description": "Optional description",
  "query": {
    "cardName": "pikachu",
    "Trainer": "on",
    "sv10": "on"
  },
  "scrapeDetails": false,
  "sampleSize": 10,
  "scrapeAll": false
}
```

**Config Options:**
- `name` (required): Output file name prefix
- `description` (optional): What this search is for
- `query` (required): Search parameters (see Query Parameters below)
- `scrapeDetails` (optional): `true` = get details, `false` = URLs only (default: false)
- `sampleSize` (optional): Number of cards to detail scrape (default: 10)
- `scrapeAll` (optional): `true` = scrape ALL found cards (overrides sampleSize)

---

## Query Parameters Reference

Common search parameters:

```javascript
{
  // Text search
  "cardName": "charizard",       // Search by name
  "cardText": "draw",             // Search in card text

  // Card types
  "Trainer": "on",                // All trainers
  "Supporter": "on",              // Supporter cards only
  "Stadium": "on",                // Stadium cards only
  "Trainer [Pokémon Tool]": "on", // Pokemon Tool cards

  // Scarlet & Violet Sets
  "sv10": "on",    // Destined Rivals
  "sv09": "on",    // Prismatic Evolutions
  "sv08": "on",    // Surging Sparks
  "sv07": "on",    // Stellar Crown
  "sv06": "on",    // Twilight Masquerade
  "sv05": "on",    // Temporal Forces
  "sv04": "on",    // Paradox Rift
  "sv03": "on",    // Obsidian Flames
  "sv02": "on",    // Paldea Evolved
  "sv01": "on",    // Scarlet & Violet
  "svp": "on",     // SV Promo cards

  // Sorting
  "sort": "number"  // Sort by card number
}
```

---

## Monitoring Progress

### Check if scraper is running:
```bash
./scripts/check_progress.sh      # Single scraper
./scripts/check_both.sh           # Both metadata & image scrapers
```

### Watch live progress:
```bash
tail -f scraper.log               # Metadata scraper
tail -f image_download.log        # Image downloader
tail -f sv_pokemon_scrape.log     # Pokemon cards scraper
```

### Check latest results:
```bash
ls -lht results/ | head -10
```

### Stop a running scraper:
```bash
# Find process
ps aux | grep "node.*scrape"

# Kill it (replace <PID>)
kill <PID>
```

**Note**: Progress auto-saves every 10 cards!

---

## Output Files Explained

All outputs go to `results/` folder with timestamps:

### 1. URLs File (`*_urls.json`)
```json
[
  {
    "url": "https://www.pokemon.com/...",
    "image": "https://assets.pokemon.com/.../SV10_EN_161.png",
    "id": "sv10/161"
  }
]
```
**Use**: Quick reference, input for detailed scraping

### 2. Details File (`*_details.json`)
```json
[
  {
    "id": "sv10/161",
    "name": "Arven's Sandwich",
    "image": "https://assets.pokemon.com/.../SV10_EN_161.png",
    "type": "Trainer-Item",
    "superType": "Trainer",
    "text": "Heal 30 damage from your Active Pokémon...",
    "set": {
      "name": "Destined Rivals",
      "url": "https://www.pokemon.com/..."
    }
  }
]
```
**Use**: Complete card database with metadata

### 3. Summary File (`*_summary.json`)
```json
{
  "name": "search_name",
  "timestamp": "2025-11-23T19:35:05.000Z",
  "totalCards": 483,
  "detailedCards": 483,
  "files": {
    "urls": "search_name_*_urls.json",
    "details": "search_name_*_details.json"
  }
}
```
**Use**: Quick stats about the scrape

---

## Common Use Cases

### 1. Get All Trainer Cards from Latest Set (with Images)
```bash
# Create config
cat > configs/latest_trainers.json << 'EOF'
{
  "name": "sv10_trainers",
  "query": {
    "Trainer": "on",
    "sv10": "on"
  }
}
EOF

# Run scraper
node scrape_cards.js configs/latest_trainers.json

# Get full details
node scrape_from_urls.js results/sv10_trainers_*_urls.json sv10_trainers_full

# Download all images
node download_images.js results/sv10_trainers_*_urls.json images/sv10_trainers
```

### 2. Find All Cards with Specific Name
```bash
cat > configs/find_card.json << 'EOF'
{
  "name": "pikachu_search",
  "query": { "cardName": "pikachu" },
  "scrapeAll": true
}
EOF

node scrape_cards.js configs/find_card.json
```

### 3. Get Sample of Supporter Cards
```bash
cat > configs/supporters_sample.json << 'EOF'
{
  "name": "supporters",
  "query": { "Supporter": "on" },
  "sampleSize": 20
}
EOF

node scrape_cards.js configs/supporters_sample.json
```

---

## Example Configs Included

Pre-made configs in `configs/` folder:

1. **`sv_trainers_full.json`** - All SV trainer cards (all types)
2. **`charizard_all_details.json`** - All Charizard cards with full details
3. **`sv10_trainers_sample.json`** - Small sample from one set

Use as-is or as templates for your own searches.

---

## Card Data Structure

### Pokemon Cards
```json
{
  "id": "bw7/31",
  "name": "Blastoise",
  "image": "https://assets.pokemon.com/...",
  "type": "Stage 2 Pokémon",
  "superType": "Pokémon",
  "evolvesFrom": "Wartortle",
  "hp": 140,
  "passive": {
    "name": "Deluge",
    "text": "As often as you like..."
  },
  "abilities": [
    {
      "cost": ["Colorless", "Colorless"],
      "name": "Hydro Pump",
      "damage": "60+",
      "text": "Does 10 more damage..."
    }
  ],
  "color": "Water",
  "weaknesses": [{"type": "Grass", "value": "×2"}],
  "resistances": [],
  "retreatCost": 4,
  "set": {
    "name": "Black & White—Boundaries Crossed",
    "url": "https://www.pokemon.com/..."
  }
}
```

### Trainer/Energy Cards
```json
{
  "id": "sv10/161",
  "name": "Arven's Sandwich",
  "image": "https://assets.pokemon.com/...",
  "type": "Trainer-Item",
  "superType": "Trainer",
  "text": "Heal 30 damage from your Active Pokémon...",
  "set": {
    "name": "Destined Rivals",
    "url": "https://www.pokemon.com/..."
  }
}
```

---

## Advanced: Programmatic Usage

```javascript
const scraper = require('./index.js');

async function example() {
    try {
        // Search for cards (URLs only - fast)
        const cards = await scraper.scrapeAll(
            { cardName: "charizard" },
            false  // false = URLs only
        );
        console.log(`Found ${cards.length} cards`);

        // Scrape a single card's details
        const card = await scraper.scrapeCard(cards[0].url);
        console.log(card);

    } finally {
        await scraper.closeBrowser(); // Always close!
    }
}
```

### API Reference

**`scrapeAll(query, scrapeDetails)`**
- `query`: Object with search parameters
- `scrapeDetails`: Boolean (true = get details, false = URLs only)
- Returns: Promise<Array> of card objects

**`scrapeCard(url)`**
- `url`: String - full URL to card page
- Returns: Promise<Object> with card details

**`closeBrowser()`**
- Closes Puppeteer browser
- Returns: Promise<void>
- **Always call when done!**

---

## Troubleshooting

### Bot Detection Still Triggers
- Increase delays in `index.js` (lines 77, 85)
- The stealth plugin handles most cases

### Browser Won't Launch
- Ensure Chrome/Chromium is installed
- Try `headless: false` to see browser window

### Out of Memory
- Results auto-save every 10 cards
- Stop and resume from URLs file

### Scraper Stopped
```bash
# Check if running
ps aux | grep node

# View last error
tail -50 scraper.log
```

### Need to Resume or Merge Failed Cards

**To retry failed cards:**
```bash
# The merge script will automatically find and merge results
./scripts/auto_merge_trainer_cards.sh
```

**Manual method - Create new URLs file with remaining cards:**
```javascript
// In node REPL or save as a .js file
const fs = require('fs');
const all = JSON.parse(fs.readFileSync('results/original_urls.json'));
const done = JSON.parse(fs.readFileSync('results/partial_details.json'));
const remaining = all.slice(done.length);
fs.writeFileSync('results/remaining_urls.json', JSON.stringify(remaining, null, 2));
```

Then run:
```bash
node scrape_from_urls.js results/remaining_urls.json resumed_scrape
```

**To merge results from retry:**
```bash
node scripts/merge_results.js <original_file> <retry_file> <output_file>
```

---

## Image Downloader

The `download_images.js` script downloads actual image files (PNG) from card URLs.

### Features
- **Parallel downloads**: 5 images at a time (configurable)
- **Skip existing files**: Won't re-download
- **Progress tracking**: Shows real-time progress
- **Error handling**: Continues on failures, logs errors
- **Fast**: ~0.1 seconds per image on average

### Usage

```bash
# Basic usage
node download_images.js <json_file> [output_dir]

# Examples
node download_images.js results/trainer_cards_urls.json
node download_images.js results/pokemon_cards_urls.json images/pokemon

# Run in background
node download_images.js results/cards.json images/cards > download.log 2>&1 &

# Monitor progress
tail -f download.log
```

### Configuration

Edit `MAX_CONCURRENT` in [download_images.js](download_images.js:9) to change parallel downloads:
```javascript
const MAX_CONCURRENT = 5; // Download 5 images at a time
```

### Output

Images are saved with card ID as filename:
```
images/trainers/
  sv10_161.png
  sv10_162.png
  sv09_123.png
  ...
```

### Performance

Real-world example (483 trainer cards):
- **Time**: 55 seconds
- **Success rate**: 100% (483/483)
- **Speed**: ~0.11s per image
- **Concurrent downloads**: 5

### Error Handling

If downloads fail:
1. Check `download_errors.json` in output directory
2. Contains failed URLs and error messages
3. Re-run the script - it skips existing files

---

## Performance Notes

- **URL scraping**: 3-5 minutes for most searches
- **Detail scraping**: ~7 seconds per card
  - 100 cards = ~12 minutes
  - 500 cards = ~60 minutes
- **Image downloading**: ~0.1 seconds per image (parallel)
  - 500 images = ~1 minute
- **Memory usage**: ~200MB for browser
- **Disk space**:
  - ~1-2KB per card in JSON
  - ~150KB per card image (PNG)

---

## Tips & Best Practices

1. **Always start with URLs only** (`scrapeDetails: false`)
2. **Test with small samples** before full scrapes
3. **Monitor with** `tail -f scraper.log` or `./check_both.sh`
4. **Progress auto-saves** every 10 cards
5. **Run long scrapes overnight** or in screen/tmux
6. **Keep results folder** - timestamped, won't overwrite
7. **Download images in parallel** - they don't interfere with metadata scraping
8. **Check disk space** before downloading thousands of images (~150KB each)

---

## Project Structure

```
pokemontcgscraper/
├── index.js                    # Main scraper (Puppeteer-based)
├── scrape_cards.js             # Config-based CLI tool
├── scrape_from_urls.js         # Scrape from URL lists
├── download_images.js          # Parallel image downloader
├── readme.md                   # This file (complete guide)
│
├── scripts/                    # Utility scripts
│   ├── check_progress.sh       # Monitor metadata scraper
│   ├── check_both.sh           # Monitor both scrapers
│   ├── merge_results.js        # Merge failed retry results
│   └── auto_merge_trainer_cards.sh  # Auto-merge helper
│
├── configs/                    # Search configurations
│   ├── sv_trainers_full.json   # All SV trainer cards
│   ├── sv_all_pokemon.json     # All SV Pokemon cards
│   └── ...                     # Your custom configs
│
├── results/                    # Scraping outputs (auto-created)
│   ├── *_urls.json             # Card URLs
│   ├── *_details.json          # Card metadata
│   └── *_summary.json          # Scrape summaries
│
├── images/                     # Downloaded images (auto-created)
│   ├── trainers/               # Trainer card images
│   └── pokemon/                # Pokemon card images
│
└── legacy/                     # Deprecated files
    ├── index_old.js            # Original 2016 scraper
    ├── test*.js                # Old test files
    └── readme_deprecated.md    # Original README
```

---

## License

ISC (original license maintained)

## Credits

- Original scraper by TMiguelT (2016)
- Updated and fixed by Claude Code (2025)
