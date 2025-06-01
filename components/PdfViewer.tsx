import React from 'react';
import { Document, Page } from 'react-pdf';
// The react-pdf library manages the types internally.

interface PdfViewerProps {
  file: File | null;
  fileName: string;
  currentPageNumber: number;
  numPages: number;
  onPageChange: (page: number) => void;
  // Using 'any' here to bypass the residual type conflict for the pdf object.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLoadSuccess: (pdf: any) => void; 
  isExtractingPageText: boolean;
  isSummarizing: boolean;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  file,
  fileName,
  currentPageNumber,
  numPages,
  onPageChange,
  onLoadSuccess,
  isExtractingPageText,
  isSummarizing,
}) => {
  const goToPrevPage = () => {
    if (currentPageNumber > 1) {
      onPageChange(currentPageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageNumber < numPages) {
      onPageChange(currentPageNumber + 1);
    }
  };
  
  return (
    <div className="flex flex-col h-full w-full bg-slate-600 text-slate-100">
      <div className="flex items-center justify-between p-3 bg-slate-700 shadow">
        <button
          onClick={goToPrevPage}
          disabled={currentPageNumber <= 1}
          className="px-4 py-2 bg-sky-600 text-white rounded-md disabled:bg-slate-500 disabled:cursor-not-allowed hover:bg-sky-700 transition-colors"
        >
          Previous
        </button>
        <div className="flex flex-col items-center">
          <span className="font-semibold truncate max-w-xs" title={fileName}>{fileName}</span>
          <span className="text-sm">
            Page {currentPageNumber} of {numPages || '--'}
            {isExtractingPageText && <span className="ml-2 text-xs">(Extracting text...)</span>}
          </span>
          {isSummarizing && <span className="text-xs text-yellow-300 animate-pulse">Generating article summary...</span>}
        </div>
        <button
          onClick={goToNextPage}
          disabled={currentPageNumber >= numPages || numPages === 0}
          className="px-4 py-2 bg-sky-600 text-white rounded-md disabled:bg-slate-500 disabled:cursor-not-allowed hover:bg-sky-700 transition-colors"
        >
          Next
        </button>
      </div>

      <div className="flex-grow overflow-auto p-1 custom-scrollbar">
        {file && (
          <Document
            file={file}
            onLoadSuccess={onLoadSuccess}
            onLoadError={(error) => console.error('Failed to load PDF:', error.message)}
            loading={<div className="flex justify-center items-center h-full"><p className="text-slate-300 text-lg">Loading PDF...</p></div>}
            error={<div className="flex justify-center items-center h-full p-4"><p className="text-red-400 text-lg text-center">Error loading PDF. The file might be corrupted or not a valid PDF.</p></div>}
            className="flex justify-center"
          >
            <Page 
              pageNumber={currentPageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={false} // Disable to prevent potential CSS errors
              className="drop-shadow-lg"
              loading={<div className="flex justify-center items-center h-full"><p className="text-slate-300 text-sm">Loading page {currentPageNumber}...</p></div>}
              error={<div className="flex justify-center items-center h-full p-4"><p className="text-red-400 text-lg">Error loading page {currentPageNumber}.</p></div>}
            />
          </Document>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
