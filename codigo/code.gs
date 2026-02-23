/**
 * =========================================
 * SISTEMA DE ASISTENCIA DGAD
 * Cloud Attendance Platform
 * =========================================
 * 
 * Desarrollado por: Jonathan Ernesto Beltran Guerra & Daniel Alberto Perez
 * 
 * FUNCIONALIDADES:
 * - Registro automático de asistencia
 * - Generación de códigos QR para eventos
 * - Envío de confirmaciones por email
 * - Reportes semanales y mensuales
 * - Validación de duplicados
 * - Panel de administración web
 * - Login 2FA
 */


// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================
const CONFIG = {
  SPREADSHEET_ID: '19Pgn1lHEd_8E1DNyxUq6Yrk-0CGPR2G3rYjH-9wr3ec',
  SHEETS: {
    RESPUESTAS: 'Respuestas de formulario v3',
    EVENTOS: 'Catálogo_Eventos',
    PARTICIPANTES: 'Catálogo_Participantes',
    DASHBOARD: 'Dashboard_Resumen',
    ADMINS: 'Admins',
  },
  EMAIL: {
    REMITENTE: 'DGAD - Sistema de Asistencia',
    ASUNTO_CONFIRMACION: '✓ Confirmación de Asistencia - DGAD',
    ASUNTO_REPORTE_SEMANAL: '📊 Reporte Semanal de Asistencia - DGAD',
    ASUNTO_REPORTE_MENSUAL: '📊 Reporte Mensual de Asistencia - DGAD'
  },
  QR: {
    API_URL: 'https://api.qrserver.com/v1/create-qr-code/',
    SIZE: '300x300'
  }
};

// ============================================
// Login 2FA - ROUTING PRINCIPAL
// ============================================

/**
 * Función principal doGet - Maneja todas las rutas
 * ORDEN DE PRIORIDAD:
 * 1. QR con parámetro 'evento' → Formulario QR
 * 2. Parámetro 'page=admin' → Panel Admin (después de login exitoso)
 * 3. SIN PARÁMETROS o 'page=login' → Login (DEFAULT)
 */
function doGet(e) {
  try {
    Logger.log('🔍 doGet llamado');
    Logger.log('📋 Parámetros: ' + JSON.stringify(e.parameter));
    
    const parametros = e.parameter || {};
    
    // ============================================
    // ROUTING: Determinar qué página mostrar
    // ============================================
    
    // 1. Si viene de un QR con parámetros de evento
    if (parametros.evento) {
      Logger.log('📱 Ruta: Formulario QR');
      return mostrarFormularioQR(
        parametros.evento,
        parametros.fecha || new Date(),
        parametros.nombre || parametros.evento
      );
    }
    
    // 2. Si viene con parámetro page=admin (desde login exitoso)
    if (parametros.page === 'admin') {
      Logger.log('🎯 Ruta: Panel Admin (autenticado)');
      return mostrarPanelAdmin();
    }
    
    // 3. DEFAULT: Mostrar login (sin parámetros o page=login)
    Logger.log('🔐 Ruta DEFAULT: Mostrando Login');
    return mostrarLogin();
    
  } catch (error) {
    Logger.log('❌ ERROR en doGet: ' + error);
    Logger.log('Stack: ' + error.stack);
    return HtmlService.createHtmlOutput(
      '<h3 style="color: red;">Error: ' + error + '</h3>' +
      '<p>Por favor, contacta al administrador del sistema.</p>'
    );
  }
}

// ============================================
// FUNCIÓN: MOSTRAR LOGIN
// ============================================
function mostrarLogin() {
  try {
    Logger.log('📄 Cargando página de login...');
    
    return HtmlService.createHtmlOutputFromFile('Login')
      .setTitle('Login - DGAD')
      .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/forms_48dp.png')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log('❌ ERROR en mostrarLogin: ' + error);
    throw error;
  }
}

// ============================================
// FUNCIÓN: MOSTRAR PANEL DE ADMINISTRACIÓN
// ============================================
function mostrarPanelAdmin() {
  try {
    Logger.log('📄 Cargando Panel Admin...');
    
    return HtmlService.createHtmlOutputFromFile('PanelAdmin')
      .setTitle('Panel de Administración - DGAD')
      .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/forms_48dp.png')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log('❌ ERROR en mostrarPanelAdmin: ' + error);
    throw error;
  }
}

// ============================================
// FUNCIÓN: MOSTRAR FORMULARIO QR
// ============================================
function mostrarFormularioQR(idEvento, fecha, nombreEvento) {
  try {
    Logger.log('📄 Cargando Formulario QR...');
    Logger.log('   ID Evento: ' + idEvento);
    Logger.log('   Nombre: ' + nombreEvento);
    
    const template = HtmlService.createTemplateFromFile('FormularioQR');
    template.idEvento = idEvento;
    template.fecha = fecha;
    template.nombreEvento = nombreEvento || idEvento;
    
    return template.evaluate()
      .setTitle('Registro de Asistencia - DGAD')
      .setFaviconUrl('https://www.gstatic.com/images/branding/product/1x/forms_48dp.png')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log('❌ ERROR en mostrarFormularioQR: ' + error);
    throw error;
  }
}

// ============================================
// FUNCIÓN: VERIFICAR AUTENTICACIÓN (OPCIONAL)
// ============================================

/**
 * Esta función puede ser llamada desde el frontend para verificar
 * si el usuario tiene permiso de admin
 * 
 * En este caso, como Firebase maneja la auth, esta función
 * es opcional. Pero la incluyo por si quieres agregar
 * validación adicional en el backend.
 */
function verificarAdmin(email) {
  try {
    // Lista de emails autorizados como admin
    const ADMINS_AUTORIZADOS = [
      'j9918j@gmail.com',
      // Agrega más emails aquí
    ];
    
    const esAdmin = ADMINS_AUTORIZADOS.includes(email);
    
    Logger.log('🔐 Verificación admin para: ' + email + ' → ' + (esAdmin ? 'AUTORIZADO' : 'DENEGADO'));
    
    return {
      autorizado: esAdmin,
      email: email
    };
    
  } catch (error) {
    Logger.log('❌ ERROR en verificarAdmin: ' + error);
    return {
      autorizado: false,
      error: error.toString()
    };
  }
}

// ============================================
// FUNCIÓN: OBTENER URL DEL DEPLOYMENT
// ============================================

/**
 * Útil para obtener la URL del deployment actual
 */
function obtenerURLDeployment() {
  try {
    const url = ScriptApp.getService().getUrl();
    Logger.log('🔗 URL de deployment: ' + url);
    return url;
  } catch (error) {
    Logger.log('❌ ERROR: ' + error);
    return null;
  }
}

// ============================================
// FUNCIÓN: INICIALIZAR SISTEMA
// ============================================

function inicializarSistema() {
  try {
    Logger.log('Iniciando configuración del sistema...');
    
    // Verificar hojas existentes
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hojas = ss.getSheets().map(h => h.getName());
    
    Logger.log('Hojas encontradas: ' + hojas.join(', '));
    
    // Configurar triggers automáticos
    eliminarTriggersAntiguos();
    crearTriggers();
    
    // Configurar validaciones en las hojas
    configurarValidaciones();
    
    Logger.log('✓ Sistema inicializado correctamente');
    return { success: true, message: 'Sistema inicializado correctamente' };
    
  } catch (error) {
    Logger.log('ERROR en inicialización: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// FUNCIÓN: PROCESAR RESPUESTA DEL FORMULARIO
// ============================================

function onFormSubmit(e) {
  try {
    Logger.log('=== INICIO onFormSubmit ===');
    
    // SIEMPRE leer desde la hoja (más confiable que namedValues)
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.RESPUESTAS);
    const ultimaFila = hoja.getLastRow();
    
    Logger.log('📝 Leyendo fila: ' + ultimaFila);
    
    // Leer los datos de la última fila (la que se acaba de agregar)
    const datos = hoja.getRange(ultimaFila, 1, 1, 9).getValues()[0];
    
    Logger.log('Datos crudos: ' + JSON.stringify(datos));
    
    // Crear objeto de registro con valores por defecto inteligentes
    const ahora = new Date();
    const registro = {
      timestamp: datos[0] || ahora,
      nombre: datos[1] || 'Participante',
      idCodigo: datos[2] || 'N/A',
      correo: datos[3] || '',
      tipoEvento: datos[4] || '',
      fecha: datos[5] || ahora,
      hora: datos[6] || Utilities.formatDate(ahora, 'America/El_Salvador', 'HH:mm'),
      grupo: datos[7] || 'No especificado',
      observaciones: datos[8] || ''
    };
    
    Logger.log('Registro procesado: ' + JSON.stringify(registro));
    
    // Buscar nombre completo del evento si viene solo el ID
    if (registro.tipoEvento) {
      const hojaEventos = ss.getSheetByName(CONFIG.SHEETS.EVENTOS);
      
      if (hojaEventos) {
        const datosEventos = hojaEventos.getDataRange().getValues();
        
        // Buscar por ID o por nombre parcial
        for (let i = 1; i < datosEventos.length; i++) {
          const idEvento = datosEventos[i][0];
          const nombreEvento = datosEventos[i][1];
          
          if (registro.tipoEvento.includes(idEvento) || registro.tipoEvento === idEvento) {
            registro.tipoEvento = nombreEvento;
            Logger.log('✓ Evento encontrado: ' + nombreEvento);
            break;
          }
        }
      }
    }
    
    // Asegurar que tipoEvento nunca esté vacío
    if (!registro.tipoEvento || registro.tipoEvento.trim() === '') {
      registro.tipoEvento = 'Evento DGAD';
      Logger.log('⚠️ Usando nombre por defecto para evento');
    }
    
    Logger.log('📝 Escribiendo en fila: ' + ultimaFila);
    
    // Marcar PRESENTE en columna J (columna 10)
    hoja.getRange(ultimaFila, 10).setValue('Presente');
    
    // Actualizar el nombre del evento en columna E (columna 5)
    hoja.getRange(ultimaFila, 5).setValue(registro.tipoEvento);
    
    // FORZAR la escritura inmediata
    SpreadsheetApp.flush();
    
    Logger.log('✓ Marcado como Presente en fila ' + ultimaFila + ', columna J');
    Logger.log('✓ Nombre del evento actualizado: ' + registro.tipoEvento);
    
    // Registrar participante si es nuevo
    registrarParticipante(registro);
    
    // ENVIAR EMAIL
    Logger.log('Preparando envío de email a: ' + registro.correo);
    enviarConfirmacionAsistencia(registro);
    
    // ORDENAR POR TIMESTAMP (Columna 1)
const totalFilas = hoja.getLastRow();
const totalColumnas = hoja.getLastColumn();

if (totalFilas > 1) {
  hoja.getRange(2, 1, totalFilas - 1, totalColumnas)
       .sort({ column: 1, ascending: true });
  Logger.log('✓ Hoja ordenada por Timestamp');
}

    Logger.log('=== FIN onFormSubmit - EXITOSO ===');
    
  } catch (error) {
    Logger.log('❌ ERROR en onFormSubmit: ' + error);
    Logger.log('Stack: ' + error.stack);
    
    try {
      enviarAlertaError('Error al procesar formulario', error.toString());
    } catch (e) {
      Logger.log('No se pudo enviar alerta de error');
    }
  }
}

// ============================================
// FUNCIÓN: REGISTRAR PARTICIPANTE
// ============================================

function registrarParticipante(registro) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.PARTICIPANTES);
    
    if (!hoja) {
      Logger.log('Advertencia: No se encontró la hoja de participantes');
      return;
    }
    
    // Verificar si el participante ya existe
    const datos = hoja.getDataRange().getValues();
    const existe = datos.some(fila => fila[2] === registro.correo);
    
    if (!existe) {
      // Generar nuevo ID
      const nuevoID = generarIDParticipante(datos.length);
      
      // Agregar nuevo participante
      hoja.appendRow([
        nuevoID,
        registro.nombre,
        registro.correo,
        'Estudiante', // Tipo por defecto
        registro.grupo
      ]);
      
      Logger.log('Nuevo participante registrado: ' + registro.nombre);
    } else {
      Logger.log('Participante ya existe: ' + registro.correo);
    }
    
  } catch (error) {
    Logger.log('ERROR en registrarParticipante: ' + error);
  }
}

// ============================================
// FUNCIÓN: GENERAR ID PARTICIPANTE
// ============================================

function generarIDParticipante(cantidadActual) {
  const numero = String(cantidadActual).padStart(2, '0');
  return `SN-10-${numero}`;
}

// ============================================
// FUNCIÓN: ENVIAR CONFIRMACIÓN POR EMAIL (SIMPLIFICADA)
// ============================================

function enviarConfirmacionAsistencia(registro) {
  try {
    Logger.log('>>> Iniciando envío de email');
    Logger.log('Destinatario: ' + registro.correo);
    Logger.log('Nombre: ' + registro.nombre);
    
    // Validaciones previas
    if (!registro.correo || !registro.correo.includes('@')) {
      Logger.log('❌ Email inválido: ' + registro.correo);
      return;
    }
    
    const nombreParticipante = registro.nombre || 'Participante';
    
    const asunto = '✓ Confirmación de Asistencia - DGAD';
    
    const mensaje = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">✓ Asistencia Confirmada</h1>
        </div>
        
        <div style="padding: 40px; background-color: #f7f7f7; text-align: center;">
          <p style="font-size: 18px; color: #333; margin-bottom: 30px;">Hola <strong>${nombreParticipante}</strong>,</p>
          
          <div style="background-color: white; padding: 40px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #4CAF50; margin: 0; font-size: 28px;">PRESENTE</h2>
            <p style="color: #666; margin-top: 15px; font-size: 16px;">Tu asistencia ha sido registrada exitosamente</p>
          </div>
          
          <p style="font-size: 13px; color: #999; margin-top: 30px;">
            Sistema de Asistencia DGAD - Mensaje Automático
          </p>
        </div>
        
        <div style="background-color: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2026 Dirección de Gestión Académica Digital (DGAD)
          </p>
        </div>
      </div>
    `;
    
    Logger.log('Enviando email...');
    
    MailApp.sendEmail({
      to: registro.correo,
      subject: asunto,
      htmlBody: mensaje
    });
    
    Logger.log('✅ EMAIL ENVIADO EXITOSAMENTE a: ' + registro.correo);
    
  } catch (error) {
    Logger.log('❌ ERROR al enviar email: ' + error);
    Logger.log('Stack trace: ' + error.stack);
  }
}

// ============================================
// FUNCIÓN: FORMATEAR FECHA
// ============================================

function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  
  try {
    const d = new Date(fecha);
    const opciones = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/El_Salvador'
    };
    return d.toLocaleDateString('es-ES', opciones);
  } catch (error) {
    return fecha.toString();
  }
}

// ============================================
// FUNCIÓN: CREAR EVENTO Y GENERAR QR
// ============================================

function crearEventoYGenerarQR(nombreEvento, idEvento, fecha) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hojaEventos = ss.getSheetByName(CONFIG.SHEETS.EVENTOS);
    
    // Generar el QR primero
    const qrData = generarQREvento(nombreEvento, idEvento, fecha);
    
    if (!qrData) {
      Logger.log('ERROR: No se pudo generar QR');
      return null;
    }
    
    // Verificar si el evento ya existe
    const datosEventos = hojaEventos.getDataRange().getValues();
    let eventoExiste = false;
    let estadoEvento = 'nuevo';
    let filaEvento = -1;
    
    for (let i = 1; i < datosEventos.length; i++) {
      if (datosEventos[i][0] === idEvento) {
        eventoExiste = true;
        estadoEvento = 'existente';
        filaEvento = i + 1; // +1 porque los índices empiezan en 0 pero las filas en 1
        Logger.log('El evento ya existe en fila: ' + filaEvento);
        break;
      }
    }
    
    // Si no existe, crear el evento en la hoja
    if (!eventoExiste) {
      hojaEventos.appendRow([
        idEvento,
        nombreEvento,
        fecha,
        qrData.urlEvento  // NUEVA COLUMNA: URL del QR
      ]);
      Logger.log('✓ Nuevo evento creado en Google Sheets: ' + nombreEvento);
      Logger.log('✓ URL del QR guardada: ' + qrData.urlEvento);
    } else {
      // Actualizar la URL del QR en el evento existente (columna D = columna 4)
      hojaEventos.getRange(filaEvento, 4).setValue(qrData.urlEvento);
      Logger.log('✓ URL del QR actualizada en evento existente');
    }
    
    // Forzar escritura
    SpreadsheetApp.flush();
    
    // Agregar estado del evento al resultado
    qrData.estadoEvento = estadoEvento;
    
    return qrData;
    
  } catch (error) {
    Logger.log('ERROR en crearEventoYGenerarQR: ' + error);
    return null;
  }
}

// ============================================
// FUNCIÓN: GENERAR QR PARA EVENTO
// ============================================

function generarQREvento(nombreEvento, idEvento, fecha) {
  try {
    // Crear URL única para el evento
    const urlBase = ScriptApp.getService().getUrl();
    
    // Formatear la fecha correctamente
    let fechaFormateada = fecha;
    if (fecha instanceof Date) {
      fechaFormateada = Utilities.formatDate(fecha, 'America/El_Salvador', 'yyyy-MM-dd');
    }
    
    // Crear parámetros con codificación URL
    const parametros = `?evento=${encodeURIComponent(idEvento)}&fecha=${encodeURIComponent(fechaFormateada)}&nombre=${encodeURIComponent(nombreEvento)}`;
    const urlCompleta = urlBase + parametros;
    
    // Generar URL del QR
    const urlQR = `${CONFIG.QR.API_URL}?size=${CONFIG.QR.SIZE}&data=${encodeURIComponent(urlCompleta)}`;
    
    Logger.log('QR generado para evento: ' + nombreEvento);
    Logger.log('ID Evento: ' + idEvento);
    Logger.log('URL: ' + urlCompleta);
    
    return {
      urlQR: urlQR,
      urlEvento: urlCompleta,
      idEvento: idEvento,
      nombreEvento: nombreEvento,
      fecha: fechaFormateada
    };
    
  } catch (error) {
    Logger.log('ERROR al generar QR: ' + error);
    return null;
  }
}

// ============================================
// FUNCIÓN: REGISTRAR ASISTENCIA VIA QR
// ============================================

function registrarAsistenciaQR(correo, idEvento, fecha, nombreEvento) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    
    // Si no viene nombreEvento, buscar en el catálogo
    if (!nombreEvento || nombreEvento === 'null' || nombreEvento === 'undefined') {
      const hojaEventos = ss.getSheetByName(CONFIG.SHEETS.EVENTOS);
      const datosEventos = hojaEventos.getDataRange().getValues();
      nombreEvento = idEvento; // Por defecto usar el ID
      
      for (let i = 1; i < datosEventos.length; i++) {
        if (datosEventos[i][0] === idEvento) {
          nombreEvento = datosEventos[i][1]; // Nombre del evento
          break;
        }
      }
    }
    
    Logger.log('Registrando asistencia para evento: ' + nombreEvento);
    
    // Buscar participante en el catálogo
    const hojaParticipantes = ss.getSheetByName(CONFIG.SHEETS.PARTICIPANTES);
    const datosParticipantes = hojaParticipantes.getDataRange().getValues();
    
    let participante = null;
    for (let i = 1; i < datosParticipantes.length; i++) {
      if (datosParticipantes[i][2] === correo) {
        participante = {
          id: datosParticipantes[i][0],
          nombre: datosParticipantes[i][1],
          correo: datosParticipantes[i][2],
          tipo: datosParticipantes[i][3],
          grupo: datosParticipantes[i][4]
        };
        break;
      }
    }
    
    if (!participante) {
      return {
        success: false,
        message: 'No estás registrado en el sistema. Por favor, regístrate primero usando el formulario principal.'
      };
    }
    
    // Verificar si ya marcó asistencia hoy para este evento
    const hojaRespuestas = ss.getSheetByName(CONFIG.SHEETS.RESPUESTAS);
    const datosRespuestas = hojaRespuestas.getDataRange().getValues();
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    for (let i = 1; i < datosRespuestas.length; i++) {
      const fechaRegistro = new Date(datosRespuestas[i][5]);
      fechaRegistro.setHours(0, 0, 0, 0);
      
      if (datosRespuestas[i][3] === correo && 
          datosRespuestas[i][4] === nombreEvento &&
          fechaRegistro.getTime() === hoy.getTime()) {
        return {
          success: false,
          message: 'Ya has registrado tu asistencia para este evento hoy.'
        };
      }
    }
    
    // Registrar nueva asistencia
    const timestamp = new Date();
    const hora = Utilities.formatDate(timestamp, 'America/El_Salvador', 'HH:mm');
    
    hojaRespuestas.appendRow([
      timestamp,
      participante.nombre,
      participante.id,
      participante.correo,
      nombreEvento, // Usar el nombre completo del evento
      fecha || hoy,
      hora,
      participante.grupo,
      'Registrado vía QR',
      'Presente'
    ]);
    
    Logger.log('✓ Asistencia registrada. Enviando email...');
    
    // Enviar confirmación con el nombre completo del evento
    enviarConfirmacionAsistencia({
      nombre: participante.nombre,
      correo: participante.correo,
      tipoEvento: nombreEvento, // Usar el nombre completo
      fecha: fecha || hoy,
      hora: hora,
      grupo: participante.grupo
    });
    
    Logger.log('✓ Email enviado correctamente');
    
    return {
      success: true,
      message: `¡Asistencia registrada exitosamente para ${participante.nombre}!`
    };
    
  } catch (error) {
    Logger.log('ERROR en registrarAsistenciaQR: ' + error);
    return {
      success: false,
      message: 'Error al registrar asistencia: ' + error.toString()
    };
  }
}

// ============================================
// FUNCIÓN: GENERAR REPORTE SEMANAL
// ============================================

function generarReporteSemanal() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.RESPUESTAS);
    const datos = hoja.getDataRange().getValues();
    
    // Calcular rango de la semana pasada
    const hoy = new Date();
    const inicioSemana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filtrar registros de la semana
    let registrosSemana = 0;
    let presentes = 0;
    let eventos = new Set();
    
    for (let i = 1; i < datos.length; i++) {
      const fecha = new Date(datos[i][0]);
      if (fecha >= inicioSemana && fecha <= hoy) {
        registrosSemana++;
        if (datos[i][9] === 'Presente') presentes++;
        eventos.add(datos[i][4]);
      }
    }
    
    // Crear reporte
    const reporte = {
      periodo: `${formatearFecha(inicioSemana)} - ${formatearFecha(hoy)}`,
      totalRegistros: registrosSemana,
      totalPresentes: presentes,
      totalEventos: eventos.size,
      porcentajeAsistencia: registrosSemana > 0 ? ((presentes / registrosSemana) * 100).toFixed(2) : 0
    };
    
    // Enviar reporte por email
    enviarReporteEmail(reporte, 'semanal');
    
    Logger.log('✓ Reporte semanal generado y enviado');
    return reporte;
    
  } catch (error) {
    Logger.log('ERROR en generarReporteSemanal: ' + error);
    return null;
  }
}

// ============================================
// FUNCIÓN: GENERAR REPORTE MENSUAL
// ============================================

function generarReporteMensual() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.RESPUESTAS);
    const datos = hoja.getDataRange().getValues();
    
    // Calcular rango del mes pasado
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Filtrar registros del mes
    let registrosMes = 0;
    let presentes = 0;
    let eventos = new Set();
    let participantes = new Set();
    
    for (let i = 1; i < datos.length; i++) {
      const fecha = new Date(datos[i][0]);
      if (fecha >= inicioMes && fecha <= hoy) {
        registrosMes++;
        if (datos[i][9] === 'Presente') presentes++;
        eventos.add(datos[i][4]);
        participantes.add(datos[i][3]);
      }
    }
    
    // Crear reporte
    const reporte = {
      periodo: `${formatearFecha(inicioMes)} - ${formatearFecha(hoy)}`,
      totalRegistros: registrosMes,
      totalPresentes: presentes,
      totalEventos: eventos.size,
      totalParticipantesUnicos: participantes.size,
      porcentajeAsistencia: registrosMes > 0 ? ((presentes / registrosMes) * 100).toFixed(2) : 0
    };
    
    // Enviar reporte por email
    enviarReporteEmail(reporte, 'mensual');
    
    Logger.log('✓ Reporte mensual generado y enviado');
    return reporte;
    
  } catch (error) {
    Logger.log('ERROR en generarReporteMensual: ' + error);
    return null;
  }
}

// ============================================
// FUNCIÓN: ENVIAR REPORTE POR EMAIL
// ============================================

function enviarReporteEmail(reporte, tipo) {
  try {
    const asunto = tipo === 'semanal' ? 
      CONFIG.EMAIL.ASUNTO_REPORTE_SEMANAL : 
      CONFIG.EMAIL.ASUNTO_REPORTE_MENSUAL;
    
    const mensaje = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">📊 Reporte ${tipo === 'semanal' ? 'Semanal' : 'Mensual'}</h1>
          <p style="color: white; margin: 10px 0 0 0;">${reporte.periodo}</p>
        </div>
        
        <div style="padding: 30px; background-color: #f7f7f7;">
          <h3 style="color: #333;">Resumen de Asistencia</h3>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee;">
                  <strong style="color: #667eea;">Total de Registros</strong>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
                  <span style="font-size: 24px; color: #333;">${reporte.totalRegistros}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee;">
                  <strong style="color: #4CAF50;">Presentes</strong>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
                  <span style="font-size: 24px; color: #4CAF50;">${reporte.totalPresentes}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee;">
                  <strong style="color: #FF9800;">Eventos Realizados</strong>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
                  <span style="font-size: 24px; color: #FF9800;">${reporte.totalEventos}</span>
                </td>
              </tr>
              ${tipo === 'mensual' ? `
              <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee;">
                  <strong style="color: #9C27B0;">Participantes Únicos</strong>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
                  <span style="font-size: 24px; color: #9C27B0;">${reporte.totalParticipantesUnicos}</span>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 15px;">
                  <strong style="color: #2196F3;">Porcentaje de Asistencia</strong>
                </td>
                <td style="padding: 15px; text-align: right;">
                  <span style="font-size: 24px; color: #2196F3;">${reporte.porcentajeAsistencia}%</span>
                </td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            Este reporte fue generado automáticamente por el Sistema de Asistencia DGAD.
          </p>
        </div>
        
        <div style="background-color: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2026 Dirección de Gestión Académica Digital (DGAD)
          </p>
        </div>
      </div>
    `;
    
    // Enviar al coordinador
    MailApp.sendEmail({
      to: 'j9918j@gmail.com', // Correo del coordinador Jonathan
      subject: asunto,
      htmlBody: mensaje
    });
    
    Logger.log(`✓ Reporte ${tipo} enviado`);
    
  } catch (error) {
    Logger.log('ERROR al enviar reporte: ' + error);
  }
}

// ============================================
// FUNCIÓN: CREAR TRIGGERS AUTOMÁTICOS
// ============================================

function crearTriggers() {
  try {
    // Trigger para respuestas del formulario
    ScriptApp.newTrigger('onFormSubmit')
      .forSpreadsheet(SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID))
      .onFormSubmit()
      .create();
    
    // Trigger para reporte semanal (cada lunes a las 8:00 AM)
    ScriptApp.newTrigger('generarReporteSemanal')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(8)
      .create();
    
    // Trigger para reporte mensual (primer día del mes a las 9:00 AM)
    ScriptApp.newTrigger('generarReporteMensual')
      .timeBased()
      .onMonthDay(1)
      .atHour(9)
      .create();
    
    Logger.log('✓ Triggers creados correctamente');
    
  } catch (error) {
    Logger.log('ERROR al crear triggers: ' + error);
  }
}

// ============================================
// FUNCIÓN: ELIMINAR TRIGGERS ANTIGUOS
// ============================================

function eliminarTriggersAntiguos() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  Logger.log('✓ Triggers antiguos eliminados');
}

// ============================================
// FUNCIÓN: CONFIGURAR VALIDACIONES
// ============================================

function configurarValidaciones() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.RESPUESTAS);
    
    if (!hoja) return;
    
    // Validación para columna de Asistencia
    const reglaAsistencia = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Presente', 'Ausente', 'Tardanza'])
      .setAllowInvalid(false)
      .build();
    
    const rangoAsistencia = hoja.getRange('J2:J');
    rangoAsistencia.setDataValidation(reglaAsistencia);
    
    Logger.log('✓ Validaciones configuradas');
    
  } catch (error) {
    Logger.log('ERROR al configurar validaciones: ' + error);
  }
}

// ============================================
// FUNCIÓN: ENVIAR ALERTA DE ERROR
// ============================================

function enviarAlertaError(titulo, mensaje) {
  try {
    MailApp.sendEmail({
      to: 'j9918j@gmail.com',
      subject: '⚠️ Alerta del Sistema DGAD - ' + titulo,
      body: `Se ha detectado un error en el sistema:\n\n${mensaje}\n\nFecha: ${new Date()}`
    });
  } catch (error) {
    Logger.log('ERROR al enviar alerta: ' + error);
  }
}

// ============================================
// FUNCIÓN: ACTUALIZAR OPCIONES DEL FORMULARIO
// ============================================

function actualizarOpcionesEventosEnFormulario() {
  try {
    Logger.log('Iniciando actualización de opciones del formulario...');
    
    // Obtener el formulario vinculado
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const form = FormApp.openByUrl(ss.getFormUrl());
    
    if (!form) {
      Logger.log('⚠️ No se encontró formulario vinculado');
      return {
        success: false,
        message: 'No se encontró un formulario vinculado a esta hoja'
      };
    }
    
    // Obtener eventos del catálogo
    const hojaEventos = ss.getSheetByName(CONFIG.SHEETS.EVENTOS);
    const datosEventos = hojaEventos.getDataRange().getValues();
    
    // Crear lista de opciones
    const opciones = [];
    for (let i = 1; i < datosEventos.length; i++) {
      if (datosEventos[i][0]) { // Si tiene ID
        const opcion = `${datosEventos[i][0]} - ${datosEventos[i][1]}`;
        opciones.push(opcion);
      }
    }
    
    if (opciones.length === 0) {
      Logger.log('⚠️ No hay eventos en el catálogo');
      return {
        success: false,
        message: 'No hay eventos en el catálogo para agregar al formulario'
      };
    }
    
    // Buscar el campo "Tipo de Evento" en el formulario
    const items = form.getItems();
    let campoTipoEvento = null;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.getTitle().toLowerCase().includes('tipo') && 
          item.getTitle().toLowerCase().includes('evento')) {
        
        // Convertir a lista desplegable si no lo es
        if (item.getType() === FormApp.ItemType.LIST) {
          campoTipoEvento = item.asListItem();
        } else if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
          campoTipoEvento = item.asMultipleChoiceItem();
        }
        break;
      }
    }
    
    if (!campoTipoEvento) {
      Logger.log('⚠️ No se encontró el campo Tipo de Evento');
      return {
        success: false,
        message: 'No se encontró el campo "Tipo de Evento" en el formulario'
      };
    }
    
    // Actualizar opciones
    if (campoTipoEvento.getType() === FormApp.ItemType.LIST) {
      campoTipoEvento.setChoiceValues(opciones);
    } else {
      const choices = opciones.map(opt => campoTipoEvento.createChoice(opt));
      campoTipoEvento.setChoices(choices);
    }
    
    Logger.log('✓ Formulario actualizado con ' + opciones.length + ' eventos');
    
    return {
      success: true,
      message: `Formulario actualizado con ${opciones.length} eventos del catálogo`
    };
    
  } catch (error) {
    Logger.log('ERROR en actualizarOpcionesEventosEnFormulario: ' + error);
    return {
      success: false,
      message: 'Error: ' + error.toString()
    };
  }
}

// ============================================
// FUNCIONES AUXILIARES PARA HTML
// ============================================

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function obtenerEventos() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.EVENTOS);
    
    if (!hoja) {
      Logger.log('ERROR: No se encontró la hoja ' + CONFIG.SHEETS.EVENTOS);
      return [];
    }
    
    const datos = hoja.getDataRange().getValues();
    Logger.log('Total de filas en Catálogo_Eventos: ' + datos.length);
    
    const eventos = [];
    
    // Empezar desde fila 1 (después del encabezado)
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][0]) {
          // Si tiene ID en columna A
          eventos.push({
              id: String(datos[i][0]),
              nombre: String(datos[i][1]) || "Sin nombre",
              fecha: String(datos[i][2]) || "",
              urlQR: String(datos[i][3]) || "", // URL del QR en columna D
          });
      }
    }
    
    Logger.log('Eventos encontrados: ' + eventos.length);
    Logger.log('Eventos con QR: ' + eventos.filter(e => e.urlQR).length);
    
    return eventos;
    
  } catch (error) {
    Logger.log('ERROR en obtenerEventos: ' + error);
    return [];
  }
}

function obtenerHistorialQRs() {
  // Devuelve los eventos con QR generado
  const eventos = obtenerEventos();
  return eventos.filter(evento => evento.urlQR && evento.urlQR !== '');
}

function obtenerEstadisticas() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const hoja = ss.getSheetByName(CONFIG.SHEETS.RESPUESTAS);
  const datos = hoja.getDataRange().getValues();
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  let totalHoy = 0;
  let presentesHoy = 0;
  
  for (let i = 1; i < datos.length; i++) {
    const fecha = new Date(datos[i][0]);
    fecha.setHours(0, 0, 0, 0);
    
    if (fecha.getTime() === hoy.getTime()) {
      totalHoy++;
      if (datos[i][9] === 'Presente') presentesHoy++;
    }
  }
  
  return {
    totalRegistros: datos.length - 1,
    registrosHoy: totalHoy,
    presentesHoy: presentesHoy,
    totalEventos: obtenerEventos().length
  };
}

// ============================================
// FUNCIÓN: LIMPIAR HOJA (RESETEAR)
// ============================================

function limpiarHojaRespuestas() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.RESPUESTAS);
    
    if (!hoja) {
      return { success: false, message: 'No se encontró la hoja de respuestas' };
    }
    
    // Obtener la última fila
    const ultimaFila = hoja.getLastRow();
    
    if (ultimaFila <= 1) {
      return { success: false, message: 'No hay datos para eliminar' };
    }
    
    // ============================================
    // PASO 1: CREAR BACKUP Y ENVIAR POR EMAIL
    // ============================================
    
    Logger.log('📧 Creando backup antes de resetear...');
    
    try {
      // Obtener TODOS los datos (incluyendo encabezado)
      const datos = hoja.getDataRange().getValues();
      const totalRegistros = ultimaFila - 1;
      
      // Crear contenido del backup en formato CSV
      let csvContent = '';
      for (let i = 0; i < datos.length; i++) {
        const fila = datos[i].map(function(celda) {
          // Escapar comillas y comas en el CSV
          if (celda === null || celda === undefined) return '';
          const texto = celda.toString().replace(/"/g, '""');
          return '"' + texto + '"';
        }).join(',');
        csvContent += fila + '\n';
      }
      
      // Crear fecha y hora para el nombre del archivo
      const ahora = new Date();
      const fecha = Utilities.formatDate(ahora, 'America/El_Salvador', 'yyyy-MM-dd_HH-mm-ss');
      const nombreArchivo = 'BACKUP_Asistencias_' + fecha + '.csv';
      
      // Crear el archivo CSV
      const blob = Utilities.newBlob(csvContent, 'text/csv', nombreArchivo);
      
      // Preparar email con backup
      const asunto = '📦 Backup Automático - Reseteo de Datos DGAD';
      
      const mensaje = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">📦 Backup Automático</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f7f7f7;">
            <h3 style="color: #333;">Respaldo de Datos Generado</h3>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #666; margin-bottom: 15px;">
                Se ha generado un respaldo de los datos antes de resetear el sistema.
              </p>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Registros respaldados:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${totalRegistros}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Fecha del backup:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${Utilities.formatDate(ahora, 'America/El_Salvador', 'dd/MM/yyyy HH:mm:ss')}</td>
                </tr>
                <tr>
                  <td style="padding: 10px;"><strong>Nombre del archivo:</strong></td>
                  <td style="padding: 10px; text-align: right; font-family: monospace; font-size: 12px;">${nombreArchivo}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Importante:</strong> Este backup se generó automáticamente antes de resetear la hoja de respuestas. 
                Guarda este archivo en un lugar seguro por si necesitas recuperar los datos.
              </p>
            </div>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px;">
              Sistema de Asistencia DGAD - Backup Automático
            </p>
          </div>
          
          <div style="background-color: #333; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2026 Dirección de Gestión Académica Digital (DGAD)
            </p>
          </div>
        </div>
      `;
      
      // Enviar email con el archivo adjunto
      MailApp.sendEmail({
        to: 'j9918j@gmail.com',
        subject: asunto,
        htmlBody: mensaje,
        attachments: [blob]
      });
      
      Logger.log('✅ Backup enviado exitosamente a j9918j@gmail.com');
      Logger.log('📎 Archivo adjunto: ' + nombreArchivo);
      
    } catch (errorBackup) {
      Logger.log('⚠️ ERROR al crear backup: ' + errorBackup);
      // Continuar con el reseteo aunque falle el backup
      // pero informar al usuario
      return { 
        success: false, 
        message: 'Error al crear backup: ' + errorBackup.toString() + '. No se realizó el reseteo por seguridad.' 
      };
    }
    
    // ============================================
    // PASO 2: RESETEAR LA HOJA (solo si el backup fue exitoso)
    // ============================================
    
    Logger.log('🗑️ Eliminando registros de la hoja...');
    
    // Eliminar todas las filas excepto el encabezado (fila 1)
    hoja.deleteRows(2, ultimaFila - 1);
    
    Logger.log('✓ Hoja de respuestas limpiada. Se eliminaron ' + (ultimaFila - 1) + ' filas');
    
    return { 
      success: true, 
      message: `✅ Backup enviado a j9918j@gmail.com\n\n🗑️ Se eliminaron ${totalRegistros} registros.\n\nLa hoja se ha reseteado correctamente.` 
    };
    
  } catch (error) {
    Logger.log('ERROR en limpiarHojaRespuestas: ' + error);
    return { success: false, message: 'Error: ' + error.toString() };
  }
}
// ============================================
// FUNCIÓN: ENVIAR CÓDIGO OTP POR EMAIL
// ============================================

/**
 * Envía el código OTP de 6 dígitos por email al usuario
 * @param {string} email - Correo del destinatario
 * @param {string} nombre - Nombre del usuario
 * @param {string} codigo - Código OTP de 6 dígitos
 * @returns {Object} - Resultado del envío
 */
function enviarCodigoOTP(email, nombre, codigo) {
  try {
    Logger.log('>>> Enviando código OTP');
    Logger.log('Destinatario: ' + email);
    Logger.log('Código: ' + codigo);
    
    // Validaciones
    if (!email || !email.includes('@')) {
      Logger.log('❌ Email inválido');
      return {
        success: false,
        message: 'Email inválido'
      };
    }
    
    if (!codigo || codigo.length !== 6) {
      Logger.log('❌ Código OTP inválido');
      return {
        success: false,
        message: 'Código OTP inválido'
      };
    }
    
    const nombreUsuario = nombre || 'Usuario';
    const asunto = '🔐 Código de Verificación - DGAD Admin';
    
    const mensaje = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">🔐 Código de Verificación</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Sistema de Administración DGAD</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px; background-color: #f7f7f7; text-align: center;">
          <p style="font-size: 18px; color: #333; margin-bottom: 30px;">
            Hola <strong>${nombreUsuario}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
            Has solicitado acceso al Panel de Administración. <br>
            Usa el siguiente código para completar tu inicio de sesión:
          </p>
          
          <!-- Código OTP -->
          <div style="background-color: white; padding: 30px; border-radius: 12px; margin: 30px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="font-size: 48px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
              ${codigo}
            </div>
          </div>
          
          <!-- Información adicional -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; text-align: left; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Importante:</strong>
            </p>
            <ul style="margin: 10px 0 0 20px; color: #856404; font-size: 13px;">
              <li>Este código es válido por <strong>5 minutos</strong></li>
              <li>No compartas este código con nadie</li>
              <li>Si no solicitaste este código, ignora este mensaje</li>
            </ul>
          </div>
          
          <p style="font-size: 13px; color: #999; margin-top: 30px;">
            Sistema de Asistencia DGAD - Mensaje Automático
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #333; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2026 Dirección de Gestión Académica Digital (DGAD)<br>
            Este es un mensaje automático, por favor no responder.
          </p>
        </div>
      </div>
    `;
    
    Logger.log('Enviando email...');
    
    MailApp.sendEmail({
      to: email,
      subject: asunto,
      htmlBody: mensaje
    });
    
    Logger.log('✅ EMAIL OTP ENVIADO EXITOSAMENTE a: ' + email);
    
    return {
      success: true,
      message: 'Código enviado exitosamente'
    };
    
  } catch (error) {
    Logger.log('❌ ERROR al enviar email OTP: ' + error);
    Logger.log('Stack trace: ' + error.stack);
    
    return {
      success: false,
      message: 'Error al enviar email: ' + error.toString()
    };
  }
}

// ============================================
// FUNCIÓN: VERIFICAR SESIÓN
// ============================================
function verificarAdmin(email) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.ADMINS);
    const datos = hoja.getDataRange().getValues();
    
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][2].toLowerCase().trim() === email.toLowerCase().trim()) {
        return { autorizado: true, email: email };
      }
    }
    return { autorizado: false };
    
  } catch (error) {
    return { autorizado: false };
  }
}

function establecerSesion(email, valor) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.ADMINS);
    const datos = hoja.getDataRange().getValues();
    
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][2].toLowerCase().trim() === email.toLowerCase().trim()) {
        hoja.getRange(i + 1, 4).setValue(valor); // columna D = Sesion
        SpreadsheetApp.flush();
        return { success: true };
      }
    }
    return { success: false, message: 'Admin no encontrado' };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function verificarSesion(email) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.ADMINS);
    const datos = hoja.getDataRange().getValues();
    
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][2].toLowerCase().trim() === email.toLowerCase().trim()) {
        const sesion = datos[i][3]; // columna D
        return { success: true, activa: sesion == 1 };
      }
    }
    return { success: false, activa: false };
    
  } catch (error) {
    return { success: false, activa: false };
  }
}
function verificarAdminYSesion(email) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hoja = ss.getSheetByName(CONFIG.SHEETS.ADMINS);
    const datos = hoja.getDataRange().getValues();
    
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][2].toLowerCase().trim() === email.toLowerCase().trim()) {
        return { 
          autorizado: true, 
          activa: datos[i][3] == 1 
        };
      }
    }
    return { autorizado: false, activa: false };
    
  } catch (error) {
    return { autorizado: false, activa: false };
  }
}

function testFormSubmitCompleto() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const hoja = ss.getSheetByName(CONFIG.SHEETS.RESPUESTAS);
  const ultimaFila = hoja.getLastRow();
  const datos = hoja.getRange(ultimaFila, 1, 1, 10).getValues()[0];
  
  Logger.log('Fila: ' + ultimaFila);
  Logger.log('Col A timestamp: ' + datos[0]);
  Logger.log('Col B nombre: ' + datos[1]);
  Logger.log('Col C ID: ' + datos[2]);
  Logger.log('Col D correo: ' + datos[3]);
  Logger.log('Col E evento: ' + datos[4]);
  Logger.log('Col J asistencia: ' + datos[9]);
}
