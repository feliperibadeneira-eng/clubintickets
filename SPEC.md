# Ticketera — Especificación del proyecto

> Este documento resume todo lo que conversamos. Léelo con calma, y si algo no
> te cierra o querés cambiar algo, decímelo antes de que empecemos a
> programar. Una vez que lo apruebes, es el mapa que vamos a seguir.

---

## 1. Qué estamos construyendo

Una aplicación web para vender entradas a fiestas/eventos. Vos sos el
organizador (por ahora el único), vendés entradas de distintos tipos y
precios, el comprador recibe su entrada por email y también puede verla en
una página web, y en la puerta tu staff la valida escaneando un código QR
desde el celular.

El sistema se diseña desde el día uno pensando en que en el futuro vas a
tener **varias discotecas y varios organizadores** usando la misma
plataforma, aunque el MVP (primera versión) solo lo uses vos para un evento
o varios eventos tuyos en simultáneo.

---

## 2. Quiénes usan el sistema (roles)

| Rol | Qué hace |
|---|---|
| **Comprador** | Entra a la web, elige entradas, paga, recibe su entrada por email y puede verla online. No necesita crear cuenta ni contraseña. |
| **Organizador (vos)** | Crea eventos, define tipos de entrada y precios, ve ventas en tiempo real, ve la lista de asistentes, gestiona reembolsos manuales. |
| **Staff de puerta** | Tiene su propio usuario y contraseña. Entra a una app de escaneo desde su celular y valida entradas la noche del evento. |

Cada uno de estos roles va a tener una pantalla distinta, pensada para lo que
necesita hacer — el comprador no ve nada de "administración", el staff de
puerta solo ve la cámara para escanear.

---

## 3. Cómo se ve desde afuera (flujos)

### 3.1 Flujo del comprador
1. Entra a la página del evento (algo simple: nombre del evento, fecha,
   lugar, tipos de entrada disponibles — sin diseño tipo "landing page" de
   marketing, algo funcional).
2. Elige tipo de entrada (General, VIP, Early bird, combo, etc.) y cantidad.
3. Completa sus datos: **nombre completo y cédula/DNI por cada entrada**
   (porque las entradas son nominativas — ver sección 6).
4. Paga con tarjeta u otro método disponible.
5. Recibe un email con:
   - Un PDF o imagen por cada entrada, con su nombre y un código QR único.
   - Un link a una página web donde puede volver a ver su entrada cuando
     quiera (por si borra el email).

### 3.2 Flujo del organizador (vos)
1. Entrás con tu usuario y contraseña a un panel de administración.
2. Creás un evento: nombre, fecha, lugar, tipos de entrada y precios.
3. Mientras se vende, ves en tiempo real: cuánto vendiste, cuánto dinero
   entró, cuántas entradas quedan de cada tipo.
4. Tenés la lista completa de asistentes (nombre, cédula, tipo de entrada,
   si ya ingresó o no).
5. La noche del evento, ves en vivo quién va entrando (control de acceso en
   vivo), útil si tenés varias personas escaneando a la vez.
6. Si alguien pide un reembolso, vos lo marcás manualmente en el sistema
   (el sistema no procesa devoluciones de dinero automáticamente — ver
   sección 7).

### 3.3 Flujo del staff en la puerta
1. Cada persona del staff tiene su propio usuario y contraseña (así sabés
   quién escaneó qué, y si alguien deja de trabajar para vos le sacás el
   acceso sin afectar a los demás).
2. Entra desde el navegador de su celular (no hace falta instalar una app
   de una tienda de aplicaciones) a una pantalla simple con la cámara
   activada.
3. Escanea el QR de la entrada:
   - **Verde / válida:** muestra el nombre de la persona, tipo de entrada, y
     la marca como "usada".
   - **Rojo / ya usada:** muestra cuándo y con qué dispositivo se escaneó
     antes, para detectar entradas duplicadas o compartidas.
   - **Rojo / no válida:** QR que no corresponde a ninguna entrada de ese
     evento.

---

## 4. Tipos de entrada y precios

- Vas a poder crear varios tipos de entrada por evento: **General, VIP,
  Early bird, combos/grupales**, cada uno con su propio precio y cantidad
  disponible.
- Sobre cómo suben los precios con el tiempo, mi recomendación para el MVP
  es: **tandas automáticas por fecha**. Vos configurás, por ejemplo,
  "Entrada General — Tanda 1: $10 hasta el 1 de agosto", "Tanda 2: $15 hasta
  el 15 de agosto", etc., y el sistema cambia el precio solo cuando llega la
  fecha, sin que tengas que estar pendiente.
  - Es más simple de construir y de entender que "subir el precio según
    cuántas se vendieron", y cubre el caso de early bird que mencionaste.
  - Si más adelante también querés tandas por cantidad vendida (ej: "las
    primeras 100"), se puede agregar después sin rehacer el modelo de datos,
    porque ambas son solo distintas condiciones para pasar de una tanda a la
    siguiente.

---

## 5. Pago

Me confirmaste que estás en **Ecuador**. Este dato cambia la recomendación:

- **Mercado Pago no opera en Ecuador** como pasarela de pago (solo está
  disponible en Argentina, Brasil, México, Chile, Colombia, Uruguay y Perú).
- **Stripe** tampoco permite crear una cuenta de cobro directamente para
  negocios radicados en Ecuador.
- Las opciones que sí funcionan bien en Ecuador y son las que usan otras
  ticketeras y negocios locales son:
  - **PayPhone** — muy usado específicamente para venta de entradas/eventos
    en Ecuador, soporta tarjetas y es rápido de integrar.
  - **Kushki** — pasarela de pago con operación fuerte en Ecuador y también
    en Colombia, Chile, México y Perú (esto es una ventaja pensando en que
    a futuro quieras vender en otros países).
  - **PlaceToPay** — otra alternativa usada en Ecuador, algo más orientada a
    empresas medianas/grandes.

**Mi recomendación: empezar con PayPhone** por ser la más simple de integrar
y la más usada puntualmente para eventos en Ecuador. *(Verificado el
21/07/2026: Mercado Pago sigue sin operar como pasarela de cobro para
negocios en Ecuador — su documentación oficial solo soporta Argentina,
Brasil, México, Chile, Colombia, Perú y Uruguay. PayPhone cobra 5% + IVA
por transacción con liquidación semanal. Decisión confirmada: PayPhone.)* Como vas a crecer a
otros países/organizadores, voy a construir la parte de pagos de forma que
sea fácil agregar otra pasarela después (por ejemplo Kushki si vendés en
Colombia) sin tener que rehacer todo el sistema de ventas.

Los precios y pagos van a estar en **USD**, la moneda oficial de Ecuador.

---

## 6. Entradas y seguridad del QR

- Las entradas son **nominativas**: piden nombre completo y cédula al
  comprar, lo que ayuda a evitar reventa y da más control en la puerta.
- Cada entrada tiene un código único generado al azar (no un número
  correlativo fácil de adivinar), para que nadie pueda "inventar" un QR
  válido.
- La validación en la puerta siempre se revisa contra el sistema central
  (no alcanza con que la app del staff "vea" el QR con la cámara — se
  confirma online), así dos personas con el mismo QR no pueden entrar las
  dos, sin importar cuántos celulares del staff estén escaneando al mismo
  tiempo.

---

## 7. Casos límite que vamos a manejar

- **Dos personas comprando la última entrada al mismo tiempo:** cuando
  alguien empieza a pagar, el sistema "reserva" esa entrada por unos
  minutos. Si el pago no se completa en ese tiempo, la reserva se libera y
  otra persona puede comprarla. Esto evita vender dos veces la misma
  entrada.
- **QR duplicado o reutilizado:** la primera vez que se escanea válidamente,
  queda marcada como usada. Cualquier intento posterior muestra una
  alerta clara con la hora y el dispositivo del primer ingreso.
- **Reembolsos:** el organizador los gestiona manualmente, caso por caso
  (el sistema no tiene un flujo automático de "pedir reembolso" para el
  comprador en esta versión).
- **Venta 100% online:** no se contempla venta en efectivo en la puerta
  para el MVP.

---

## 8. El panel del organizador va a mostrar

- Ventas totales y en tiempo real (dinero recaudado, entradas vendidas por
  tipo, entradas restantes).
- Lista completa de asistentes con estado de ingreso.
- Control de acceso en vivo la noche del evento.
- (Nota: exportar a Excel/CSV no lo pediste explícitamente pero es casi
  gratis de agregar dado que ya vamos a tener la lista de asistentes — te
  lo voy a incluir salvo que prefieras que no.)

---

## 9. El modelo de datos (pensado para crecer)

Aunque hoy solo vos vas a usar el sistema, estructuro los datos así para que
mañana se sumen más discotecas y más organizadores sin rehacer nada:

- **Organización** — la empresa/organizador dueño de la cuenta (hoy: vos).
- **Local/Discoteca** (Venue) — un lugar físico, pertenece a una
  Organización. Una Organización puede tener varios Locales.
- **Evento** — una fiesta puntual, pertenece a un Local y a una
  Organización. Tiene fecha, hora, y varios Tipos de Entrada.
- **Tipo de Entrada** — General, VIP, Early bird, etc. Pertenece a un
  Evento. Tiene sus propias Tandas de Precio.
- **Tanda de Precio** — precio y fecha de vigencia de un Tipo de Entrada
  (para el pricing por tandas de la sección 4).
- **Orden de Compra** — un pago, con los datos del comprador y el detalle de
  qué compró.
- **Entrada** — cada entrada individual (nominativa, con su QR único),
  vinculada a una Orden de Compra y a un Tipo de Entrada. Tiene estado:
  válida / usada / reembolsada.
- **Usuario** — cuentas con contraseña: puede ser Organizador (administra
  todo) o Staff de puerta (solo escanea). Pertenece a una Organización.
- **Registro de Ingreso** (Check-in log) — cada escaneo que se intenta,
  quién lo hizo, cuándo, y si fue aceptado o rechazado. Sirve para el
  control de acceso en vivo y para auditar entradas duplicadas.

Este esquema es el que permite, el día que quieras sumar otro organizador
con sus propias discotecas y eventos, simplemente crear una nueva
Organización — sin tocar el código, solo agregando datos.

---

## 10. Qué tecnologías voy a usar y por qué (sin jerga)

Pensá en la aplicación como si tuviera tres partes: lo que ve el usuario en
el navegador, el "cerebro" que procesa las reglas (pagos, stock, QR), y el
lugar donde se guardan los datos.

- **Next.js** (con React): es el framework con el que voy a construir tanto
  las pantallas (lo que ves en el navegador) como la lógica de atrás, en un
  solo proyecto. Lo elijo porque es el más usado y documentado hoy en día,
  lo que significa que si en el futuro necesitás que otro programador
  continúe el proyecto, va a ser fácil encontrar ayuda.
- **Base de datos PostgreSQL**: es donde se guardan todos los datos
  (eventos, entradas, ventas). La elijo porque maneja muy bien situaciones
  como "dos personas comprando al mismo tiempo" sin vender dos veces la
  misma entrada — es un punto fuerte suyo, justo lo que necesitamos.
- **Prisma**: es una herramienta que hace más simple y segura la
  comunicación entre el código y la base de datos (evita errores comunes y
  hace más fácil hacer cambios al modelo de datos más adelante).
- **PayPhone** (o similar) para procesar los pagos, como se explicó en la
  sección 5, construido de forma que se pueda agregar otra pasarela después
  sin rehacer todo.
- **Resend** (o similar) para el envío de los emails con la entrada en PDF/QR.
- **Vercel**: el servicio donde va a "vivir" la aplicación en internet
  (hosting). Lo elijo porque se integra directamente con Next.js, tiene un
  plan gratuito que alcanza de sobra para empezar, y no requiere que
  administres servidores vos mismo.
- La app de escaneo para el staff va a funcionar **directamente desde el
  navegador del celular** (no una app de tienda de aplicaciones), usando la
  cámara del teléfono. Esto evita el proceso de publicar una app en Google
  Play / App Store, que es lento y no aporta nada en este caso.

---

## 11. Qué NO incluye esta primera versión (para que no haya sorpresas)

- No hay venta en efectivo/presencial, solo online.
- No hay reembolsos automáticos, solo manuales.
- No hay página de marketing elaborada por evento (imágenes grandes,
  video, etc.), sino algo simple y funcional.
- No hay todavía un panel para que "otros organizadores" se registren solos
  — eso lo dejamos preparado en el modelo de datos, pero la parte de
  "autoservicio" para nuevos organizadores es una fase futura.
- No hay reventa ni transferencia de entradas entre personas en esta
  versión (la entrada queda a nombre de quien la compró).

---

## 12. Próximos pasos

1. Leés este documento y me decís qué cambiarías, si algo no te cierra, o
   si di por sentado algo que no corresponde.
2. Ajustamos lo que haga falta.
3. Una vez aprobado, empezamos a programar — primero la base (modelo de
   datos y creación de eventos), después compra y pago, después QR y
   escaneo, y al final el panel de control en tiempo real.
