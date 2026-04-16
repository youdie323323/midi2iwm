import { createCanvas, loadImage } from "canvas";
import { existsSync, mkdirSync, createWriteStream } from "fs";
import { join } from "path";

const INPUT_FILE_PATH = "icons.png";
const OUTPUT_DIR = "public/icons";

const ICON_SIZE = 64;

if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR);
}

loadImage(INPUT_FILE_PATH)
    .then(image => {
        const { width, height } = image;

        const canvas = createCanvas(width, height);

        const ctx = canvas.getContext("2d");

        ctx.drawImage(image, 0, 0);

        const imgData = ctx.getImageData(0, 0, width, height);
        const visited = new Uint8Array(width * height);

        function isOpaque(x, y) {
            const index = (y * width + x) * 4 + 3;

            return imgData.data[index] > 0;
        }

        function floodFill(visited, x0, y0) {
            const stack = [
                [x0, y0],
            ];

            let minX = x0,
                maxX = x0,
                minY = y0,
                maxY = y0;

            visited[y0 * width + x0] = 1;

            while (stack.length) {
                const [x, y] = stack.pop();

                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);

                for (const [dx, dy] of [
                    [1, 0],
                    [-1, 0],
                    [0, 1],
                    [0, -1],
                ]) {
                    const nx = x + dx,
                        ny = y + dy;

                    if (
                        nx >= 0 &&
                        nx < width &&
                        ny >= 0 &&
                        ny < height
                    ) {
                        const index = ny * width + nx;

                        if (!visited[index] && isOpaque(nx, ny)) {
                            visited[index] = 1;

                            stack.push([nx, ny]);
                        }
                    }
                }
            }

            return {
                x: minX,
                y: minY,
                
                width: maxX - minX + 1,
                height: maxY - minY + 1,
            };
        }

        const iconRects = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = y * width + x;

                if (!visited[index] && isOpaque(x, y)) {
                    const rect = floodFill(visited, x, y);

                    iconRects.push(rect);
                }
            }
        }

        iconRects.forEach((box, i) => {
            const iconCanvas = createCanvas(ICON_SIZE, ICON_SIZE);
            const iconCtx = iconCanvas.getContext("2d");

            iconCtx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);

            const offsetX = Math.floor((ICON_SIZE - box.width) / 2);
            const offsetY = Math.floor((ICON_SIZE - box.height) / 2);

            iconCtx.drawImage(
                canvas,
                box.x, box.y, box.width, box.height,
                offsetX, offsetY, box.width, box.height
            );

            const out = createWriteStream(join(OUTPUT_DIR, `icon_${i + 1}.png`));

            const stream = iconCanvas.createPNGStream();
            stream.pipe(out);

            out.on("finish", () => console.log(`Saved icon_${i + 1}.png`));
        });

    }).catch(err => {
        console.error("Error loading image:", err);
    });