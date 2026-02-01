/**
 * @OnlyCurrentDoc
 * 
 * Sistema de Automatización - Plataforma de Asistencia
 * DGAD - Universidad Nova Digital
 * 
 * ESTRUCTURA DE COLUMNAS:
 * A: Timestamp
 * B: Nombre
 * C: ID/Codigo
 * D: Correo
 * E: Tipo de Evento
 * F: Fecha
 * G: Hora
 * H: Grupo/Seccion
 * I: Observaciones
 * J: Asistencia (SE MARCA AUTOMATICAMENTE)
 * K: Fecha Formateada (PARA LOOKER STUDIO)
 */

// ============================================
// CONFIGURACIÓN
// ============================================
var CONFIG = {
  CORREO_COORDINADOR: "j9918j@gmail.com",
  HOJA_RESPUESTAS: "Respuestas de formulario",
  HOJA_EVENTOS: "Catálogo_Eventos"
};

// ============================================
// WEB APP - PUNTO DE ENTRADA
// ============================================
/**
 * Web App - Entrada principal
 * Se ejecuta cuando se abre el link o se escanea el QR
 */
function doGet(e) {
  try {
    // 1. Leer parámetro del evento
    var eventoId = e && e.parameter ? e.parameter.evento : null;

    // 2. Validar que venga el parámetro
    if (!eventoId) {
      return HtmlService.createHtmlOutput(
        "<!DOCTYPE html>" +
        "<html><head><meta charset='UTF-8'>" +
        "<style>body{font-family:Arial;text-align:center;padding:50px;}</style></head>" +
        "<body><h2>⚠️ Error</h2><p>No se especificó el evento.</p>" +
        "<p>Escanea el código QR correcto o contacta al coordinador.</p></body></html>"
      );
    }

    // 3. Buscar el evento en Google Sheets
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.HOJA_EVENTOS);
    
    if (!sheet) {
      return HtmlService.createHtmlOutput(
        "<!DOCTYPE html>" +
        "<html><head><meta charset='UTF-8'>" +
        "<style>body{font-family:Arial;text-align:center;padding:50px;}</style></head>" +
        "<body><h2>⚠️ Error de Configuración</h2>" +
        "<p>No se encontró la hoja '" + CONFIG.HOJA_EVENTOS + "'.</p>" +
        "<p>Contacta al administrador del sistema.</p></body></html>"
      );
    }
    
    var data = sheet.getDataRange().getValues();
    var eventoExiste = false;
    var nombreEvento = "";

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == eventoId) { // Columna A = ID_Evento
        eventoExiste = true;
        nombreEvento = data[i][1] || eventoId; // Columna B = Nombre del evento
        break;
      }
    }

    // 4. Si no existe el evento
    if (!eventoExiste) {
      return HtmlService.createHtmlOutput(
        "<!DOCTYPE html>" +
        "<html><head><meta charset='UTF-8'>" +
        "<style>body{font-family:Arial;text-align:center;padding:50px;}</style></head>" +
        "<body><h2>❌ Evento no válido</h2>" +
        "<p>El código <b>" + eventoId + "</b> no está registrado.</p>" +
        "<p>Verifica el código QR o contacta al coordinador.</p></body></html>"
      );
    }

    // 5. Si existe → mostrar confirmación
    return HtmlService.createHtmlOutput(
      "<!DOCTYPE html>" +
      "<html><head><meta charset='UTF-8'>" +
      "<style>" +
      "body{font-family:Arial;text-align:center;padding:50px;background:#f0f8ff;}" +
      "h2{color:#28a745;}" +
      ".event-box{background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);max-width:500px;margin:0 auto;}" +
      "</style></head>" +
      "<body><div class='event-box'><h2>✅ Evento Válido</h2>" +
      "<p><strong>Evento:</strong> " + nombreEvento + "</p>" +
      "<p><strong>Código:</strong> " + eventoId + "</p>" +
      "<hr><p>El sistema está listo para registrar asistencia.</p>" +
      "<p>Completa el formulario de Google Forms para confirmar tu asistencia.</p>" +
      "</div></body></html>"
    ).setTitle("Sistema de Asistencia - DGAD");

  } catch (error) {
    Logger.log("Error en doGet: " + error.toString());
    return HtmlService.createHtmlOutput(
      "<!DOCTYPE html>" +
      "<html><head><meta charset='UTF-8'>" +
      "<style>body{font-family:Arial;text-align:center;padding:50px;}</style></head>" +
      "<body><h2>❌ Error del sistema</h2>" +
      "<p>" + error.toString() + "</p>" +
      "<p>Contacta al administrador.</p></body></html>"
    );
  }
}

// ============================================
// TRIGGER: AL ENVIAR FORMULARIO
// ============================================
/**
 * Se ejecuta automáticamente cuando se envía el formulario
 * Configurar trigger: onFormSubmit → From spreadsheet → On form submit
 */
function onFormSubmit(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA_RESPUESTAS);
    var lastRow = sheet.getLastRow();
    
    // 1. MARCAR ASISTENCIA AUTOMÁTICAMENTE (Columna J)
    sheet.getRange(lastRow, 11).setValue("Presente");
    
    // 2. FORMATEAR FECHA PARA LOOKER STUDIO (Columna K)
    var fechaOriginal = sheet.getRange(lastRow, 6).getValue();
    if (fechaOriginal) {
      var fechaFormateada = Utilities.formatDate(
        new Date(fechaOriginal),
        Session.getScriptTimeZone(),
        "dd/MM/yyyy"
      );
      sheet.getRange(lastRow, 12).setValue(fechaFormateada);
    }
    
    // 3. OBTENER DATOS DEL REGISTRO
    var data = sheet.getRange(lastRow, 1, 1, 11).getValues()[0];
    
    var timestamp = data[0];
    var nombre = data[1];
    var codigoID = data[2];
    var correo = data[3];
    var tipoEvento = data[4];
    var fecha = data[5];
    var hora = data[9];
    var grupo = data[7];
    var observaciones = data[8];
    
    // Validar que exista correo
    if (!correo || correo === "") {
      Logger.log("No se encontró correo en la fila " + lastRow);
      return;
    }
    
    // 4. ENVIAR CORREO DE CONFIRMACIÓN
    var fechaTexto = fechaOriginal ? Utilities.formatDate(new Date(fechaOriginal), Session.getScriptTimeZone(), "dd/MM/yyyy") : "No especificada";
    
    var asunto = "✅ Confirmación de Asistencia - " + tipoEvento;
    var mensaje = "Hola " + nombre + ",\n\n" +
                  "Tu asistencia ha sido registrada exitosamente.\n\n" +
                  "DETALLES:\n" +
                  "====================\n" +
                  "Evento: " + tipoEvento + "\n" +
                  "Código: " + codigoID + "\n" +
                  "Fecha: " + fechaTexto + "\n" +
                  "Hora: " + (hora || "No especificada") + "\n";
    
    if (grupo && grupo !== "") {
      mensaje += "Grupo: " + grupo + "\n";
    }
    
    mensaje += "Asistencia: Presente\n" +
               "====================\n\n";
    
    if (observaciones && observaciones !== "") {
      mensaje += "Observaciones: " + observaciones + "\n\n";
    }
    
    mensaje += "Gracias por participar.\n\n" +
               "Saludos,\n" +
               "Dirección de Gestión Académica Digital (DGAD)\n" +
               "Universidad Nova Digital";
    
    GmailApp.sendEmail(correo, asunto, mensaje);
    Logger.log("Correo enviado exitosamente a: " + correo);
    
  } catch (error) {
    Logger.log("Error en onFormSubmit: " + error.toString());
    enviarAlertaError(error.toString(), lastRow);
  }
}

// ============================================
// VALIDACIÓN DE DUPLICADOS
// ============================================
/**
 * Validar duplicados manualmente
 * Ejecutar desde: Menú → Seleccionar función → Ejecutar
 */
function validarDuplicados() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA_RESPUESTAS);
  var datos = sheet.getDataRange().getValues();
  
  if (datos.length <= 1) {
    Logger.log("No hay datos suficientes para validar duplicados");
    Browser.msgBox("Sin datos", "No hay suficientes registros para validar duplicados.", Browser.Buttons.OK);
    return [];
  }
  
  var registros = {};
  var duplicados = [];
  
  // Empezar desde fila 2 (índice 1) para saltar encabezados
  for (var i = 1; i < datos.length; i++) {
    var codigoID = datos[i][2];
    var tipoEvento = datos[i][4];
    var fecha = datos[i][5];
    
    // Validar que los datos existen
    if (!codigoID || !tipoEvento || !fecha) {
      continue;
    }
    
    var clave = codigoID + "_" + tipoEvento + "_" + fecha;
    
    if (registros[clave]) {
      duplicados.push({
        fila: i + 1,
        nombre: datos[i][1] || "Sin nombre",
        codigo: codigoID,
        evento: tipoEvento,
        fecha: fecha
      });
    } else {
      registros[clave] = true;
    }
  }
  
  if (duplicados.length > 0) {
    Logger.log("Se encontraron " + duplicados.length + " duplicados");
    enviarAlertaDuplicados(duplicados);
    Browser.msgBox("Duplicados detectados", 
                   "Se encontraron " + duplicados.length + " registros duplicados.\n" +
                   "Se ha enviado un correo al coordinador.", 
                   Browser.Buttons.OK);
  } else {
    Logger.log("No hay duplicados");
    Browser.msgBox("✅ Sin duplicados", "No se encontraron registros duplicados.", Browser.Buttons.OK);
  }
  
  return duplicados;
}

// ============================================
// REPORTES AUTOMÁTICOS
// ============================================
/**
 * Reporte semanal
 * Configurar trigger: generarReporteSemanal → Time-driven → Week timer → Every Monday
 */
function generarReporteSemanal() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA_RESPUESTAS);
  var datos = sheet.getDataRange().getValues();
  
  if (datos.length <= 1) {
    Logger.log("No hay datos para generar reporte semanal");
    return;
  }
  
  var fechaHoy = new Date();
  var hace7Dias = new Date(fechaHoy.getTime() - (7 * 24 * 60 * 60 * 1000));
  
  var contadorTotal = 0;
  var eventos = {};
  var participantes = new Set();
  var grupos = {};
  
  for (var i = 1; i < datos.length; i++) {
    var fechaRegistro = new Date(datos[i][0]);
    
    if (fechaRegistro >= hace7Dias) {
      contadorTotal++;
      
      var tipoEvento = datos[i][4];
      var codigoID = datos[i][2];
      var grupo = datos[i][7];
      
      if (tipoEvento) {
        eventos[tipoEvento] = (eventos[tipoEvento] || 0) + 1;
      }
      
      if (codigoID) {
        participantes.add(codigoID);
      }
      
      if (grupo && grupo !== "") {
        grupos[grupo] = (grupos[grupo] || 0) + 1;
      }
    }
  }
  
  var reporte = "📊 REPORTE SEMANAL DE ASISTENCIAS\n";
  reporte += "Periodo: " + Utilities.formatDate(hace7Dias, Session.getScriptTimeZone(), "dd/MM/yyyy") + 
             " - " + Utilities.formatDate(fechaHoy, Session.getScriptTimeZone(), "dd/MM/yyyy") + "\n";
  reporte += "=======================================\n\n";
  reporte += "RESUMEN GENERAL:\n";
  reporte += "  Total de registros: " + contadorTotal + "\n";
  reporte += "  Participantes únicos: " + participantes.size + "\n\n";
  
  if (Object.keys(eventos).length > 0) {
    reporte += "ASISTENCIAS POR EVENTO:\n";
    for (var ev in eventos) {
      reporte += "  • " + ev + ": " + eventos[ev] + " registros\n";
    }
    reporte += "\n";
  }
  
  if (Object.keys(grupos).length > 0) {
    reporte += "ASISTENCIAS POR GRUPO:\n";
    for (var gr in grupos) {
      reporte += "  • " + gr + ": " + grupos[gr] + " registros\n";
    }
    reporte += "\n";
  }
  
  reporte += "=======================================\n";
  reporte += "Reporte automático generado por el sistema.\n";
  reporte += "Para más detalles, revisa el Dashboard.\n\n";
  reporte += "Dirección de Gestión Académica Digital (DGAD)";
  
  try {
    GmailApp.sendEmail(CONFIG.CORREO_COORDINADOR, "📊 Reporte Semanal - Asistencias", reporte);
    Logger.log("Reporte semanal enviado a: " + CONFIG.CORREO_COORDINADOR);
  } catch (error) {
    Logger.log("Error al enviar reporte semanal: " + error.toString());
  }
}

/**
 * Reporte mensual
 * Configurar trigger: generarReporteMensual → Time-driven → Month timer → Day 1
 */
function generarReporteMensual() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.HOJA_RESPUESTAS);
  var datos = sheet.getDataRange().getValues();
  
  if (datos.length <= 1) {
    Logger.log("No hay datos para generar reporte mensual");
    return;
  }
  
  var fechaHoy = new Date();
  var hace30Dias = new Date(fechaHoy.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  var contadorTotal = 0;
  var eventos = {};
  var participantes = new Set();
  var grupos = {};
  
  for (var i = 1; i < datos.length; i++) {
    var fechaRegistro = new Date(datos[i][0]);
    
    if (fechaRegistro >= hace30Dias) {
      contadorTotal++;
      
      var tipoEvento = datos[i][4];
      var codigoID = datos[i][2];
      var grupo = datos[i][7];
      
      if (tipoEvento) {
        eventos[tipoEvento] = (eventos[tipoEvento] || 0) + 1;
      }
      
      if (codigoID) {
        participantes.add(codigoID);
      }
      
      if (grupo && grupo !== "") {
        grupos[grupo] = (grupos[grupo] || 0) + 1;
      }
    }
  }
  
  var reporte = "📈 REPORTE MENSUAL DE ASISTENCIAS\n";
  reporte += "Periodo: " + Utilities.formatDate(hace30Dias, Session.getScriptTimeZone(), "dd/MM/yyyy") + 
             " - " + Utilities.formatDate(fechaHoy, Session.getScriptTimeZone(), "dd/MM/yyyy") + "\n";
  reporte += "=======================================\n\n";
  reporte += "RESUMEN GENERAL:\n";
  reporte += "  Total de registros: " + contadorTotal + "\n";
  reporte += "  Participantes únicos: " + participantes.size + "\n\n";
  
  if (Object.keys(eventos).length > 0) {
    reporte += "ASISTENCIAS POR EVENTO:\n";
    for (var ev in eventos) {
      reporte += "  • " + ev + ": " + eventos[ev] + " registros\n";
    }
    reporte += "\n";
  }
  
  if (Object.keys(grupos).length > 0) {
    reporte += "ASISTENCIAS POR GRUPO:\n";
    for (var gr in grupos) {
      reporte += "  • " + gr + ": " + grupos[gr] + " registros\n";
    }
    reporte += "\n";
  }
  
  reporte += "=======================================\n";
  reporte += "Reporte automático generado por el sistema.\n\n";
  reporte += "Dirección de Gestión Académica Digital (DGAD)";
  
  try {
    GmailApp.sendEmail(CONFIG.CORREO_COORDINADOR, "📈 Reporte Mensual - Asistencias", reporte);
    Logger.log("Reporte mensual enviado a: " + CONFIG.CORREO_COORDINADOR);
  } catch (error) {
    Logger.log("Error al enviar reporte mensual: " + error.toString());
  }
}

// ============================================
// SISTEMA DE ALERTAS
// ============================================
function enviarAlertaError(errorMsg, fila) {
  var asunto = "🚨 Error en Sistema de Asistencia";
  var mensaje = "Se detectó un error en el sistema:\n\n" +
                "Fila afectada: " + (fila || "Desconocida") + "\n" +
                "Error: " + errorMsg + "\n\n" +
                "Revisa el sistema lo antes posible.\n\n" +
                "DGAD - Sistema Automático";
  
  try {
    GmailApp.sendEmail(CONFIG.CORREO_COORDINADOR, asunto, mensaje);
    Logger.log("Alerta de error enviada");
  } catch (e) {
    Logger.log("No se pudo enviar alerta de error: " + e.toString());
  }
}

function enviarAlertaDuplicados(duplicados) {
  if (!duplicados || !Array.isArray(duplicados) || duplicados.length === 0) {
    Logger.log("No hay duplicados para reportar");
    return;
  }
  
  var asunto = "⚠️ Registros Duplicados Detectados - " + duplicados.length + " casos";
  var mensaje = "Se detectaron " + duplicados.length + " posibles registros duplicados:\n\n";
  
  duplicados.forEach(function(dup) {
    mensaje += "📋 Fila " + dup.fila + ": " + dup.nombre + " (" + dup.codigo + ")\n" +
               "   Evento: " + dup.evento + " | Fecha: " + dup.fecha + "\n\n";
  });
  
  mensaje += "Revisa estos registros en el sistema.\n\n" +
             "Dirección de Gestión Académica Digital (DGAD)";
  
  try {
    GmailApp.sendEmail(CONFIG.CORREO_COORDINADOR, asunto, mensaje);
    Logger.log("Alerta de duplicados enviada exitosamente");
  } catch (e) {
    Logger.log("No se pudo enviar alerta de duplicados: " + e.toString());
  }
}

// ============================================
// FUNCIÓN DE PRUEBA
// ============================================
/**
 * Prueba del sistema de correos
 * Ejecutar manualmente para verificar funcionamiento
 */
function probarEnvioCorreo() {
  var asunto = "✅ Prueba de Sistema de Confirmación";
  var mensaje = "Si recibes este correo, el sistema de automatización está funcionando correctamente.\n\n" +
                "FUNCIONALIDADES IMPLEMENTADAS:\n" +
                "=======================================\n" +
                "✓ Registro de participantes\n" +
                "✓ Administración de eventos/sesiones\n" +
                "✓ Marcaje automático de asistencia\n" +
                "✓ Generación de reportes\n" +
                "✓ Validación de duplicados\n" +
                "✓ Sistema de alertas\n\n" +
                "El sistema procesa automáticamente:\n" +
                "• Confirmaciones por correo\n" +
                "• Registro de asistencia como 'Presente'\n" +
                "• Formato de fechas para reportes\n" +
                "• Alertas de duplicados\n\n" +
                "Dirección de Gestión Académica Digital (DGAD)\n" +
                "Plataforma de Registro y Asistencia Cloud";
  
  try {
    GmailApp.sendEmail(CONFIG.CORREO_COORDINADOR, asunto, mensaje);
    Logger.log("Correo de prueba enviado exitosamente");
    Browser.msgBox("✅ Correo enviado", 
                   "Se envió un correo de prueba a " + CONFIG.CORREO_COORDINADOR + 
                   "\n\nRevisa tu bandeja de entrada.", 
                   Browser.Buttons.OK);
  } catch (error) {
    Logger.log("Error al enviar correo de prueba: " + error.toString());
    Browser.msgBox("❌ Error", 
                   "No se pudo enviar el correo:\n" + error.toString(), 
                   Browser.Buttons.OK);
  }
}
