import { useOptionsStore } from '@/stores/options';
import type { ImageData } from '@/stores/outputs'
import { ElMessage } from 'element-plus';
import JSZip from 'jszip';
import { convertBase64ToBlob } from './base64';

export async function downloadMultipleImages(outputs: ImageData[], showMessage = true) {
    const zip = new JSZip();
    const optionsStore = useOptionsStore();

    showMessage && ElMessage({
        message: `Downloading ${outputs.length} image(s)...`,
        type: 'info',
    })

    for (let i = 0; i < outputs.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {image, id, ...jsonData} = outputs[i];
        // Make a valid file name, and only get first 128 characters so we don't break the max file name limit
        const fileName = `${i}-${outputs[i].seed}-${outputs[i].prompt}`.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd();

        if (optionsStore.imageDownloadType === "PNG") {
            zip.file(
                fileName + ".png",
                convertBase64ToBlob(image, "image/png"),
            );
        } else if (optionsStore.imageDownloadType === "JPG") {
            zip.file(
                fileName + ".jpg",
                convertBase64ToBlob(image, "image/jpeg"),
            );
        } else {
            zip.file(
                fileName + ".webp",
                image.split(",")[1],
                { base64: true },
            );
        }

        // Create JSON file
        zip.file(
            fileName + ".json",
            JSON.stringify(jsonData, undefined, 4) // Stringify JSON with pretty printing
        );
    }

    const zipFile = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE"
    });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipFile);
    downloadLink.download = "stable_horde.zip";
    downloadLink.click();
}

export function downloadImage(base64Data: string, fileName: string) {
    const optionsStore = useOptionsStore();

    const downloadLink = document.createElement("a");

    let blob: Blob | undefined;
    if (optionsStore.imageDownloadType === "PNG") {
        blob = convertBase64ToBlob(base64Data, "image/png");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd() + ".png"; // Only get first 128 characters so we don't break the max file name limit
    } else if (optionsStore.imageDownloadType === "JPG") {
        blob = convertBase64ToBlob(base64Data, "image/jpeg");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd() + ".jpg";
    } else {
        downloadLink.href = base64Data;
        downloadLink.download = fileName.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd() + ".webp";
    }

    downloadLink.click();

    if (blob) URL.revokeObjectURL(downloadLink.href);
}