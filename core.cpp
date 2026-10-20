#include "pxt.h"
#include "MicroBit.h"

using namespace pxt;

namespace customOSFiles {

    //%
    void writeFile(String filename, String data) {
        if (!filename || !data) return;
        ManagedString f = MSTR(filename);
        ManagedString d = MSTR(data);
        uBit.storage.put(f.toCharArray(), (uint8_t*)d.toCharArray(), d.length());
    }

    //%
    String readFile(String filename) {
        if (!filename) return mkString("", 0);
        ManagedString f = MSTR(filename);
        KeyValuePair* pair = uBit.storage.get(f.toCharArray());
        if (pair == NULL) return mkString("", 0);
        
        ManagedString d(pair->value, pair->valueLength);
        delete pair;
        return PSTR(d);
    }

    //%
    void removeFile(String filename) {
        if (!filename) return;
        ManagedString f = MSTR(filename);
        uBit.storage.remove(f.toCharArray());
    }

    //%
    bool fileExists(String filename) {
        if (!filename) return false;
        ManagedString f = MSTR(filename);
        KeyValuePair* pair = uBit.storage.get(f.toCharArray());
        if (pair == NULL) return false;
        delete pair;
        return true;
    }

    //%
    void appendFile(String filename, String data) {
        if (!filename || !data) return;
        ManagedString f = MSTR(filename);
        ManagedString d = MSTR(data);
        
        KeyValuePair* pair = uBit.storage.get(f.toCharArray());
        ManagedString existing("");
        if (pair != NULL) {
            existing = ManagedString(pair->value, pair->valueLength);
            delete pair;
        }
        
        ManagedString updated = existing + d;
        uBit.storage.put(f.toCharArray(), (uint8_t*)updated.toCharArray(), updated.length());
    }

    //%
    int getFileSize(String filename) {
        if (!filename) return 0;
        ManagedString f = MSTR(filename);
        KeyValuePair* pair = uBit.storage.get(f.toCharArray());
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
