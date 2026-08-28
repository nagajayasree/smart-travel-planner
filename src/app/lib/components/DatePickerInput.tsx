interface DatePickerInputProps {
  value: string;
  onDateChange: (value: string) => void;
  Placeholder?: string;
}

export default function DatePickerInput({
  value,
  onDateChange,
}: DatePickerInputProps) {

  return (
    <div>
      <input
        type="date"
        value={value}
        onChange={(event) => onDateChange(event.target.value)}
        className="w-48 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:ring-neutral-100"
      />
    </div>
  );
}
