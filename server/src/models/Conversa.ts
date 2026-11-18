import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const conversaSchema = new Schema(
  {
    aluno: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    personal: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    ultimaMensagem: {
      texto: { type: String, default: '' },
      remetente: { type: Schema.Types.ObjectId, ref: 'User' },
      criadaEm: { type: Date },
    },
    // Usado para ordenar por atividade mais recente
    ultimaAtividade: { type: Date, default: Date.now },

    naoLidasAluno: { type: Number, default: 0 },
    naoLidasPersonal: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: { createdAt: 'criadaEm', updatedAt: false } },
);

// Uma única conversa por par aluno/personal
conversaSchema.index({ aluno: 1, personal: 1 }, { unique: true });
conversaSchema.index({ aluno: 1, ultimaAtividade: -1 });
conversaSchema.index({ personal: 1, ultimaAtividade: -1 });

export type ConversaDocument = InferSchemaType<typeof conversaSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Conversa = mongoose.model<ConversaDocument>('Conversa', conversaSchema);
