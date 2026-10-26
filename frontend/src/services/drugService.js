import axios from 'axios';
import { CANONICAL_DRUG_ATC, parseAtcPath } from '../utils/atcTree.js';

class DrugService {
    constructor() {
        this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000';
        this.cachedDrugs = null;
        this.cachedFamilies = null;
        this.fallbackDrugs = null;
        this.pendingDrugsPromise = null;
        this.pendingFamiliesPromise = null;
    }

    async getFallbackDrugs() {
        if (!this.fallbackDrugs) {
            const { FALLBACK_DRUGS } = await import('./fallbackDataset.js');
            this.fallbackDrugs = FALLBACK_DRUGS;
        }
        return this.fallbackDrugs;
    }

    clearCache() {
        this.cachedDrugs = null;
        this.cachedFamilies = null;
        this.pendingDrugsPromise = null;
        this.pendingFamiliesPromise = null;
    }

    async getAllDrugs(forceRefresh = false) {
        if (!forceRefresh && this.cachedDrugs) {
            return { success: true, data: this.cachedDrugs, isOffline: false };
        }

        if (!forceRefresh && this.pendingDrugsPromise) {
            return this.pendingDrugsPromise;
        }

        this.pendingDrugsPromise = (async () => {
            try {
                const response = await axios.get(`${this.apiBaseUrl}/drugs`, { timeout: 3000 });
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
                    return { success: true, data: enriched, isOffline: false };
                }
                throw new Error('Invalid backend response');
            } catch (error) {
                const fallback = await this.getFallbackDrugs();
                const namesOnly = fallback.map((drug) => ({
                    id: drug.name,
                    _id: drug.name,
                    name: drug.name,
                    atc: drug.atc,
                    actionMechanism: drug.actionMechanism
                }));
                return { success: true, data: namesOnly, isOffline: true };
            } finally {
                this.pendingDrugsPromise = null;
            }
        })();

        return this.pendingDrugsPromise;
    }

    async getAllFamilies(forceRefresh = false) {
        if (!forceRefresh && this.cachedFamilies) {
            return { success: true, data: this.cachedFamilies, isOffline: false };
        }

        if (!forceRefresh && this.pendingFamiliesPromise) {
            return this.pendingFamiliesPromise;
        }

        this.pendingFamiliesPromise = (async () => {
            try {
                const response = await axios.get(`${this.apiBaseUrl}/drugs/families`, { timeout: 3000 });
                if (response.data && response.data.success && Array.isArray(response.data.data)) {
                    const validTree = response.data.data.filter(
                        (item) => typeof item === 'object' && item !== null && typeof item.categoryCode === 'string' && item.categoryCode.trim().length > 0
                    );
                    if (validTree.length === 0) {
                        throw new Error('Backend returned empty or legacy non-ATC families');
                    }
                    this.cachedFamilies = validTree;
                    return { success: true, data: validTree, isOffline: false };
                }
                throw new Error('Invalid backend response');
            } catch (error) {
                const fallback = await this.getFallbackDrugs();
                const categoryMap = new Map();
                fallback.forEach((drug) => {
                    (drug.atc || []).forEach((atc) => {
                        if (!categoryMap.has(atc.categoryCode)) {
                            categoryMap.set(atc.categoryCode, {
                                categoryCode: atc.categoryCode,
                                categoryName: atc.categoryName,
                                subcategories: new Map(),
                                totalDrugs: 0
                            });
                        }
                        const cat = categoryMap.get(atc.categoryCode);
                        if (!cat.subcategories.has(atc.subcategoryCode)) {
                            cat.subcategories.set(atc.subcategoryCode, {
                                subcategoryCode: atc.subcategoryCode,
                                subcategoryName: atc.subcategoryName,
                                count: 0,
                                drugs: []
                            });
                        }
                        const sub = cat.subcategories.get(atc.subcategoryCode);
                        if (!sub.drugs.some((d) => d.name === drug.name)) {
                            sub.drugs.push({ name: drug.name, atcCode: atc.code });
                            sub.count++;
                            cat.totalDrugs++;
                        }
                    });
                });
                const tree = Array.from(categoryMap.values()).map((c) => ({
                    ...c,
                    subcategories: Array.from(c.subcategories.values()).sort((a, b) => a.subcategoryCode.localeCompare(b.subcategoryCode))
                })).sort((a, b) => a.categoryCode.localeCompare(b.categoryCode));
                return { success: true, data: tree, isOffline: true };
            } finally {
                this.pendingFamiliesPromise = null;
            }
        })();

        return this.pendingFamiliesPromise;
    }

    async getDrugsByAtcSubcategory(subcategoryCode) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/atc/subcategories/${encodeURIComponent(subcategoryCode)}`, { timeout: 3000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return { success: true, data: response.data.data, isOffline: false };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            if (error.response?.status === 404) {
                return { success: true, data: [], isOffline: false };
            }
            const fallback = await this.getFallbackDrugs();
            const codeUpper = (subcategoryCode || '').toUpperCase();
            const matchedDrugs = fallback
                .filter((drug) => (drug.atc || []).some((a) => a.subcategoryCode?.toUpperCase() === codeUpper))
                .map((drug) => ({
                    id: drug.name,
                    _id: drug.name,
                    name: drug.name,
                    atc: drug.atc,
                    actionMechanism: drug.actionMechanism
                }));
            return { success: true, data: matchedDrugs, isOffline: true };
        }
    }

    async getDrugsByAtc(identifier) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/atc/${encodeURIComponent(identifier)}`, { timeout: 3000 });
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return { 
                    success: true, 
                    data: response.data.data, 
                    atcGroup: response.data.atcGroup,
                    count: response.data.count,
                    isOffline: false 
                };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            const fallback = await this.getFallbackDrugs();
            const upper = (identifier || '').toUpperCase();
            const lower = (identifier || '').toLowerCase();
            const matchedDrugs = fallback
                .filter((drug) => (drug.atc || []).some((a) => 
                    a.code?.toUpperCase() === upper ||
                    a.subcategoryCode?.toUpperCase() === upper ||
                    a.categoryCode?.toUpperCase() === upper ||
                    a.subcategoryName?.toLowerCase() === lower ||
                    a.categoryName?.toLowerCase() === lower
                ))
                .map((drug) => ({
                    id: drug.name,
                    _id: drug.name,
                    name: drug.name,
                    atc: drug.atc,
                    actionMechanism: drug.actionMechanism,
                    indications: (drug.indications || []).slice(0, 3)
                }));
            return { 
                success: true, 
                data: matchedDrugs, 
                atcGroup: { code: upper, name: identifier },
                count: matchedDrugs.length,
                isOffline: true 
            };
        }
    }

    async getDrugsByCategory(categoryName) {
        return this.getDrugsByAtc(categoryName);
    }

    async getDrugByName(drugName) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/drugs/${encodeURIComponent(drugName.toLowerCase())}`, { timeout: 3000 });
            if (response.data && response.data.success && response.data.data) {
                return { success: true, data: response.data.data, isOffline: false };
            }
            throw new Error('Invalid backend response');
        } catch (error) {
            const fallback = await this.getFallbackDrugs();
            const matchedDrug = fallback.find(
                (drug) => drug.name.toLowerCase() === drugName.toLowerCase()
            );
            if (matchedDrug) {
                return { success: true, data: matchedDrug, isOffline: true };
            }
            return { success: false, error: 'Drug not found', isOffline: true };
        }
    }

    async reportMissingDrug(drugName) {
        try {
            const response = await axios.post(`${this.apiBaseUrl}/pending-drugs`, { name: drugName }, { timeout: 3000 });
            return response.data;
        } catch (error) {
            console.warn('Could not report missing drug to backend:', error.message);
            return { success: false };
        }
    }

    async getPendingDrugs(limit = 10) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/pending-drugs?limit=${limit}`, { timeout: 3000 });
            return response.data;
        } catch (error) {
            return { success: false, data: [] };
        }
    }

    async searchFallback(queryText) {
        const normalized = queryText.toLowerCase().trim();
        if (!normalized) return [];

        const fallback = await this.getFallbackDrugs();
        return fallback.filter((drug) => {
            const nameMatch = drug.name.toLowerCase().includes(normalized);
            const atcMatch = (drug.atc || []).some((a) => 
                a.code?.toLowerCase().includes(normalized) ||
                a.subcategoryCode?.toLowerCase().includes(normalized) ||
                a.subcategoryName?.toLowerCase().includes(normalized) ||
                a.categoryName?.toLowerCase().includes(normalized)
            );
            const mechanismMatch = drug.actionMechanism ? drug.actionMechanism.toLowerCase().includes(normalized) : false;
            const indicationMatch = drug.indications ? drug.indications.some((ind) => ind.toLowerCase().includes(normalized)) : false;
            return nameMatch || atcMatch || mechanismMatch || indicationMatch;
        });
    }
}

export const drugService = new DrugService();
