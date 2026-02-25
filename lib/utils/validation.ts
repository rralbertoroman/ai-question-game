import { z } from 'zod';

/**
 * Registration form validation schema
 */
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario debe tener como máximo 20 caracteres')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'El nombre de usuario solo puede contener letras, números y guiones bajos'
    ),
  email: z
    .string()
    .email('Dirección de correo electrónico inválida')
    .max(255, 'El correo electrónico es demasiado largo'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(255, 'La contraseña es demasiado larga'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const submitAnswerSchema = z.object({
  answerIndex: z.number().int().min(0).max(3),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
