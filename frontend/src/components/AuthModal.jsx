import { useState, useContext } from 'react';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import styles from './AuthModal.module.css';

const SPECIALTIES = [
    'Médico general',
    'Médico especialista',
    'Estudiante de medicina',
    'Enfermera',
    'Farmacista',
    'Otros'
];

const COUNTRY_CONFIG = {
    Venezuela: {
        label: 'Venezuela',
        fields: [
            { key: 'mpps', label: 'N° Matrícula Sanitaria (MPPS) *', placeholder: 'Ej. 123456', required: true },
            { key: 'colegioMedico', label: 'Colegio de Médicos / N° Regional *', placeholder: 'Ej. CMD: 1234', required: true }
        ]
    },
    España: {
        label: 'España',
        fields: [
            { key: 'colegiado', label: 'N° de Colegiado Médico (9 dígitos) *', placeholder: 'Ej. 282800123', required: true }
        ]
    },
    Colombia: {
        label: 'Colombia',
        fields: [
            { key: 'rethus', label: 'N° Registro ReTHUS *', placeholder: 'Ej. 10203040', required: true },
            { key: 'tarjetaProfesional', label: 'N° Tarjeta Profesional', placeholder: 'Ej. TP-98765', required: false }
        ]
    },
    México: {
        label: 'México',
        fields: [
            { key: 'cedulaGeneral', label: 'Cédula Profesional General (SEP) *', placeholder: 'Ej. 12345678', required: true },
            { key: 'cedulaEspecialidad', label: 'Cédula de Especialidad (si aplica)', placeholder: 'Ej. ESP-87654', required: false }
        ]
    },
    Argentina: {
        label: 'Argentina',
        fields: [
            { key: 'matriculaNacional', label: 'Matrícula Nacional (MN)', placeholder: 'Ej. MN 123456', required: false },
            { key: 'matriculaProvincial', label: 'Matrícula Provincial (MP)', placeholder: 'Ej. MP 7890 (Provincia)', required: false }
        ]
    },
    Chile: {
        label: 'Chile',
        fields: [
            { key: 'rnpi', label: 'Registro Superintendencia de Salud (RNPI) *', placeholder: 'Ej. 123456', required: true },
            { key: 'colmed', label: 'N° Colegio Médico de Chile (Colmed)', placeholder: 'Ej. 98765', required: false }
        ]
    },
    Perú: {
        label: 'Perú',
        fields: [
            { key: 'cmp', label: 'N° Colegiatura CMP *', placeholder: 'Ej. 065432', required: true },
            { key: 'rne', label: 'Registro Nacional de Especialista (RNE)', placeholder: 'Ej. RNE 23456', required: false }
        ]
    },
    Ecuador: {
        label: 'Ecuador',
        fields: [
            { key: 'acess', label: 'N° Folio ACESS / SENESCYT *', placeholder: 'Ej. 1718-23-456', required: true }
        ]
    },
    'Estados Unidos': {
        label: 'Estados Unidos (USA)',
        fields: [
            { key: 'npi', label: 'National Provider Identifier (NPI - 10 dígitos) *', placeholder: 'Ej. 1234567890', required: true },
            { key: 'stateLicense', label: 'State Medical License & State', placeholder: 'Ej. C123456 (FL)', required: false }
        ]
    },
    'Otro país': {
        label: 'Otro país',
        fields: [
            { key: 'organismo', label: 'Organismo o Ministerio Regulador *', placeholder: 'Ej. Ministerio de Salud Pública', required: true },
            { key: 'licencia', label: 'N° de Licencia / Matrícula Oficial *', placeholder: 'Ej. LIC-123456', required: true }
        ]
    }
};

const COUNTRIES = Object.keys(COUNTRY_CONFIG);

const AuthModal = () => {
    const { authModalOpen, setAuthModalOpen, login } = useContext(counterContext);
    const [view, setView] = useState('login'); // 'login' | 'register'
    
    // Auth credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    // Profile details (Registration)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [country, setCountry] = useState('Venezuela');
    const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
    const [identifiers, setIdentifiers] = useState({ mpps: '', colegioMedico: '' });
    const [institution, setInstitution] = useState('');
    
    // UI state
    const [error, setError] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Dynamic country switch: reset identifier fields for the chosen country
    const handleCountryChange = (newCountry) => {
        setCountry(newCountry);
        const config = COUNTRY_CONFIG[newCountry] || COUNTRY_CONFIG['Otro país'];
        const initialIdents = {};
        config.fields.forEach((f) => {
            initialIdents[f.key] = '';
        });
        setIdentifiers(initialIdents);
    };

    const handleIdentifierChange = (key, value) => {
        setIdentifiers((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    if (!authModalOpen) return null;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setInfoMsg('');

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
            setError('Ingresa un correo electrónico profesional válido.');
            return;
        }

        if (!password) {
            setError('Ingresa tu contraseña.');
            return;
        }

        setIsLoading(true);
        const result = await drugService.loginDoctor(cleanEmail, password);
        setIsLoading(false);

        if (result.success) {
            login(result.data, rememberMe);
        } else {
            if (result.needsRegistration) {
                setError('No encontramos tu cuenta. Por favor completa tu acreditación médica para registrarte.');
                setView('register');
            } else {
                setError(result.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
            }
        }
    };

    const validateAccreditationFields = () => {
        const countryConfig = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['Otro país'];
        for (const field of countryConfig.fields) {
            if (field.required && !identifiers[field.key]?.trim()) {
                setError(`El campo "${field.label}" es obligatorio para ${country}.`);
                return false;
            }
        }

        if (country === 'Argentina' && !identifiers.matriculaNacional?.trim() && !identifiers.matriculaProvincial?.trim()) {
            setError('Para Argentina debes ingresar al menos tu Matrícula Nacional o Provincial.');
            return false;
        }

        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setInfoMsg('');

        if (!firstName.trim() || !lastName.trim()) {
            setError('Por favor ingresa tu nombre y apellido en campos separados.');
            return;
        }

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) {
            setError('Ingresa un correo electrónico válido.');
            return;
        }

        if (!password || password.length < 6) {
            setError('La contraseña debe tener un mínimo de 6 caracteres.');
            return;
        }

        if (!validateAccreditationFields()) return;

        // Crear resumen de licencias
        const licenseSummary = Object.entries(identifiers)
            .filter(([_, v]) => Boolean(v && String(v).trim()))
            .map(([k, v]) => `${k.toUpperCase()}: ${String(v).trim()}`)
            .join(' / ');

        setIsLoading(true);

        const doctorData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            name: `${firstName.trim()} ${lastName.trim()}`,
            email: cleanEmail,
            password: password,
            country: country,
            identifiers: identifiers,
            licenseNumber: licenseSummary,
            specialty: specialty,
            role: specialty === 'Estudiante de medicina' ? 'Estudiante' : specialty === 'Enfermera' ? 'Enfermera' : specialty === 'Farmacista' ? 'Farmacéutico' : 'Médico',
            institution: institution.trim(),
            authProvider: 'email'
        };

        const result = await drugService.registerDoctor(doctorData);
        setIsLoading(false);

        if (result.success) {
            login(result.data, rememberMe);
        } else {
            setError(result.error || 'No se pudo completar el registro médico.');
        }
    };

    const currentCountryConfig = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['Otro país'];

    return (
        <div className={styles.modalOverlay} onClick={() => setAuthModalOpen(false)} role="dialog" aria-modal="true">
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <header className={styles.modalHeader}>
                    <div className={styles.headerTitleGroup}>
                        <div className={styles.iconCircle}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className={styles.title}>
                                {view === 'login' ? 'Iniciar Sesión Médica' : 'Acreditación y Registro'}
                            </h2>
                            <p className={styles.subtitle}>
                                Acceso exclusivo para profesionales y personal de salud
                            </p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setAuthModalOpen(false)} aria-label="Cerrar">
                        ✕
                    </button>
                </header>

                <div className={styles.tabsNav}>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${view === 'login' ? styles.tabBtnActive : ''}`}
                        onClick={() => { setView('login'); setError(''); setInfoMsg(''); }}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${view === 'register' ? styles.tabBtnActive : ''}`}
                        onClick={() => { setView('register'); setError(''); setInfoMsg(''); }}
                    >
                        Crear Cuenta
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    {infoMsg && <div className={styles.infoMessage}>{infoMsg}</div>}

                    {view === 'login' ? (
                        <form onSubmit={handleLogin} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Correo profesional *</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    placeholder="medico@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Contraseña *</label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Recordar mi sesión en este dispositivo</span>
                            </label>

                            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                {isLoading ? 'Iniciando sesión...' : 'Ingresar a mi Cuenta'}
                            </button>

                            <div className={styles.switchViewLink}>
                                ¿No tienes una cuenta aún?{' '}
                                <button
                                    type="button"
                                    className={styles.switchViewBtn}
                                    onClick={() => { setView('register'); setError(''); setInfoMsg(''); }}
                                >
                                    Regístrate aquí
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className={styles.form}>
                            <div className={styles.sectionTitle}>1. Credenciales de Acceso</div>
                            <div className={styles.twoCols}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Nombre(s) *</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Ej. Carlos Eduardo"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Apellido(s) *</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Ej. Pérez Gómez"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.twoCols}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Correo profesional *</label>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        placeholder="correo@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Contraseña *</label>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.sectionTitle}>2. Acreditación Profesional</div>
                            <div className={styles.twoCols}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Título o Especialidad *</label>
                                    <select
                                        className={styles.select}
                                        value={specialty}
                                        onChange={(e) => setSpecialty(e.target.value)}
                                        required
                                    >
                                        {SPECIALTIES.map((s) => (
                                             <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>País donde ejerces *</label>
                                    <select
                                        className={styles.select}
                                        value={country}
                                        onChange={(e) => handleCountryChange(e.target.value)}
                                        required
                                    >
                                        {COUNTRIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Dynamic Country-Specific License Inputs */}
                            <div className={currentCountryConfig.fields.length > 1 ? styles.twoCols : styles.inputGroup}>
                                {currentCountryConfig.fields.map((f) => (
                                    <div key={f.key} className={styles.inputGroup}>
                                        <label className={styles.label}>{f.label}</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder={f.placeholder}
                                            value={identifiers[f.key] || ''}
                                            onChange={(e) => handleIdentifierChange(f.key, e.target.value)}
                                            required={f.required}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Hospital, Clínica o Institución (Opcional)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Ej. Hospital Universitario / Clínica San Juan"
                                    value={institution}
                                    onChange={(e) => setInstitution(e.target.value)}
                                />
                            </div>

                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Recordar mi sesión en este dispositivo</span>
                            </label>

                            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                                {isLoading ? 'Verificando y guardando...' : 'Crear Cuenta y Activar Acceso'}
                            </button>

                            <div className={styles.switchViewLink}>
                                ¿Ya tienes una cuenta registrada?{' '}
                                <button
                                    type="button"
                                    className={styles.switchViewBtn}
                                    onClick={() => { setView('login'); setError(''); setInfoMsg(''); }}
                                >
                                    Iniciar Sesión
                                </button>
                            </div>
                        </form>
                    )}

                    <div className={styles.legalFooter}>
                        <span>🔒 Acceso regulado para garantizar la seguridad clínica del paciente y el uso conforme al marco legal de ClickSalud.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
