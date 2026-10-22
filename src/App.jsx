import { Routes, Route, Link } from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import Home from "./pages/Home";
import Footer from "./components/Footer/Footer";

import ImageCompressor from "./pages/ImageCompressor";
import MergePdf from "./pages/MergePdf";
import SplitPdf from "./pages/SplitPdf";
import CompressPdf from "./pages/CompressPdf";
import PdfToWord from "./pages/PdfToWord";
import PdfToPowerPoint from "./pages/PdfToPowerPoint";
import PdfToExcel from "./pages/PdfToExcel";
import WordToPdf from "./pages/WordToPdf";
import PowerPointToPdf from "./pages/PowerPointToPdf";
import EditPdf from "./pages/EditPdf";

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <>
              <Hero />
              <Home />
            </>
          }
        />

        {/* PDF and Image Tools */}
        <Route path="/image-compressor" element={<ImageCompressor />} />

        <Route path="/merge-pdf" element={<MergePdf />} />

        <Route path="/split-pdf" element={<SplitPdf />} />

        <Route path="/compress-pdf" element={<CompressPdf />} />

        <Route path="/pdf-to-word" element={<PdfToWord />} />

        <Route path="/pdf-to-powerpoint" element={<PdfToPowerPoint />} />

        <Route path="/pdf-to-excel" element={<PdfToExcel />} />

        <Route path="/word-to-pdf" element={<WordToPdf />} />

        <Route path="/powerpoint-to-pdf" element={<PowerPointToPdf />} />

        <Route path="/edit-pdf" element={<EditPdf />} />

        {/* 404 Page */}
        <Route
          path="*"
          element={
            <main className="px-6 py-20 text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                404 - Page Not Found
              </h1>

              <Link
                to="/"
                className="mt-4 inline-block text-rose-600 underline"
              >
                Back to Home
              </Link>
            </main>
          }
        />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;
