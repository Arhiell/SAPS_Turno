import type { 
  Request, 
  Response, 
  NextFunction 
} from "express";

import { 
  supabase 
} from "../config/supabase.js";

import { 
  getTurnoScope, 
  assertTurnoScope 
} from "../services/turno-access.service.js";

import { 
  findPatientById, 
  findPatientDetailsByDni 
} from "../repositories/patient-read.repository.js";

import { 
  AppError 
} from "../utils/app-error.js";

import { 
  agendaDateTime 
} from "../utils/turno-time.js";

export const patientScope = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const scope = await getTurnoScope(req.user!);

    res.locals.salitaScope = scope;
    
    if (req.body?.id_salita_asignada) assertTurnoScope(
      scope, 
      req.body.id_salita_asignada
    );
    
    if (scope !== null) {
      const patient = req.params.id ? await findPatientById(String(req.params.id))
        : req.params.dni ? await findPatientDetailsByDni(String(req.params.dni)) : null;
      
        if (patient) assertTurnoScope(scope, patient.id_salita_asignada);
      
        if (req.method === "POST" && !req.body?.id_salita_asignada) 
          throw new AppError("Indicá la salita asignada", 400);
    }
    next();
  } catch (error) { next(error); }
};

export const professionalScope = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const scope = await getTurnoScope(req.user!);
    
    res.locals.salitaScope = scope;
    
    if (scope === null) { next(); return; }
    
    if (req.body?.id_salita) assertTurnoScope(scope, req.body.id_salita);
    
    if (req.params.idSalita) assertTurnoScope(scope, String(req.params.idSalita));
    
    const today = agendaDateTime(new Date()).date;
    
    const { data, error } = await supabase.from("profesional_salita").select("id_profesional")
      .in("id_salita", scope).eq("activo", true).lte("fecha_desde", today)
      .or(`fecha_hasta.is.null,fecha_hasta.gte.${today}`);
    
      if (error) throw error;
    
      const ids = (data ?? []).map(row => String(row.id_profesional));
    
      res.locals.professionalScope = ids;
    
      const id = req.params.id ?? req.body?.id_profesional;
    
      if (id && !ids.includes(String(id))) throw new AppError("El profesional no pertenece a tus salitas", 403);
    
      if (scope.length === 0) throw new AppError("No tenés salitas asignadas", 403);
    
      next();

  } catch (error) { next(error); }
};

export const scheduleScope = (
  table: "horarios_atencion" | "bloqueos_agenda" | "disponibilidad"
) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scope = await getTurnoScope(req.user!);
      
      res.locals.salitaScope = scope;
      
      if (scope !== null) {
        const salita = req.body?.id_salita ?? req.query.id_salita;
        
        if (salita) assertTurnoScope(scope, String(salita));
        
        if (req.params.id && table !== "disponibilidad") {
        
          const key = table === "horarios_atencion" ? "id_horario" : "id_bloqueo";
        
          const { data, error } = await supabase.from(table).select("id_salita").eq(key, String(req.params.id)).maybeSingle();
        
          if (error) throw error;
        
          if (data) assertTurnoScope(scope, data.id_salita);
        }
      }

      next();
      
    } catch (error) { next(error); }
  };
