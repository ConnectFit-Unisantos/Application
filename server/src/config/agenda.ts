/**
 * Regras de negócio do agendamento.
 * Datas/horários das aulas são sempre no fuso do app (Brasília, UTC-3 por padrão).
 */

/** Diferença do fuso do app em relação ao UTC, em minutos (Brasília = -180). */
export const TZ_OFFSET_MIN = Number(process.env.APP_TZ_OFFSET_MIN ?? '-180');

/** Duração de cada aula. */
export const DURACAO_AULA_MIN = 60;

/** Antecedência mínima para solicitar um horário. */
export const ANTECEDENCIA_MIN_MINUTOS = 30;

/** Até quantos dias à frente o aluno pode agendar. */
export const MAX_DIAS_ANTECEDENCIA = 60;

/** Aluno pode cancelar aula CONFIRMADA até X horas antes do início. */
export const CANCELAMENTO_MIN_HORAS = 2;

/** Horários usados quando o personal ainda não configurou a agenda. */
export const HORARIOS_PADRAO = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

/** Horários que o personal pode escolher na tela de disponibilidade. */
export const HORARIOS_POSSIVEIS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];
