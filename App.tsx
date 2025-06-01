import React, { useState, useEffect, useCallback, useRef } from 'react';
import PdfViewer from './components/PdfViewer';
import ChatInterface from './components/ChatInterface';
import Sidebar, { RecentPdf } from './components/Sidebar';
import { sendMessageToGemini } from './services/geminiService';
import type { ChatMessage } from './types';

// Using 'any' for complex PDF.js types to simplify and avoid version conflicts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TextItem = any;

// Calculates the SHA-256 hash of a file.
async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert byte array to hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

interface HistoryEntry {
  messages: ChatMessage[];
  lastKnownName: string;
  summary?: string;
}

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [currentFileHash, setCurrentFileHash] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [currentPageText, setCurrentPageText] = useState<string>('');
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfSummary, setPdfSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [recentPdfs, setRecentPdfs] = useState<RecentPdf[]>([]);

  const CHAT_HISTORY_KEY = 'art_ai_chat_history_v3'; // localStorage key

  // Loads a history entry (messages and summary) from localStorage based on the PDF hash.
  const loadHistoryEntry = (hash: string): HistoryEntry => {
    try {
      const allHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (allHistory) {
        const parsedHistory = JSON.parse(allHistory);
        const entry = parsedHistory[hash];
        if (entry) {
          return {
            messages: entry.messages || [],
            lastKnownName: entry.lastKnownName || '',
            summary: entry.summary || ''
          };
        }
      }
    } catch (e) {
      console.error("Failed to load history entry:", e);
    }
    return { messages: [], lastKnownName: '', summary: '' };
  };

  // Saves a history entry (messages, filename, and summary) to localStorage.
  const saveHistoryEntry = useCallback((hash: string, fileName: string, messages: ChatMessage[], summaryToSave: string) => {
    if (!hash) return;
    try {
      const allHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      const parsedHistory = allHistory ? JSON.parse(allHistory) : {};

      const newEntry: HistoryEntry = {
        lastKnownName: fileName,
        messages: messages,
        summary: summaryToSave,
      };

      parsedHistory[hash] = newEntry;
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(parsedHistory));

      // Update the recent PDFs list for the Sidebar
      setRecentPdfs(prev => {
        const existingPdfIndex = prev.findIndex(p => p.hash === hash);
        let newList;
        if (existingPdfIndex !== -1) {
          const item = { ...prev[existingPdfIndex], displayName: fileName };
          newList = [item, ...prev.filter(p => p.hash !== hash)];
        } else {
          newList = [{ hash, displayName: fileName }, ...prev];
        }
        return newList;
      });
    } catch (e) {
      console.error("Failed to save history entry:", e);
    }
  }, []);

  // Loads the list of recent PDFs from localStorage on initial app mount.
  useEffect(() => {
    try {
      const allHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (allHistory) {
        const parsed = JSON.parse(allHistory);
        const recentList: RecentPdf[] = Object.keys(parsed).map(hash => ({
          hash: hash,
          displayName: parsed[hash].lastKnownName || 'Unknown File'
        })).reverse(); // Simple reverse; a timestamp would be better for true recency.
        setRecentPdfs(recentList);
      }
    } catch (e) {
      console.error("Failed to load recent PDFs list from history:", e);
    }
  }, []);

  // Handles the selection of a new PDF file.
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const fileName = file.name;
      setError(null);
      setIsLoadingAiResponse(true);
      setPdfFile(null); 

      try {
        const hash = await calculateFileHash(file);

        setPdfFileName(fileName);
        setCurrentFileHash(hash);

        const { messages, summary: loadedSummary, lastKnownName } = loadHistoryEntry(hash);
        setChatMessages(messages);
        setPdfSummary(loadedSummary || '');
        
        if (lastKnownName !== fileName && lastKnownName !== '') { // Update name if different and an old name existed
           saveHistoryEntry(hash, fileName, messages, loadedSummary || '');
        } else if (!lastKnownName) { // If it's a truly new hash (no lastKnownName)
           saveHistoryEntry(hash, fileName, messages, loadedSummary || '');
        }


        setTimeout(() => {
            setPdfFile(file);
        }, 0);

        setCurrentPageNumber(1);
        setNumPages(0);
        setPdfProxy(null);
        setCurrentPageText('');

      } catch (e) {
        console.error("Error processing PDF file:", e);
        setError("Failed to process PDF file. Please try again.");
        setPdfFile(null); setPdfFileName(''); setCurrentFileHash(null); setPdfSummary(''); setChatMessages([]);
      } finally {
        setIsLoadingAiResponse(false);
      }
    } else {
      setPdfFile(null); setPdfFileName(''); setCurrentFileHash(null); setPdfSummary(''); setChatMessages([]);
      if (file) {
        setError('Please select a valid PDF file.');
      }
    }
  };

  // Saves the full history (messages and summary) whenever messages or summary change for the current file.
  useEffect(() => {
    if (currentFileHash && pdfFileName) {
      saveHistoryEntry(currentFileHash, pdfFileName, chatMessages, pdfSummary);
    }
  }, [chatMessages, pdfSummary, currentFileHash, pdfFileName, saveHistoryEntry]);

  // Callback for when the PDF document is successfully loaded by PdfViewer.
  const handleLoadSuccess = useCallback((loadedPdfProxy: PDFDocumentProxy) => {
    setPdfProxy(loadedPdfProxy);
    setNumPages(loadedPdfProxy.numPages);
    setCurrentPageNumber(1);
  }, []);

  // Callback for page changes in PdfViewer.
  const handlePageChange = useCallback((newPage: number) => {
    if (numPages && newPage > 0 && newPage <= numPages) {
      setCurrentPageNumber(newPage);
    }
  }, [numPages]);

  // Extracts text from the current PDF page when pdfProxy or currentPageNumber changes.
  useEffect(() => {
    if (pdfProxy && currentPageNumber > 0 && currentPageNumber <= numPages) {
      setIsExtractingText(true);
      pdfProxy.getPage(currentPageNumber).then((page: any) => {
        return page.getTextContent();
      }).then((textContent: any) => {
        const text = textContent.items.map((item: TextItem) => item.str).join(' ');
        setCurrentPageText(text);
      }).catch((err: any) => {
        console.error("Error extracting text from PDF page:", err);
        setCurrentPageText('');
        setError(`Failed to extract text from page ${currentPageNumber}.`);
      }).finally(() => {
        setIsExtractingText(false);
      });
    } else {
      setCurrentPageText('');
    }
  }, [pdfProxy, currentPageNumber, numPages]);

  // Generates a summary for the PDF if it's loaded and no summary exists for it yet.
  useEffect(() => {
    if (pdfProxy && !pdfSummary && !isSummarizing) {
      const generateSummary = async () => {
        setIsSummarizing(true);
        setError(null);
        console.log("Starting summary generation for:", pdfFileName);
        try {
          const fullTextChunks: string[] = [];
          for (let i = 1; i <= pdfProxy.numPages; i++) {
            const page = await pdfProxy.getPage(i);
            const textContent = await page.getTextContent();
            fullTextChunks.push(textContent.items.map((item: TextItem) => item.str).join(' '));
          }
          const fullText = fullTextChunks.join('\n\n');

          if (fullText.trim().length === 0) {
            setPdfSummary(''); 
            console.warn("No text extracted from PDF, summary cannot be generated.");
            return;
          }

          const summaryPrompt = `You are an expert assistant specialized in analyzing scientific documents. The following text is the full content of an article. Please generate a structured and concise summary, highlighting the following points if present: Introduction/Objective, Methodology, Main Results, and Conclusion. IMPORTANT: When generating the summary, if you encounter text that appears to be repetitive footers or headers not part of the main scientific content (like journal names, page numbers, or editorial information repeated on many pages), please disregard them and focus on the body of the text. The text is:\n\n---\n${fullText}\n---`;

          const newSummary = await sendMessageToGemini(summaryPrompt);
          setPdfSummary(newSummary);
        } catch (err: any) {
          const errorText = err instanceof Error ? err.message : "An unknown error occurred while summarizing the PDF.";
          setError(`Summary Error: ${errorText}`);
          setPdfSummary(''); 
        } finally {
          setIsSummarizing(false);
          console.log("Finished summary generation attempt for:", pdfFileName);
        }
      };
      generateSummary();
    }
  }, [pdfProxy, pdfSummary, isSummarizing, pdfFileName]);

  // Handles sending a message to the AI.
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(), text: messageText, sender: 'user', timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsLoadingAiResponse(true);
    setError(null);

    let prompt: string;
    if (pdfFile) {
      prompt = `Based on the following information, please answer the user's question.

## Full Article Summary (${pdfFileName || 'N/A'}) ##
${pdfSummary || "No general summary available or it is still being generated."}

## Specific Content from Page ${currentPageNumber} (for detailed focus) ##
${currentPageText || "No text extracted from this page, or the page has no textual content."}

## User's Question ##
${messageText}`;
    } else {
      prompt = messageText;
    }

    try {
      const aiResponseText = await sendMessageToGemini(prompt);
      const newAiMessage: ChatMessage = {
        id: crypto.randomUUID(), text: aiResponseText, sender: 'ai', timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (err: any) {
      const errorText = err instanceof Error ? err.message : "An error occurred with the AI.";
      setError(`AI Error: ${errorText}`);
      const errorAiMessage: ChatMessage = {
        id: crypto.randomUUID(), text: `Sorry, I encountered an error while processing your request: ${errorText}`, sender: 'ai', timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoadingAiResponse(false);
    }
  };

  const triggerFileInput = () => { fileInputRef.current?.click(); };

  return (
    <div className="flex h-screen antialiased bg-slate-900 text-slate-100">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        recentPdfs={recentPdfs}
        currentPdfName={pdfFileName}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-slate-800 text-white p-4 shadow-md z-10 flex-shrink-0">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-semibold">ArtAI</h1>
            <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            <button
              onClick={triggerFileInput}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              disabled={isLoadingAiResponse || isSummarizing}
            >
              {pdfFile ? "Change PDF" : "Open PDF"}
            </button>
          </div>
        </header>

        {error && (<div className="bg-red-500 text-white p-3 text-center flex-shrink-0"><p>{error}</p></div>)}

        <main className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col bg-slate-700 p-1 overflow-hidden">
            {pdfFile ? (
              <PdfViewer
                file={pdfFile} fileName={pdfFileName} currentPageNumber={currentPageNumber} numPages={numPages}
                onPageChange={handlePageChange} onLoadSuccess={handleLoadSuccess}
                isExtractingPageText={isExtractingText} isSummarizing={isSummarizing}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 mb-4 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                <h2 className="text-2xl font-semibold mb-2">No PDF Selected</h2>
                <p className="text-lg">Use the "Open PDF" button to get started.</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-2/5 md:w-1/3 lg:w-1/4 xl:max-w-md flex-shrink-0 flex flex-col border-l border-slate-700 bg-slate-800">
            <ChatInterface
              messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isLoadingAiResponse}
              isPdfLoaded={!!pdfFile} currentPageForContext={pdfFile ? currentPageNumber : undefined}
              isExtractingContext={isExtractingText}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
