'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    initialView?: 'login' | 'signup'
}

export default function AuthModal({ isOpen, onClose, initialView = 'signup' }: AuthModalProps) {
    const { signIn, signUp, error: authError, loading, clearError } = useAuth()
    const [view, setView] = useState<'login' | 'signup'>(initialView)
    const [isVisible, setIsVisible] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Form states
    const [signupData, setSignupData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        tradingExperience: 'Beginner',
        primaryFocus: 'Options Trading',
    })
    
    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    })

    useEffect(() => {
        if (isOpen) {
            console.log('AuthModal: Opening modal, view:', initialView)
            setIsMounted(true)
            // Small delay to trigger animation
            setTimeout(() => {
                console.log('AuthModal: Setting visible to true')
                setIsVisible(true)
            }, 10)
        } else {
            setIsVisible(false)
            // Wait for animation to complete before unmounting
            setTimeout(() => setIsMounted(false), 300)
        }
    }, [isOpen, initialView])

    useEffect(() => {
        setView(initialView)
    }, [initialView])

    // Clear errors when modal opens/closes or view changes
    useEffect(() => {
        if (isOpen) {
            setFormError(null)
            clearError()
        }
    }, [isOpen, view, clearError])

    // Display auth errors
    useEffect(() => {
        if (authError) {
            setFormError(authError)
        }
    }, [authError])

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        setIsSubmitting(true)

        // Validation
        if (signupData.password !== signupData.confirmPassword) {
            setFormError('Les mots de passe ne correspondent pas.')
            setIsSubmitting(false)
            return
        }

        if (signupData.password.length < 8) {
            setFormError('Le mot de passe doit contenir au moins 8 caractères.')
            setIsSubmitting(false)
            return
        }

        try {
            // Split name into firstName and lastName
            const nameParts = signupData.name.trim().split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''

            const result = await signUp(signupData.email, signupData.password, {
                firstName,
                lastName,
            })

            if (result.success) {
                // Show success message and switch to login
                setFormError(null)
                alert(result.message || 'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.')
                setView('login')
                // Reset form
                setSignupData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    tradingExperience: 'Beginner',
                    primaryFocus: 'Options Trading',
                })
            }
        } catch (err) {
            // Error is handled by auth context
            console.error('Signup error:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        setIsSubmitting(true)

        try {
            const result = await signIn(loginData.email, loginData.password, false)

            if (result.success) {
                // Close modal on successful login
                onClose()
                // Reset form
                setLoginData({
                    email: '',
                    password: '',
                    rememberMe: false,
                })
            }
        } catch (err) {
            // Error is handled by auth context
            console.error('Login error:', err)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isMounted) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="relative overflow-hidden rounded-3xl bg-neutral-900 ring-1 ring-white/10">
                        {/* Background gradient */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,.08),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(249,115,22,.08),transparent_45%)]"></div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-neutral-800/50 border border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 6L6 18"></path>
                                <path d="M6 6l12 12"></path>
                            </svg>
                        </button>

                        {/* Tabs */}
                        <div className="relative border-b border-white/10 flex">
                            <button
                                onClick={() => setView('login')}
                                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${view === 'login'
                                        ? 'text-white border-b-2 border-orange-500'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => setView('signup')}
                                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${view === 'signup'
                                        ? 'text-white border-b-2 border-orange-500'
                                        : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                            >
                                Sign up
                            </button>
                        </div>

                         <div className="relative">
                             {/* Error message */}
                             {formError && (
                                 <div className="mx-6 mt-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                     {formError}
                                 </div>
                             )}

                             {/* Form */}
                             {view === 'signup' ? (
                                 <form
                                     className="p-6 sm:p-10 space-y-4 min-h-[500px] flex flex-col"
                                     onSubmit={handleSignup}
                                 >
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                         <label className="block">
                                             <span className="text-sm text-neutral-300">Name</span>
                                             <input
                                                 type="text"
                                                 required
                                                 value={signupData.name}
                                                 onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                                                 className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 text-white placeholder:text-neutral-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                                 placeholder="John Doe"
                                             />
                                         </label>
                                         <label className="block">
                                             <span className="text-sm text-neutral-300">Email</span>
                                             <input
                                                 type="email"
                                                 required
                                                 value={signupData.email}
                                                 onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                                                 className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 text-white placeholder:text-neutral-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                                 placeholder="john@example.com"
                                             />
                                         </label>
                                     </div>

                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                         <label className="block">
                                             <span className="text-sm text-neutral-300">Password</span>
                                             <input
                                                 type="password"
                                                 required
                                                 value={signupData.password}
                                                 onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                                                 className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 text-white placeholder:text-neutral-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                                 placeholder="••••••••"
                                             />
                                         </label>
                                         <label className="block">
                                             <span className="text-sm text-neutral-300">Confirm Password</span>
                                             <input
                                                 type="password"
                                                 required
                                                 value={signupData.confirmPassword}
                                                 onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                                                 className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 text-white placeholder:text-neutral-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                                 placeholder="••••••••"
                                             />
                                         </label>
                                     </div>

                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                         <label className="block">
                                             <span className="text-sm text-neutral-300">Trading Experience</span>
                                             <select
                                                 value={signupData.tradingExperience}
                                                 onChange={(e) => setSignupData({ ...signupData, tradingExperience: e.target.value })}
                                                 className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                             >
                                                 <option className="bg-neutral-900">Beginner</option>
                                                 <option className="bg-neutral-900">Intermediate</option>
                                                 <option className="bg-neutral-900">Advanced</option>
                                                 <option className="bg-neutral-900">Professional</option>
                                             </select>
                                         </label>
                                         <label className="block">
                                             <span className="text-sm text-neutral-300">Primary Focus</span>
                                             <select
                                                 value={signupData.primaryFocus}
                                                 onChange={(e) => setSignupData({ ...signupData, primaryFocus: e.target.value })}
                                                 className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                                             >
                                                 <option className="bg-neutral-900">Options Trading</option>
                                                 <option className="bg-neutral-900">Stock Trading</option>
                                                 <option className="bg-neutral-900">Crypto</option>
                                                 <option className="bg-neutral-900">Forex</option>
                                             </select>
                                         </label>
                                     </div>

                                     <div className="flex-1"></div>

                                     <label className="mt-2 inline-flex items-start gap-3">
                                         <input
                                             type="checkbox"
                                             required
                                             className="mt-1 h-4 w-4 rounded border-white/20 bg-neutral-900 text-orange-500 focus:ring-orange-500/50"
                                         />
                                         <span className="text-xs text-neutral-400">
                                             I agree to receive product updates and market alerts.
                                         </span>
                                     </label>

                                     <div className="pt-2">
                                         <button
                                             type="submit"
                                             disabled={isSubmitting || loading}
                                             className="inline-flex items-center justify-center text-base font-medium text-white bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-600 rounded-full h-12 px-6 ring-1 ring-orange-400/30 shadow-[0_6px_24px_-8px_rgba(249,115,22,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                         >
                                             {isSubmitting || loading ? 'Inscription...' : 'Sign up'}
                                         </button>
                                     </div>
                                 </form>
                             ) : (
                                 <div className="flex items-center justify-center p-6 sm:p-10 min-h-[500px]">
                                     <form
                                         className="w-full max-w-md space-y-4 flex flex-col"
                                         onSubmit={handleLogin}
                                     >
                                         {/* Email */}
                                         <div>
                                             <label htmlFor="email" className="block text-sm text-neutral-300 mb-1.5">
                                                 Email
                                             </label>
                                             <div className="relative">
                                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                         <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                         <polyline points="22,6 12,13 2,6"></polyline>
                                                     </svg>
                                                 </div>
                                                 <input
                                                     id="email"
                                                     name="email"
                                                     type="email"
                                                     autoComplete="email"
                                                     required
                                                     value={loginData.email}
                                                     onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                     className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 text-white placeholder:text-neutral-500 px-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                                                     placeholder="you@example.com"
                                                 />
                                             </div>
                                         </div>

                                         {/* Password */}
                                         <div>
                                             <div className="flex items-center justify-between mb-1.5">
                                                 <label htmlFor="password" className="block text-sm text-neutral-300">
                                                     Password
                                                 </label>
                                                 <a href="#" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                                                     Forgot?
                                                 </a>
                                             </div>
                                             <div className="relative">
                                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                         <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                                                         <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
                                                     </svg>
                                                 </div>
                                                 <input
                                                     id="password"
                                                     name="password"
                                                     type="password"
                                                     autoComplete="current-password"
                                                     required
                                                     value={loginData.password}
                                                     onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                     className="mt-1 w-full rounded-lg bg-neutral-900 border border-white/10 text-white placeholder:text-neutral-500 px-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                                                     placeholder="••••••••"
                                                 />
                                             </div>
                                         </div>

                                         <div className="flex-1"></div>

                                         {/* Options */}
                                         <div className="flex items-center justify-between">
                                             <label className="inline-flex items-center gap-2">
                                                 <input
                                                     type="checkbox"
                                                     checked={loginData.rememberMe}
                                                     onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                                                     className="h-4 w-4 rounded border-white/20 bg-neutral-900 text-orange-500 focus:ring-orange-500/50"
                                                 />
                                                 <span className="text-xs text-neutral-400">Remember me</span>
                                             </label>
                                         </div>

                                         {/* Submit */}
                                         <div className="pt-2">
                                             <button
                                                 type="submit"
                                                 disabled={isSubmitting || loading}
                                                 className="w-full inline-flex items-center justify-center gap-2 text-base font-medium text-white bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-600 rounded-full h-12 px-6 ring-1 ring-orange-400/30 shadow-[0_6px_24px_-8px_rgba(249,115,22,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                             >
                                                 <svg
                                                     xmlns="http://www.w3.org/2000/svg"
                                                     width="16"
                                                     height="16"
                                                     viewBox="0 0 24 24"
                                                     fill="none"
                                                     stroke="currentColor"
                                                     strokeWidth="2"
                                                     strokeLinecap="round"
                                                     strokeLinejoin="round"
                                                 >
                                                     <path d="m10 17 5-5-5-5"></path>
                                                     <path d="M15 12H3"></path>
                                                     <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                                 </svg>
                                                 {isSubmitting || loading ? 'Connexion...' : 'Sign in'}
                                             </button>
                                         </div>

                                         {/* Divider */}
                                         <div className="relative py-1">
                                             <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                 <div className="w-full border-t border-white/10"></div>
                                             </div>
                                             <div className="relative flex justify-center">
                                                 <span className="bg-transparent px-2 text-[10px] uppercase tracking-wide text-neutral-500">or</span>
                                             </div>
                                         </div>

                                         {/* Provider - Google (disabled) */}
                                         <button
                                             type="button"
                                             disabled
                                             className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-500 bg-neutral-800/30 ring-1 ring-neutral-700/30 cursor-not-allowed opacity-50"
                                         >
                                             <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                             </svg>
                                             Continue with Google
                                         </button>

                                         {/* Footer */}
                                         <div className="pt-4 border-t border-white/10">
                                             <p className="text-xs text-center text-neutral-400">
                                                 Don't have an account?{' '}
                                                 <button
                                                     type="button"
                                                     onClick={() => setView('signup')}
                                                     className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
                                                 >
                                                     Sign up
                                                 </button>
                                             </p>
                                         </div>
                                     </form>
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            </div>
        </>
    )
}

