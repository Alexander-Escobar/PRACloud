# Cloud Attendance Lite
## Guía de Instalación

Proyecto académico de Investigación y Desarrollo (I+D)
Sistema ligero SaaS para registro y control de asistencia basado en la nube.

---

## 1. Requisitos Previos

- Cuenta Google (Google Workspace o Gmail)
- Proyecto Firebase
- Acceso a Google Apps Script
- Navegador moderno (Chrome recomendado)
- Cuenta GitHub (opcional para control de versiones)

---

## 2. Arquitectura General

Frontend:
- HTML + CSS + JavaScript
- Firebase Authentication
- Google Forms (captura de datos)

Backend:
- Google Apps Script (lógica de negocio)
- Google Sheets (base de datos)
- Firebase Authentication (control de acceso)

Dashboards:
- Google Sheets
- Looker Studio

---

## 3. Configuración de Firebase

1. Ir a https://console.firebase.google.com
2. Crear nuevo proyecto
3. Habilitar Authentication
4. Activar:
   - Email/Password
5. Configurar dominio autorizado

Copiar credenciales:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  ...
};


Pegarlas en:
Login.html
panelAdmin.html



---

## 4. Configuración de Google Sheets (Base de Datos)

1. Crear nuevo Google Sheet
2. Crear hojas:
   - Registros
   - Eventos
   - Reportes
3. Copiar ID del Spreadsheet

---

## 5. Configuración de Google Apps Script

1. Ir a https://script.google.com
2. Crear nuevo proyecto
3. Subir archivos:
   - code.gs
   - appscript.gs
   - FormularioQR.html
   - Login.html
   - panelAdmin.html

4. Configurar Spreadsheet ID dentro del código

5. Deploy:
   - Implementar como Web App
   - Ejecutar como: Propietario
   - Acceso: Cualquiera con el enlace

Copiar URL de deployment y actualizar:

```js
const DEPLOYMENT_URL = 'URL_WEB_APP';

6. Configuración de Google Forms

- Crear formulario
- Vincular a Google Sheet
- Copiar URL
- Actualizar en panelAdmin.html:
   var formUrl = 'https://forms.gle/...';



