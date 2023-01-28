import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { Salt, parseSalt } from "../src/auth/password.service";
import { hash } from "bcrypt";
import { customSeed } from "./customSeed";
import { UserCreateInput } from "../src/user/base/UserCreateInput";

if (require.main === module) {
  dotenv.config();

  const { BCRYPT_SALT } = process.env;

  if (!BCRYPT_SALT) {
    throw new Error("BCRYPT_SALT environment variable must be defined");
  }


  const salt = parseSalt(BCRYPT_SALT);

  seed(salt).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

async function seed(bcryptSalt: Salt) {
  console.info("Seeding database...");

  const client = new PrismaClient();
  const data: UserCreateInput = {
    username: "admin",
    password: await hash("admin", bcryptSalt),
    roles: ["user"],
  };
  await client.user.upsert({
    where: { username: data.username },
    update: {},
    create: data,
  });

  const adminData = await genRoleUserFixture("admin", bcryptSalt);
  await client.user.upsert({
    where: { username: adminData.username },
    update: {},
    create: adminData,
  });

  const managerData = await genRoleUserFixture("manager", bcryptSalt);
  await client.user.upsert({
    where: { username: managerData.username },
    update: {},
    create: managerData,
  });

  const userData = await genRoleUserFixture("user", bcryptSalt);
  await client.user.upsert({
    where: { username: userData.username },
    update: {},
    create: userData,
  });


  void client.$disconnect();

  console.info("Seeding database with custom seed...");
  customSeed();

  console.info("Seeded database successfully");
}

async function genRoleUserFixture(role: string, bcryptSalt: Salt) {
  const data: UserCreateInput = {
    username: role,
    password: await hash(role, bcryptSalt),
    roles: [role],
  };
  return data
}
