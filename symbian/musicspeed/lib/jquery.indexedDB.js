class db {
    constructor(databaseName, version, onsuccess, onerror, onupgradeneeded) {
        var request = window.indexedDB.open(databaseName, version)
        request.onerror = function (event) {
            if (this.isType(onerror, 'function'))
                onerror(event);
        }
        request.onsuccess = function (event) {
            this.database = request.result;
            if (this.isType(onsuccess, 'function'))
                onsuccess(event);
        }
        request.onupgradeneeded = function (event) {
            this.database = event.target.result;
            if (this.isType(onupgradeneeded, 'function'))
                onupgradeneeded(event);
        }
    }
    createTable(tableName, entry) {
        if (!this.database.objectStoreNames.contains(tableName)) {
            if (this.isType(oentryj, 'function')) {
                var keys = Object.keys(entry);
                var objectStore = this.database.createObjectStore(tableName, { keyPath: 'id' });
                this.database.createObjectStore(tableName, { autoIncrement: true });
                for (var index = 0; index < keys.length; index++) {
                    var name = keys[index];
                    objectStore.createIndex(name, name, { unique: true });
                }
            }
        }
    }
    insert(tableName, entry, onsuccess, onerror) {
        if (this.isType(entry, 'function')) {
            var request = this.database.transaction([tableName], 'readwrite').objectStore(tableName).add(entry);
            request.onsuccess = function (event) {
                if (this.isType(onsuccess, 'function'))
                    onsuccess(event);
            };
            request.onerror = function (event) {
                if (this.isType(onerror, 'function'))
                    onerror(event);
            }
        }
    }
    select(tableName, onsuccess, onerror) {
        var transaction = this.database.transaction([tableName]);
        var objectStore = transaction.objectStore(tableName);
        var request = objectStore.get(1);
        request.onerror = function (event) {
            if (this.isType(onerror, 'function'))
                onerror(event);
        };
        request.onsuccess = function (event) {
            if (this.isType(onsuccess, 'function'))
                onsuccess(request.result, event);
        };
    }
    selectAll(tableName, onsuccess) {
        var objectStore = this.database.transaction(tableName).objectStore(tableName);
        objectStore.openCursor().onsuccess = function (event) {
            var result = [];
            var cursor = event.target.result;
            if (cursor) {
                result.push(cursor);
                cursor.continue();
            }
            if (this.isType(onsuccess, 'function'))
                onsuccess(result, event);
        };
    }
    update(tableName, entry, onsuccess, onerror) {
        if (this.isType(entry, 'function')) {
            var request = this.database.transaction([tableName], 'readwrite').objectStore(tableName).put(entry);
            request.onsuccess = function (event) {
                if (this.isType(onsuccess, 'function'))
                    onsuccess(event);
            };
            request.onerror = function (event) {
                if (this.isType(onerror, 'function'))
                    onerror(event);
            }
        }
    }
    delete(tableName, onsuccess) {
        var request = this.database.transaction([tableName], 'readwrite')
            .objectStore(tableName)
            .delete(1);
        request.onsuccess = function (event) {
            if (this.isType(onsuccess, 'function'))
                onsuccess(event);
        };
    }
    #isType(type, typeName) {
        if (type)
            return typeof type === typeName;
        return false;
    }
}