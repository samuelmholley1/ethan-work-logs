'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import ExportProgress from './ui/ExportProgress';

interface PDFDownloadLinkProps {
  href: string;
  filename: string;
  children: React.ReactNode;
  className?: string;
}

// Global flag to prevent concurrent PDF generation
let isPDFGenerating = false;

type ProgressStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  message?: string;
  error?: string;
};

export function PDFDownloadLink({ href, filename, children, className }: PDFDownloadLinkProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [steps, setSteps] = useState<ProgressStep[]>([
    { id: 'fetch', label: 'Fetching data from Airtable', status: 'pending' },
    { id: 'render', label: 'Rendering PDF template', status: 'pending' },
    { id: 'generate', label: 'Generating PDF file', status: 'pending' },
    { id: 'download', label: 'Preparing download', status: 'pending' }
  ]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isGenerating || isPDFGenerating) {
      if (isPDFGenerating) {
        toast.error('Another PDF is currently generating. Please wait.');
      }
      return;
    }
    
    // Check if user is offline
    if (!navigator.onLine) {
      toast.error('PDF generation requires an internet connection. Please connect to the internet and try again.');
      return;
    }
    
    setIsGenerating(true);
    isPDFGenerating = true;
    setShowProgress(true);
    
    // Reset steps
    setSteps([
      { id: 'fetch', label: 'Fetching data from Airtable', status: 'pending' },
      { id: 'render', label: 'Rendering PDF template', status: 'pending' },
      { id: 'generate', label: 'Generating PDF file', status: 'pending' },
      { id: 'download', label: 'Preparing download', status: 'pending' }
    ]);
    
    try {
      // Step 1: Fetch data
      setSteps(prev => prev.map(s => s.id === 'fetch' ? { ...s, status: 'active', message: 'Retrieving work sessions...' } : s));
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      
      const response = await fetch(href);
      
      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }
      
      setSteps(prev => prev.map(s => 
        s.id === 'fetch' ? { ...s, status: 'completed', message: 'Data retrieved successfully' } :
        s.id === 'render' ? { ...s, status: 'active', message: 'Building PDF layout...' } : s
      ));
      
      // Step 2: Render (simulated - server is doing this)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSteps(prev => prev.map(s => 
        s.id === 'render' ? { ...s, status: 'completed', message: 'Template rendered' } :
        s.id === 'generate' ? { ...s, status: 'active', message: 'Creating PDF document...' } : s
      ));
      
      // Step 3: Generate
      const blob = await response.blob();
      
      setSteps(prev => prev.map(s => 
        s.id === 'generate' ? { ...s, status: 'completed', message: 'PDF created successfully' } :
        s.id === 'download' ? { ...s, status: 'active', message: 'Initiating download...' } : s
      ));
      
      // Step 4: Download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSteps(prev => prev.map(s => 
        s.id === 'download' ? { ...s, status: 'completed', message: 'Download started' } : s
      ));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      
      // Mark current active step as error
      setSteps(prev => prev.map(s => 
        s.status === 'active' ? { 
          ...s, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'An error occurred'
        } : s
      ));
      
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.'
      );
    } finally {
      setIsGenerating(false);
      isPDFGenerating = false;
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className={`${className} ${isGenerating ? 'opacity-50 cursor-wait' : ''}`}
      >
        {isGenerating ? '⏳ Generating...' : children}
      </button>

      <ExportProgress
        isOpen={showProgress}
        onClose={() => setShowProgress(false)}
        steps={steps}
        title="Generating PDF"
      />
    </>
  );
}
