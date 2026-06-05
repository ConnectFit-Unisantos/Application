import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    senhaHash: { type: String, required: true },

    // regra do projeto: começa como aluno; depois pode virar personal
    tipo: { type: String, required: true, enum: ['aluno', 'personal'], default: 'aluno' },
    criadoEm: { type: Date, default: Date.now },

    // Dados do personal (opcionais; preenchidos quando tipo='personal')
    formacao: { type: [String], default: [] },
    servicos: { type: [String], default: [] },
    especializacao: { type: [String], default: [] },

    // Por enquanto string (você vai evoluir depois para números/enum)
    precoHora: { type: String, default: '' },
    disponibilidade: { type: String, default: '' },
    bio: { type: String, default: '' },
    certificacoes: { type: [String], default: [] },

    // Localização (para personal)
    uf: { type: String, default: '' },
    cidade: { type: String, default: '' },

  },
  { versionKey: false }
);


export type UserDocument = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.model<UserDocument>('User', userSchema);

