import { BookingsRepository_2024_08_13 } from "@/ee/bookings/2024-08-13/bookings.repository";
import { Injectable } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { DateTime } from "luxon";
import { z } from "zod";

import { BookingOutput_2024_08_13, RecurringBookingOutput_2024_08_13 } from "@calcom/platform-types";
import { Booking } from "@calcom/prisma/client";

export const bookingResponsesSchema = z.object({
  email: z.string(),
  name: z.string(),
  guests: z.array(z.string()).optional(),
  rescheduledReason: z.string().optional(),
});

type DatabaseBooking = Booking & {
  attendees: {
    name: string;
    email: string;
    timeZone: string;
    locale: string | null;
    noShow: boolean | null;
  }[];
} & { user: { id: number; name: string | null; email: string } | null };

@Injectable()
export class OutputBookingsService_2024_08_13 {
  constructor(private readonly bookingsRepository: BookingsRepository_2024_08_13) {}

  getOutputBooking(databaseBooking: DatabaseBooking) {
    const dateStart = DateTime.fromISO(databaseBooking.startTime.toISOString());
    const dateEnd = DateTime.fromISO(databaseBooking.endTime.toISOString());
    const duration = dateEnd.diff(dateStart, "minutes").minutes;

    const bookingResponses = bookingResponsesSchema.parse(databaseBooking.responses);
    const attendee = databaseBooking.attendees.find((attendee) => attendee.email === bookingResponses.email);

    if (!attendee) {
      throw new Error("Attendee not found");
    }

    const booking = {
      id: databaseBooking.id,
      uid: databaseBooking.uid,
      hosts: [databaseBooking.user],
      status:
        databaseBooking.rescheduled && !databaseBooking.cancellationReason
          ? "rescheduled"
          : databaseBooking.status.toLowerCase(),
      cancellationReason: databaseBooking.cancellationReason || undefined,
      reschedulingReason: bookingResponses?.rescheduledReason,
      rescheduledFromUid: databaseBooking.fromReschedule || undefined,
      start: databaseBooking.startTime,
      end: databaseBooking.endTime,
      duration,
      eventTypeId: databaseBooking.eventTypeId,
      attendees: databaseBooking.attendees.map((attendee) => ({
        name: attendee.name,
        email: attendee.email,
        timeZone: attendee.timeZone,
        language: attendee.locale,
        absent: !!attendee.noShow,
      })),
      guests: bookingResponses.guests,
      meetingUrl: databaseBooking.location,
      absentHost: !!databaseBooking.noShowHost,
    };

    return plainToClass(BookingOutput_2024_08_13, booking, { strategy: "excludeAll" });
  }

  getOutputRescheduledBooking(rescheduledBooking: DatabaseBooking, newDatabaseBooking: DatabaseBooking) {
    const dateStart = DateTime.fromISO(rescheduledBooking.startTime.toISOString());
    const dateEnd = DateTime.fromISO(rescheduledBooking.endTime.toISOString());
    const duration = dateEnd.diff(dateStart, "minutes").minutes;

    const bookingResponses = bookingResponsesSchema.parse(rescheduledBooking.responses);
    const bookingResponsesNew = bookingResponsesSchema.parse(newDatabaseBooking.responses);
    const attendee = rescheduledBooking.attendees.find(
      (attendee) => attendee.email === bookingResponses.email
    );

    if (!attendee) {
      throw new Error("Attendee not found");
    }

    const booking = {
      id: rescheduledBooking.id,
      uid: rescheduledBooking.uid,
      hosts: [rescheduledBooking.user],
      status:
        rescheduledBooking.rescheduled && !rescheduledBooking.cancellationReason
          ? "rescheduled"
          : rescheduledBooking.status.toLowerCase(),
      cancellationReason: rescheduledBooking.cancellationReason || undefined,
      reschedulingReason: bookingResponsesNew?.rescheduledReason,
      rescheduledFromUid: rescheduledBooking.fromReschedule || undefined,
      rescheduledToUid: newDatabaseBooking.uid,
      recurringBookingUid: newDatabaseBooking.recurringEventId || undefined,
      start: rescheduledBooking.startTime,
      end: rescheduledBooking.endTime,
      duration,
      eventTypeId: rescheduledBooking.eventTypeId,
      attendees: rescheduledBooking.attendees.map((attendee) => ({
        name: attendee.name,
        email: attendee.email,
        timeZone: attendee.timeZone,
        language: attendee.locale,
        absent: !!attendee.noShow,
      })),
      guests: bookingResponses.guests,
      meetingUrl: rescheduledBooking.location,
      absentHost: !!rescheduledBooking.noShowHost,
    };

    return plainToClass(BookingOutput_2024_08_13, booking, { strategy: "excludeAll" });
  }

  async getOutputRecurringBookings(databaseBookings: DatabaseBooking[]) {
    const transformed = [];

    for (const booking of databaseBookings) {
      if (!booking.id) {
        throw new Error("Booking was not created");
      }

      const databaseBooking = await this.bookingsRepository.getByIdWithAttendeesAndUser(booking.id);
      if (!databaseBooking) {
        throw new Error(`Booking with id=${booking.id} was not found in the database`);
      }

      transformed.push(this.getOutputRecurringBooking(databaseBooking));
    }

    return transformed.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  getOutputRecurringBooking(databaseBooking: DatabaseBooking) {
    const dateStart = DateTime.fromISO(databaseBooking.startTime.toISOString());
    const dateEnd = DateTime.fromISO(databaseBooking.endTime.toISOString());
    const duration = dateEnd.diff(dateStart, "minutes").minutes;

    const bookingResponses = bookingResponsesSchema.parse(databaseBooking.responses);
    const attendee = databaseBooking.attendees.find((attendee) => attendee.email === bookingResponses.email);

    if (!attendee) {
      throw new Error("Attendee not found");
    }

    const booking = {
      id: databaseBooking.id,
      uid: databaseBooking.uid,
      hosts: [databaseBooking.user],
      status: databaseBooking.status.toLowerCase(),
      cancellationReason: databaseBooking.cancellationReason || undefined,
      start: databaseBooking.startTime,
      end: databaseBooking.endTime,
      duration,
      eventTypeId: databaseBooking.eventTypeId,
      attendees: databaseBooking.attendees.map((attendee) => ({
        name: attendee.name,
        email: attendee.email,
        timeZone: attendee.timeZone,
        language: attendee.locale,
        absent: !!attendee.noShow,
      })),
      guests: bookingResponses.guests,
      meetingUrl: databaseBooking.location,
      recurringBookingUid: databaseBooking.recurringEventId,
      absentHost: !!databaseBooking.noShowHost,
    };

    return plainToClass(RecurringBookingOutput_2024_08_13, booking, { strategy: "excludeAll" });
  }
}