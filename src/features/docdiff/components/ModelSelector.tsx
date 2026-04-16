import { MODEL_OPTIONS } from "../types/docdiff.types";

interface Props {
  provider: string;
  model: string;
  onChange: (provider: string, model: string) => void;
}

export function ModelSelector({ provider, model, onChange }: Props) {
  const selected = `${provider}|${model}`;

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        AI Model
      </label>
      <select
        value={selected}
        onChange={(e) => {
          const [p, m] = e.target.value.split("|");
          onChange(p, m);
        }}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
      >
        {MODEL_OPTIONS.map((opt) => (
          <option
            key={`${opt.provider}|${opt.model}`}
            value={`${opt.provider}|${opt.model}`}
          >
            {opt.label} — {opt.description}
          </option>
        ))}
      </select>
    </div>
  );
}
