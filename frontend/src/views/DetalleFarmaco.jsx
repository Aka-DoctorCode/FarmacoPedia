import { useContext, useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import { getDrugAtcCode, parseAtcPath } from '../utils/atcTree.js';
import styles from './DetalleFarmaco.module.css';

const PediatricCalculatorModal = lazy(() => import('../components/PediatricCalculatorModal.jsx'));

const getRiskSeverity = (text) => {
    if (!text) return 'info';
    const lower = text.toLowerCase();
    if (lower.includes('contraindicad') || lower.includes('evitar') || lower.includes('no recomendad')) {
        return 'danger';
    }
    if (lower.includes('precauci') || lower.includes('ajuste') || lower.includes('monitoreo') || lower.includes('reducir') || lower.includes('grave') || lower.includes('severa') || lower.includes('moderad')) {
        return 'warning';
    }
    if (lower.includes('seguro') || lower.includes('no requiere') || lower.includes('sin ajuste') || lower.includes('normal')) {
        return 'success';
    }
    return 'info';
};

const DetalleFarmaco = () => {
    const {
        selectedDrugData,
        isDrugLoading,
        closeDrugDetail,
        t
    } = useContext(counterContext);

    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'dosage' | 'risks' | 'safety' | 'references'
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

    const clinicalSections = useMemo(() => [
        {
            id: 'overview',
            title: t.tabOverview,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                </svg>
            )
        },
        {
            id: 'dosage',
            title: t.tabDosage,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                    <path d="m8.5 8.5 7 7" />
                </svg>
            )
        },
        {
            id: 'risks',
            title: t.tabRisks,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            )
        },
        {
            id: 'safety',
            title: t.tabSafety,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
            )
        },
        {
            id: 'references',
            title: t.tabReferences,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M6 6h10" />
                    <path d="M6 10h10" />
                </svg>
            )
        }
    ], [t]);

    const effectiveAtc = useMemo(() => {
        if (!selectedDrugData) return [];
        if (selectedDrugData.atc && Array.isArray(selectedDrugData.atc) && selectedDrugData.atc.length > 0 && selectedDrugData.atc[0].code) {
            return selectedDrugData.atc;
        }
        const code = getDrugAtcCode(selectedDrugData);
        if (code) {
            const parsed = parseAtcPath(code);
            return [{
                code,
                categoryCode: parsed.l1.code,
                categoryName: parsed.l1.name,
                subcategoryCode: parsed.l2 ? parsed.l2.code : code.substring(0, 3),
                subcategoryName: parsed.l2 ? parsed.l2.name : 'Subgrupo Terapéutico'
            }];
        }
        return [];
    }, [selectedDrugData]);

    const scrollToSection = (sectionId) => {
        const cleanTab = sectionId.replace(/^sec-/, '');
        setActiveTab(cleanTab);
        const element = document.getElementById(sectionId);
        if (element) {
            const yOffset = -90;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // Scroll spy for desktop view: update activeTab when scrolling past sections
    useEffect(() => {
        const sectionIds = ['sec-overview', 'sec-dosage', 'sec-risks', 'sec-safety', 'sec-references'];
        const handleScroll = () => {
            if (window.innerWidth < 1024) return;
            const scrollPos = window.scrollY + 140;
            for (let i = sectionIds.length - 1; i >= 0; i--) {
                const el = document.getElementById(sectionIds[i]);
                if (el && el.offsetTop <= scrollPos) {
                    setActiveTab(sectionIds[i].replace(/^sec-/, ''));
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (isDrugLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingBox}>
                    <div className={styles.spinner} />
                    <p>Cargando ficha farmacológica...</p>
                </div>
            </div>
        );
    }

    if (!selectedDrugData && !isDrugLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.topBar}>
                    <button type="button" className={styles.backButton} onClick={closeDrugDetail}>
                        ← {t.backToCatalog}
                    </button>
                </div>
                <div className={styles.sectionCard}>
                    <p className={styles.plainText}>{t.emptyDrugsMessage}</p>
                </div>
            </div>
        );
    }

    const drug = selectedDrugData;

    // Helper to safely format Map or Object presentations
    const presentationsEntries = drug.presentations
        ? Object.entries(drug.presentations)
        : [];

    const adultGuidanceEntries = drug.dosageGuidance?.adult
        ? Object.entries(drug.dosageGuidance.adult)
        : [];

    const pediatricGuidanceEntries = drug.dosageGuidance?.pediatric
        ? Object.entries(drug.dosageGuidance.pediatric)
        : [];

    return (
        <section className={styles.container}>
            <Helmet>
                <title>{`${drug.name.toUpperCase()} - Ficha Técnica | ${t.appName}`}</title>
                <meta
                    name="description"
                    content={`Ficha farmacológica completa de ${drug.name}: dosis, mecanismo, contraindicaciones y ajustes.`}
                />
            </Helmet>

            <div className={styles.topBar}>
                <button type="button" className={styles.backButton} onClick={closeDrugDetail}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    <span>{t.backToCatalog}</span>
                </button>
                <button
                    type="button"
                    className={styles.topBarCalcButton}
                    onClick={() => setIsCalculatorOpen(true)}
                    title={t.openPediatricCalculator || 'Calculadora Pediátrica'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="16" height="20" x="4" y="2" rx="2" />
                        <line x1="8" x2="16" y1="6" y2="6" />
                        <line x1="16" x2="16" y1="14" y2="18" />
                        <path d="M16 10h.01" />
                        <path d="M12 10h.01" />
                        <path d="M8 10h.01" />
                        <path d="M12 14h.01" />
                        <path d="M8 14h.01" />
                        <path d="M12 18h.01" />
                        <path d="M8 18h.01" />
                    </svg>
                    <span>{t.openPediatricCalculator || 'Calculadora Pediátrica'}</span>
                </button>
            </div>

            {/* Header Card */}
            <div className={styles.headerCard}>
                <div className={styles.drugTitleRow}>
                    <div className={styles.nameAndAtcGroup}>
                        <h1 className={styles.drugName}>{drug.name}</h1>
                        {effectiveAtc && effectiveAtc.length > 0 && (
                            <div className={styles.atcBadges}>
                                {effectiveAtc.map((item, idx) => (
                                    <div key={idx} className={styles.atcBadgeGroup}>
                                        <span className={styles.atcCodeBadge}>ATC {item.code}</span>
                                        {item.subcategoryName && (
                                            <span className={styles.atcSubcategoryBadge}>
                                                {item.subcategoryName}
                                            </span>
                                        )}
                                        {item.categoryName && (
                                            <span className={styles.atcCategoryBadge}>
                                                {item.categoryName}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Tabs */}
            {/* Mobile Section Dropdown Navigation */}
            <div className={styles.mobileSectionDropdownWrapper}>
                <button
                    type="button"
                    className={`${styles.mobileSectionDropdownButton} ${isSectionDropdownOpen ? styles.mobileSectionDropdownButtonActive : ''}`}
                    onClick={() => setIsSectionDropdownOpen(!isSectionDropdownOpen)}
                    aria-expanded={isSectionDropdownOpen}
                    aria-haspopup="listbox"
                    aria-label="Seleccionar sección clínica"
                >
                    <div className={styles.mobileDropdownCurrentInfo}>
                        <span className={styles.mobileDropdownIcon}>
                            {clinicalSections.find(s => s.id === activeTab)?.icon}
                        </span>
                        <div className={styles.mobileDropdownTextGroup}>
                            <span className={styles.mobileDropdownLabel}>Sección clínica</span>
                            <span className={styles.mobileDropdownCurrentTitle}>
                                {clinicalSections.find(s => s.id === activeTab)?.title}
                            </span>
                        </div>
                    </div>
                    <span className={`${styles.mobileDropdownChevron} ${isSectionDropdownOpen ? styles.mobileDropdownChevronOpen : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </span>
                </button>

                {isSectionDropdownOpen && (
                    <>
                        <div
                            className={styles.mobileDropdownBackdrop}
                            onClick={() => setIsSectionDropdownOpen(false)}
                            aria-hidden="true"
                        />
                        <div className={styles.mobileDropdownMenu} role="listbox">
                            {clinicalSections.map((sec) => (
                                <button
                                    key={sec.id}
                                    type="button"
                                    role="option"
                                    aria-selected={activeTab === sec.id}
                                    className={`${styles.mobileDropdownItem} ${activeTab === sec.id ? styles.mobileDropdownItemActive : ''}`}
                                    onClick={() => {
                                        setActiveTab(sec.id);
                                        setIsSectionDropdownOpen(false);
                                    }}
                                >
                                    <span className={styles.mobileDropdownItemIcon}>{sec.icon}</span>
                                    <span className={styles.mobileDropdownItemTitle}>{sec.title}</span>
                                    {activeTab === sec.id && (
                                        <span className={styles.mobileDropdownCheck}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Main Dual Workspace: Desktop Sidebar + Sections Stream */}
            <div className={styles.workspace}>
                {/* Desktop Sticky Clinic Sidebar */}
                <aside className={styles.desktopClinicSidebar}>
                    <div className={styles.sidebarStickyCard}>
                        <div className={styles.sidebarHeader}>
                            <span className={styles.sidebarSubtitle}>Índice Clínico</span>
                            <h3 className={styles.sidebarDrugTitle}>{drug.name}</h3>
                        </div>

                        <nav className={styles.sidebarNav} aria-label="Navegación clínica rápida">
                            <button
                                type="button"
                                className={`${styles.sidebarNavItem} ${activeTab === 'overview' ? styles.sidebarNavItemActive : ''}`}
                                onClick={() => scrollToSection('sec-overview')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                </svg>
                                <span>{t.tabOverview}</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.sidebarNavItem} ${activeTab === 'dosage' ? styles.sidebarNavItemActive : ''}`}
                                onClick={() => scrollToSection('sec-dosage')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                                    <path d="m8.5 8.5 7 7" />
                                </svg>
                                <span>{t.tabDosage}</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.sidebarNavItem} ${activeTab === 'risks' ? styles.sidebarNavItemActive : ''}`}
                                onClick={() => scrollToSection('sec-risks')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span>{t.tabRisks}</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.sidebarNavItem} ${activeTab === 'safety' ? styles.sidebarNavItemActive : ''}`}
                                onClick={() => scrollToSection('sec-safety')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                </svg>
                                <span>{t.tabSafety}</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.sidebarNavItem} ${activeTab === 'references' ? styles.sidebarNavItemActive : ''}`}
                                onClick={() => scrollToSection('sec-references')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                    <path d="M6 6h10" />
                                    <path d="M6 10h10" />
                                </svg>
                                <span>{t.tabReferences}</span>
                            </button>
                        </nav>

                        <div className={styles.sidebarActionBox}>
                            <button
                                type="button"
                                className={styles.sidebarCalcButton}
                                onClick={() => setIsCalculatorOpen(true)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="16" height="20" x="4" y="2" rx="2" />
                                    <line x1="8" x2="16" y1="6" y2="6" />
                                    <line x1="16" x2="16" y1="14" y2="18" />
                                    <path d="M16 10h.01" />
                                    <path d="M12 10h.01" />
                                    <path d="M8 10h.01" />
                                    <path d="M12 14h.01" />
                                    <path d="M8 14h.01" />
                                    <path d="M12 18h.01" />
                                    <path d="M8 18h.01" />
                                </svg>
                                <span>{t.openPediatricCalculator || 'Calculadora Pediátrica'}</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Sections Stream Area */}
                <div className={styles.detailMainContent}>
                    {/* Section 1: Overview & Indications */}
                    <div id="sec-overview" className={`${styles.sectionBlock} ${activeTab === 'overview' ? styles.tabBlockActive : styles.tabBlockHidden}`}>
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionMechanism}</h2>
                        </div>
                        <p className={styles.plainText}>{drug.actionMechanism || t.noData}</p>
                    </div>

                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 11 12 14 22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionIndications}</h2>
                        </div>
                        {drug.indications && drug.indications.length > 0 ? (
                            <ul className={styles.bulletList}>
                                {drug.indications.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.plainText}>{t.noData}</p>
                        )}
                    </div>

                    {drug.overdose && (
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </span>
                                <h2 className={styles.sectionTitle}>{t.sectionOverdose}</h2>
                            </div>
                            <p className={styles.plainText}>{drug.overdose}</p>
                        </div>
                    )}
                    </div>

                    {/* Section 2: Presentations & Dosage */}
                    <div id="sec-dosage" className={`${styles.sectionBlock} ${activeTab === 'dosage' ? styles.tabBlockActive : styles.tabBlockHidden}`}>
                        <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionPresentations}</h2>
                        </div>

                        {presentationsEntries.length > 0 ? (
                            <div className={styles.presentationsCompactList}>
                                {presentationsEntries.map(([formName, formValue], index) => (
                                    <div key={index} className={styles.compactPresentationRow}>
                                        <div className={styles.compactPresentationHeader}>
                                            <span className={styles.compactFormIcon}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                                                    <path d="m8.5 8.5 7 7" />
                                                </svg>
                                            </span>
                                            <span className={styles.compactPresentationTitle}>{formName}</span>
                                            <span className={styles.compactDosageCountBadge}>
                                                {formValue.dosage?.length || 0} {formValue.dosage?.length === 1 ? 'dosis' : 'dosis'}
                                            </span>
                                        </div>
                                        <div className={styles.compactDoseChipsWrapper}>
                                            {formValue.dosage && formValue.dosage.map((dose, doseIdx) => (
                                                <div key={doseIdx} className={styles.compactDoseChip}>
                                                    <span className={styles.compactDoseAmount}>
                                                        {dose.amount} {dose.unit}
                                                    </span>
                                                    {dose.useIn && (
                                                        <span className={styles.useInBadge}>
                                                            {dose.useIn}
                                                        </span>
                                                    )}
                                                    {dose.route && dose.route.length > 0 && (
                                                        <div className={styles.routeBadges}>
                                                            {dose.route.map((r, rIdx) => (
                                                                <span key={rIdx} className={styles.routeBadge}>
                                                                    {r}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.plainText}>{t.noData}</p>
                        )}
                    </div>

                    {/* Adult Dosage Guidance */}
                    {adultGuidanceEntries.length > 0 && (
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <h2 className={styles.sectionTitle}>{t.sectionAdultGuidance}</h2>
                            </div>
                            <div className={styles.guidanceGrid}>
                                {adultGuidanceEntries.map(([routeName, guideData], idx) => (
                                    <div key={idx} className={styles.guidanceCard}>
                                        <div className={styles.guidanceRouteName}>{routeName}</div>
                                        {guideData.guidelines && guideData.guidelines.length > 0 && (
                                            <div>
                                                <span className={styles.guidanceItemTitle}>{t.guidelines}</span>
                                                <ul className={styles.bulletList}>
                                                    {guideData.guidelines.map((g, gIdx) => (
                                                        <li key={gIdx}>{g}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {guideData.maxDose && guideData.maxDose.length > 0 && (
                                            <div>
                                                <span className={styles.guidanceItemTitle}>{t.maxDose}</span>
                                                <ul className={styles.bulletList}>
                                                    {guideData.maxDose.map((m, mIdx) => (
                                                        <li key={mIdx}>{m}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pediatric Dosage Guidance & Calculator Trigger */}
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeaderBetween}>
                            <div className={styles.sectionHeaderTitleGroup}>
                                <span className={styles.sectionIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="5" />
                                        <path d="M20 21a8 8 0 1 0-16 0" />
                                    </svg>
                                </span>
                                <h2 className={styles.sectionTitle}>{t.sectionPediatricGuidance}</h2>
                            </div>
                            <button
                                type="button"
                                className={styles.calculatorTriggerBtn}
                                onClick={() => setIsCalculatorOpen(true)}
                                title={t.openPediatricCalculator || 'Calculadora Pediátrica'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="16" height="20" x="4" y="2" rx="2" />
                                    <line x1="8" x2="16" y1="6" y2="6" />
                                    <line x1="16" x2="16" y1="14" y2="18" />
                                    <path d="M16 10h.01" />
                                    <path d="M12 10h.01" />
                                    <path d="M8 10h.01" />
                                    <path d="M12 14h.01" />
                                    <path d="M8 14h.01" />
                                    <path d="M12 18h.01" />
                                    <path d="M8 18h.01" />
                                </svg>
                                <span>{t.openPediatricCalculator || 'Calculadora Pediátrica'}</span>
                            </button>
                        </div>
                        {pediatricGuidanceEntries.length > 0 ? (
                            <div className={styles.guidanceGrid}>
                                {pediatricGuidanceEntries.map(([routeName, guideData], idx) => (
                                    <div key={idx} className={styles.guidanceCard}>
                                        <div className={styles.guidanceRouteName}>{routeName}</div>
                                        {guideData.guidelines && guideData.guidelines.length > 0 && (
                                            <div>
                                                <span className={styles.guidanceItemTitle}>{t.guidelines}</span>
                                                <ul className={styles.bulletList}>
                                                    {guideData.guidelines.map((g, gIdx) => (
                                                        <li key={gIdx}>{g}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {guideData.maxDose && guideData.maxDose.length > 0 && (
                                            <div>
                                                <span className={styles.guidanceItemTitle}>{t.maxDose}</span>
                                                <ul className={styles.bulletList}>
                                                    {guideData.maxDose.map((m, mIdx) => (
                                                        <li key={mIdx}>{m}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.plainText}>{t.noData}</p>
                        )}
                    </div>
                    </div>

                    {/* Section 3: Clinical Risks & Organ Adjustments */}
                    <div id="sec-risks" className={`${styles.sectionBlock} ${activeTab === 'risks' ? styles.tabBlockActive : styles.tabBlockHidden}`}>
                        {drug.risk?.securityFlags && drug.risk.securityFlags.length > 0 && (
                        <div className={styles.alertBox}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <div>
                                <strong>{t.sectionSecurityFlags}:</strong>
                                <ul className={styles.bulletList} style={{ marginTop: '0.35rem' }}>
                                    {drug.risk.securityFlags.map((flag, idx) => (
                                        <li key={idx}>{flag}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v20" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionRisks}</h2>
                        </div>

                        <div className={styles.riskRowsContainer}>
                            {/* Fila Embarazo */}
                            <div className={styles.riskTableRow}>
                                <div className={styles.riskRowHeaderCol}>
                                    <span className={styles.riskRowIcon}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 8v8" />
                                            <path d="M8 12h8" />
                                        </svg>
                                    </span>
                                    <span className={styles.riskRowTitle}>{t.sectionPregnancy}</span>
                                </div>
                                <div className={styles.riskRowContentCol}>
                                    <p className={styles.riskRowText}>{drug.risk?.pregnancy || t.noData}</p>
                                </div>
                            </div>

                            {/* Fila Lactancia */}
                            <div className={styles.riskTableRow}>
                                <div className={styles.riskRowHeaderCol}>
                                    <span className={styles.riskRowIcon}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 21a9 9 0 0 0 9-9c0-4.97-4.03-9-9-9s-9 4.03-9 9a9 9 0 0 0 9 9Z" />
                                            <path d="M12 7v5l3 3" />
                                        </svg>
                                    </span>
                                    <span className={styles.riskRowTitle}>{t.sectionLactation}</span>
                                </div>
                                <div className={styles.riskRowContentCol}>
                                    <p className={styles.riskRowText}>{drug.risk?.lactation || t.noData}</p>
                                </div>
                            </div>

                            {/* Fila Geriatría */}
                            <div className={styles.riskTableRow}>
                                <div className={styles.riskRowHeaderCol}>
                                    <span className={styles.riskRowIcon}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </span>
                                    <span className={styles.riskRowTitle}>{t.sectionGeriatric}</span>
                                </div>
                                <div className={styles.riskRowContentCol}>
                                    <p className={styles.riskRowText}>{drug.risk?.geriatric || t.noData}</p>
                                </div>
                            </div>

                            {/* Fila Renal */}
                            <div className={styles.riskTableRow}>
                                <div className={styles.riskRowHeaderCol}>
                                    <span className={styles.riskRowIcon}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                        </svg>
                                    </span>
                                    <span className={styles.riskRowTitle}>{t.sectionRenal}</span>
                                </div>
                                <div className={styles.riskRowContentCol}>
                                    {drug.risk?.renal?.level && (
                                        <div className={`${styles.riskAlertCallout} ${styles['riskAlert_' + getRiskSeverity(drug.risk.renal.level)]}`}>
                                            <span className={styles.riskAlertCalloutIcon}>
                                                {getRiskSeverity(drug.risk.renal.level) === 'danger' && (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                                )}
                                                {getRiskSeverity(drug.risk.renal.level) === 'warning' && (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                                )}
                                                {getRiskSeverity(drug.risk.renal.level) === 'success' && (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                                )}
                                                {getRiskSeverity(drug.risk.renal.level) === 'info' && (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                                )}
                                            </span>
                                            <div className={styles.riskAlertCalloutBody}>
                                                <span className={styles.riskAlertCalloutTag}>Criterio / Nivel:</span>
                                                <span className={styles.riskAlertCalloutText}>{drug.risk.renal.level}</span>
                                            </div>
                                        </div>
                                    )}
                                    {drug.risk?.renal?.adjustment ? (
                                        <p className={styles.riskRowText}>{drug.risk.renal.adjustment}</p>
                                    ) : (
                                        !drug.risk?.renal?.level && <p className={styles.riskRowText}>{t.noData}</p>
                                    )}
                                </div>
                            </div>

                            {/* Fila Hepática */}
                            <div className={styles.riskTableRow}>
                                <div className={styles.riskRowHeaderCol}>
                                    <span className={styles.riskRowIcon}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                            <path d="m4.93 4.93 4.24 4.24" />
                                            <path d="m14.83 9.17 4.24-4.24" />
                                        </svg>
                                    </span>
                                    <span className={styles.riskRowTitle}>{t.sectionHepatic}</span>
                                </div>
                                <div className={styles.riskRowContentCol}>
                                    {drug.risk?.hepatic?.level && (
                                        <div className={`${styles.riskAlertCallout} ${styles['riskAlert_' + getRiskSeverity(drug.risk.hepatic.level)]}`}>
                                            <span className={styles.riskAlertCalloutIcon}>
                                                {getRiskSeverity(drug.risk.hepatic.level) === 'danger' && (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                                )}
                                                {getRiskSeverity(drug.risk.hepatic.level) === 'warning' && (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                                )}
                                                {getRiskSeverity(drug.risk.hepatic.level) === 'success' && (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                                )}
                                                {getRiskSeverity(drug.risk.hepatic.level) === 'info' && (
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                                )}
                                            </span>
                                            <div className={styles.riskAlertCalloutBody}>
                                                <span className={styles.riskAlertCalloutTag}>Criterio / Nivel:</span>
                                                <span className={styles.riskAlertCalloutText}>{drug.risk.hepatic.level}</span>
                                            </div>
                                        </div>
                                    )}
                                    {drug.risk?.hepatic?.adjustment ? (
                                        <p className={styles.riskRowText}>{drug.risk.hepatic.adjustment}</p>
                                    ) : (
                                        !drug.risk?.hepatic?.level && <p className={styles.riskRowText}>{t.noData}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>

                    {/* Section 4: Contraindications & Interactions */}
                    <div id="sec-safety" className={`${styles.sectionBlock} ${activeTab === 'safety' ? styles.tabBlockActive : styles.tabBlockHidden}`}>
                        <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionContraindications}</h2>
                        </div>
                        {drug.contraindications && drug.contraindications.length > 0 ? (
                            <ul className={styles.bulletList}>
                                {drug.contraindications.map((c, idx) => (
                                    <li key={idx}>{c}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.plainText}>{t.noData}</p>
                        )}
                    </div>

                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 18 22 12 16 6" />
                                    <polyline points="8 6 2 12 8 18" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionInteractions}</h2>
                        </div>
                        {drug.interactions && drug.interactions.length > 0 ? (
                            <ul className={styles.bulletList}>
                                {drug.interactions.map((i, idx) => (
                                    <li key={idx}>{i}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.plainText}>{t.noData}</p>
                        )}
                    </div>

                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionAdverseReactions}</h2>
                        </div>
                        {drug.adverseReactions && drug.adverseReactions.length > 0 ? (
                            <ul className={styles.bulletList}>
                                {drug.adverseReactions.map((r, idx) => (
                                    <li key={idx}>{r}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.plainText}>{t.noData}</p>
                        )}
                    </div>
                    </div>

                    {/* Section 5: References & Sources (Dedicated Section) */}
                    <div id="sec-references" className={`${styles.sectionBlock} ${activeTab === 'references' ? styles.tabBlockActive : styles.tabBlockHidden}`}>
                        <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                    <path d="M6 6h10" />
                                    <path d="M6 10h10" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionReferences || 'Referencias Bibliográficas (APA)'}</h2>
                        </div>
                        {drug.references && drug.references.length > 0 ? (
                            <ul className={styles.bulletList}>
                                {drug.references.map((refItem, idx) => (
                                    <li key={idx} className={styles.referenceItem}>
                                        <span className={styles.referenceText}>{refItem}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.plainText}>{t.noData}</p>
                        )}
                    </div>
                    </div>
                </div>
            </div>

            {isCalculatorOpen && (
                <Suspense fallback={null}>
                    <PediatricCalculatorModal
                        isOpen={isCalculatorOpen}
                        onClose={() => setIsCalculatorOpen(false)}
                        drugName={drug.name}
                        drug={drug}
                    />
                </Suspense>
            )}
        </section>
    );
};

export default DetalleFarmaco;
