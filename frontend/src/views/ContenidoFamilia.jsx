import { useContext, useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import styles from './ContenidoFamilia.module.css';

const ContenidoFamilia = () => {
    const {
        openDrugDetail,
        selectedFamily,
        setSelectedFamily,
        navigateToDrugs,
        t
    } = useContext(counterContext);

    const [familiesData, setFamiliesData] = useState([]);
    const [openCategory, setOpenCategory] = useState(null);
    const [openSubcategories, setOpenSubcategories] = useState(new Set());
    const [subcategoryDrugsMap, setSubcategoryDrugsMap] = useState({});
    const [loadingSubcategoryMap, setLoadingSubcategoryMap] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFamilies = async () => {
            setIsLoading(true);
            const response = await drugService.getAllFamilies();
            if (response.success && response.data) {
                setFamiliesData(response.data);
            }
            setIsLoading(false);
        };
        fetchFamilies();
    }, []);

    // Helper: is the dataset tree-structured (objects with categoryCode & subcategories) or flat strings?
    const isTreeStructure = useMemo(() => {
        return Array.isArray(familiesData) && familiesData.length > 0 && typeof familiesData[0] === 'object' && 'categoryCode' in familiesData[0];
    }, [familiesData]);

    // Handle initial selection from context
    useEffect(() => {
        if (!selectedFamily || !isTreeStructure) return;
        const normSelected = selectedFamily.toLowerCase();
        
        // Find if selectedFamily matches a category or subcategory
        for (const cat of familiesData) {
            if (cat.categoryName?.toLowerCase() === normSelected || cat.categoryCode?.toLowerCase() === normSelected) {
                setOpenCategory(cat.categoryCode);
                return;
            }
            const matchedSub = cat.subcategories?.find(
                (s) => s.subcategoryName?.toLowerCase() === normSelected || s.subcategoryCode?.toLowerCase() === normSelected
            );
            if (matchedSub) {
                setOpenCategory(cat.categoryCode);
                setOpenSubcategories(new Set([matchedSub.subcategoryCode]));
                loadDrugsForSubcategory(matchedSub.subcategoryCode, matchedSub.drugs);
                return;
            }
        }
    }, [selectedFamily, isTreeStructure, familiesData]);

    const loadDrugsForSubcategory = async (subCode, preloadedDrugs = null) => {
        // Provide instant preview if available
        if (preloadedDrugs && preloadedDrugs.length > 0 && !subcategoryDrugsMap[subCode]) {
            setSubcategoryDrugsMap((prev) => ({ ...prev, [subCode]: preloadedDrugs }));
        }

        // Check if fully rich drug objects are already cached
        if (subcategoryDrugsMap[subCode] && subcategoryDrugsMap[subCode].some((d) => d.categories || d.actionMechanism)) {
            return;
        }

        setLoadingSubcategoryMap((prev) => ({ ...prev, [subCode]: true }));
        try {
            const response = await drugService.getDrugsByAtcSubcategory(subCode);
            if (response.success && response.data) {
                setSubcategoryDrugsMap((prev) => ({ ...prev, [subCode]: response.data }));
            }
        } finally {
            setLoadingSubcategoryMap((prev) => ({ ...prev, [subCode]: false }));
        }
    };

    const toggleCategory = (catCode) => {
        setOpenCategory((prev) => (prev === catCode ? null : catCode));
    };

    const toggleSubcategory = (subCode, preloadedDrugs) => {
        setOpenSubcategories((prev) => {
            const next = new Set(prev);
            if (next.has(subCode)) {
                next.delete(subCode);
            } else {
                next.add(subCode);
                loadDrugsForSubcategory(subCode, preloadedDrugs);
            }
            return next;
        });
    };

    // Filter categories and subcategories based on search query
    const filteredTree = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return familiesData;

        if (!isTreeStructure) {
            return familiesData.filter((item) => {
                if (typeof item !== 'string') return false;
                return item.toLowerCase().includes(q);
            });
        }

        return familiesData
            .map((cat) => {
                const catNameMatch = cat.categoryName?.toLowerCase().includes(q);
                const catCodeMatch = cat.categoryCode?.toLowerCase().includes(q);

                const matchingSubs = (cat.subcategories || []).filter((sub) => {
                    const subNameMatch = sub.subcategoryName?.toLowerCase().includes(q);
                    const subCodeMatch = sub.subcategoryCode?.toLowerCase().includes(q);
                    const drugMatch = (sub.drugs || []).some(
                        (d) => d.name?.toLowerCase().includes(q) || d.atcCode?.toLowerCase().includes(q)
                    );
                    return subNameMatch || subCodeMatch || drugMatch || catNameMatch || catCodeMatch;
                });

                if (catNameMatch || catCodeMatch || matchingSubs.length > 0) {
                    return {
                        ...cat,
                        subcategories: matchingSubs.length > 0 ? matchingSubs : cat.subcategories
                    };
                }
                return null;
            })
            .filter(Boolean);
    }, [familiesData, searchQuery, isTreeStructure]);

    // Auto-expand when searching
    useEffect(() => {
        if (!searchQuery.trim() || !isTreeStructure) return;
        const q = searchQuery.trim().toLowerCase();
        const autoOpenSubs = new Set();
        let firstOpenCat = null;

        filteredTree.forEach((cat) => {
            if (!firstOpenCat) firstOpenCat = cat.categoryCode;
            cat.subcategories?.forEach((sub) => {
                const subMatch =
                    sub.subcategoryName?.toLowerCase().includes(q) ||
                    sub.subcategoryCode?.toLowerCase().includes(q) ||
                    (sub.drugs || []).some((d) => d.name?.toLowerCase().includes(q) || d.atcCode?.toLowerCase().includes(q));
                if (subMatch) {
                    autoOpenSubs.add(sub.subcategoryCode);
                    if (sub.drugs && sub.drugs.length > 0) {
                        setSubcategoryDrugsMap((prev) => ({ ...prev, [sub.subcategoryCode]: sub.drugs }));
                    }
                }
            });
        });

        if (firstOpenCat) setOpenCategory(firstOpenCat);
        if (autoOpenSubs.size > 0) setOpenSubcategories(autoOpenSubs);
    }, [searchQuery, filteredTree, isTreeStructure]);

    return (
        <section className={styles.container}>
            <Helmet>
                <title>{`${t.familiesTitle} | ${t.appName}`}</title>
                <meta name="description" content={t.familiesSubtitle} />
            </Helmet>

            <div className={styles.heroHeader}>
                <h1 className={styles.title}>{t.familiesTitle}</h1>
                <p className={styles.subtitle}>{t.familiesSubtitle}</p>
            </div>

            <div className={styles.searchBarWrapper}>
                <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Buscar por código ATC, grupo anatómico o fármaco..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className={styles.loadingBox}>
                    <div className={styles.spinner} />
                    <p>Cargando clasificación anatómica y terapéutica ATC...</p>
                </div>
            ) : isTreeStructure ? (
                /* Nested Accordion for ATC Taxonomy */
                <div className={styles.accordionList}>
                    {filteredTree.map((cat) => {
                        const isCatOpen = openCategory === cat.categoryCode;
                        const subcategories = cat.subcategories || [];

                        return (
                            <div key={cat.categoryCode} className={styles.accordionItem}>
                                {/* Level 1: Category Header */}
                                <button
                                    type="button"
                                    className={`${styles.accordionHeader} ${isCatOpen ? styles.headerActive : ''}`}
                                    onClick={() => toggleCategory(cat.categoryCode)}
                                    aria-expanded={isCatOpen}
                                >
                                    <div className={styles.headerLeft}>
                                        <span className={styles.categoryCodeBadge}>
                                            {cat.categoryCode}
                                        </span>
                                        <span className={styles.familyName}>{cat.categoryName}</span>
                                    </div>
                                    <div className={styles.headerRight}>
                                        <span className={styles.countBadge}>
                                            {cat.totalDrugs} {cat.totalDrugs === 1 ? 'fármaco' : 'fármacos'}
                                        </span>
                                        <svg
                                            className={`${styles.chevronIcon} ${isCatOpen ? styles.chevronOpen : ''}`}
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Level 1 Content: Subcategories */}
                                {isCatOpen && (
                                    <div className={styles.categoryContent}>
                                        <div className={styles.subcategoriesList}>
                                            {subcategories.map((sub) => {
                                                const isSubOpen = openSubcategories.has(sub.subcategoryCode);
                                                const drugsInSub = subcategoryDrugsMap[sub.subcategoryCode] || sub.drugs || [];
                                                const isSubLoading = loadingSubcategoryMap[sub.subcategoryCode];

                                                return (
                                                    <div key={sub.subcategoryCode} className={styles.subcategoryItem}>
                                                        {/* Level 2: Subcategory Header */}
                                                        <button
                                                            type="button"
                                                            className={`${styles.subcategoryHeader} ${isSubOpen ? styles.subHeaderActive : ''}`}
                                                            onClick={() => toggleSubcategory(sub.subcategoryCode, sub.drugs)}
                                                            aria-expanded={isSubOpen}
                                                        >
                                                            <div className={styles.subHeaderLeft}>
                                                                <span className={styles.atcSubCodeBadge}>
                                                                    {sub.subcategoryCode}
                                                                </span>
                                                                <span className={styles.subcategoryName}>
                                                                    {sub.subcategoryName}
                                                                </span>
                                                            </div>
                                                            <div className={styles.subHeaderRight}>
                                                                <span className={styles.subCountBadge}>
                                                                    {sub.count}
                                                                </span>
                                                                <svg
                                                                    className={`${styles.chevronSmall} ${isSubOpen ? styles.chevronOpen : ''}`}
                                                                    width="16"
                                                                    height="16"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <path d="m6 9 6 6 6-6" />
                                                                </svg>
                                                            </div>
                                                        </button>

                                                        {/* Level 2 Content: Drugs Grid */}
                                                        {isSubOpen && (
                                                            <div className={styles.subcategoryContent}>
                                                                {isSubLoading && drugsInSub.length === 0 ? (
                                                                    <p className={styles.emptyCategory}>Cargando fármacos...</p>
                                                                ) : drugsInSub.length > 0 ? (
                                                                    <div className={styles.drugsGrid}>
                                                                        {drugsInSub.map((drug, drugIdx) => {
                                                                            const atcBadge = drug.atcCode || (drug.atc && drug.atc[0]?.code);
                                                                            return (
                                                                                <button
                                                                                    key={drugIdx}
                                                                                    type="button"
                                                                                    className={styles.drugButton}
                                                                                    onClick={() => {
                                                                                        setSelectedFamily(cat.categoryName);
                                                                                        openDrugDetail(drug);
                                                                                    }}
                                                                                >
                                                                                    <div className={styles.drugButtonInfo}>
                                                                                        <span className={styles.drugButtonName}>
                                                                                            {drug.name}
                                                                                        </span>
                                                                                        {atcBadge && (
                                                                                            <span className={styles.drugAtcPill}>
                                                                                                {atcBadge}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className={styles.drugButtonArrow}>
                                                                                        →
                                                                                    </span>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <p className={styles.emptyCategory}>
                                                                        {t.emptyFamilyDrugs}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : filteredTree.length === 0 ? (
                <div className={styles.emptyBox}>
                    <p>{t.emptyDrugsMessage || 'No se encontraron resultados para la búsqueda.'}</p>
                </div>
            ) : (
                /* Flat legacy fallback */
                <div className={styles.accordionList}>
                    {filteredTree.map((family, index) => (
                        <div key={index} className={styles.accordionItem}>
                            <button
                                type="button"
                                className={styles.accordionHeader}
                                onClick={() => {
                                    setSelectedFamily(family);
                                    navigateToDrugs();
                                }}
                            >
                                <span className={styles.familyName}>{family}</span>
                                <span className={styles.drugButtonArrow}>→</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default ContenidoFamilia;