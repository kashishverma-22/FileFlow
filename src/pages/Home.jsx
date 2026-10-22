import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ToolCard from "../components/ToolCard/ToolCard";

const categories = [
  "All",
  "Organize PDF",
  "Optimize PDF",
  "Convert PDF",
  "Edit PDF",
  "PDF Security",
  "Image Tools",
];

const tools = [
  {
    title: "Merge PDF",
    category: "Organize PDF",
    icon: "merge",
    description:
      "Combine multiple PDF files into one document in the order you want.",
  },
  {
    title: "Split PDF",
    category: "Organize PDF",
    icon: "split",
    description:
      "Separate pages or extract selected pages from a PDF document.",
  },
  {
    title: "Compress PDF",
    category: "Optimize PDF",
    icon: "compress",
    description:
      "Reduce the size of your PDF files for easier sharing and storage.",
  },
  {
    title: "PDF to Word",
    category: "Convert PDF",
    icon: "word",
    description: "Convert PDF documents into editable Word files.",
  },
  {
    title: "PDF to PowerPoint",
    category: "Convert PDF",
    icon: "slides",
    description: "Turn your PDF documents into PowerPoint presentations.",
  },
  {
    title: "PDF to Excel",
    category: "Convert PDF",
    icon: "excel",
    description: "Convert PDF tables into spreadsheet-friendly files.",
  },
  {
    title: "Word to PDF",
    category: "Convert PDF",
    icon: "document",
    description: "Convert Word documents into easy-to-share PDF files.",
  },
  {
    title: "PowerPoint to PDF",
    category: "Convert PDF",
    icon: "slides",
    description: "Convert presentations into PDF documents.",
  },
  {
    title: "Image Compressor",
    category: "Image Tools",
    icon: "compress",
    description:
      "Compress JPG, PNG and WebP images and download the processed image.",
  },
  {
    title: "Edit PDF",
    category: "Edit PDF",
    icon: "document",
    description:
      "Add text, draw, highlight content, and insert images or signatures into your PDF.",
  },
];

function ToolIcon({ type }) {
  const paths = {
    merge: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 17h7m-3-3 3 3-3 3" />
      </>
    ),
    split: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M12 3v18M4 12h8m4-4 4 4-4 4" />
      </>
    ),
    compress: (
      <>
        <path d="M8 3H3v5m0-5 6 6M16 21h5v-5m0 5-6-6M21 3h-5m5 0v5M3 21v-5m0 5h5" />
      </>
    ),
    word: (
      <>
        <path d="M6 3h9l5 5v13H6z" />
        <path d="M15 3v5h5M9 12h8M9 16h8" />
      </>
    ),
    slides: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="1" />
        <path d="M12 17v4m-4 0h8M8 8l4 4 4-4" />
      </>
    ),
    excel: (
      <>
        <path d="M6 3h9l5 5v13H6z" />
        <path d="M15 3v5h5M9 12l4 6m0-6-4 6" />
      </>
    ),
    document: (
      <>
        <path d="M6 3h9l5 5v13H6z" />
        <path d="M15 3v5h5M9 12h8M9 16h8" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      {paths[type] || paths.document}
    </svg>
  );
}

function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  const filteredTools =
    activeCategory === "All"
      ? tools
      : tools.filter((tool) => tool.category === activeCategory);

  function handleToolClick(tool) {
    const routes = {
      "Merge PDF": "/merge-pdf",
      "Split PDF": "/split-pdf",
      "Compress PDF": "/compress-pdf",
      "PDF to Word": "/pdf-to-word",
      "PDF to PowerPoint": "/pdf-to-powerpoint",
      "PDF to Excel": "/pdf-to-excel",
      "Word to PDF": "/word-to-pdf",
      "PowerPoint to PDF": "/powerpoint-to-pdf",
      "Image Compressor": "/image-compressor",
      "Edit PDF": "/edit-pdf",
    };

    const route = routes[tool.title];

    if (route) {
      navigate(route);
    }
  }

  return (
    <section
      id="tools"
      className="bg-slate-50 px-5 py-10 sm:py-14 md:px-12 lg:px-20"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section Heading */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">
            Explore FileFlow
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            All the tools you need
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Choose a tool to simplify your document and image workflow.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-9 flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeCategory === category
                  ? "bg-rose-600 text-white shadow-sm"
                  : "border border-transparent bg-white text-slate-600 hover:border-rose-200 hover:text-rose-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.title}
              icon={<ToolIcon type={tool.icon} />}
              title={tool.title}
              description={tool.description}
              onClick={() => handleToolClick(tool)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <p className="py-10 text-center text-slate-500">
            No tools available in this category yet.
          </p>
        )}

        {/* Bottom Note */}
        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500">
            More useful file tools are coming soon to FileFlow.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Home;
