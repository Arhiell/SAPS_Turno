import {
  createPerson,
} from '../repositories/person.repository.js';

import {
  findPersonByDni,
  findPersonById,
  findPersonsByEmail,
} from '../repositories/person-read.repository.js';

import {
  updatePerson,
} from '../repositories/person-update.repository.js';

import {
  syncAccountEmailForPerson,
} from '../repositories/account.repository.js';

import {
  findUserByEmail,
} from '../repositories/user.repository.js';

import {
  createEmailCode,
} from './email-verification.service.js';

import {
  AppError,
} from '../utils/app-error.js';

import {
  duplicateError,
  duplicateMessages,
} from '../utils/duplicate-error.js';

import {
  hasDatabaseCode,
} from '../utils/profile-error.js';

import {
  createPersonSchema,
  updatePersonSchema,
  type CreatePersonInput,
  type UpdatePersonInput,
} from '../validators/person.validator.js';

// Expone la búsqueda por DNI para otros servicios.
export {
  findPersonByDni,
};

// Verifica que el correo no pertenezca a otra persona ni a otra cuenta de usuario.
const ensurePersonEmailAvailable = async (
  email: string | null | undefined,
  idPerson?: string
) => {
  if (!email) {
    return;
  }

  const normalized = email.trim().toLowerCase();

  const [persons, existingUser] = await Promise.all([
    findPersonsByEmail(normalized),
    findUserByEmail(normalized),
  ]);

  if (
    persons.some(
      (person) =>
        person.id_persona !==
        idPerson
    )
  ) {
    throw new AppError(
      duplicateMessages.email,
      409
    );
  }

  if (
    existingUser &&
    existingUser.id_persona !== idPerson
  ) {
    throw new AppError(
      duplicateMessages.email,
      409
    );
  }
};

// Busca una persona por DNI o la crea si no existe.
export const findOrCreatePerson = async (
  input: CreatePersonInput
) => {
  const validated =
    createPersonSchema.parse(
      input
    );

  const existing =
    await findPersonByDni(
      validated.dni
    );

  if (existing) {
    return existing;
  }

  // Verifica que el correo esté disponible.
  await ensurePersonEmailAvailable(
    validated.email
  );

  try {
    return await createPerson(
      validated
    );
  } catch (error) {
    // Otra solicitud pudo crear el mismo DNI después de la consulta.
    if (
      hasDatabaseCode(
        error,
        '23505'
      )
    ) {
      const concurrent =
        await findPersonByDni(
          validated.dni
        );

      if (concurrent) {
        return concurrent;
      }
    }

    throw (
      duplicateError(error) ??
      error
    );
  }
};

// Valida que el DNI y el correo estén disponibles al editar.
export const validatePersonUpdate = async (
  idPerson: string,
  input: UpdatePersonInput
) => {
  if (
    input.dni !== undefined
  ) {
    const existing =
      await findPersonByDni(
        input.dni
      );

    if (
      existing &&
      existing.id_persona !==
        idPerson
    ) {
      throw new AppError(
        duplicateMessages.dni,
        409
      );
    }
  }

  await ensurePersonEmailAvailable(
    input.email,
    idPerson
  );
};

// Valida y actualiza los datos de una persona.
export const editPerson = async (
  idPerson: string,
  input: UpdatePersonInput
) => {
  const validated =
    updatePersonSchema.parse(
      input
    );

  const current =
    await findPersonById(
      idPerson
    );

  if (!current) {
    throw new AppError(
      'Persona no encontrada',
      404
    );
  }

  // Comprueba posibles duplicados antes de actualizar.
  await validatePersonUpdate(
    idPerson,
    validated
  );

  // Evita ejecutar una actualización sin cambios.
  if (
    !Object.values(
      validated
    ).some(
      (value) =>
        value !== undefined
    )
  ) {
    return current;
  }

  const previousEmail = current.email
    ? current.email.trim().toLowerCase()
    : null;
  const nextEmail =
    typeof validated.email === 'string' && validated.email.trim()
      ? validated.email.trim().toLowerCase()
      : null;

  if (validated.email !== undefined) {
    validated.email = nextEmail;
  }

  try {
    const updated = await updatePerson(
      idPerson,
      validated
    );

    if (
      validated.email !== undefined &&
      nextEmail &&
      nextEmail !== previousEmail
    ) {
      const syncedAccount = await syncAccountEmailForPerson(
        idPerson,
        previousEmail,
        nextEmail
      );

      if (syncedAccount) {
        await createEmailCode(
          syncedAccount.id_usuario,
          nextEmail,
          null
        ).catch((err) => {
          console.error(
            `[person.service] No se pudo enviar el código de verificación al nuevo correo ${nextEmail}:`,
            err
          );
        });
      }
    }

    return updated;
  } catch (error) {
    throw (
      duplicateError(error) ??
      error
    );
  }
};