import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, PenLine, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.login(data as import('../types').LoginRequest)
      setAuth(res.token, res.role)
      toast.success('Добро пожаловать!')
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-8 shadow-2xl shadow-black/40 fade-in">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30">
          <PenLine size={26} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Stationery</h1>
        <p className="text-sm text-slate-400 mt-1">Административная панель</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="label-base">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="admin@stationery.ru"
            className="input-base"
            autoComplete="email"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label-base">Пароль</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input-base pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-2.5 mt-2"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Вход...</>
          ) : (
            'Войти'
          )}
        </button>
      </form>

      <p className="text-center text-xs text-slate-600 mt-6">
        Stationery Admin Panel © 2024
      </p>
    </div>
  )
}
