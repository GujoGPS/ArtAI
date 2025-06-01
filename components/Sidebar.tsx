import React from 'react';

// Defines the structure for a recently accessed PDF item.
export interface RecentPdf {
  hash: string;
  displayName: string;
}

// Simple icon for the toggle button, rotates based on isOpen state.
const MenuIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 transition-transform duration-300"
    style={{ transform: isOpen ? 'rotate(180deg)' : '' }} // Rotates icon when sidebar is open
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
  </svg>
);

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  recentPdfs: RecentPdf[];
  currentPdfName: string | null; // The name of the currently active PDF
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, recentPdfs, currentPdfName }) => {
  return (
    <>
      {/* Toggle button for the sidebar, always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 z-20 p-2 bg-slate-700 hover:bg-sky-600 rounded-r-lg transition-all duration-300 ${isOpen ? 'left-64' : 'left-0'}`} // Adjusts position based on open state
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <MenuIcon isOpen={isOpen} />
      </button>

      {/* Sidebar panel */}
      <div
        className={`flex flex-col bg-slate-800 text-slate-200 border-r border-slate-700 transition-all duration-300 ease-in-out z-10 ${isOpen ? 'w-64' : 'w-0'} overflow-hidden`}
      >
        <div className="p-4 flex-shrink-0 min-w-64"> {/* min-w-64 ensures content isn't squished during transition */}
          <h2 className="text-lg font-semibold text-white">Article History</h2>
          <p className="text-xs text-slate-400 mt-1">
            Chat history is saved locally. Opening a PDF from the list will recover its conversation.
          </p>
        </div>

        <nav className="flex-grow overflow-y-auto custom-scrollbar min-w-64">
          {recentPdfs.length > 0 ? (
            <ul>
              {recentPdfs.map((pdf) => (
                <li key={pdf.hash}>
                  {/* Ideally, clicking these items would trigger loading that specific PDF.
                    This functionality would need to be passed down from App.tsx (e.g., an onSelectPdf callback).
                    For now, it's a visual list indicating the current PDF.
                  */}
                  <div
                    className={`block w-full text-left px-4 py-3 text-sm truncate transition-colors ${
                      currentPdfName === pdf.displayName
                        ? 'bg-sky-700 text-white font-semibold' // Highlight current PDF
                        : 'hover:bg-slate-700'
                    }`}
                    title={pdf.displayName} // Full name on hover
                  >
                    {pdf.displayName}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-slate-500">
              No history found. Open a PDF to get started.
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
