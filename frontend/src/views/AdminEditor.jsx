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

const getRiskSeverity = (text) => {
    if (!text) return 'info';
    const lower = String(text).toLowerCase();
    if (lower.includes('contraindicad') || lower.includes('evitar') || lower.includes('no recomendad') || lower.includes('grave') || lower.includes('severa') || lower.includes('alto')) {
        return 'danger';
    }
    if (lower.includes('precauci') || lower.includes('ajuste') || lower.includes('monitoreo') || lower.includes('reducir') || lower.includes('moderad')) {
        return 'warning';
    }
    if (lower.includes('seguro') || lower.includes('no requiere') || lower.includes('sin ajuste') || lower.includes('normal') || lower.includes('compatible') || lower.includes('bajo')) {
        return 'success';
    }
    return 'info';
};

const getSeverityClass = (sev) => {
    const s = String(sev || '').toLowerCase();
    if (s.includes('grave') || s.includes('alta') || s.includes('contraindicad') || s.includes('sever')) return styles.severityBadgeDanger;
    if (s.includes('moderad') || s.includes('media')) return styles.severityBadgeWarning;
    return styles.severityBadgeInfo;
};

const AdminEditor = () => {
    const { user, updateUser } = useContext(counterContext);
    const navigate = useNavigate();

    // Verification & Admin Session
    const isAdmin = Boolean(user && user.role === 'admin');
    const [isVerifying, setIsVerifying] = useState(false);

    // Layout configuration
    // layoutMode: '3cols' | 'split' | 'fullscreen' | 'json'
    const [layoutMode, setLayoutMode] = useState('3cols');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

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
    const [notification, setNotification] = useState({ text: '', type: 'neutral' });

    // Emulated monograph view state
    const [activeMonographTab, setActiveMonographTab] = useState('all'); // 'all' | 'overview' | 'dosage' | 'risks' | 'safety' | 'references'

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

    // Layout mode applicator
    const handleSetLayoutMode = (mode) => {
        setLayoutMode(mode);
        if (mode === '3cols') {
            setIsSidebarCollapsed(false);
            setIsEditorCollapsed(false);
            setShowPreview(true);
        } else if (mode === 'split') {
            setIsSidebarCollapsed(true);
            setIsEditorCollapsed(false);
            setShowPreview(true);
        } else if (mode === 'fullscreen') {
            setIsSidebarCollapsed(true);
            setIsEditorCollapsed(true);
            setShowPreview(true);
        } else if (mode === 'json') {
            setIsSidebarCollapsed(false);
            setIsEditorCollapsed(false);
            setShowPreview(false);
        }
    };

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
            presentations: {
                Comprimidos: {
                    dosage: [
                        { amount: '500', unit: 'mg', useIn: 'Adultos', route: ['Oral'] }
                    ]
                }
            },
            risk: {
                pregnancy: 'Categoría C',
                lactation: 'Compatible con precaución',
                geriatric: 'Sin ajustes necesarios en ancianos con función renal normal',
                renal: {
                    level: 'Ajuste requerido si ClCr < 50 mL/min',
                    adjustment: 'Reducir la dosis al 50% en insuficiencia renal moderada'
                },
                hepatic: {
                    level: 'Precaución en insuficiencia hepática',
                    adjustment: 'Monitorizar enzimas hepáticas durante tratamientos prolongados'
                },
                securityFlags: ['Uso bajo supervisión médica']
            },
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

    // Derived helpers for the emulated monograph
    const presentationsEntries = (() => {
        if (!previewDrug || !previewDrug.presentations) return [];
        if (typeof previewDrug.presentations === 'object' && !Array.isArray(previewDrug.presentations)) {
            return Object.entries(previewDrug.presentations);
        }
        return [];
    })();

    const adultGuidanceEntries = (() => {
        if (!previewDrug || !previewDrug.adultGuidance) return [];
        if (typeof previewDrug.adultGuidance === 'object' && !Array.isArray(previewDrug.adultGuidance)) {
            return Object.entries(previewDrug.adultGuidance);
        }
        return [];
    })();

    const pediatricGuidanceEntries = (() => {
        if (!previewDrug || !previewDrug.pediatricGuidance) return [];
        if (typeof previewDrug.pediatricGuidance === 'object' && !Array.isArray(previewDrug.pediatricGuidance)) {
            return Object.entries(previewDrug.pediatricGuidance);
        }
        return [];
    })();

    const risksObj = previewDrug ? (previewDrug.risk || previewDrug.risks || {}) : {};
    const securityFlags = risksObj.securityFlags || previewDrug?.securityFlags || [];

    const isFullscreenPreview = isSidebarCollapsed && isEditorCollapsed && showPreview;

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

                    {/* Layout Mode Segmented Control */}
                    <div className={styles.layoutSegmentedGroup}>
                        <button
                            type="button"
                            className={`${styles.layoutBtn} ${layoutMode === '3cols' && !isSidebarCollapsed && !isEditorCollapsed && showPreview ? styles.layoutBtnActive : ''}`}
                            onClick={() => handleSetLayoutMode('3cols')}
                            title="Ver los 3 paneles (Buscador, Editor y Vista Web)"
                        >
                            <span>📋</span> 3 Paneles
                        </button>
                        <button
                            type="button"
                            className={`${styles.layoutBtn} ${layoutMode === 'split' || (isSidebarCollapsed && !isEditorCollapsed && showPreview) ? styles.layoutBtnActive : ''}`}
                            onClick={() => handleSetLayoutMode('split')}
                            title="Ocultar buscador: Editor y Vista Web 50/50"
                        >
                            <span>💻</span> Editor + Web
                        </button>
                        <button
                            type="button"
                            className={`${styles.layoutBtn} ${layoutMode === 'fullscreen' || isFullscreenPreview ? styles.layoutBtnActive : ''}`}
                            onClick={() => handleSetLayoutMode('fullscreen')}
                            title="Minimizar todo y ver la Vista Web en Pantalla Completa (100%)"
                        >
                            <span>🖥️</span> Vista Web 100%
                        </button>
                        <button
                            type="button"
                            className={`${styles.layoutBtn} ${!showPreview ? styles.layoutBtnActive : ''}`}
                            onClick={() => handleSetLayoutMode('json')}
                            title="Ver solo el editor JSON"
                        >
                            <span>📝</span> Solo JSON
                        </button>
                    </div>
                </div>

                <div className={styles.topBarRight}>
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
                {/* Floating pill to restore sidebar if collapsed */}
                {isSidebarCollapsed && (
                    <button
                        type="button"
                        className={styles.floatingSidebarPill}
                        onClick={() => setIsSidebarCollapsed(false)}
                        title="Restaurar panel de catálogo de fármacos"
                    >
                        📂 Fármacos
                    </button>
                )}

                {/* 1. Side Navigation Panel */}
                <aside className={`${styles.sideNav} ${isSidebarCollapsed ? styles.sideNavCollapsed : ''}`}>
                    <div className={styles.sideHeader}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--textSecondary)' }}>
                            CATÁLOGO CLÍNICO
                        </span>
                        <button
                            type="button"
                            className={styles.sideCollapseBtn}
                            onClick={() => setIsSidebarCollapsed(true)}
                            title="Minimizar panel lateral"
                        >
                            ◀ Minimizar
                        </button>
                    </div>

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

                {/* 2. Central JSON Editor Panel */}
                <section className={`${styles.editorPanel} ${isEditorCollapsed ? styles.editorPanelCollapsed : ''}`}>
                    <div className={styles.editorHeader}>
                        <span className={styles.editorHeaderTitle}>
                            {selectedName ? (isNew ? `+ Creando: ${selectedName}` : `✏️ Editando: ${selectedName}`) : 'Selecciona una entrada de la izquierda'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{isDirty ? '● Cambios sin guardar' : '✓ Sincronizado'}</span>
                            <button
                                type="button"
                                className={styles.sideCollapseBtn}
                                onClick={() => setIsEditorCollapsed(true)}
                                title="Minimizar panel del editor JSON"
                            >
                                ◀ Ocultar Editor
                            </button>
                        </div>
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

                {/* 3. Live Emulated Web Preview Panel */}
                {showPreview && (
                    <aside className={`${styles.previewPanel} ${isFullscreenPreview ? styles.previewPanelFullscreen : ''}`}>
                        <div className={styles.previewTopBar}>
                            <div className={styles.previewTopBarTitle}>
                                <span>🌐 Vista Emulada del Sitio Web</span>
                                {isFullscreenPreview && (
                                    <span className={styles.fullscreenNotice}>Pantalla Completa 100%</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {(isSidebarCollapsed || isEditorCollapsed) && (
                                    <button
                                        type="button"
                                        className={styles.restorePanelsBtn}
                                        onClick={() => handleSetLayoutMode('3cols')}
                                        title="Restaurar paneles (Editor y Buscador)"
                                    >
                                        ⤢ Restaurar Paneles
                                    </button>
                                )}
                                {!isFullscreenPreview && (
                                    <button
                                        type="button"
                                        className={styles.sideCollapseBtn}
                                        onClick={() => handleSetLayoutMode('fullscreen')}
                                        title="Expandir vista previa a pantalla completa"
                                    >
                                        ⛶ Pantalla Completa
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles.previewBody}>
                            {!previewDrug ? (
                                <div className={styles.previewEmpty}>
                                    {parsed.error
                                        ? 'Corrige el error de sintaxis en el editor para previsualizar.'
                                        : 'Selecciona o escribe un JSON válido para ver la ficha clínica completa tal como la ven los médicos.'}
                                </div>
                            ) : tabKind === 'pending' ? (
                                /* Pending Drug Card */
                                <div className={styles.pendingPreviewCard}>
                                    <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--textPrimary)' }}>
                                        {previewDrug.name || 'Sin nombre'}
                                    </h2>
                                    <div className={styles.pendingBadgeRow}>
                                        <span className={`${styles.statusTag} ${previewDrug.status === 'completed' ? styles.statusTagCompleted : ''}`}>
                                            Estado: {previewDrug.status || 'pending'}
                                        </span>
                                        <span className={styles.compactDosageCountBadge}>
                                            Búsquedas: {previewDrug.searchCount || 1}
                                        </span>
                                    </div>
                                    {previewDrug.note && (
                                        <p className={styles.emulatedPlainText}>
                                            <strong>Nota interna:</strong> {previewDrug.note}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                /* Full Emulated Clinical Monograph (Mirroring DetalleFarmaco.jsx) */
                                <div className={styles.emulatedMonographContainer}>
                                    {/* Monograph Header Card */}
                                    <div className={styles.emulatedHeaderCard}>
                                        <div className={styles.emulatedDrugNameRow}>
                                            <h1 className={styles.emulatedDrugName}>{previewDrug.name || 'Sin nombre'}</h1>
                                            {Array.isArray(previewDrug.atc) && previewDrug.atc.length > 0 && (
                                                <div className={styles.emulatedAtcGroup}>
                                                    {previewDrug.atc.map((item, idx) => (
                                                        <span key={idx} className={styles.emulatedAtcCodeBadge}>
                                                            ATC {item.code || item}
                                                        </span>
                                                    ))}
                                                    {previewDrug.atc[0]?.subcategoryName && (
                                                        <span className={styles.emulatedAtcCategoryBadge}>
                                                            {previewDrug.atc[0].subcategoryName}
                                                        </span>
                                                    )}
                                                    {previewDrug.atc[0]?.categoryName && (
                                                        <span className={styles.emulatedAtcCategoryBadge}>
                                                            {previewDrug.atc[0].categoryName}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Security Alerts Callout */}
                                        {securityFlags.length > 0 && (
                                            <div className={styles.emulatedSecurityAlertBox}>
                                                <span>⚠️</span>
                                                <div>
                                                    <strong>Alertas de Seguridad Relevantes:</strong>
                                                    <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                                                        {securityFlags.map((flag, idx) => (
                                                            <li key={idx}>{flag}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Section Tabs */}
                                    <div className={styles.emulatedIndexNav}>
                                        <button
                                            type="button"
                                            className={`${styles.emulatedIndexTab} ${activeMonographTab === 'all' ? styles.emulatedIndexTabActive : ''}`}
                                            onClick={() => setActiveMonographTab('all')}
                                        >
                                            📄 Todo
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.emulatedIndexTab} ${activeMonographTab === 'overview' ? styles.emulatedIndexTabActive : ''}`}
                                            onClick={() => setActiveMonographTab('overview')}
                                        >
                                            🔍 General
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.emulatedIndexTab} ${activeMonographTab === 'dosage' ? styles.emulatedIndexTabActive : ''}`}
                                            onClick={() => setActiveMonographTab('dosage')}
                                        >
                                            💊 Posología
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.emulatedIndexTab} ${activeMonographTab === 'risks' ? styles.emulatedIndexTabActive : ''}`}
                                            onClick={() => setActiveMonographTab('risks')}
                                        >
                                            ⚠️ Riesgos
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.emulatedIndexTab} ${activeMonographTab === 'safety' ? styles.emulatedIndexTabActive : ''}`}
                                            onClick={() => setActiveMonographTab('safety')}
                                        >
                                            🛡️ Seguridad
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.emulatedIndexTab} ${activeMonographTab === 'references' ? styles.emulatedIndexTabActive : ''}`}
                                            onClick={() => setActiveMonographTab('references')}
                                        >
                                            📚 Referencias
                                        </button>
                                    </div>

                                    {/* SECTION 1: Overview & Indications */}
                                    {(activeMonographTab === 'all' || activeMonographTab === 'overview') && (
                                        <>
                                            {previewDrug.actionMechanism && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>📖</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Mecanismo de Acción</h2>
                                                    </div>
                                                    <p className={styles.emulatedPlainText}>{previewDrug.actionMechanism}</p>
                                                </div>
                                            )}

                                            {Array.isArray(previewDrug.indications) && previewDrug.indications.length > 0 && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>🎯</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Indicaciones Terapéuticas</h2>
                                                    </div>
                                                    <ul className={styles.emulatedBulletList}>
                                                        {previewDrug.indications.map((ind, idx) => (
                                                            <li key={idx}>{typeof ind === 'string' ? ind : ind.description || JSON.stringify(ind)}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {previewDrug.overdose && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>🛑</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Sobredosis y Toxicidad</h2>
                                                    </div>
                                                    <p className={styles.emulatedPlainText}>{previewDrug.overdose}</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* SECTION 2: Dosage & Presentations */}
                                    {(activeMonographTab === 'all' || activeMonographTab === 'dosage') && (
                                        <>
                                            {/* Presentations Table */}
                                            {presentationsEntries.length > 0 && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>📦</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Presentaciones Comerciales</h2>
                                                    </div>
                                                    <div className={styles.presentationsCompactList}>
                                                        {presentationsEntries.map(([formName, formValue], idx) => (
                                                            <div key={idx} className={styles.compactPresentationRow}>
                                                                <div className={styles.compactPresentationHeader}>
                                                                    <span className={styles.compactPresentationTitle}>{formName}</span>
                                                                    <span className={styles.compactDosageCountBadge}>
                                                                        {formValue.dosage?.length || 0} dosis disponibles
                                                                    </span>
                                                                </div>
                                                                <div className={styles.compactDoseChipsWrapper}>
                                                                    {Array.isArray(formValue.dosage) && formValue.dosage.map((d, dIdx) => (
                                                                        <div key={dIdx} className={styles.compactDoseChip}>
                                                                            <span className={styles.compactDoseAmount}>
                                                                                {d.amount} {d.unit}
                                                                            </span>
                                                                            {d.useIn && (
                                                                                <span className={styles.useInBadge}>{d.useIn}</span>
                                                                            )}
                                                                            {Array.isArray(d.route) && d.route.map((r, rIdx) => (
                                                                                <span key={rIdx} className={styles.routeBadge}>{r}</span>
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dosage Guidelines (Adult Guidance) */}
                                            {adultGuidanceEntries.length > 0 && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>👤</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Guía de Dosificación en Adultos</h2>
                                                    </div>
                                                    <div className={styles.guidanceGrid}>
                                                        {adultGuidanceEntries.map(([routeName, guideData], idx) => (
                                                            <div key={idx} className={styles.guidanceCard}>
                                                                <div className={styles.guidanceRouteName}>{routeName}</div>
                                                                {guideData.guidelines && guideData.guidelines.length > 0 && (
                                                                    <div>
                                                                        <span className={styles.guidanceItemTitle}>Pautas:</span>
                                                                        <ul className={styles.emulatedBulletList}>
                                                                            {guideData.guidelines.map((g, gIdx) => (
                                                                                <li key={gIdx}>{g}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {guideData.maxDose && guideData.maxDose.length > 0 && (
                                                                    <div>
                                                                        <span className={styles.guidanceItemTitle}>Dosis Máxima:</span>
                                                                        <ul className={styles.emulatedBulletList}>
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

                                            {/* Dosage Guidelines (Pediatric Guidance) */}
                                            {pediatricGuidanceEntries.length > 0 && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>🧒</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Guía de Dosificación Pediátrica</h2>
                                                    </div>
                                                    <div className={styles.guidanceGrid}>
                                                        {pediatricGuidanceEntries.map(([routeName, guideData], idx) => (
                                                            <div key={idx} className={styles.guidanceCard}>
                                                                <div className={styles.guidanceRouteName}>{routeName}</div>
                                                                {guideData.guidelines && guideData.guidelines.length > 0 && (
                                                                    <div>
                                                                        <span className={styles.guidanceItemTitle}>Pautas Pediátricas:</span>
                                                                        <ul className={styles.emulatedBulletList}>
                                                                            {guideData.guidelines.map((g, gIdx) => (
                                                                                <li key={gIdx}>{g}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                                {guideData.maxDose && guideData.maxDose.length > 0 && (
                                                                    <div>
                                                                        <span className={styles.guidanceItemTitle}>Dosis Máxima Pediátrica:</span>
                                                                        <ul className={styles.emulatedBulletList}>
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

                                            {/* Legacy Dosage Object if guidance not present */}
                                            {previewDrug.dosage && (previewDrug.dosage.adults || previewDrug.dosage.pediatric) && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>💊</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Posología y Administración</h2>
                                                    </div>
                                                    {previewDrug.dosage.adults && (
                                                        <div style={{ marginBottom: '8px' }}>
                                                            <strong>Dosis en Adultos:</strong>
                                                            <p className={styles.emulatedPlainText}>{previewDrug.dosage.adults}</p>
                                                        </div>
                                                    )}
                                                    {previewDrug.dosage.pediatric && (
                                                        <div>
                                                            <strong>Dosis Pediátrica:</strong>
                                                            <p className={styles.emulatedPlainText}>{previewDrug.dosage.pediatric}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* SECTION 3: Clinical Risks & Organ Adjustments */}
                                    {(activeMonographTab === 'all' || activeMonographTab === 'risks') && (
                                        <div className={styles.emulatedSectionCard}>
                                            <div className={styles.emulatedSectionHeader}>
                                                <span className={styles.emulatedSectionIcon}>⚖️</span>
                                                <h2 className={styles.emulatedSectionTitle}>Riesgos Clínicos y Ajustes Orgánicos</h2>
                                            </div>

                                            <div className={styles.riskRowsContainer}>
                                                {/* Embarazo */}
                                                <div className={styles.riskTableRow}>
                                                    <div className={styles.riskRowHeaderCol}>
                                                        <span className={styles.riskRowIcon}>🤰</span>
                                                        <span className={styles.riskRowTitle}>Embarazo</span>
                                                    </div>
                                                    <p className={styles.riskRowText}>{risksObj.pregnancy || 'Sin información reportada'}</p>
                                                </div>

                                                {/* Lactancia */}
                                                <div className={styles.riskTableRow}>
                                                    <div className={styles.riskRowHeaderCol}>
                                                        <span className={styles.riskRowIcon}>🍼</span>
                                                        <span className={styles.riskRowTitle}>Lactancia</span>
                                                    </div>
                                                    <p className={styles.riskRowText}>{risksObj.lactation || 'Sin información reportada'}</p>
                                                </div>

                                                {/* Geriatría */}
                                                <div className={styles.riskTableRow}>
                                                    <div className={styles.riskRowHeaderCol}>
                                                        <span className={styles.riskRowIcon}>👴</span>
                                                        <span className={styles.riskRowTitle}>Geriatría</span>
                                                    </div>
                                                    <p className={styles.riskRowText}>{risksObj.geriatric || 'Sin precauciones especiales documentadas'}</p>
                                                </div>

                                                {/* Ajuste Renal */}
                                                <div className={styles.riskTableRow}>
                                                    <div className={styles.riskRowHeaderCol}>
                                                        <span className={styles.riskRowIcon}>🩺</span>
                                                        <span className={styles.riskRowTitle}>Insuficiencia Renal</span>
                                                    </div>
                                                    {typeof risksObj.renal === 'object' && risksObj.renal !== null ? (
                                                        <div>
                                                            {risksObj.renal.level && (
                                                                <div className={`${styles.riskAlertCallout} ${styles['riskAlert_' + getRiskSeverity(risksObj.renal.level)]}`}>
                                                                    <span className={styles.riskAlertTag}>Criterio:</span>
                                                                    <span>{risksObj.renal.level}</span>
                                                                </div>
                                                            )}
                                                            {risksObj.renal.adjustment && (
                                                                <p className={styles.riskRowText}>{risksObj.renal.adjustment}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className={styles.riskRowText}>{risksObj.renal || 'Sin ajuste documentado'}</p>
                                                    )}
                                                </div>

                                                {/* Ajuste Hepático */}
                                                <div className={styles.riskTableRow}>
                                                    <div className={styles.riskRowHeaderCol}>
                                                        <span className={styles.riskRowIcon}>🧪</span>
                                                        <span className={styles.riskRowTitle}>Insuficiencia Hepática</span>
                                                    </div>
                                                    {typeof risksObj.hepatic === 'object' && risksObj.hepatic !== null ? (
                                                        <div>
                                                            {risksObj.hepatic.level && (
                                                                <div className={`${styles.riskAlertCallout} ${styles['riskAlert_' + getRiskSeverity(risksObj.hepatic.level)]}`}>
                                                                    <span className={styles.riskAlertTag}>Criterio:</span>
                                                                    <span>{risksObj.hepatic.level}</span>
                                                                </div>
                                                            )}
                                                            {risksObj.hepatic.adjustment && (
                                                                <p className={styles.riskRowText}>{risksObj.hepatic.adjustment}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className={styles.riskRowText}>{risksObj.hepatic || 'Sin ajuste documentado'}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SECTION 4: Safety, Contraindications & Interactions */}
                                    {(activeMonographTab === 'all' || activeMonographTab === 'safety') && (
                                        <>
                                            {/* Contraindications */}
                                            {Array.isArray(previewDrug.contraindications) && previewDrug.contraindications.length > 0 && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>🚫</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Contraindicaciones</h2>
                                                    </div>
                                                    <ul className={styles.emulatedBulletList}>
                                                        {previewDrug.contraindications.map((ci, idx) => (
                                                            <li key={idx}>{typeof ci === 'string' ? ci : JSON.stringify(ci)}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Interactions */}
                                            {Array.isArray(previewDrug.interactions) && previewDrug.interactions.length > 0 && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>🔄</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Interacciones Farmacológicas</h2>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {previewDrug.interactions.map((inter, idx) => {
                                                            if (typeof inter === 'object' && inter !== null) {
                                                                return (
                                                                    <div key={idx} className={styles.interactionCard}>
                                                                        <div className={styles.interactionHeader}>
                                                                            <span className={styles.interactionDrugName}>{inter.drug || 'Fármaco'}</span>
                                                                            {inter.severity && (
                                                                                <span className={getSeverityClass(inter.severity)}>
                                                                                    {inter.severity}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {inter.effect && (
                                                                            <p className={styles.interactionEffect}>{inter.effect}</p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div key={idx} className={styles.interactionCard}>
                                                                    <p className={styles.interactionEffect}>{inter}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Adverse Reactions */}
                                            {Array.isArray(previewDrug.adverseReactions) && previewDrug.adverseReactions.length > 0 && (
                                                <div className={styles.emulatedSectionCard}>
                                                    <div className={styles.emulatedSectionHeader}>
                                                        <span className={styles.emulatedSectionIcon}>⚡</span>
                                                        <h2 className={styles.emulatedSectionTitle}>Reacciones Adversas (RAMs)</h2>
                                                    </div>
                                                    <ul className={styles.emulatedBulletList}>
                                                        {previewDrug.adverseReactions.map((ram, idx) => (
                                                            <li key={idx}>{typeof ram === 'string' ? ram : JSON.stringify(ram)}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* SECTION 5: References */}
                                    {(activeMonographTab === 'all' || activeMonographTab === 'references') && (
                                        Array.isArray(previewDrug.references) && previewDrug.references.length > 0 && (
                                            <div className={styles.emulatedSectionCard}>
                                                <div className={styles.emulatedSectionHeader}>
                                                    <span className={styles.emulatedSectionIcon}>📚</span>
                                                    <h2 className={styles.emulatedSectionTitle}>Referencias Bibliográficas</h2>
                                                </div>
                                                <ul className={styles.emulatedBulletList}>
                                                    {previewDrug.references.map((ref, idx) => (
                                                        <li key={idx}>{ref}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default AdminEditor;
