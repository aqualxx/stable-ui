import { useOptionsStore } from '@/stores/options';
import { ElMessage } from 'element-plus';
import { convertBase64ToBlob } from './base64';
import { downloadZip, type InputWithSizeMeta } from 'client-zip';
import { db } from '@/utils/db';
import type { IndexableType } from 'dexie';
import { type ImageData } from '@/stores/outputs';

export async function downloadMultipleImages(outputKeys: IndexableType[], showMessage = true, onProcess?: () => void) {
    const optionsStore = useOptionsStore();

    showMessage && ElMessage({
        message: `Downloading ${outputKeys.length} image(s)...`,
        type: 'info',
    })

    const toDownload: InputWithSizeMeta[] = []

    for (let i = 0; i < outputKeys.length; i++) {
        const output = await db.outputs.get(outputKeys[i]);
        if (!output) continue;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {image, id, ...jsonData} = output;
        // Make a valid file name, and only get first 128 characters so we don't break the max file name limit
        const fileName = `${i}-${output.seed}-${output.prompt}`.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd();

        if (optionsStore.imageDownloadType === "PNG") {
            toDownload.push({
                name: fileName + ".png",
                input: await convertBase64ToBlob(image, "image/png"),
            })
        } else if (optionsStore.imageDownloadType === "JPG") {
            toDownload.push({
                name: fileName + ".jpg",
                input: await convertBase64ToBlob(image, "image/jpeg", getMetaData(output)),
            })
        } else {
            toDownload.push({
                name: fileName + ".webp",
                input: await convertBase64ToBlob(image, "image/webp"),
            })
        }

        toDownload.push({
            name: fileName + ".json",
            input: JSON.stringify(jsonData, undefined, 4) // Stringify JSON with pretty printing
        })

        if (onProcess) onProcess();
    }

    const zipFile = await downloadZip(toDownload).blob();

    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipFile);
    downloadLink.download = "stable_horde.zip";
    downloadLink.click();
}

// Create a string with the image params for the file
function getMetaData(imageData: ImageData) : string{
    const prompts = imageData.prompt.split("###");
    const prompt = prompts[0].trim();
    const negativePrompt = prompts.length > 1 ? prompts[1].trim() : null;
    return `${prompt}\n` +
    ((negativePrompt) ? `Negative prompt: ${negativePrompt}\n` : ``) +
    `Steps: ${imageData.steps}, Sampler: ${imageData.sampler_name}, CFG scale: ${imageData.cfg_scale}, Seed: ${imageData.seed},` +
    `Size: ${imageData.width}x${imageData.height}, model: ${imageData.modelName}`
}

export async function downloadImage(base64Data: string, fileName: string, imageData: ImageData) {
    const optionsStore = useOptionsStore();

    const downloadLink = document.createElement("a");

    let blob: Blob | undefined;
    if (optionsStore.imageDownloadType === "PNG") {
        blob = await convertBase64ToBlob(base64Data, "image/png");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd() + ".png"; // Only get first 128 characters so we don't break the max file name limit
    } else if (optionsStore.imageDownloadType === "JPG") {
        blob = await convertBase64ToBlob(base64Data, "image/jpeg", getMetaData(imageData));
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd() + ".jpg";
    } else {
        downloadLink.href = base64Data;
        downloadLink.download = fileName.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd() + ".webp";
    }

    downloadLink.click();

    if (blob) URL.revokeObjectURL(downloadLink.href);
}