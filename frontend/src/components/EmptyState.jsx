export default function EmptyState({ title, description, icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 min-h-[200px]">
      {icon && <div className="text-5xl mb-4 opacity-50">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-[340px] mb-6">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
