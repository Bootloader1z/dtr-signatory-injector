import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { injectSignatoryAndRenderPDF } from './services/signatoryInjector.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

const DEFAULT_SIGNATORY = 'ENGR. GEORGE P. TARDIO';

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Main endpoint - inject signatory and return PDF
app.post('/api/inject-signatory', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const signatoryName = req.body.signatoryName?.trim() || DEFAULT_SIGNATORY;
    const mhtmlContent = req.file.buffer.toString('utf-8');
    
    const pdfBuffer = await injectSignatoryAndRenderPDF(mhtmlContent, signatoryName);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname.replace(/\.mhtml?$/i, '')}_signed.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: error.message || 'Processing failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
