import { PAIRS } from '../context/AppContext';
import './PairSelector.css';

const DEFAULT_PAIRS = PAIRS;

export default function PairSelector({ value, onChange, pairs = DEFAULT_PAIRS }) {
  return (
    <div className="pair-selector">
      {pairs.map(pair => (
        <button
          key={pair}
          type="button"
          className={`pair-chip ${value === pair ? 'active' : ''}`}
          onClick={() => onChange(pair)}
        >
          {pair}
        </button>
      ))}
    </div>
  );
}
