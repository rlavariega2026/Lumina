# MANUAL OFICIAL DE INSTALACIÓN Y PUBLICACIÓN EN HOSTINGER
## Plataforma Profesional de Galerías Fotográficas Digitales — Lumina Studio

Este documento detalla paso a paso cómo subir, configurar y poner en marcha la aplicación en cualquier plan de alojamiento compartido o VPS de **Hostinger**, utilizando el **Administrador de Archivos (hPanel)** o un cliente **FTP (FileZilla)**.

---

### 1. Estructura de Archivos y Carpeta de Publicación

- **Tecnología**: React + Vite + TypeScript (Single Page Application - SPA).
- **Carpeta lista para producción**: `/dist`
  - `/dist/index.html` (Punto de entrada de la aplicación).
  - `/dist/assets/` (Paquetes minificados de CSS, JavaScript e imágenes optimizadas).
  - `/dist/.htaccess` (Reglas de reescritura Apache para navegación y caché).

---

### 2. Arquitectura de Almacenamiento y Rendimiento

La aplicación utiliza un motor de almacenamiento de objetos binarios de alta capacidad basado en **IndexedDB** y la **File API** del navegador:
1. **Conservación de originales 8K**: Los archivos fotográficos de alta resolución se conservan íntegros sin compresión destructiva en el navegador del fotógrafo y del cliente.
2. **Generación automática de vistas previas**: El motor genera dinámicamente versiones WebP optimizadas y miniaturas ultrarrápidas para navegación instantánea.
3. **Compatibilidad total con Hosting Compartido**: Al operar como una SPA de alto rendimiento con procesamiento en cliente, **no requieres contratar un servidor Node.js ni una base de datos PostgreSQL/MySQL adicional en Hostinger**. Funciona directamente en cualquier plan básico o Business de Hostinger.
4. **Respaldos Portables**: En cualquier momento, el fotógrafo puede exportar o importar un archivo `.json` de respaldo desde el panel de administración.

---

### 3. Paso a Paso para Publicar mediante el Administrador de Archivos de Hostinger (hPanel)

#### Paso 1: Generar los archivos de producción
Si estás trabajando localmente, ejecuta en tu terminal:
```bash
npm run build
```
Esto creará la carpeta `dist/` con todos los archivos listos para el navegador.

#### Paso 2: Acceder a Hostinger
1. Inicia sesión en tu cuenta de [Hostinger hPanel](https://hpanel.hostinger.com).
2. En la sección **Sitios Web**, haz clic en el botón **Administrar** junto a tu dominio o subdominio.

#### Paso 3: Abrir el Administrador de Archivos
1. En el menú lateral o en el buscador de hPanel, escribe **Administrador de archivos** (File Manager) y ábrelo.
2. Selecciona acceder a los archivos de tu dominio.

#### Paso 4: Identificar la carpeta de destino
Navega a la carpeta principal de tu sitio web:
```text
/public_html
```

#### Paso 5: Elegir la ubicación de instalación
- **Opción A (En la raíz de tu dominio, ej: `https://tufotografia.com`)**:
  Debes subir los archivos directamente dentro de `public_html/`.
- **Opción B (En una subcarpeta, ej: `https://tufotografia.com/galerias`)**:
  Crea una nueva carpeta llamada `galerias` dentro de `public_html/` y entra en ella.

#### Paso 6: Subir y extraer los archivos
1. Comprime todos los archivos que están **DENTRO** de la carpeta `dist/` en un archivo `.zip`.
2. En el Administrador de Archivos de Hostinger, haz clic en el botón superior **Subir** (Upload) y selecciona tu archivo `.zip`.
3. Una vez cargado, haz clic derecho sobre el archivo `.zip` en Hostinger y selecciona **Extraer** (Extract).
4. Asegúrate de que el archivo `index.html` quede ubicado exactamente en el nivel donde desees que abra la web.

#### Paso 7: Configurar el archivo `.htaccess`
Crea o edita el archivo `.htaccess` en el mismo directorio donde está `index.html` con el siguiente contenido:

```apache
# Configuración Lumina Studio para Hostinger (Apache)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Forzar conexión segura HTTPS
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # No interceptar archivos físicos ni carpetas existentes
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Redireccionar todas las rutas a index.html para soportar la SPA
  RewriteRule ^ index.html [L]
</IfModule>

# Compresión Gzip para acelerar la carga de fotografías y scripts
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json image/svg+xml
</IfModule>

# Encabezados de caché
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```
*(Nota: Si instalaste en una subcarpeta como `/galerias/`, cambia `RewriteBase /` por `RewriteBase /galerias/`)*.

#### Paso 8: Activar Certificado SSL (HTTPS)
1. En hPanel, ve a **Seguridad** > **SSL**.
2. Verifica que el certificado gratuito Let's Encrypt esté activo y activa la opción **Forzar HTTPS**.

#### Paso 9: Comprobar la instalación
Abre tu dominio en el navegador (en computadora, iPhone y Android). La aplicación cargará inmediatamente con:
- Panel Administrativo protegido con contraseña.
- Acceso a las galerías para los clientes.
- Descarga de archivos originales en ZIP y compartición real en redes sociales.

---

### 4. Publicación Alternativa por FTP (FileZilla)

1. En hPanel, ve a **Archivos** > **Cuentas FTP**.
2. Copia los datos: **Servidor FTP (Host)**, **Nombre de usuario**, y **Puerto (21)**.
3. Abre FileZilla en tu computadora, ingresa las credenciales y conéctate.
4. En el panel remoto (derecha), abre `/public_html`.
5. En el panel local (izquierda), entra a la carpeta `dist/`.
6. Selecciona todos los archivos y arrástralos a la carpeta remota de Hostinger.

---

### 5. Solución de Errores Frecuentes

1. **Error 404 al recargar la página**:
   - Causa: Falta el archivo `.htaccess` o mod_rewrite no está activo.
   - Solución: Verifica que el archivo `.htaccess` esté en la misma carpeta que `index.html` con las reglas indicadas arriba.
2. **Los cambios no se reflejan tras actualizar**:
   - Causa: Caché de navegador o CDN de Hostinger.
   - Solución: En hPanel, ve a **Avanzado** > **Vaciar caché** o presiona `Ctrl + F5` en el navegador.
3. **El archivo .htaccess está oculto en Hostinger**:
   - Solución: En el Administrador de archivos de Hostinger, activa la opción "Mostrar archivos ocultos (dotfiles)" en la rueda de configuración superior derecha.
