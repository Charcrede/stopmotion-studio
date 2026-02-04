import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { exec } from "child_process";

export const runtime = "nodejs"; // pour activer fs et exec côté serveur

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { frames, fps } = body as { frames: string[]; fps: number };
    console.log("Received frames:", frames.length, "FPS:", fps);
    if (!frames || frames.length === 0) {
      return NextResponse.json({ success: false, message: "No frames provided" }, { status: 400 });
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "stopmotion-"));
    console.log("Temporary directory created at:", tmpDir);
    frames.forEach((frame, i) => {
      const base64Data = frame.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(path.join(tmpDir, `frame${i}.png`), Buffer.from(base64Data, "base64"));
    });
    console.log("Frames written to temporary directory.");
    const outputPath = path.join(tmpDir, "output.mp4");

    const ffmpegCmd = `"${ffmpegPath.path}" -y -framerate ${fps} -i ${tmpDir}/frame%d.png -c:v libx264 -crf 18 -pix_fmt yuv420p ${outputPath}`;
await new Promise<void>((resolve, reject) => {
  exec(ffmpegCmd, (err, stdout, stderr) => {
    if (err) reject(err);
    else resolve();
  });
});

    const mp4Data = fs.readFileSync(outputPath);

    // Réponse MP4
    return new Response(mp4Data, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="stopmotion.mp4"',
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
