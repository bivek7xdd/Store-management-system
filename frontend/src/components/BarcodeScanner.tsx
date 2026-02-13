import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";

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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Scan Barcode
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                    {error ? (
                        <div className="text-center p-8 bg-red-50 rounded-xl text-red-600 w-full">
                            <X className="h-12 w-12 mx-auto mb-2" />
                            <p className="font-medium">Scanner Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    ) : (
                        <div
                            id="barcode-scanner-reader"
                            className="w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-black"
                            style={{ minHeight: "300px", width: "100%" }}
                        ></div>
                    )}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
