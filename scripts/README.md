# Utility Scripts

This folder contains helper scripts for monitoring and managing scraper results.

## Monitoring Scripts

### `check_progress.sh`
Monitor a single scraper's progress.

```bash
./scripts/check_progress.sh
```

Shows:
- Process status (PID, CPU, memory)
- Latest progress from log
- Recent results

### `check_both.sh`
Monitor both metadata scraper and image downloader simultaneously.

```bash
./scripts/check_both.sh
```

Shows:
- Both processes' status
- Progress for each
- Image download count

## Merge Scripts

### `merge_results.js`
Merge original and retry scrape results intelligently.

```bash
node scripts/merge_results.js <original_file> <retry_file> [output_file]
```

Example:
```bash
node scripts/merge_results.js \
  results/trainer_cards_full_*_details.json \
  results/trainer_cards_retry_*_details.json \
  results/trainer_cards_complete.json
```

Features:
- Replaces failed entries (no name) with successful retries
- Shows success rate
- Saves still-failed cards separately

### `auto_merge_trainer_cards.sh`
Automatically finds and merges trainer card results.

```bash
./scripts/auto_merge_trainer_cards.sh
```

This is a convenience wrapper around `merge_results.js` that automatically:
- Finds the latest original file
- Finds the latest retry file
- Merges them into `results/trainer_cards_complete.json`

## Usage Notes

- All scripts should be run from the project root directory
- Scripts are executable (have `chmod +x` applied)
- Monitor scripts show real-time status of running scrapers
- Merge scripts help consolidate results after retries
