import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ROLES } from '../../../shared/constants/domain.constants';
import styles from './UsersFilters.module.css';

export interface ActiveFilters {
  searchText: string;
  filterRol: string;
  filterEstado: string;
  filterPrimerAcceso: string;
}

export interface UsersFiltersProps {
  onApplyFilters: (filters: ActiveFilters) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const INITIAL_FILTERS: ActiveFilters = {
  searchText: '',
  filterRol: 'todos',
  filterEstado: 'todos',
  filterPrimerAcceso: 'todos',
};

/**
 * Ajusta el ancho de un <select> al texto de la opción actualmente seleccionada,
 * midiendo el texto con un canvas offscreen para mayor precisión.
 */
const fitSelectWidth = (select: HTMLSelectElement) => {
  const selectedText = select.options[select.selectedIndex]?.text ?? '';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const computed = window.getComputedStyle(select);
  ctx.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
  const textWidth = ctx.measureText(selectedText).width;
  // padding lateral (0.5rem * 2) + espacio para la flecha nativa (~20px)
  select.style.width = `${Math.ceil(textWidth) + 32}px`;
};

const UsersFilters: React.FC<UsersFiltersProps> = ({
  onApplyFilters,
  onClearFilters,
}) => {
  const [localFilters, setLocalFilters] =
    useState<ActiveFilters>(INITIAL_FILTERS);

  const rolRef = useRef<HTMLSelectElement>(null);
  const estadoRef = useRef<HTMLSelectElement>(null);
  const primerAccesoRef = useRef<HTMLSelectElement>(null);

  const adjustWidths = useCallback(() => {
    if (rolRef.current) fitSelectWidth(rolRef.current);
    if (estadoRef.current) fitSelectWidth(estadoRef.current);
    if (primerAccesoRef.current) fitSelectWidth(primerAccesoRef.current);
  }, []);

  useEffect(() => {
    const t = setTimeout(adjustWidths, 0);
    return () => clearTimeout(t);
  }, [
    localFilters.filterRol,
    localFilters.filterEstado,
    localFilters.filterPrimerAcceso,
    adjustWidths,
  ]);

  // Actualizar un campo y propagar si es el texto (búsqueda en tiempo real)
  const updateFilter = <K extends keyof ActiveFilters>(
    key: K,
    value: ActiveFilters[K]
  ) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);

    // El texto de búsqueda se propaga en tiempo real
    if (key === 'searchText') {
      onApplyFilters(updated);
    }
  };

  // Disparar búsqueda con los filtros locales actuales (botón buscar)
  const handleSearch = () => {
    onApplyFilters(localFilters);
  };

  // Buscar al pulsar Enter en el input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Limpiar input local y propagar
  const handleClearInput = () => {
    const updated = { ...localFilters, searchText: '' };
    setLocalFilters(updated);
    onApplyFilters(updated);
  };

  // Limpiar todos los filtros locales y notificar al padre
  const handleClearAll = () => {
    setLocalFilters(INITIAL_FILTERS);
    onClearFilters();
  };

  // Hay algo activo si hay texto O algún dropdown seleccionado
  const hasLocalActive =
    localFilters.searchText.trim() !== '' ||
    localFilters.filterRol !== 'todos' ||
    localFilters.filterEstado !== 'todos' ||
    localFilters.filterPrimerAcceso !== 'todos';

  return (
    <div className={styles.filtersOuter}>
      {/* Texto "✕ Limpiar" encima del searchbar, anclado a la izquierda */}
      {hasLocalActive && (
        <button
          type="button"
          className={styles.clearTextBtn}
          onClick={handleClearAll}
          aria-label="Limpiar todos los filtros"
        >
          ✕ Limpiar
        </button>
      )}

      {/* Barra unificada */}
      <div className={styles.filtersWrapper}>
        <div className={styles.filterBar}>
          {/* Botón de búsqueda azul oscuro - lado izquierdo */}
          <button
            type="button"
            className={styles.searchBtn}
            onClick={handleSearch}
            aria-label="Buscar"
          >
            <svg
              className={styles.searchBtnIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Input de búsqueda - tiempo real */}
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nombre, apellidos o email..."
            value={localFilters.searchText}
            onChange={e => updateFilter('searchText', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Buscar usuarios por nombre, apellidos o email"
          />

          {/* Botón ✕ del input */}
          {localFilters.searchText && (
            <button
              type="button"
              className={styles.clearInputBtn}
              onClick={handleClearInput}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}

          {/* Separador full-height */}
          <span className={styles.separator} aria-hidden="true" />

          {/* Dropdown: Rol */}
          <select
            ref={rolRef}
            id="filter-rol"
            className={`${styles.filterSelect} ${localFilters.filterRol !== 'todos' ? styles.filterActive : ''}`}
            value={localFilters.filterRol}
            onChange={e => updateFilter('filterRol', e.target.value)}
            aria-label="Filtrar por rol"
          >
            <option value="todos">Rol</option>
            <option value={ROLES.BECARIO}>Becario</option>
            <option value={ROLES.TUTOR_EMPRESA}>Tutor de empresa</option>
            <option value={ROLES.ADMIN}>Admin</option>
            <option value={ROLES.TUTOR_ACADEMICO}>Tutor académico</option>
          </select>

          {/* Separador full-height */}
          <span className={styles.separator} aria-hidden="true" />

          {/* Dropdown: Estado */}
          <select
            ref={estadoRef}
            id="filter-estado"
            className={`${styles.filterSelect} ${localFilters.filterEstado !== 'todos' ? styles.filterActive : ''}`}
            value={localFilters.filterEstado}
            onChange={e => updateFilter('filterEstado', e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="todos">Estado</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          {/* Separador full-height */}
          <span className={styles.separator} aria-hidden="true" />

          {/* Dropdown: Primer acceso */}
          <select
            ref={primerAccesoRef}
            id="filter-primer-acceso"
            className={`${styles.filterSelect} ${localFilters.filterPrimerAcceso !== 'todos' ? styles.filterActive : ''}`}
            value={localFilters.filterPrimerAcceso}
            onChange={e => updateFilter('filterPrimerAcceso', e.target.value)}
            aria-label="Filtrar por primer acceso"
          >
            <option value="todos">P. Acceso</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Completado">Completado</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default UsersFilters;
