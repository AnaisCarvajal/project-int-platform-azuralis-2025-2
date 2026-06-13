# R2 Security Configuration Guide

## Protecciones implementadas en Cloudflare R2

Este documento describe cómo configurar Cloudflare R2 para proteger contra uploads excesivos y facturación inesperada.

## 🔐 Configuraciones necesarias en Cloudflare R2

### 1. CORS Policy (Configuración CORS)

**Archivo**: `r2-cors.json`

**Cómo aplicar en Cloudflare:**
1. Ve a R2 → Bucket → `famed-azuralis` → Settings → **CORS Policy**
2. Haz clic en "Edit CORS Policy"
3. Copia y pega el contenido de `r2-cors.json`
4. Reemplaza `https://tu-dominio-frontend.com` con tu URL real (ej: https://lacito.com)
5. Guarda los cambios

**Configuración:**
- ✅ Solo permite GET, PUT, HEAD
- ✅ Restringido a tu dominio (no wildcard)
- ✅ Solo headers necesarios permitidos
- ✅ Respuestas cacheadas por 1 hora (3600s)

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://tu-dominio-frontend.com"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["Content-Type", "Authorization"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

### 2. Object Lifecycle Rules (Limpiar archivos viejos)

**Archivo**: `r2-lifecycle-rules.json`

**Cómo aplicar en Cloudflare:**
1. Ve a R2 → Bucket → `famed-azuralis` → Settings → **Object Lifecycle Rules**
2. Haz clic en "Add rule"
3. Configura cada regla según el JSON

**Reglas a crear:**

#### Regla 1: Eliminar uploads incompletos
- **Prefix**: `patient-documents/`
- **Abort Incomplete Multipart Upload**: 1 día
- **Estado**: Habilitado

#### Regla 2: Eliminar versiones antiguas  
- **Prefix**: `patient-documents/`
- **Delete Noncurrent Objects**: 30 días
- **Estado**: Habilitado

#### Regla 3: Archivar documentos viejos
- **Prefix**: `patient-documents/`
- **Transition to Archive**: 90 días
- **Estado**: Habilitado

#### Regla 4: Eliminar documentos muy viejos
- **Prefix**: `patient-documents/`
- **Expiration**: 365 días (1 año)
- **Estado**: Habilitado

### 3. Bucket Lock Rules (Protección de datos)

**Cómo aplicar en Cloudflare:**
1. Ve a R2 → Bucket → `famed-azuralis` → Settings → **Bucket Lock Rules**
2. Haz clic en "Edit Bucket Lock"
3. Recomendaciones:
   - **Retention Period**: 90 días (documentos médicos deben guardarse)
   - **Governance Mode**: Habilitado (permite excepciones)
   - **Estado**: Habilitado

---

## 🛡️ Capas de protección implementadas

### Backend (NestJS) - PRIMERA DEFENSA
```
POST /patient-documents/presign
├─ Validar JWT ✓
├─ Validar emailVerified ✓
├─ Validar contentType (PDF, JPEG, PNG, DICOM) ✓
├─ Validar fileSize < 50MB ✓
├─ Validar cuota < 500MB ✓
├─ Validar throttle < 20 uploads/hora ✓
└─ Generar presigned URL (expiración 5 min) ✓
```

### R2 (Cloudflare) - SEGUNDA DEFENSA
```
PUT presigned_url + file
├─ CORS valida dominio origen ✓
├─ Presigned URL validada por CloudFlare ✓
├─ Upload incompleto eliminado en 1 día ✓
└─ Documentos archivados después de 90 días ✓
```

### Base de datos (Supabase) - TERCERA DEFENSA
```
POST /patient-documents/confirm
├─ Ejecutar increment_storage() ✓
├─ Validar cuota final ✓
└─ Registrar en BD ✓
```

---

## 📝 Notas importantes

### Para producción:
1. ✅ CORS: Usar `https://` (no http://)
2. ✅ Reemplaza `tu-dominio-frontend.com` con tu URL real
3. ✅ Retention: 90 días para cumplimiento médico
4. ✅ Archivado: 90 días es buen balance costo/acceso

### Testing local:
- Para desarrollo: puedes usar `http://localhost:3000` en CORS
- Para staging: usa tu URL de staging
- Para producción: usa solo el dominio de producción

### Monitoreo:
- Revisa **R2 → Analytics** regularmente
- Configura alertas de uso en **Cloudflare Notifications**
- Monitorea logs de Supabase para rechazos de cuota

---

## 🚀 Flujo completo de seguridad

```
1. Cliente solicita presigned URL
   ↓
2. Backend valida (JWT, email, cuota, throttle)
   ↓
3. Backend genera URL firmada (5 min)
   ↓
4. Cliente sube archivo con URL
   ↓
5. R2 valida CORS + presigned
   ↓
6. Archivo almacenado en R2
   ↓
7. Cliente confirma upload
   ↓
8. Backend actualiza cuota en Supabase
   ↓
✅ Ciclo completado
```

---

## ⚙️ Referencia rápida

| Setting | Valor | Propósito |
|---------|-------|----------|
| CORS Origins | `https://tu-dominio.com` | Solo tu frontend sube |
| CORS Methods | GET, PUT, HEAD | Solo operaciones necesarias |
| Multipart Cleanup | 1 día | No acumular uploads rotos |
| Archive Age | 90 días | Reducir costos, mantener acceso |
| Max Retention | 365 días | Cumplimiento normativo |
| Prefix Filter | `patient-documents/` | Solo aplicar a documentos |

---

## 📞 Soporte

Si necesitas ayuda adicional:
1. Verifica que CORS esté configurado correctamente
2. Prueba con: `curl -H "Origin: https://tu-dominio.com" presigned_url`
3. Revisa Cloudflare Analytics para errores CORS

