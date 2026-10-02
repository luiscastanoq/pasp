import styles from './ScoreSelector.module.css';

interface ScoreSelectorProps {
  value: number | null;
  onChange: (val: number) => void;
  disabled?: boolean;
  id?: string;
}

export const ScoreSelector = ({
  value,
  onChange,
  disabled = false,
  id,
}: ScoreSelectorProps) => {
  return (
    <div className={styles.scoreSelector} id={id} role="group">
      {[1, 2, 3, 4, 5].map(num => (
        <button
          key={num}
          type="button"
          disabled={disabled}
          onClick={() => onChange(num)}
          className={`${styles.scoreSelectorBtn}${value === num ? ` ${styles.scoreSelectorBtnActive}` : ''}`}
          aria-pressed={value === num}
          aria-label={`Puntuación ${num}`}
        >
          {num}
        </button>
      ))}
    </div>
  );
};
