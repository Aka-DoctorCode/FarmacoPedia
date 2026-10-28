import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { counterContext } from './counterContext.js';
import { drugService } from '../services/drugService.js';
import { translations } from '../utils/languageDictionary.js';

const StateContext = ({ children }) => {
    // Theme Management
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('clicksalud_farmacopedia_theme') || localStorage.getItem('farmacopedia_theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('clicksalud_farmacopedia_theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    // Language Management
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('clicksalud_farmacopedia_language') || localStorage.getItem('farmacopedia_language') || 'es';
    });

    useEffect(() => {
        localStorage.setItem('clicksalud_farmacopedia_language', language);
    }, [language]);

    const toggleLanguage = useCallback(() => {
        setLanguage((prev) => (prev === 'es' ? 'en' : 'es'));
    }, []);

    const t = translations[language] || translations.es;

    // Disclaimer Acceptance
    const [descargoVisible, setDescargoVisible] = useState(() => {
        const stored = localStorage.getItem('clicksalud_farmacopedia_disclaimer_accepted') || localStorage.getItem('farmacopedia_disclaimer_accepted');
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
            'clicksalud_farmacopedia_disclaimer_accepted',
            JSON.stringify({ accepted: true, timestamp: Date.now() })
        );
        setDescargoVisible(false);
    }, []);

    // Navigation & Views (la URL es la fuente de verdad)
    //   /                -> listado de fármacos
    //   /farmaco/:name   -> ficha individual de un fármaco
    //   /atc             -> raíz de la clasificación ATC (Nivel 1)
    //   /atc/:code       -> nodo ATC (Niveles 1-4), ej. /atc/J01FA
    const navigate = useNavigate();
    const location = useLocation();

    const { activeView, selectedDrugName, atcCode } = useMemo(() => {
        const drugMatch = matchPath('/farmaco/:name', location.pathname);
        if (drugMatch) {
            let parsedName = drugMatch.params.name;
            try {
                parsedName = decodeURIComponent(parsedName);
            } catch {
                // conservar si no es decodificable
            }
            return { activeView: 'drugDetail', selectedDrugName: parsedName, atcCode: null };
        }
        const atcMatch = matchPath('/atc/:code', location.pathname);
        if (atcMatch) {
            return { activeView: 'families', selectedDrugName: null, atcCode: atcMatch.params.code.toUpperCase() };
        }
        if (matchPath('/atc', location.pathname)) {
            return { activeView: 'families', selectedDrugName: null, atcCode: null };
        }
        return { activeView: 'drugs', selectedDrugName: null, atcCode: null };
    }, [location.pathname]);

    // En la ficha, recordamos desde qué rama ATC se llegó (para el botón "volver" y la barra inferior)
    const selectedFamily = activeView === 'drugDetail' ? (location.state?.family || null) : atcCode;

    // Global Search Modal
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load Drug Details
    const [loadedDrug, setLoadedDrug] = useState({ name: null, data: null });

    useEffect(() => {
        if (!selectedDrugName) return undefined;
        let isMounted = true;
        drugService.getDrugByName(selectedDrugName).then((result) => {
            if (isMounted) {
                setLoadedDrug({ name: selectedDrugName, data: result.success ? result.data : null });
            }
        });
        return () => {
            isMounted = false;
        };
    }, [selectedDrugName]);

    const isDrugLoading = Boolean(selectedDrugName) && loadedDrug.name !== selectedDrugName;
    const selectedDrugData = !isDrugLoading && selectedDrugName ? loadedDrug.data : null;

    const openDrugDetail = useCallback((drug) => {
        const drugName = typeof drug === 'string' ? drug : drug?.name;
        if (!drugName) return;
        navigate(`/farmaco/${encodeURIComponent(drugName)}`, {
            state: {
                from: `${location.pathname}${location.search}`,
                family: atcCode
            }
        });
    }, [navigate, location.pathname, location.search, atcCode]);

    const closeDrugDetail = useCallback(() => {
        navigate(location.state?.from || '/');
    }, [navigate, location.state]);

    const navigateToDrugs = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const navigateToFamilies = useCallback((familyCategory = null) => {
        navigate(familyCategory ? `/atc/${encodeURIComponent(familyCategory)}` : '/atc');
    }, [navigate]);

    // Legacy State Compatibility for Existing Handlers
    const listaFarmacos = activeView === 'drugs';
    const listaFamilia = activeView === 'families';
    const listaFarmacosMostrar = navigateToDrugs;
    const listaFarmacosOcultar = () => {};
    const listaFamiliaMostrar = navigateToFamilies;
    const listaFamiliaOcultar = () => {};
    const descargoOcultar = acceptDisclaimer;

    const contextValue = useMemo(() => ({
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
        selectedDrugName,
        selectedDrugData,
        isDrugLoading,
        selectedFamily,
        openDrugDetail,
        closeDrugDetail,
        navigateToDrugs,
        navigateToFamilies,
        searchModalOpen,
        setSearchModalOpen,
        searchQuery,
        setSearchQuery,
        // Legacy compatibility
        listaFarmacos,
        listaFarmacosMostrar,
        listaFarmacosOcultar,
        listaFamilia,
        listaFamiliaMostrar,
        listaFamiliaOcultar
    }), [
        theme,
        toggleTheme,
        language,
        toggleLanguage,
        t,
        descargoVisible,
        acceptDisclaimer,
        descargoOcultar,
        activeView,
        selectedDrugName,
        selectedDrugData,
        isDrugLoading,
        selectedFamily,
        openDrugDetail,
        closeDrugDetail,
        navigateToDrugs,
        navigateToFamilies,
        searchModalOpen,
        setSearchModalOpen,
        searchQuery,
        setSearchQuery,
        listaFarmacos,
        listaFarmacosMostrar,
        listaFarmacosOcultar,
        listaFamilia,
        listaFamiliaMostrar,
        listaFamiliaOcultar
    ]);

    return (
        <counterContext.Provider value={contextValue}>
            {children}
        </counterContext.Provider>
    );
};

export default StateContext;