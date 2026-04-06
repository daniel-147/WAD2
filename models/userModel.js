
// models/userModel.js
import "../loadEnv.js";
import { usersDb } from "./_db.js";
import bcrypt from "bcrypt";

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

export const UserModel = {
  async create(user) {
    const doc = { ...user };
    
        // If a plaintext password is provided, hash it and store as "password" (hashed)
        if (typeof doc.password === "string" && doc.password.length > 0) {
          doc.password = await bcrypt.hash(doc.password, saltRounds);
        }
    return usersDb.insert(doc);
  },
  async findByEmail(email) {
    return usersDb.findOne({ email });
  },
  async findById(id) {
    return usersDb.findOne({ _id: id });

    
  },
  async listAll() {
    return usersDb.find({}).sort({ email: 1 });
  },

  async deleteById(id) {
    await usersDb.remove({ _id: id }, {});
  }
};
