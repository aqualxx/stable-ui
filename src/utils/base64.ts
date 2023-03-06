/**
 * Converts base64 data into a blob
 * @param base64Image Base64 data to convert into a BLOB
 */
export function convertBase64ToBlob(base64Image: string, contentType?: string) {
    // Split into two parts
    const parts = base64Image.split(';base64,');

    // Hold the content type
    const imageType = contentType ?? parts[0].split(':')[1];

    // Decode Base64 string
    const decodedData = window.atob(parts[1]);

    // Create UNIT8ARRAY of size same as row data length
    const uInt8Array = new Uint8Array(decodedData.length);

    // Insert all character code into uInt8Array
    for (let i = 0; i < decodedData.length; ++i) {
        uInt8Array[i] = decodedData.charCodeAt(i);
    }

    // Return BLOB image after conversion
    return new Blob([uInt8Array], { type: imageType });
}

/**
 * Converts a blob/file into base64 data 
 * @param data Blob/file to convert into base64
 */
export function convertToBase64(data: Blob | File) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error);
        reader.readAsDataURL(data);
    })
}
