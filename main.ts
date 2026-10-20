/**
 * ЧАСТЬ 1: Системное ядро файловой системы (Внутренняя логика и кэш)
 */
namespace customOSFiles {
    export const INDEX_FILE = ".sys_files";

    // --- БУФЕР ОТКРЫТЫХ ФАЙЛОВ И ХЕШЕЙ В ОЗУ ---
    export let openFilesCache: { [key: string]: string } = {};
    export let lastSavedHashes: { [key: string]: number } = {}; 
    export let optimizationEnabled = true;

    // Простая и быстрая хэш-функция (DJB2) для контроля изменений текста
    export function getStringHash(str: string): number {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
        }
        return hash;
    }

    // Проверка среды: Симулятор браузера или реальная плата?
    export function isSimulator(): boolean {
        return typeof uBit === "undefined";
    }

    // Получить индекс файлов напрямую с диска или из симулятора
    export function getDiskIndex(): string {
        if (isSimulator()) return openFilesCache[INDEX_FILE] || "";
        return readFile(INDEX_FILE);
    }

    // Записать индекс файлов на диск с защитой от дублирования
    export function setDiskIndex(indexStr: string) {
        if (isSimulator()) {
            openFilesCache[INDEX_FILE] = indexStr;
        } else {
            let oldIndex = readFile(INDEX_FILE);
            if (getStringHash(oldIndex) !== getStringHash(indexStr)) {
                writeFile(INDEX_FILE, indexStr);
            }
        }
    }

    // Добавить имя файла в глобальный индекс системы
    export function addToIndex(filename: string) {
        if (filename == INDEX_FILE) return;
        let index = getDiskIndex();
        let list = index.length > 0 ? index.split(",") : [];
        if (list.indexOf(filename) === -1) {
            list.push(filename);
            setDiskIndex(list.join(","));
        }
    }

    // Удалить имя файла из глобального индекса системы
    export function removeFromIndex(filename: string) {
        if (filename == INDEX_FILE) return;
        let index = getDiskIndex();
        let list = index.length > 0 ? index.split(",") : [];
        let itemIndex = list.indexOf(filename);
        if (itemIndex !== -1) {
            list.splice(itemIndex, 1);
            setDiskIndex(list.join(","));
        }
    }
}
/**
 * ЧАСТЬ 2: Интерфейс блоков MakeCode (То, что отображается в палитре ОС)
 */
//% color="#1e6b7b" icon="\uf0a0" block="Файлы ОС"
namespace customOSFiles {

    /**
     * НАСТРОЙКА: Включить или выключить экстремальную оптимизацию износа памяти.
     */
    //% block="ОС: Оптимизация износа памяти %enable"
    //% enable.shadow="toggleOnOff"
    //% weight=120
    export function osSetOptimization(enable: boolean): void {
        optimizationEnabled = enable;
    }

    /**
     * ОТКРЫТЬ ФАЙЛ: Загружает указанный файл в оперативную память для работы.
     */
    //% block="ОС: Открыть файл %filename"
    //% weight=115
    export function osOpenFile(filename: string): void {
        if (openFilesCache[filename] !== undefined) return;

        if (isSimulator()) {
            openFilesCache[filename] = openFilesCache[filename] || "";
        } else {
            if (fileExists(filename)) {
                let data = readFile(filename);
                openFilesCache[filename] = data;
                lastSavedHashes[filename] = getStringHash(data);
            } else {
                openFilesCache[filename] = ""; 
                lastSavedHashes[filename] = getStringHash("");
            }
        }
    }

    /**
     * ЗАКРЫТЬ И СОХРАНИТЬ ФАЙЛ: Сверяет контрольные хэши ОЗУ и диска.
     */
    //% block="ОС: Закрыть и сохранить файл %filename"
    //% weight=110
    export function osCloseFile(filename: string): void {
        if (openFilesCache[filename] === undefined) return;

        if (!isSimulator()) {
            let ramData = openFilesCache[filename];
            let ramHash = getStringHash(ramData);
            let diskHash = lastSavedHashes[filename];

            if (!optimizationEnabled || ramHash !== diskHash) {
                writeFile(filename, ramData);
                lastSavedHashes[filename] = ramHash;
                addToIndex(filename);
            }
        } else {
            addToIndex(filename);
        }
        delete openFilesCache[filename];
    }

    /**
     * СОХРАНИТЬ ВСЕ ОТКРЫТЫЕ ФАЙЛЫ НА ДИСК.
     */
    //% block="ОС: Сохранить все открытые файлы на диск"
    //% weight=109
    export function osSaveAll(): void {
        for (let filename of Object.keys(openFilesCache)) {
            if (filename === INDEX_FILE) continue;
            
            if (!isSimulator()) {
                let ramData = openFilesCache[filename];
                let ramHash = getStringHash(ramData);
                let diskHash = lastSavedHashes[filename];

                if (!optimizationEnabled || ramHash !== diskHash) {
                    writeFile(filename, ramData);
                    lastSavedHashes[filename] = ramHash;
                    addToIndex(filename);
                }
            } else {
                addToIndex(filename);
            }
        }
    }

    /**
     * ЗАКРЫТЬ БЕЗ СОХРАНЕНИЯ.
     */
    //% block="ОС: Закрыть файл %filename БЕЗ сохранения"
    //% weight=108
    export function osCloseNoSave(filename: string): void {
        if (openFilesCache[filename] === undefined) return;
        delete openFilesCache[filename];
        delete lastSavedHashes[filename];
    }

    /**
     * Количество открытых файлов в ОЗУ прямо сейчас.
     */
    //% block="ОС: Количество открытых файлов в ОЗУ"
    //% weight=107
    export function osGetOpenFilesCount(): number {
        let count = Object.keys(openFilesCache).length;
        if (openFilesCache[INDEX_FILE] !== undefined) count--;
        return count < 0 ? 0 : count;
    }

    /**
     * Проверить, открыт ли файл в оперативной памяти прямо сейчас.
     */
    //% block="ОС: Файл %filename открыт в ОЗУ?"
    //% weight=106
    export function osIsFileOpen(filename: string): boolean {
        return openFilesCache[filename] !== undefined;
    }

    /**
     * Записать текст в файл (Файл ДОЛЖЕН быть предварительно открыт!).
     */
    //% block="ОС: Записать в файл %filename text %data"
    //% weight=100
    export function osWrite(filename: string, data: string): void {
        if (openFilesCache[filename] === undefined) return; 
        openFilesCache[filename] = data;
    }

    /**
     * Дописать строку в открытый файл в ОЗУ.
     */
    //% block="ОС: Дописать строку %data в файл %filename"
    //% weight=95
    export function osAppend(filename: string, data: string): void {
        if (openFilesCache[filename] === undefined) return; 
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
     * Проверить, существует ли файл вообще на диске.
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
     * Полностью удалить файл.
     */
    //% block="ОС: Удалить файл %filename"
    //% weight=80
    export function osDelete(filename: string): void {
        if (openFilesCache[filename] !== undefined) {
            delete openFilesCache[filename];
        }
        delete lastSavedHashes[filename];
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
     * Список всех файлов на диске.
     */
    //% block="ОС: Список всех файлов на диске"
    //% weight=70
    export function osList(): string[] {
        let index = getDiskIndex();
        if (index.length == 0) return [];
        return index.split(",");
    }

    /**
     * Полное форматирование системы.
     */
    //% block="ОС: Форматировать систему (Очистить ВСЁ)"
    //% weight=60
    export function osFormat(): void {
        openFilesCache = {};
        lastSavedHashes = {};
        if (!isSimulator()) {
            clearStorage();
        }
    }
}
