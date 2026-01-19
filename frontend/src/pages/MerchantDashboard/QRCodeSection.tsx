// CSR26 Merchant QR Code Section Component
// Allows merchants to generate QR codes for their products
// RULE: Use HTML + Tailwind for layout, MUI only for interactive components

import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

interface QRCodeSectionProps {
  merchantId: string;
  merchantName?: string;
}

interface GeneratedQR {
  id: string;
  sku: string;
  name: string;
  url: string;
  qrImageUrl: string;
}

const QRCodeSection = ({ merchantId, merchantName: _merchantName }: QRCodeSectionProps) => {
  const [productName, setProductName] = useState('');
  const [skuCode, setSkuCode] = useState('');
  const [paymentMode, setPaymentMode] = useState<string>('CLAIM');
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Base URL for landing page
  const baseUrl = window.location.origin;

  // Generate QR code using QR Server API (free, no library needed)
  const generateQRCode = (url: string, size: number = 200): string => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  };

  // Handle QR generation
  const handleGenerateQR = () => {
    if (!productName.trim() || !skuCode.trim()) {
      return;
    }

    setIsGenerating(true);

    // Build landing page URL with merchant ID
    const landingUrl = `${baseUrl}/landing?sku=${encodeURIComponent(skuCode)}&merchant=${encodeURIComponent(merchantId)}`;

    const newQR: GeneratedQR = {
      id: `qr-${Date.now()}`,
      sku: skuCode.toUpperCase(),
      name: productName,
      url: landingUrl,
      qrImageUrl: generateQRCode(landingUrl, 200),
    };

    setGeneratedQRs([newQR, ...generatedQRs]);
    setProductName('');
    setSkuCode('');
    setIsGenerating(false);
  };

  // Download QR code image
  const handleDownloadQR = async (qr: GeneratedQR) => {
    try {
      // Fetch the QR image
      const response = await fetch(generateQRCode(qr.url, 400));
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `csr26-qr-${qr.sku}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(generateQRCode(qr.url, 400), '_blank');
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">QR Code Generator</h3>
        <p className="text-sm text-gray-500">
          Generate QR codes for your products. Each QR links to your branded landing page.
        </p>
      </div>

      {/* QR Generation Form */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <TextField
            label="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            size="small"
            placeholder="e.g., Organic Pasta"
            fullWidth
          />
          <TextField
            label="SKU Code"
            value={skuCode}
            onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
            size="small"
            placeholder="e.g., PASTA-001"
            fullWidth
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Payment Mode</InputLabel>
            <Select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              label="Payment Mode"
            >
              <MenuItem value="CLAIM">CLAIM (Prepaid)</MenuItem>
              <MenuItem value="PAY">PAY (Customer Pays)</MenuItem>
              <MenuItem value="ALLOCATION">ALLOCATION (E-commerce)</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleGenerateQR}
            disabled={!productName.trim() || !skuCode.trim() || isGenerating}
            sx={{ textTransform: 'none' }}
          >
            Generate QR
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-md p-4 mb-6">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How QR Codes Work</p>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Each QR code links to your branded CSR26 landing page</li>
                <li>Customers scan the QR to see their environmental impact</li>
                <li>All transactions are attributed to your merchant account</li>
                <li>You can print QR codes on product packaging, receipts, or displays</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Generated QR Codes */}
        {generatedQRs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Generated QR Codes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedQRs.map((qr) => (
                <div
                  key={qr.id}
                  className="border border-gray-200 rounded-md p-4 flex flex-col items-center"
                >
                  {/* QR Code Image */}
                  <img
                    src={qr.qrImageUrl}
                    alt={`QR Code for ${qr.name}`}
                    className="w-40 h-40 mb-3"
                  />

                  {/* Product Info */}
                  <p className="font-medium text-gray-800 text-center">{qr.name}</p>
                  <p className="text-xs text-gray-500 mb-3">SKU: {qr.sku}</p>

                  {/* Actions */}
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleDownloadQR(qr)}
                      sx={{ textTransform: 'none', flex: 1 }}
                    >
                      Download
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleCopyUrl(qr.url)}
                      sx={{ textTransform: 'none', flex: 1 }}
                    >
                      Copy URL
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {generatedQRs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m10 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p>No QR codes generated yet.</p>
            <p className="text-sm">Fill in the form above to create your first QR code.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeSection;
