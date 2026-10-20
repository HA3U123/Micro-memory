/**
 * Модуль Файловой Системы для micro:bit OS 
 * С пофайловым открытием/закрытием в ОЗУ для экономии памяти и защитой от износа
 */
//% color="#1e6b7b" icon="\uf0a0" block="Файлы ОС"
namespace customOSFiles {

    const INDEX_FILE = ".sys_files";

    // --- БУФЕР ОТКРЫТЫХ ФАЙЛОВ В ОЗУ ---
    let openFilesCache: { [key: string]: string } = {};

    function isSimulator(): boolean {
        return typeof uBit === "undefined";
    }

    // Внутренняя функция чтения индекса файлов (всегда работает напрямую с диском/симулятором)
    function getDiskIndex(): string {
        if (isSimulator()) return openFilesCache[INDEX_FILE] || "";
        return readFile(INDEX_FILE);
    }

    // Внутренняя функция записи индекса файлов
    function setDiskIndex(indexStr: string) {
        if (isSimulator()) {
            openFilesCache[INDEX_FILE] = indexStr;
        } else {
            let oldIndex = readFile(INDEX_FILE);
            if (oldIndex !== indexStr) {
                writeFile(INDEX_FILE, indexStr);
            }
        }
    }

    function addToIndex(filename: string) {
        if (filename == INDEX_FILE) return;
        let index = getDiskIndex();
        let list = index.length > 0 ? index.split(",") : [];
        if (list.indexOf(filename) === -1) {
            list.push(filename);
            setDiskIndex(list.join(","));
        }
    }

    function removeFromIndex(filename: string) {
        if (filename == INDEX_FILE) return;
        let index = getDiskIndex();
        let list = index.length > 0 ? index.split(",") : [];
        let itemIndex = list.indexOf(filename);
        if (itemIndex !== -1) {
            list.splice(itemIndex, 1);
            setDiskIndex(list.join(","));
        }
    }

    // --- НОВЫЕ БЛОКИ УПРАВЛЕНИЯ ПОТОКАМИ ---

    /**
     * ОТКРЫТЬ ФАЙЛ: Загружает указанный файл в оперативную память для работы.
     * Если файла нет на диске, он создается в ОЗУ как пустой.
     */
    //% block="ОС: Открыть файл %filename"
    //% weight=115
    export function osOpenFile(filename: string): void {
        // Если файл уже открыт в ОЗУ, ничего не делаем
        if (openFilesCache[filename] !== undefined) return;

        if (isSimulator()) {
            openFilesCache[filename] = openFilesCache[filename] || "";
        } else {
            // Проверяем физический диск
            if (fileExists(filename)) {
                openFilesCache[filename] = readFile(filename);
            } else {
                openFilesCache[filename] = ""; // Новый пустой файл в ОЗУ
            }
        }
    }

    /**
     * ЗАКРЫТЬ И СОХРАНИТЬ ФАЙЛ: Сверяет данные в ОЗУ с диском.
     * Если данные изменились — сохраняет их на Flash. Затем удаляет файл из ОЗУ.
     */
    //% block="ОС: Закрыть и сохранить файл %filename"
    //% weight=110
    export function osCloseFile(filename: string): void {
        // Если файл даже не был открыт в ОЗУ, игнорируем команду
        if (openFilesCache[filename] === undefined) return;

        if (!isSimulator()) {
            let ramData = openFilesCache[filename];
            let diskData = fileExists(filename) ? readFile(filename) : "___FILE_NOT_EXIST___";

            // ЗАЩИТА ОТ ИЗНОСА: Пишем на чип только если данные РЕАЛЬНО изменились
            if (ramData !== diskData) {
                writeFile(filename, ramData);
                addToIndex(filename);
            }
        } else {
            addToIndex(filename);
        }

        // Выгружаем файл из оперативной памяти для освобождения ОЗУ
        delete openFilesCache[filename];
    }

    /**
     * Проверить, открыт ли файл в оперативной памяти прямо сейчас.
     */
    //% block="ОС: Файл %filename открыт в ОЗУ?"
    //% weight=108
    export function osIsFileOpen(filename: string): boolean {
        return openFilesCache[filename] !== undefined;
    }


    // --- ПЕРЕРАБОТАННЫЕ СТАНДАРТНЫЕ БЛОКИ (РАБОТАЮТ ТОЛЬКО С ОТКРЫТЫМИ ФАЙЛАМИ) ---

    /**
     * Записать текст в файл (Файл ДОЛЖЕН быть предварительно открыт!).
     */
    //% block="ОС: Записать в файл %filename текст %data"
    //% weight=100
    export function osWrite(filename: string, data: string): void {
        if (openFilesCache[filename] === undefined) return; // Защита: файл закрыт
        openFilesCache[filename] = data;
    }

    /**
     * Дописать строку в открытый файл в ОЗУ.
     */
    //% block="ОС: Дописать строку %data в файл %filename"
    //% weight=95
    export function osAppend(filename: string, data: string): void {
        if (openFilesCache[filename] === undefined) return; // Защита: файл закрыт
        let current = openFilesCache[filename];
        openFilesCache[filename] = current + data + "\n";
    }

    /**
     * Прочитать весь текст из открытого файла.
     */
    //% block="ОС: Прочитать весь файл %filename"
    //% weight=90
    export function osRead(filename: string): string {
        if (openFilesCache[filename] === undefined) return ""; 
        return openFilesCache[filename];
    }

    /**
     * Прочитать конкретную строку из открытого файла.
     */
    //% block="ОС: Прочитать из файла %filename строку № %line"
    //% line.defl=1
    //% weight=89
    export function osReadLine(filename: string, line: number): string {
        if (openFilesCache[filename] === undefined) return "";
        let fullText = openFilesCache[filename];
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
     * Получить количество строк в открытом файле.
     */
    //% block="ОС: Количество строк в файле %filename"
    //% weight=88
    export function osLineCount(filename: string): number {
        if (openFilesCache[filename] === undefined) return 0;
        let fullText = openFilesCache[filename];
        if (fullText.length == 0) return 0;
        
        let lines = fullText.split("\n");
        if (lines.length > 0 && lines[lines.length - 1] === "") {
            lines.pop();
        }
        return lines.length;
    }

    /**
     * Проверить, существует ли файл вообще (ищет в глобальном списке на диске).
     */
    //% block="ОС: Файл %filename существует на диске?"
    //% weight=85
    export function osExists(filename: string): boolean {
        if (openFilesCache[filename] !== undefined) return true;
        let index = getDiskIndex();
        if (index.length == 0) return false;
        return index.split(",").indexOf(filename) !== -1;
    }

    /**
     * Полностью удалить файл (и из ОЗУ, и вычеркнуть с диска).
     */
    //% block="ОС: Удалить файл %filename"
    //% weight=80
    export function osDelete(filename: string): void {
        if (openFilesCache[filename] !== undefined) {
            delete openFilesCache[filename];
        }
        if (!isSimulator()) {
            if (fileExists(filename)) {
                removeFile(filename);
            }
        }
        removeFromIndex(filename);
    }

    /**
     * Получить размер открытого файла в байтах.
     */
    //% block="ОС: Размер файла %filename (байт)"
    //% weight=75
    export function osSize(filename: string): number {
        if (openFilesCache[filename] === undefined) return 0;
        return openFilesCache[filename].length;
    }

    /**
     * Список всех файлов, зарегистрированных в системе.
     */
    //% block="ОС: Список всех файлов на диске"
    //% weight=70
    export function osList(): string[] {
        let index = getDiskIndex();
        if (index.length == 0) return [];
        return index.split(",");
    }

    /**
     * Полное форматирование системы (очищает ОЗУ и стирает файлы с физического диска).
     */
    //% block="ОС: Форматировать систему (Очистить ВСЁ)"
    //% weight=60
    export function osFormat(): void {
        openFilesCache = {};
        if (!isSimulator()) {
            clearStorage();
        }
    }
}
