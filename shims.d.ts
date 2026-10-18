declare namespace customOSFiles {
    //% shim=customOSFiles::writeFile
    function writeFile(filename: string, data: string): void;

    //% shim=customOSFiles::readFile
    function readFile(filename: string): string;

    //% shim=customOSFiles::removeFile
    function removeFile(filename: string): void;

    //% shim=customOSFiles::fileExists
    function fileExists(filename: string): boolean;

    //% shim=customOSFiles::appendFile
    function appendFile(filename: string, data: string): void;

    //% shim=customOSFiles::getFileSize
    function getFileSize(filename: string): number;

    //% shim=customOSFiles::clearStorage
    function clearStorage(): void;
}
