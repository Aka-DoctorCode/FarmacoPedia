import { useContext, useState, useEffect, useRef } from 'react';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import styles from './SearchModal.module.css';

const SearchModal = () => {
    const {
        searchModalOpen,
        setSearchModalOpen,
        openDrugDetail,
        t
    } = useContext(counterContext);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [allDrugs, setAllDrugs] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        const loadCatalog = async () => {
            const result = await drugService.getAllDrugs();
            if (result.success) {
                setAllDrugs(result.data);
            }
        };
        loadCatalog();
    }, []);

    useEffect(() => {
        if (searchModalOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [searchModalOpen]);

    // Keyboard shortcut handler (Cmd/Ctrl + K or /)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSearchModalOpen((prev) => !prev);
            } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                setSearchModalOpen(true);
            } else if (e.key === 'Escape' && searchModalOpen) {
                setSearchModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchModalOpen, setSearchModalOpen]);

    // Search query filter
    useEffect(() => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) {
            setResults(allDrugs.slice(0, 10));
            return;
        }

        const fallbackResults = drugService.searchFallback(trimmed);
        if (fallbackResults.length > 0) {
            setResults(fallbackResults);
            return;
        }

        const filtered = allDrugs.filter((drug) => {
            const nameMatch = drug.name?.toLowerCase().includes(trimmed);
            const categoryMatch = drug.categories?.some((c) => c.toLowerCase().includes(trimmed));
            return nameMatch || categoryMatch;
        });
        setResults(filtered);
    }, [query, allDrugs]);

    if (!searchModalOpen) return null;

    return (
        <div
            className={styles.overlay}
            onClick={(e) => {
                if (e.target === e.currentTarget) setSearchModalOpen(false);
            }}
        >
            <div className={styles.modal} role="dialog" aria-modal="true">
                <div className={styles.searchHeader}>
                    <div className={styles.searchIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                    </div>
                    <input
                        ref={inputRef}
                        className={styles.searchInput}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                    />
                    <button
                        className={styles.closeButton}
                        onClick={() => setSearchModalOpen(false)}
                        aria-label="Cerrar"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                <div className={styles.resultsList}>
                    {results.length > 0 ? (
                        results.map((drug) => (
                            <button
                                key={drug.id || drug._id || drug.name}
                                className={styles.resultCard}
                                onClick={() => {
                                    setSearchModalOpen(false);
                                    openDrugDetail(drug);
                                }}
                            >
                                <div className={styles.resultTitleRow}>
                                    <span className={styles.resultName}>{drug.name}</span>
                                    {drug.categories && drug.categories.length > 0 && (
                                        <div className={styles.resultCategories}>
                                            {drug.categories.slice(0, 2).map((category, idx) => (
                                                <span key={idx} className={styles.resultBadge}>
                                                    {category}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {drug.actionMechanism && (
                                    <p className={styles.resultSnippet}>{drug.actionMechanism}</p>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            {t.emptyDrugsMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
