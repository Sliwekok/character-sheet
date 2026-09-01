# Items.csv conversion report

Source rows: 2050
Excluded as mundane (rarity none/unknown): 471

## Output
- Magic items (MagicItem[]): 1219
- Magic weapons: 155 named + 1286 expanded from templates = 1441
- Magic armor/shields: 57 named + 408 expanded from templates = 465
- Generic-variant template rows expanded into concrete entries: 1694

## Skipped
- Generic-variant rows with no parseable base-item list: 10
- Generic-variant rows where NONE of their base items exist in this project's WEAPONS/ARMOR tables: 21
- Duplicate names dropped (kept first occurrence): 3
- Total rows skipped entirely: 33 (see skipped_rows.csv)

See skipped_rows.csv for the full list with reasons.