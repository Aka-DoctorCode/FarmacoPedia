import { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import styles from './ContenidoFamilia.module.css';

const ContenidoFamilia = () => {
    const {
        openDrugDetail,
        selectedFamily,
        setSelectedFamily,
        t
    } = useContext(counterContext);

    const [families, setFamilies] = useState([]);
    const [openFamily, setOpenFamily] = useState(selectedFamily || null);
    const [familyDrugsMap, setFamilyDrugsMap] = useState({});
    const [loadingFamilyMap, setLoadingFamilyMap] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFamilies = async () => {
            setIsLoading(true);
            const response = await drugService.getAllFamilies();
            if (response.success && response.data) {
                setFamilies(response.data);
            }
            setIsLoading(false);
        };
        fetchFamilies();
    }, []);

    useEffect(() => {
        if (selectedFamily) {
            setOpenFamily(selectedFamily);
            loadDrugsForCategory(selectedFamily);
        }
    }, [selectedFamily]);

    const loadDrugsForCategory = async (categoryName) => {
        if (familyDrugsMap[categoryName]) return;

        setLoadingFamilyMap((prev) => ({ ...prev, [categoryName]: true }));
        const response = await drugService.getDrugsByCategory(categoryName);
        if (response.success && response.data) {
            setFamilyDrugsMap((prev) => ({ ...prev, [categoryName]: response.data }));
        }
        setLoadingFamilyMap((prev) => ({ ...prev, [categoryName]: false }));
    };

    const toggleAccordion = (family) => {
        if (openFamily === family) {
            setOpenFamily(null);
            setSelectedFamily(null);
        } else {
            setOpenFamily(family);
            setSelectedFamily(family);
            loadDrugsForCategory(family);
        }
    };

    const filteredFamilies = families.filter((family) =>
        family ? family.toLowerCase().includes(searchQuery.trim().toLowerCase()) : false
    );

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
                    placeholder="Buscar familia farmacológica..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className={styles.loadingBox}>
                    <div className={styles.spinner} />
                    <p>Cargando familias...</p>
                </div>
            ) : (
                <div className={styles.accordionList}>
                    {filteredFamilies.map((family, index) => {
                        const isOpen = openFamily === family;
                        const drugsInCategory = familyDrugsMap[family] || [];
                        const isCategoryLoading = loadingFamilyMap[family];

                        return (
                            <div key={index} className={styles.accordionItem}>
                                <button
                                    className={styles.accordionHeader}
                                    onClick={() => toggleAccordion(family)}
                                    aria-expanded={isOpen}
                                >
                                    <div className={styles.headerLeft}>
                                        <span className={styles.familyIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                                            </svg>
                                        </span>
                                        <span className={styles.familyName}>{family}</span>
                                    </div>
                                    <div className={styles.headerRight}>
                                        <svg
                                            className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}
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

                                {isOpen && (
                                    <div className={styles.accordionContent}>
                                        {isCategoryLoading ? (
                                            <p className={styles.emptyCategory}>Cargando fármacos...</p>
                                        ) : drugsInCategory.length > 0 ? (
                                            <div className={styles.drugsGrid}>
                                                {drugsInCategory.map((drug, drugIdx) => (
                                                    <button
                                                        key={drugIdx}
                                                        className={styles.drugButton}
                                                        onClick={() => openDrugDetail(drug)}
                                                    >
                                                        <span className={styles.drugButtonName}>
                                                            {drug.name}
                                                        </span>
                                                        <span className={styles.drugButtonArrow}>
                                                            →
                                                        </span>
                                                    </button>
                                                ))}
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
            )}
        </section>
    );
};

export default ContenidoFamilia;