/**
 * Архитектурный модуль Файловой Системы для micro:bit OS
 */
//% color="#1e6b7b" icon="\uf0a0" block="Файлы ОС"
namespace customOSFiles {

    const INDEX_FILE = ".sys_files";

    function addToIndex(filename: string) {
        if (filename == INDEX_FILE) return;
        let index = readFile(INDEX_FILE);
        let list = index.split(",");
        if (list.indexOf(filename) === -1) {
            if (index.length > 0) {
                appendFile(INDEX_FILE, "," + filename);
            } else {
                writeFile(INDEX_FILE, filename);
            }
        }
    }

    function removeFromIndex(filename: string) {
        if (filename == INDEX_FILE) return;
        let index = readFile(INDEX_FILE);
        let list = index.split(",");
        let itemIndex = list.indexOf(filename);
        if (itemIndex !== -1) {
            list.splice(itemIndex, 1);
            writeFile(INDEX_FILE, list.join(","));
        }
    }

    /**
     * Создать или перезаписать файл в ОС.
     */
    //% block="ОС: Записать в файл %filename текст %data"
    //% weight=100
    export function osWrite(filename: string, data: string): void {
        writeFile(filename, data);
        addToIndex(filename);
    }

    /**
     * Дописать строку в конец существующего файла. 
     */
    //% block="ОС: Дописать строку %data в файл %filename"
    //% weight=95
    export function osAppend(filename: string, data: string): void {
        appendFile(filename, data + "\n");
        addToIndex(filename);
    }

    /**
     * Прочитать ВЕСЬ файл целиком как одну строку.
     */
    //% block="ОС: Прочитать весь файл %filename"
    //% weight=90
    export function osRead(filename: string): string {
        return readFile(filename);
    }

    /**
     * Прочитать конкретную строку из файла (индексация с 1).
     */
    //% block="ОС: Прочитать из файла %filename строку № %line"
    //% line.defl=1
    //% weight=89
    export function osReadLine(filename: string, line: number): string {
        let fullText = readFile(filename);
        if (fullText.length == 0) return "";
        
        let lines = fullText.split("\n");
        
        if (lines.length > 0 && lines[lines.length - 1] === "") {
            lines.pop();
        }

        let index = line - 1;
        if (index >= 0 && index < lines.length) {
            return lines[index];
        }
        return "";
    }

    /**
     * Определить, сколько ВСЕГО строк содержится в файле.
     */
    //% block="ОС: Количество строк в файле %filename"
    //% weight=88
    export function osLineCount(filename: string): number {
        let fullText = readFile(filename);
        if (fullText.length == 0) return 0;
        
        let lines = fullText.split("\n");
        if (lines.length > 0 && lines[lines.length - 1] === "") {
            lines.pop();
        }
        return lines.length;
    }

    /**
     * Проверить, существует ли файл.
     */
    //% block="ОС: Файл %filename существует?"
    //% weight=85
    export function osExists(filename: string): boolean {
        return fileExists(filename);
    }

    /**
     * Удалить файл.
     */
    //% block="ОС: Удалить файл %filename"
    //% weight=80
    export function osDelete(filename: string): void {
        removeFile(filename);
        removeFromIndex(filename);
    }

    /**
     * Получить размер файла в байтах.
     */
    //% block="ОС: Размер файла %filename (байт)"
    //% weight=75
    export function osSize(filename: string): number {
        return getFileSize(filename);
    }

    /**
     * Получить массив всех файлов на диске.
     */
    //% block="ОС: Список всех файлов"
    //% weight=70
    export function osList(): string[] {
        let index = readFile(INDEX_FILE);
        if (index.length == 0) return [];
        return index.split(",");
    }

    /**
     * Полное форматирование диска.
     */
    //% block="ОС: Форматировать систему (Очистить ВСЁ)"
    //% weight=60
    export function osFormat(): void {
        clearStorage();
    }
}
