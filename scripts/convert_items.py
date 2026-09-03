#!/usr/bin/env python3
"""
Convert a 5etools-style Items.csv export into the characterSheet app's
MagicItem / Weapon / Armor TypeScript shapes.

Usage (run from the project root):
    python3 scripts/convert_items.py [path/to/Items.csv] [output_dir]

Defaults:
    Items.csv   -> src/data/Items.csv
    output_dir  -> src/data/magicItems/generated

Re-run this any time src/data/Items.csv is updated (e.g. a newer 5etools
export) to refresh the three generated files below - it fully overwrites
its own output directory, so nothing here needs hand-editing.

Produces, inside output_dir:
    GeneratedMagicItems.ts    (MagicItem[]  - wondrous items, rings, rods,
                                staves, wands, potions, scrolls, ammunition,
                                and anything else that isn't a weapon/armor)
    GeneratedMagicWeapons.ts  (Weapon[]     - magic weapons, both named
                                items with their own stats and "+N Weapon"/
                                "Flame Tongue"/etc. templates expanded per
                                base weapon)
    GeneratedMagicArmor.ts    (Armor[]      - magic armor & shields, same
                                two flavors as weapons above)
    conversion_report.md      (what was included/excluded/skipped and why -
                                read this after every run)
    skipped_rows.csv          (every CSV row that didn't make it into any
                                output, with a reason column, for manual
                                review)

Design decisions (see conversion_report.md's header for the live summary):
  - Rows with Rarity "none" or "unknown" are mundane gear (adventuring
    gear, trade goods, poisons, mounts, vehicles, food...) and are excluded
    entirely - they aren't magic items.
  - Rows with Rarity "unknown (magic)" ARE magic items whose rarity just
    isn't specified in the source; they're kept and mapped to "varies".
  - A row typed as a concrete weapon/armor (its own Damage/Properties/
    Weight columns are populated, e.g. "Axe of the Dwarvish Lords") is
    converted directly into a standalone Weapon/Armor object built from
    those columns - no lookup against the base equipment table needed.
  - A "Generic Variant" row (e.g. "+1 Weapon", "Flame Tongue", "Mithral
    Armor") is a TEMPLATE: its own stat columns are empty, and its Text
    field lists which base items it can apply to. These are expanded into
    one concrete entry per base item, but ONLY for base items that exist
    in this project's own WEAPONS/ARMOR tables (data/weapons/Weapons.ts,
    data/armor/Armor.ts) - stats are inherited from that base entry plus
    the magic bonus/description layered on top, mirroring what
    utils/customMagicItems.ts's enchantWeapon/enchantArmor do by hand.
    Exotic base items with no equivalent in this project (sci-fi guns,
    other settings' weapons, etc.) are skipped for that expansion, not
    invented.
  - Category for non-equipment magic items is read off the CSV's Type
    column with this priority: ring > rod > staff > wand > potion >
    scroll > armor/shield > weapon > ammunition > wondrous item > other.
    Staffs and rods that are ALSO usable as a weapon stay categorized as
    "staff"/"rod" MagicItems, matching this project's interface (which
    models staves/rods/wands/rings as MagicItem, never as Weapon), not as
    weapons.
  - A MagicItem (never a weapon/armor row - those already carry their own
    `bonus` field) gets a `bonuses` field when its rules text contains an
    unconditional "+N bonus to AC" (skipped if a nearby phrase like "while
    wearing no armor" suggests it's conditional - see Bracers of Defense)
    or "+N bonus to attack and/or damage rolls" (skipped for "spell attack
    rolls" - there's no hook for those). See parse_item_bonuses() - this is
    a conservative regex match, not a rules parser, so plenty of items with
    real mechanical effects (resistances, extra actions, ability score
    increases, ...) still end up with no `bonuses` at all, same as before.
"""

import csv
import json
import re
import sys
from pathlib import Path

# --------------------------------------------------------------------------
# This project's own base equipment tables (from src/data/weapons/Weapons.ts
# and src/data/armor/Armor.ts), transcribed here so generic-variant rows can
# be expanded by inheriting real stats. Keep this in sync if those files
# change materially.
# --------------------------------------------------------------------------

WEAPONS = {
    "Club": {"category": "simple", "type": "melee", "damage": {"dice": "1d4", "type": "bludgeoning"}, "properties": ["light"], "weight": 2, "cost": "1 sp", "mastery": "Slow"},
    "Dagger": {"category": "simple", "type": "melee", "damage": {"dice": "1d4", "type": "piercing"}, "properties": ["finesse", "light", "thrown"], "weight": 1, "cost": "2 gp", "mastery": "Nick"},
    "Greatclub": {"category": "simple", "type": "melee", "damage": {"dice": "1d8", "type": "bludgeoning"}, "properties": ["two-handed"], "weight": 10, "cost": "2 sp", "mastery": "Push"},
    "Handaxe": {"category": "simple", "type": "melee", "damage": {"dice": "1d6", "type": "slashing"}, "properties": ["light", "thrown"], "weight": 2, "cost": "5 gp", "mastery": "Vex"},
    "Javelin": {"category": "simple", "type": "melee", "damage": {"dice": "1d6", "type": "piercing"}, "properties": ["thrown"], "weight": 2, "cost": "5 sp", "mastery": "Slow"},
    "Light Hammer": {"category": "simple", "type": "melee", "damage": {"dice": "1d4", "type": "bludgeoning"}, "properties": ["light", "thrown"], "weight": 2, "cost": "2 gp", "mastery": "Nick"},
    "Mace": {"category": "simple", "type": "melee", "damage": {"dice": "1d6", "type": "bludgeoning"}, "properties": [], "weight": 4, "cost": "5 gp", "mastery": "Sap"},
    "Quarterstaff": {"category": "simple", "type": "melee", "damage": {"dice": "1d6", "type": "bludgeoning"}, "versatileDamage": "1d8", "properties": ["versatile"], "weight": 4, "cost": "2 sp", "mastery": "Topple"},
    "Sickle": {"category": "simple", "type": "melee", "damage": {"dice": "1d4", "type": "slashing"}, "properties": ["light"], "weight": 2, "cost": "1 gp", "mastery": "Nick"},
    "Spear": {"category": "simple", "type": "melee", "damage": {"dice": "1d6", "type": "piercing"}, "versatileDamage": "1d8", "properties": ["thrown", "versatile"], "weight": 3, "cost": "1 gp", "mastery": "Sap"},
    "Light Crossbow": {"category": "simple", "type": "ranged", "damage": {"dice": "1d8", "type": "piercing"}, "properties": ["ammunition", "loading", "two-handed"], "weight": 5, "cost": "25 gp", "mastery": "Slow"},
    "Dart": {"category": "simple", "type": "ranged", "damage": {"dice": "1d4", "type": "piercing"}, "properties": ["finesse", "thrown"], "weight": 0.25, "cost": "5 cp", "mastery": "Vex"},
    "Sling": {"category": "simple", "type": "ranged", "damage": {"dice": "1d4", "type": "bludgeoning"}, "properties": ["ammunition"], "weight": 0, "cost": "1 sp", "mastery": "Slow"},
    "Shortbow": {"category": "simple", "type": "ranged", "damage": {"dice": "1d6", "type": "piercing"}, "properties": ["ammunition", "two-handed"], "weight": 2, "cost": "25 gp", "mastery": "Vex"},
    "Battleaxe": {"category": "martial", "type": "melee", "damage": {"dice": "1d8", "type": "slashing"}, "versatileDamage": "1d10", "properties": ["versatile"], "weight": 4, "cost": "10 gp", "mastery": "Topple"},
    "Flail": {"category": "martial", "type": "melee", "damage": {"dice": "1d8", "type": "bludgeoning"}, "properties": [], "weight": 2, "cost": "10 gp", "mastery": "Sap"},
    "Glaive": {"category": "martial", "type": "melee", "damage": {"dice": "1d10", "type": "slashing"}, "properties": ["heavy", "reach", "two-handed"], "weight": 6, "cost": "20 gp", "mastery": "Graze"},
    "Greataxe": {"category": "martial", "type": "melee", "damage": {"dice": "1d12", "type": "slashing"}, "properties": ["heavy", "two-handed"], "weight": 7, "cost": "30 gp", "mastery": "Cleave"},
    "Greatsword": {"category": "martial", "type": "melee", "damage": {"dice": "2d6", "type": "slashing"}, "properties": ["heavy", "two-handed"], "weight": 6, "cost": "50 gp", "mastery": "Graze"},
    "Halberd": {"category": "martial", "type": "melee", "damage": {"dice": "1d10", "type": "slashing"}, "properties": ["heavy", "reach", "two-handed"], "weight": 6, "cost": "20 gp", "mastery": "Cleave"},
    "Lance": {"category": "martial", "type": "melee", "damage": {"dice": "1d12", "type": "piercing"}, "properties": ["reach"], "weight": 6, "cost": "10 gp", "mastery": "Topple"},
    "Longsword": {"category": "martial", "type": "melee", "damage": {"dice": "1d8", "type": "slashing"}, "versatileDamage": "1d10", "properties": ["versatile"], "weight": 3, "cost": "15 gp", "mastery": "Sap"},
    "Maul": {"category": "martial", "type": "melee", "damage": {"dice": "2d6", "type": "bludgeoning"}, "properties": ["heavy", "two-handed"], "weight": 10, "cost": "10 gp", "mastery": "Topple"},
    "Morningstar": {"category": "martial", "type": "melee", "damage": {"dice": "1d8", "type": "piercing"}, "properties": [], "weight": 4, "cost": "15 gp", "mastery": "Sap"},
    "Pike": {"category": "martial", "type": "melee", "damage": {"dice": "1d10", "type": "piercing"}, "properties": ["heavy", "reach", "two-handed"], "weight": 18, "cost": "5 gp", "mastery": "Push"},
    "Rapier": {"category": "martial", "type": "melee", "damage": {"dice": "1d8", "type": "piercing"}, "properties": ["finesse"], "weight": 2, "cost": "25 gp", "mastery": "Vex"},
    "Scimitar": {"category": "martial", "type": "melee", "damage": {"dice": "1d6", "type": "slashing"}, "properties": ["finesse", "light"], "weight": 3, "cost": "25 gp", "mastery": "Nick"},
    "Shortsword": {"category": "martial", "type": "melee", "damage": {"dice": "1d6", "type": "piercing"}, "properties": ["finesse", "light"], "weight": 2, "cost": "10 gp", "mastery": "Vex"},
    "Trident": {"category": "martial", "type": "melee", "damage": {"dice": "1d6", "type": "piercing"}, "versatileDamage": "1d8", "properties": ["thrown", "versatile"], "weight": 4, "cost": "5 gp", "mastery": "Topple"},
    "War Pick": {"category": "martial", "type": "melee", "damage": {"dice": "1d8", "type": "piercing"}, "properties": [], "weight": 2, "cost": "5 gp", "mastery": "Sap"},
    "Warhammer": {"category": "martial", "type": "melee", "damage": {"dice": "1d8", "type": "bludgeoning"}, "versatileDamage": "1d10", "properties": ["versatile"], "weight": 2, "cost": "15 gp", "mastery": "Push"},
    "Whip": {"category": "martial", "type": "melee", "damage": {"dice": "1d4", "type": "slashing"}, "properties": ["finesse", "reach"], "weight": 3, "cost": "2 gp", "mastery": "Slow"},
    "Blowgun": {"category": "martial", "type": "ranged", "damage": {"dice": "1", "type": "piercing"}, "properties": ["ammunition", "loading"], "weight": 1, "cost": "10 gp", "mastery": "Vex"},
    "Hand Crossbow": {"category": "martial", "type": "ranged", "damage": {"dice": "1d6", "type": "piercing"}, "properties": ["ammunition", "light", "loading"], "weight": 3, "cost": "75 gp", "mastery": "Vex"},
    "Heavy Crossbow": {"category": "martial", "type": "ranged", "damage": {"dice": "1d10", "type": "piercing"}, "properties": ["ammunition", "heavy", "loading", "two-handed"], "weight": 18, "cost": "50 gp", "mastery": "Push"},
    "Longbow": {"category": "martial", "type": "ranged", "damage": {"dice": "1d8", "type": "piercing"}, "properties": ["ammunition", "heavy", "two-handed"], "weight": 2, "cost": "50 gp", "mastery": "Slow"},
    "Net": {"category": "martial", "type": "ranged", "damage": {"dice": "0", "type": "none"}, "properties": ["thrown"], "weight": 3, "cost": "1 gp"},
}

ARMOR = {
    "Padded": {"category": "light", "baseAC": 11, "dexterityModifier": {"enabled": True}, "stealthDisadvantage": True, "weight": 8, "cost": "5 gp"},
    "Leather": {"category": "light", "baseAC": 11, "dexterityModifier": {"enabled": True}, "weight": 10, "cost": "10 gp"},
    "Studded Leather": {"category": "light", "baseAC": 12, "dexterityModifier": {"enabled": True}, "weight": 13, "cost": "45 gp"},
    "Hide": {"category": "medium", "baseAC": 12, "dexterityModifier": {"enabled": True, "max": 2}, "weight": 12, "cost": "10 gp"},
    "Chain Shirt": {"category": "medium", "baseAC": 13, "dexterityModifier": {"enabled": True, "max": 2}, "weight": 20, "cost": "50 gp"},
    "Scale Mail": {"category": "medium", "baseAC": 14, "dexterityModifier": {"enabled": True, "max": 2}, "stealthDisadvantage": True, "weight": 45, "cost": "50 gp"},
    "Breastplate": {"category": "medium", "baseAC": 14, "dexterityModifier": {"enabled": True, "max": 2}, "weight": 20, "cost": "400 gp"},
    "Half Plate": {"category": "medium", "baseAC": 15, "dexterityModifier": {"enabled": True, "max": 2}, "stealthDisadvantage": True, "weight": 40, "cost": "750 gp"},
    "Ring Mail": {"category": "heavy", "baseAC": 14, "dexterityModifier": {"enabled": False}, "stealthDisadvantage": True, "weight": 40, "cost": "30 gp"},
    "Chain Mail": {"category": "heavy", "baseAC": 16, "dexterityModifier": {"enabled": False}, "strengthRequirement": 13, "stealthDisadvantage": True, "weight": 55, "cost": "75 gp"},
    "Splint": {"category": "heavy", "baseAC": 17, "dexterityModifier": {"enabled": False}, "strengthRequirement": 15, "stealthDisadvantage": True, "weight": 60, "cost": "200 gp"},
    "Plate": {"category": "heavy", "baseAC": 18, "dexterityModifier": {"enabled": False}, "strengthRequirement": 15, "stealthDisadvantage": True, "weight": 65, "cost": "1500 gp"},
    "Shield": {"category": "shield", "baseAC": 2, "weight": 6, "cost": "10 gp"},
}

# CSV base-item names -> our ARMOR keys (CSV appends " Armor" to several).
ARMOR_NAME_ALIASES = {
    "Padded Armor": "Padded",
    "Leather Armor": "Leather",
    "Studded Leather Armor": "Studded Leather",
    "Hide Armor": "Hide",
    "Chain Shirt": "Chain Shirt",
    "Scale Mail": "Scale Mail",
    "Breastplate": "Breastplate",
    "Half Plate Armor": "Half Plate",
    "Ring Mail": "Ring Mail",
    "Chain Mail": "Chain Mail",
    "Splint Armor": "Splint",
    "Plate Armor": "Plate",
    "Shield": "Shield",
}

VALID_MASTERY = {"Cleave", "Graze", "Nick", "Push", "Sap", "Slow", "Topple", "Vex"}
VALID_WEAPON_PROPERTIES = {"ammunition", "finesse", "heavy", "light", "loading", "range", "reach", "thrown", "two-handed", "versatile"}
VALID_RARITY = {"common", "uncommon", "rare", "very rare", "legendary", "artifact", "varies"}

MAGIC_ITEM_CATEGORY_KEYWORDS = [
    # (keyword to search for in Type, category to assign) - checked in order
    ("Ring", "ring"),
    ("Rod", "rod"),
    ("Staff", "staff"),
    ("Wand", "wand"),
    ("Potion", "potion"),
    ("Scroll", "scroll"),
]


def norm_hyphen(s: str) -> str:
    return s.replace("‑", "-").replace("–", "-")


def parse_rarity(raw: str):
    raw = raw.strip()
    if raw in VALID_RARITY:
        return raw
    if raw in ("unknown (magic)", "unknown", "varies"):
        return "varies"
    return "varies"


def parse_attunement(raw: str):
    raw = raw.strip()
    if not raw:
        return False
    if raw == "Attunement Optional":
        return False
    if raw.startswith("Requires Attunement By "):
        rest = raw[len("Requires Attunement By "):].strip()
        # drop any trailing extra clause after a comma that isn't part of the restriction
        return f"by {rest}"
    if raw.startswith("Requires Attunement"):
        return True
    return True  # any other non-empty attunement text still means "requires attunement"


# A passive/continuous AC bonus is required to read "while wearing/holding/
# carrying/attuned to this/it" nearby - a POSITIVE requirement, not just the
# absence of a red flag. Needed because negative-keyword exclusion alone let
# through things like Quarterstaff of the Acrobat's Reaction ("...gaining a
# +5 bonus to your Armor Class against the triggering attack, potentially
# causing the attack to miss you...") - a one-attack Shield-spell-style
# bonus with none of the "no armor"/"unarmored" phrasing that would have
# flagged it, but also nothing like "while wearing this" nearby either.
_AC_CONTINUOUS = re.compile(r"while (?:you (?:are )?)?(?:wearing|holding|carrying|attuned to)\s+(?:this|it)\b", re.I)


def parse_item_bonuses(text: str):
    """
    Best-effort extraction of MagicItemBonuses (armorClass/attackRolls/
    damageRolls) from a MagicItem's (non-weapon/non-armor) rules text - e.g.
    "You gain a +1 bonus to AC and saving throws while wearing this ring"
    -> {"armorClass": 1}, "+1 bonus to attack and damage rolls made with
    this piece of magic ammunition" -> {"attackRolls": 1, "damageRolls": 1}.

    Deliberately conservative: only the exact "+N bonus to ..." phrasing the
    DMG actually uses is matched, an AC match additionally requires nearby
    "while wearing/holding/carrying this" phrasing so a one-time Reaction
    bonus (see _AC_CONTINUOUS's comment) isn't mistaken for a passive one,
    and a plain "attack rolls" match is dropped when it's really "spell
    attack rolls" (no hook for spell attack bonuses yet - see
    MagicItemBonuses' doc comment). Returns None rather than a lot of false
    positives when nothing matches cleanly.
    """
    bonuses = {}

    for m in re.finditer(r"\+(\d+) bonus to (?:your )?(?:Armor Class|AC)\b", text):
        window = text[max(0, m.start() - 20): m.end() + 140]
        if not _AC_CONTINUOUS.search(window):
            continue
        bonuses["armorClass"] = int(m.group(1))
        break

    # Covers both DMG phrasings: "+N bonus to attack and damage rolls" and
    # "+N bonus to attack rolls and damage rolls" (e.g. Rod of Lordly Might,
    # Wand of Orcus, Quarterstaff of the Acrobat all use the latter).
    m = re.search(r"\+(\d+) bonus to attack(?: rolls)? and damage rolls", text)
    if m:
        n = int(m.group(1))
        bonuses["attackRolls"] = n
        bonuses["damageRolls"] = n
    else:
        m = re.search(r"\+(\d+) bonus to (?:the )?damage rolls\b", text)
        if m:
            bonuses["damageRolls"] = int(m.group(1))
        for m in re.finditer(r"\+(\d+) bonus to attack rolls\b", text):
            preceding = text[max(0, m.start() - 12): m.start()].lower()
            if "spell " in preceding:
                continue
            bonuses["attackRolls"] = int(m.group(1))
            break

    return bonuses or None


def parse_weapon_damage(raw: str):
    raw = raw.strip()
    if not raw:
        return None
    m = re.match(r"^(\S+)\s+(.+)$", raw)
    if not m:
        return None
    dice, dtype = m.group(1), m.group(2).strip().lower()
    return {"dice": dice, "type": dtype}


def parse_weapon_properties(raw: str):
    raw = norm_hyphen(raw or "")
    properties = []
    versatile_damage = None
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        base = re.sub(r"\(.*?\)", "", part).strip().lower()
        detail_m = re.search(r"\(([^)]+)\)", part)
        if base.startswith("range"):
            base = "range"
        if base == "range":
            properties.append("range")
        elif base in VALID_WEAPON_PROPERTIES:
            properties.append(base)
            if base == "versatile" and detail_m:
                versatile_damage = detail_m.group(1).strip()
        # anything else (special/unique/vestige/psiactive/...) is flavor, not
        # a mechanical WeaponProperty tag - dropped, but still present in the
        # item's own magicDescription text.
    # de-dupe, keep order
    seen = []
    for p in properties:
        if p not in seen:
            seen.append(p)
    return seen, versatile_damage


def parse_weight(raw: str):
    raw = (raw or "").strip()
    m = re.match(r"^([\d.]+)", raw)
    if m:
        return float(m.group(1)) if "." in m.group(1) else int(m.group(1))
    return None


def parse_mastery(raw: str):
    raw = (raw or "").strip()
    if raw.startswith("Mastery:"):
        raw = raw[len("Mastery:"):].strip()
    return raw if raw in VALID_MASTERY else None


def parse_armor_damage(raw: str):
    """'AC 18' / 'AC 14 + Dex (max 2)' / 'AC 11 + Dex' / 'AC +2' (shield)."""
    raw = (raw or "").strip()
    m = re.match(r"^AC\s*\+?(\d+)", raw)
    if not m:
        return None
    base_ac = int(m.group(1))
    dex = None
    if "+ Dex" in raw or "+Dex" in raw:
        max_m = re.search(r"max\s*(\d+)", raw)
        dex = {"enabled": True}
        if max_m:
            dex["max"] = int(max_m.group(1))
    return base_ac, dex


def extract_bonus(name: str):
    m = re.search(r"\+(\d+)", name)
    return int(m.group(1)) if m else None


def clean_text(raw: str) -> str:
    return raw.strip()


def base_items_from_text(text: str):
    """Parse the 'Base items. ... following base items:\n\n X (Y)Z (W)...' block."""
    marker = "following base items:"
    idx = text.find(marker)
    if idx == -1:
        return None, text
    intro = text[:idx]
    # strip the trailing "Base items. This item variant can be applied to the"
    # boilerplate sentence (whose tail is the "following base items:" marker
    # we split on above) from the intro/description.
    intro = re.sub(r"\s*Base items\.\s*This item variant can be applied to the\s*$", "", intro).strip()
    tail = text[idx + len(marker):].strip()
    # stop at a double-newline followed by something that isn't part of the list,
    # in practice the list runs to the end of the field or to the next blank line
    # section; take up to the first double-newline gap after the list starts.
    list_block = tail.split("\n\n", 1)[0] if "\n\n" in tail else tail
    pairs = re.findall(r"([^()]+?)\s*\(([^()]+)\)", list_block)
    result = [(base.strip(), variant.strip()) for base, variant in pairs]
    return result, intro


def determine_route(type_str: str):
    """Return one of: 'ring','rod','staff','wand','potion','scroll','armor','weapon','ammunition','wondrous','generic','other'."""
    t = type_str

    for keyword, category in MAGIC_ITEM_CATEGORY_KEYWORDS:
        if re.search(rf"\b{keyword}\b", t):
            return category
    if "Armor" in t or "Shield" in t:
        return "armor"
    if "Weapon" in t:
        return "weapon"
    if "Ammunition" in t:
        return "ammunition"
    if "Wondrous Item" in t:
        return "wondrous"
    if t.strip() == "Generic Variant":
        return "generic"
    return "other"


def armor_category_from_type(type_str: str):
    if "Shield" in type_str:
        return "shield"
    if "Light Armor" in type_str:
        return "light"
    if "Medium Armor" in type_str:
        return "medium"
    if "Heavy Armor" in type_str:
        return "heavy"
    return None


def weapon_flavor_from_type(type_str: str):
    category = "martial" if "Martial Weapon" in type_str else ("simple" if "Simple Weapon" in type_str else None)
    wtype = "ranged" if "Ranged Weapon" in type_str else ("melee" if "Melee Weapon" in type_str else None)
    return category, wtype


def parenthetical_base_name(type_str: str):
    m = re.match(r"^(?:Weapon|Light Armor|Medium Armor|Heavy Armor|Shield)\s*\(([^)]+)\)", type_str)
    return m.group(1).strip() if m else None


def main():
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("src/data/Items.csv")
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("src/data/magicItems/generated")
    out_dir.mkdir(parents=True, exist_ok=True)

    with csv_path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    magic_items = []       # list of dict
    magic_weapons = []     # list of dict
    magic_armor = []       # list of dict
    skipped = []            # list of (name, source, type, rarity, reason)
    seen_item_names = set()
    seen_weapon_names = set()
    seen_armor_names = set()

    stats = {
        "total_rows": len(rows),
        "mundane_excluded": 0,
        "magic_items": 0,
        "magic_items_with_bonuses": 0,
        "magic_weapons_named": 0,
        "magic_weapons_expanded": 0,
        "magic_armor_named": 0,
        "magic_armor_expanded": 0,
        "generic_variants_expanded_entries": 0,
        "generic_variants_no_base_list": 0,
        "generic_variants_zero_matches": 0,
        "duplicate_names_dropped": 0,
    }

    for row in rows:
        name = row["Name"].strip()
        source = row["Source"].strip()
        rarity_raw = row["Rarity"].strip()
        type_str = row["Type"].strip()
        text = clean_text(row.get("Text", ""))

        if rarity_raw in ("none", "unknown"):
            stats["mundane_excluded"] += 1
            continue

        if not name:
            skipped.append((name, source, type_str, rarity_raw, "no name"))
            continue

        rarity = parse_rarity(rarity_raw)
        attunement = parse_attunement(row.get("Attunement", ""))
        route = determine_route(type_str)

        # ---- Weapon route: named item with its own stats ----
        if route == "weapon":
            damage = parse_weapon_damage(row.get("Damage", ""))
            if damage is None:
                skipped.append((name, source, type_str, rarity_raw, "weapon type but no Damage column - not a concrete item"))
                continue
            if name in seen_weapon_names:
                stats["duplicate_names_dropped"] += 1
                continue
            seen_weapon_names.add(name)
            category, wtype = weapon_flavor_from_type(type_str)
            properties, versatile_damage = parse_weapon_properties(row.get("Properties", ""))
            weight = parse_weight(row.get("Weight", ""))
            mastery = parse_mastery(row.get("Mastery", ""))
            bonus = extract_bonus(name)
            magic_weapons.append({
                "name": name,
                "category": category or "martial",
                "type": wtype or "melee",
                "damage": damage,
                "versatileDamage": versatile_damage,
                "properties": properties,
                "weight": weight if weight is not None else 0,
                "mastery": mastery,
                "bonus": bonus,
                "rarity": rarity,
                "requiresAttunement": attunement,
                "magicDescription": text,
                "_source": source,
            })
            stats["magic_weapons_named"] += 1
            continue

        # ---- Armor route: named item with its own stats ----
        if route == "armor":
            parsed = parse_armor_damage(row.get("Damage", ""))
            if parsed is None:
                skipped.append((name, source, type_str, rarity_raw, "armor type but no Damage column - not a concrete item"))
                continue
            if name in seen_armor_names:
                stats["duplicate_names_dropped"] += 1
                continue
            seen_armor_names.add(name)
            base_ac, dex = parsed
            category = armor_category_from_type(type_str) or "heavy"
            weight = parse_weight(row.get("Weight", ""))
            bonus = extract_bonus(name)
            magic_armor.append({
                "name": name,
                "category": category,
                "baseAC": base_ac,
                "dexterityModifier": dex,
                "weight": weight,
                "bonus": bonus if category != "shield" else None,
                "rarity": rarity,
                "requiresAttunement": attunement,
                "magicDescription": text,
                "_source": source,
            })
            stats["magic_armor_named"] += 1
            continue

        # ---- Ammunition (non-weapon) -> MagicItem category "ammunition" ----
        if route == "ammunition":
            if name in seen_item_names:
                stats["duplicate_names_dropped"] += 1
                continue
            seen_item_names.add(name)
            bonuses = parse_item_bonuses(text)
            magic_items.append({
                "name": name, "category": "ammunition", "rarity": rarity,
                "requiresAttunement": attunement, "description": text, "bonuses": bonuses, "_source": source,
            })
            stats["magic_items"] += 1
            if bonuses:
                stats["magic_items_with_bonuses"] += 1
            continue

        # ---- Generic variant templates: expand against our own base tables ----
        if route == "generic":
            pairs, intro = base_items_from_text(text)
            if not pairs:
                stats["generic_variants_no_base_list"] += 1
                skipped.append((name, source, type_str, rarity_raw, "generic variant with no parseable base-item list"))
                continue
            matched_any = False
            for base_name_raw, variant_name in pairs:
                base_name_raw = base_name_raw.strip()
                variant_name = variant_name.strip()
                bonus = extract_bonus(variant_name)

                armor_key = ARMOR_NAME_ALIASES.get(base_name_raw, base_name_raw if base_name_raw in ARMOR else None)
                if armor_key and armor_key in ARMOR:
                    if variant_name in seen_armor_names:
                        stats["duplicate_names_dropped"] += 1
                        continue
                    seen_armor_names.add(variant_name)
                    base = ARMOR[armor_key]
                    magic_armor.append({
                        "name": variant_name,
                        "category": base["category"],
                        "baseAC": base["baseAC"],
                        "dexterityModifier": base.get("dexterityModifier"),
                        "stealthDisadvantage": base.get("stealthDisadvantage"),
                        "strengthRequirement": base.get("strengthRequirement"),
                        "weight": base.get("weight"),
                        "cost": base.get("cost"),
                        "bonus": bonus if base["category"] != "shield" else (bonus or None),
                        "rarity": rarity,
                        "requiresAttunement": attunement,
                        "magicDescription": intro,
                        "_source": source,
                    })
                    matched_any = True
                    stats["magic_armor_expanded"] += 1
                    stats["generic_variants_expanded_entries"] += 1
                    continue

                if base_name_raw in WEAPONS:
                    if variant_name in seen_weapon_names:
                        stats["duplicate_names_dropped"] += 1
                        continue
                    seen_weapon_names.add(variant_name)
                    base = WEAPONS[base_name_raw]
                    magic_weapons.append({
                        "name": variant_name,
                        "category": base["category"],
                        "type": base["type"],
                        "damage": base["damage"],
                        "versatileDamage": base.get("versatileDamage"),
                        "properties": base.get("properties", []),
                        "weight": base.get("weight", 0),
                        "cost": base.get("cost"),
                        "mastery": base.get("mastery"),
                        "bonus": bonus,
                        "rarity": rarity,
                        "requiresAttunement": attunement,
                        "magicDescription": intro,
                        "_source": source,
                    })
                    matched_any = True
                    stats["magic_weapons_expanded"] += 1
                    stats["generic_variants_expanded_entries"] += 1
                    continue
                # base item not in our tables (exotic/other-setting gear) - skip this one pairing silently,
                # it's recorded in aggregate via generic_variants_zero_matches / the report below.

            if not matched_any:
                stats["generic_variants_zero_matches"] += 1
                skipped.append((name, source, type_str, rarity_raw, "generic variant - none of its base items exist in this project's WEAPONS/ARMOR tables"))
            continue

        # ---- Everything else: MagicItem (ring/rod/staff/wand/potion/scroll/wondrous/other) ----
        category_map = {"ring": "ring", "rod": "rod", "staff": "staff", "wand": "wand",
                         "potion": "potion", "scroll": "scroll", "wondrous": "wondrous item", "other": "other"}
        category = category_map.get(route, "other")
        if name in seen_item_names:
            stats["duplicate_names_dropped"] += 1
            continue
        seen_item_names.add(name)
        bonuses = parse_item_bonuses(text)
        magic_items.append({
            "name": name, "category": category, "rarity": rarity,
            "requiresAttunement": attunement, "description": text, "bonuses": bonuses, "_source": source,
        })
        stats["magic_items"] += 1
        if bonuses:
            stats["magic_items_with_bonuses"] += 1

    # ---------------- TypeScript emission ----------------

    def ts_str(s):
        return json.dumps(s, ensure_ascii=False)

    def ts_attunement(a):
        if a is True:
            return "true"
        if a is False:
            return "false"
        return ts_str(a)

    def emit_magic_item(item):
        lines = ["  {"]
        lines.append(f'    name: {ts_str(item["name"])},')
        lines.append(f'    category: {ts_str(item["category"])},')
        lines.append(f'    rarity: {ts_str(item["rarity"])},')
        lines.append(f'    requiresAttunement: {ts_attunement(item["requiresAttunement"])},')
        lines.append(f'    description: {ts_str(item["description"])},')
        bonuses = item.get("bonuses")
        if bonuses:
            parts = ", ".join(f'{k}: {v}' for k, v in bonuses.items())
            lines.append(f'    bonuses: {{ {parts} }},')
        lines.append("  },")
        return "\n".join(lines)

    def emit_weapon(w):
        lines = ["  {"]
        lines.append(f'    name: {ts_str(w["name"])},')
        lines.append(f'    category: {ts_str(w["category"])},')
        lines.append(f'    type: {ts_str(w["type"])},')
        lines.append(f'    damage: {{ dice: {ts_str(w["damage"]["dice"])}, type: {ts_str(w["damage"]["type"])} }},')
        if w.get("versatileDamage"):
            lines.append(f'    versatileDamage: {ts_str(w["versatileDamage"])},')
        props = ", ".join(ts_str(p) for p in w.get("properties", []))
        lines.append(f'    properties: [{props}],')
        lines.append(f'    weight: {json.dumps(w["weight"])},')
        if w.get("cost"):
            lines.append(f'    cost: {ts_str(w["cost"])},')
        if w.get("mastery"):
            lines.append(f'    mastery: {ts_str(w["mastery"])},')
        if w.get("bonus"):
            lines.append(f'    bonus: {w["bonus"]},')
        lines.append(f'    rarity: {ts_str(w["rarity"])},')
        lines.append(f'    requiresAttunement: {ts_attunement(w["requiresAttunement"])},')
        lines.append(f'    magicDescription: {ts_str(w["magicDescription"])},')
        lines.append("  },")
        return "\n".join(lines)

    def emit_armor(a):
        lines = ["  {"]
        lines.append(f'    name: {ts_str(a["name"])},')
        lines.append(f'    category: {ts_str(a["category"])},')
        lines.append(f'    baseAC: {a["baseAC"]},')
        dex = a.get("dexterityModifier")
        if dex:
            if dex.get("max") is not None:
                lines.append(f'    dexterityModifier: {{ enabled: {str(dex["enabled"]).lower()}, max: {dex["max"]} }},')
            else:
                lines.append(f'    dexterityModifier: {{ enabled: {str(dex["enabled"]).lower()} }},')
        if a.get("stealthDisadvantage"):
            lines.append("    stealthDisadvantage: true,")
        if a.get("strengthRequirement"):
            lines.append(f'    strengthRequirement: {a["strengthRequirement"]},')
        if a.get("weight") is not None:
            lines.append(f'    weight: {json.dumps(a["weight"])},')
        if a.get("cost"):
            lines.append(f'    cost: {ts_str(a["cost"])},')
        if a.get("bonus"):
            lines.append(f'    bonus: {a["bonus"]},')
        lines.append(f'    rarity: {ts_str(a["rarity"])},')
        lines.append(f'    requiresAttunement: {ts_attunement(a["requiresAttunement"])},')
        lines.append(f'    magicDescription: {ts_str(a["magicDescription"])},')
        lines.append("  },")
        return "\n".join(lines)

    magic_items.sort(key=lambda x: x["name"])
    magic_weapons.sort(key=lambda x: x["name"])
    magic_armor.sort(key=lambda x: x["name"])

    items_ts = (
        'import { MagicItem } from "@/interfaces/MagicItem";\n\n'
        "/**\n"
        " * Auto-generated from data/Items.csv by scripts/convert_items.py - DO NOT\n"
        " * hand-edit. Re-run the script after updating the CSV; see\n"
        " * conversion_report.md for what did and didn't make it in.\n"
        " */\n"
        f"export const GENERATED_MAGIC_ITEMS: MagicItem[] = [\n"
        + "\n".join(emit_magic_item(i) for i in magic_items)
        + "\n];\n"
    )

    weapons_ts = (
        'import { Weapon } from "@/interfaces/Weapon";\n\n'
        "/**\n"
        " * Auto-generated from data/Items.csv by scripts/convert_items.py - DO NOT\n"
        " * hand-edit. Named magic weapons (their own stats from the CSV) plus\n"
        " * every base-weapon expansion of a template like \"+1 Weapon\" or\n"
        " * \"Flame Tongue\" whose base item exists in data/weapons/Weapons.ts.\n"
        " */\n"
        f"export const GENERATED_MAGIC_WEAPONS: Weapon[] = [\n"
        + "\n".join(emit_weapon(w) for w in magic_weapons)
        + "\n];\n"
    )

    armor_ts = (
        'import { Armor } from "@/interfaces/Armor";\n\n'
        "/**\n"
        " * Auto-generated from data/Items.csv by scripts/convert_items.py - DO NOT\n"
        " * hand-edit. Named magic armor/shields (their own stats from the CSV)\n"
        " * plus every base-armor expansion of a template like \"+1 Armor\" or\n"
        " * \"Mithral Armor\" whose base item exists in data/armor/Armor.ts.\n"
        " */\n"
        f"export const GENERATED_MAGIC_ARMOR: Armor[] = [\n"
        + "\n".join(emit_armor(a) for a in magic_armor)
        + "\n];\n"
    )

    (out_dir / "GeneratedMagicItems.ts").write_text(items_ts, encoding="utf-8")
    (out_dir / "GeneratedMagicWeapons.ts").write_text(weapons_ts, encoding="utf-8")
    (out_dir / "GeneratedMagicArmor.ts").write_text(armor_ts, encoding="utf-8")

    with (out_dir / "skipped_rows.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Name", "Source", "Type", "Rarity", "Reason"])
        w.writerows(skipped)

    report = [
        "# Items.csv conversion report",
        "",
        f"Source rows: {stats['total_rows']}",
        f"Excluded as mundane (rarity none/unknown): {stats['mundane_excluded']}",
        "",
        "## Output",
        f"- Magic items (MagicItem[]): {stats['magic_items']} ({stats['magic_items_with_bonuses']} with a parsed AC/attack/damage bonus - see MagicItem.bonuses)",
        f"- Magic weapons: {stats['magic_weapons_named']} named + {stats['magic_weapons_expanded']} expanded from templates = {len(magic_weapons)}",
        f"- Magic armor/shields: {stats['magic_armor_named']} named + {stats['magic_armor_expanded']} expanded from templates = {len(magic_armor)}",
        f"- Generic-variant template rows expanded into concrete entries: {stats['generic_variants_expanded_entries']}",
        "",
        "## Skipped",
        f"- Generic-variant rows with no parseable base-item list: {stats['generic_variants_no_base_list']}",
        f"- Generic-variant rows where NONE of their base items exist in this project's WEAPONS/ARMOR tables: {stats['generic_variants_zero_matches']}",
        f"- Duplicate names dropped (kept first occurrence): {stats['duplicate_names_dropped']}",
        f"- Total rows skipped entirely: {len(skipped)} (see skipped_rows.csv)",
        "",
        "See skipped_rows.csv for the full list with reasons.",
    ]
    (out_dir / "conversion_report.md").write_text("\n".join(report), encoding="utf-8")

    print("\n".join(report))


if __name__ == "__main__":
    main()
