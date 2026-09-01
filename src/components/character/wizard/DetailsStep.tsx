import { Select, TextInput, Textarea } from "@/components/ui";
import { ALIGNMENTS } from "@/utils/randomNames";
import { CharacterAppearance, CharacterDetails, CharacterFlavor } from "@/interfaces/CharacterDetails";

type DetailsStepProps = {
  name: string;
  alignment: string;
  details: CharacterDetails;
  onNameChange: (name: string) => void;
  onAlignmentChange: (alignment: string) => void;
  onDetailsChange: (details: CharacterDetails) => void;
};

const APPEARANCE_FIELDS: { key: keyof CharacterAppearance; label: string; placeholder: string }[] = [
  { key: "age", label: "Age", placeholder: "e.g. 27" },
  { key: "height", label: "Height", placeholder: "e.g. 5'8\"" },
  { key: "weight", label: "Weight", placeholder: "e.g. 150 lb" },
  { key: "eyes", label: "Eyes", placeholder: "e.g. Green" },
  { key: "skin", label: "Skin", placeholder: "e.g. Tan" },
  { key: "hair", label: "Hair", placeholder: "e.g. Black" },
];

const FLAVOR_FIELDS: { key: keyof CharacterFlavor; label: string; placeholder: string }[] = [
  { key: "personalityTraits", label: "Personality traits", placeholder: "How does your character act, speak, think?" },
  { key: "ideals", label: "Ideals", placeholder: "What principles does your character believe in?" },
  { key: "bonds", label: "Bonds", placeholder: "What people, places, or things matter most to them?" },
  { key: "flaws", label: "Flaws", placeholder: "What weakness or vice might bring them trouble?" },
];

function SectionLabel({ children }: { children: string }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-fontcolor-secondary">{children}</p>;
}

/**
 * Character name, alignment, and every flavor/print-only field the
 * printable sheet (app/character/[id]/print) can render - player name,
 * personality traits, physical description, backstory, allies &
 * organizations, and treasure. All of it beyond name/alignment is
 * optional: nothing here is required to finish the wizard (see
 * ManualWizard's `canProceed`), so a player who just wants the numbers can
 * skip straight past it, same as leaving the paper sheet's flavor boxes
 * blank.
 */
export function DetailsStep({
  name,
  alignment,
  details,
  onNameChange,
  onAlignmentChange,
  onDetailsChange,
}: DetailsStepProps) {
  function updateDetails(patch: Partial<CharacterDetails>) {
    onDetailsChange({ ...details, ...patch });
  }

  function updateAppearance(patch: Partial<CharacterAppearance>) {
    updateDetails({ appearance: { ...details.appearance, ...patch } });
  }

  function updateFlavor(patch: Partial<CharacterFlavor>) {
    updateDetails({ flavor: { ...details.flavor, ...patch } });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">Character name*</span>
          <TextInput
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Kael Stormblade"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">Alignment*</span>
          <Select value={alignment} onChange={(event) => onAlignmentChange(event.target.value)}>
            <option value="" disabled>
              Choose an alignment...
            </option>
            {ALIGNMENTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">Player name</span>
          <TextInput
            value={details.playerName ?? ""}
            onChange={(event) => updateDetails({ playerName: event.target.value })}
            placeholder="e.g. Alex"
          />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <SectionLabel>Personality</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          {FLAVOR_FIELDS.map(({ key, label, placeholder }) => (
            <label key={key} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fontcolor-secondary">{label}</span>
              <Textarea
                value={details.flavor?.[key] ?? ""}
                onChange={(event) => updateFlavor({ [key]: event.target.value })}
                placeholder={placeholder}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionLabel>Appearance</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-3">
          {APPEARANCE_FIELDS.map(({ key, label, placeholder }) => (
            <label key={key} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fontcolor-secondary">{label}</span>
              <TextInput
                value={details.appearance?.[key] ?? ""}
                onChange={(event) => updateAppearance({ [key]: event.target.value })}
                placeholder={placeholder}
              />
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">Physical description</span>
          <Textarea
            value={details.appearanceNotes ?? ""}
            onChange={(event) => updateDetails({ appearanceNotes: event.target.value })}
            placeholder="What does your character look like?"
            rows={4}
          />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <SectionLabel>Backstory &amp; world</SectionLabel>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">Backstory</span>
          <Textarea
            value={details.backstory ?? ""}
            onChange={(event) => updateDetails({ backstory: event.target.value })}
            placeholder="Where did your character come from, and how did they end up adventuring?"
            rows={6}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fontcolor-secondary">Allies &amp; organizations</span>
            <Textarea
              value={details.alliesAndOrganizations ?? ""}
              onChange={(event) => updateDetails({ alliesAndOrganizations: event.target.value })}
              placeholder="Groups, factions, or allies your character is tied to"
              rows={4}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fontcolor-secondary">Organization symbol</span>
            <TextInput
              value={details.organizationSymbolName ?? ""}
              onChange={(event) => updateDetails({ organizationSymbolName: event.target.value })}
              placeholder="Name of the symbol/emblem, if any"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-fontcolor-secondary">Treasure</span>
          <Textarea
            value={details.treasure ?? ""}
            onChange={(event) => updateDetails({ treasure: event.target.value })}
            placeholder="Notable valuables, keepsakes, or trophies (beyond currency and equipment)"
            rows={3}
          />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <SectionLabel>Additional notes</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fontcolor-secondary">Other proficiencies &amp; languages</span>
            <Textarea
              value={details.otherProficienciesNotes ?? ""}
              onChange={(event) => updateDetails({ otherProficienciesNotes: event.target.value })}
              placeholder="Anything beyond what's auto-listed from your race/background/class"
              rows={3}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fontcolor-secondary">Features &amp; traits notes</span>
            <Textarea
              value={details.featuresAndTraitsNotes ?? ""}
              onChange={(event) => updateDetails({ featuresAndTraitsNotes: event.target.value })}
              placeholder="Anything beyond your feats worth noting on the sheet"
              rows={3}
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium text-fontcolor-secondary">Additional features &amp; traits</span>
            <Textarea
              value={details.additionalFeaturesAndTraits ?? ""}
              onChange={(event) => updateDetails({ additionalFeaturesAndTraits: event.target.value })}
              placeholder="Extra features and traits for the details sheet's own box"
              rows={3}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
