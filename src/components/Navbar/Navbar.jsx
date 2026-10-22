import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex h-[70px] items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6 md:px-12 lg:px-20">
      {/* Logo */}
      <Link to="/" className="flex shrink-0 items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-8 w-8"
          >
            <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M14 3v6h5M12 12v6m-3-3 3 3 3-3" />
          </svg>
        </div>

        <span className="text-xl font-bold tracking-tight text-gray-800">
          File<span className="text-rose-600">Flow</span>
        </span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden items-center gap-7 text-sm text-gray-600 md:flex">
        <Link to="/merge-pdf" className="transition hover:text-rose-600">
          Merge PDF
        </Link>

        <Link to="/split-pdf" className="transition hover:text-rose-600">
          Split PDF
        </Link>

        <Link to="/compress-pdf" className="transition hover:text-rose-600">
          Compress PDF
        </Link>

        <Link to="/" className="transition hover:text-rose-600">
          All PDF Tools
        </Link>
      </div>

      {/* Right Side: Explore Tools */}
      <div className="flex items-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 sm:px-5"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>

          <span>Explore Tools</span>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
