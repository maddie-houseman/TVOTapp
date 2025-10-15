// client/src/utils/exportPdf.ts
// Export any DOM element to a PDF using html2canvas + jsPDF loaded from a CDN at runtime.
// Usage example (in a React page):
//   import { exportElementToPdf } from '../utils/exportPdf';
//   const onExport = () => exportElementToPdf(document.getElementById('dashboard-root')!, 'dashboard.pdf');

type LoadedLibs = {
  html2canvas: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  jsPDF: new (...args: unknown[]) => { 
    addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number, alias?: string, compression?: string) => void;
    addPage: () => void;
    save: (filename: string) => void;
    internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
    output: (type: string) => void;
  };
};

let cached: LoadedLibs | null = null;

async function loadFromCdn(): Promise<LoadedLibs> {
  if (cached) {
    return cached;
  }

  function load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${url}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = () => {
        resolve();
      };
      s.onerror = (error) => {
        console.error('Failed to load script:', url, error);
        reject(new Error(`Failed to load ${url}`));
      };
      document.head.appendChild(s);
    });
  }

  try {
    // Known good CDN builds
    // html2canvas v1.4.x and jsPDF v2.5.x
    await load('https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js');
    await load('https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js');

    // Wait a bit for libraries to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    const html2canvas = (window as unknown as { html2canvas: LoadedLibs['html2canvas'] }).html2canvas;
    const jsPDF = (window as unknown as { jspdf?: { jsPDF: LoadedLibs['jsPDF'] } }).jspdf?.jsPDF;
    
    if (!html2canvas) {
      throw new Error('html2canvas not found after loading');
    }
    if (!jsPDF) {
      throw new Error('jsPDF not found after loading');
    }
    
    cached = { html2canvas, jsPDF };
    return cached;
  } catch (error) {
    console.error('Failed to load libraries:', error);
    throw new Error(`Failed to load required libraries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function exportElementToPdf(target: HTMLElement, fileName = 'export.pdf'): Promise<void> {
  try {
    
    if (!target) {
      throw new Error('exportElementToPdf: target element is required');
    }

    // Preprocess CSS to convert unsupported color functions
    const preprocessElement = (element: HTMLElement) => {
      const computedStyle = window.getComputedStyle(element);
      const style = element.style;
      
      // Convert oklch colors to rgb
      if (computedStyle.color && computedStyle.color.includes('oklch')) {
        style.color = '#000000'; // Fallback to black
      }
      if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
        style.backgroundColor = '#ffffff'; // Fallback to white
      }
      if (computedStyle.borderColor && computedStyle.borderColor.includes('oklch')) {
        style.borderColor = '#000000'; // Fallback to black
      }
      
      // Process child elements
      Array.from(element.children).forEach(child => {
        if (child instanceof HTMLElement) {
          preprocessElement(child);
        }
      });
    };

    // Preprocess the target element and its children
    preprocessElement(target);

    const { html2canvas, jsPDF } = await loadFromCdn();
    // Render at higher scale for improved quality
    const canvas = await html2canvas(target, { 
      scale: 2, 
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      ignoreElements: (element) => {
        // Skip elements with problematic CSS
        const style = window.getComputedStyle(element);
        return style.color?.includes('oklch') || 
               style.backgroundColor?.includes('oklch') ||
               style.borderColor?.includes('oklch');
      }
    });
    
    // Create PDF with dimensions matching A4 portrait by default
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    

    // Fit image into page while keeping aspect ratio
    const imgWidth = pageWidth - 40; // 20pt margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    

    let y = 20;
    let remaining = imgHeight;
    let sourceY = 0;
    const sliceHeightPx = Math.floor((canvas.width * (pageHeight - 40)) / imgWidth);
    let pageCount = 1;

    // If the rendered content is longer than one page, slice and add new pages
    while (remaining > 0) {
      
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(sliceHeightPx, canvas.height - sourceY);
      const ctx = sliceCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context for slice');
      }
      
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height
      );
      const sliceDataUrl = sliceCanvas.toDataURL('image/png');

      const sliceRenderHeight = ((sliceCanvas.height) * imgWidth) / canvas.width;
      pdf.addImage(sliceDataUrl, 'PNG', 20, y, imgWidth, sliceRenderHeight, undefined, 'FAST');

      remaining -= sliceRenderHeight;
      sourceY += sliceHeightPx;

      if (remaining > 0) {
        pdf.addPage();
        y = 20;
        pageCount++;
      }
    }

    pdf.save(fileName);
    
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default { exportElementToPdf };


