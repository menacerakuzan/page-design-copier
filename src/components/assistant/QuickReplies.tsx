/**
 * Чіпси-варіанти відповіді ([[chips: ...]] або стартові підказки).
 * Тап = надіслати цей текст як наступне повідомлення користувача.
 */
export function QuickReplies({
  options,
  onPick,
  disabled,
}: {
  options: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
}) {
  if (!options.length) return null;
  return (
    <div className="my-2 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onPick(opt)}
          className="tap rounded-full border border-[#002f5e]/15 bg-white px-3.5 py-1.5 text-[13px] text-[#002f5e] font-odesa-medium transition-colors hover:border-[#df9b3b] hover:bg-[#df9b3b]/10 disabled:opacity-50"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
