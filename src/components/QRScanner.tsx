import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().then(() => {
          onScan(decodedText);
        });
      },
      () => {}
    ).catch((err) => {
      setError('Camera access denied. Please allow camera permissions.');
      console.error(err);
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Scan QR Code
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div id="qr-reader" className="rounded-xl overflow-hidden border border-border" />
        {error && <p className="text-destructive text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
