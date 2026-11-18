import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const STATUS_AULA = ['pendente', 'confirmada', 'concluida', 'cancelada', 'recusada'] as const;
export type StatusAula = (typeof STATUS_AULA)[number];

const aulaSchema = new Schema(
  {
    aluno: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    personal: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Data/horário no fuso do app (ex: "2026-11-20" / "18:00")
    data: { type: String, required: true },
    horario: { type: String, required: true },
    // Instantes reais (UTC) — usados para regras de passado/cancelamento
    inicio: { type: Date, required: true },
    fim: { type: Date, required: true },
    duracaoMin: { type: Number, default: 60 },

    status: { type: String, enum: STATUS_AULA, default: 'pendente', required: true },

    /**
     * true enquanto a aula "segura" o horário (pendente/confirmada/concluída).
     * Os índices únicos parciais abaixo usam este campo para impedir
     * dois agendamentos ativos no mesmo horário.
     */
    ocupaHorario: { type: Boolean, default: true },

    preco: { type: Number, default: 0 },
    observacao: { type: String, default: '', maxlength: 500 },

    motivoCancelamento: { type: String, default: '' },
    canceladoPor: { type: String, enum: ['aluno', 'personal', 'sistema', ''], default: '' },
    respondidoEm: { type: Date },
    canceladoEm: { type: Date },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
  },
);

// Um personal não pode ter duas aulas ativas no mesmo horário
aulaSchema.index(
  { personal: 1, data: 1, horario: 1 },
  { unique: true, partialFilterExpression: { ocupaHorario: true } },
);
// Um aluno não pode ter duas aulas ativas no mesmo horário
aulaSchema.index(
  { aluno: 1, data: 1, horario: 1 },
  { unique: true, partialFilterExpression: { ocupaHorario: true } },
);
aulaSchema.index({ personal: 1, inicio: 1 });
aulaSchema.index({ aluno: 1, inicio: 1 });

export type AulaDocument = InferSchemaType<typeof aulaSchema> & { _id: mongoose.Types.ObjectId };

export const Aula = mongoose.model<AulaDocument>('Aula', aulaSchema);
