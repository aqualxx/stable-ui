import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useGeneratorStore } from "./generator";
import { fabric } from "fabric";
import { useOptionsStore } from "./options";

export const useCanvasStore = defineStore("canvas", () => {
    interface ICanvasParams {
        canvas?: fabric.Canvas;
        brush?: fabric.BaseBrush;
        visibleImageLayer?: fabric.Group;
        imageLayer?: fabric.Canvas;
        visibleDrawLayer?: fabric.Group;
        drawLayer?: fabric.Canvas;
        cropPreviewLayer?: fabric.Group;
        maskPathColor: string;
        maskBackgroundColor: string;
        painting: boolean;
        imageScale: number;
    }

    const inpainting = ref<ICanvasParams>({
        canvas: undefined,
        brush: undefined,
        visibleImageLayer: undefined,
        imageLayer: undefined,
        visibleDrawLayer: undefined,
        drawLayer: undefined,
        cropPreviewLayer: undefined,
        maskPathColor: "white",
        maskBackgroundColor: "black",
        painting: false,
        imageScale: 1
    });

    const img2img = ref<ICanvasParams>({
        canvas: undefined,
        brush: undefined,
        visibleImageLayer: undefined,
        imageLayer: undefined,
        visibleDrawLayer: undefined,
        drawLayer: undefined,
        cropPreviewLayer: undefined,
        maskPathColor: "black",
        maskBackgroundColor: "white",
        painting: false,
        imageScale: 1
    });

    const usingInpainting = computed(() => {
        const store = useGeneratorStore();
        return store.generatorType === "Inpainting";
    })

    const canvas = computed({
        get: () => usingInpainting.value ? inpainting.value.canvas : img2img.value.canvas,
        set: (value) => usingInpainting.value ? inpainting.value.canvas = value : img2img.value.canvas = value
    })

    const brush = computed({
        get: () => usingInpainting.value ? inpainting.value.brush : img2img.value.brush,
        set: (value) => usingInpainting.value ? inpainting.value.brush = value : img2img.value.brush = value
    })
    
    const visibleImageLayer = computed({
        get: () => usingInpainting.value ? inpainting.value.visibleImageLayer : img2img.value.visibleImageLayer,
        set: (value) => usingInpainting.value ? inpainting.value.visibleImageLayer = value : img2img.value.visibleImageLayer = value
    })

    const imageLayer = computed({
        get: () => usingInpainting.value ? inpainting.value.imageLayer : img2img.value.imageLayer,
        set: (value) => usingInpainting.value ? inpainting.value.imageLayer = value : img2img.value.imageLayer = value
    })

    const visibleDrawLayer = computed({
        get: () => usingInpainting.value ? inpainting.value.visibleDrawLayer : img2img.value.visibleDrawLayer,
        set: (value) => usingInpainting.value ? inpainting.value.visibleDrawLayer = value : img2img.value.visibleDrawLayer = value
    })

    const drawLayer = computed({
        get: () => usingInpainting.value ? inpainting.value.drawLayer : img2img.value.drawLayer,
        set: (value) => usingInpainting.value ? inpainting.value.drawLayer = value : img2img.value.drawLayer = value
    })

    const cropPreviewLayer = computed({
        get: () => usingInpainting.value ? inpainting.value.cropPreviewLayer : img2img.value.cropPreviewLayer,
        set: (value) => usingInpainting.value ? inpainting.value.cropPreviewLayer = value : img2img.value.cropPreviewLayer = value
    })

    const maskPathColor = computed({
        get: () => usingInpainting.value ? inpainting.value.maskPathColor : img2img.value.maskPathColor,
        set: (value) => usingInpainting.value ? inpainting.value.maskPathColor = value : img2img.value.maskPathColor = value
    })

    const maskBackgroundColor = computed({
        get: () => usingInpainting.value ? inpainting.value.maskBackgroundColor : img2img.value.maskBackgroundColor,
        set: (value) => usingInpainting.value ? inpainting.value.maskBackgroundColor = value : img2img.value.maskBackgroundColor = value
    })

    const painting = computed({
        get: () => usingInpainting.value ? inpainting.value.painting : img2img.value.painting,
        set: (value) => usingInpainting.value ? inpainting.value.painting = value : img2img.value.painting = value
    })

    const imageScale = computed({
        get: () => usingInpainting.value ? inpainting.value.imageScale : img2img.value.imageScale,
        set: (value) => usingInpainting.value ? inpainting.value.imageScale = value : img2img.value.imageScale = value
    })

    const width = ref(512);
    const height = ref(512);
    const erasing = ref(false);
    const brushSize = ref(30);
    const showCropPreview = ref(false);
    const outlineLayer  = new fabric.Circle({
        radius: brushSize.value,
        left: 0,
        originX: "center",
        originY: "center",
        angle: 0,
        fill: "",
        stroke: "red",
        strokeWidth: 3,
        opacity: 0,
    });
    const switchToolText = ref("Erase");

    interface IHistory {
        path: fabric.Path;
        drawPath?: fabric.Path;
        visibleDrawPath?: fabric.Path;
    }

    const undoHistory = ref<IHistory[]>([]);
    const redoHistory = ref<IHistory[]>([]);

    function updateCanvas() {
        if (!canvas.value) return;
        canvas.value.renderAll();
    }

    function flipErase() {
        erasing.value = !erasing.value;
        switchToolText.value = erasing.value ? "Draw" : "Erase";
    }

    function setBrush(color: string | null = null) {
        if (!canvas.value) return;
        brush.value = canvas.value.freeDrawingBrush;
        brush.value.color = color || brush.value.color;
        brush.value.width = brushSize.value;
    }

    async function pathCreate(history: IHistory, erase: boolean) {
        if (!drawLayer.value) return;
        if (!visibleDrawLayer.value) return;
        if (!canvas.value) return;

        history.path.selectable = false;
        history.path.opacity = 1;

        history.drawPath  = await asyncClone(history.path) as fabric.Path;
        history.visibleDrawPath = await asyncClone(history.path) as fabric.Path;

        if (erase) {
            history.visibleDrawPath.globalCompositeOperation = 'destination-out';
            history.drawPath.stroke = maskBackgroundColor.value;
        } else {
            history.visibleDrawPath.globalCompositeOperation = 'source-over';
            history.drawPath.stroke = maskPathColor.value;
        }
        console.log(history.drawPath.left)
        let scaledDrawPath = await asyncClone(history.drawPath) as fabric.Path;
        scaledDrawPath = scaledDrawPath.scale(imageScale.value) as fabric.Path;
        scaledDrawPath.left = (scaledDrawPath.left as number) + (history.drawPath.left as number) * (imageScale.value - 1);
        scaledDrawPath.top = (scaledDrawPath.top as number) + (history.drawPath.top as number) * (imageScale.value - 1);
        drawLayer.value.add(scaledDrawPath);
        visibleDrawLayer.value.addWithUpdate(history.visibleDrawPath);
        painting.value = true;

        canvas.value.remove(history.path);
        updateCanvas();
    }

    function redoAction() {
        if (undoHistory.value.length === 0) return;
        const path = undoHistory.value.pop() as IHistory;
        pathCreate(path, false);
        redoHistory.value.push(path);
    }

    function undoAction() {
        if (redoHistory.value.length === 0) return;
        if (!drawLayer.value) return;
        if (!visibleDrawLayer.value) return;
        if (!canvas.value) return;
        const path = redoHistory.value.pop() as IHistory;
        undoHistory.value.push(path);
        drawLayer.value.remove(path.drawPath as fabric.Path);
        visibleDrawLayer.value.remove(path.visibleDrawPath as fabric.Path);  
        delete path.drawPath; 
        delete path.visibleDrawPath;
        updateCanvas();
    }

    function createNewCanvas(canvasElement: string) {
        canvas.value = new fabric.Canvas(canvasElement, {
            isDrawingMode: false,
            width: width.value,
            height: height.value,
            backgroundColor: "white"
        });
        canvas.value.selection = false;
        canvas.value.freeDrawingCursor = "crosshair";
        setBrush(maskPathColor.value);
        canvas.value.on("mouse:move", onMouseMove);
        canvas.value.on("path:created", onPathCreated);
        updateCanvas();
    }

    function newImage(image: fabric.Image) {
        const store = useGeneratorStore();
        const optionsStore = useOptionsStore();
        resetCanvas();
        image.selectable = false;
        width.value = image.width as number;
        height.value = image.height as number;

        const maxDimensions = optionsStore.allowLargerParams === "Enabled" ? 3072 : 1024;

        if (width.value > maxDimensions || height.value > maxDimensions) {
            if (width.value > height.value) {
                image.scaleToWidth(maxDimensions);
                height.value = maxDimensions * (height.value / width.value);
                width.value = maxDimensions;
            } else {
                image.scaleToHeight(maxDimensions);
                width.value = maxDimensions * (width.value / height.value);
                height.value = maxDimensions;
            }
        }

        image.cloneAsImage((clonedImage: fabric.Image) => {
            // Scaling relative to the downsized visible image layer
            if (width.value > height.value) {
                imageScale.value = width.value / 512;
            } else {
                imageScale.value = height.value / 512;
            }
            imageLayer.value = makeInvisibleLayer({image: clonedImage, layerHeight: clonedImage.height, layerWidth: clonedImage.width});
        })

        image.cloneAsImage((clonedImage: fabric.Image) => {
            if (!canvas.value) return;
            if (width.value > 512 || height.value > 512) {
                if (width.value > height.value) {
                    clonedImage.scaleToWidth(512);
                    height.value = 512 * (height.value / width.value);
                    width.value = 512;
                } else {
                    clonedImage.scaleToHeight(512);
                    width.value = 512 * (width.value / height.value);
                    height.value = 512;
                }
            }
            canvas.value.setWidth(width.value);
            canvas.value.setHeight(height.value);
            canvas.value.isDrawingMode = true;
    
            visibleDrawLayer.value = makeNewLayer();
            visibleImageLayer.value = makeNewLayer({image:clonedImage});
            drawLayer.value = makeInvisibleLayer();
            store.params.width = width.value - (width.value % 64);
            store.params.height = height.value - (height.value % 64);
            visibleDrawLayer.value.set("opacity", 0.8);
            canvas.value.add(visibleImageLayer.value);
            canvas.value.add(visibleDrawLayer.value);
            canvas.value.add(outlineLayer);
            showCropPreview.value = true;
            painting.value = false;
            updateCropPreview();
        })
    }

    function saveImages() {
        const store = useGeneratorStore();
        if (!imageLayer.value) return;
        if (!drawLayer.value) return;
        const cropX = imageLayer.value.getCenter().left - (store.params.width as number / 2);
        const cropWidth = store.params.width;
        const cropY = imageLayer.value.getCenter().top - (store.params.height as number / 2);
        const cropHeight = store.params.height;
        const dataUrlOptions = {
            format: "webp",
            left: cropX,
            top: cropY,
            width: cropWidth,
            height: cropHeight
        };
        if (store.generatorType === "Inpainting") {
            store.inpainting.sourceImage = imageLayer.value.toDataURL(dataUrlOptions).split(",")[1];
            store.inpainting.maskImage = painting.value ? drawLayer.value.toDataURL(dataUrlOptions).split(",")[1] : "";
        }
        if (store.generatorType === "Img2Img") {
            store.img2img.sourceImage = imageLayer.value.toDataURL(dataUrlOptions).split(",")[1];
            store.img2img.maskImage = painting.value ? drawLayer.value.toDataURL(dataUrlOptions).split(",")[1] : "";
        }
    }

    let timeout: undefined | NodeJS.Timeout;

    function updateCropPreview() {
        if (!canvas.value) return;
        const store = useGeneratorStore();
        if (cropPreviewLayer.value) {
            canvas.value.remove(cropPreviewLayer.value);
            cropPreviewLayer.value = undefined;
        }
        if (!showCropPreview.value) return;
        cropPreviewLayer.value = makeNewLayer({
            layerWidth: (store.params.width as number) / imageScale.value,
            layerHeight: (store.params.height as number) / imageScale.value,
            fill: "rgba(100, 0, 0, 0.5)"
        });
        canvas.value.centerObject(cropPreviewLayer.value);
        canvas.value.add(cropPreviewLayer.value);
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            showCropPreview.value = false;
            updateCropPreview();
            timeout = undefined;
        }, 5000)
    }

    interface ILayerParams {
        image?: fabric.Image;
        layerWidth?: number;
        layerHeight?: number;
        fill?: string;
        abosolute?: boolean;
    }

    function makeInvisibleLayer({image, layerWidth, layerHeight}: ILayerParams = {}) {
        const newLayer = new fabric.Canvas(null);
        newLayer.selection = false;
        newLayer.backgroundColor = maskBackgroundColor.value;
        newLayer.setHeight(layerHeight || height.value);
        newLayer.setWidth(layerWidth || width.value);
        if (image) newLayer.add(image);
        return newLayer;
    }

    function makeNewLayer({image, layerWidth, layerHeight, fill, abosolute}: ILayerParams = {}) {
        const newLayer = image || new fabric.Rect({
            width: layerWidth || width.value,
            height: layerHeight || height.value,
            left: 0,
            top: 0,
            fill: fill || "transparent",
            absolutePositioned: abosolute || true,
            selectable: false,
        })

        const newGroup = new fabric.Group([newLayer], {
            selectable: false,
            absolutePositioned: abosolute || true,
        });

        return newGroup;
    }

    function resetCanvas() {
        if (!canvas.value) return;
        if (visibleImageLayer.value) {
            canvas.value.remove(visibleImageLayer.value);
            visibleImageLayer.value = undefined;
        }
        if (imageLayer.value) {
            imageLayer.value = undefined;
        }
        if (drawLayer.value) {
            drawLayer.value = undefined;
        }
        if (visibleDrawLayer.value) {
            canvas.value.remove(visibleDrawLayer.value);
            visibleDrawLayer.value = undefined;
        }
        redoHistory.value = [];
        undoHistory.value = [];
        canvas.value.isDrawingMode = false;
    }

    function resetDrawing() {
        if (!canvas.value) return;
        if (drawLayer.value) {
            drawLayer.value = undefined;
        }
        if (visibleDrawLayer.value) {
            canvas.value.remove(visibleDrawLayer.value);
            visibleDrawLayer.value = undefined;
        }
        visibleDrawLayer.value = makeNewLayer();
        drawLayer.value = makeInvisibleLayer();
        visibleDrawLayer.value.set("opacity", 0.8)
        canvas.value.add(visibleDrawLayer.value);
    }

    function downloadMask() {
        saveImages();
        const store = useGeneratorStore();
        const anchor = document.createElement("a");
        anchor.href = 'data:image/webp;base64,'+(usingInpainting.value ? store.inpainting.maskImage : store.img2img.maskImage);
        anchor.download = "image_mask.webp";
        anchor.click();
    }

    async function asyncClone(object: any) {
        return new Promise(function (resolve, reject) {
            try {
                object.clone(function (cloned_object: any) {
                    resolve(cloned_object);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async function onPathCreated(e: any) {
        const path = { path: e.path }
        pathCreate(path, erasing.value);
        redoHistory.value.push(path);
    }

    function onMouseMove(event: fabric.IEvent<Event>) {
        if (!canvas.value) return;

        const pointer = canvas.value.getPointer(event.e);
        outlineLayer.left = pointer.x;
        outlineLayer.top = pointer.y;
        outlineLayer.opacity = 0.8;

        if (erasing.value) {
            outlineLayer.set("strokeWidth", 3);
            outlineLayer.set("fill", "");
            setBrush("red");
        } else {
            outlineLayer.set("strokeWidth", 0);
            outlineLayer.set("fill", "white");
            setBrush("white");
        }
        outlineLayer.set("radius", brushSize.value / 2);
        updateCanvas();
    }

    return {
        // Variables
        showCropPreview,
        erasing,
        switchToolText,
        brushSize,
        undoHistory,
        redoHistory,
        // Computed
        canvas,
        // Actions
        updateCropPreview,
        createNewCanvas,
        downloadMask,
        resetCanvas,
        resetDrawing,
        flipErase,
        undoAction,
        redoAction,
        newImage,
        setBrush,
        saveImages
    };
});
