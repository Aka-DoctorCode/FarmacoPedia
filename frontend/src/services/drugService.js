import axios from 'axios';
import { CANONICAL_DRUG_ATC, parseAtcPath } from '../utils/atcTree.js';

class DrugService {
    constructor() {
        this.apiBaseUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) ||
            // eslint-disable-next-line no-undef
            (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
            'https://farmacopedia.onrender.com';
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

    async getAllDrugs(forceRefresh = false) {
        if (!forceRefresh && this.cachedDrugs) {
            return { success: true, data: this.cachedDrugs };
        }

        if (!forceRefresh && this.pendingDrugsPromise) {
            return this.pendingDrugsPromise;
        }

        this.pendingDrugsPromise = (async () => {
            try {
                const response = await axios.get(`${this.apiBaseUrl}/drugs`, { timeout: this.requestTimeout });
                if (response.data && response.data.success && Array.isArray(response.data.data)) {
                    const enriched = response.data.data.map((drug) => {
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
                    });
                    this.cachedDrugs = enriched;
                    return { success: true, data: enriched };
                }
                return { success: false, data: [], error: 'Invalid backend response' };
            } catch (error) {
                console.error('Error fetching drugs from backend:', error.message);
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
                return { success: false, data: [], error: error.message };
            } finally {
                this.pendingFamiliesPromise = null;
            }
        })();

        return this.pendingFamiliesPromise;
    }

    async getDrugsByAtcSubcategory(subcategoryCode) {
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
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/${encodeURIComponent(drugName.toLowerCase())}`, { timeout: this.requestTimeout });
            if (response.data && response.data.success && response.data.data) {
                return { success: true, data: response.data.data };
            }
            return { success: false, error: 'Drug not found' };
        } catch (error) {
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
}

export const drugService = new DrugService();
