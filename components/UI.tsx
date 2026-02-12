import React, { useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean, variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }> = ({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-brand-primary text-white hover:bg-brand-primaryHover shadow-md shadow-indigo-200/50",
    secondary: "bg-brand-surface text-brand-text-heading border border-slate-200 hover:bg-brand-secondaryHover shadow-sm",
    ghost: "text-brand-text-body hover:bg-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', type = "text", ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-brand-text-heading mb-1">{label}</label>}
      <div className="relative">
        <input 
          type={inputType}
          className={`w-full px-4 py-2 bg-brand-surface/50 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all ${className}`} 
          {...props} 
        />
        {isPassword && (
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

export const ColorInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
    <div className="flex flex-col items-center gap-1">
        <div className="relative overflow-hidden w-12 h-12 rounded-full shadow-sm border border-slate-200 cursor-pointer transition-transform hover:scale-110">
            <input 
                type="color" 
                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0" 
                {...props} 
            />
        </div>
        {label && <span className="text-[10px] font-mono text-brand-text-muted uppercase truncate max-w-[60px]">{label}</span>}
    </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-brand-text-heading mb-1">{label}</label>}
    <textarea 
      className={`w-full px-4 py-2 bg-brand-surface/50 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all ${className}`} 
      {...props} 
    />
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string, action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-brand-surface border border-white/60 shadow-lg shadow-slate-200/50 rounded-2xl p-6 ${className}`}>
    <div className="flex justify-between items-center mb-4">
        {title && <h3 className="text-lg font-semibold text-brand-text-heading">{title}</h3>}
        {action && <div>{action}</div>}
    </div>
    {children}
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, options: {value: string, label: string}[] }> = ({ label, options, className = '', ...props }) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-brand-text-heading mb-1">{label}</label>}
      <div className="relative">
        <select 
          className={`w-full px-4 py-2 appearance-none bg-brand-surface/50 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all ${className}`}
          {...props}
        >
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
