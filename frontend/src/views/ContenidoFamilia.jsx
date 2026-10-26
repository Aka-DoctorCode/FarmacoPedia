import { useContext, useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import {
    getAtcChildren,
    getDrugAtcCode,
    getLevelInfo,
    buildPathFromCode,
    searchAtcTree
} from '../utils/atcTree.js';
import { formatCategory } from '../utils/formatCategory.js';
import styles from './ContenidoFamilia.module.css';

const ContenidoFamilia = () => {
    const {
        openDrugDetail,
        selectedFamily,
        setSelectedFamily,
        t
    } = useContext(counterContext);

    const [allDrugs, setAllDrugs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // currentPath: Array of { code: string, name: string, level: number }
    // [] = Level 1 (Anatomical Root)
    // [{ code: 'J', name: 'Antiinfecciosos...', level: 1 }] = Level 2 (Therapeutic Main Group)
    // [..., { code: 'J01', name: 'Antibacterianos...', level: 2 }] = Level 3 (Pharmacological Group)
    // [..., { code: 'J01D', name: 'Otros Betalactámicos...', level: 3 }] = Level 4 (Chemical Subgroup / Generation)
    // [..., { code: 'J01DD', name: 'Cefalosporinas 3.ª gen', level: 4 }] = Level 5 (Active Substances / Drugs)
    const [currentPath, setCurrentPath] = useState([]);

    // Filter toggle: show only branches that contain registered drugs
    const [filterOnlyWithDrugs, setFilterOnlyWithDrugs] = useState(false);

    // Live search input
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all drugs on mount
    useEffect(() => {
        let isMounted = true;
        const fetchDrugs = async () => {
            setIsLoading(true);
            try {
                const response = await drugService.getAllDrugs();
                if (isMounted && response.success && Array.isArray(response.data)) {
                    setAllDrugs(response.data);
                }
            } catch (err) {
                console.error('Error fetching drugs for ATC tree:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchDrugs();
        return () => {
            isMounted = false;
        };
    }, []);

    // Handle deep navigation if selectedFamily is passed from context
    useEffect(() => {
        if (!selectedFamily) return;
        const path = buildPathFromCode(selectedFamily);
        if (path.length > 0) {
            setCurrentPath(path);
        }
    }, [selectedFamily]);

    // Current navigation level: 0 = Root (displays Level 1), 1 = Level 2, 2 = Level 3, 3 = Level 4, 4 = Leaf (Level 5)
    const currentLevel = currentPath.length;
    const currentNode = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
    const currentLevelInfo = useMemo(() => getLevelInfo(currentLevel + 1), [currentLevel]);

    // Get children for the current node
    const currentChildren = useMemo(() => {
        if (currentLevel >= 4) return [];
        const parentCode = currentNode ? currentNode.code : null;
        return getAtcChildren(parentCode, currentLevel);
    }, [currentLevel, currentNode]);

    // Compute drug counts for each child node
    const childrenWithStats = useMemo(() => {
        return currentChildren.map((child) => {
            const matching = allDrugs.filter((drug) => {
                const code = getDrugAtcCode(drug);
                return code && code.startsWith(child.code);
            });
            return {
                ...child,
                drugCount: matching.length,
                matchingDrugs: matching
            };
        });
    }, [currentChildren, allDrugs]);

    // Apply "filterOnlyWithDrugs" toggle
    const visibleChildren = useMemo(() => {
        if (!filterOnlyWithDrugs) return childrenWithStats;
        return childrenWithStats.filter((c) => c.drugCount > 0);
    }, [childrenWithStats, filterOnlyWithDrugs]);

    // When at leaf level (or if a branch has no sub-children), get the registered drugs for current node
    const leafDrugs = useMemo(() => {
        if (!currentNode) return [];
        return allDrugs.filter((drug) => {
            const code = getDrugAtcCode(drug);
            return code && code.startsWith(currentNode.code);
        });
    }, [currentNode, allDrugs]);

    const isLeafView = currentLevel >= 4 || (currentLevel > 0 && currentChildren.length === 0);

    // Search results when typing
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return searchAtcTree(searchQuery, allDrugs);
    }, [searchQuery, allDrugs]);

    // Navigation actions
    const handleDrillDown = (node) => {
        setCurrentPath((prev) => [
            ...prev,
            {
                code: node.code,
                name: node.name,
                level: node.level
            }
        ]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNavigateToBreadcrumb = (index) => {
        if (index === -1) {
            setCurrentPath([]);
        } else {
            setCurrentPath((prev) => prev.slice(0, index + 1));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackOneLevel = () => {
        setCurrentPath((prev) => prev.slice(0, -1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSelectDrug = (drug) => {
        if (currentNode) {
            setSelectedFamily(currentNode.code);
        }
        openDrugDetail(drug);
    };

    const handleSelectSearchResult = (result) => {
        if (result.type === 'drug' && result.drug) {
            openDrugDetail(result.drug);
        } else if (result.path && result.path.length > 0) {
            setCurrentPath(result.path);
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <section className={styles.container}>
            <Helmet>
                <title>{`Clasificación ATC OMS | ${t.appName || 'ClickSalud FarmacoPedia'}`}</title>
                <meta
                    name="description"
                    content="Navegador clínico jerárquico de 5 niveles basado en la clasificación Anatómica, Terapéutica y Química (ATC) de la Organización Mundial de la Salud."
                />
            </Helmet>

            {/* Hero Header */}
            <header className={styles.heroHeader}>
                <div className={styles.titleBadgeRow}>
                    <span className={styles.whoBadge}>Estándar OMS / WHO</span>
                    <span className={styles.levelBadge}>
                        {isLeafView ? 'Nivel 5: Principios Activos' : currentLevelInfo.title.split('—')[0].trim()}
                    </span>
                </div>
                <h1 className={styles.title}>Navegador de Familias ATC</h1>
                <p className={styles.subtitle}>
                    Explora fármacos a través de la clasificación Anatómica, Terapéutica y Química oficial en 5 niveles clínicos.
                </p>
            </header>

            {/* Search Bar */}
            <div className={styles.searchBarWrapper}>
                <svg
                    className={styles.searchIcon}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Buscar fármaco o código ATC (ej. Ceftriaxona, J01DD, N02BE)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Buscar en catálogo ATC"
                />
                {searchQuery && (
                    <button
                        type="button"
                        className={styles.clearSearchBtn}
                        onClick={() => setSearchQuery('')}
                        aria-label="Limpiar búsqueda"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* LIVE SEARCH RESULTS VIEW */}
            {searchQuery.trim().length > 0 ? (
                <div className={styles.searchResultsContainer}>
                    <div className={styles.searchResultsHeader}>
                        <h2 className={styles.searchResultsTitle}>
                            Resultados para &quot;{searchQuery}&quot;
                        </h2>
                        <span className={styles.searchResultsCount}>
                            {searchResults.length} encontrado{searchResults.length === 1 ? '' : 's'}
                        </span>
                    </div>

                    {searchResults.length === 0 ? (
                        <div className={styles.emptySearchBox}>
                            <p>No se encontraron fármacos ni categorías que coincidan con &quot;{searchQuery}&quot;.</p>
                            <button
                                type="button"
                                className={styles.resetSearchBtn}
                                onClick={() => setSearchQuery('')}
                            >
                                Ver catálogo completo
                            </button>
                        </div>
                    ) : (
                        <div className={styles.searchResultsList}>
                            {searchResults.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={styles.searchResultCard}
                                    onClick={() => handleSelectSearchResult(item)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            if (e.key === ' ') e.preventDefault();
                                            handleSelectSearchResult(item);
                                        }
                                    }}
                                >
                                    <div className={styles.searchResultMain}>
                                        <div className={styles.searchResultMeta}>
                                            <span className={item.type === 'drug' ? styles.drugResultBadge : styles.nodeResultBadge}>
                                                {item.type === 'drug' ? 'Fármaco' : `Nivel ${item.level} ATC`}
                                            </span>
                                            <span className={styles.searchResultCodePill}>{item.code}</span>
                                        </div>
                                        <h3 className={styles.searchResultTitleName}>{item.title}</h3>
                                        {item.matchSubtitle && (
                                            <p className={styles.searchResultSubtitle}>{item.matchSubtitle}</p>
                                        )}
                                        {item.path && item.path.length > 0 && (
                                            <div className={styles.searchResultPathRow}>
                                                <span className={styles.pathLabel}>Ruta ATC:</span>
                                                <div className={styles.pathPills}>
                                                    {item.path.map((step, sIdx) => (
                                                        <span key={sIdx} className={styles.pathPillItem}>
                                                            {step.code}
                                                            {sIdx < item.path.length - 1 && <span className={styles.pathSep}>›</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.searchResultActions}>
                                        {item.type === 'drug' ? (
                                            <button
                                                type="button"
                                                className={styles.primaryActionBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectSearchResult(item);
                                                }}
                                            >
                                                Ver Ficha →
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className={styles.secondaryActionBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectSearchResult(item);
                                                }}
                                            >
                                                Explorar Grupo →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* DRILL-DOWN HIERARCHICAL NAVIGATION VIEW */
                <>
                    {/* Interactive Breadcrumbs Bar */}
                    <nav className={styles.breadcrumbsNav} aria-label="Navegación taxonómica ATC">
                        <ol className={styles.breadcrumbsList}>
                            <li className={styles.breadcrumbItem}>
                                <button
                                    type="button"
                                    className={`${styles.breadcrumbButton} ${currentPath.length === 0 ? styles.breadcrumbButtonActive : ''}`}
                                    onClick={() => handleNavigateToBreadcrumb(-1)}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                    <span>Catálogo ATC</span>
                                </button>
                            </li>

                            {currentPath.map((step, index) => {
                                const isCurrent = index === currentPath.length - 1;
                                return (
                                    <li key={step.code} className={styles.breadcrumbItem}>
                                        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
                                        <button
                                            type="button"
                                            className={`${styles.breadcrumbButton} ${isCurrent ? styles.breadcrumbButtonActive : ''}`}
                                            onClick={() => handleNavigateToBreadcrumb(index)}
                                            aria-current={isCurrent ? 'page' : undefined}
                                            title={step.name}
                                        >
                                            <span className={styles.breadcrumbCode}>[{step.code}]</span>
                                            <span className={styles.breadcrumbLabel}>{formatCategory(step.name)}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>

                    {/* Level Description & Filter Bar */}
                    <div className={styles.levelHeaderCard}>
                        <div className={styles.levelHeaderInfo}>
                            {currentPath.length > 0 && (
                                <button
                                    type="button"
                                    className={styles.backButton}
                                    onClick={handleBackOneLevel}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                    <span>Volver</span>
                                </button>
                            )}
                            <div>
                                <h2 className={styles.levelHeaderTitle}>
                                    {isLeafView
                                        ? `Fármacos en [${currentNode?.code}] ${formatCategory(currentNode?.name)}`
                                        : currentLevelInfo.title}
                                </h2>
                                <p className={styles.levelHeaderDesc}>
                                    {isLeafView
                                        ? 'Principios activos y moléculas registradas en FarmacoPedia bajo este subgrupo químico.'
                                        : currentLevelInfo.desc}
                                </p>
                            </div>
                        </div>

                        {!isLeafView && (
                            <label className={styles.filterToggle}>
                                <input
                                    type="checkbox"
                                    checked={filterOnlyWithDrugs}
                                    onChange={(e) => setFilterOnlyWithDrugs(e.target.checked)}
                                    className={styles.filterCheckbox}
                                />
                                <span className={styles.filterToggleLabel}>
                                    Solo grupos con fármacos registrados
                                </span>
                            </label>
                        )}
                    </div>

                    {/* Content Section: Loading vs Leaf vs Grid Nodes */}
                    {isLoading ? (
                        <div className={styles.loadingGrid}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className={styles.skeletonCard} />
                            ))}
                        </div>
                    ) : isLeafView ? (
                        /* LEAF LEVEL (Level 4/5): Registered Drugs Cards */
                        <div className={styles.leafContainer}>
                            {leafDrugs.length === 0 ? (
                                <div className={styles.emptyCategoryBox}>
                                    <div className={styles.emptyIcon}>💊</div>
                                    <h3 className={styles.emptyTitle}>No hay fármacos registrados en este subgrupo</h3>
                                    <p className={styles.emptySubtitle}>
                                        Actualmente no contamos con fichas publicadas bajo el código [{currentNode?.code}].
                                        Puedes explorar otros subgrupos o solicitar la inclusión de un medicamento.
                                    </p>
                                    <button
                                        type="button"
                                        className={styles.emptyBackBtn}
                                        onClick={handleBackOneLevel}
                                    >
                                        ← Explorar otros subgrupos
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.drugsGrid}>
                                    {leafDrugs.map((drug) => {
                                        const atcCode = getDrugAtcCode(drug) || currentNode?.code;
                                        return (
                                            <article
                                                key={drug.name}
                                                className={styles.drugCard}
                                                onClick={() => handleSelectDrug(drug)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        if (e.key === ' ') e.preventDefault();
                                                        handleSelectDrug(drug);
                                                    }
                                                }}
                                            >
                                                <div className={styles.drugCardTop}>
                                                    <div className={styles.drugCardMeta}>
                                                        <span className={styles.drugCardAtcPill}>
                                                            ATC {atcCode}
                                                        </span>
                                                        <span className={styles.level5Badge}>Nivel 5 OMS</span>
                                                    </div>
                                                    <h3 className={styles.drugCardName}>{drug.name}</h3>
                                                </div>

                                                {drug.actionMechanism && (
                                                    <p className={styles.drugCardMechanism}>
                                                        {drug.actionMechanism}
                                                    </p>
                                                )}

                                                <div className={styles.drugCardFooter}>
                                                    <button
                                                        type="button"
                                                        className={styles.viewDrugDetailButton}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectDrug(drug);
                                                        }}
                                                    >
                                                        <span>Ver Monografía Completa</span>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M5 12h14" />
                                                            <path d="m12 5 7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* INTERMEDIATE LEVELS (Level 1, 2, 3, 4): ATC Nodes Grid */
                        <div className={styles.nodesContainer}>
                            {visibleChildren.length === 0 ? (
                                <div className={styles.emptyCategoryBox}>
                                    <p>No hay ramas con fármacos registrados activas en este nivel.</p>
                                    <button
                                        type="button"
                                        className={styles.resetSearchBtn}
                                        onClick={() => setFilterOnlyWithDrugs(false)}
                                    >
                                        Mostrar todas las ramas oficiales de la OMS
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.nodesGrid}>
                                    {visibleChildren.map((node) => {
                                        const hasDrugs = node.drugCount > 0;
                                        return (
                                            <button
                                                key={node.code}
                                                type="button"
                                                className={`${styles.nodeCard} ${hasDrugs ? styles.nodeCardWithDrugs : styles.nodeCardEmpty}`}
                                                onClick={() => handleDrillDown(node)}
                                            >
                                                <div className={styles.nodeCardLeft}>
                                                    <div className={styles.nodeCodeAndStats}>
                                                        <span className={styles.nodeCodeBadge}>
                                                            {node.code}
                                                        </span>
                                                        <span
                                                            className={`${styles.drugCountBadge} ${hasDrugs ? styles.drugCountHighlight : styles.drugCountMuted}`}
                                                        >
                                                            {hasDrugs
                                                                ? `${node.drugCount} fármaco${node.drugCount === 1 ? '' : 's'}`
                                                                : '0 fármacos'}
                                                        </span>
                                                    </div>

                                                    <h3 className={styles.nodeTitle}>
                                                        {formatCategory(node.name)}
                                                    </h3>

                                                    {node.desc && (
                                                        <p className={styles.nodeDesc}>{node.desc}</p>
                                                    )}
                                                </div>

                                                <div className={styles.nodeCardRight}>
                                                    <span className={styles.nodeArrow}>→</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default ContenidoFamilia;