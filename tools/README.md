# tools

Herramientas locales de FarmacoPedia.

## Comandos rápidos con pnpm (desde la raíz)

Puedes ejecutar todas las herramientas directamente con `pnpm run`:

- **Editor local:**
  ```bash
  pnpm run editor
  ```
- **Auditoría de BD MongoDB:**
  ```bash
  pnpm run audit:db
  ```
- **Auditoría de carpeta de JSONs:**
  ```bash
  pnpm run audit:folder
  ```
- **Auditoría de ficha individual:**
  ```bash
  pnpm run audit:record "auditoria final/acetaminofen_paracetamol.json"
  ```

---

## Restaurado desde Git

- `editor/` — editor administrativo local para revisar y editar fichas manualmente.
  - Ver `editor/.env.example` para variables de entorno.
  - Arranque habitual: `pnpm run editor` (o `node tools/editor/server.js`).

## Reconstruido tras el borrado

- `check-record.js` — audita **una** ficha JSON contra el criterio clínico actual.
  ```bash
  pnpm run audit:record "auditoria final/acetaminofen_paracetamol.json"
  ```
  Devuelve `COMPLETO`, `PARCIAL` o `DEFICIENTE` y lista las brechas.

- `audit-db.js` — audita toda la colección `drugs` de MongoDB y escribe `auditoria_farmacos.json`.
  ```bash
  pnpm run audit:db
  ```

- `audit-folder.js` — audita una carpeta entera de JSON (por ejemplo `auditoria final/`) y escribe `_auditoria.json` dentro de esa carpeta.
  ```bash
  pnpm run audit:folder
  ```

## Criterio de auditoría

No se usan umbrales artificiales de longitud ni mínimos de indicaciones/contraindicaciones/interacciones. Se exige:

- ATC presente.
- `actionMechanism` con contenido real, sin prefijos (`Grupo farmacoterapéutico:`, `Código ATC:`) ni HTML.
- Al menos 1 indicación, 1 contraindicación, 1 interacción y 1 reacción adversa reales.
- Presentaciones con dosis.
- Posología adulto y pediátrica (o “no establecido” cuando no aplica).
- Riesgo completo y al menos 1 `securityFlag`.
- Sobredosis con contenido.
- Al menos 1 referencia.

## No recuperado

Los scripts `validate-pending.js`, `import-folder.js`, `import-valid-json.js`, `sanitize-record.js`, `fix-prefix.js`, `seed-cima-missing.js`, `enrich-missing.js`, `merge-smart.js` y `merge-atc-json.js` eran archivos nuevos no versionados en Git y se perdieron con el borrado. Habría que reconstruirlos si se retoma la fase de importación masiva.
