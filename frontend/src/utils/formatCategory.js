/**
 * Formatea el nombre de una categoría o familia farmacológica para su correcta visualización.
 * - Corrige números romanos (ej: "ii" -> "II", "iii" -> "III", "iv" -> "IV").
 * - Corrige siglas y acrónimos médicos (ej: "(ara-ii)" -> "(ARA-II)", "isrs" -> "ISRS", "aines" -> "AINEs").
 * - Corrige variantes de agonistas beta-2.
 */
export const formatCategory = (category) => {
    if (!category || typeof category !== 'string') return '';

    const trimmed = category.trim();

    // Reemplazos específicos predefinidos
    const customDictionary = {
        'antagonistas de receptores de angiotensina ii': 'Antagonistas de receptores de angiotensina II (ARA-II)',
        'antagonistas de receptores de angiotensina ii (ara-ii)': 'Antagonistas de receptores de angiotensina II (ARA-II)',
        'antagonistas de receptores de angiotensina II (ARA-II)': 'Antagonistas de receptores de angiotensina II (ARA-II)',
        'agonistas beta dos adrenergicos selectivos': 'Agonistas beta-2 adrenérgicos selectivos',
        'agonistas beta-2 adrenergicos selectivos': 'Agonistas beta-2 adrenérgicos selectivos',
        'agonistas beta-2 adrenérgicos selectivos': 'Agonistas beta-2 adrenérgicos selectivos',
        'inhibidores selectivos de la recaptacion de serotonina': 'Inhibidores selectivos de la recaptación de serotonina (ISRS)',
        'antiinflamatorios no esteroideos': 'Antiinflamatorios no esteroideos (AINEs)'
    };

    const lower = trimmed.toLowerCase();
    if (customDictionary[lower]) {
        return customDictionary[lower];
    }
    if (customDictionary[trimmed]) {
        return customDictionary[trimmed];
    }

    // Reglas dinámicas de reemplazo de números romanos y acrónimos
    const formatted = trimmed
        .replace(/\bii\b/gi, 'II')
        .replace(/\biii\b/gi, 'III')
        .replace(/\biv\b/gi, 'IV')
        .replace(/\bvi\b/gi, 'VI')
        .replace(/\bvii\b/gi, 'VII')
        .replace(/\bviii\b/gi, 'VIII')
        .replace(/\bix\b/gi, 'IX')
        .replace(/\bx\b/gi, 'X')
        .replace(/\(?ara-ii\)?/gi, '(ARA-II)')
        .replace(/\bisrs\b/gi, 'ISRS')
        .replace(/\baines\b/gi, 'AINEs')
        .replace(/\bh1\b/gi, 'H1')
        .replace(/\bh2\b/gi, 'H2');

    // Capitalizar la primera letra si no está en mayúscula
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};
