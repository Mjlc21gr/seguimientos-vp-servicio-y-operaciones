# Seguimientos VP Servicio y Operaciones

Sistema de gestión de tareas y seguimientos para la VP de Servicio y Operaciones. Conectado a Google Sheets como base de datos y con notificaciones por correo electrónico.

## Stack

- **Runtime**: Node.js 20
- **Frontend**: React 19 + Tailwind CSS 4 + Vite
- **Backend**: Express 4 (TypeScript)
- **Base de datos**: Google Sheets API v4
- **Correo**: Nodemailer (SMTP Gmail)
- **Deploy**: Google Cloud Run

## Funcionalidades

- Login con usuarios almacenados en Google Sheets (pestaña "Usuarios")
- CRUD de tareas sincronizado con Google Sheets (pestaña "Tareas")
- Notificaciones por correo al asignar tareas
- Recordatorios automáticos (cron) a 2 días y el día de vencimiento
- Dashboard con estadísticas en tiempo real
- Roles: admin (gestión completa) y gestor (solo sus tareas)

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Ejecutar en modo desarrollo
npm run dev
```

La app estará disponible en `http://localhost:8080`.

## Deploy a Cloud Run

### Prerrequisitos

1. Tener `gcloud` CLI instalado y autenticado
2. Proyecto GCP: `fifth-audio-423920-g2`
3. Cuenta de servicio con acceso a Google Sheets

### Deploy manual con gcloud

```bash
# Autenticarse
gcloud auth login
gcloud config set project fifth-audio-423920-g2

# Build y deploy directo
gcloud run deploy seguimientos-vp \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "GOOGLE_SERVICE_ACCOUNT_EMAIL=data-cls-dim-asignacion@fifth-audio-423920-g2.iam.gserviceaccount.com" \
  --set-env-vars "GOOGLE_SPREADSHEET_ID=1MsSVQ9694qRisT5URamzgGFq8KPA949KP5S7E3O6DFU" \
  --set-env-vars "GOOGLE_SHEET_NAME=Tareas" \
  --set-env-vars "SMTP_USER=tu-correo@gmail.com" \
  --set-env-vars "SMTP_PASS=tu-app-password" \
  --set-env-vars "SMTP_FROM_NAME=Seguimientos VP - Admin" \
  --set-env-vars "GOOGLE_PRIVATE_KEY=<valor-de-private-key>"
```

### Deploy con Cloud Build (CI/CD)

```bash
gcloud builds submit --config cloudbuild.yaml
```

> **Nota**: Las variables sensibles (GOOGLE_PRIVATE_KEY, SMTP_PASS) deben configurarse como secretos en Cloud Run o Secret Manager.

### Configurar secretos con Secret Manager (recomendado)

```bash
# Crear secretos
echo -n "tu-private-key" | gcloud secrets create google-private-key --data-file=-
echo -n "tu-smtp-pass" | gcloud secrets create smtp-pass --data-file=-

# Dar acceso a la cuenta de servicio de Cloud Run
gcloud secrets add-iam-policy-binding google-private-key \
  --member="serviceAccount:YOUR-COMPUTE-SA@fifth-audio-423920-g2.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Actualizar el servicio para usar secretos
gcloud run services update seguimientos-vp \
  --region us-central1 \
  --set-secrets "GOOGLE_PRIVATE_KEY=google-private-key:latest,SMTP_PASS=smtp-pass:latest"
```

## Google Sheets

- **Spreadsheet**: [Link](https://docs.google.com/spreadsheets/d/1MsSVQ9694qRisT5URamzgGFq8KPA949KP5S7E3O6DFU/edit)
- **Pestaña Tareas**: Columnas A-I (Fecha Asignación, Fecha Gestión, Fecha Compromiso, Tarea, Responsable, Observaciones, Comentarios Gerente, Estado, Tipo)
- **Pestaña Usuarios**: Columnas A-D (Nombre, Email, Rol, Password)

## Cuenta de servicio

- **Email**: `data-cls-dim-asignacion@fifth-audio-423920-g2.iam.gserviceaccount.com`
- **Proyecto GCP**: `fifth-audio-423920-g2`
- La cuenta de servicio debe tener permisos de Editor en el Google Sheet.
