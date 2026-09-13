import {
    countRoles,
    countUsers,
} from "../repositories/user.repository.js";

//Comprobamos que las tablas necesarias para el módulo de usuarios sean accesibles

export const checkUserModuleConnection = async () => {
    const [usersCount, rolesCount] = await Promise.all([
        countUsers(),
        countRoles(),
    ]);

    return {
        database: "Supeabase PostgresSQL",
        usersTable: true,
        rolesTable: true,
        usersCount,
        rolesCount,
    }
}