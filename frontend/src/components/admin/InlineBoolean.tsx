type InlineBooleanProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export default function InlineBoolean({ value, onChange }: InlineBooleanProps) {
  const baseCls = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  const onCls = 'bg-green-500 hover:bg-green-600';
  const offCls = 'bg-gray-300 hover:bg-gray-400';
  const knobBase = 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform';
  const knobPos = value ? 'translate-x-6' : 'translate-x-1';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={value ? 'Tắt' : 'Bật'}
      title={value ? 'Đang bật' : 'Đang tắt'}
      onClick={() => onChange(!value)}
      className={[baseCls, value ? onCls : offCls].join(' ')}
    >
      <span className={[knobBase, knobPos].join(' ')} />
    </button>
  );
}

