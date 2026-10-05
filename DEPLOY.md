# Cómo desplegar la Ticketera a producción

Guía paso a paso, pensada para hacerlo una sola vez. Después de esto,
cada `git push` a `main` despliega solo.

## 1. Subir el código a GitHub

1. En [github.com](https://github.com/new), crea un repositorio nuevo
   (por ejemplo `ticketera`). Puede ser privado.
2. En **Settings → SSH and GPG keys → New SSH key** de tu cuenta de
   GitHub, pega la clave pública que te haya pasado Claude para esta
   máquina.
3. Conecta el repo local:
   ```bash
   git remote add origin git@github.com:TU-USUARIO/ticketera.git
   git push -u origin main
   ```

## 2. Crear el proyecto en Vercel

1. En [vercel.com](https://vercel.com/new), **Add New → Project** y
   elige el repositorio de GitHub que acabas de crear.
2. Vercel detecta Next.js solo — no hace falta tocar la configuración
   de build.
3. Todavía no le des a "Deploy": primero hay que cargar la base de
   datos y las variables de entorno (pasos siguientes). Si ya
   desplegaste, no pasa nada — solo va a fallar hasta que completes el
   paso 3.

## 3. Base de datos de producción

Recomendado: **Storage** (dentro del proyecto de Vercel) → **Create
Database** → Postgres. Se conecta solo y ya te arma la variable
`DATABASE_URL` en el proyecto — no hay que copiarla a mano.

Alternativas igual de válidas: [Neon](https://neon.tech) o
[Prisma Postgres](https://www.prisma.io/postgres) (creas la base ahí y
pegas la `DATABASE_URL` tú mismo en el paso 4).

## 4. Variables de entorno en Vercel

En **Settings → Environment Variables** del proyecto, agrega (con el
mismo nombre que en `.env.example`):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La da tu proveedor de base de datos (paso 3) |
| `GMAIL_USER` | La cuenta de Gmail desde la que se mandan los emails |
| `GMAIL_APP_PASSWORD` | Contraseña de aplicación generada en myaccount.google.com/apppasswords |
| `NEXT_PUBLIC_BASE_URL` | Tu URL de Vercel, ej: `https://ticketera-tunombre.vercel.app` |

`SHADOW_DATABASE_URL` **no** hace falta en producción, solo en tu
computadora para desarrollo.

## 5. Desplegar

Con las variables cargadas, **Deploy** (o haz un `git push` si ya
habías desplegado antes). Vercel va a:

1. Instalar dependencias y generar el cliente de Prisma.
2. Aplicar las migraciones contra la base de producción
   (`prisma migrate deploy` — nunca borra datos, solo aplica cambios
   nuevos de a uno).
3. Compilar y publicar el sitio.

## 6. Cargar el primer organizador

La base de producción arranca vacía (no corre el `seed` de desarrollo,
que es solo para probar). Para crear tu primera cuenta de organizador,
corre esto una vez desde tu computadora, apuntando a la base de
producción (la `DATABASE_URL` la copias desde Vercel → Storage → tu
base → `.env.local` tab, o desde tu proveedor si usaste otro):

```bash
DATABASE_URL="<la de producción>" npx tsx prisma/create-first-organizer.ts \
  "Nombre de tu negocio" "Tu nombre" "tu@email.com"
```

Te va a mostrar una contraseña generada, una sola vez — guárdala y
entra con esa cuenta en `/login`. Es seguro correrlo una sola vez: si
ya existe una organización, no hace nada (para no crear duplicados por
error). Si más adelante quieres otra cuenta de organizador, se hace
distinto — avísale a Claude, hoy esto no tiene pantalla propia porque
el MVP asume un solo organizador (ver `SPEC.md`).

## 7. Qué queda pendiente después de esto

- **Pagos**: el botón de "modo prueba" está desactivado en producción
  a propósito (ver `src/lib/orders.ts`). Hasta que conectes PayPhone,
  las compras quedan reservadas pero nadie puede "pagarlas" gratis.
- **Dominio propio**: opcional. En **Settings → Domains** del proyecto
  de Vercel puedes agregar el tuyo cuando quieras — no hace falta
  redesplegar nada.
- **Emails desde Gmail**: por ahora se mandan desde una cuenta de Gmail
  normal con contraseña de aplicación — funciona para el volumen de
  un evento, pero tiene límites diarios de Google. Cuando tengas un
  dominio propio, conviene pasar a un proveedor transaccional (Resend,
  SendGrid) para mejor entregabilidad y sin esos límites.
