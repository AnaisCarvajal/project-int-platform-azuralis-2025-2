# R2 Security Configuration Guide

## Protecciones implementadas en Cloudflare R2

Este documento describe cómo configurar Cloudflare R2 para proteger contra uploads excesivos y facturación inesperada.

## 🔐 Configuraciones necesarias

### 1. Bucket Policy (Política de Acceso)

**Archivo**: `r2-bucket-policy.json`

Restricciones implementadas:
- ✅ Solo presigned URLs pueden subir archivos
- ✅ Bloquea uploads directos sin autenticación
- ✅ Limita a 50MB por archivo (52428800 bytes)
- ✅ Solo el backend (r2-user) tiene acceso completo

**Cómo aplicar en Cloudflare:**
1. Ve a R2 → Bucket → `famed-azuralis` → Settings → Bucket Policies
2. Copia el contenido de `r2-bucket-policy.json`
3. Reemplaza `ACCOUNT_ID` con tu ID de cuenta de Cloudflare
4. Reemplaza `tu-dominio-frontend.com` con tu dominio real
5. Aplica la política

### 2. CORS Configuration

**Archivo**: `r2-cors.json`

Configuración:
- ✅ Solo permite GET, PUT, HEAD
- ✅ Restringido a tu dominio (no wildcard)
- ✅ Expira presigned URLs cada 1 hora
- ✅ Solo headers necesarios permitidos

**Cómo aplicar en Cloudflare:**
1. Ve a R2 → Bucket → `famed-azuralis` → Settings → CORS
2. Copia el contenido de `r2-cors.json`
3. Reemplaza `https://tu-dominio-frontend.com` con tu URL real
4. Aplica la configuración

### 3. Lifecycle Rules

**Archivo**: `r2-lifecycle-rules.json`

Reglas de ciclo de vida:
- ✅ **DeleteMultipartUploads**: Elimina uploads incompletos después de 1 día
- ✅ **DeleteOldVersions**: Elimina versiones antiguas después de 30 días
- ✅ **ArchiveOldDocuments**: Archiva documentos después de 90 días (reducción de costos)
- ✅ **DeleteVeryOldDocuments**: Elimina documentos después de 365 días

**Cómo aplicar en Cloudflare:**
1. Ve a R2 → Bucket → `famed-azuralis` → Lifecycle Rules
2. Copia el contenido de `r2-lifecycle-rules.json`
3. Revisa y ajusta los días según políticas médicas
4. Aplica las reglas

---

## 🛡️ Capas de protección implementadas

### Backend (NestJS)
- ✅ Throttle: 20 uploads/hora por usuario
- ✅ Validación: PDF, JPEG, PNG, DICOM
- ✅ Límite de archivo: 50MB
- ✅ Email verification requerida
- ✅ Cuota: 500MB por usuario
- ✅ Presigned URLs: expiración 5 minutos

### R2 (Cloudflare)
- ✅ Bucket policy: bloquea uploads directos
- ✅ CORS: solo presigned URLs
- ✅ Size limit: 50MB en el bucket
- ✅ Lifecycle: limpia archivos viejos
- ✅ Multipart: limpia uploads incompletos

### Base de datos (Supabase)
- ✅ user_storage_quota: tracking de uso
- ✅ increment_storage(): verifica límite antes de confirmar
- ✅ decrement_storage(): actualiza al eliminar

---

## 📝 Notas importantes

1. **Reemplaza placeholders:**
   - `famed-azuralis` → Tu nombre de bucket
   - `ACCOUNT_ID` → Tu ID de Cloudflare
   - `https://tu-dominio-frontend.com` → Tu URL real

2. **Período de retención:**
   - Ajusta los días (90, 365) según requisitos médicos/legales
   - Documentos oncológicos pueden requerir retención mayor

3. **Testing:**
   ```bash
   # Prueba presigned URL
   curl -X GET "presigned_url_aqui"
   
   # Intenta upload directo (debe fallar)
   curl -X PUT -d "test" https://bucket.r2.cloudflarestorage.com/test.txt
   ```

4. **Monitoreo:**
   - Revisa Cloudflare Analytics regularmente
   - Alertas de uso en el dashboard de Cloudflare
   - Logs de Supabase para rechazos de cuota

---

## 🚀 Flujo completo de seguridad

```
Cliente
   ↓
POST /patient-documents/presign
   ├─ Validar JWT + emailVerified ✓
   ├─ Validar contentType ✓
   ├─ Validar fileSize < 50MB ✓
   ├─ Validar cuota < 500MB ✓
   ├─ Validar throttle < 20/hora ✓
   └─ Generar presigned URL (5 min) ✓
   
Cliente con URL
   ↓
PUT presigned_url + file
   ├─ CORS valida dominio ✓
   ├─ R2 policy valida presigned ✓
   ├─ R2 bucket valida size < 50MB ✓
   └─ Upload exitoso
   
Cliente confirma
   ↓
POST /patient-documents/confirm
   ├─ Ejecutar increment_storage()
   ├─ Validar cuota final
   └─ Registrar en BD ✓
```

---

## 📞 Soporte

Si necesitas revisar o modificar estas configuraciones, contacta al equipo de backend.
