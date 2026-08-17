import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [form,setForm]=useState({email:'',password:''}); const [show,setShow]=useState(false); const [remember,setRemember]=useState(true); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const submit=async(e)=>{e.preventDefault();setError('');setBusy(true);try{await login({...form,remember});navigate(location.state?.from?.pathname||'/dashboard',{replace:true});}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <><Navbar publicPage/><div className="auth-page"><div className="auth-stack"><div className="auth-card"><div className="auth-header"><div className="auth-mark">ϟ</div><h1>Welcome back</h1><p>Sign in to your FitTrack account</p></div><div className="auth-divider"/>
    <form className="auth-form" onSubmit={submit}><label className="field"><span className="field-label">Email Address</span><div className="password-wrap"><input type="email" required placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><span className="field-hint">Enter the email address associated with your account</span></label>
      <label className="field"><span className="field-label" style={{display:'flex',justifyContent:'space-between'}}><span>Password</span><Link className="small auth-link" to="/forgot-password">Forgot password?</Link></span><div className="password-wrap"><input type={show?'text':'password'} required placeholder="Enter your password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><button type="button" className="password-toggle" onClick={()=>setShow(!show)} aria-label={show?'Hide password':'Show password'}><Icon name="eye" size={15}/></button></div></label>
      <label className="checkbox-row"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>Remember me for 30 days</span></label>
      {error&&<div className="alert" role="alert">{error}</div>}<button className="button button-dark button-full" disabled={busy}>{busy?'Signing in…':<><Icon name="logout" size={14}/> Sign In</>}</button>
    </form>
    {import.meta.env.DEV && <div className="demo-login"><div><strong>Demo account</strong><span>Use seeded sample data to explore the app.</span></div><button type="button" className="button button-outline" onClick={()=>{setForm({email:'demo@fittrack.local',password:'Demo123!'});setError('');}}>Use demo account</button></div>}
    <div className="auth-or">or continue with</div><div className="social-grid"><button className="button button-outline" type="button" disabled>G&nbsp; Google</button><button className="button button-outline" type="button" disabled>●&nbsp; Apple</button></div>
    <div className="auth-foot">Don't have an account? <Link className="auth-link" to="/register">Create free account</Link></div>
  </div><div className="security-note"><Icon name="shield" size={12}/> Secured with 256-bit SSL encryption. Your data is safe.</div><div className="annotation"><strong>Screen Annotations — SAD Documentation</strong>• Email field validates format on submit<br/>• Password field masks input; visibility toggle reveals text<br/>• Forgot password links to Account Recovery<br/>• Create account links to User Registration</div></div></div></>;
}
