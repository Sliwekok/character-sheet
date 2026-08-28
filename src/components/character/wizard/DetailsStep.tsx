import { Select, TextInput } from "@/components/ui";
import { ALIGNMENTS } from "@/utils/randomNames";

type DetailsStepProps = {
  name: string;
  alignment: string;
  onNameChange: (name: string) => void;
  onAlignmentChange: (alignment: string) => void;
};

export function DetailsStep({ name, alignment, onNameChange, onAlignmentChange }: DetailsStepProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fontcolor-secondary">Character name</span>
        <TextInput
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Kael Stormblade"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fontcolor-secondary">Alignment</span>
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
    </div>
  );
}
