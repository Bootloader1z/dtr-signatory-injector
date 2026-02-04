# DTR Signatory Injector

Inject Head Officer signatory name into DTR MHTML files and export to PDF.

## Quick Start (Docker)

```bash
docker-compose up --build
```

Access: http://localhost:3000

## Usage

1. Upload DTR MHTML file (exported from intranet)
2. Enter Head Officer name (default: ENGR. GEORGE P. TARDIO)
3. Click "Inject & Download" to get signed PDF

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── server.js              # Express API server
│   │   └── services/
│   │       └── signatoryInjector.js  # Core logic
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # React UI
│   │   ├── api.js                 # API client
│   │   └── index.css              # Styles
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## API

**POST** `/api/inject-signatory`
- Body: `multipart/form-data`
  - `file`: MHTML file
  - `signatoryName`: Head Officer name (optional)
- Response: PDF file
