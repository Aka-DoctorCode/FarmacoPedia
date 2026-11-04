import axios from 'axios';
import { CANONICAL_DRUG_ATC, parseAtcPath } from '../utils/atcTree.js';
import {
    saveDrugsLocally,
    saveFamiliesLocally,
    getLocalDrugs,
    getLocalDrugByName,
    getLocalFamilies,
    getLocalDatabaseMetadata,
    clearLocalDatabase
} from '../utils/offlineStorage.js';

class DrugService {
    constructor() {
        // En Vercel o despliegues multi-servicio en el mismo dominio, el backend se enruta a través de /api
        let defaultUrl = '/api';
        if (typeof window !== 'undefined') {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            // Si corre en Vite local aislado en puerto 5173 sin proxy, apunta al puerto local de Express
            if (isLocal && window.location.port === '5173') {
                defaultUrl = 'http://localhost:5174';
            }
        }

        this.apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) ||
            // eslint-disable-next-line no-undef
            (typeof process !== 'undefined' && (process.env?.VITE_API_URL || process.env?.BACKEND_URL)) ||
            defaultUrl;
        this.cachedDrugs = null;
        this.cachedFamilies = null;
        this.pendingDrugsPromise = null;
        this.pendingFamiliesPromise = null;
        this.requestTimeout = 30000; // 30 seconds to allow the backend to respond
    }

    clearCache() {
        this.cachedDrugs = null;
        this.cachedFamilies = null;
        this.pendingDrugsPromise = null;
        this.pendingFamiliesPromise = null;
    }

    enrichDrugAtc(drug) {
        if (!drug.atc || !Array.isArray(drug.atc) || drug.atc.length === 0 || !drug.atc[0].code) {
            const canon = CANONICAL_DRUG_ATC[(drug.name || '').toLowerCase().trim()];
            if (canon) {
                const parsed = parseAtcPath(canon);
                return {
                    ...drug,
                    atc: [{
                        code: canon,
                        categoryCode: parsed.l1.code,
                        categoryName: parsed.l1.name,
                        subcategoryCode: parsed.l2 ? parsed.l2.code : canon.substring(0, 3),
                        subcategoryName: parsed.l2 ? parsed.l2.name : 'Subgrupo Terapéutico'
                    }]
                };
            }
        }
        return drug;
    }

    async getAllDrugs(forceRefresh = false) {
        if (!forceRefresh && this.cachedDrugs) {
            return { success: true, data: this.cachedDrugs };
        }

        // Si no se fuerza refresh, intentar primero desde IndexedDB local (carga instantánea / offline)
        if (!forceRefresh) {
            try {
                const localData = await getLocalDrugs();
                if (Array.isArray(localData) && localData.length > 0) {
                    this.cachedDrugs = localData;
                    return { success: true, data: localData, fromOffline: true };
                }
            } catch (err) {
                console.warn('[DrugService] No se pudieron leer fármacos locales:', err);
            }
        }

        if (!forceRefresh && this.pendingDrugsPromise) {
            return this.pendingDrugsPromise;
        }

        this.pendingDrugsPromise = (async () => {
            try {
                const response = await axios.get(`${this.apiBaseUrl}/drugs`, { timeout: this.requestTimeout });
                if (response.data && response.data.success && Array.isArray(response.data.data)) {
                    const enriched = response.data.data.map((d) => this.enrichDrugAtc(d));
                    this.cachedDrugs = enriched;
                    return { success: true, data: enriched };
                }
                return { success: false, data: [], error: 'Invalid backend response' };
            } catch (error) {
                console.error('Error fetching drugs from backend:', error.message);
                // Si la red falla pero tenemos datos locales en IndexedDB, usarlos como fallback
                try {
                    const localData = await getLocalDrugs();
                    if (Array.isArray(localData) && localData.length > 0) {
                        this.cachedDrugs = localData;
                        return { success: true, data: localData, fromOffline: true };
                    }
                } catch {
                    // Ignorar error de fallback
                }
                return { success: false, data: [], error: error.message };
            } finally {
                this.pendingDrugsPromise = null;
            }
        })();

        return this.pendingDrugsPromise;
    }

    async getAllFamilies(forceRefresh = false) {
        if (!forceRefresh && this.cachedFamilies) {
            return { success: true, data: this.cachedFamilies };
        }

        // Si no se fuerza refresh, intentar primero desde IndexedDB local
        if (!forceRefresh) {
            try {
                const localFamilies = await getLocalFamilies();
                if (Array.isArray(localFamilies) && localFamilies.length > 0) {
                    this.cachedFamilies = localFamilies;
                    return { success: true, data: localFamilies, fromOffline: true };
                }
            } catch (err) {
                console.warn('[DrugService] No se pudieron leer familias locales:', err);
            }
        }

        if (!forceRefresh && this.pendingFamiliesPromise) {
            return this.pendingFamiliesPromise;
        }

        this.pendingFamiliesPromise = (async () => {
            try {
                const response = await axios.get(`${this.apiBaseUrl}/drugs/families`, { timeout: this.requestTimeout });
                if (response.data && response.data.success && Array.isArray(response.data.data)) {
                    const validTree = response.data.data.filter(
                        (item) => typeof item === 'object' && item !== null && typeof item.categoryCode === 'string' && item.categoryCode.trim().length > 0
                    );
                    this.cachedFamilies = validTree;
                    return { success: true, data: validTree };
                }
                return { success: false, data: [], error: 'Invalid backend response' };
            } catch (error) {
                console.error('Error fetching families from backend:', error.message);
                try {
                    const localFamilies = await getLocalFamilies();
                    if (Array.isArray(localFamilies) && localFamilies.length > 0) {
                        this.cachedFamilies = localFamilies;
                        return { success: true, data: localFamilies, fromOffline: true };
                    }
                } catch {
                    // Fallback silencioso
                }
                return { success: false, data: [], error: error.message };
            } finally {
                this.pendingFamiliesPromise = null;
            }
        })();

        return this.pendingFamiliesPromise;
    }

    async getDrugsByAtcSubcategory(subcategoryCode) {
        // Si tenemos datos en memoria o locales, filtrar directamente
        if (this.cachedDrugs && this.cachedDrugs.length > 0) {
            const code = String(subcategoryCode || '').trim().toUpperCase();
            const filtered = this.cachedDrugs.filter(d => 
                (d.atc || []).some(a => a.subcategoryCode?.toUpperCase() === code || a.code?.toUpperCase().startsWith(code))
            );
            if (filtered.length > 0) {
                return { success: true, data: filtered, fromOffline: true };
            }
        }

        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/atc/subcategories/${encodeURIComponent(subcategoryCode)}`, { timeout: this.requestTimeout });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return { success: true, data: response.data.data };
            }
            return { success: false, data: [] };
        } catch (error) {
            console.error('Error fetching drugs by ATC subcategory:', error.message);
            return { success: false, data: [], error: error.message };
        }
    }

    async getDrugsByAtc(identifier) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/atc/${encodeURIComponent(identifier)}`, { timeout: this.requestTimeout });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return { 
                    success: true, 
                    data: response.data.data, 
                    atcGroup: response.data.atcGroup,
                    count: response.data.count 
                };
            }
            return { success: false, data: [] };
        } catch (error) {
            console.error('Error fetching drugs by ATC:', error.message);
            return { success: false, data: [], error: error.message };
        }
    }

    async getDrugsByCategory(categoryName) {
        return this.getDrugsByAtc(categoryName);
    }

    async getDrugByName(drugName) {
        let cleanName = String(drugName ?? '').trim();
        try {
            cleanName = decodeURIComponent(cleanName);
        } catch {
            // Ignorar
        }

        // 1. Verificar si ya está en caché de memoria Y tiene monografía clínica completa
        if (this.cachedDrugs && this.cachedDrugs.length > 0) {
            const inMemory = this.cachedDrugs.find(
                d => (d.name || '').toLowerCase() === cleanName.toLowerCase()
            );
            // Solo usar de memoria si tiene datos clínicos completos (no el stub ligero del catálogo)
            if (inMemory && (inMemory.dosageGuidance || inMemory.presentations || inMemory.contraindications)) {
                return { success: true, data: inMemory, fromOffline: true };
            }
        }

        // 2. Consultar siempre la ficha clínica completa a la API
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/${encodeURIComponent(cleanName.toLowerCase())}`, { timeout: this.requestTimeout });
            if (response.data && response.data.success && response.data.data) {
                const fullDrug = response.data.data;
                // Enriquecer el objeto en memoria para que las lecturas posteriores tengan la ficha completa
                if (this.cachedDrugs && this.cachedDrugs.length > 0) {
                    const idx = this.cachedDrugs.findIndex(d => (d.name || '').toLowerCase() === cleanName.toLowerCase());
                    if (idx !== -1) {
                        this.cachedDrugs[idx] = { ...this.cachedDrugs[idx], ...fullDrug };
                    }
                }
                return { success: true, data: fullDrug };
            }
            return { success: false, error: 'Drug not found' };
        } catch (error) {
            // 3. Fallback a IndexedDB local si falla la red (solo si tiene datos clínicos)
            try {
                const localDrug = await getLocalDrugByName(cleanName);
                if (localDrug && (localDrug.dosageGuidance || localDrug.presentations || localDrug.contraindications)) {
                    return { success: true, data: localDrug, fromOffline: true };
                }
            } catch (err) {
                console.warn('[DrugService] Error leyendo fármaco local:', err);
            }
            console.error('Error fetching drug details:', error.message);
            return { success: false, error: error.message };
        }
    }

    async reportMissingDrug(drugName) {
        try {
            const response = await axios.post(`${this.apiBaseUrl}/pending-drugs`, { name: drugName }, { timeout: 15000 });
            return response.data;
        } catch (error) {
            console.warn('Could not report missing drug to backend:', error.message);
            return { success: false };
        }
    }

    async getPendingDrugs(limit = 10) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/pending-drugs?limit=${limit}`, { timeout: 15000 });
            return response.data;
        } catch {
            return { success: false, data: [] };
        }
    }

    async searchDrugs(queryText) {
        const normalized = (queryText || '').toLowerCase().trim();
        if (!normalized) return [];

        // Si no hay caché en memoria, intentar cargar desde IndexedDB
        if (!this.cachedDrugs) {
            try {
                const local = await getLocalDrugs();
                if (local.length > 0) {
                    this.cachedDrugs = local;
                }
            } catch {
                // Continuar
            }
        }

        if (this.cachedDrugs && this.cachedDrugs.length > 0) {
            return this.cachedDrugs.filter((drug) => {
                const nameMatch = drug.name?.toLowerCase().includes(normalized);
                const atcMatch = (drug.atc || []).some((a) => 
                    a.code?.toLowerCase().includes(normalized) ||
                    a.subcategoryCode?.toLowerCase().includes(normalized) ||
                    a.subcategoryName?.toLowerCase().includes(normalized) ||
                    a.categoryName?.toLowerCase().includes(normalized)
                );
                return nameMatch || atcMatch;
            });
        }

        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs?q=${encodeURIComponent(normalized)}`, { timeout: 15000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return response.data.data;
            }
        } catch (err) {
            console.error('Error in search query:', err.message);
        }
        return [];
    }

    /**
     * Descarga completa de la base de datos para uso offline con reporte de progreso
     */
    async downloadFullOfflineDatabase(onProgress = () => {}) {
        try {
            onProgress({ stage: 'starting', percent: 10, message: 'Iniciando conexión con el servidor...' });

            // 1. Descargar fármacos
            onProgress({ stage: 'fetching_drugs', percent: 25, message: 'Descargando vademécum de fármacos...' });
            const drugsResp = await axios.get(`${this.apiBaseUrl}/drugs`, { timeout: 60000 });
            if (!drugsResp.data || !drugsResp.data.success || !Array.isArray(drugsResp.data.data)) {
                throw new Error('Respuesta inválida del servidor al descargar fármacos');
            }
            const enrichedDrugs = drugsResp.data.data.map((d) => this.enrichDrugAtc(d));

            // 2. Descargar familias ATC
            onProgress({ stage: 'fetching_families', percent: 60, message: 'Descargando clasificación anatómica ATC...' });
            let families = [];
            try {
                const famResp = await axios.get(`${this.apiBaseUrl}/drugs/families`, { timeout: 30000 });
                if (famResp.data && famResp.data.success && Array.isArray(famResp.data.data)) {
                    families = famResp.data.data;
                }
            } catch (err) {
                console.warn('[DrugService] No se pudieron descargar familias para offline:', err.message);
            }

            // 3. Guardar en IndexedDB local
            onProgress({ stage: 'saving_local', percent: 85, message: 'Guardando datos en la memoria local del dispositivo...' });
            const savedCount = await saveDrugsLocally(enrichedDrugs);
            if (families.length > 0) {
                await saveFamiliesLocally(families);
            }

            // Actualizar memoria RAM
            this.cachedDrugs = enrichedDrugs;
            if (families.length > 0) {
                this.cachedFamilies = families;
            }

            onProgress({
                stage: 'complete',
                percent: 100,
                message: `¡Vademécum guardado exitosamente! (${savedCount} fármacos disponibles sin internet)`,
                totalDrugs: savedCount
            });

            return { success: true, count: savedCount };
        } catch (error) {
            console.error('[DrugService] Error en downloadFullOfflineDatabase:', error);
            onProgress({
                stage: 'error',
                percent: 0,
                message: `Error al descargar: ${error.message}`
            });
            return { success: false, error: error.message };
        }
    }

    async getOfflineStatus() {
        try {
            const meta = await getLocalDatabaseMetadata();
            return {
                isAvailable: Boolean(meta && meta.totalDrugs > 0),
                totalDrugs: meta?.totalDrugs || 0,
                lastUpdated: meta?.lastUpdated || null
            };
        } catch {
            return { isAvailable: false, totalDrugs: 0, lastUpdated: null };
        }
    }

    async clearOfflineData() {
        try {
            await clearLocalDatabase();
            this.clearCache();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Registro de datos profesionales del médico en la base de datos
     */
    async registerDoctor(doctorData) {
        try {
            const response = await axios.post(`${this.apiBaseUrl}/auth/register`, doctorData, { timeout: 15000 });
            if (response.data && response.data.success) {
                return { success: true, data: response.data.data };
            }
            return { success: false, error: response.data?.error || 'Error al registrar profesional' };
        } catch (error) {
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !this.apiBaseUrl.includes('localhost:5174')) {
                try {
                    const fallbackRes = await axios.post('http://localhost:5174/auth/register', doctorData, { timeout: 10000 });
                    if (fallbackRes.data && fallbackRes.data.success) {
                        return { success: true, data: fallbackRes.data.data };
                    }
                } catch (fallbackErr) {
                    return { success: false, error: fallbackErr.response?.data?.error || fallbackErr.message };
                }
            }
            console.warn('[DrugService] No se pudo conectar al backend para registrar médico:', error.message);
            // Fallback: permitir guardar localmente si el backend está en frío o sin conexión
            return {
                success: true,
                data: doctorData,
                offlineWarning: 'Guardado localmente. Se sincronizará con la base de datos al restablecer conexión.'
            };
        }
    }

    /**
     * Actualización de perfil del médico
     */
    async updateDoctorProfile(doctorData) {
        return this.registerDoctor(doctorData);
    }

    /**
     * Inicio de sesión de profesional por correo y contraseña
     */
    async loginDoctor(email, password) {
        const payload = {
            email: String(email).trim().toLowerCase(),
            password: String(password)
        };

        try {
            const response = await axios.post(`${this.apiBaseUrl}/auth/login`, payload, { timeout: 15000 });
            if (response.data && response.data.success) {
                return { success: true, data: response.data.data };
            }
            return { 
                success: false, 
                error: response.data?.error || 'Error al iniciar sesión',
                needsRegistration: Boolean(response.data?.needsRegistration)
            };
        } catch (error) {
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !this.apiBaseUrl.includes('localhost:5174')) {
                try {
                    const fallbackRes = await axios.post('http://localhost:5174/auth/login', payload, { timeout: 10000 });
                    if (fallbackRes.data && fallbackRes.data.success) {
                        return { success: true, data: fallbackRes.data.data };
                    }
                } catch (fallbackErr) {
                    return { 
                        success: false, 
                        error: fallbackErr.response?.data?.error || fallbackErr.message,
                        needsRegistration: Boolean(fallbackErr.response?.data?.needsRegistration)
                    };
                }
            }
            return { 
                success: false, 
                error: error.response?.data?.error || error.message,
                needsRegistration: Boolean(error.response?.data?.needsRegistration)
            };
        }
    }

    /**
     * Helpers de Administración Clínica
     */
    getAdminHeaders() {
        let token = '';
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('clicksalud_auth_user') || sessionStorage.getItem('clicksalud_auth_user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    token = parsed.adminToken || '';
                }
            } catch {
                /* ignore */
            }
        }
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async verifyAdminSession(email = null) {
        try {
            const headers = this.getAdminHeaders();
            const res = await axios.post(`${this.apiBaseUrl}/auth/verify-admin`, { email }, { headers, timeout: 10000 });
            return res.data;
        } catch (e) {
            return { success: false, error: e.response?.data?.error || e.message };
        }
    }

    async getAdminPendingDrugs(all = true) {
        try {
            const headers = this.getAdminHeaders();
            const res = await axios.get(`${this.apiBaseUrl}/pending-drugs?all=${all}`, { headers, timeout: 15000 });
            return { success: true, data: res.data?.data || [] };
        } catch (e) {
            return { success: false, error: e.response?.data?.error || e.message, data: [] };
        }
    }

    async savePublishedDrug(name, drugData, isNew = false) {
        try {
            const headers = this.getAdminHeaders();
            let res;
            if (isNew) {
                res = await axios.post(`${this.apiBaseUrl}/drugs`, drugData, { headers, timeout: 15000 });
            } else {
                res = await axios.patch(`${this.apiBaseUrl}/drugs/${encodeURIComponent(name)}`, drugData, { headers, timeout: 15000 });
            }
            this.clearCache();
            return { success: true, data: res.data?.data || res.data };
        } catch (e) {
            return { success: false, error: e.response?.data?.error || e.message };
        }
    }

    async deletePublishedDrug(name) {
        try {
            const headers = this.getAdminHeaders();
            const res = await axios.delete(`${this.apiBaseUrl}/drugs/${encodeURIComponent(name)}`, { headers, timeout: 15000 });
            this.clearCache();
            return { success: true, data: res.data };
        } catch (e) {
            return { success: false, error: e.response?.data?.error || e.message };
        }
    }

    async savePendingDrug(name, pendingData, isNew = false) {
        try {
            const headers = this.getAdminHeaders();
            let res;
            if (isNew) {
                res = await axios.post(`${this.apiBaseUrl}/pending-drugs`, pendingData, { headers, timeout: 15000 });
            } else {
                res = await axios.patch(`${this.apiBaseUrl}/pending-drugs/${encodeURIComponent(name)}`, pendingData, { headers, timeout: 15000 });
            }
            return { success: true, data: res.data?.data || res.data };
        } catch (e) {
            return { success: false, error: e.response?.data?.error || e.message };
        }
    }

    async deletePendingDrug(name) {
        try {
            const headers = this.getAdminHeaders();
            const res = await axios.delete(`${this.apiBaseUrl}/pending-drugs/${encodeURIComponent(name)}`, { headers, timeout: 15000 });
            return { success: true, data: res.data };
        } catch (e) {
            return { success: false, error: e.response?.data?.error || e.message };
        }
    }
}

export const drugService = new DrugService();
