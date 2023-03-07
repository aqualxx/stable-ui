import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useGeneratorStore } from "./generator";
import { fabric } from "fabric";

export const useCanvasStore = defineStore("canvas", () => {
    interface ICanvasParams {
        canvas: fabric.Canvas | undefined;
        brush: fabric.BaseBrush | undefined;
        visibleImageLayer: fabric.Group | undefined;
        imageLayer: fabric.Canvas | undefined;
        visibleDrawLayer: fabric.Group | undefined;
        drawLayer: fabric.Canvas | undefined;
        cropPreviewLayer: fabric.Group | undefined;
        maskPathColor: string;
        maskBackgroundColor: string;
        imageScale: number;
        undoHistory: IHistory[];
        redoHistory: IHistory[];
        drawing: boolean;
    }

    const defaultCanvasParams = (): ICanvasParams => ({
        canvas: undefined,
        brush: undefined,
        visibleImageLayer: undefined,
        imageLayer: undefined,
        visibleDrawLayer: undefined,
        drawLayer: undefined,
        cropPreviewLayer: undefined,
        maskPathColor: "",
        maskBackgroundColor: "",
        imageScale: 1,
        undoHistory: [],
        redoHistory: [],
        drawing: false, 
    })

    const inpainting = ref<ICanvasParams>({
        ...defaultCanvasParams(),
        maskPathColor: "white",
        maskBackgroundColor: "black",
    });

    const img2img = ref<ICanvasParams>({
        ...defaultCanvasParams(),
        maskPathColor: "black",
        maskBackgroundColor: "white",
    });

    const usingInpainting = computed(() => {
        const store = useGeneratorStore();
        return store.generatorType === "Inpainting";
    })
    
    const imageProps = computed(() => usingInpainting.value ? inpainting.value : img2img.value);
    const generatorImageProps = computed(() => useGeneratorStore().currentImageProps);

    const drawing = computed({
        get: () => imageProps.value.drawing && !usingInpainting.value,
        set: (value) => imageProps.value.drawing = value
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
    const drawColor = ref("rgb(0, 0, 0, 1)");

    interface IHistory {
        path: fabric.Path;
        drawPath?: fabric.Path;
        visibleDrawPath?: fabric.Path;
    }

    function updateCanvas() {
        if (!imageProps.value.canvas) return;
        imageProps.value.canvas.renderAll();
    }

    function flipErase() {
        erasing.value = !erasing.value;
        switchToolText.value = erasing.value ? "Draw" : "Erase";
    }

    function setBrush(color: string | null = null) {
        if (!imageProps.value.canvas) return;
        imageProps.value.brush = imageProps.value.canvas.freeDrawingBrush;
        imageProps.value.brush.color = color || imageProps.value.brush.color;
        imageProps.value.brush.width = brushSize.value;
    }

    interface pathCreateOptions {
        history?: IHistory;
        erase?: boolean;
        draw?: boolean;
    }

    async function pathCreate({history, erase = false, draw = false}: pathCreateOptions = {}) {
        if (!history) return; 
        if (!imageProps.value.drawLayer) return;
        if (!imageProps.value.visibleDrawLayer) return;
        if (!imageProps.value.imageLayer) return;
        if (!imageProps.value.visibleImageLayer) return;
        if (!imageProps.value.canvas) return;

        history.path.selectable = false;
        history.path.opacity = 1;

        history.drawPath  = await asyncClone(history.path) as fabric.Path;
        history.visibleDrawPath = await asyncClone(history.path) as fabric.Path;

        if (erase) {
            history.visibleDrawPath.globalCompositeOperation = 'destination-out';
            history.drawPath.stroke = imageProps.value.maskBackgroundColor;
        } else {
            history.visibleDrawPath.globalCompositeOperation = 'source-over';
            history.drawPath.stroke = draw ? drawColor.value : imageProps.value.maskPathColor;
        }
        let scaledDrawPath = await asyncClone(history.drawPath) as fabric.Path;
        scaledDrawPath = scaledDrawPath.scale(imageProps.value.imageScale) as fabric.Path;
        scaledDrawPath.left = (scaledDrawPath.left as number) + (history.drawPath.left as number) * (imageProps.value.imageScale - 1);
        scaledDrawPath.top = (scaledDrawPath.top as number) + (history.drawPath.top as number) * (imageProps.value.imageScale - 1);
        if (draw) {
            imageProps.value.imageLayer.add(scaledDrawPath);
            imageProps.value.visibleImageLayer.addWithUpdate(history.visibleDrawPath);
        } else {
            imageProps.value.drawLayer.add(scaledDrawPath);
            imageProps.value.visibleDrawLayer.addWithUpdate(history.visibleDrawPath);
        }

        imageProps.value.canvas.remove(history.path);
        updateCanvas();
    }

    function redoAction() {
        if (imageProps.value.undoHistory.length === 0) return;
        const path = imageProps.value.undoHistory.pop() as IHistory;
        pathCreate({history: path, erase: false, draw: drawing.value});
        imageProps.value.redoHistory.push(path);
    }

    function undoAction() {
        if (imageProps.value.redoHistory.length === 0) return;
        if (!imageProps.value.drawLayer) return;
        if (!imageProps.value.visibleDrawLayer) return;
        if (!imageProps.value.imageLayer) return;
        if (!imageProps.value.visibleImageLayer) return;
        if (!imageProps.value.canvas) return;
        const path = imageProps.value.redoHistory.pop() as IHistory;
        imageProps.value.undoHistory.push(path);
        if (drawing.value) {
            imageProps.value.imageLayer.remove(path.drawPath as fabric.Path);
            imageProps.value.visibleImageLayer.remove(path.visibleDrawPath as fabric.Path);  
        } else {
            imageProps.value.drawLayer.remove(path.drawPath as fabric.Path);
            imageProps.value.visibleDrawLayer.remove(path.visibleDrawPath as fabric.Path);  
        }
        delete path.drawPath; 
        delete path.visibleDrawPath;
        updateCanvas();
    }

    function createNewCanvas(canvasElement: string) {
        imageProps.value.canvas = new fabric.Canvas(canvasElement, {
            isDrawingMode: false,
            width: width.value,
            height: height.value,
            backgroundColor: "white"
        });
        imageProps.value.canvas.selection = false;
        imageProps.value.canvas.freeDrawingCursor = "crosshair";
        setBrush(imageProps.value.maskPathColor);
        imageProps.value.canvas.on("mouse:move", onMouseMove);
        imageProps.value.canvas.on("path:created", onPathCreated);
        updateCanvas();
    }

    function scaleImageTo(image: fabric.Image, widthAmount: number, heightAmount: number, minDimensions: number) {
        let newHeight = minDimensions;
        let newWidth = minDimensions;
        if (widthAmount > heightAmount) {
            image.scaleToWidth(minDimensions);
            newHeight = minDimensions * (height.value / width.value);
        } else {
            image.scaleToHeight(minDimensions);
            newWidth = minDimensions * (width.value / height.value);
        }
        return { newHeight, newWidth };
    }

    function newImage(image: fabric.Image) {
        const store = useGeneratorStore();
        resetCanvas();
        image.selectable = false;
        width.value = image.width as number;
        height.value = image.height as number;

        if (width.value > store.maxDimensions || height.value > store.maxDimensions) {
            const { newHeight, newWidth } = scaleImageTo(image, width.value, height.value, store.maxDimensions);
            width.value = newWidth;
            height.value = newHeight;
        }

        if (width.value < store.minDimensions || height.value < store.minDimensions) {
            const { newHeight, newWidth } = scaleImageTo(image, width.value, height.value, store.minDimensions);
            width.value = newWidth;
            height.value = newHeight;
        }

        const visibleDimensions = 512;

        image.cloneAsImage((clonedImage: fabric.Image) => {
            // Scaling relative to the downsized visible image layer
            if (width.value > height.value) {
                imageProps.value.imageScale = width.value / visibleDimensions;
            } else {
                imageProps.value.imageScale = height.value / visibleDimensions;
            }
            imageProps.value.imageLayer = makeInvisibleLayer({image: clonedImage, layerHeight: clonedImage.height, layerWidth: clonedImage.width});
        })

        image.cloneAsImage((clonedImage: fabric.Image) => {
            if (!imageProps.value.canvas) return;
            if (width.value !== visibleDimensions || height.value !== visibleDimensions) {
                const { newHeight, newWidth } = scaleImageTo(clonedImage, width.value, height.value, visibleDimensions);
                width.value = newWidth;
                height.value = newHeight;
            }
            imageProps.value.canvas.setWidth(width.value);
            imageProps.value.canvas.setHeight(height.value);
            imageProps.value.canvas.isDrawingMode = true;
    
            imageProps.value.visibleDrawLayer = makeNewLayer();
            imageProps.value.visibleImageLayer = makeNewLayer({image:clonedImage});
            imageProps.value.drawLayer = makeInvisibleLayer();
            const scaledWidth = width.value * imageProps.value.imageScale;
            const scaledHeight = height.value * imageProps.value.imageScale;
            store.params.width = scaledWidth - (scaledWidth % 64);
            store.params.height = scaledHeight - (scaledHeight % 64);
            imageProps.value.visibleDrawLayer.set("opacity", 0.8);
            imageProps.value.canvas.add(imageProps.value.visibleImageLayer);
            imageProps.value.canvas.add(imageProps.value.visibleDrawLayer);
            imageProps.value.canvas.add(outlineLayer);
            showCropPreview.value = true;
            updateCropPreview();
            saveImages();
        })
    }

    function saveImages() {
        const store = useGeneratorStore();
        if (!imageProps.value.imageLayer) return;
        if (!imageProps.value.drawLayer) return;
        const cropX = imageProps.value.imageLayer.getCenter().left - (store.params.width as number / 2);
        const cropWidth = store.params.width;
        const cropY = imageProps.value.imageLayer.getCenter().top - (store.params.height as number / 2);
        const cropHeight = store.params.height;
        const dataUrlOptions = {
            format: "webp",
            left: cropX,
            top: cropY,
            width: cropWidth,
            height: cropHeight
        };
        generatorImageProps.value.sourceImage = imageProps.value.imageLayer.toDataURL(dataUrlOptions);
        generatorImageProps.value.maskImage = imageProps.value.redoHistory.length === 0 || drawing.value ? undefined : imageProps.value.drawLayer.toDataURL(dataUrlOptions).split(",")[1];
    }

    let timeout: undefined | NodeJS.Timeout;

    function updateCropPreview() {
        if (!imageProps.value.canvas) return;
        const store = useGeneratorStore();
        if (imageProps.value.cropPreviewLayer) {
            imageProps.value.canvas.remove(imageProps.value.cropPreviewLayer);
            imageProps.value.cropPreviewLayer = undefined;
        }
        if (!showCropPreview.value) return;
        imageProps.value.cropPreviewLayer = makeNewLayer({
            layerWidth: (store.params.width as number) / imageProps.value.imageScale,
            layerHeight: (store.params.height as number) / imageProps.value.imageScale,
            fill: "rgba(100, 0, 0, 0.5)"
        });
        imageProps.value.canvas.centerObject(imageProps.value.cropPreviewLayer);
        imageProps.value.canvas.add(imageProps.value.cropPreviewLayer);
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

    function newBlankImage(height: number, width: number) {
        // Create a 1x1 white pixel and resize
        const whitePixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVORK5CYII=';
        fabric.Image.fromURL(whitePixel, image => {
            image.set({ height, width });
            const imageBase64 = image.toDataURL({ format: "webp" });
            generatorImageProps.value.sourceImage = imageBase64;
            drawing.value = true;
            newImage(image);
        })
    }

    function makeInvisibleLayer({image, layerWidth, layerHeight}: ILayerParams = {}) {
        const newLayer = new fabric.Canvas(null);
        newLayer.selection = false;
        newLayer.backgroundColor = imageProps.value.maskBackgroundColor;
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
        if (!imageProps.value.canvas) return;
        if (imageProps.value.visibleImageLayer) {
            imageProps.value.canvas.remove(imageProps.value.visibleImageLayer);
            imageProps.value.visibleImageLayer = undefined;
        }
        if (imageProps.value.visibleDrawLayer) {
            imageProps.value.canvas.remove(imageProps.value.visibleDrawLayer);
            imageProps.value.visibleDrawLayer = undefined;
        }
        imageProps.value.imageLayer = undefined;
        imageProps.value.drawLayer = undefined;
        imageProps.value.redoHistory = [];
        imageProps.value.undoHistory = [];
        imageProps.value.canvas.isDrawingMode = false;
    }

    function resetDrawing() {
        if (!imageProps.value.canvas) return;
        if (imageProps.value.visibleDrawLayer) {
            imageProps.value.canvas.remove(imageProps.value.visibleDrawLayer);
            imageProps.value.visibleDrawLayer = undefined;
        }
        if (drawing.value) {
            const store = useGeneratorStore();
            newBlankImage(store.params.height || 512, store.params.width || 512);
        }
        imageProps.value.drawLayer = undefined;
        imageProps.value.redoHistory = [];
        imageProps.value.undoHistory = [];
        imageProps.value.visibleDrawLayer = makeNewLayer();
        imageProps.value.drawLayer = makeInvisibleLayer();
        imageProps.value.visibleDrawLayer.set("opacity", 0.8)
        imageProps.value.canvas.add(imageProps.value.visibleDrawLayer);
    }

    function downloadMask() {
        saveImages();
        const anchor = document.createElement("a");
        if (drawing.value) {
            anchor.href = 'data:image/webp;base64,'+generatorImageProps.value.sourceImage?.split(",")[1];
            anchor.download = "image_drawing.webp";
            anchor.click();
            return;
        }
        anchor.href = 'data:image/webp;base64,'+generatorImageProps.value.maskImage;
        anchor.download = "image_mask.webp";
        anchor.click();
    }

    async function asyncClone(object: any) {
        return new Promise((resolve, reject) => {
            try {
                object.clone(resolve);
            } catch (error) {
                reject(error);
            }
        });
    }

    async function onPathCreated(e: any) {
        const path: IHistory = { path: e.path }
        pathCreate({history: path, erase: erasing.value, draw: drawing.value});
        imageProps.value.redoHistory.push(path);
    }

    function onMouseMove(event: fabric.IEvent<Event>) {
        if (!imageProps.value.canvas) return;

        const pointer = imageProps.value.canvas.getPointer(event.e);
        outlineLayer.left = pointer.x;
        outlineLayer.top = pointer.y;
        outlineLayer.opacity = 0.8;

        if (erasing.value) {
            outlineLayer.set("strokeWidth", 3);
            outlineLayer.set("fill", "");
            setBrush("red");
        } else {
            outlineLayer.set("strokeWidth", 0);
            if (drawing.value) {
                outlineLayer.set("fill", drawColor.value);
                setBrush(drawColor.value);
            } else {
                outlineLayer.set("fill", "white");
                setBrush("white");
            }
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
        drawColor,
        drawing,
        // Computed
        imageProps,
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
        newBlankImage,
        setBrush,
        saveImages
    };
});
