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
    
    // Create a clone of the element to avoid iframe issues
    const clonedElement = target.cloneNode(true) as HTMLElement;
    
    // Copy computed styles to the clone
    const copyStyles = (original: HTMLElement, clone: HTMLElement) => {
      const computedStyle = window.getComputedStyle(original);
      const cloneStyle = clone.style;
      
      // Copy important styles
      cloneStyle.width = computedStyle.width;
      cloneStyle.height = computedStyle.height;
      cloneStyle.backgroundColor = computedStyle.backgroundColor;
      cloneStyle.color = computedStyle.color;
      cloneStyle.fontFamily = computedStyle.fontFamily;
      cloneStyle.fontSize = computedStyle.fontSize;
      cloneStyle.fontWeight = computedStyle.fontWeight;
      cloneStyle.padding = computedStyle.padding;
      cloneStyle.margin = computedStyle.margin;
      cloneStyle.border = computedStyle.border;
      cloneStyle.borderRadius = computedStyle.borderRadius;
      cloneStyle.display = computedStyle.display;
      cloneStyle.flexDirection = computedStyle.flexDirection;
      cloneStyle.justifyContent = computedStyle.justifyContent;
      cloneStyle.alignItems = computedStyle.alignItems;
      cloneStyle.gridTemplateColumns = computedStyle.gridTemplateColumns;
      cloneStyle.gap = computedStyle.gap;
      
      // Process children
      const originalChildren = Array.from(original.children);
      const cloneChildren = Array.from(clone.children);
      
      originalChildren.forEach((originalChild, index) => {
        const cloneChild = cloneChildren[index];
        if (originalChild instanceof HTMLElement && cloneChild instanceof HTMLElement) {
          copyStyles(originalChild, cloneChild);
        }
      });
    };
    
    copyStyles(target, clonedElement);
    
    // Remove all interactive elements from the clone
    const removeInteractiveElements = (element: HTMLElement) => {
      const interactiveSelectors = [
        'button', 'input', 'select', 'textarea', 'a[href]',
        '[onclick]', '[onchange]', '[onmouseover]', '[onmouseout]'
      ];
      
      interactiveSelectors.forEach(selector => {
        const elements = element.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      
      // Process children
      Array.from(element.children).forEach(child => {
        if (child instanceof HTMLElement) {
          removeInteractiveElements(child);
        }
      });
    };
    
    removeInteractiveElements(clonedElement);
    
    // Temporarily add the clone to the DOM (hidden)
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '-9999px';
    clonedElement.style.visibility = 'hidden';
    clonedElement.style.zIndex = '-1';
    document.body.appendChild(clonedElement);
    
    let canvas: HTMLCanvasElement;
    try {
      // Render the cloned element
      canvas = await html2canvas(clonedElement, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        foreignObjectRendering: false,
        removeContainer: false
      });
      
      // Remove the clone from DOM
      document.body.removeChild(clonedElement);
    } catch (error) {
      // Clean up clone if error occurs
      if (document.body.contains(clonedElement)) {
        document.body.removeChild(clonedElement);
      }
      throw error;
    }
    
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


