import { PAIRS } from '../context/AppContext';
import './PairSelector.css';

const DEFAULT_PAIRS = PAIRS;

export default function PairSelector({ value, onChange, pairs = DEFAULT_PAIRS }) {
  return (
    <div className="pair-selector">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="pair-select"
      >
        <option value="">Sélectionner une paire...</option>
        {pairs.map(pair => (
          <option key={pair} value={pair}>{pair}</option>
        ))}
      </select>
    </div>
  );
}
