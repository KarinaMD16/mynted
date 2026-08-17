# MYNTED

**MYNTED** es una plataforma para coleccionistas de nicho. Conecta personas que siguen una misma franquicia (anime, cómics, juguetes, cartas, videojuegos, etc.) para que puedan intercambiar y vender objetos de colección, conversar en foros dedicados y organizar encuentros o actividades cerca de ellos, todo dentro de comunidades verificadas y exclusivas por franquicia.

## El problema

Conseguir figuras u objetos de colección de nicho suele ser difícil: el mercado es reducido, disperso y muchas veces poco confiable. Además, encontrar gente con quien hablar de esos mismos gustos —y que entienda los estándares de calidad que le importan a un coleccionista— no es sencillo en redes sociales generalistas.

## La solución

Un sistema de registro para coleccionistas donde cada usuario puede seguir o unirse a comunidades dedicadas a una franquicia específica. Dentro de cada comunidad es posible:

- Publicar objetos para venderlos o intercambiarlos (marketplace).
- Participar en un foro de conversación propio de esa franquicia.
- Proponer o descubrir eventos y actividades cerca del usuario.
- Contactar directamente a un vendedor mediante chat 1 a 1 vinculado al producto.

## Modelo de negocio

- Comisión por venta realizada dentro del marketplace.
- Pago por registro/verificación de perfil (por ejemplo, verificación de vendedor).
- Publicidad dentro de la app.

## Módulos principales

| Módulo | Descripción |
|---|---|
| **Gestión de usuarios** | Registro, login (incluye social login), perfiles por comunidad, activación de rol vendedor, moderadores por comunidad. |
| **Comunidades** | Creación y administración de comunidades por franquicia, membresía, reglas, moderación, recomendaciones. |
| **Marketplace** | Publicación de productos (venta/intercambio), búsqueda y filtros, favoritos, chat con vendedor, reportes, transacciones simuladas. |
| **Foro** | Publicaciones e hilos por comunidad, comentarios anidados, votos, notificaciones, moderación. |

Reglas de negocio clave: un usuario puede tener varios perfiles (uno por comunidad); los roles de vendedor y moderador se otorgan a nivel de perfil, no de forma global; cada producto requiere exactamente 3 tags y cada comunidad entre 1 y 3 tags más una categoría.

## Stack técnico

> Completa esta sección con las tecnologías definitivas del proyecto.

- **Frontend:** React
- **Backend:** _por definir_
- **Base de datos:** _por definir_

## Estructura del repositorio

```
mynted/
├── src/            # código fuente de la app React
├── public/
├── package.json
└── README.md
```

## Cómo correr el proyecto

```bash
# Instalar dependencias
npm install

# Levantar el ambiente de desarrollo
npm start        # Create React App
# o
npm run dev       # Vite
```

## Roadmap

El desarrollo está organizado en sprints semanales (Semana 6 a Semana 16) siguiendo el backlog en Jira, cubriendo primero el backend y frontend de Gestión de Usuarios, luego Comunidades, y finalmente Marketplace y Foro en paralelo. Ver el backlog completo del proyecto para el detalle historia por historia.

## Autoría

Proyecto desarrollado por Karina — 2026.