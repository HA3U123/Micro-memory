#include "pxt.h"
#include "MicroBit.h"

using namespace pxt;

namespace customOSFiles {

    //%
    void writeFile(StringData* filename, StringData* data) {
        ManagedString f(filename);
        ManagedString d(data);
        uBit.storage.put(f, (uint8_t*)d.toCharArray(), d.length());
    }

    //%
    StringData* readFile(StringData* filename) {
        ManagedString f(filename);
        KeyValuePair* pair = uBit.storage.get(f);
        if (pair == NULL) return ManagedString("").leakData();
        
        ManagedString d(pair->value, pair->valueLength);
        delete pair;
        return d.leakData();
    }

    //%
    void removeFile(StringData* filename) {
        ManagedString f(filename);
        uBit.storage.remove(f);
    }

    //%
    bool fileExists(StringData* filename) {
        ManagedString f(filename);
        KeyValuePair* pair = uBit.storage.get(f);
        if (pair == NULL) return false;
        delete pair;
        return true;
    }

    //%
    void appendFile(StringData* filename, StringData* data) {
        ManagedString f(filename);
        ManagedString d(data);
        
        KeyValuePair* pair = uBit.storage.get(f);
        ManagedString existing("");
        if (pair != NULL) {
            existing = ManagedString(pair->value, pair->valueLength);
            delete pair;
        }
        
        ManagedString updated = existing + d;
        uBit.storage.put(f, (uint8_t*)updated.toCharArray(), updated.length());
    }

    //%
    int getFileSize(StringData* filename) {
        ManagedString f(filename);
        KeyValuePair* pair = uBit.storage.get(f);
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
