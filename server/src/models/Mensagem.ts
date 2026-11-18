import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const MAX_MENSAGEM = 2000;

const mensagemSchema = new Schema(
  {
    conversa: { type: Schema.Types.ObjectId, ref: 'Conversa', required: true },
    remetente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    texto: { type: String, required: true, trim: true, maxlength: MAX_MENSAGEM },
  },
  { versionKey: false, timestamps: { createdAt: 'criadaEm', updatedAt: false } },
);

mensagemSchema.index({ conversa: 1, criadaEm: -1 });

export type MensagemDocument = InferSchemaType<typeof mensagemSchema> & {
  _id: mongoose.Types.ObjectId;
  criadaEm: Date;
};

export const Mensagem = mongoose.model<MensagemDocument>('Mensagem', mensagemSchema);
