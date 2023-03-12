
/**
 * Converts base64 data into to another data type
 */
export function convertBase64ToDataType(base64Image: string, contentType: string) {    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const image = new Image();
    image.src = base64Image;

    canvas.width = image.width;
    canvas.height = image.height;

    ctx?.drawImage(image, 0, 0);

    const dataURL = canvas.toDataURL(contentType);
    return dataURL;
}

/**
 * Converts base64 data into a blob
 */
export function convertBase64ToBlob(base64Image: string, contentType?: string) {
    // Split into two parts
    const parts = base64Image.split(';base64,');

    // Hold the content type
    const imageType = contentType ?? parts[0].split(':')[1];

    // Decode Base64 string
    const decodedData =
        window.atob(
            imageType === parts[0].split(':')[1] ?
                window.atob(parts[1]) :
                convertBase64ToDataType(base64Image, imageType).split(',')[1]
        );


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
 */
export function convertToBase64(data: Blob | File) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error);
        reader.readAsDataURL(data);
    })
}
