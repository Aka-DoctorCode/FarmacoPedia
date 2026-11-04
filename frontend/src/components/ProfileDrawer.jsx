import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import styles from './ProfileDrawer.module.css';

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
        fields: [
            { key: 'mpps', label: 'N° Matrícula Sanitaria (MPPS) *', placeholder: 'Ej. 123456', required: true },
            { key: 'colegioMedico', label: 'Colegio de Médicos / N° Regional *', placeholder: 'Ej. CMD: 1234', required: true }
        ]
    },
    España: {
        fields: [
            { key: 'colegiado', label: 'N° de Colegiado Médico (9 dígitos) *', placeholder: 'Ej. 282800123', required: true }
        ]
    },
    Colombia: {
        fields: [
            { key: 'rethus', label: 'N° Registro ReTHUS *', placeholder: 'Ej. 10203040', required: true },
            { key: 'tarjetaProfesional', label: 'N° Tarjeta Profesional', placeholder: 'Ej. TP-98765', required: false }
        ]
    },
    México: {
        fields: [
            { key: 'cedulaGeneral', label: 'Cédula Profesional General (SEP) *', placeholder: 'Ej. 12345678', required: true },
            { key: 'cedulaEspecialidad', label: 'Cédula de Especialidad (si aplica)', placeholder: 'Ej. ESP-87654', required: false }
        ]
    },
    Argentina: {
        fields: [
            { key: 'matriculaNacional', label: 'Matrícula Nacional (MN)', placeholder: 'Ej. MN 123456', required: false },
            { key: 'matriculaProvincial', label: 'Matrícula Provincial (MP)', placeholder: 'Ej. MP 7890 (Provincia)', required: false }
        ]
    },
    Chile: {
        fields: [
            { key: 'rnpi', label: 'Registro Superintendencia de Salud (RNPI) *', placeholder: 'Ej. 123456', required: true },
            { key: 'colmed', label: 'N° Colegio Médico de Chile (Colmed)', placeholder: 'Ej. 98765', required: false }
        ]
    },
    Perú: {
        fields: [
            { key: 'cmp', label: 'N° Colegiatura CMP *', placeholder: 'Ej. 065432', required: true },
            { key: 'rne', label: 'Registro Nacional de Especialista (RNE)', placeholder: 'Ej. RNE 23456', required: false }
        ]
    },
    Ecuador: {
        fields: [
            { key: 'acess', label: 'N° Folio ACESS / SENESCYT *', placeholder: 'Ej. 1718-23-456', required: true }
        ]
    },
    'Estados Unidos': {
        fields: [
            { key: 'npi', label: 'National Provider Identifier (NPI) *', placeholder: 'Ej. 1234567890', required: true },
            { key: 'stateLicense', label: 'State Medical License & State', placeholder: 'Ej. C123456 (FL)', required: false }
        ]
    },
    'Otro país': {
        fields: [
            { key: 'organismo', label: 'Organismo o Ministerio Regulador *', placeholder: 'Ej. Ministerio de Salud Pública', required: true },
            { key: 'licencia', label: 'N° de Licencia / Matrícula Oficial *', placeholder: 'Ej. LIC-123456', required: true }
        ]
    }
};

const COUNTRIES = Object.keys(COUNTRY_CONFIG);

const ProfileDrawer = () => {
    const { user, profileDrawerOpen, setProfileDrawerOpen, updateUser } = useContext(counterContext);
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('Venezuela');
    const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
    const [identifiers, setIdentifiers] = useState({});
    const [institution, setInstitution] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Sincronizar datos del usuario actual cuando se abre el drawer
    useEffect(() => {
        if (!profileDrawerOpen || !user) return;

        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setCountry(user.country || 'Venezuela');
        setSpecialty(user.specialty || SPECIALTIES[0]);
        setInstitution(user.institution || '');

        let initialIdents = {};
        if (user.identifiers && typeof user.identifiers === 'object') {
            initialIdents = { ...user.identifiers };
        }
        setIdentifiers(initialIdents);
        setSuccessMsg('');
        setErrorMsg('');
    }, [profileDrawerOpen, user]);

    // Cerrar con Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && profileDrawerOpen) {
                setProfileDrawerOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [profileDrawerOpen, setProfileDrawerOpen]);

    if (!profileDrawerOpen || !user) return null;

    const handleCountryChange = (newCountry) => {
        setCountry(newCountry);
        const config = COUNTRY_CONFIG[newCountry] || COUNTRY_CONFIG['Otro país'];
        const initialIdents = {};
        config.fields.forEach((f) => {
            initialIdents[f.key] = identifiers[f.key] || '';
        });
        setIdentifiers(initialIdents);
    };

    const handleIdentifierChange = (key, val) => {
        setIdentifiers((prev) => ({
            ...prev,
            [key]: val
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!firstName.trim() || !lastName.trim()) {
            setErrorMsg('El nombre y apellido son obligatorios.');
            return;
        }

        const countryConfig = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['Otro país'];
        for (const field of countryConfig.fields) {
            if (field.required && !identifiers[field.key]?.trim()) {
                setErrorMsg(`El campo "${field.label}" es obligatorio para ${country}.`);
                return;
            }
        }

        if (country === 'Argentina' && !identifiers.matriculaNacional?.trim() && !identifiers.matriculaProvincial?.trim()) {
            setErrorMsg('Para Argentina debes ingresar al menos tu Matrícula Nacional o Provincial.');
            return;
        }

        setIsSaving(true);

        const updatedData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: user.email,
            country: country,
            identifiers: identifiers,
            specialty: specialty,
            institution: institution.trim()
        };

        const result = await drugService.updateDoctorProfile(updatedData);
        setIsSaving(false);

        if (result.success) {
            updateUser(result.data);
            setSuccessMsg('¡Tus datos profesionales han sido actualizados con éxito!');
            setTimeout(() => {
                setSuccessMsg('');
            }, 4000);
        } else {
            setErrorMsg(result.error || 'Error al actualizar los datos en el servidor.');
        }
    };

    const currentCountryConfig = COUNTRY_CONFIG[country] || COUNTRY_CONFIG['Otro país'];

    return (
        <div
            className={styles.drawerOverlay}
            onClick={() => setProfileDrawerOpen(false)}
            role="dialog"
            aria-modal="true"
        >
            <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
                <header className={styles.drawerHeader}>
                    <div className={styles.headerInfo}>
                        <div className={styles.avatarCircle}>
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
                            ) : (
                                <span>{(firstName || user.name || 'D').charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <h2 className={styles.title}>Perfil Profesional</h2>
                            <p className={styles.subtitle}>Acreditación y datos médicos</p>
                        </div>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={() => setProfileDrawerOpen(false)}
                        aria-label="Cerrar perfil"
                    >
                        ✕
                    </button>
                </header>

                <form onSubmit={handleSave} className={styles.drawerBody}>
                    {successMsg && (
                        <div className={styles.successMessage}>
                            <span>✓</span>
                            <span>{successMsg}</span>
                        </div>
                    )}
                    {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}

                    {user?.role === 'admin' && (
                        <div className={styles.adminBannerCard}>
                            <div className={styles.adminBannerHeader}>
                                <div className={styles.adminBadgeRow}>
                                    <span className={styles.adminBadge}>🛡️ Administrador</span>
                                </div>
                                <span className={styles.adminHint}>Tienes acceso a las herramientas de edición y control del vademécum.</span>
                            </div>
                            <button
                                type="button"
                                className={styles.adminEditorBtn}
                                onClick={() => {
                                    setProfileDrawerOpen(false);
                                    const tokenQuery = user?.adminToken ? `?token=${encodeURIComponent(user.adminToken)}` : '';
                                    window.open(`/editor${tokenQuery}`, '_blank', 'noopener,noreferrer');
                                }}
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                <span>Abrir Editor de Fármacos (tools/editor)</span>
                            </button>
                        </div>
                    )}

                    <div className={styles.sectionTitle}>Identidad</div>
                    <div className={styles.twoCols}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Nombre(s) *</label>
                            <input
                                type="text"
                                className={styles.input}
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
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Correo profesional registrado</label>
                        <input
                            type="email"
                            className={`${styles.input} ${styles.inputDisabled}`}
                            value={email}
                            disabled
                            title="El correo de registro no se puede modificar"
                        />
                    </div>

                    <div className={styles.sectionTitle}>Acreditación Médica</div>
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

                    {/* Inputs de licencias dinámicos por país */}
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

                    <div className={styles.drawerFooter}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={() => setProfileDrawerOpen(false)}
                        >
                            Cerrar
                        </button>
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileDrawer;
