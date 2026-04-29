import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Camera, AlertTriangle } from "lucide-react";

interface BarcodeScannerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (errorMessage: string) => void;
}

export function BarcodeScanner({
    open,
    onOpenChange,
    onScanSuccess,
    onScanError,
}: BarcodeScannerProps) {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        let scanner: Html5Qrcode | null = null;
        let isMounted = true;

        const startScanner = async () => {
            if (!open) return;

            // Wait for dialog animation and DOM readiness
            await new Promise(r => setTimeout(r, 300));

            // Element check
            const elementId = "barcode-scanner-reader";
            if (!document.getElementById(elementId)) {
                console.error("Scanner element not found");
                return;
            }

            try {
                // Initialize scanner with verbose logging for debugging
                scanner = new Html5Qrcode(elementId, { verbose: true });
                scannerRef.current = scanner;

                // Check cameras first
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    const cameraId = devices[0].id; // Use the first available camera

                    if (!isMounted) return;

                    await scanner.start(
                        cameraId,
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                        },
                        (decodedText) => {
                            if (isMounted) {
                                onScanSuccess(decodedText);
                                onOpenChange(false);
                            }
                        },
                        (errorMessage) => {
                            // console.log(errorMessage); // ignore frame errors
                        }
                    );
                } else {
                    if (isMounted) setError("No camera detected");
                }
            } catch (err: any) {
                console.error("Scanner error:", err);
                if (isMounted) {
                    if (err?.name === "NotAllowedError" || err?.message?.includes("permission")) {
                        setError("Camera permission denied. Please allow camera access in your browser settings.");
                    } else if (err?.name === "NotFoundError") {
                        setError("No camera found on this device.");
                    } else {
                        setError(`Failed to start camera: ${err?.message || "Unknown error"}`);
                    }
                }
            }
        };

        if (open) {
            setError(null);
            startScanner();
        }

        return () => {
            isMounted = false;
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
                    <DialogTitle className="text-[14px] font-bold text-white uppercase tracking-[1px] flex items-center gap-2">
                        <Camera className="h-4 w-4 text-[#DA291C]" />
                        Scan Barcode
                    </DialogTitle>
                    <button onClick={() => onOpenChange(false)} className="text-[#555555] hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                
                <div className="p-6 flex flex-col items-center justify-center space-y-6">
                    {error ? (
                        <div className="text-center p-8 bg-[#DA291C]/5 border border-[#DA291C]/20 rounded-[2px] text-[#DA291C] w-full">
                            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="text-[12px] font-bold uppercase tracking-[1px]">Scanner Error</p>
                            <p className="text-[11px] mt-2 opacity-80 leading-relaxed">{error}</p>
                        </div>
                    ) : (
                        <div className="relative w-full aspect-square max-w-[320px] mx-auto overflow-hidden rounded-[2px] border border-[#1A1A1A] bg-black group">
                            <div id="barcode-scanner-reader" className="w-full h-full"></div>
                            {/* Decorative corner accents for scanner feel */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#DA291C] rounded-tl-[2px]" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#DA291C] rounded-tr-[2px]" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#DA291C] rounded-bl-[2px]" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#DA291C] rounded-br-[2px]" />
                        </div>
                    )}
                    
                    <button
                        className="w-full h-10 border border-[#1A1A1A] text-[#8F8F8F] hover:text-white hover:bg-[#1A1A1A] text-[11px] uppercase tracking-[1px] rounded-[2px] transition-all"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
