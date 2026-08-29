import { useContext, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import styles from './DetalleFarmaco.module.css';

const DetalleFarmaco = () => {
    const {
        selectedDrugData,
        selectedDrugName,
        isDrugLoading,
        closeDrugDetail,
        t
    } = useContext(counterContext);

    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'dosage' | 'risks' | 'safety'

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
                    <button className={styles.backButton} onClick={closeDrugDetail}>
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
                <title>{`${drug.name.toUpperCase()} - Ficha Técnica | FarmacoPedia`}</title>
                <meta
                    name="description"
                    content={`Ficha farmacológica completa de ${drug.name}: dosis, mecanismo, contraindicaciones y ajustes.`}
                />
            </Helmet>

            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={closeDrugDetail}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    {t.backToCatalog}
                </button>
            </div>

            {/* Header Card */}
            <div className={styles.headerCard}>
                <div className={styles.drugTitleRow}>
                    <h1 className={styles.drugName}>{drug.name}</h1>
                    {drug.categories && drug.categories.length > 0 && (
                        <div className={styles.categoryBadges}>
                            {drug.categories.map((category, idx) => (
                                <span key={idx} className={styles.categoryBadge}>
                                    {category}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                {drug.actionMechanism && (
                    <p className={styles.mechanismSnippet}>{drug.actionMechanism}</p>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabsNav} role="tablist">
                <button
                    className={`${styles.tabButton} ${activeTab === 'overview' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('overview')}
                    role="tab"
                    aria-selected={activeTab === 'overview'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                    </svg>
                    {t.tabOverview}
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'dosage' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('dosage')}
                    role="tab"
                    aria-selected={activeTab === 'dosage'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                        <path d="m8.5 8.5 7 7" />
                    </svg>
                    {t.tabDosage}
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'risks' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('risks')}
                    role="tab"
                    aria-selected={activeTab === 'risks'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    {t.tabRisks}
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'safety' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('safety')}
                    role="tab"
                    aria-selected={activeTab === 'safety'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                    {t.tabSafety}
                </button>
            </div>

            {/* Tab 1: Overview & Indications */}
            {activeTab === 'overview' && (
                <div className={styles.tabContent}>
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
            )}

            {/* Tab 2: Presentations & Dosage */}
            {activeTab === 'dosage' && (
                <div className={styles.tabContent}>
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
                            <div className={styles.presentationsGrid}>
                                {presentationsEntries.map(([formName, formValue], index) => (
                                    <div key={index} className={styles.presentationCard}>
                                        <div className={styles.presentationTitle}>{formName}</div>
                                        <div className={styles.dosageItemList}>
                                            {formValue.dosage && formValue.dosage.map((dose, doseIdx) => (
                                                <div key={doseIdx} className={styles.dosageItem}>
                                                    <span className={styles.dosageAmount}>
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

                    {/* Pediatric Dosage Guidance */}
                    {pediatricGuidanceEntries.length > 0 && (
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="5" />
                                        <path d="M20 21a8 8 0 1 0-16 0" />
                                    </svg>
                                </span>
                                <h2 className={styles.sectionTitle}>{t.sectionPediatricGuidance}</h2>
                            </div>
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
                        </div>
                    )}
                </div>
            )}

            {/* Tab 3: Clinical Risks & Organ Adjustments */}
            {activeTab === 'risks' && (
                <div className={styles.tabContent}>
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
                        <div className={styles.adjustmentsGrid}>
                            <div className={styles.riskCard}>
                                <span className={styles.riskTitle}>{t.sectionPregnancy}</span>
                                <p className={styles.plainText}>{drug.risk?.pregnancy || t.noData}</p>
                            </div>
                            <div className={styles.riskCard}>
                                <span className={styles.riskTitle}>{t.sectionLactation}</span>
                                <p className={styles.plainText}>{drug.risk?.lactation || t.noData}</p>
                            </div>
                            <div className={styles.riskCard}>
                                <span className={styles.riskTitle}>{t.sectionGeriatric}</span>
                                <p className={styles.plainText}>{drug.risk?.geriatric || t.noData}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionRenal}</h2>
                        </div>
                        <div className={styles.riskCard}>
                            {drug.risk?.renal?.level && (
                                <div className={styles.riskLevel}>{drug.risk.renal.level}</div>
                            )}
                            <div className={styles.riskAdjustment}>
                                {drug.risk?.renal?.adjustment || t.noData}
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                    <path d="m4.93 4.93 4.24 4.24" />
                                    <path d="m14.83 9.17 4.24-4.24" />
                                </svg>
                            </span>
                            <h2 className={styles.sectionTitle}>{t.sectionHepatic}</h2>
                        </div>
                        <div className={styles.riskCard}>
                            {drug.risk?.hepatic?.level && (
                                <div className={styles.riskLevel}>{drug.risk.hepatic.level}</div>
                            )}
                            <div className={styles.riskAdjustment}>
                                {drug.risk?.hepatic?.adjustment || t.noData}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 4: Contraindications & Interactions */}
            {activeTab === 'safety' && (
                <div className={styles.tabContent}>
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
            )}
        </section>
    );
};

export default DetalleFarmaco;
