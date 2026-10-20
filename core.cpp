#include "pxt.h"
#include "MicroBit.h"

using namespace pxt;

namespace customOSFiles {

    //%
    void writeFile(String filename, String data) {
        if (!filename || !data) return;
        // Используем макрос MSTR для безопасного перевода строк в формат CODAL
        uBit.storage.put(MSTR(filename), (uint8_t*)MSTR(data).toCharArray(), MSTR(data).length());
    }

    //%
    String readFile(String filename) {
        if (!filename) return mkString("", 0);
        KeyValuePair* pair = uBit.storage.get(MSTR(filename));
        if (pair == NULL) return mkString("", 0);
        
        ManagedString d(pair->value, pair->valueLength);
        delete pair;
        // Используем макрос PSTR для возврата строки обратно в MakeCode
        return PSTR(d);
    }

    //%
    void removeFile(String filename) {
        if (!filename) return;
        uBit.storage.remove(MSTR(filename));
    }

    //%
    bool fileExists(String filename) {
        if (!filename) return false;
        KeyValuePair* pair = uBit.storage.get(MSTR(filename));
        if (pair == NULL) return false;
        delete pair;
        return true;
    }

    //%
    void appendFile(String filename, String data) {
        if (!filename || !data) return;
        
        KeyValuePair* pair = uBit.storage.get(MSTR(filename));
        ManagedString existing("");
        if (pair != NULL) {
            existing = ManagedString(pair->value, pair->valueLength);
            delete pair;
        }
        
        ManagedString updated = existing + MSTR(data);
        uBit.storage.put(MSTR(filename), (uint8_t*)updated.toCharArray(), updated.length());
    }

    //%
    int getFileSize(String filename) {
        if (!filename) return 0;
        KeyValuePair* pair = uBit.storage.get(MSTR(filename));
        if (pair == NULL) return 0;
        int len = pair->valueLength;
        delete pair;
        return len;
    }

    //%
    void clearStorage() {
        uBit.storage.clear(); 
    }
}
