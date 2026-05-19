import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    senhaHash: { type: String, required: true },
    // regra do projeto: começa como aluno; depois pode virar personal
    tipo: { type: String, required: true, enum: ['aluno', 'personal'], default: 'aluno' },
    criadoEm: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.model<UserDocument>('User', userSchema);

