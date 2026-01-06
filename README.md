# PRACloud – Plataforma de Registro y Asistencia Cloud

## Descripción general
PRACloud es un proyecto académico de Investigación y Desarrollo (I+D) orientado al diseño e implementación de una plataforma ligera de registro y control de asistencia basada en la nube (**Cloud Attendance Lite**).

La solución busca sustituir el uso de hojas de cálculo dispersas por un sistema centralizado, automatizado y trazable, que permita gestionar eventos académicos, participantes y asistencias, así como generar reportes básicos de participación.

Este proyecto se desarrolla como parte de una estancia académica bajo un enfoque SaaS académico, utilizando servicios cloud de bajo costo o *free tier* y datos simulados.

---

## Objetivos del proyecto

### Objetivo general
Analizar, diseñar, implementar y documentar una plataforma web/cloud para el registro y control de asistencia a eventos académicos, incorporando automatización y generación de reportes básicos.

### Objetivos específicos
* Diseñar un modelo de datos para eventos, sesiones, participantes y asistencias.
* Implementar un formulario cloud para el registro de asistencia.
* Centralizar los datos en una base de datos en la nube.
* Automatizar validaciones, confirmaciones y generación de métricas.
* Diseñar un dashboard para visualización de asistencia.
* Documentar la arquitectura, procesos y uso de la plataforma.

---

## Tecnologías utilizadas
* **Plataforma Cloud:** Google Workspace
* **Formularios:** Google Forms (Frontend)
* **Base de datos:** Google Sheets (Backend / DB)
* **Automatización:** Google Apps Script
* **Control de versiones:** GitHub
* **Dashboards:** Google Sheets / Looker Studio

---

## Estructura del repositorio

```text
/
├── /docs       # Documentación del proyecto (análisis, diseño, informe final)
├── /scripts    # Scripts de automatización (.gs para Apps Script)
├── /tests      # Evidencias y matrices de pruebas
├── /diagramas  # Diagramas de arquitectura y flujo (.drawio / .png)
└── README.md   # Información general del proyecto
Cómo ejecutar / Configurar el proyecto
Requisitos previos
Cuenta de Google Workspace (con acceso a Forms, Sheets y Apps Script)

Navegador web actualizado

Conocimientos básicos de Google Sheets

Pasos de configuración
Clonar este repositorio (opcional para desarrollo local):

Bash

git clone [https://github.com/Alexander-Escobar/PRACloud.git](https://github.com/Alexander-Escobar/PRACloud.git)
Configurar Google Sheets:

Crea una nueva hoja de cálculo en Google Sheets.

Define las columnas según el Modelo de Datos (Timestamp, Nombre, ID, Correo, Evento, etc.).

Configurar Google Forms:

Crea un formulario y vincúlalo a la hoja de cálculo creada en el paso anterior.

Implementar los Scripts:

En la hoja de cálculo, ve a Extensiones > Apps Script.

Copia el contenido de los archivos de la carpeta /scripts de este repositorio y pégalos en el editor de Apps Script.

Guarda el proyecto y configura los activadores (Triggers) necesarios (ej: onFormSubmit).

Convención de commits y Flujo de Trabajo
Para mantener el orden en el desarrollo colaborativo, el equipo sigue la siguiente convención:

Convención de commits
Usamos prefijos semánticos para identificar el propósito de cada cambio:

feat: Nueva funcionalidad (ej: feat: agregar formulario de registro)

fix: Corrección de error (ej: fix: corregir cálculo de asistencia)

docs: Documentación (ej: docs: actualizar README)

refactor: Reestructuración de código (ej: refactor: optimizar script)

test: Pruebas (ej: test: agregar pruebas unitarias)

### Proceso de desarrollo
1. Crear rama desde `develop`: 
   ```bash
   git checkout -b feat/nueva-funcionalidad
Hacer commits descriptivos siguiendo la convención.

Obligatorio: Crear Pull Request (PR) hacia develop.

Revisión por al menos un compañero (QA o Líder).

Merge después de aprobación.

No se aceptan commits directos a main o develop.

 Uso de datos
Este proyecto utiliza únicamente datos ficticios o simulados. No se almacenan ni procesan datos personales reales.

 Autores
Alisson Serpas

Alexander Escobar

David Perez

Jonathan Beltran
