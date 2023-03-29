onmessage = async (e) => {
    try {
        const { initFramerate, finalFramerate, imageArray, DEBUG_MODE } = e.data;

        // Fixes "Failed to execute 'importScripts'" error
        self.document = {};

        self.importScripts("https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js");

        const ffmpeg = self.FFmpeg.createFFmpeg({
            // Using singlethreaded FFMPEG because multithreaded FFMPEG requires the infamous SharedArrayBuffer, see here under 'Browser': https://github.com/ffmpegwasm/ffmpeg.wasm#installation
            corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js',
            mainName: 'main',
            log: DEBUG_MODE,
            progress: (progress) => postMessage({ progress, type: "progress" }),
        });

        await ffmpeg.load();

        for (let i = 0; i < imageArray.length; i++) {
            ffmpeg.FS('writeFile', `${i}.jpg`, imageArray[i]);
        }

        await ffmpeg.run(
            "-framerate", `${initFramerate}`,
            "-i", "%d.jpg",
            "-crf", "17",
            // "minterpolate" requires 3 starting frames - otherwise it produces a zero byte video
            "-vf", `minterpolate=fps=${finalFramerate}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none`,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "out.mp4",
        );

        const data = ffmpeg.FS('readFile', 'out.mp4');
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        postMessage({ type: "result", blob: videoBlob });

        // Clean up
        for (let i = 0; i < imageArray.length; i++) {
            ffmpeg.FS('unlink', `${i}.jpg`);
        }
        
        ffmpeg.FS('unlink', 'out.mp4');
    } catch (e) {
        postMessage({ type: "error", error: e });
    }
}