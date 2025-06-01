
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import PdfViewer from './components/PdfViewer';
import ChatInterface from './components/ChatInterface';
import { sendMessageToGemini } from './services/geminiService';
import type { ChatMessage } from './types';

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [currentPageText, setCurrentPageText] = useState<string>('');
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfFileName(file.name);
      setCurrentPageNumber(1);
      setNumPages(0);
      setPdfProxy(null);
      setCurrentPageText('');
      setChatMessages([]); // Reset chat on new PDF
      setError(null);
    } else {
      setPdfFile(null);
      setPdfFileName('');
      setError('Please select a valid PDF file.');
    }
  };

  const handleLoadSuccess = useCallback((loadedPdfProxy: PDFDocumentProxy) => {
    setPdfProxy(loadedPdfProxy);
    setNumPages(loadedPdfProxy.numPages);
    setCurrentPageNumber(1); // Ensure it's page 1 on new load
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage > 0 && newPage <= numPages) {
      setCurrentPageNumber(newPage);
    }
  }, [numPages]);

  useEffect(() => {
    if (pdfProxy && currentPageNumber > 0 && currentPageNumber <= numPages) {
      setIsExtractingText(true);
      setError(null); // Clear previous errors
      pdfProxy.getPage(currentPageNumber).then(page => {
        return page.getTextContent();
      }).then(textContent => {
        const text = textContent.items.map(item => (item as TextItem).str).join(' ');
        setCurrentPageText(text);
      }).catch(err => {
        console.error("Error extracting text from PDF page:", err);
        setCurrentPageText('');
        setError(`Failed to extract text from page ${currentPageNumber}. Some PDFs may not allow text extraction.`);
      }).finally(() => {
        setIsExtractingText(false);
      });
    } else if (!pdfProxy) {
        setCurrentPageText(''); // Clear text if no PDF
    }
  }, [pdfProxy, currentPageNumber, numPages]);


  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsLoadingAiResponse(true);
    setError(null);

    let prompt = messageText;
    if (currentPageText && pdfFile) {
      prompt = `Context from PDF document "${pdfFileName}", page ${currentPageNumber} of ${numPages}:\n---\n${currentPageText}\n---\n\nUser's question: ${messageText}`;
    } else if (pdfFile) {
      prompt = `Regarding PDF document "${pdfFileName}" (content of current page ${currentPageNumber} could not be extracted or is empty).\n\nUser's question: ${messageText}`;
    }
    
    try {
      const aiResponseText = await sendMessageToGemini(prompt);
      const newAiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (err) {
      console.error("Error getting AI response:", err);
      const errorText = err instanceof Error ? err.message : "An unknown error occurred with the AI.";
      setError(`AI Error: ${errorText}`);
      const errorAiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        text: `Sorry, I encountered an error: ${errorText}`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoadingAiResponse(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-screen antialiased">
      <header className="bg-slate-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">PDF AI Chat Analyzer</h1>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            onClick={triggerFileInput}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
          >
            {pdfFile ? "Change PDF" : "Open PDF"}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500 text-white p-3 text-center">
          <p>{error}</p>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        <div className="w-3/4 flex flex-col bg-slate-700 p-1 overflow-hidden">
          {pdfFile ? (
            <PdfViewer
              file={pdfFile}
              fileName={pdfFileName}
              currentPageNumber={currentPageNumber}
              numPages={numPages}
              onPageChange={handlePageChange}
              onLoadSuccess={handleLoadSuccess}
              isExtractingPageText={isExtractingText}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 mb-4 opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <h2 className="text-2xl font-semibold mb-2">No PDF Selected</h2>
              <p className="text-lg text-center">Please open a PDF file using the button in the header to begin.</p>
            </div>
          )}
        </div>

        <div className="w-1/4 flex flex-col border-l border-slate-700 bg-slate-800">
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingAiResponse}
            isPdfLoaded={!!pdfFile}
            currentPageForContext={pdfFile ? currentPageNumber : undefined}
            isExtractingContext={isExtractingText}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
