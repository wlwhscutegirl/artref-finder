interface TagProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
}

export function Tag({ label, selected, onClick, removable, onRemove }: TagProps) {
  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
        transition-colors duration-150
        ${onClick ? 'cursor-pointer' : ''}
        ${
          selected
            ? 'bg-orange-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      #{label}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 hover:text-orange-200"
        >
          &times;
        </button>
      )}
    </span>
  );
}
