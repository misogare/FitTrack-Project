export default function Button({ children, variant = 'dark', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}
