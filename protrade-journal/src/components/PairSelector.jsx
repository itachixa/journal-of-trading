import { PAIRS } from '../context/AppContext';
import './PairSelector.css';

const DEFAULT_PAIRS = PAIRS;

export default function PairSelector({ value, onChange, pairs = DEFAULT_PAIRS }) {
  // Ensure current value is in options even if not in pairs list
  const options = pairs.includes(value) ? pairs : [value, ...pairs];
  return (
    <div className="pair-selector">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="pair-select"
      >
        <option value="">Sélectionner une paire...</option>
        {options.map(pair => (
          <option key={pair} value={pair}>{pair}</option>
        ))}
      </select>
    </div>
  );
}
