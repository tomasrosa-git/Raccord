import { z } from 'zod';

export const registroSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z
    .string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(30, 'El usuario no puede superar los 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede tener letras, números y guión bajo'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
