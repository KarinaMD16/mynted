/**
 * Ilustración del gansito de mynted (public/goose-avatar.webp, copia de 128 px de goose.png), usada como avatar
 * en la píldora de cuenta del header. Es decorativa: el nombre de usuario
 * ya va como texto al lado, así que se oculta a lectores de pantalla.
 */
export function GooseAvatar({ className = '' }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}goose-avatar.webp`}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`object-contain ${className}`}
    />
  )
}
