import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [hasCamera, setHasCamera] = useState<boolean | null>(null);

    useEffect(() => {
        if (open) {
            // Check for camera existence
            navigator.mediaDevices.enumerateDevices().then((devices) => {
                const videoInputDevices = devices.filter(
                    (device) => device.kind === "videoinput"
                );
                setHasCamera(videoInputDevices.length > 0);

                if (videoInputDevices.length > 0) {
                    // Small delay to ensure the container is in the DOM
                    setTimeout(() => {
                        const scanner = new Html5QrcodeScanner(
                            "barcode-scanner-reader",
                            {
                                fps: 10,
                                qrbox: { width: 250, height: 250 },
                                formatsToSupport: [
                                    Html5QrcodeSupportedFormats.EAN_13,
                                    Html5QrcodeSupportedFormats.EAN_8,
                                    Html5QrcodeSupportedFormats.UPC_A,
                                    Html5QrcodeSupportedFormats.UPC_E,
                                    Html5QrcodeSupportedFormats.CODE_128,
                                    Html5QrcodeSupportedFormats.CODE_39,
                                    Html5QrcodeSupportedFormats.ITF,
                                    Html5QrcodeSupportedFormats.QR_CODE,
                                ],
                            },
                            false
                        );

                        scanner.render(
                            (decodedText) => {
                                onScanSuccess(decodedText);
                                onOpenChange(false);
                            },
                            (errorMessage) => {
                                if (onScanError) onScanError(errorMessage);
                            }
                        );

                        scannerRef.current = scanner;
                    }, 100);
                }
            });
        } else {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error) => {
                    console.error("Failed to clear scanner:", error);
                });
                scannerRef.current = null;
            }
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error) => {
                    console.error("Failed to clear scanner:", error);
                });
                scannerRef.current = null;
            }
        };
    }, [open, onOpenChange, onScanSuccess, onScanError]);

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
                    {hasCamera === false ? (
                        <div className="text-center p-8 bg-red-50 rounded-xl text-red-600">
                            <X className="h-12 w-12 mx-auto mb-2" />
                            <p className="font-medium">No camera detected</p>
                            <p className="text-sm">Please ensure you have a webcam or are using a mobile device.</p>
                        </div>
                    ) : (
                        <div
                            id="barcode-scanner-reader"
                            className="w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-200"
                            style={{ minHeight: "300px" }}
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
