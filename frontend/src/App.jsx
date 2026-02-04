import { useState } from 'react';
import { convertWithSignatory } from './api';
import './index.css';

const DEFAULT_SIGNATORY = 'ENGR. GEORGE P. TARDIO';

function App() {
  const [file, setFile] = useState(null);
  const [signatoryName, setSignatoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return setError('Please select a file');

    setLoading(true);
    setError(null);

    try {
      const nameToUse = signatoryName.trim() || DEFAULT_SIGNATORY;
      const pdfBlob = await convertWithSignatory(file, nameToUse);
      
      // Download the PDF
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.mhtml?$/i, '') + '_signed.pdf';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.contains(a) && document.body.removeChild(a);
      }, 100);
      
      setFile(null);
      setSignatoryName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>DTR Signatory Injector</h1>
        <p className="subtitle">Inject Head Officer name into DTR MHTML</p>

        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input"
            accept=".mhtml,.mht"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="upload-label">
            {file ? (
              <>
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="file-name">{file.name}</span>
              </>
            ) : (
              <>
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Drop DTR MHTML file here or click to browse</span>
              </>
            )}
          </label>
        </div>

        <div className="signatory-input">
          <label htmlFor="signatory">Head Officer Name:</label>
          <input
            type="text"
            id="signatory"
            value={signatoryName}
            onChange={(e) => setSignatoryName(e.target.value)}
            placeholder={`Default: ${DEFAULT_SIGNATORY}`}
          />
        </div>

        {error && (
          <div className="error">
            <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          className="convert-btn"
          onClick={handleConvert}
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            'Inject & Download'
          )}
        </button>
      </div>
    </div>
  );
}

export default App;
