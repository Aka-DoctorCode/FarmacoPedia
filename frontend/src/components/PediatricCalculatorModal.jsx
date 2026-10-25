import { useState, useEffect, useContext, useMemo } from 'react';
import { counterContext } from '../context/counterContext.js';
import styles from './PediatricCalculatorModal.module.css';

const PRESET_CONCENTRATIONS = [
    { id: '100mg_1ml', label: '100 mg / 1 ml (Gotas)', mg: 100, ml: 1 },
    { id: '125mg_5ml', label: '125 mg / 5 ml (Jarabe)', mg: 125, ml: 5 },
    { id: '250mg_5ml', label: '250 mg / 5 ml (Jarabe)', mg: 250, ml: 5 },
    { id: '200mg_5ml', label: '200 mg / 5 ml (Suspensión)', mg: 200, ml: 5 },
    { id: '40mg_1ml', label: '40 mg / 1 ml (Gotas)', mg: 40, ml: 1 },
    { id: '10mg_1ml', label: '10 mg / 1 ml (Solución)', mg: 10, ml: 1 },
];

export const PediatricCalculatorModal = ({ isOpen, onClose, drugName = '' }) => {
    const { t } = useContext(counterContext);

    const [weight, setWeight] = useState('');
    const [targetDose, setTargetDose] = useState('');
    const [doseMode, setDoseMode] = useState('per_dose'); // 'per_dose' | 'per_day'
    const [concentrationMg, setConcentrationMg] = useState('100');
    const [concentrationMl, setConcentrationMl] = useState('1');
    const [selectedPreset, setSelectedPreset] = useState('100mg_1ml');
    const [intervalHours, setIntervalHours] = useState('8');

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle preset selection
    const handleSelectPreset = (preset) => {
        setSelectedPreset(preset.id);
        setConcentrationMg(String(preset.mg));
        setConcentrationMl(String(preset.ml));
    };

    const handleCustomConcentration = (type, val) => {
        setSelectedPreset('custom');
        if (type === 'mg') setConcentrationMg(val);
        if (type === 'ml') setConcentrationMl(val);
    };

    const handleReset = () => {
        setWeight('');
        setTargetDose('');
        setDoseMode('per_dose');
        setConcentrationMg('100');
        setConcentrationMl('1');
        setSelectedPreset('100mg_1ml');
        setIntervalHours('8');
    };

    // Numerical computations
    const calculation = useMemo(() => {
        const w = parseFloat(weight);
        const d = parseFloat(targetDose);
        const cMg = parseFloat(concentrationMg);
        const cMl = parseFloat(concentrationMl);
        const intH = parseInt(intervalHours, 10) || 8;

        if (isNaN(w) || isNaN(d) || w <= 0 || d <= 0 || isNaN(cMg) || isNaN(cMl) || cMg <= 0 || cMl <= 0) {
            return null;
        }

        const dosesPerDay = Math.max(1, Math.round(24 / intH));

        let mgPerDose = 0;
        let mgPerDay = 0;

        if (doseMode === 'per_dose') {
            mgPerDose = w * d;
            mgPerDay = mgPerDose * dosesPerDay;
        } else {
            mgPerDay = w * d;
            mgPerDose = mgPerDay / dosesPerDay;
        }

        const mlPerDose = (mgPerDose / cMg) * cMl;
        const mlPerDay = mlPerDose * dosesPerDay;
        const dropsPerDose = Math.round(mlPerDose * 20);

        return {
            w,
            d,
            intH,
            dosesPerDay,
            mgPerDose: Number(mgPerDose.toFixed(2)),
            mgPerDay: Number(mgPerDay.toFixed(2)),
            mlPerDose: Number(mlPerDose.toFixed(2)),
            mlPerDay: Number(mlPerDay.toFixed(2)),
            dropsPerDose,
            isWeightWarning: w < 1 || w > 80,
        };
    }, [weight, targetDose, doseMode, concentrationMg, concentrationMl, intervalHours]);

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
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.titleGroup}>
                        <div className={styles.iconBadge}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                            <h2 id="pediatric-calc-title" className={styles.modalTitle}>
                                {t.pediatricCalculatorTitle || 'Calculadora de Dosis Pediátrica'}
                            </h2>
                            {drugName && (
                                <span className={styles.drugBadge}>
                                    {drugName.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        title={t.closeCalculator || 'Cerrar'}
                        aria-label={t.closeCalculator || 'Cerrar'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body Content */}
                <div className={styles.modalBody}>
                    {/* Weight warning alert */}
                    {calculation && calculation.isWeightWarning && (
                        <div className={styles.warningAlert}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span>{t.weightWarningNotice || 'Aviso clínico: Peso fuera del rango pediátrico estándar habitual (1 a 80 kg). Verifique el valor ingresado.'}</span>
                        </div>
                    )}

                    {/* Inputs Section */}
                    <div className={styles.formGrid}>
                        {/* Weight Field */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.label} htmlFor="calc-weight">
                                {t.patientWeight || 'Peso del paciente'}
                            </label>
                            <div className={styles.inputWithSuffix}>
                                <input
                                    id="calc-weight"
                                    type="number"
                                    step="0.1"
                                    min="0.5"
                                    max="120"
                                    placeholder="Ej: 12"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className={styles.input}
                                />
                                <span className={styles.suffix}>{t.weightUnit || 'kg'}</span>
                            </div>
                        </div>

                        {/* Mode & Target Dose Field */}
                        <div className={styles.fieldGroup}>
                            <div className={styles.labelRow}>
                                <label className={styles.label} htmlFor="calc-dose">
                                    {t.targetDose || 'Dosis objetivo'}
                                </label>
                                <div className={styles.modeToggle}>
                                    <button
                                        type="button"
                                        className={`${styles.modeButton} ${doseMode === 'per_dose' ? styles.modeButtonActive : ''}`}
                                        onClick={() => setDoseMode('per_dose')}
                                    >
                                        / toma
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.modeButton} ${doseMode === 'per_day' ? styles.modeButtonActive : ''}`}
                                        onClick={() => setDoseMode('per_day')}
                                    >
                                        / día
                                    </button>
                                </div>
                            </div>
                            <div className={styles.inputWithSuffix}>
                                <input
                                    id="calc-dose"
                                    type="number"
                                    step="0.5"
                                    min="0.1"
                                    placeholder={doseMode === 'per_dose' ? 'Ej: 15' : 'Ej: 60'}
                                    value={targetDose}
                                    onChange={(e) => setTargetDose(e.target.value)}
                                    className={styles.input}
                                />
                                <span className={styles.suffix}>
                                    {doseMode === 'per_dose' ? 'mg/kg/toma' : 'mg/kg/día'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Concentration Section */}
                    <div className={styles.sectionDivider}>
                        <span className={styles.sectionDividerText}>
                            {t.presentationConcentration || 'Concentración del medicamento'}
                        </span>
                    </div>

                    {/* Concentration Quick Presets */}
                    <div className={styles.presetGrid}>
                        {PRESET_CONCENTRATIONS.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                className={`${styles.presetPill} ${selectedPreset === preset.id ? styles.presetPillActive : ''}`}
                                onClick={() => handleSelectPreset(preset)}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Concentration inputs */}
                    <div className={styles.customConcentrationRow}>
                        <div className={styles.fieldGroupMini}>
                            <label className={styles.miniLabel}>
                                {t.substanceAmount || 'mg activo'}
                            </label>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                value={concentrationMg}
                                onChange={(e) => handleCustomConcentration('mg', e.target.value)}
                                className={styles.inputMini}
                                placeholder="mg"
                            />
                        </div>
                        <span className={styles.slashSeparator}>/</span>
                        <div className={styles.fieldGroupMini}>
                            <label className={styles.miniLabel}>
                                {t.solutionVolume || 'ml solución'}
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0.1"
                                value={concentrationMl}
                                onChange={(e) => handleCustomConcentration('ml', e.target.value)}
                                className={styles.inputMini}
                                placeholder="ml"
                            />
                        </div>
                    </div>

                    {/* Administration Interval */}
                    <div className={styles.fieldGroup} style={{ marginTop: '1rem' }}>
                        <label className={styles.label} htmlFor="calc-interval">
                            {t.administrationInterval || 'Frecuencia de administración'}
                        </label>
                        <select
                            id="calc-interval"
                            value={intervalHours}
                            onChange={(e) => setIntervalHours(e.target.value)}
                            className={styles.select}
                        >
                            <option value="4">{t.every4Hours || 'Cada 4 horas (6 tomas/día)'}</option>
                            <option value="6">{t.every6Hours || 'Cada 6 horas (4 tomas/día)'}</option>
                            <option value="8">{t.every8Hours || 'Cada 8 horas (3 tomas/día)'}</option>
                            <option value="12">{t.every12Hours || 'Cada 12 horas (2 tomas/día)'}</option>
                            <option value="24">{t.every24Hours || 'Cada 24 horas (1 toma/día)'}</option>
                        </select>
                    </div>

                    {/* Results Box */}
                    {calculation ? (
                        <div className={styles.resultsCard}>
                            <div className={styles.resultsHeader}>
                                <span className={styles.resultsTitle}>
                                    {t.calcResultsTitle || 'Pauta Pediátrica Calculada'}
                                </span>
                                <span className={styles.scheduleBadge}>
                                    {`Cada ${calculation.intH}h (${calculation.dosesPerDay} ${t.dosesPerDay || 'tomas/día'})`}
                                </span>
                            </div>

                            <div className={styles.metricsGrid}>
                                {/* Volume per dose */}
                                <div className={styles.metricItemHighlight}>
                                    <span className={styles.metricLabel}>
                                        {t.volumePerAdministration || 'Volumen por toma'}
                                    </span>
                                    <span className={styles.metricValueLarge}>
                                        {calculation.mlPerDose} <span className={styles.metricUnit}>ml</span>
                                    </span>
                                    <span className={styles.metricSub}>
                                        {`${calculation.dropsPerDose} gotas`}
                                    </span>
                                </div>

                                {/* Dose in mg per dose */}
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>
                                        {t.dosePerAdministration || 'Dosis por toma'}
                                    </span>
                                    <span className={styles.metricValue}>
                                        {calculation.mgPerDose} <span className={styles.metricUnit}>mg</span>
                                    </span>
                                    <span className={styles.metricSub}>
                                        {`${(calculation.mgPerDose / calculation.w).toFixed(1)} mg/kg`}
                                    </span>
                                </div>

                                {/* Total Daily Volume */}
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>
                                        {t.dailyTotalVolume || 'Volumen total diario'}
                                    </span>
                                    <span className={styles.metricValue}>
                                        {calculation.mlPerDay} <span className={styles.metricUnit}>ml/día</span>
                                    </span>
                                    <span className={styles.metricSub}>
                                        {`${calculation.dropsPerDose * calculation.dosesPerDay} gotas/día`}
                                    </span>
                                </div>

                                {/* Total Daily mg */}
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>
                                        {t.dailyTotalDose || 'Dosis total diaria'}
                                    </span>
                                    <span className={styles.metricValue}>
                                        {calculation.mgPerDay} <span className={styles.metricUnit}>mg/día</span>
                                    </span>
                                    <span className={styles.metricSub}>
                                        {`${(calculation.mgPerDay / calculation.w).toFixed(1)} mg/kg/día`}
                                    </span>
                                </div>
                            </div>

                            <p className={styles.dropsNote}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                {t.dropsRatioNotice || 'Cálculo de gotas basado en gotero pediátrico estándar (20 gotas ≈ 1 ml).'}
                            </p>
                        </div>
                    ) : (
                        <div className={styles.emptyPrompt}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4" />
                                <path d="m9 16 3-2 3 2" />
                            </svg>
                            <p>{t.fillFieldsPrompt || 'Ingrese el peso y la dosis requerida para calcular la pauta líquida.'}</p>
                        </div>
                    )}

                    {/* Disclaimer Footnote */}
                    <div className={styles.safetyFooter}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <p>{t.calculatorSafetyNotice || 'Herramienta de soporte para el cálculo posológico. El profesional debe verificar siempre la indicación, peso y situación clínica antes de administrar el fármaco.'}</p>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.resetButton}
                        onClick={handleReset}
                    >
                        {t.clearCalculator || 'Limpiar'}
                    </button>
                    <button
                        type="button"
                        className={styles.doneButton}
                        onClick={onClose}
                    >
                        {t.closeCalculator || 'Listo'}
                    </button>
                </div>
            </div>
        </div>
    );
};
