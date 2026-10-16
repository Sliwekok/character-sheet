#!/usr/bin/env python3
"""
Builds src/data/featMechanics.json and src/data/spellClassLists.json.

    python scripts/feats/build_feat_mechanics.py

Inputs (all already in the repo):
  - src/data/feats.json            5etools feat data (scraped from https://5e.tools/feats.html)
  - src/data/spells.json           5etools spell data - only its class lists are used here
  - src/data/spells/Spells.ts      the app's spell compendium (names are matched against it)
  - src/data/2014/feats/Feats.ts   the app's feat lists - one mechanics entry is emitted per
  - src/data/2024/feats/Feats.ts   (edition, name) found in these, so the two always line up

featMechanics.json is what makes a picked feat actually DO something to a character -
ability score increases, proficiencies, expertise, saving throws, languages, resistances,
senses, speed / initiative / HP / AC / passive bonuses and granted spells (fixed or
"choose a level 1 Enchantment spell"-style). See interfaces/Feat.ts's `FeatMechanics` for the
exact shape and utils/feats.ts for how each field is applied.

Most fields are converted mechanically from 5etools' structured data. 5etools has no
structured field for flat speed / initiative / HP / AC / passive bonuses, so those come from
CURATED below (read off each feat's text) - extend it if a new feat needs one.
"""
import json
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA = os.path.join(ROOT, "src", "data")

ABILITY = {"str": "strength", "dex": "dexterity", "con": "constitution",
           "int": "intelligence", "wis": "wisdom", "cha": "charisma"}
ALL_ABILITIES = list(ABILITY.values())
SKILLS = ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight",
          "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance",
          "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"]
SKILL_BY_LOWER = {s.lower(): s for s in SKILLS}
SCHOOLS = {"A": "Abjuration", "C": "Conjuration", "D": "Divination", "E": "Enchantment",
           "V": "Evocation", "I": "Illusion", "N": "Necromancy", "T": "Transmutation"}
SENSES = ("darkvision", "blindsight", "truesight", "tremorsense")

# Effects 5etools doesn't encode structurally. Keyed by (edition, app feat name).
CURATED = {
    ("2014", "Alert"): {"initiativeBonus": 5},
    ("2024", "Alert"): {"initiativeProficiency": True},
    ("2014", "Tough"): {"hpPerLevel": 2},
    ("2024", "Tough"): {"hpPerLevel": 2},
    ("2024", "Boon of Fortitude"): {"hpFlat": 40},
    ("2014", "Mobile"): {"speedBonus": 10},
    ("2014", "Squat Nimbleness"): {"speedBonus": 5},
    ("2024", "Speedy"): {"speedBonus": 10},
    ("2024", "Boon of Speed"): {"speedBonus": 30},
    ("2024", "Mark of Passage"): {"speedBonus": 5},
    ("2014", "Mark of Passage"): {"speedBonus": 5},
    ("2024", "Transmuted Anatomy"): {"speedBonus": 5},
    ("2014", "Observant"): {"passiveBonus": {"perception": 5, "investigation": 5}},
    ("2014", "Medium Armor Master"): {"mediumArmorDexCap": 3},
    ("2024", "Medium Armor Master"): {"mediumArmorDexCap": 3},
    ("2014", "Dragon Hide"): {"unarmoredBaseAc": 13},
    ("2024", "Defense"): {"armoredAcBonus": 1},
    ("2014", "Keenness of the Stone Giant"): {"senses": {"darkvision": 60}},
    ("2024", "Keenness of the Stone Giant"): {"senses": {"darkvision": 60}},
    # "If you lack proficiency in the chosen skill, you gain proficiency in it, and if you
    # already have proficiency in it, you gain Expertise in it."
    ("2024", "Keen Mind"): {"skills": {"expertiseIfProficient": True}},
    ("2024", "Observant"): {"skills": {"expertiseIfProficient": True}},
    # Resilient's saving throw is always the ability it just increased.
    ("2014", "Resilient"): {"savingThrows": {"matchAbilityIncrease": True}},
    ("2024", "Resilient"): {"savingThrows": {"matchAbilityIncrease": True}},
}

# Hand-written notes for effects the sheet can't apply automatically but shows next to the feat.
NOTES = {
    ("2014", "Dual Wielder"): ["+1 AC while wielding a separate melee weapon in each hand (not added automatically)."],
    ("2014", "Revenant Blade"): ["+1 AC while holding a double-bladed scimitar with two hands (not added automatically)."],
}


def read_ts_feats(path, edition):
    text = open(path, encoding="utf-8").read()
    return re.findall(r'\n    \{\r?\n        name: "((?:[^"\\]|\\.)*)",\r?\n        edition: "' + edition + '"', text)


def read_spell_names():
    text = open(os.path.join(DATA, "spells", "Spells.ts"), encoding="utf-8").read()
    names = re.findall(r'\n    \{\r?\n        name: "((?:[^"\\]|\\.)*)"', text)
    return {n.lower(): n for n in names}


SPELL_NAMES = read_spell_names()
UNMATCHED_SPELLS = set()


def spell_name(raw):
    base = raw.split("|")[0].split("#")[0].strip().lower()
    match = SPELL_NAMES.get(base)
    if not match:
        UNMATCHED_SPELLS.add(base)
    return match or base.title()


def title(s):
    return " ".join(w if w in ("of", "the", "and") else w[:1].upper() + w[1:] for w in s.split(" "))


def parse_spell_filter(filt):
    out = {}
    for part in filt.split("|"):
        if "=" not in part:
            continue
        key, value = part.split("=", 1)
        key = key.strip().lower()
        values = [v.strip() for v in value.split(";") if v.strip()]
        if key == "level":
            out["levels"] = sorted(int(v) for v in values)
        elif key == "class":
            out["classes"] = [title(v.lower()) for v in values]
        elif key == "school":
            out["schools"] = [SCHOOLS.get(v.upper(), v) for v in values]
        elif key == "components & miscellaneous" and "ritual" in [v.lower() for v in values]:
            out["ritual"] = True
        elif key == "spell attack":
            out["spellAttack"] = True
    return out


def spell_entries(items, usage, frequency, level_key):
    grants = []
    for item in items:
        grant = {"usage": usage}
        if frequency:
            grant["frequency"] = frequency
        if level_key and level_key != "_":
            if level_key.startswith("s"):
                grant["slotLevel"] = int(level_key[1:])
            else:
                grant["atLevel"] = int(level_key)
        if isinstance(item, str):
            grant["spell"] = spell_name(item)
            grant["count"] = 1
        elif isinstance(item, dict) and "choose" in item:
            choose = item["choose"]
            if isinstance(choose, str):
                grant["choose"] = parse_spell_filter(choose)
            else:  # {"from": [...]} - pick from an explicit list
                grant["choose"] = {"fromList": [spell_name(s) for s in choose.get("from", [])]}
            grant["count"] = item.get("count", 1)
        else:
            continue
        grants.append(grant)
    return grants


FREQUENCY = {"will": "At will", "daily": "1/long rest", "rest": "1/short or long rest", "ritual": "Ritual only"}


def convert_spell_option(opt):
    grants = []
    for usage in ("known", "prepared", "innate"):
        block = opt.get(usage)
        if not block:
            continue
        for level_key, value in block.items():
            if isinstance(value, list):
                grants += spell_entries(value, usage, None, level_key)
            elif isinstance(value, dict):
                for freq, inner in value.items():
                    label = FREQUENCY.get(freq, freq)
                    if isinstance(inner, list):
                        grants += spell_entries(inner, usage, label, level_key)
                    elif isinstance(inner, dict):
                        for uses, spells in inner.items():
                            each = uses.endswith("e")
                            n = uses.rstrip("e")
                            lbl = label if n == "1" else label.replace("1/", n + "/")
                            if each:
                                lbl += " each"
                            grants += spell_entries(spells, usage, lbl, level_key)
    if not grants:
        return None
    out = {}
    if opt.get("name"):
        out["name"] = opt["name"]
    ability = opt.get("ability")
    if isinstance(ability, str):
        out["ability"] = "inherit" if ability == "inherit" else ABILITY.get(ability, ability)
    elif isinstance(ability, dict) and "choose" in ability:
        out["abilityChoice"] = [ABILITY[a] for a in ability["choose"]]
    out["grants"] = grants
    return out


def convert_ability(raw):
    if not raw:
        return None
    entry = next((e for e in raw if not e.get("hidden")), None)
    if entry is None:
        return None
    out = {"max": entry.get("max", 20)}
    fixed = {ABILITY[k]: v for k, v in entry.items() if k in ABILITY}
    if fixed:
        out["fixed"] = fixed
    if "choose" in entry:
        c = entry["choose"]
        out["choose"] = {"from": [ABILITY[a] for a in c["from"]], "count": c.get("count", 1), "amount": c.get("amount", 1)}
    return out


def convert_skills(raw):
    if not raw:
        return None
    out = {}
    for entry in raw:
        fixed = [SKILL_BY_LOWER[k] for k, v in entry.items() if v is True and k in SKILL_BY_LOWER]
        if len(fixed) == len(SKILLS):  # "proficiency in every skill" is really "choose any"
            out["choose"] = {"from": SKILLS, "count": 1}
            continue
        if fixed:
            out.setdefault("fixed", []).extend(fixed)
        if "any" in entry:
            out["choose"] = {"from": SKILLS, "count": entry["any"]}
        if "choose" in entry:
            c = entry["choose"]
            out["choose"] = {"from": [SKILL_BY_LOWER[s] for s in c["from"] if s in SKILL_BY_LOWER], "count": c.get("count", 1)}
    return out or None


def convert_expertise(raw):
    if not raw:
        return None
    out = {}
    for entry in raw:
        fixed = [SKILL_BY_LOWER[k] for k, v in entry.items() if v is True and k in SKILL_BY_LOWER]
        if fixed:
            out.setdefault("fixed", []).extend(fixed)
        if "anyProficientSkill" in entry:
            out["choose"] = {"count": entry["anyProficientSkill"]}
    return out or None


def convert_tools(raw):
    if not raw:
        return None
    out = {}
    for entry in raw:
        fixed = [title(k) for k, v in entry.items() if v is True]
        if fixed:
            out.setdefault("fixed", []).extend(fixed)
        if "any" in entry:
            out["choose"] = {"kind": "any", "count": entry["any"]}
        if "anyArtisansTool" in entry:
            out["choose"] = {"kind": "artisan", "count": entry["anyArtisansTool"]}
        if "anyMusicalInstrument" in entry:
            out["choose"] = {"kind": "instrument", "count": entry["anyMusicalInstrument"]}
        if "choose" in entry:
            c = entry["choose"]
            out["choose"] = {"from": [title(t) for t in c["from"]], "count": c.get("count", 1)}
    return out or None


def convert_languages(raw):
    if not raw:
        return None
    out = {}
    for entry in raw:
        fixed = [title(k) for k, v in entry.items() if v is True]
        if fixed:
            out.setdefault("fixed", []).extend(fixed)
        if "any" in entry:
            out["choose"] = {"count": entry["any"]}
    return out or None


def convert_damage_list(raw):
    if not raw:
        return None
    out = {}
    for entry in raw:
        if isinstance(entry, str):
            out.setdefault("fixed", []).append(entry.capitalize())
        elif isinstance(entry, dict) and "choose" in entry:
            c = entry["choose"]
            out["choose"] = {"from": [d.capitalize() for d in c["from"]], "count": c.get("count", 1)}
    return out or None


def convert_weapons(raw):
    if not raw:
        return None
    out = {}
    for entry in raw:
        fixed = [k for k, v in entry.items() if v is True]
        if fixed:
            out.setdefault("fixed", []).extend(fixed)
        if "choose" in entry:
            out["choose"] = {"count": entry["choose"].get("count", 1), "description": "martial weapons of your choice"}
    return out or None


def convert_saves(raw):
    if not raw:
        return None
    out = {}
    for entry in raw:
        fixed = [ABILITY[k] for k, v in entry.items() if v is True and k in ABILITY]
        if fixed:
            out.setdefault("fixed", []).extend(fixed)
        if "choose" in entry:
            c = entry["choose"]
            out["choose"] = {"from": [ABILITY[a] for a in c["from"]], "count": c.get("count", 1)}
    return out or None


def feat_ref_name(ref):
    parts = ref.split("|")
    return title(parts[0].lower())


def convert_prerequisites(raw):
    if not raw:
        return None
    out = []
    for entry in raw:
        p = {}
        level = entry.get("level")
        if isinstance(level, int):
            p["level"] = level
        elif isinstance(level, dict):
            p["level"] = level.get("level", 1)
            if level.get("class"):
                p["className"] = level["class"]["name"]
        if "ability" in entry:
            # Several objects in one `ability` array are alternatives ("Str 13 or Dex 13").
            p["abilities"] = [{ABILITY[k]: v for k, v in alt.items()} for alt in entry["ability"]]
        if entry.get("spellcasting") or entry.get("spellcasting2020") or entry.get("spellcastingFeature"):
            p["spellcasting"] = True
        if "feat" in entry:
            p["feats"] = [feat_ref_name(f) for f in entry["feat"]]
        if "race" in entry:
            p["races"] = [title(r["name"]) + (f" ({title(r['subrace'])})" if r.get("subrace") else "") for r in entry["race"]]
        if "feature" in entry:
            p["features"] = entry["feature"]
        if "proficiency" in entry:
            for prof in entry["proficiency"]:
                if "armor" in prof:
                    p["armorProficiency"] = prof["armor"]
                if "weapon" in prof or "weaponGroup" in prof:
                    p["weaponProficiency"] = prof.get("weapon") or prof.get("weaponGroup")
        if "campaign" in entry:
            p["campaigns"] = entry["campaign"]
        if "background" in entry:
            p["backgrounds"] = [b["name"] for b in entry["background"]]
        if "exclusiveFeatCategory" in entry:
            p["noOtherFeatOfCategory"] = "dragonmark"
        if "other" in entry:
            p["other"] = entry["other"]
        if "otherSummary" in entry:
            p["other"] = entry["otherSummary"].get("entry")
        if p:
            out.append(p)
    return out or None


def deep_merge(base, extra):
    for k, v in extra.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            deep_merge(base[k], v)
        else:
            base[k] = v
    return base


def convert(raw, edition, name):
    m = {"source": raw["source"]}
    if raw.get("repeatable"):
        m["repeatable"] = True
    for key, fn, field in [
        ("prerequisite", convert_prerequisites, "prerequisites"),
        ("ability", convert_ability, "abilityIncrease"),
        ("skillProficiencies", convert_skills, "skills"),
        ("expertise", convert_expertise, "expertise"),
        ("savingThrowProficiencies", convert_saves, "savingThrows"),
        ("toolProficiencies", convert_tools, "tools"),
        ("languageProficiencies", convert_languages, "languages"),
        ("weaponProficiencies", convert_weapons, "weapons"),
        ("resist", convert_damage_list, "resistances"),
    ]:
        value = fn(raw.get(key))
        if value:
            m[field] = value
    if raw.get("armorProficiencies"):
        m["armor"] = sorted({k for e in raw["armorProficiencies"] for k, v in e.items() if v is True})
    if raw.get("skillToolLanguageProficiencies"):
        count = sum(c.get("count", 1) for e in raw["skillToolLanguageProficiencies"] for c in e.get("choose", []))
        m["skillsOrTools"] = {"count": count}
    if raw.get("immune"):
        m["immunities"] = [d.capitalize() for d in raw["immune"] if isinstance(d, str)]
    if raw.get("conditionImmune"):
        m["conditionImmunities"] = [d.capitalize() for d in raw["conditionImmune"] if isinstance(d, str)]
    senses = {}
    for entry in (raw.get("senses") or []) + (raw.get("bonusSenses") or []):
        for k, v in entry.items():
            if k in SENSES:
                senses[k] = max(senses.get(k, 0), v)
    if senses:
        m["senses"] = senses
    if raw.get("additionalSpells"):
        options = [o for o in (convert_spell_option(opt) for opt in raw["additionalSpells"]) if o]
        if options:
            m["spellOptions"] = options
    if raw.get("optionalfeatureProgression"):
        m["optionalFeatures"] = [{"name": o["name"], "count": max(o["progression"].values())} for o in raw["optionalfeatureProgression"]]
    deep_merge(m, json.loads(json.dumps(CURATED.get((edition, name), {}))))
    if (edition, name) in NOTES:
        m["notes"] = NOTES[(edition, name)]
    return m


def build_spell_class_lists():
    spells = json.load(open(os.path.join(DATA, "spells.json"), encoding="utf-8"))
    lists = defaultdict(set)
    for s in spells:
        name = SPELL_NAMES.get(s["Name"].lower(), s["Name"])
        for part in (s.get("Classes", "") + "," + s.get("Optional/Variant Classes", "")).split(","):
            cls = re.sub(r"\s*\(.*\)$", "", part.strip())
            if cls:
                lists[cls].add(name)
    return {k: sorted(v) for k, v in sorted(lists.items())}


def main():
    feats = json.load(open(os.path.join(DATA, "feats.json"), encoding="utf-8"))["feats"]
    by_name = defaultdict(list)
    for f in feats:
        by_name[f["name"]].append(f)

    out = {
        "$meta": {
            "generatedBy": "scripts/feats/build_feat_mechanics.py",
            "source": "src/data/feats.json (5e.tools feats) + hand-curated effects in the script's CURATED table",
            "note": "Keyed by edition, then by the feat's exact name in data/<edition>/feats/Feats.ts. See interfaces/Feat.ts FeatMechanics.",
        }
    }
    missing = []
    for edition in ("2014", "2024"):
        names = read_ts_feats(os.path.join(DATA, edition, "feats", "Feats.ts"), edition)
        entries = {}
        for name in names:
            candidates = by_name.get(name, [])
            if not candidates:
                missing.append((edition, name))
                continue
            if edition == "2024":
                raw = next((c for c in candidates if c.get("category")), candidates[0])
            else:
                raw = next((c for c in candidates if not c.get("category")), candidates[0])
            entries[name] = convert(raw, edition, name)
        out[edition] = entries

    with open(os.path.join(DATA, "featMechanics.json"), "w", encoding="utf-8", newline="\r\n") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    with open(os.path.join(DATA, "spellClassLists.json"), "w", encoding="utf-8", newline="\r\n") as fh:
        json.dump(build_spell_class_lists(), fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    print(f"2014: {len(out['2014'])} feats, 2024: {len(out['2024'])} feats")
    if missing:
        print("No 5etools data for:", missing, file=sys.stderr)
    if UNMATCHED_SPELLS:
        print("Spells not in the app's compendium (kept as title-cased names):", sorted(UNMATCHED_SPELLS), file=sys.stderr)


if __name__ == "__main__":
    main()
