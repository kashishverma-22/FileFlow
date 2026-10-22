
function ToolCard({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-gray-100 bg-white p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-rose-200 hover:shadow-md"
    >
      <div className="mb-4 flex h-9 w-9 items-center justify-center text-rose-600">
        {icon}
      </div>

      <h3 className="mb-2 text-base font-semibold text-gray-800 group-hover:text-rose-600">
        {title}
      </h3>

      <p className="text-sm leading-5 text-gray-500">
        {description}
      </p>
    </button>
  );
}

export default ToolCard;
