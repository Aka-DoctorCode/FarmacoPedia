import { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import styles from './ContenidoFarmacos.module.css';

const BATCH_SIZE = 24;

const ContenidoFarmacos = () => {
    const {
        openDrugDetail,
        selectedFamily,
        setSelectedFamily,
        setIsOffline,
        t
    } = useContext(counterContext);

    const [drugs, setDrugs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(selectedFamily || 'all');
    const [filterInput, setFilterInput] = useState('');
    const [debouncedFilter, setDebouncedFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const sentinelRef = useRef(null);

    // Debounce search query to avoid thrashing CPU & memory allocations on keystrokes
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilter(filterInput.trim().toLowerCase());
        }, 250);
        return () => clearTimeout(timer);
    }, [filterInput]);

    useEffect(() => {
        if (selectedFamily) {
            setSelectedCategory(selectedFamily);
        }
    }, [selectedFamily]);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            setIsLoading(true);
            const [drugsRes, familiesRes] = await Promise.all([
                drugService.getAllDrugs(),
                drugService.getAllFamilies()
            ]);

            if (isMounted) {
                if (drugsRes.success) {
                    setDrugs(drugsRes.data);
                    if (drugsRes.isOffline) setIsOffline(true);
                }
                if (familiesRes.success) {
                    setCategories(familiesRes.data);
                }
                setIsLoading(false);
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, [setIsOffline]);

    const categoryList = useMemo(() => {
        const mergedMap = new Map();

        (categories || []).forEach((cat) => {
            if (typeof cat === 'object' && cat !== null && cat.categoryCode) {
                const code = String(cat.categoryCode).trim();
                const name = String(cat.categoryName || code).trim();
                if (code) {
                    mergedMap.set(code, {
                        id: code,
                        label: `[${code}] ${name}`,
                        filterKey: code
                    });
                }
            }
        });

        // Also include any ATC Level 1 categories present in the loaded drugs list
        (drugs || []).forEach((drug) => {
            (drug.atc || []).forEach((a) => {
                if (a && a.categoryCode && !mergedMap.has(a.categoryCode)) {
                    mergedMap.set(a.categoryCode, {
                        id: a.categoryCode,
                        label: `[${a.categoryCode}] ${a.categoryName || a.categoryCode}`,
                        filterKey: a.categoryCode
                    });
                }
            });
        });

        return Array.from(mergedMap.values()).sort((a, b) => a.id.localeCompare(b.id));
    }, [categories, drugs]);

    // Precompute drug counts per category in O(N) single pass instead of O(N*M) in render loop
    const categoryCounts = useMemo(() => {
        const counts = new Map();
        for (let i = 0; i < drugs.length; i++) {
            const atcList = drugs[i].atc;
            if (!Array.isArray(atcList)) continue;
            const seen = new Set();
            for (let j = 0; j < atcList.length; j++) {
                const item = atcList[j];
                if (item.categoryCode) {
                    const cKey = item.categoryCode.toLowerCase();
                    if (!seen.has(cKey)) {
                        seen.add(cKey);
                        counts.set(cKey, (counts.get(cKey) || 0) + 1);
                    }
                }
                if (item.subcategoryCode) {
                    const scKey = item.subcategoryCode.toLowerCase();
                    if (!seen.has(scKey)) {
                        seen.add(scKey);
                        counts.set(scKey, (counts.get(scKey) || 0) + 1);
                    }
                }
            }
        }
        return counts;
    }, [drugs]);

    const filteredDrugs = useMemo(() => {
        const selLower = String(selectedCategory || 'all').toLowerCase();
        const query = debouncedFilter;

        return drugs.filter((drug) => {
            const matchesCategory =
                selLower === 'all' ||
                drug.atc?.some((a) => 
                    a.categoryCode?.toLowerCase() === selLower ||
                    a.categoryName?.toLowerCase() === selLower ||
                    a.subcategoryCode?.toLowerCase() === selLower ||
                    a.subcategoryName?.toLowerCase() === selLower ||
                    a.code?.toLowerCase() === selLower
                );

            const matchesQuery =
                !query ||
                drug.name?.toLowerCase().includes(query) ||
                drug.actionMechanism?.toLowerCase().includes(query) ||
                drug.atc?.some((a) =>
                    a.code?.toLowerCase().includes(query) ||
                    a.subcategoryCode?.toLowerCase().includes(query) ||
                    a.subcategoryName?.toLowerCase().includes(query) ||
                    a.categoryName?.toLowerCase() === query
                );

            return matchesCategory && matchesQuery;
        });
    }, [drugs, selectedCategory, debouncedFilter]);

    // Reset pagination window whenever filters change
    useEffect(() => {
        setVisibleCount(BATCH_SIZE);
    }, [selectedCategory, debouncedFilter]);

    // Slice only visible items to dramatically prune DOM tree and fiber memory
    const visibleDrugs = useMemo(() => {
        return filteredDrugs.slice(0, visibleCount);
    }, [filteredDrugs, visibleCount]);

    // IntersectionObserver for progressive infinite scroll
    useEffect(() => {
        if (visibleCount >= filteredDrugs.length) return;

        const currentSentinel = sentinelRef.current;
        if (!currentSentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredDrugs.length));
                }
            },
            { rootMargin: '300px' }
        );

        observer.observe(currentSentinel);
        return () => observer.disconnect();
    }, [visibleCount, filteredDrugs.length]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredDrugs.length));
    };

    return (
        <section className={styles.container}>
            <Helmet>
                <title>{`${t.allDrugsTitle} | ${t.appName}`}</title>
                <meta name="description" content={t.allDrugsSubtitle} />
            </Helmet>

            <div className={styles.heroHeader}>
                <div className={styles.heroTitleRow}>
                    <h1 className={styles.title}>{t.allDrugsTitle}</h1>
                    <span className={styles.countBadge}>
                        {drugs.length} {t.totalDrugsCount}
                    </span>
                </div>
                <p className={styles.subtitle}>{t.allDrugsSubtitle}</p>
            </div>

            {/* Mobile Filter & Search Bar */}
            <div className={styles.mobileFilterBar}>
                <div className={styles.searchInputWrapper}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Buscar por fármaco, categoría o código ATC (ej. N02, C09)..."
                        value={filterInput}
                        onChange={(e) => setFilterInput(e.target.value)}
                    />
                </div>

                <div className={styles.categoryChips}>
                    <button
                        type="button"
                        className={`${styles.chipButton} ${selectedCategory === 'all' ? styles.chipButtonActive : ''}`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        {t.allCategories}
                    </button>
                    {categoryList.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            className={`${styles.chipButton} ${selectedCategory === cat.filterKey ? styles.chipButtonActive : ''}`}
                            onClick={() => setSelectedCategory(cat.filterKey)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop Cockpit Layout: Sidebar + Main Grid */}
            <div className={styles.catalogWorkspace}>
                <aside className={styles.desktopSidebar}>
                    <div className={styles.sidebarStickyInner}>
                        <div className={styles.sidebarHeader}>
                            <h3 className={styles.sidebarTitle}>Filtrar Categoría ATC</h3>
                            <span className={styles.sidebarCountBadge}>{categoryList.length}</span>
                        </div>
                        <div className={styles.sidebarSearchWrapper}>
                            <input
                                className={styles.sidebarSearchInput}
                                type="text"
                                placeholder="Filtrar por nombre o código..."
                                value={filterInput}
                                onChange={(e) => setFilterInput(e.target.value)}
                            />
                        </div>
                        <nav className={styles.sidebarNavList}>
                            <button
                                type="button"
                                className={`${styles.sidebarNavItem} ${selectedCategory === 'all' ? styles.sidebarNavItemActive : ''}`}
                                onClick={() => setSelectedCategory('all')}
                            >
                                <span className={styles.sidebarItemName}>{t.allCategories}</span>
                                <span className={styles.sidebarItemCount}>{drugs.length}</span>
                            </button>
                            {categoryList.map((cat) => {
                                const keyLower = String(cat.filterKey || '').toLowerCase();
                                const matchingCount = categoryCounts.get(keyLower) || 0;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`${styles.sidebarNavItem} ${selectedCategory === cat.filterKey ? styles.sidebarNavItemActive : ''}`}
                                        onClick={() => setSelectedCategory(cat.filterKey)}
                                    >
                                        <span className={styles.sidebarItemCode}>{cat.filterKey}</span>
                                        <span className={styles.sidebarItemName}>{String(cat.label || '').replace(/^\[.*?\]\s*/, '')}</span>
                                        <span className={styles.sidebarItemCount}>{matchingCount}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                <div className={styles.catalogMainContent}>

            {/* Loading & Content */}
            {isLoading ? (
                <div className={styles.loadingBox}>
                    <div className={styles.spinner} />
                    <p>Cargando fármacos...</p>
                </div>
            ) : visibleDrugs.length > 0 ? (
                <>
                    <div className={styles.drugList}>
                        {visibleDrugs.map((drug) => (
                            <div
                                key={drug.id || drug._id || drug.name}
                                className={styles.drugListItem}
                                onClick={() => {
                                    setSelectedFamily(null);
                                    openDrugDetail(drug);
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        if (e.key === ' ') e.preventDefault();
                                        setSelectedFamily(null);
                                        openDrugDetail(drug);
                                    }
                                }}
                            >
                                {/* Columna 1: Identificación y Clasificación */}
                                <div className={styles.itemIdentityCol}>
                                    <div className={styles.itemTitleRow}>
                                        <h3 className={styles.drugName}>{drug.name}</h3>
                                        {drug.atc && drug.atc.length > 0 && (
                                            <span className={styles.drugAtcBadge}>
                                                {drug.atc[0].code}
                                            </span>
                                        )}
                                    </div>
                                    {drug.atc && drug.atc.length > 0 && (
                                        <div className={styles.itemCategoriesRow}>
                                            {drug.atc.map((item, idx) => (
                                                <span key={idx} className={styles.categoryPill}>
                                                    {item.subcategoryName || item.categoryName}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Columna 2: Mecanismo de Acción / Contexto Clínico */}
                                <div className={styles.itemClinicalCol}>
                                    {drug.actionMechanism ? (
                                        <p className={styles.itemMechanism}>{drug.actionMechanism}</p>
                                    ) : (
                                        <p className={styles.itemMechanismEmpty}>Monografía clínica disponible en el catálogo de FarmacoPedia.</p>
                                    )}
                                </div>

                                {/* Columna 3: Acción de Entrada / Navegación */}
                                <div className={styles.itemActionCol}>
                                    <span className={styles.desktopActionBtn}>
                                        {t.viewDetails}
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                    </span>
                                    <span className={styles.mobileChevron} aria-hidden="true">›</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progressive loading sentinel and manual fallback */}
                    {visibleCount < filteredDrugs.length && (
                        <div ref={sentinelRef} className={styles.scrollSentinel}>
                            <button
                                type="button"
                                className={styles.loadMoreBtn}
                                onClick={handleLoadMore}
                            >
                                Cargar más fármacos ({visibleCount} de {filteredDrugs.length})
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.emptyBox}>
                    <p>{t.emptyDrugsMessage}</p>
                </div>
            )}
                </div>
            </div>
        </section>
    );
};

export default ContenidoFarmacos;