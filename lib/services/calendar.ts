/**
 * Mock Calendar Service for testing LLM Tool Calling.
 * In a production environment, this would integrate with Google Calendar API or Calendly.
 */

// Simulated available times
const AVAILABLE_SLOTS: Record<string, string[]> = {
    "Monday": ["10:00 AM", "2:00 PM"],
    "Tuesday": ["11:00 AM", "1:30 PM", "4:00 PM"],
    "Wednesday": ["9:00 AM", "3:00 PM"],
    "Thursday": ["10:30 AM", "1:00 PM"],
    "Friday": ["8:00 AM", "12:00 PM", "3:30 PM"]
};

export class CalendarService {
    /**
     * Checks available slots for a given day.
     * @param day Day of the week (e.g., "Monday", "Tuesday")
     * @returns Array of available times or empty array
     */
    static async getAvailableSlots(day: string): Promise<string[]> {
        console.log(`[CalendarService] Checking availability for ${day}...`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const normalizedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
        return AVAILABLE_SLOTS[normalizedDay] || ["1:00 PM", "3:00 PM"]; // Default fallback
    }

    /**
     * Books a meeting for the given prospect at the specified time.
     * @param name Prospect name
     * @param datetime Desired date and time
     * @returns Booking confirmation string
     */
    static async bookMeeting(name: string, datetime: string): Promise<string> {
        console.log(`[CalendarService] Booking meeting for ${name} at ${datetime}...`);
        await new Promise(resolve => setTimeout(resolve, 800));

        // In real life, we would save this to the DB and Calendar API
        console.log(`✅ [CalendarService] SUCCESS: Meeting booked for ${name} at ${datetime}.`);
        return `Successfully booked meeting for ${name} at ${datetime}. The calendar invite has been sent.`;
    }
}
