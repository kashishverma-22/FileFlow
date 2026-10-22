import { Link, useNavigate } from "react-router-dom";

function Footer() {
  const navigate = useNavigate();

  const popularTools = [
    { title: "Merge PDF", path: "/merge-pdf" },
    { title: "Split PDF", path: "/split-pdf" },
    { title: "Compress PDF", path: "/compress-pdf" },
    { title: "PDF to Word", path: "/pdf-to-word" },
    { title: "PDF to PowerPoint", path: "/pdf-to-powerpoint" },
    { title: "PDF to Excel", path: "/pdf-to-excel" },
    { title: "Word to PDF", path: "/word-to-pdf" },
    { title: "PowerPoint to PDF", path: "/powerpoint-to-pdf" },
    { title: "Edit PDF", path: "/edit-pdf" },
    { title: "Image Compressor", path: "/image-compressor" },
  ];

  const exploreLinks = [
    { title: "All Tools", path: "/", section: "tools" },
    { title: "How It Works", path: "/", section: "how-it-works" },
    { title: "Privacy", path: "/", section: "privacy" },
  ];

  const handleExplore = (section) => {
    navigate("/");

    setTimeout(() => {
      if (section === "tools") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const element = document.getElementById(section);

        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }, 100);
  };

  return (
    <footer className="bg-slate-950 text-white">
      {/* Main Footer */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div>
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-xl font-bold">
              F
            </span>

            <span className="text-2xl font-bold tracking-tight">
              File<span className="text-rose-500">Flow</span>
            </span>
          </Link>

          <p className="mt-5 max-w-xs text-sm leading-7 text-slate-400">
            Your files, made simple. Discover easy-to-use tools for managing,
            converting, editing and organizing documents and images.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Simple tools. Easy workflow.
          </div>
        </div>

        {/* Popular Tools */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">
            Popular Tools
          </h3>

          <ul className="mt-5 space-y-3 text-sm text-slate-400">
            {popularTools.map((tool) => (
              <li key={tool.path}>
                <Link
                  to={tool.path}
                  className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-rose-400"
                >
                  {tool.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Explore */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">
            Explore
          </h3>

          <ul className="mt-5 space-y-3 text-sm text-slate-400">
            {exploreLinks.map((item) => (
              <li key={item.section}>
                <button
                  type="button"
                  onClick={() => handleExplore(item.section)}
                  className="text-left transition hover:translate-x-1 hover:text-rose-400"
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-sm font-bold uppercase tracking-widest text-white">
            Document Tools
          </h3>

          <ul className="mt-5 space-y-3 text-sm text-slate-400">
            <li>
              <Link to="/merge-pdf" className="transition hover:text-rose-400">
                Organize PDF
              </Link>
            </li>
            <li>
              <Link
                to="/compress-pdf"
                className="transition hover:text-rose-400"
              >
                Optimize PDF
              </Link>
            </li>
            <li>
              <Link
                to="/pdf-to-word"
                className="transition hover:text-rose-400"
              >
                Convert PDF
              </Link>
            </li>
            <li>
              <Link to="/edit-pdf" className="transition hover:text-rose-400">
                Edit PDF
              </Link>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">
            Work Smarter
          </h3>

          <p className="mt-5 text-sm leading-7 text-slate-400">
            Find the right tool for your next document task and make your
            workflow simpler with FileFlow.
          </p>

          <button
            type="button"
            onClick={() => handleExplore("tools")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Explore All Tools
            <span aria-hidden="true">→</span>
          </button>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm font-semibold text-white">
              One place for your files
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              Merge, split, compress, convert and edit your documents with
              simple browser-based tools.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-center sm:flex-row sm:text-left lg:px-8">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} FileFlow. All rights reserved.
          </p>

          <button
            type="button"
            onClick={() => handleExplore("tools")}
            className="text-xs text-slate-500 transition hover:text-rose-400"
          >
            Built for a simpler file workflow.
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
