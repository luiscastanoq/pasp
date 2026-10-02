import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './DatePickerInput.module.css';

interface DatePickerInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const POPOVER_WIDTH = 248;
const POPOVER_HEIGHT = 292;
const POPOVER_MARGIN = 8;

function parseIsoDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getMonthDays(monthDate: Date): Date[] {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isOutOfRange(date: Date, min?: Date | null, max?: Date | null) {
  const iso = toIsoDate(date);
  if (min && iso < toIsoDate(min)) return true;
  if (max && iso > toIsoDate(max)) return true;
  return false;
}

export function DatePickerInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  className = '',
  disabled,
  required,
  min,
  max,
  ariaInvalid,
  ariaDescribedBy,
}: DatePickerInputProps) {
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const minDate = useMemo(() => parseIsoDate(min), [min]);
  const maxDate = useMemo(() => parseIsoDate(max), [max]);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    selectedDate ?? minDate ?? new Date()
  );
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePopoverPosition = () => {
    if (!rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    const preferredTop = rect.bottom + POPOVER_MARGIN;
    const opensAbove =
      preferredTop + POPOVER_HEIGHT > window.innerHeight &&
      rect.top > POPOVER_HEIGHT + POPOVER_MARGIN;
    const top = opensAbove
      ? Math.max(POPOVER_MARGIN, rect.top - POPOVER_HEIGHT - POPOVER_MARGIN)
      : preferredTop;
    const left = Math.min(
      Math.max(POPOVER_MARGIN, rect.right - POPOVER_WIDTH),
      window.innerWidth - POPOVER_WIDTH - POPOVER_MARGIN
    );

    setPopoverPosition({ top, left });
  };

  const openCalendar = () => {
    if (disabled) return;
    setVisibleMonth(selectedDate ?? minDate ?? new Date());
    updatePopoverPosition();
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [isOpen]);

  const days = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);
  const today = new Date();

  const moveMonth = (offset: number) => {
    setVisibleMonth(
      current => new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  };

  const handlePick = (date: Date) => {
    onChange(toIsoDate(date));
    setIsOpen(false);
  };

  const handleToday = () => {
    const todayDate = new Date();
    setVisibleMonth(todayDate);
    if (!isOutOfRange(todayDate, minDate, maxDate)) {
      handlePick(todayDate);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      onChange('');
      setIsOpen(false);
      return;
    }

    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      openCalendar();
    }
  };

  const calendar = isOpen
    ? createPortal(
        <div
          ref={popoverRef}
          className={styles.popover}
          role="dialog"
          aria-label="Calendario"
          style={{ top: popoverPosition.top, left: popoverPosition.left }}
        >
          <div className={styles.popoverHeader}>
            <button
              type="button"
              className={styles.monthButton}
              onClick={() => moveMonth(-1)}
              aria-label="Mes anterior"
            >
              {'<'}
            </button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button
              type="button"
              className={styles.monthButton}
              onClick={() => moveMonth(1)}
              aria-label="Mes siguiente"
            >
              {'>'}
            </button>
          </div>

          <div className={styles.weekdays} aria-hidden="true">
            {WEEKDAYS.map(day => (
              <span key={day} className={styles.weekday}>
                {day}
              </span>
            ))}
          </div>

          <div className={styles.days}>
            {days.map(day => {
              const dayIso = toIsoDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              const isOutside = day.getMonth() !== visibleMonth.getMonth();
              const disabledDay = isOutOfRange(day, minDate, maxDate);

              return (
                <button
                  key={dayIso}
                  type="button"
                  className={[
                    styles.dayButton,
                    isOutside ? styles.dayOutside : '',
                    isToday ? styles.dayToday : '',
                    isSelected ? styles.daySelected : '',
                  ].join(' ')}
                  onClick={() => handlePick(day)}
                  disabled={disabledDay}
                  aria-pressed={isSelected}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className={styles.popoverFooter}>
            <button
              type="button"
              className={styles.todayButton}
              onClick={handleToday}
            >
              Hoy
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={styles.datePicker} ref={rootRef}>
      <input
        id={id}
        name={name}
        type="text"
        value={formatDisplayDate(value)}
        placeholder="dd/mm/aaaa"
        readOnly
        onClick={openCalendar}
        onFocus={openCalendar}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className={`${className} ${styles.dateInput}`.trim()}
        disabled={disabled}
        required={required}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        className={styles.calendarButton}
        onClick={openCalendar}
        disabled={disabled}
        aria-label="Abrir calendario"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <path d="M3 9h18" />
          <rect x="3" y="4" width="18" height="18" rx="2" />
        </svg>
      </button>
      {calendar}
    </div>
  );
}
