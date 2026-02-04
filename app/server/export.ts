// pages/api/export.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import os from 'os';

type Data = {
  success: boolean;
  message?: string;
  mp4Url?: string;
};

export const config = {
  api: {
    bodyParser: { sizeLimit: '50mb' }, // pour gros frames
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { frames, fps } = req.body as { frames: string[]; fps: number };
    if (!frames || frames.length === 0) {
      return res.status(400).json({ success: false, message: 'No frames provided' });
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stopmotion-'));

    // Écrire les frames PNG dans tmpDir
    frames.forEach((frame, i) => {
      const base64Data = frame.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(tmpDir, `frame${i}.png`), Buffer.from(base64Data, 'base64'));
    });

    const outputPath = path.join(tmpDir, 'output.mp4');

    // Commande FFmpeg
    const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i ${tmpDir}/frame%d.png -c:v libx264 -crf 18 -pix_fmt yuv420p ${outputPath}`;

    await new Promise<void>((resolve, reject) => {
      exec(ffmpegCmd, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const mp4Data = fs.readFileSync(outputPath);

    // Supprimer tmpDir après lecture (optionnel)
    // fs.rmSync(tmpDir, { recursive: true, force: true });

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename=stopmotion.mp4');
    res.end(mp4Data);

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}
