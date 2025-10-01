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
    console.log('Using cached libraries');
    return cached;
  }

  console.log('Loading libraries from CDN...');

  function load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${url}"]`);
      if (existingScript) {
        console.log('Script already loaded:', url);
        resolve();
        return;
      }

      const s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = () => {
        console.log('Successfully loaded:', url);
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
    console.log('Loading html2canvas...');
    await load('https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js');
    
    console.log('Loading jsPDF...');
    await load('https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js');

    // Wait a bit for libraries to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Checking for loaded libraries...');
    const html2canvas = (window as unknown as { html2canvas: LoadedLibs['html2canvas'] }).html2canvas;
    const jsPDF = (window as unknown as { jspdf?: { jsPDF: LoadedLibs['jsPDF'] } }).jspdf?.jsPDF;
    
    console.log('html2canvas available:', !!html2canvas);
    console.log('jsPDF available:', !!jsPDF);
    
    if (!html2canvas) {
      throw new Error('html2canvas not found after loading');
    }
    if (!jsPDF) {
      throw new Error('jsPDF not found after loading');
    }
    
    cached = { html2canvas, jsPDF };
    console.log('Libraries cached successfully');
    return cached;
  } catch (error) {
    console.error('Failed to load libraries:', error);
    throw new Error(`Failed to load required libraries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function exportElementToPdf(target: HTMLElement, fileName = 'export.pdf'): Promise<void> {
  try {
    console.log('Starting PDF export for:', fileName);
    
    if (!target) {
      throw new Error('exportElementToPdf: target element is required');
    }

    console.log('Loading libraries from CDN...');
    const { html2canvas, jsPDF } = await loadFromCdn();

    console.log('Rendering element to canvas...');
    // Render at higher scale for improved quality
    const canvas = await html2canvas(target, { 
      scale: 2, 
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false
    });
    
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    const imgData = canvas.toDataURL('image/png');
    console.log('Image data URL length:', imgData.length);

    console.log('Creating PDF...');
    // Create PDF with dimensions matching A4 portrait by default
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    console.log('PDF page dimensions:', pageWidth, 'x', pageHeight);

    // Fit image into page while keeping aspect ratio
    const imgWidth = pageWidth - 40; // 20pt margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    console.log('Calculated image dimensions:', imgWidth, 'x', imgHeight);

    let y = 20;
    let remaining = imgHeight;
    let sourceY = 0;
    const sliceHeightPx = Math.floor((canvas.width * (pageHeight - 40)) / imgWidth);
    let pageCount = 1;

    console.log('Starting multi-page rendering...');
    // If the rendered content is longer than one page, slice and add new pages
    while (remaining > 0) {
      console.log(`Processing page ${pageCount}, remaining height: ${remaining}`);
      
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

    console.log(`PDF created with ${pageCount} pages, saving as ${fileName}`);
    pdf.save(fileName);
    console.log('PDF export completed successfully');
    
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default { exportElementToPdf };


