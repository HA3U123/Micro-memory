/**
 * Архитектурный модуль Файловой Системы для micro:bit OS с защитой от симулятора
 */
//% color="#1e6b7b" icon="\uf0a0" block="Файлы ОС"
namespace customOSFiles {

    const INDEX_FILE = ".sys_files";

    // --- СЕКТОР ЗАЩИТЫ ОТ СИМУЛЯТОРА ---
    // Виртуальное хранилище в оперативной памяти симулятора
    let simStorage: { [key: string]: string } = {};

    // Функция проверки: мы в симуляторе (на ПК) или на реальном железе?
    function isSimulator(): boolean {
        // Если объект uBit не определен, значит мы на 100% в симуляторе браузера
        return typeof uBit === "undefined";
    }

    // Обертка для записи данных
    function safeWrite(filename: string, data: string): void {
        if (isSimulator()) {
            simStorage[filename] = data;
        } else {
            writeFile(filename, data);
        }
    }

    // Обертка для чтения данных
    function safeRead(filename: string): string {
        if (isSimulator()) {
            return simStorage[filename] || "";
        } else {
            return readFile(filename);
        }
    }

    // Обертка для проверки существования файла
    function safeExists(filename: string): boolean {
        if (isSimulator()) {
            return simStorage[filename] !== undefined;
        } else {
            return fileExists(filename);
        }
    }

    // Обертка для удаления файла
    function safeRemove(filename: string): void {
        if (isSimulator()) {
            delete simStorage[filename];
        } else {
            removeFile(filename);
        }
    }

    // Обертка для дозаписи данных
    function safeAppend(filename: string, data: string): void {
        if (isSimulator()) {
            let current = simStorage[filename] || "";
            simStorage[filename] = current + data;
        } else {
            appendFile(filename, data);
        }
    }

    // Обертка для получения размера файла
    function safeSize(filename: string): number {
        if (isSimulator()) {
            let current = simStorage[filename] || "";
            return current.length; 
        } else {
            return getFileSize(filename);
        }
    }

    // Обертка для полной очистки
    function safeClear(): void {
        if (isSimulator()) {
            simStorage = {};
        } else {
            clearStorage();
        }
    }
    // --- КОНЕЦ СЕКТОРА ЗАЩИТЫ ---


    // Системные функции индексов ОС теперь используют защищенные обертки
    function addToIndex(filename: string) {
        if (filename == INDEX_FILE) return;
        let index = safeRead(INDEX_FILE);
        let list = index.split(",");
        if (list.indexOf(filename) === -1) {
            if (index.length > 0) {
                safeAppend(INDEX_FILE, "," + filename);
            } else {
                safeWrite(INDEX_FILE, filename);
            }
        }
    }

    function removeFromIndex(filename: string) {
        if (filename == INDEX_FILE) return;
        let index = safeRead(INDEX_FILE);
        let list = index.split(",");
        let itemIndex = list.indexOf(filename);
        if (itemIndex !== -1) {
            list.splice(itemIndex, 1);
            safeWrite(INDEX_FILE, list.join(","));
        }
    }

    /**
     * Создать или перезаписать файл в ОС.
     */
    //% block="ОС: Записать в файл %filename текст %data"
    //% weight=100
    export function osWrite(filename: string, data: string): void {
        safeWrite(filename, data);
        addToIndex(filename);
    }

    /**
     * Дописать строку в конец существующего файла. 
     */
    //% block="ОС: Дописать строку %data в файл %filename"
    //% weight=95
    export function osAppend(filename: string, data: string): void {
        safeAppend(filename, data + "\n");
        addToIndex(filename);
    }

    /**
     * Прочитать ВЕСЬ файл целиком как одну строку.
     */
    //% block="ОС: Прочитать весь файл %filename"
    //% weight=90
    export function osRead(filename: string): string {
        return safeRead(filename);
    }

    /**
     * Прочитать конкретную строку из файла (индексация с 1).
     */
    //% block="ОС: Прочитать из файла %filename строку № %line"
    //% line.defl=1
    //% weight=89
    export function osReadLine(filename: string, line: number): string {
        let fullText = safeRead(filename);
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
        let fullText = safeRead(filename);
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
        return safeExists(filename);
    }

    /**
     * Удалить файл.
     */
    //% block="ОС: Удалить файл %filename"
    //% weight=80
    export function osDelete(filename: string): void {
        safeRemove(filename);
        removeFromIndex(filename);
    }

    /**
     * Получить размер файла в байтах.
     */
    //% block="ОС: Размер файла %filename (байт)"
    //% weight=75
    export function osSize(filename: string): number {
        return safeSize(filename);
    }

    /**
     * Получить массив всех файлов на диске.
     */
    //% block="ОС: Список всех файлов"
    //% weight=70
    export function osList(): string[] {
        let index = safeRead(INDEX_FILE);
        if (index.length == 0) return [];
        return index.split(",");
    }

    /**
     * Полное форматирование диска.
     */
    //% block="ОС: Форматировать систему (Очистить ВСЁ)"
    //% weight=60
    export function osFormat(): void {
        safeClear();
    }
}
