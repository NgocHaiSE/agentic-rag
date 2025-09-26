type RowActionsProps = {
    onSave?: () => void;
    onDelete?: () => void;
    saving?: boolean;
};

export default function RowActions({ onSave, onDelete, saving }: RowActionsProps) {
    return (
        <div className="flex gap-2">
            {onSave && (
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
            )}
            {onDelete && (
                <button
                    onClick={onDelete}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Xóa
                </button>
            )}
        </div>
    )
}