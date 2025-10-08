# Nata Fisio

Aplicación web ligera para que un centro de fisioterapia pueda agendar terapias, registrar pagos y recibir confirmaciones de asistencia de los pacientes. Está pensada para desplegarse en [Vercel](https://vercel.com/) usando funciones serverless y una base de datos Postgres gestionada por Vercel.

## Arquitectura

```
.
├── api/                 # Funciones serverless (Node.js) desplegadas en Vercel
│   ├── _lib/db.js       # Configuración y creación del esquema en Postgres
│   └── sessions/...     # Endpoints para gestionar las sesiones
├── frontend/            # Sitio estático que se sirve desde Vercel
│   ├── index.html       # Panel unificado para fisioterapeuta y pacientes
│   ├── app.js           # Lógica de interacción con las APIs serverless
│   └── style.css        # Estilos responsivos
├── package.json         # Dependencias necesarias para las funciones serverless
└── vercel.json          # Reescrituras para servir el frontend desde `/`
```

- **Frontend:** HTML/CSS/JS sin frameworks, consume las rutas `/api` expuestas por Vercel.
- **Backend:** funciones serverless de Node.js que usan [`@vercel/postgres`](https://vercel.com/docs/storage/vercel-postgres) para conectarse a una base de datos Postgres administrada por Vercel (o por Neon si usas el plan gratuito).
- **Base de datos:** se crea automáticamente la primera vez que llamas a una API; solo necesitas configurar las credenciales mediante variables de entorno.

## Configuración local

1. Instala dependencias (solo necesitas Node 18+):

   ```bash
   npm install
   ```

2. Crea un archivo `.env.local` en la raíz con la cadena de conexión. Si usas [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres/quickstart), puedes generar las variables desde el panel de tu proyecto.

   ```dotenv
   POSTGRES_URL="postgres://usuario:password@host:port/database"
   POSTGRES_PRISMA_URL="${POSTGRES_URL}"
   POSTGRES_URL_NO_SSL="${POSTGRES_URL}"
   POSTGRES_URL_NON_POOLING="${POSTGRES_URL}"
   ```

   > Para desarrollo puedes usar una instancia local de Postgres o un servicio gratuito como [Neon](https://neon.tech/).

3. Ejecuta las funciones localmente con la CLI de Vercel (opcional):

   ```bash
   npx vercel dev
   ```

   El sitio estático estará disponible en `http://localhost:3000` y consumirá las rutas serverless desde el mismo origen (`http://localhost:3000/api/...`).

Si no quieres instalar la CLI de Vercel, también puedes usar [`npm install -g vercel`](https://vercel.com/docs/cli) y luego `vercel dev`.

## Despliegue en Vercel

1. Crea un proyecto nuevo en Vercel apuntando a este repositorio.
2. En la sección **Storage → Postgres** crea una base de datos (plan gratuito disponible) y enlázala al proyecto.
3. Vercel añadirá automáticamente las variables de entorno `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NO_SSL` y `POSTGRES_URL_NON_POOLING`. Verifica que estén presentes en **Settings → Environment Variables**.
4. Pulsa **Deploy**. Vercel detectará el proyecto como "Otros" y servirá `frontend/index.html` gracias a `vercel.json`. Las funciones en `api/` quedarán disponibles inmediatamente.

> La primera invocación a cualquier endpoint creará las tablas `patients` y `sessions` si no existen, por lo que no necesitas ejecutar migraciones manuales.

## Endpoints disponibles

Las rutas siguen el mismo contrato que la interfaz web:

- `GET /api/patients` — Lista los pacientes registrados.
- `POST /api/patients` — Crea un nuevo paciente (`full_name` es obligatorio).
- `GET /api/sessions` — Devuelve todas las sesiones junto con datos del paciente.
- `POST /api/sessions` — Agenda una sesión (requiere `patient_id`, `scheduled_at`, `duration_minutes`, `therapy_type`, `therapist_name`).
- `PATCH /api/sessions/{id}` — Actualiza campos de pago o estado.
- `DELETE /api/sessions/{id}` — Elimina una sesión.
- `POST /api/sessions/{id}/confirm` — Registra la confirmación del paciente.
- `POST /api/sessions/{id}/complete` — Marca la sesión como completada.

## Cómo validar el proyecto con Git

1. Revisa el estado del repositorio:

   ```bash
   git status
   ```

2. Añade los archivos que quieras subir al commit. Para incluir todos los cambios:

   ```bash
   git add .
   ```

3. Crea un commit descriptivo:

   ```bash
   git commit -m "Preparar proyecto para revisión"
   ```

4. Configura el remoto `origin` si todavía no lo hiciste:

   ```bash
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   ```

5. Sube la rama al repositorio remoto:

   ```bash
   git push origin main
   ```

Con esto el proyecto queda listo para abrir un Pull Request o ejecutar los checks configurados en GitHub.

## Próximos pasos sugeridos

- Añadir autenticación y separación de paneles por rol.
- Integrar notificaciones (correo, WhatsApp) para recordatorios de sesión.
- Generar reportes de facturación por rango de fechas.
- Publicar una app móvil o PWA para pacientes.
