import { useState, useEffect, useCallback } from 'react';
import { counterContext } from './counterContext.js';
import { drugService } from '../services/drugService.js';
import { translations } from '../utils/languageDictionary.js';

const StateContext = ({ children }) => {
    // Theme Management
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('farmacopedia_theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('farmacopedia_theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    // Language Management
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('farmacopedia_language') || 'es';
    });

    useEffect(() => {
        localStorage.setItem('farmacopedia_language', language);
    }, [language]);

    const toggleLanguage = useCallback(() => {
        setLanguage((prev) => (prev === 'es' ? 'en' : 'es'));
    }, []);

    const t = translations[language] || translations.es;

    // Disclaimer Acceptance
    const [descargoVisible, setDescargoVisible] = useState(() => {
        const stored = localStorage.getItem('farmacopedia_disclaimer_accepted');
        if (!stored) return true;
        try {
            const { timestamp } = JSON.parse(stored);
            const oneHour = 60 * 60 * 1000;
            return Date.now() - timestamp >= oneHour;
        } catch {
            return true;
        }
    });

    const acceptDisclaimer = useCallback(() => {
        localStorage.setItem(
            'farmacopedia_disclaimer_accepted',
            JSON.stringify({ accepted: true, timestamp: Date.now() })
        );
        setDescargoVisible(false);
    }, []);

    // Navigation & Views
    const [activeView, setActiveView] = useState('drugs'); // 'drugs' | 'families' | 'drugDetail'
    const [selectedDrugName, setSelectedDrugName] = useState(null);
    const [selectedDrugData, setSelectedDrugData] = useState(null);
    const [isDrugLoading, setIsDrugLoading] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [isOffline, setIsOffline] = useState(false);

    // Global Search Modal
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load Drug Details
    const openDrugDetail = useCallback(async (drug) => {
        const drugName = typeof drug === 'string' ? drug : drug?.name;
        if (!drugName) return;

        setSelectedDrugName(drugName);
        setActiveView('drugDetail');
        setIsDrugLoading(true);

        const result = await drugService.getDrugByName(drugName);
        if (result.success) {
            setSelectedDrugData(result.data);
            if (result.isOffline) setIsOffline(true);
        } else {
            setSelectedDrugData(null);
        }
        setIsDrugLoading(false);
    }, []);

    const closeDrugDetail = useCallback(() => {
        setSelectedDrugData(null);
        setSelectedDrugName(null);
        setActiveView('drugs');
    }, []);

    const navigateToDrugs = useCallback(() => {
        setActiveView('drugs');
        setSelectedFamily(null);
    }, []);

    const navigateToFamilies = useCallback((familyCategory = null) => {
        setActiveView('families');
        if (familyCategory) {
            setSelectedFamily(familyCategory);
        }
    }, []);

    // Legacy State Compatibility for Existing Handlers
    const listaFarmacos = activeView === 'drugs';
    const listaFamilia = activeView === 'families';
    const listaFarmacosMostrar = navigateToDrugs;
    const listaFarmacosOcultar = () => {};
    const listaFamiliaMostrar = navigateToFamilies;
    const listaFamiliaOcultar = () => {};
    const descargoOcultar = acceptDisclaimer;

    return (
        <counterContext.Provider
            value={{
                // Modern State & Methods
                theme,
                toggleTheme,
                language,
                toggleLanguage,
                t,
                descargoVisible,
                acceptDisclaimer,
                descargoOcultar,
                activeView,
                setActiveView,
                selectedDrugName,
                selectedDrugData,
                isDrugLoading,
                selectedFamily,
                setSelectedFamily,
                openDrugDetail,
                closeDrugDetail,
                navigateToDrugs,
                navigateToFamilies,
                searchModalOpen,
                setSearchModalOpen,
                searchQuery,
                setSearchQuery,
                isOffline,
                setIsOffline,
                // Legacy compatibility
                listaFarmacos,
                listaFarmacosMostrar,
                listaFarmacosOcultar,
                listaFamilia,
                listaFamiliaMostrar,
                listaFamiliaOcultar
            }}
        >
            {children}
        </counterContext.Provider>
    );
};

export default StateContext;