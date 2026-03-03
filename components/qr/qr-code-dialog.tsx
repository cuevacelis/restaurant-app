"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber?: number;
  label?: string;
  url: string;
}

export function QrCodeDialog({ open, onOpenChange, tableNumber, label, url }: QrCodeDialogProps) {
  const displayLabel = label ?? (tableNumber !== undefined ? `Mesa #${tableNumber}` : "Menú General");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getDataUrl = () => canvasRef.current?.toDataURL("image/png") ?? "";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = getDataUrl();
    a.download = `${tableNumber !== undefined ? `mesa-${tableNumber}` : "menu-general"}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    const dataUrl = getDataUrl();
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${displayLabel} - QR</title>
          <style>
            body {
              font-family: sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              gap: 16px;
            }
            h1 { font-size: 2rem; margin: 0; }
            p  { font-size: 0.9rem; color: #666; margin: 0; }
            img { width: 300px; height: 300px; }
          </style>
        </head>
        <body>
          <h1>${displayLabel}</h1>
          <img src="${dataUrl}" alt="QR ${displayLabel}" />
          <p>Escanea para ver el menú y hacer tu pedido</p>
          <p style="font-size:0.75rem;color:#999">${url}</p>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <DialogTitle>QR — {displayLabel}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl border p-3 bg-white shadow-sm">
            {url ? (
              <QRCodeCanvas
                ref={canvasRef}
                value={url}
                size={280}
                level="H"
                marginSize={2}
              />
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground text-center break-all px-2">{url}</p>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
              disabled={!url}
            >
              <Download className="h-4 w-4 mr-1" />
              Descargar
            </Button>
            <Button
              className="flex-1"
              onClick={handlePrint}
              disabled={!url}
            >
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
