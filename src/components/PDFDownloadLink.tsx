'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface PDFDownloadLinkProps {
  href: string;
  filename: string;
  children: React.ReactNode;
  className?: string;
}

export function PDFDownloadLink({ href, filename, children, className }: PDFDownloadLinkProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isGenerating) return;
    
    setIsGenerating(true);
    const toastId = toast.loading('Generating PDF... This may take 10-30 seconds');
    
    try {
      const response = await fetch(href);
      
      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
        { id: toastId }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`${className} ${isGenerating ? 'opacity-50 cursor-wait' : ''}`}
    >
      {isGenerating ? '⏳ Generating...' : children}
    </button>
  );
}
