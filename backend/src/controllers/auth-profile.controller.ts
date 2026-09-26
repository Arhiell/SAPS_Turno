import type { 
  Request, 
  Response, 
  NextFunction 
} from "express";

import { 
  getOwnProfile, 
  completeOwnProfile 
} from "../services/auth-profile.service.js";

export const ownProfile = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try { 
    res.json(
      { 
        success: true,
        data: await getOwnProfile(req.user!) 
      }); 
    } 
    catch (error) { next(error); 

    }
};

export const completeProfile = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try { 
    res.status(201).json(
      { 
        success: true, 
        data: await completeOwnProfile(
          req.body, 
          req.user!
        ) 
      }
    ); 
  }
  catch (error) { next(error); }
};
