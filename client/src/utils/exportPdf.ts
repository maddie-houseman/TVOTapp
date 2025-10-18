// Export DOM element to PDF using html2canvas + jsPDF

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
      // Check if already loaded
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
    // Load CDN libraries
    await load('https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js');
    await load('https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js');

    // Initialize libraries
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

    // Preprocess CSS for PDF compatibility
    const preprocessElement = (element: HTMLElement) => {
      const computedStyle = window.getComputedStyle(element);
      const style = element.style;
      
      // Fix color compatibility
      if (computedStyle.color && computedStyle.color.includes('oklch')) {
        style.color = '#000000';
      }
      if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
        style.backgroundColor = '#ffffff';
      }
      if (computedStyle.borderColor && computedStyle.borderColor.includes('oklch')) {
        style.borderColor = '#000000';
      }
      
      // Preserve chart colors
      if (element.classList.contains('bg-blue-500')) {
        style.backgroundColor = '#3b82f6';
      }
      if (element.classList.contains('bg-green-500')) {
        style.backgroundColor = '#10b981';
      }
      if (element.classList.contains('bg-red-500')) {
        style.backgroundColor = '#ef4444';
      }
      if (element.classList.contains('bg-purple-500')) {
        style.backgroundColor = '#8b5cf6';
      }
      if (element.classList.contains('bg-orange-500')) {
        style.backgroundColor = '#f97316';
      }
      if (element.classList.contains('bg-yellow-500')) {
        style.backgroundColor = '#eab308';
      }
      if (element.classList.contains('bg-cyan-500')) {
        style.backgroundColor = '#06b6d4';
      }
      if (element.classList.contains('bg-sky-500')) {
        style.backgroundColor = '#0ea5e9';
      }
      
      // Preserve graph styling
      if (element.style.height && element.style.height.includes('px')) {
        style.height = element.style.height;
      }
      if (element.classList.contains('flex') && element.classList.contains('items-end')) {
        style.display = 'flex';
        style.alignItems = 'flex-end';
      }
      
      // Preserve emoji sizing - ensure consistent emoji size
      if (element.tagName === 'SPAN' && element.textContent && /[\u{1F300}-\u{1F9FF}]/u.test(element.textContent)) {
        style.fontSize = '14px';
        style.lineHeight = '1';
        style.display = 'inline-block';
        style.width = '16px';
        style.height = '16px';
        style.textAlign = 'center';
      }
      
      // Process children
      Array.from(element.children).forEach(child => {
        if (child instanceof HTMLElement) {
          preprocessElement(child);
        }
      });
    };

    // Preprocess element
    preprocessElement(target);

    const { html2canvas, jsPDF } = await loadFromCdn();
    
    // Hide interactive elements
    const interactiveElements = target.querySelectorAll('button, input, select, textarea, a[href], [onclick], [onchange]');
    const originalStyles: string[] = [];
    
    interactiveElements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      originalStyles[index] = htmlElement.style.display;
      htmlElement.style.display = 'none';
    });
    
    let canvas: HTMLCanvasElement;
    try {
      // Render the original element directly
      canvas = await html2canvas(target, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        foreignObjectRendering: false,
        removeContainer: false,
        width: target.scrollWidth,
        height: target.scrollHeight
      });
    } finally {
      // Restore styles
      interactiveElements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.display = originalStyles[index];
      });
    }
    
    // Create PDF
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    

    // Scale to fit page
    const imgWidth = pageWidth - 40; // 20pt margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    

    let y = 20;
    let remaining = imgHeight;
    let sourceY = 0;
    const sliceHeightPx = Math.floor((canvas.width * (pageHeight - 40)) / imgWidth);
    let pageCount = 1;

    // Handle multi-page content
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


