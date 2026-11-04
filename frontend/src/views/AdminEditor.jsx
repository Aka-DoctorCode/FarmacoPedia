import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { counterContext } from '../context/counterContext.js';
import { drugService } from '../services/drugService.js';
import styles from './AdminEditor.module.css';

const STRIP_KEYS = ['_id', '__v', 'createdAt', 'updatedAt'];

const cleanObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = { ...obj };
    STRIP_KEYS.forEach((k) => delete clone[k]);
    return clone;
};

const parseJsonWithPosition = (text) => {
    try {
        return { value: JSON.parse(text), error: null };
    } catch (err) {
        let msg = err.message;
        let line = null;
        let col = null;
        const lineColMatch = msg.match(/line (\d+) column (\d+)/);
        if (lineColMatch) {
            line = parseInt(lineColMatch[1], 10);
            col = parseInt(lineColMatch[2], 10);
        } else {
            const posMatch = msg.match(/position (\d+)/);
            if (posMatch) {
                const pre = text.slice(0, parseInt(posMatch[1], 10)).split('\n');
                line = pre.length;
                col = pre[pre.length - 1].length + 1;
            }
        }
        return {
            value: null,
            error: `Error de sintaxis${line ? ` (Línea ${line}, Columna ${col})` : ''}: ${msg}`
        };
    }
};

const AdminEditor = () => {
    const { user, updateUser } = useContext(counterContext);
    const navigate = useNavigate();

    // Verification & Admin Session
    const isAdmin = Boolean(user && user.role === 'admin');
    const [isVerifying, setIsVerifying] = useState(false);

    // Navigation & Tabs
    const [tabKind, setTabKind] = useState('drugs'); // 'drugs' | 'pending'
    const [items, setItems] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Editor state
    const [selectedName, setSelectedName] = useState(null);
    const [editorText, setEditorText] = useState('');
    const [originalText, setOriginalText] = useState('');
    const [isNew, setIsNew] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [notification, setNotification] = useState({ text: '', type: 'neutral' });

    const textareaRef = useRef(null);

    // Verify / Ensure admin token on mount
    useEffect(() => {
        if (!isAdmin) return;
        if (!user.adminToken) {
            setIsVerifying(true);
            drugService.verifyAdminSession(user.email).then((res) => {
                setIsVerifying(false);
                if (res.success && res.adminToken) {
                    updateUser({ ...user, adminToken: res.adminToken });
                }
            });
        }
    }, [isAdmin, user, updateUser]);

    // Fetch lists when tab changes
    const loadList = async (kind = tabKind) => {
        setIsLoadingList(true);
        setNotification({ text: 'Cargando lista...', type: 'neutral' });
        try {
            if (kind === 'drugs') {
                const res = await drugService.getAllDrugs(true);
                if (res.success && Array.isArray(res.data)) {
                    setItems(res.data);
                    setNotification({ text: `${res.data.length} fármacos cargados`, type: 'good' });
                } else {
                    setNotification({ text: 'No se pudieron cargar fármacos', type: 'bad' });
                }
            } else {
                const res = await drugService.getAdminPendingDrugs(true);
                if (res.success && Array.isArray(res.data)) {
                    setItems(res.data);
                    setNotification({ text: `${res.data.length} fármacos pendientes`, type: 'good' });
                } else {
                    setNotification({ text: 'No se pudieron cargar pendientes', type: 'bad' });
                }
            }
        } catch (err) {
            setNotification({ text: `Error: ${err.message}`, type: 'bad' });
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadList(tabKind);
        }
    }, [tabKind, isAdmin]);

    // Filter items by search
    const filteredItems = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) => (item.name || '').toLowerCase().includes(q));
    }, [items, searchQuery]);

    // Validation
    const parsed = useMemo(() => parseJsonWithPosition(editorText), [editorText]);
    const isDirty = Boolean(editorText && editorText !== originalText);
    const isValid = Boolean(parsed.value && !parsed.error && typeof parsed.value === 'object' && !Array.isArray(parsed.value));

    // Open entry
    const handleSelectEntry = async (name) => {
        if (isDirty) {
            const confirmLeave = window.confirm('Hay cambios sin guardar en el editor actual. ¿Deseas descartarlos?');
            if (!confirmLeave) return;
        }

        setSelectedName(name);
        setIsNew(false);
        setNotification({ text: `Cargando ${name}...`, type: 'neutral' });

        try {
            let data = null;
            if (tabKind === 'drugs') {
                const res = await drugService.getDrugByName(name);
                data = res.success ? res.data : null;
            } else {
                data = items.find((i) => i.name === name);
            }

            if (data) {
                const cleaned = cleanObject(data);
                const jsonStr = JSON.stringify(cleaned, null, 2);
                setEditorText(jsonStr);
                setOriginalText(jsonStr);
                setNotification({ text: `Editando: ${name}`, type: 'good' });
            } else {
                setNotification({ text: `No se pudo obtener datos de ${name}`, type: 'bad' });
            }
        } catch (err) {
            setNotification({ text: `Error: ${err.message}`, type: 'bad' });
        }
    };

    // New Entry template
    const handleNewEntry = () => {
        if (isDirty) {
            const confirmLeave = window.confirm('Hay cambios sin guardar. ¿Deseas iniciar una nueva entrada?');
            if (!confirmLeave) return;
        }

        setSelectedName('Nueva Entrada');
        setIsNew(true);

        const template = tabKind === 'drugs' ? {
            name: '',
            atc: [{
                code: '',
                categoryCode: '',
                categoryName: '',
                subcategoryCode: '',
                subcategoryName: ''
            }],
            actionMechanism: '',
            indications: [''],
            contraindications: [''],
            interactions: [{ drug: '', severity: 'Moderada', effect: '' }],
            adverseReactions: [''],
            dosage: {
                adults: '',
                pediatric: 'No establecido en población pediátrica'
            },
            risks: {
                pregnancy: 'Categoría C',
                lactation: 'Compatible con precaución',
                renal: 'Ajuste de dosis según aclaramiento',
                hepatic: 'Precaución en insuficiencia hepática'
            },
            securityFlags: ['Uso bajo supervisión médica'],
            references: ['ClickSalud Farmacopedia 2026']
        } : {
            name: '',
            status: 'pending',
            searchCount: 1,
            note: 'Ingresado por administrador'
        };

        const jsonStr = JSON.stringify(template, null, 2);
        setEditorText(jsonStr);
        setOriginalText(jsonStr);
        setNotification({ text: 'Nueva entrada creada. Completa el JSON y presiona Guardar.', type: 'neutral' });
    };

    // Discard
    const handleDiscard = () => {
        setEditorText(originalText);
        setNotification({ text: 'Cambios descartados.', type: 'neutral' });
    };

    // Save
    const handleSave = async () => {
        if (!isValid) {
            alert('El JSON contiene errores de sintaxis. Por favor corrígelos antes de guardar.');
            return;
        }

        const dataToSave = parsed.value;
        const entryName = (dataToSave.name || '').trim();

        if (!entryName) {
            alert('La entrada debe tener un campo "name" con el nombre del fármaco.');
            return;
        }

        setIsSaving(true);
        setNotification({ text: `Guardando ${entryName}...`, type: 'neutral' });

        try {
            let res;
            if (tabKind === 'drugs') {
                res = await drugService.savePublishedDrug(entryName, dataToSave, isNew);
            } else {
                res = await drugService.savePendingDrug(entryName, dataToSave, isNew);
            }

            if (res.success) {
                const updatedJson = JSON.stringify(cleanObject(res.data || dataToSave), null, 2);
                setEditorText(updatedJson);
                setOriginalText(updatedJson);
                setIsNew(false);
                setSelectedName(entryName);
                setNotification({ text: `¡${entryName} guardado con éxito en MongoDB!`, type: 'good' });
                loadList(tabKind);
            } else {
                setNotification({ text: `Error al guardar: ${res.error}`, type: 'bad' });
                alert(`Error al guardar: ${res.error}`);
            }
        } catch (err) {
            setNotification({ text: `Error al guardar: ${err.message}`, type: 'bad' });
        } finally {
            setIsSaving(false);
        }
    };

    // Delete
    const handleDelete = async () => {
        if (!selectedName || isNew) return;
        const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${selectedName}"? Esta acción no se puede deshacer.`);
        if (!confirmDelete) return;

        setNotification({ text: `Eliminando ${selectedName}...`, type: 'neutral' });
        try {
            let res;
            if (tabKind === 'drugs') {
                res = await drugService.deletePublishedDrug(selectedName);
            } else {
                res = await drugService.deletePendingDrug(selectedName);
            }

            if (res.success) {
                setNotification({ text: `Entrada "${selectedName}" eliminada con éxito.`, type: 'good' });
                setSelectedName(null);
                setEditorText('');
                setOriginalText('');
                loadList(tabKind);
            } else {
                setNotification({ text: `Error al eliminar: ${res.error}`, type: 'bad' });
            }
        } catch (err) {
            setNotification({ text: `Error: ${err.message}`, type: 'bad' });
        }
    };

    // Keybindings: Cmd+S / Ctrl+S and Tab key handling
    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            if (isDirty && isValid && !isSaving) {
                handleSave();
            }
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            textarea.value = value.substring(0, start) + '  ' + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 2;
            setEditorText(textarea.value);
        }
    };

    // Unauthorized view
    if (!isAdmin) {
        return (
            <div className={styles.adminContainer}>
                <Helmet>
                    <title>Acceso Restringido | ClickSalud FarmacoPedia</title>
                </Helmet>
                <div className={styles.unauthorizedCard}>
                    <div className={styles.unauthorizedIcon}>🔒</div>
                    <h1 className={styles.unauthorizedTitle}>Acceso Restringido</h1>
                    <p className={styles.unauthorizedText}>
                        Esta área de edición clínica está reservada exclusivamente para administradores autorizados de ClickSalud FarmacoPedia.
                    </p>
                    <button type="button" className={styles.backHomeBtn} onClick={() => navigate('/')}>
                        ← Volver al Vademécum
                    </button>
                </div>
            </div>
        );
    }

    const previewDrug = isValid ? parsed.value : null;

    return (
        <div className={styles.adminContainer}>
            <Helmet>
                <title>Editor Clínico JSON | Panel de Administración</title>
            </Helmet>

            {/* Top Bar */}
            <header className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <button type="button" className={styles.backBtn} onClick={() => navigate('/')} title="Volver a la aplicación">
                        ← Salir
                    </button>
                    <div className={styles.topBarTitle}>
                        <span>Editor Clínico de Fármacos</span>
                        <span className={styles.adminBadge}>Admin</span>
                    </div>
                </div>

                <div className={styles.topBarRight}>
                    <button
                        type="button"
                        className={`${styles.togglePreviewBtn} ${showPreview ? styles.togglePreviewBtnActive : ''}`}
                        onClick={() => setShowPreview((p) => !p)}
                        title="Alternar vista previa en tiempo real"
                    >
                        👁️ Vista Previa {showPreview ? 'Activada' : 'Oculta'}
                    </button>

                    <button
                        type="button"
                        className={styles.discardBtn}
                        onClick={handleDiscard}
                        disabled={!isDirty || isSaving}
                    >
                        Descartar
                    </button>

                    <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={handleDelete}
                        disabled={!selectedName || isNew || isSaving}
                    >
                        Eliminar
                    </button>

                    <button
                        type="button"
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={!isDirty || !isValid || isSaving}
                        title="Guardar cambios (Ctrl+S / Cmd+S)"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar (Ctrl+S)'}
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className={styles.workspace}>
                {/* 1. Side Navigation Panel */}
                <aside className={styles.sideNav}>
                    <div className={styles.tabsRow}>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${tabKind === 'drugs' ? styles.tabBtnActive : ''}`}
                            onClick={() => {
                                if (tabKind !== 'drugs') {
                                    setTabKind('drugs');
                                    setSelectedName(null);
                                    setEditorText('');
                                    setOriginalText('');
                                }
                            }}
                        >
                            Fármacos ({items && tabKind === 'drugs' ? items.length : '...'})
                        </button>
                        <button
                            type="button"
                            className={`${styles.tabBtn} ${tabKind === 'pending' ? styles.tabBtnActive : ''}`}
                            onClick={() => {
                                if (tabKind !== 'pending') {
                                    setTabKind('pending');
                                    setSelectedName(null);
                                    setEditorText('');
                                    setOriginalText('');
                                }
                            }}
                        >
                            Pendientes ({items && tabKind === 'pending' ? items.length : '...'})
                        </button>
                    </div>

                    <div className={styles.searchBox}>
                        <input
                            type="search"
                            className={styles.searchInput}
                            placeholder="Buscar entrada..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="button" className={styles.newBtn} onClick={handleNewEntry} title="Crear nueva entrada">
                            + Nuevo
                        </button>
                    </div>

                    <ul className={styles.listItems}>
                        {isLoadingList ? (
                            <li style={{ padding: '16px', textAlign: 'center', color: 'var(--textMuted)' }}>Cargando datos...</li>
                        ) : filteredItems.length === 0 ? (
                            <li style={{ padding: '16px', textAlign: 'center', color: 'var(--textMuted)' }}>Sin coincidencias</li>
                        ) : (
                            filteredItems.map((item) => {
                                const isSelected = selectedName === item.name;
                                return (
                                    <li
                                        key={item.name}
                                        className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ''}`}
                                        onClick={() => handleSelectEntry(item.name)}
                                    >
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.name}
                                        </span>
                                        {tabKind === 'pending' && (
                                            <span className={`${styles.statusTag} ${item.status === 'completed' ? styles.statusTagCompleted : ''}`}>
                                                {item.status || 'pending'}
                                            </span>
                                        )}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </aside>

                {/* 2. Central JSON Editor */}
                <section className={styles.editorPanel}>
                    <div className={styles.editorHeader}>
                        <span className={styles.editorHeaderTitle}>
                            {selectedName ? (isNew ? `+ Creando: ${selectedName}` : `✏️ Editando: ${selectedName}`) : 'Selecciona una entrada de la izquierda'}
                        </span>
                        <span>{isDirty ? '● Cambios sin guardar' : '✓ Sincronizado'}</span>
                    </div>

                    <textarea
                        ref={textareaRef}
                        className={styles.editorTextarea}
                        value={editorText}
                        onChange={(e) => setEditorText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!selectedName}
                        placeholder={selectedName ? 'Escribe o edita el objeto JSON aquí...' : 'Selecciona o crea una entrada para comenzar a editar'}
                        spellCheck="false"
                    />

                    <footer className={styles.editorStatusBar}>
                        <div>
                            {parsed.error ? (
                                <span className={styles.statusBad}>{parsed.error}</span>
                            ) : isValid ? (
                                <span className={styles.statusGood}>✓ JSON Clínico Válido</span>
                            ) : (
                                <span>{notification.text || 'Listo'}</span>
                            )}
                        </div>
                        <div>
                            {editorText.length} caracteres • {editorText.split('\n').length} líneas
                        </div>
                    </footer>
                </section>

                {/* 3. Live Preview Panel */}
                {showPreview && (
                    <aside className={styles.previewPanel}>
                        <div className={styles.previewHeader}>
                            <span>Vista Previa Clínica en Vivo</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--textMuted)' }}>Actualización automática</span>
                        </div>

                        <div className={styles.previewBody}>
                            {!previewDrug ? (
                                <div className={styles.previewEmpty}>
                                    {parsed.error
                                        ? 'Corrige el error de sintaxis en el editor para previsualizar.'
                                        : 'Selecciona o escribe un JSON válido para ver la ficha clínica.'}
                                </div>
                            ) : (
                                <>
                                    <div className={styles.previewDrugHeader}>
                                        <h3 className={styles.previewDrugName}>{previewDrug.name || 'Sin nombre'}</h3>
                                        {previewDrug.atc?.[0]?.code && (
                                            <span className={styles.previewAtcBadge}>
                                                ATC: {previewDrug.atc[0].code}
                                            </span>
                                        )}
                                    </div>

                                    {previewDrug.actionMechanism && (
                                        <div className={styles.previewSection}>
                                            <div className={styles.previewSectionTitle}>Mecanismo de Acción</div>
                                            <div className={styles.previewSectionContent}>{previewDrug.actionMechanism}</div>
                                        </div>
                                    )}

                                    {Array.isArray(previewDrug.indications) && previewDrug.indications.length > 0 && (
                                        <div className={styles.previewSection}>
                                            <div className={styles.previewSectionTitle}>Indicaciones Clínicas</div>
                                            <div className={styles.previewTags}>
                                                {previewDrug.indications.map((ind, idx) => (
                                                    <span key={idx} className={styles.previewTag}>
                                                        {typeof ind === 'string' ? ind : ind.description || JSON.stringify(ind)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {previewDrug.dosage && (
                                        <div className={styles.previewSection}>
                                            <div className={styles.previewSectionTitle}>Posología y Dosificación</div>
                                            {previewDrug.dosage.adults && (
                                                <div style={{ marginBottom: '6px' }}>
                                                    <strong>Adultos:</strong> {previewDrug.dosage.adults}
                                                </div>
                                            )}
                                            {previewDrug.dosage.pediatric && (
                                                <div>
                                                    <strong>Pediátrico:</strong> {previewDrug.dosage.pediatric}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {previewDrug.risks && (
                                        <div className={styles.previewSection}>
                                            <div className={styles.previewSectionTitle}>Perfil de Seguridad y Riesgo</div>
                                            <div className={styles.previewRisksGrid}>
                                                {previewDrug.risks.pregnancy && (
                                                    <div className={styles.riskItem}>
                                                        <div className={styles.riskLabel}>Embarazo</div>
                                                        <div className={styles.riskValue}>{previewDrug.risks.pregnancy}</div>
                                                    </div>
                                                )}
                                                {previewDrug.risks.lactation && (
                                                    <div className={styles.riskItem}>
                                                        <div className={styles.riskLabel}>Lactancia</div>
                                                        <div className={styles.riskValue}>{previewDrug.risks.lactation}</div>
                                                    </div>
                                                )}
                                                {previewDrug.risks.renal && (
                                                    <div className={styles.riskItem}>
                                                        <div className={styles.riskLabel}>Renal</div>
                                                        <div className={styles.riskValue}>{previewDrug.risks.renal}</div>
                                                    </div>
                                                )}
                                                {previewDrug.risks.hepatic && (
                                                    <div className={styles.riskItem}>
                                                        <div className={styles.riskLabel}>Hepático</div>
                                                        <div className={styles.riskValue}>{previewDrug.risks.hepatic}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {Array.isArray(previewDrug.contraindications) && previewDrug.contraindications.length > 0 && (
                                        <div className={styles.previewSection}>
                                            <div className={styles.previewSectionTitle}>Contraindicaciones</div>
                                            <ul style={{ margin: '4px 0 0', paddingLeft: '18px', fontSize: '0.82rem' }}>
                                                {previewDrug.contraindications.map((ci, idx) => (
                                                    <li key={idx}>{typeof ci === 'string' ? ci : JSON.stringify(ci)}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default AdminEditor;
