import { z } from 'zod';

/** Datas da reserva como retornadas pela API (strings ISO/data). */
const bookingDatesSchema = z.object({
  checkin: z.string(),
  checkout: z.string(),
});

/**
 * Objeto de reserva no nível raiz — formato de GET /booking/{id} (200).
 * Alinhado ao contrato usado nos testes em booking.spec.ts.
 */
export const bookingRecordSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  totalprice: z.number(),
  depositpaid: z.boolean(),
  bookingdates: bookingDatesSchema,
  additionalneeds: z.string(),
});

export type BookingRecord = z.infer<typeof bookingRecordSchema>;
