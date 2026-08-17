export default function Input({ label, hint, error, ...props }) {
  return <label className="field"><span className="field-label">{label}</span><input {...props} />{hint && !error && <span className="field-hint">{hint}</span>}{error && <span className="field-error">{error}</span>}</label>;
}
