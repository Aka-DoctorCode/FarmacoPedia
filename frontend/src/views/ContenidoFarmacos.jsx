import { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import { filterDrugsByQuery } from '../utils/drugSearch.js';
import styles from './ContenidoFarmacos.module.css';

const INITIAL_BATCH = 40;
const BATCH_SIZE = 30;

const ContenidoFarmacos = () => {
    const {
        openDrugDetail,
        isLoggedIn,
        t
    } = useContext(counterContext);

    const [drugs, setDrugs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [filterInput, setFilterInput] = useState('');
    const [debouncedFilter, setDebouncedFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Infinite Scroll / Lazy Loading progresivo
    const [displayLimit, setDisplayLimit] = useState(INITIAL_BATCH);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const sentinelRef = useRef(null);

    // Track scroll for "Volver arriba" button
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setShowScrollTop(window.scrollY > 450);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Debounce search query to avoid thrashing CPU & memory allocations on keystrokes
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilter(filterInput.trim().toLowerCase());
        }, 200);
        return () => clearTimeout(timer);
    }, [filterInput]);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [drugsRes, familiesRes] = await Promise.all([
                    drugService.getAllDrugs(),
                    drugService.getAllFamilies()
                ]);

                if (isMounted) {
                    if (drugsRes.success && Array.isArray(drugsRes.data)) {
                        setDrugs(drugsRes.data);
                    }
                    if (familiesRes.success && Array.isArray(familiesRes.data)) {
                        setCategories(familiesRes.data);
                    }
                }
            } catch (err) {
                console.error('[ContenidoFarmacos] Error al cargar fármacos:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

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

        const inCategory = selLower === 'all'
            ? drugs
            : drugs.filter((drug) =>
                drug.atc?.some((a) =>
                    a.categoryCode?.toLowerCase() === selLower ||
                    a.categoryName?.toLowerCase() === selLower ||
                    a.subcategoryCode?.toLowerCase() === selLower ||
                    a.subcategoryName?.toLowerCase() === selLower ||
                    a.code?.toLowerCase() === selLower
                )
            );

        return filterDrugsByQuery(inCategory, query, { includeMechanism: true });
    }, [drugs, selectedCategory, debouncedFilter]);

    // Resetear límite de visualización al cambiar filtros o búsqueda
    useEffect(() => {
        setDisplayLimit(INITIAL_BATCH);
    }, [selectedCategory, debouncedFilter]);

    // Fármacos visibles actualmente según lazy loading
    const visibleDrugs = useMemo(() => {
        return filteredDrugs.slice(0, displayLimit);
    }, [filteredDrugs, displayLimit]);

    const hasMore = displayLimit < filteredDrugs.length;

    // IntersectionObserver para cargar el siguiente bloque de fármacos de forma fluida
    useEffect(() => {
        if (!hasMore) return;
        const sentinelEl = sentinelRef.current;
        if (!sentinelEl) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setDisplayLimit((prev) => Math.min(prev + BATCH_SIZE, filteredDrugs.length));
                }
            },
            {
                rootMargin: '500px 0px 500px 0px',
                threshold: 0
            }
        );

        observer.observe(sentinelEl);
        return () => {
            observer.disconnect();
        };
    }, [hasMore, filteredDrugs.length]);

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
                        {filteredDrugs.length} {t.totalDrugsCount}
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

                <div className={styles.categorySelectWrapper}>
                    <svg className={styles.selectIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <select
                        id="mobileCategorySelect"
                        className={styles.categorySelect}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        aria-label="Filtrar por categoría ATC"
                    >
                        <option value="all">{t.allCategories} ({drugs.length})</option>
                        {categoryList.map((cat) => (
                            <option key={cat.id} value={cat.filterKey}>
                                {cat.label} ({categoryCounts.get(cat.filterKey.toLowerCase()) || 0})
                            </option>
                        ))}
                    </select>
                    <svg className={styles.chevronIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
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
                    {/* Loading & Infinite Scroll Content */}
                    {isLoading ? (
                        <div className={styles.loadingBox}>
                            <div className={styles.spinner} />
                            <p>Cargando vademécum clínico...</p>
                        </div>
                    ) : filteredDrugs.length > 0 ? (
                        <>
                            <div className={styles.drugList}>
                                {visibleDrugs.map((drug) => (
                                    <div
                                        key={drug.id || drug._id || drug.name}
                                        className={styles.drugListItem}
                                        onClick={() => {
                                            openDrugDetail(drug);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                if (e.key === ' ') e.preventDefault();
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
                                                    {drug.atc.map((item, idx) => {
                                                        const catName = item.subcategoryName || item.categoryName;
                                                        return (
                                                            <span key={idx} className={styles.categoryPill} title={catName}>
                                                                {catName}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Columna 2: Mecanismo de Acción (Protegido: requiere inicio de sesión) */}
                                        <div className={styles.itemClinicalCol}>
                                            {isLoggedIn ? (
                                                drug.actionMechanism ? (
                                                    <p className={styles.itemMechanism}>{drug.actionMechanism}</p>
                                                ) : (
                                                    <p className={styles.itemMechanismEmpty}>Monografía clínica disponible en el catálogo de FarmacoPedia.</p>
                                                )
                                            ) : (
                                                <span className={styles.itemMechanismLocked}>
                                                    🔒 Inicia sesión para ver mecanismo y posología
                                                </span>
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

                            {/* Centinela de scroll para carga infinita automática */}
                            {hasMore && (
                                <div ref={sentinelRef} className={styles.scrollSentinel}>
                                    <button
                                        type="button"
                                        className={styles.loadMoreBtn}
                                        onClick={() => setDisplayLimit((prev) => Math.min(prev + BATCH_SIZE, filteredDrugs.length))}
                                    >
                                        <span>Cargar más fármacos ({visibleDrugs.length} de {filteredDrugs.length})</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {!hasMore && filteredDrugs.length > INITIAL_BATCH && (
                                <div className={styles.scrollSentinel} style={{ opacity: 0.7 }}>
                                    <span>Has llegado al final del catálogo ({filteredDrugs.length} fármacos listados).</span>
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

            {/* Botón flotante 'Volver arriba' */}
            {showScrollTop && (
                <button
                    type="button"
                    className={styles.scrollToTopBtn}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    title="Volver al inicio del catálogo"
                    aria-label="Volver arriba"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m18 15-6-6-6 6" />
                    </svg>
                </button>
            )}
        </section>
    );
};

export default ContenidoFarmacos;
