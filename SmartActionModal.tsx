import React, { useState } from 'react';
import { parseInventoryCommand, ParsedInventoryAction } from './geminiService';

interface SmartActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: ParsedInventoryAction) => void;
}

export const SmartActionModal: React.FC<SmartActionModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedInventoryAction | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError('');
    setParsedResult(null);

    const result = await parseInventoryCommand(input);
    setIsLoading(false);

    if (result) {
      setParsedResult(result);
    } else {
      setError('Kon de opdracht niet begrijpen. Probeer het opnieuw met meer details.');
    }
  };

  const handleExecute = () => {
    if (parsedResult) {
      onConfirm(parsedResult);
      handleClose();
    }
  };

  const handleClose = () => {
    setInput('');
    setParsedResult(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Slimme Acties</h2>
              <p className="text-teal-100 text-sm">Mogelijk gemaakt door Gemini AI</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {!parsedResult ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Wat is er gebeurd?
                </label>
                <textarea
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-slate-800 placeholder:text-slate-400"
                  rows={4}
                  placeholder="Bijv., 'Net 2 flacons Pfizer gebruikt' of '50 dozen handschoenen ontvangen, exp 2025'"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAnalyze();
                      }
                  }}
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !input.trim()}
                  className={`
                    px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all
                    ${isLoading || !input.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 hover:shadow-teal-200'}
                  `}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Analyseren...
                    </span>
                  ) : 'Analyseer Opdracht'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Samenvatting</h3>
                <p className="text-slate-800 text-lg font-medium">{parsedResult.summary}</p>
                <div className={`inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${parsedResult.intent === 'RESTOCK' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  {parsedResult.intent === 'RESTOCK' ? 'AANVULLEN' : 'UITGEVEN'}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Toe te passen wijzigingen</h3>
                <div className="space-y-3">
                  {parsedResult.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <div className="text-xs text-slate-500 flex space-x-2">
                           {item.expiryDate && <span>Exp: {item.expiryDate}</span>}
                           {item.batchNumber && <span>Batch: {item.batchNumber}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${parsedResult.intent === 'RESTOCK' ? 'text-green-600' : 'text-orange-600'}`}>
                           {parsedResult.intent === 'RESTOCK' ? '+' : '-'}{item.quantity}
                        </span>
                        <span className="text-xs text-slate-500 block">{item.unit || 'stuks'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setParsedResult(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleExecute}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-200 transition-colors"
                >
                  Bevestigen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};