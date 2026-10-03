export function authErrorMessage(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause);

  if (/invalid login credentials/i.test(message)) return 'El correo o la contraseña no son correctos.';
  if (/email not confirmed/i.test(message)) return 'Confirma tu correo antes de iniciar sesión.';
  if (/user already registered/i.test(message)) return 'Ya existe una cuenta con este correo.';
  if (/password/i.test(message) && /characters|weak|short/i.test(message)) {
    return 'La contraseña no cumple los requisitos de seguridad.';
  }
  if (/username/i.test(message) && /duplicate|unique/i.test(message)) {
    return 'Ese nombre de usuario ya está ocupado.';
  }

  return message || 'No fue posible completar la operación.';
}
