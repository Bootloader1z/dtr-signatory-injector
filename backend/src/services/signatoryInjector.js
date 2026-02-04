import puppeteer from 'puppeteer';

/**
 * Inject Head Officer signatory name into DTR MHTML and render to PDF
 */
export async function injectSignatoryAndRenderPDF(mhtmlContent, signatoryName) {
  const injectedContent = injectSignatory(mhtmlContent, signatoryName);
  const { html, css } = parseMHTMLWithCSS(injectedContent);
  const pdfBuffer = await renderPDF(html, css);
  return pdfBuffer;
}

function injectSignatory(mhtmlContent, signatoryName) {
  return mhtmlContent.replace(
    /(<span>)(&nbsp;)(<\/span>[\s\S]{0,300}?Signature of the Head Officer)/gi,
    `$1${signatoryName}$3`
  );
}

function parseMHTMLWithCSS(mhtmlContent) {
  const boundaryMatch = mhtmlContent.match(/boundary="?([^"\s]+)"?/i);
  if (!boundaryMatch) return { html: mhtmlContent, css: '' };

  const boundary = boundaryMatch[1];
  const escapedBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = mhtmlContent.split(new RegExp(`--${escapedBoundary}`, 'g'));

  let html = '';
  let css = '';

  for (const part of parts) {
    if (!part.trim() || part.trim() === '--') continue;

    const headerEndIndex = part.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) continue;

    const headers = part.substring(0, headerEndIndex);
    const body = part.substring(headerEndIndex + 4);

    const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n;]+)/i);
    const encodingMatch = headers.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i);

    const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : '';
    const encoding = encodingMatch ? encodingMatch[1].trim().toLowerCase() : '';

    let decodedBody = body;
    if (encoding === 'quoted-printable') {
      decodedBody = decodeQuotedPrintable(body);
    } else if (encoding === 'base64') {
      decodedBody = Buffer.from(body.trim(), 'base64').toString('utf-8');
    }

    if (contentType.includes('text/html')) {
      html = decodedBody;
    } else if (contentType.includes('text/css')) {
      css += decodedBody + '\n';
    }
  }

  return { html, css };
}

function decodeQuotedPrintable(str) {
  return str
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

async function renderPDF(htmlContent, cssContent) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Block external resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Inject embedded CSS + DTR-specific print styles
    const printStyles = `
      <style>
        ${cssContent}
        
        /* DTR Print Styles */
        body { 
          font-family: Arial, sans-serif !important; 
          font-size: 11px !important;
          margin: 0 !important;
          padding: 10px !important;
        }
        .dtrtbl { 
          width: 100% !important; 
          border-collapse: collapse !important;
        }
        .dtrtd1 { 
          vertical-align: top !important; 
          padding: 10px !important;
          width: 50% !important;
        }
        .dtrtitle { 
          font-size: 14px !important; 
          font-weight: bold !important;
        }
        .dtrinnertbl { 
          width: 100% !important; 
        }
        .tblrows { 
          width: 100% !important; 
          border-collapse: collapse !important;
        }
        .border1heght15 { 
          border: 1px solid #000 !important; 
          padding: 2px 4px !important;
          height: 15px !important;
        }
        .borderbottom1heght15 { 
          border-bottom: 1px solid #000 !important; 
          padding: 2px 4px !important;
        }
        .centertext, center { 
          text-align: center !important; 
        }
        .fontsm { 
          font-size: 10px !important; 
        }
        .heght15 { 
          height: 15px !important; 
        }
        .totaltd { 
          text-align: right !important; 
          padding-right: 10px !important;
          font-weight: bold !important;
        }
        .iclarify { 
          font-size: 10px !important; 
          padding: 5px !important;
        }
        .centerh15fs { 
          text-align: center !important; 
          font-size: 10px !important;
        }
        .d1d1 { 
          background-color: #f0f0f0 !important; 
        }
        .floating-text, .posabsl100t0ml5 { 
          display: none !important; 
        }
        
        /* Hide browser extensions */
        grammarly-desktop-integration,
        grammarly-assistant-notch-view,
        [data-grammarly-shadow-root] {
          display: none !important;
        }
        
        @media print {
          body { margin: 0 !important; }
        }
      </style>
    `;

    // Insert styles into HTML
    let styledHtml = htmlContent;
    if (styledHtml.includes('</head>')) {
      styledHtml = styledHtml.replace('</head>', `${printStyles}</head>`);
    } else {
      styledHtml = printStyles + styledHtml;
    }

    await page.setContent(styledHtml, { 
      waitUntil: 'domcontentloaded',
      timeout: 120000 
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' },
      timeout: 120000
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
