import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { counterContext } from '../context/counterContext.js';
import styles from './PediatricCalculatorModal.module.css';

const FREQUENCY_OPTIONS = [
    { hours: 4, labelKey: 'calcFrequencyEvery4h', takes: 6 },
    { hours: 6, labelKey: 'calcFrequencyEvery6h', takes: 4 },
    { hours: 8, labelKey: 'calcFrequencyEvery8h', takes: 3 },
    { hours: 12, labelKey: 'calcFrequencyEvery12h', takes: 2 },
    { hours: 24, labelKey: 'calcFrequencyEvery24h', takes: 1 }
];

export const PediatricCalculatorModal = ({
    isOpen,
    onClose,
    drugName = '',
    drug = null
}) => {
    const { t } = useContext(counterContext);

    // Form inputs state
    const [weight, setWeight] = useState('');
    const [doseValue, setDoseValue] = useState('');
    const [doseMode, setDoseMode] = useState('per_dose'); // 'per_dose' | 'per_day'
    const [concMg, setConcMg] = useState('100');
    const [concMl, setConcMl] = useState('1');
    const [frequency, setFrequency] = useState(8);

    // Extract potential presets from drug data if available
    const detectedPresets = useMemo(() => {
        if (!drug || !drug.presentations) return [];
        const presets = [];
        const seen = new Set();

        Object.keys(drug.presentations).forEach((name) => {
            const match = name.match(/(\d+(?:\.\d+)?)\s*mg\s*\/\s*(\d+(?:\.\d+)?)\s*ml/i);
            if (match) {
                const mgVal = match[1];
                const mlVal = match[2] || '1';
                const key = `${mgVal}-${mlVal}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    presets.push({
                        label: `${mgVal} mg / ${mlVal} ml`,
                        mg: mgVal,
                        ml: mlVal
                    });
                }
            }
        });
        return presets;
    }, [drug]);

    // Pre-fill initial dose and concentration if detected in pediatric guidance
    useEffect(() => {
        if (isOpen && drug?.dosageGuidance?.pediatric) {
            const oralGuidelines = drug.dosageGuidance.pediatric.Oral?.guidelines || [];
            const text = oralGuidelines.join(' ');
            const numMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:a|-)\s*(\d+(?:\.\d+)?)\s*mg\/kg/i) || text.match(/(\d+(?:\.\d+)?)\s*mg\/kg/i);
            if (numMatch && !doseValue) {
                setDoseValue(numMatch[1]);
            }
            if (detectedPresets.length > 0 && concMg === '100' && concMl === '1') {
                setConcMg(detectedPresets[0].mg);
                setConcMl(detectedPresets[0].ml);
            }
        }
    }, [isOpen, drug, detectedPresets, doseValue, concMg, concMl]);

    // Keyboard ESC listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Handle Reset
    const handleReset = useCallback(() => {
        setWeight('');
        setDoseValue('');
        setDoseMode('per_dose');
        setConcMg('100');
        setConcMl('1');
        setFrequency(8);
    }, []);

    // Mathematical calculations
    const calculation = useMemo(() => {
        const numWeight = parseFloat(weight);
        const numDose = parseFloat(doseValue);
        const numConcMg = parseFloat(concMg);
        const numConcMl = parseFloat(concMl);

        if (
            isNaN(numWeight) || numWeight <= 0 ||
            isNaN(numDose) || numDose <= 0 ||
            isNaN(numConcMg) || numConcMg <= 0 ||
            isNaN(numConcMl) || numConcMl <= 0
        ) {
            return null;
        }

        const takesPerDay = 24 / frequency;
        let dosePerIntakeMg = 0;
        let dailyTotalMg = 0;

        if (doseMode === 'per_dose') {
            dosePerIntakeMg = numWeight * numDose;
            dailyTotalMg = dosePerIntakeMg * takesPerDay;
        } else {
            dailyTotalMg = numWeight * numDose;
            dosePerIntakeMg = dailyTotalMg / takesPerDay;
        }

        const mgPerMl = numConcMg / numConcMl;
        const volumePerIntakeMl = dosePerIntakeMg / mgPerMl;
        const volumeDailyTotalMl = dailyTotalMg / mgPerMl;

        // Standard pediatric dropper: 20 drops = 1 ml
        const dropsPerIntake = Math.round(volumePerIntakeMl * 20);
        const dropsDailyTotal = Math.round(volumeDailyTotalMl * 20);

        return {
            dosePerIntakeMg: parseFloat(dosePerIntakeMg.toFixed(2)),
            dailyTotalMg: parseFloat(dailyTotalMg.toFixed(2)),
            volumePerIntakeMl: parseFloat(volumePerIntakeMl.toFixed(2)),
            volumeDailyTotalMl: parseFloat(volumeDailyTotalMl.toFixed(2)),
            dropsPerIntake,
            dropsDailyTotal,
            takesPerDay,
            isWeightHigh: numWeight > 80,
            isWeightLow: numWeight < 1
        };
    }, [weight, doseValue, doseMode, concMg, concMl, frequency]);

    if (!isOpen) return null;

    return (
        <div
            className={styles.overlay}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pediatric-calc-title"
        >
            <div className={styles.modal}>
                {/* Visual Drag Handle (Mobile only) */}
                <div className={styles.dragHandle} aria-hidden="true" />

                {/* Modal Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitleGroup}>
                        <div className={styles.headerIconWrapper}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                        </div>
                        <div>
                            <h2 id="pediatric-calc-title" className={styles.title}>
                                {t.pediatricCalculatorTitle || 'Calculadora de Dosis Pediátrica'}
                                {drugName ? ` · ${drugName}` : ''}
                            </h2>
                            <p className={styles.subtitle}>
                                {t.pediatricCalculatorSubtitle || 'Cálculo de posología, dosis por toma y volumen en niños.'}
                            </p>
                        </div>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        title={t.calcClose || 'Cerrar'}
                        aria-label={t.calcClose || 'Cerrar'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className={styles.body}>
                    {/* Input Controls Grid */}
                    <div className={styles.inputsGrid}>
                        {/* 1. Patient Weight */}
                        <div className={styles.inputCard}>
                            <label className={styles.label} htmlFor="patient-weight">
                                <span className={styles.labelIcon}>⚖️</span>
                                {t.calcPatientWeight || 'Peso del paciente (kg)'}
                            </label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="patient-weight"
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="150"
                                    placeholder="Ej: 12.5"
                                    className={styles.textInput}
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                />
                                <span className={styles.inputUnit}>kg</span>
                            </div>
                        </div>

                        {/* 2. Target Dosage */}
                        <div className={styles.inputCard}>
                            <label className={styles.label} htmlFor="target-dose">
                                <span className={styles.labelIcon}>💊</span>
                                {t.calcTargetDose || 'Dosis deseada'}
                            </label>
                            <div className={styles.dosageInputRow}>
                                <div className={styles.inputWrapper}>
                                    <input
                                        id="target-dose"
                                        type="number"
                                        step="0.5"
                                        min="0.1"
                                        placeholder="Ej: 15"
                                        className={styles.textInput}
                                        value={doseValue}
                                        onChange={(e) => setDoseValue(e.target.value)}
                                    />
                                    <span className={styles.inputUnit}>mg/kg</span>
                                </div>
                                <select
                                    className={styles.modeSelect}
                                    value={doseMode}
                                    onChange={(e) => setDoseMode(e.target.value)}
                                    aria-label="Modo de prescripción"
                                >
                                    <option value="per_dose">{t.calcDoseModePerDose || 'mg/kg por toma'}</option>
                                    <option value="per_day">{t.calcDoseModePerDay || 'mg/kg al día'}</option>
                                </select>
                            </div>
                        </div>

                        {/* 3. Formulation Concentration */}
                        <div className={styles.inputCard}>
                            <div className={styles.labelRow}>
                                <label className={styles.label}>
                                    <span className={styles.labelIcon}>🧪</span>
                                    {t.calcConcentration || 'Concentración de la presentación'}
                                </label>
                                {detectedPresets.length > 0 && (
                                    <span className={styles.presetsLabel}>Ficha técnica:</span>
                                )}
                            </div>

                            {/* Concentration Presets if found in drug */}
                            {detectedPresets.length > 0 && (
                                <div className={styles.presetsList}>
                                    {detectedPresets.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className={`${styles.presetBadge} ${concMg === preset.mg && concMl === preset.ml ? styles.presetBadgeActive : ''}`}
                                            onClick={() => {
                                                setConcMg(preset.mg);
                                                setConcMl(preset.ml);
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className={styles.concInputRow}>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="1"
                                        placeholder="100"
                                        className={styles.textInput}
                                        value={concMg}
                                        onChange={(e) => setConcMg(e.target.value)}
                                        aria-label={t.calcConcentrationMg || 'mg de fármaco'}
                                    />
                                    <span className={styles.inputUnit}>mg</span>
                                </div>
                                <span className={styles.slashDivider}>/</span>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.5"
                                        placeholder="1"
                                        className={styles.textInput}
                                        value={concMl}
                                        onChange={(e) => setConcMl(e.target.value)}
                                        aria-label={t.calcConcentrationMl || 'en volumen (ml)'}
                                    />
                                    <span className={styles.inputUnit}>ml</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Administration Frequency */}
                        <div className={styles.inputCard}>
                            <label className={styles.label} htmlFor="frequency-select">
                                <span className={styles.labelIcon}>⏰</span>
                                {t.calcFrequency || 'Frecuencia de tomas'}
                            </label>
                            <select
                                id="frequency-select"
                                className={styles.select}
                                value={frequency}
                                onChange={(e) => setFrequency(parseInt(e.target.value, 10))}
                            >
                                {FREQUENCY_OPTIONS.map((opt) => (
                                    <option key={opt.hours} value={opt.hours}>
                                        {t[opt.labelKey] || `Cada ${opt.hours} horas (${opt.takes} tomas/día)`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Weight Safety Alerts */}
                    {calculation && calculation.isWeightHigh && (
                        <div className={styles.alertWarning}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{t.calcAlertWeightHigh || 'Atención: peso mayor a 80 kg; evalúe considerar la dosis habitual de adulto.'}</span>
                        </div>
                    )}
                    {calculation && calculation.isWeightLow && (
                        <div className={styles.alertWarning}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{t.calcAlertWeightLow || 'Atención: peso menor a 1 kg (neonato); verifique pautas neonatales específicas.'}</span>
                        </div>
                    )}

                    {/* Calculation Results Card */}
                    {calculation ? (
                        <div className={styles.resultsCard}>
                            <div className={styles.resultsHeader}>
                                <div className={styles.resultsTitleRow}>
                                    <span className={styles.resultsIcon}>✨</span>
                                    <h3 className={styles.resultsTitle}>
                                        {t.calcResultsTitle || 'Desglose Posológico Calculado'}
                                    </h3>
                                </div>
                                <span className={styles.frequencyTag}>
                                    {calculation.takesPerDay} {t.calcTakesPerDay || 'tomas al día'} (c/{frequency}h)
                                </span>
                            </div>

                            <div className={styles.resultsGrid}>
                                {/* Primary Result: Per Intake */}
                                <div className={`${styles.resultBox} ${styles.primaryResult}`}>
                                    <span className={styles.resultLabel}>
                                        {t.calcDosePerIntake || 'Dosis por toma'}
                                    </span>
                                    <div className={styles.resultValueRow}>
                                        <span className={styles.resultNumberBig}>
                                            {calculation.volumePerIntakeMl}
                                        </span>
                                        <span className={styles.resultUnitBig}>ml</span>
                                    </div>
                                    <span className={styles.resultSubValue}>
                                        ({calculation.dosePerIntakeMg} mg / toma)
                                    </span>
                                </div>

                                {/* Drops Conversion */}
                                <div className={styles.resultBox}>
                                    <span className={styles.resultLabel}>
                                        {t.calcDropsEquivalent || 'Equivalencia en gotas'}
                                    </span>
                                    <div className={styles.resultValueRow}>
                                        <span className={styles.resultNumberMedium}>
                                            {calculation.dropsPerIntake}
                                        </span>
                                        <span className={styles.resultUnitMedium}>gotas</span>
                                    </div>
                                    <span className={styles.resultSubValue}>
                                        {t.calcDropsNote || 'Basado en estándar pediátrico (20 gotas ≈ 1 ml)'}
                                    </span>
                                </div>

                                {/* Daily Total Active Ingredient */}
                                <div className={styles.resultBox}>
                                    <span className={styles.resultLabel}>
                                        {t.calcDailyTotalDose || 'Dosis total diaria'}
                                    </span>
                                    <div className={styles.resultValueRow}>
                                        <span className={styles.resultNumberMedium}>
                                            {calculation.dailyTotalMg}
                                        </span>
                                        <span className={styles.resultUnitMedium}>mg/día</span>
                                    </div>
                                    <span className={styles.resultSubValue}>
                                        {calculation.volumeDailyTotalMl} ml totales al día
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📝</span>
                            <p>{t.fillFieldsPrompt || 'Ingrese el peso y la dosis en mg/kg para obtener el cálculo clínico.'}</p>
                        </div>
                    )}

                    {/* Disclaimer Note */}
                    <div className={styles.disclaimerNote}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span>{t.calcDisclaimerNote || 'Herramienta de asistencia al cálculo aritmético. El médico o prescriptor debe verificar siempre dosis máximas y contraindicaciones con la ficha oficial.'}</span>
                    </div>
                </div>

                {/* Modal Footer Controls */}
                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.resetButton}
                        onClick={handleReset}
                    >
                        {t.calcReset || 'Reiniciar valores'}
                    </button>
                    <button
                        type="button"
                        className={styles.closeActionButton}
                        onClick={onClose}
                    >
                        {t.calcClose || 'Cerrar calculadora'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PediatricCalculatorModal;
