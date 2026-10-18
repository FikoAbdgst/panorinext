declare module "gif.js" {
  export type GIFOptions = {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    dither?: boolean | string;
    workerScript?: string;
    transparent?: string | null;
    background?: string;
    repeat?: number;
    debug?: boolean;
  };

  export type GIFFrameOptions = {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  };

  export default class GIF {
    constructor(options?: GIFOptions);
    addFrame(element: CanvasImageSource, options?: GIFFrameOptions): void;
    render(): void;
    abort(): void;
    on(event: "finished", listener: (blob: Blob) => void): void;
    on(event: "progress", listener: (progress: number) => void): void;
    on(event: "error", listener: (error: Error) => void): void;
    on(event: "abort", listener: () => void): void;
  }
}
