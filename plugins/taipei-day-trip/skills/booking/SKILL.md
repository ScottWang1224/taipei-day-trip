---
name: taipei-day-trip-booking
description: Search Taipei attractions and create Taipei Day Trip bookings through the Taipei Day Trip MCP server.
---

# Taipei Day Trip Booking

Use this skill when the user wants to search for Taipei attractions or book a Taipei Day Trip itinerary.

## Workflow

1. Ask the user for a keyword to search Taipei attractions.

2. Call the `search_attractions` tool from the Taipei Day Trip MCP server using the keyword.

3. Show the returned attractions to the user.
   - Show at least:
     - attraction id
     - attraction name
   - Keep the list concise.

4. Ask the user to provide:
   - attraction id
   - booking date
   - booking time

5. Accept the booking information in natural language and normalize it before calling the booking tool.

## Input normalization

### Date

Convert natural-language dates into:

`YYYY-MM-DD`

Example:

`September 20, 2026`

becomes:

`2026-09-20`

### Time

Convert the user's requested time into one of:

- `morning`
- `afternoon`

Examples:

- 上午 → `morning`
- 早上 → `morning`
- morning → `morning`
- 下午 → `afternoon`
- afternoon → `afternoon`

### Price

Use:

- `2000` for `morning`
- `2500` for `afternoon`

6. Call `create_booking` with:

- `attraction_id`
- `date`
- `time`
- `price`

7. If booking succeeds, show the booking page URL returned by the tool and tell the user to open it to complete payment.

8. If the tool returns an error, explain that the booking could not be created and ask the user to verify the information.
