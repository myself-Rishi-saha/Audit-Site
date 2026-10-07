"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Video,
  RefreshCw,
  Check,
  X,
  Square,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CameraMode = "photo" | "video";

interface CameraCaptureProps {
  mode?: CameraMode;
  reportId: string;
  onUse: (item: any) => void;
  onCancel: () => void;
}

export function CameraCapture({
  mode = "photo",
  reportId,
  onUse,
  onCancel,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  const [recording, setRecording] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Stop camera
  // --------------------------------------------------

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }

  // --------------------------------------------------
  // Start camera
  // --------------------------------------------------

  async function startCamera() {
    try {
      setLoading(true);
      setError("");
      setCameraReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Camera access is not available. Please use localhost or HTTPS.",
        );
        setLoading(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: mode === "video",
      });

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) {
        stream.getTracks().forEach((track) => track.stop());

        setError("Camera preview is unavailable.");
        setLoading(false);

        return;
      }

      video.srcObject = stream;

      video.onloadedmetadata = async () => {
        try {
          await video.play();

          setCameraReady(true);
          setLoading(false);

          console.log("Camera ready");
        } catch (err) {
          console.error("VIDEO PLAY ERROR:", err);

          setError("Unable to start camera preview.");
          setLoading(false);
        }
      };
    } catch (err) {
      console.error("CAMERA ERROR:", err);

      setCameraReady(false);
      setLoading(false);

      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
            setError(
              "Camera permission was denied. Please allow camera access in your browser.",
            );
            break;

          case "NotFoundError":
            setError("No camera was found on this device.");
            break;

          case "NotReadableError":
            setError(
              "The camera is already being used by another application.",
            );
            break;

          case "SecurityError":
            setError(
              "Camera access was blocked because this page is not using a secure connection.",
            );
            break;

          case "AbortError":
            setError("Camera access was interrupted. Please try again.");
            break;

          default:
            setError(`Unable to access camera: ${err.name}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to access camera.");
      }
    }
  }

  // --------------------------------------------------
  // Start camera when component opens
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function initializeCamera() {
      if (cancelled) return;

      await startCamera();
    }

    initializeCamera();

    return () => {
      cancelled = true;

      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }

      stopCamera();

      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };

    // We intentionally only want this when mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // --------------------------------------------------
  // Capture photo / start-stop video
  // --------------------------------------------------

  function capture() {
    const video = videoRef.current;

    if (!video) {
      setError("Camera preview is not available.");
      return;
    }

    if (!cameraReady) {
      setError("Camera is still starting. Please wait.");
      return;
    }

    if (video.readyState < 2) {
      setError("Camera preview is not ready yet.");
      return;
    }

    // ==================================================
    // PHOTO
    // ==================================================

    if (mode === "photo") {
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        setError("Unable to capture image. Camera has no video frame.");
        return;
      }

      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        setError("Unable to create image.");
        return;
      }

      try {
        context.drawImage(video, 0, 0, width, height);
      } catch (err) {
        console.error("DRAW IMAGE ERROR:", err);
        setError("Unable to capture image.");
        return;
      }

      canvas.toBlob(
        (capturedBlob) => {
          if (!capturedBlob) {
            setError("Failed to create image.");
            return;
          }

          const objectUrl = URL.createObjectURL(capturedBlob);

          setBlob(capturedBlob);
          setPreview(objectUrl);

          stopCamera();
        },
        "image/jpeg",
        0.9,
      );

      return;
    }

    // ==================================================
    // VIDEO
    // ==================================================

    if (!streamRef.current) {
      setError("Camera stream is not available.");
      return;
    }

    // Start recording
    if (!recording) {
      try {
        chunksRef.current = [];

        let mimeType = "";

        if (
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ) {
          mimeType = "video/webm;codecs=vp8,opus";
        } else if (
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported("video/webm")
        ) {
          mimeType = "video/webm";
        } else {
          mimeType = "";
        }

        const recorder = mimeType
          ? new MediaRecorder(streamRef.current, { mimeType })
          : new MediaRecorder(streamRef.current);

        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = (event) => {
          console.error("MEDIA RECORDER ERROR:", event);

          setRecording(false);
          setError("Video recording failed.");
        };

        recorder.onstop = () => {
          const finalType = recorder.mimeType || mimeType || "video/webm";

          const capturedBlob = new Blob(chunksRef.current, {
            type: finalType,
          });

          if (!capturedBlob.size) {
            setError("No video was recorded.");
            setRecording(false);
            return;
          }

          const objectUrl = URL.createObjectURL(capturedBlob);

          setBlob(capturedBlob);
          setPreview(objectUrl);

          setRecording(false);

          stopCamera();

          console.log("Video recorded:", capturedBlob.size);
        };

        recorder.start();

        setRecording(true);
        setError("");

        console.log("Recording started");
      } catch (err) {
        console.error("RECORDING ERROR:", err);

        setRecording(false);
        setError("Unable to start video recording.");
      }
    }

    // Stop recording
    else {
      try {
        recorderRef.current?.stop();

        console.log("Recording stopped");
      } catch (err) {
        console.error("STOP RECORDING ERROR:", err);

        setRecording(false);
        setError("Unable to stop recording.");
      }
    }
  }

  // --------------------------------------------------
  // Retake
  // --------------------------------------------------

  async function retake() {
    if (recording) {
      try {
        recorderRef.current?.stop();
      } catch {
        // Ignore
      }

      setRecording(false);
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setBlob(null);
    setError("");

    stopCamera();

    await startCamera();
  }

  // --------------------------------------------------
  // Upload captured media
  // --------------------------------------------------

  async function useMedia() {
    if (!blob) {
      setError("No media is available.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const isPhoto = mode === "photo";

      const fileName = isPhoto
        ? `capture-${Date.now()}.jpg`
        : `capture-${Date.now()}.webm`;

      const file = new File([blob], fileName, {
        type: blob.type || (isPhoto ? "image/jpeg" : "video/webm"),
      });

      const formData = new FormData();

      formData.append("file", file);
      formData.append("reportId", reportId);
      formData.append("type", mode);

      console.log("Uploading media:", {
        name: file.name,
        type: file.type,
        size: file.size,
        reportId,
        mode,
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        throw new Error("Upload API returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(result?.error || "Upload failed.");
      }

      console.log("UPLOAD SUCCESS:", result);

      // Normalize response so AuditForm always receives
      // either "image" or "video".
      const evidenceItem = {
        ...result,
        type: mode === "video" ? "video" : "image",
      };

      // Give uploaded evidence back to AuditForm
      onUse(evidenceItem);
    } catch (err) {
      console.error("UPLOAD ERROR:", err);

      setError(err instanceof Error ? err.message : "Failed to upload media.");
    } finally {
      setUploading(false);
    }
  }

  // --------------------------------------------------
  // Cancel
  // --------------------------------------------------

  function handleCancel() {
    if (recording) {
      try {
        recorderRef.current?.stop();
      } catch {
        // Ignore
      }
    }

    stopCamera();

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    onCancel();
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* HEADER */}
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2">
            {mode === "photo" ? (
              <Camera className="size-5" />
            ) : (
              <Video className="size-5" />
            )}

            {mode === "photo" ? "Capture Photo" : "Record Video"}
          </CardTitle>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={uploading}
          >
            <X className="size-5" />
          </Button>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <X className="mt-0.5 size-5 shrink-0 text-destructive" />

                <div>
                  <p className="font-semibold text-destructive">
                    {error.includes("permission") || error.includes("Camera")
                      ? "Camera unavailable"
                      : "Something went wrong"}
                  </p>

                  <p className="mt-1 text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              CAPTURED PREVIEW
          ================================================== */}

          {preview ? (
            <div className="space-y-4">
              {/* SUCCESS HEADER */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      {mode === "photo" ? "Photo captured" : "Video recorded"}
                    </p>

                    <p className="text-xs text-emerald-700">
                      Review the evidence before adding it.
                    </p>
                  </div>
                </div>

                <span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 sm:block">
                  Ready
                </span>
              </div>

              {/* MEDIA */}
              <div className="overflow-hidden rounded-xl border bg-black">
                {mode === "photo" ? (
                  <img
                    src={preview}
                    alt="Captured audit evidence"
                    className="max-h-[55vh] w-full object-contain"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    playsInline
                    className="max-h-[55vh] w-full"
                  />
                )}
              </div>

              {/* DESCRIPTION */}
              <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                <Check className="size-4 text-emerald-600" />

                <span>
                  {mode === "photo"
                    ? "This photo will be attached as audit evidence."
                    : "This video will be attached as audit evidence."}
                </span>
              </div>
            </div>
          ) : (
            /* ==================================================
               LIVE CAMERA
            ================================================== */

            <div className="space-y-3">
              {/* STATUS */}
              <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-2.5 rounded-full ${
                      cameraReady
                        ? "bg-emerald-500"
                        : "animate-pulse bg-amber-500"
                    }`}
                  />

                  <span className="text-sm font-medium">
                    {cameraReady ? "Camera ready" : "Starting camera..."}
                  </span>
                </div>

                {cameraReady && (
                  <span className="text-xs text-muted-foreground">
                    {mode === "photo"
                      ? "Ready to capture"
                      : recording
                        ? "Recording..."
                        : "Ready to record"}
                  </span>
                )}
              </div>

              {/* CAMERA PREVIEW */}
              <div className="relative overflow-hidden rounded-xl border bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="aspect-video w-full object-cover"
                />

                {/* LOADING */}
                {loading && (
                  <div className="absolute inset-0 grid place-items-center bg-black/60 text-white">
                    <div className="flex items-center gap-2 rounded-xl bg-black/60 px-5 py-3 text-sm backdrop-blur">
                      <Loader2 className="size-4 animate-spin" />
                      Starting camera...
                    </div>
                  </div>
                )}

                {/* LIVE */}
                {cameraReady && !recording && (
                  <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                    ● LIVE
                  </div>
                )}

                {/* RECORDING */}
                {recording && (
                  <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                    <span className="size-2 animate-pulse rounded-full bg-white" />
                    RECORDING
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
             BUTTONS
          ================================================== */}

          {preview ? (
            <div className="flex w-full justify-end gap-2">
              {/* RETAKE */}
              <Button
                type="button"
                variant="outline"
                onClick={retake}
                disabled={uploading}
              >
                <RefreshCw data-icon="inline-start" className="size-4" />
                Retake
              </Button>

              {/* USE */}
              <Button type="button" onClick={useMedia} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check data-icon="inline-start" className="size-4" />
                    Use {mode === "photo" ? "Photo" : "Video"}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-end gap-2">
              {/* CANCEL */}
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>

              {/* CAPTURE / RECORD */}
              <Button
                type="button"
                onClick={capture}
                disabled={!cameraReady || loading}
              >
                {mode === "photo" ? (
                  <Camera data-icon="inline-start" className="size-4" />
                ) : recording ? (
                  <Square data-icon="inline-start" className="size-4" />
                ) : (
                  <Video data-icon="inline-start" className="size-4" />
                )}

                {mode === "photo"
                  ? "Capture Photo"
                  : recording
                    ? "Stop Recording"
                    : "Start Recording"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

