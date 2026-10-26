import { useContext, useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import styles from './ContenidoFarmacos.module.css';

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
    const [filterQuery, setFilterQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (selectedFamily) {
            setSelectedCategory(selectedFamily);
        }
    }, [selectedFamily]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [drugsRes, familiesRes] = await Promise.all([
                drugService.getAllDrugs(),
                drugService.getAllFamilies()
            ]);

            if (drugsRes.success) {
                setDrugs(drugsRes.data);
                if (drugsRes.isOffline) setIsOffline(true);
            }
            if (familiesRes.success) {
                setCategories(familiesRes.data);
            }
            setIsLoading(false);
        };
        loadData();
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

    const filteredDrugs = useMemo(() => {
        const selLower = String(selectedCategory || 'all').toLowerCase();
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

            const query = filterQuery.trim().toLowerCase();
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
    }, [drugs, selectedCategory, filterQuery]);

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
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
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
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
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
                                const matchingCount = drugs.filter((d) =>
                                    d.atc?.some((a) =>
                                        a.categoryCode?.toLowerCase() === keyLower ||
                                        a.subcategoryCode?.toLowerCase() === keyLower
                                    )
                                ).length;
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
            ) : filteredDrugs.length > 0 ? (
                <div className={styles.grid}>
                    {filteredDrugs.map((drug) => (
                        <div
                            key={drug.id || drug._id || drug.name}
                            className={styles.card}
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
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitleGroup}>
                                    <h3 className={styles.cardTitle}>{drug.name}</h3>
                                    {drug.atc && drug.atc.length > 0 && (
                                        <span className={styles.cardAtcPill}>
                                            {drug.atc[0].code}
                                        </span>
                                    )}
                                </div>
                                {drug.atc && drug.atc.length > 0 && (
                                    <div className={styles.cardCategories}>
                                        {drug.atc.map((item, idx) => (
                                            <span key={idx} className={styles.categoryTag}>
                                                {item.subcategoryName || item.categoryName}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {drug.actionMechanism && (
                                <p className={styles.cardMechanism}>{drug.actionMechanism}</p>
                            )}

                            <div className={styles.cardFooter}>
                                <span className={styles.viewDetailLink}>
                                    {t.viewDetails} →
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
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