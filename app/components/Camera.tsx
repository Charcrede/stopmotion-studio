"use client";

import { useEffect, useRef, useState } from "react";
import {
    Camera,
    Play,
    Square,
    Download,
    X
} from "lucide-react";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';




export default function CameraComponent() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [fps, setFps] = useState(12);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | undefined>();
    const streamRef = useRef<MediaStream | null>(null);
    const ffmpegRef = useRef(new FFmpeg());
const [ffmpegLoaded, setFfmpegLoaded] = useState(false);



    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoDevices = devices.filter(d => d.kind === "videoinput");
            setCameraDevices(videoDevices);
            if (videoDevices.length) setSelectedCamera(videoDevices[0].deviceId);
            console.log("Video devices:", videoDevices);
        });
    }, []);



    const [frames, setFrames] = useState<string[]>([]);
    let stream: MediaStream;

    const startCamera = async (deviceId?: string) => {
        try {
            // stop ancien stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // nouvelle config
            const constraints: MediaStreamConstraints = {
                video: deviceId
                    ? { deviceId: { exact: deviceId } }
                    : { facingMode: "environment" }, // arrière par défaut si pas précisé
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Erreur startCamera:", err);
        }
    };

    const drawPreview = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        // dessin de la vidéo en direct
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // onion skin (dernière frame)
        if (!isPlaying && frames.length > 0 && canvasRef.current) {
  const ctx = canvasRef.current.getContext("2d");
  if (!ctx) return;

  const lastFrame = new Image();
  lastFrame.src = frames[frames.length - 1];
  lastFrame.onload = () => {
    ctx.globalAlpha = 0.25;
    ctx.drawImage(lastFrame, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
    ctx.globalAlpha = 1;
  };
}

    };

    useEffect(() => {
        startCamera(selectedCamera);
        loadFFmpeg();
    }, []);

    useEffect(() => {
        let animFrame: number;
        const renderLoop = () => {
            drawPreview();
            animFrame = requestAnimationFrame(renderLoop);
        };
        renderLoop();

        return () => cancelAnimationFrame(animFrame);
    }, [frames, isPlaying]);



    useEffect(() => {
        if (!isPlaying || frames.length === 0) return;

        const interval = 1000 / fps;

        const id = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % frames.length);
        }, interval);

        return () => clearInterval(id);
    }, [isPlaying, frames, fps]);

async function loadFFmpeg() {
    if (ffmpegLoaded) return;
    
    const ffmpeg = ffmpegRef.current;
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    setFfmpegLoaded(true);
}

async function exportVideo() {
    if (frames.length === 0) return;
    
    setIsExporting(true);
    setVideoUrl(null);
    
    try {
        // Charger FFmpeg si pas encore fait
        await loadFFmpeg();
        
        const ffmpeg = ffmpegRef.current;
        
        // Convertir chaque frame en fichier pour FFmpeg
        for (let i = 0; i < frames.length; i++) {
            const response = await fetch(frames[i]);
            const blob = await response.blob();
            const fileName = `frame${i.toString().padStart(4, '0')}.png`;
            await ffmpeg.writeFile(fileName, await fetchFile(blob));
        }
        
        // Créer la vidéo MP4 avec FFmpeg
        // -framerate : ton fps
        // -i : pattern des images
        // -c:v libx264 : codec H.264
        // -pix_fmt yuv420p : format pixel compatible
        await ffmpeg.exec([
            '-framerate', fps.toString(),
            '-i', 'frame%04d.png',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            'output.mp4'
        ]);
        
        // Lire le fichier créé
        const data = await ffmpeg.readFile('output.mp4');
        
        // Créer le blob et télécharger
        const blob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "stopmotion-"+Date.now()+".mp4";
        a.click();
        URL.revokeObjectURL(url);
        
        // Nettoyer les fichiers temporaires
        for (let i = 0; i < frames.length; i++) {
            const fileName = `frame${i.toString().padStart(4, '0')}.png`;
            await ffmpeg.deleteFile(fileName);
        }
        await ffmpeg.deleteFile('output.mp4');
        
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export de la vidéo');
    } finally {
        setIsExporting(false);
    }
}






    function captureFrame() {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;

        const width = video.videoWidth;
        const height = video.videoHeight;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/png");

        setFrames((prev) => [...prev, dataUrl]);
    }

    function removeFrame(index: number) {
        setFrames((prev) => prev.filter((_, i) => i !== index));
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4">
            <div className="w-full max-w-4xl bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-8">

                {/* HEADER */}
                <div className="text-center">
                    <h2 className="font-blanka text-2xl sm:text-3xl text-white">
                        Stop Motion Studio
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">
                        Capture image par image. Précision maximale.
                    </p>
                </div>

                {/* PREVIEW */}
                <div className="flex justify-center">
                    <div className="relative w-[90vw] max-w-md rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg" style={{
                        aspectRatio: videoRef.current
                            ? `${videoRef.current.videoWidth} / ${videoRef.current.videoHeight}`
                            : "1 / 1",
                    }}>
                        {!isPlaying ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />

                                {frames.length > 0 && (
                                    <img
                                        src={frames[frames.length - 1]}
                                        alt="Onion skin"
                                        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                                    />
                                )}
                            </>
                        ) : (
                            <img
                                src={frames[currentFrame]}
                                alt="Lecture animation"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-wrap justify-center gap-3">
                    <div className="relative w-60">
                        <select
                            value={selectedCamera}
                            onChange={e => {
                                setSelectedCamera(e.target.value);
                                startCamera(e.target.value);
                            }}
                            className="appearance-none w-full bg-[#1f1f1f] text-white px-4 py-2 rounded-xl border border-white/20 shadow-md hover:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition"
                        >
                            {cameraDevices.map(dev => (
                                <option key={dev.deviceId} value={dev.deviceId}>
                                    {dev.label || `Camera ${dev.deviceId}`}
                                </option>
                            ))}
                        </select>

                        {/* flèche custom */}
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>


                    <button
                        onClick={captureFrame}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl 
               bg-[#4F46E5] text-white font-semibold
               hover:scale-105 transition"
                    >
                        <Camera size={18} />
                        Frame ({frames.length})
                    </button>

                    <div className={`${frames.length < 5 ? "opacity-0" : "opacity-100"} flex items-center gap-3 transition-opacity`}>
                        <button
                            onClick={() => setIsPlaying(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   bg-white/10 text-white
                   hover:bg-white/20 transition"
                        >
                            <Play size={18} />
                            Play
                        </button>

                        <button
                            onClick={() => { setIsPlaying(false); startCamera(); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   bg-white/10 text-white
                   hover:bg-white/20 transition"
                        >
                            <Square size={18} />
                            Stop
                        </button>

                        <button
                            onClick={() => exportVideo()}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   bg-white text-black font-semibold
                   hover:bg-gray-200 transition
                   disabled:opacity-50"
                        >
                            <Download size={18} />
                            {isExporting ? "Export..." : "Exporter"}
                        </button>
                    </div>
                </div>


                {/* FPS */}
                {frames.length > 1 && (
                    <div className="max-w-md mx-auto w-full flex flex-col gap-2">
                        <label className="text-sm text-gray-400 text-center">
                            FPS : <span className="text-white font-semibold">{fps}</span>
                        </label>

                        <input
                            type="range"
                            min={5}
                            max={24}
                            value={fps}
                            onChange={(e) => setFps(Number(e.target.value))}
                            className="w-full accent-[#4F46E5]"
                        />
                    </div>
                )}

                {/* TIMELINE */}
                {frames.length > 0 && (
                    <div className="border-t border-white/10 pt-6">
                        <p className="text-xs text-gray-500 mb-3 uppercase tracking-widest">
                            Timeline — {frames.length} frames
                        </p>

                        <div className="timeline-scroll">
                            {frames.map((frame, index) => (
                                <div key={index} className="relative shrink-0 group">
                                    <img
                                        src={frame}
                                        alt={`Frame ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded-xl border border-white/10"
                                    />
                                    <button
                                        onClick={() => removeFrame(index)}
                                        className="absolute -top-1 -right-1 bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center transition"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                    </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>

    );
}
