declare module "@slosarek/docxtemplater-image-module-free" {
  interface ImageModuleOptions {
    getImage: (tag: string) => Uint8Array;
    getSize: (img: Uint8Array) => [number, number];
    getProps?: (tag: string) => { extension: string };
  }

  class ImageModule {
    constructor(options: ImageModuleOptions);
  }

  export = ImageModule;
}
