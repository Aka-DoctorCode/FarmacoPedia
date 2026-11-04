/**
 * ClickSalud FarmacoPedia - Offline Storage (IndexedDB)
 * Permite almacenar y consultar la base de datos de fármacos y familias localmente en el dispositivo.
 */

const DB_NAME = 'FarmacoPediaOfflineDB';
const DB_VERSION = 1;

const STORES = {
    DRUGS: 'drugs',
    FAMILIES: 'families',
    METADATA: 'metadata'
};

const normalizeKey = (str) => {
    return String(str || '').trim().toLowerCase();
};

/**
 * Abre y configura la base de datos IndexedDB
 */
export const openDB = () => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !('indexedDB' in window)) {
            reject(new Error('IndexedDB no está disponible en este entorno'));
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Almacén de Fármacos (clave primaria: nombre en minúsculas)
            if (!db.objectStoreNames.contains(STORES.DRUGS)) {
                const drugStore = db.createObjectStore(STORES.DRUGS, { keyPath: 'storageKey' });
                drugStore.createIndex('by_name', 'name', { unique: false });
            }

            // Almacén del Árbol de Familias ATC
            if (!db.objectStoreNames.contains(STORES.FAMILIES)) {
                db.createObjectStore(STORES.FAMILIES, { keyPath: 'categoryCode' });
            }

            // Almacén de Metadatos (última sincronización, conteo, etc.)
            if (!db.objectStoreNames.contains(STORES.METADATA)) {
                db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error || new Error('Error al abrir IndexedDB'));
        };
    });
};

/**
 * Guarda el lote completo de fármacos en IndexedDB de forma transaccional
 */
export const saveDrugsLocally = async (drugs) => {
    if (!Array.isArray(drugs) || drugs.length === 0) return 0;
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.DRUGS, STORES.METADATA], 'readwrite');
        const store = tx.objectStore(STORES.DRUGS);
        const metaStore = tx.objectStore(STORES.METADATA);

        // Limpiar store anterior para evitar inconsistencias
        store.clear();

        let count = 0;
        for (const drug of drugs) {
            if (drug && drug.name) {
                const storageKey = normalizeKey(drug.name);
                store.put({
                    ...drug,
                    storageKey
                });
                count++;
            }
        }

        metaStore.put({
            key: 'sync_info',
            totalDrugs: count,
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now()
        });

        tx.oncomplete = () => {
            resolve(count);
        };

        tx.onerror = (event) => {
            reject(event.target.error || new Error('Error al guardar fármacos en IndexedDB'));
        };
    });
};

/**
 * Guarda las familias ATC localmente
 */
export const saveFamiliesLocally = async (families) => {
    if (!Array.isArray(families) || families.length === 0) return 0;
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.FAMILIES, 'readwrite');
        const store = tx.objectStore(STORES.FAMILIES);
        store.clear();

        let count = 0;
        for (const fam of families) {
            if (fam && fam.categoryCode) {
                store.put(fam);
                count++;
            }
        }

        tx.oncomplete = () => resolve(count);
        tx.onerror = (e) => reject(e.target.error);
    });
};

/**
 * Obtiene todos los fármacos almacenados localmente
 */
export const getLocalDrugs = async () => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORES.DRUGS, 'readonly');
            const store = tx.objectStore(STORES.DRUGS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch {
        return [];
    }
};

/**
 * Busca un fármaco por su nombre en IndexedDB
 */
export const getLocalDrugByName = async (drugName) => {
    try {
        const key = normalizeKey(drugName);
        if (!key) return null;

        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORES.DRUGS, 'readonly');
            const store = tx.objectStore(STORES.DRUGS);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch {
        return null;
    }
};

/**
 * Obtiene todas las familias ATC almacenadas localmente
 */
export const getLocalFamilies = async () => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORES.FAMILIES, 'readonly');
            const store = tx.objectStore(STORES.FAMILIES);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch {
        return [];
    }
};

/**
 * Consulta metadatos sobre la base de datos local (fecha, total)
 */
export const getLocalDatabaseMetadata = async () => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORES.METADATA, 'readonly');
            const store = tx.objectStore(STORES.METADATA);
            const request = store.get('sync_info');

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
};

/**
 * Elimina la base de datos local para liberar espacio
 */
export const clearLocalDatabase = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.DRUGS, STORES.FAMILIES, STORES.METADATA], 'readwrite');
        tx.objectStore(STORES.DRUGS).clear();
        tx.objectStore(STORES.FAMILIES).clear();
        tx.objectStore(STORES.METADATA).clear();

        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
    });
};
